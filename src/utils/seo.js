export const SITE_NAME = "FIRST STOP";
export const DEFAULT_SITE_URL = import.meta.env.VITE_SITE_URL || "https://first-stop.vercel.app";
export const DEFAULT_DESCRIPTION =
  "Shop premium sneakers and streetwear online in South Africa from Nike, Jordan, Adidas, New Balance, ASICS, Puma, and UGG.";
export const DEFAULT_OG_IMAGE = "/favicon.svg";

export function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, DEFAULT_SITE_URL).toString();
}

export function getCanonicalUrl(canonicalPath) {
  const path = canonicalPath || "/";
  return new URL(path, DEFAULT_SITE_URL).toString();
}

export function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

export function buildItemListSchema(items, listName, path) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    url: getCanonicalUrl(path),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: getCanonicalUrl(`/product/${item.id}`),
      name: item.name,
    })),
  };
}
