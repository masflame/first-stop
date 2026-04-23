import md5 from "md5";

const MERCHANT_ID = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
const MERCHANT_KEY = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;
const PASSPHRASE = import.meta.env.VITE_PAYFAST_PASSPHRASE;
const SANDBOX_PAYFAST_URL = "https://sandbox.payfast.co.za/eng/process";
const LIVE_PAYFAST_URL = "https://www.payfast.co.za/eng/process";

function resolvePayfastUrl() {
  const configured = import.meta.env.VITE_PAYFAST_URL;
  const isSandboxMerchant = /^100\d+$/u.test(String(MERCHANT_ID || "").trim());

  if (!configured) {
    return isSandboxMerchant ? SANDBOX_PAYFAST_URL : LIVE_PAYFAST_URL;
  }

  const isSandboxUrl = /sandbox\.payfast\.co\.za/iu.test(configured);
  if (isSandboxMerchant && !isSandboxUrl) {
    return SANDBOX_PAYFAST_URL;
  }

  if (!isSandboxMerchant && isSandboxUrl) {
    return LIVE_PAYFAST_URL;
  }

  return configured;
}

const PAYFAST_URL = resolvePayfastUrl();
const NOTIFY_URL = import.meta.env.VITE_PAYFAST_NOTIFY_URL;

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

function generateSignature(data) {
  let pfOutput = "";
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== "") {
      pfOutput += `${key}=${phpUrlencode(String(val).trim())}&`;
    }
  }

  pfOutput = pfOutput.slice(0, -1);
  if (PASSPHRASE) {
    pfOutput += `&passphrase=${phpUrlencode(PASSPHRASE.trim())}`;
  }

  return md5(pfOutput);
}

export function buildPayfastData({ items, customer, paymentId }) {
  if (!MERCHANT_ID || !MERCHANT_KEY) {
    throw new Error("Missing PayFast merchant credentials. Set VITE_PAYFAST_MERCHANT_ID and VITE_PAYFAST_MERCHANT_KEY.");
  }

  const amount = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemName = items.length === 1 ? items[0].name : `Order #${paymentId} (${items.length} items)`;
  const itemDescription = items
    .map((i) => `${i.qty}x ${i.name}`)
    .join(", ")
    .slice(0, 255);
  const origin = window.location.origin;

  const data = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: `${origin}/payment/success`,
    cancel_url: `${origin}/payment/cancel`,
    notify_url: NOTIFY_URL || `${origin}/api/payfast/notify`,
    name_first: customer.firstName,
    name_last: customer.lastName,
    email_address: customer.email,
    ...(customer.phone ? { cell_number: customer.phone } : {}),
    m_payment_id: paymentId,
    amount: amount.toFixed(2),
    item_name: itemName.slice(0, 100),
    item_description: itemDescription,
  };

  data.signature = generateSignature(data);
  return data;
}

export { PAYFAST_URL };
