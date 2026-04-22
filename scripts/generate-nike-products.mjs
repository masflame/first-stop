/**
 * Reads all Nike JSON files, de-duplicates products by product_group_key,
 * maps images to src/assets paths, and outputs nikeProducts.js
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, basename, relative } from "path";

const NIKE_DIR = join(process.cwd(), "src/assets/shop/Sneakers/Nike");
const OUT_FILE = join(process.cwd(), "src/data/nikeProducts.js");

// Collection display names
const COLLECTION_NAMES = {
  "air-force-1": "Air Force 1",
  "aja-wilson": "A'ja Wilson",
  "nike-golf-sneakers": "Golf",
  "nike-nocta": "NOCTA",
  "nike-shoes-dunk": "Dunk",
  "nike-shoes-flyknit": "Flyknit",
  "nike-shoes-nike-air-max": "Air Max",
  "nike-shoes-nike-air-max-air-max-1": "Air Max 1",
  "nike-shoes-nike-air-max-air-max-90": "Air Max 90",
  "nike-shoes-nike-air-max-air-max-95": "Air Max 95",
  "nike-shoes-nike-air-max-air-max-97": "Air Max 97",
  "nike-shoes-nike-air-max-vapormax": "VaporMax",
  "nike-shoes-nike-basketball-kobe-bryant": "Kobe Bryant",
  "nike-shoes-nike-basketball-lebron-james": "LeBron James",
  "nike-shoes-nike-basketball-uptempo": "Uptempo",
  "nike-shoes-roshe": "Roshe",
  "sb-dunk": "SB Dunk",
  "travis-scott": "Travis Scott",
};

// Brand mapping for specific collections
function getBrand(collection) {
  if (collection === "sb-dunk") return "NIKE SB";
  if (collection === "nike-nocta") return "NOCTA";
  return "NIKE";
}

// Extract SKU-like code from product name (last alphanumeric chunk)
function extractSku(name) {
  // e.g. 'Air Force 1 Low "White on White" CW2288 111' → "CW2288-111"
  const match = name.match(/([A-Z0-9]{2,})\s+(\d{3})$/i);
  if (match) return `${match[1]}-${match[2]}`;
  const match2 = name.match(/([A-Z0-9]{2,}-[A-Z0-9]+)$/i);
  if (match2) return match2[1];
  return "";
}

// Clean product name: remove SKU from end, remove outer quotes
function cleanName(name) {
  // Remove trailing SKU-like patterns
  let cleaned = name
    .replace(/\s+[A-Z0-9]{2,}\s+\d{3}$/i, "")
    .replace(/\s+[A-Z0-9]{2,}-[A-Z0-9]+$/i, "")
    .trim();
  // Remove surrounding quotes if any
  cleaned = cleaned.replace(/^["']|["']$/g, "").trim();
  return cleaned;
}

// Parse price: "4174.00 - 5239.00" → 4174.00 (take lower end)
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const parts = priceStr.split("-").map((p) => parseFloat(p.trim()));
  return parts[0] || 0;
}

// Get page slug from URL
function getPageSlug(url) {
  if (!url) return "";
  const parts = url.split("/");
  return parts[parts.length - 1] || parts[parts.length - 2];
}

// Find existing images in the assets folder for a product
function findProductImages(collection, pageSlug, groupKey) {
  const productDir = join(NIKE_DIR, collection, pageSlug, groupKey);
  if (!existsSync(productDir) || !statSync(productDir).isDirectory()) {
    // Try without the middle page-slug level
    const altDir = join(NIKE_DIR, collection, groupKey);
    if (existsSync(altDir) && statSync(altDir).isDirectory()) {
      const files = readdirSync(altDir).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
      return files.map((f) => `shop/Sneakers/Nike/${collection}/${groupKey}/${f}`);
    }
    return [];
  }
  const files = readdirSync(productDir).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  return files.map(
    (f) => `shop/Sneakers/Nike/${collection}/${pageSlug}/${groupKey}/${f}`
  );
}

// ── Main ──

const jsonFiles = readdirSync(NIKE_DIR).filter((f) => f.endsWith(".json"));
console.log(`Found ${jsonFiles.length} JSON files`);

const allProducts = new Map(); // product_group_key → product data

for (const file of jsonFiles) {
  const collection = basename(file, ".json");
  const data = JSON.parse(readFileSync(join(NIKE_DIR, file), "utf8"));

  for (const entry of data) {
    const key = entry.product_group_key;
    if (!key || allProducts.has(key)) continue;

    const pageSlug = getPageSlug(entry.page_url);
    const images = findProductImages(collection, pageSlug, key);
    if (images.length === 0) continue; // Skip products with no local images

    const sku = extractSku(entry.product_name_hint || entry.product_name);
    const name = cleanName(entry.product_name_hint || entry.product_name);
    const price = parsePrice(entry.price);

    allProducts.set(key, {
      name,
      sku,
      brand: getBrand(collection),
      collection: COLLECTION_NAMES[collection] || collection,
      price,
      description: entry.product_description || "",
      image: images[0],
      hoverImage: images.length > 1 ? images[1] : images[0],
      allImages: images,
      slug: key,
    });
  }
}

console.log(`De-duplicated to ${allProducts.size} unique products`);

// Generate JS file
const startId = 25; // existing products end at ID 24
let id = startId;

const productEntries = [];
for (const [, p] of allProducts) {
  const escaped = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const allImgsStr = p.allImages.map((img) => `      "${escaped(img)}"`).join(",\n");

  productEntries.push(`  {
    id: ${id},
    name: "${escaped(p.name)}",
    sku: "${escaped(p.sku)}",
    brand: "${escaped(p.brand)}",
    collection: "${escaped(p.collection)}",
    price: ${p.price.toFixed(2)},
    currency: "ZAR",
    salePrice: null,
    category: ["men", "women", "sneakers"],
    sizes: ["36", "37.5", "38", "38.5", "39", "40", "40.5", "41", "42", "42.5", "43", "44", "44.5", "45", "46"],
    color: "",
    description: "${escaped(p.description)}",
    image: "${escaped(p.image)}",
    hoverImage: "${escaped(p.hoverImage)}",
    allImages: [
${allImgsStr}
    ],
    slug: "${escaped(p.slug)}",
    isNew: ${Math.random() > 0.7},
    isSale: false,
  }`);
  id++;
}

const output = `// Auto-generated Nike products from JSON data
// Currency: South African Rands (ZAR)
// Total: ${productEntries.length} products

const nikeProducts = [
${productEntries.join(",\n")}
];

export default nikeProducts;
`;

writeFileSync(OUT_FILE, output, "utf8");
console.log(`Wrote ${productEntries.length} products to ${OUT_FILE}`);
