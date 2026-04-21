/**
 * Resolve an asset-relative image path to a serveable URL.
 * In dev mode Vite serves /src/assets/ files directly.
 * Encodes each path segment so spaces, apostrophes, +, etc. work.
 * @param {string} path - e.g. "shop/Sneakers/Nike/air-force-1/…/image.png"
 * @returns {string} resolved URL or empty string
 */
export function resolveImage(path) {
  if (!path) return "";
  const encoded = path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `/src/assets/${encoded}`;
}
