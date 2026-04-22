const EU_TO_US_MAP = {
  "35": "3",
  "35.5": "3.5",
  "36": "4",
  "36.5": "4.5",
  "37": "5",
  "37.5": "5.5",
  "38": "6",
  "38.5": "6.5",
  "39": "7",
  "39.5": "7.5",
  "40": "8",
  "40.5": "8.5",
  "41": "9",
  "41.5": "9.5",
  "42": "10",
  "42.5": "10.5",
  "43": "11",
  "43.5": "11.5",
  "44": "12",
  "44.5": "12.5",
  "45": "13",
  "45.5": "13.5",
  "46": "14",
  "46.5": "14.5",
  "47": "15",
};

const APPAREL_SIZES = new Set([
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "ONE SIZE",
]);

function normalizeNumericString(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Number.isInteger(n) ? String(n) : String(n);
}

export function formatSizeDisplay(size) {
  const raw = String(size ?? "").trim();
  if (!raw) return raw;

  const upper = raw.toUpperCase();
  if (APPAREL_SIZES.has(upper)) return upper;

  const normalized = normalizeNumericString(raw);
  if (!normalized) return raw;

  const us = EU_TO_US_MAP[normalized] || normalized;
  return `US ${us}`;
}
