import crypto from "node:crypto";

function buildSignatureString(obj, passphrase = "") {
  const entries = Object.entries(obj)
    .filter(
      ([k, v]) => k !== "signature" && v !== undefined && v !== null && String(v).trim() !== ""
    )
    .map(([k, v]) => [k, String(v).trim()]);

  const query = entries
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k).replace(/%20/g, "+")}=${encodeURIComponent(v).replace(/%20/g, "+")}`
    )
    .join("&");

  return passphrase
    ? `${query}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    : query;
}

function md5(s) {
  return crypto.createHash("md5").update(s).digest("hex");
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const body = parseBody(req.body);
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";
    const expected = md5(buildSignatureString(body, passphrase));
    const received = body.signature;

    if (!received || expected !== received) {
      return res.status(400).send("Invalid signature");
    }

    const paymentStatus = body.payment_status; // COMPLETE, FAILED, etc.
    const orderId = body.m_payment_id; // your internal order id
    const pfPaymentId = body.pf_payment_id;

    // TODO: update DB using orderId
    // COMPLETE => paid
    // FAILED/CANCELLED => failed/cancelled
    // store pfPaymentId + raw payload for audit
    console.log("PayFast ITN", { paymentStatus, orderId, pfPaymentId });

    return res.status(200).send("OK");
  } catch {
    return res.status(500).send("Server error");
  }
}
