import crypto from "node:crypto";

function phpUrlencode(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");
}

function buildApiSignature(params) {
  const str = Object.keys(params)
    .sort()
    .filter((k) => params[k] != null && String(params[k]) !== "")
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("md5").update(str).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Verify auth JWT
  const jwtToken = (req.headers["authorization"] || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!jwtToken) return res.status(401).json({ error: "Unauthorized" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  // Validate the JWT and get the user record
  const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${jwtToken}` },
  });
  if (!authRes.ok) return res.status(401).json({ error: "Unauthorized" });

  const user = await authRes.json();
  const email = user?.email?.toLowerCase?.()?.trim();
  if (!email) return res.status(401).json({ error: "Unauthorized" });

  const { amount, item_name, order_id, token_id } = req.body || {};
  if (!amount || !item_name || !order_id) {
    return res
      .status(400)
      .json({ error: "Missing required fields: amount, item_name, order_id" });
  }

  // Look up the saved token — by explicit token_id (admin selecting a card) or by the authenticated user's email
  const tokenQuery = token_id
    ? `${supabaseUrl}/rest/v1/customer_payment_tokens?id=eq.${encodeURIComponent(token_id)}&select=payfast_token,id&limit=1`
    : `${supabaseUrl}/rest/v1/customer_payment_tokens?email=eq.${encodeURIComponent(email)}&is_default=eq.true&select=payfast_token,id&limit=1`;
  const tokenRes = await fetch(tokenQuery, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const tokens = await tokenRes.json();
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return res.status(404).json({ error: "NO_SAVED_CARD" });
  }

  const { payfast_token: payfastToken } = tokens[0];
  const amountCents = Math.round(Number(amount) * 100);
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";
  const timestamp = new Date().toISOString().split(".")[0];

  // PayFast API signature: MD5 of header params (sorted) including passphrase
  const signature = buildApiSignature({
    "merchant-id": merchantId,
    passphrase,
    timestamp,
    version: "v1",
  });

  const isSandbox = /^100\d+$/u.test(String(merchantId || "").trim());
  const adhocUrl = `https://api.payfast.co.za/subscriptions/${payfastToken}/adhoc${
    isSandbox ? "?testing=true" : ""
  }`;

  let pfResult = null;
  let chargeStatus = "failed";

  try {
    const pfRes = await fetch(adhocUrl, {
      method: "POST",
      headers: {
        "merchant-id": merchantId,
        passphrase,
        timestamp,
        version: "v1",
        signature,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: amountCents, item_name }),
    });

    const pfText = await pfRes.text().catch(() => "");
    try { pfResult = JSON.parse(pfText); } catch { pfResult = { raw: pfText }; }
    chargeStatus = pfRes.ok ? "success" : "failed";
    console.log("[CHARGE] PayFast status:", pfRes.status, "| url:", adhocUrl);
    console.log("[CHARGE] PayFast response:", JSON.stringify(pfResult));
    console.log("[CHARGE] headers sent:", JSON.stringify({ "merchant-id": merchantId, timestamp, version: "v1", signature }));
  } catch (err) {
    console.error("[CHARGE] PayFast API error:", err);
  }

  // Log charge attempt to payment_charges table
  await fetch(`${supabaseUrl}/rest/v1/payment_charges`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: user.id,
      payfast_token: payfastToken,
      order_id,
      amount_cents: amountCents,
      status: chargeStatus,
      payfast_response: pfResult,
    }),
  }).catch((err) => console.error("[CHARGE] Failed to log charge:", err));

  if (chargeStatus !== "success") {
    return res.status(400).json({ error: "CHARGE_FAILED", detail: pfResult });
  }

  // Mark the order as paid in Supabase
  await fetch(
    `${supabaseUrl}/rest/v1/Orders?order_id=eq.${encodeURIComponent(order_id)}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ status: "paid" }),
    }
  ).catch((err) => console.error("[CHARGE] Failed to update order:", err));

  return res.status(200).json({ success: true });
}
