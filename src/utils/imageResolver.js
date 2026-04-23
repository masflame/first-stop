/**
 * Resolve an asset-relative image path to a serveable URL.
 * In dev mode Vite serves /src/assets/ files directly.
 * Encodes each path segment so spaces, apostrophes, +, etc. work.
 * @param {string} path - e.g. "shop/Sneakers/Nike/air-force-1/…/image.png"
 * @returns {string} resolved URL or empty string
 */
export function resolveImage(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const toStorageSafePath = (value) =>
    value
      .split("/")
      .map((segment) =>
        (segment
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9 ._\-()]/g, "")
          .replace(/\s+/g, " ")
          .trim() || "_")
      )
      .join("/");

  const encoded = path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

  // Prefer dedicated storage project URL, but fall back to primary Supabase project URLs.
  const storageBase =
    import.meta.env.VITE_STORAGE_PROJECT_URL ||
    import.meta.env.VITE_PROJECT_URL ||
    import.meta.env.VITE_SUPABASE_URL;
  const storageBucket = import.meta.env.VITE_STORAGE_BUCKET || "products";
  if (storageBase && path.startsWith("shop/")) {
    const storageEncoded = toStorageSafePath(path)
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    return `${storageBase.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(storageBucket)}/${storageEncoded}`;
  }

  return `/src/assets/${encoded}`;
}
