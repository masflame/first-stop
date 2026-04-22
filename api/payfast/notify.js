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

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  if (typeof body === "string") {
    const params = new URLSearchParams(body);
    return Object.fromEntries(params.entries());
  }
  return {};
}

function buildSignatureString(body, passphrase = "") {
  const pairs = Object.entries(body)
    .filter(
      ([key, val]) =>
        key !== "signature" &&
        val !== undefined &&
        val !== null &&
        String(val).trim() !== ""
    )
    .map(([key, val]) => `${phpUrlencode(key)}=${phpUrlencode(String(val).trim())}`)
    .join("&");

  return passphrase
    ? `${pairs}&passphrase=${phpUrlencode(passphrase.trim())}`
    : pairs;
}

function md5hex(input) {
  return crypto.createHash("md5").update(input).digest("hex");
}

function resolveStatus(payfastStatus) {
  switch (payfastStatus) {
    case "COMPLETE":
      return "paid";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    default:
      return payfastStatus?.toLowerCase() ?? "unknown";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = parseBody(req.body);

    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const expected = md5hex(buildSignatureString(body, passphrase));
    if (!body.signature || expected !== body.signature) {
      return res.status(400).send("Invalid signature");
    }

    const { payment_status, m_payment_id, pf_payment_id } = body;
    if (!m_payment_id) return res.status(400).send("Missing m_payment_id");

    const updatePayload = { status: resolveStatus(payment_status) };
    if (pf_payment_id) updatePayload.pf_payment_id = pf_payment_id;

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    const query = new URLSearchParams({ order_id: `eq.${m_payment_id}` });
    const response = await fetch(`${supabaseUrl}/rest/v1/Orders?${query.toString()}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      let details = "";
      try {
        details = JSON.stringify(await response.json());
      } catch {
        details = await response.text();
      }
      console.error("[ITN] Supabase update error:", details);
    } else {
      console.log(`[ITN] Order ${m_payment_id} -> ${updatePayload.status}`);
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("[ITN] Error:", err);
    return res.status(500).send("Server error");
  }
}
