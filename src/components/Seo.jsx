import { Helmet } from "react-helmet-async";

const SITE_NAME = "FIRST STOP";
const DEFAULT_DESCRIPTION = "Shop premium sneakers and streetwear from Nike, Jordan, Adidas, New Balance, ASICS, Puma, and UGG.";
const DEFAULT_OG_IMAGE = "/favicon.svg";

function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (typeof window === "undefined") return pathOrUrl;
  return new URL(pathOrUrl, window.location.origin).toString();
}

function getCanonicalUrl(canonicalPath) {
  if (typeof window === "undefined") return canonicalPath;
  const path = canonicalPath || `${window.location.pathname}${window.location.search}`;
  return new URL(path, window.location.origin).toString();
}

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const canonical = getCanonicalUrl(canonicalPath);
  const absoluteImage = toAbsoluteUrl(image || DEFAULT_OG_IMAGE);
  const finalTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Sneakers & Streetwear`;

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={absoluteImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {jsonLd ? <script type="application/ld+json">{JSON.stringify(jsonLd)}</script> : null}
    </Helmet>
  );
}
