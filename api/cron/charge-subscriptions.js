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
    .map((k) => `${phpUrlencode(k)}=${phpUrlencode(String(params[k]))}`)
    .join("&");
  return crypto.createHash("md5").update(str).digest("hex");
}

function getNextMonthDate(dateStr) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

export default async function handler(req, res) {
  // Vercel signs cron requests — reject anything without the secret
  if (
    req.headers["authorization"] !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const passphrase = process.env.PAYFAST_PASSPHRASE || "";
  const isSandbox = /^100\d+$/u.test(String(merchantId || "").trim());

  const today = new Date().toISOString().split("T")[0];

  // Fetch all active subscriptions due today
  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/subscriptions?next_billing_date=eq.${today}&status=eq.active&select=*`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );

  if (!subRes.ok) {
    const err = await subRes.text();
    console.error("[CRON] Failed to fetch subscriptions:", err);
    return res.status(500).json({ error: "Failed to fetch subscriptions" });
  }

  const subscriptions = await subRes.json();
  if (!subscriptions.length) {
    return res.status(200).json({ charged: 0, failed: 0 });
  }

  let charged = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    // Look up the customer's saved token
    const tokenRes = await fetch(
      `${supabaseUrl}/rest/v1/customer_payment_tokens?user_id=eq.${sub.user_id}&is_default=eq.true&select=payfast_token&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const tokens = await tokenRes.json();

    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.warn("[CRON] No token for user:", sub.user_id);
      await fetch(
        `${supabaseUrl}/rest/v1/subscriptions?id=eq.${sub.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ status: "payment_failed" }),
        }
      ).catch(() => {});
      failed++;
      continue;
    }

    const { payfast_token: payfastToken } = tokens[0];
    const timestamp = new Date().toISOString().split(".")[0];
    const signature = buildApiSignature({
      "merchant-id": merchantId,
      passphrase,
      timestamp,
      version: "v1",
    });

    const adhocUrl = `https://api.payfast.co.za/subscriptions/${payfastToken}/adhoc${
      isSandbox ? "?testing=true" : ""
    }`;

    let chargeOk = false;
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
        body: JSON.stringify({
          amount: sub.amount_cents,
          item_name: sub.plan_name,
        }),
      });
      chargeOk = pfRes.ok;
    } catch (err) {
      console.error("[CRON] Charge error for sub:", sub.id, err);
    }

    if (chargeOk) {
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${sub.id}`, {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          next_billing_date: getNextMonthDate(sub.next_billing_date),
          last_charged_at: new Date().toISOString(),
        }),
      }).catch(() => {});
      charged++;
    } else {
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${sub.id}`, {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ status: "payment_failed" }),
      }).catch(() => {});
      failed++;
    }
  }

  console.log(`[CRON] Done — charged: ${charged}, failed: ${failed}`);
  return res.status(200).json({ charged, failed });
}
