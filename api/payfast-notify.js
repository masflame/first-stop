import crypto from "node:crypto";

// PayFast's documented server IPs
const PAYFAST_IPS = [
  "197.97.145.144",
  "41.74.179.192",
  "196.33.227.224",
  "196.33.227.225",
];

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
    return Object.fromEntries(new URLSearchParams(body).entries());
  }
  return {};
}

function buildSigString(body, passphrase) {
  const pairs = Object.entries(body)
    .filter(([k, v]) => k !== "signature" && v != null && String(v).trim() !== "")
    .map(([k, v]) => `${phpUrlencode(k)}=${phpUrlencode(String(v).trim())}`)
    .join("&");
  return passphrase
    ? `${pairs}&passphrase=${phpUrlencode(passphrase.trim())}`
    : pairs;
}

function md5hex(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}

// This handler is registered in PayFast Settings → Recurring Billing → Notify URL
// It fires when a token is created or an adhoc charge completes.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    // Verify the request originates from PayFast
    const clientIp = (req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim();
    if (!PAYFAST_IPS.includes(clientIp)) {
      console.warn("[TOKEN-ITN] Blocked non-PayFast IP:", clientIp);
      // Still return 200 to avoid PayFast retrying indefinitely
      return res.status(200).send("OK");
    }

    const body = parseBody(req.body);
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    if (body.signature && md5hex(buildSigString(body, passphrase)) !== body.signature) {
      console.warn("[TOKEN-ITN] Invalid signature");
      return res.status(200).send("OK");
    }

    const {
      payment_status,
      token,
      email_address,
      m_payment_id,
      // PayFast may include these on some integration tiers
      cc_last_four,
      cc_type,
    } = body;

    if (payment_status === "COMPLETE" && token && email_address) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
      const email = email_address.toLowerCase().trim();

      // Build upsert payload — include card details if PayFast provided them
      const upsertPayload = {
        email,
        payfast_token: token,
        is_default: true,
        ...(cc_last_four ? { card_last_four: cc_last_four } : {}),
        ...(cc_type ? { card_type: cc_type } : {}),
      };

      // Upsert on email conflict — email column must have a UNIQUE constraint
      const r = await fetch(
        `${supabaseUrl}/rest/v1/customer_payment_tokens?on_conflict=email`,
        {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(upsertPayload),
        }
      );

      if (!r.ok) {
        console.error("[TOKEN-ITN] Token upsert failed:", await r.text());
      } else {
        console.log("[TOKEN-ITN] Token saved for:", email, "| payment:", m_payment_id);
      }
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("[TOKEN-ITN] Error:", err);
    // Always return 200 — PayFast retries on non-200
    return res.status(200).send("OK");
  }
}
