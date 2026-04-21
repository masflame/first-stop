function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getUnavailableSizeSet(product, ratio = 0.28) {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const unavailable = new Set();

  sizes.forEach((size, idx) => {
    const seed = `${product?.id ?? product?.name ?? "product"}:${size}:${idx}`;
    const value = (hashString(seed) % 1000) / 1000;
    if (value < ratio) unavailable.add(size);
  });

  if (sizes.length > 0 && unavailable.size === sizes.length) {
    unavailable.delete(sizes[sizes.length - 1]);
  }

  return unavailable;
}

export function isSizeUnavailable(product, size, ratio = 0.28) {
  return getUnavailableSizeSet(product, ratio).has(size);
}
