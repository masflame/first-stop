import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import products from "../src/data/products.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");
const distDir = join(rootDir, "dist");

function readEnvValue(fileName, key) {
  const filePath = join(rootDir, fileName);
  if (!existsSync(filePath)) return undefined;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const envKey = trimmed.slice(0, eqIndex).trim();
    if (envKey !== key) continue;

    return trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
  }

  return undefined;
}

const siteUrl =
  process.env.VITE_SITE_URL ||
  readEnvValue(".env.production", "VITE_SITE_URL") ||
  readEnvValue(".env.local", "VITE_SITE_URL") ||
  "https://www.shoedistrict.co.za";

const brandSlugMap = {
  nike: "NIKE",
  adidas: "ADIDAS",
  jordan: "JORDAN",
  "new-balance": "NEW BALANCE",
  asics: "ASICS",
  puma: "PUMA",
  ugg: "UGG",
  "nike-sb": "NIKE SB",
  nocta: "NOCTA",
};

const staticRoutes = [
  "/",
  "/brands",
  "/collections/all",
  "/collections/new",
  "/collections/sale",
  "/collections/spring-sale",
  "/collections/kids",
  "/collections/soon",
  "/collections/raffle",
  "/collections/men",
  "/collections/women",
  "/collections/men/sneakers",
  "/collections/men/clothing",
  "/collections/men/accessories",
  "/collections/men/running",
  "/collections/men/slides",
  "/collections/women/sneakers",
  "/collections/women/clothing",
  "/collections/women/accessories",
  "/collections/women/running",
  "/collections/women/slides",
];

function toAbsolute(path) {
  return new URL(path, siteUrl).toString();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function collectBrandRoutes() {
  const availableBrands = new Set(products.map((product) => product.brand));
  return Object.entries(brandSlugMap)
    .filter(([, brand]) => availableBrands.has(brand))
    .map(([slug]) => `/collections/${slug}`);
}

function collectProductRoutes() {
  return products.map((product) => `/product/${product.id}`);
}

function buildUrlEntry(path, changefreq, priority) {
  return `  <url>\n    <loc>${toAbsolute(path)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`;
}

const routeSet = new Set([...staticRoutes, ...collectBrandRoutes(), ...collectProductRoutes()]);
const sortedRoutes = [...routeSet].sort((left, right) => {
  if (left === "/") return -1;
  if (right === "/") return 1;
  return left.localeCompare(right);
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sortedRoutes
  .map((route) => {
    if (route === "/") return buildUrlEntry(route, "daily", 1.0);
    if (route.startsWith("/product/")) return buildUrlEntry(route, "weekly", 0.7);
    if (route.startsWith("/collections/")) return buildUrlEntry(route, "daily", 0.8);
    return buildUrlEntry(route, "weekly", 0.6);
  })
  .join("\n")}\n</urlset>\n`;

const robots = `User-agent: *\nAllow: /\n\nDisallow: /checkout\nDisallow: /payment/\n\nSitemap: ${toAbsolute("/sitemap.xml")}\n`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, "sitemap.xml"), sitemap, "utf8");
writeFileSync(join(publicDir, "robots.txt"), robots, "utf8");

if (existsSync(distDir)) {
  writeFileSync(join(distDir, "sitemap.xml"), sitemap, "utf8");
  writeFileSync(join(distDir, "robots.txt"), robots, "utf8");
}

console.log(`Generated SEO files for ${sortedRoutes.length} URLs.`);
