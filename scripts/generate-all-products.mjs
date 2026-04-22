/**
 * Master product generator: scans ALL JSON files and ALL image directories
 * across every category, matches products to local images, deduplicates,
 * auto-corrects categories, and generates data files.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, basename, relative, extname, sep } from "path";

const ROOT = process.cwd();
const SHOP_DIR = join(ROOT, "src/assets/shop");
const DATA_DIR = join(ROOT, "src/data");

const CATEGORIES = [
  "Sneakers", "Hoodies", "Jackets", "Pants", "T-shirts",
  "Running", "Accesories", "Slides & Sandals", "Tights", "Tracksuits",
];

const CATEGORY_TAG = {
  Sneakers: "sneakers", Hoodies: "hoodies", Jackets: "jackets",
  Pants: "pants", "T-shirts": "t-shirts", Running: "running",
  Accesories: "accessories", "Slides & Sandals": "slides",
  Tights: "tights", Tracksuits: "tracksuits",
};

function normalizeBrand(raw) {
  const b = raw.toLowerCase().trim();
  if (b.includes("jordan")) return "JORDAN";
  if (b.includes("nike") || b === "nocta") return "NIKE";
  if (b.includes("adidas")) return "ADIDAS";
  if (b.includes("asics")) return "ASICS";
  if (b.includes("new balance") || b.includes("newbalance")) return "NEW BALANCE";
  if (b.includes("puma")) return "PUMA";
  if (b.includes("ugg")) return "UGG";
  return raw.toUpperCase();
}

const CLOTHING_SIZES = ["XXS","XS","S","M","L","XL","XXL","2XL","3XL"];
const SNEAKER_SIZES = ["36","37","37.5","38","38.5","39","39.5","40","40.5","41","41.5","42","42.5","43","43.5","44","44.5","45","46"];
const SLIDES_SIZES = ["36","37","38","39","40","41","42","43","44","45","46"];

function getSizes(category) {
  if (["sneakers","running"].includes(category)) return SNEAKER_SIZES;
  if (category === "slides") return SLIDES_SIZES;
  return CLOTHING_SIZES;
}

function detectGender(filePath, productName) {
  const lower = (filePath + " " + productName).toLowerCase();
  const hasWomen = /women|woman|wmns|her\b|ladies/.test(lower);
  const hasMen = /\bmen\b|man\b|mens\b/.test(lower);
  const hasKids = /kids|toddler|infant|child|youth|junior/.test(lower);
  if (hasKids) return ["kids"];
  if (hasWomen && hasMen) return ["men","women"];
  if (hasWomen) return ["women"];
  if (hasMen) return ["men"];
  return ["men","women"];
}

function parsePrice(priceStr) {
  if (!priceStr) return { amount: 0, currency: "EUR" };
  const str = String(priceStr).trim();
  if (str.startsWith("R") || str.includes("ZAR")) {
    const cleaned = str.replace(/^R\s*/, "").replace(/ZAR\s*/, "");
    const first = cleaned.split("-")[0].trim();
    // Remove thousands separators (commas/spaces), keep decimal dot
    const normalized = first.replace(/[\s,]/g, "");
    return { amount: parseFloat(normalized) || 0, currency: "ZAR" };
  }
  if (str.includes("\u20AC") || str.includes("EUR")) {
    const cleaned = str.replace(/[\u20ACEUR\s]/g, "");
    const first = cleaned.split("-")[0].trim();
    // Handle European comma-as-decimal: only if no dot present
    const normalized = first.includes(".") ? first.replace(/,/g, "") : first.replace(",", ".");
    return { amount: parseFloat(normalized) || 0, currency: "EUR" };
  }
  const first = str.split("-")[0].trim();
  const num = parseFloat(first.replace(/[^\d.]/g, ""));
  return { amount: num || 0, currency: "ZAR" };
}

function walk(dir) {
  let results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else results.push(full);
  }
  return results;
}

const IMG_EXTS = new Set([".png",".jpg",".jpeg",".webp"]);

console.log("Building image index...");
const imageIndex = new Map();

for (const cat of CATEGORIES) {
  const catDir = join(SHOP_DIR, cat);
  if (!existsSync(catDir)) continue;
  const allFiles = walk(catDir);
  const imageFiles = allFiles.filter(f => IMG_EXTS.has(extname(f).toLowerCase()));
  const byDir = new Map();
  for (const img of imageFiles) {
    const dir = join(img, "..");
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push(img);
  }
  for (const [dir, imgs] of byDir) {
    const slug = basename(dir);
    const relDir = relative(SHOP_DIR, dir).split(sep);
    const assetPaths = imgs.map(img =>
      relative(join(ROOT, "src/assets"), img).split(sep).join("/")
    );
    let brandFromPath = "";
    for (const part of relDir) {
      const lower = part.toLowerCase();
      if (["nike","adidas","asics","puma","ugg","jordans","new balance"].includes(lower)) {
        brandFromPath = part;
        break;
      }
    }
    const fullPath = relDir.join("/");
    const existing = imageIndex.get(slug);
    if (!existing || assetPaths.length > (existing.images?.length || 0)) {
      imageIndex.set(slug, { category: cat, brandFromPath, pathStr: fullPath, images: assetPaths });
    }
  }
}
console.log("Image index: " + imageIndex.size + " product slugs with images");

console.log("Reading JSON files...");
const productMap = new Map();
const allJsonFiles = walk(SHOP_DIR).filter(f => f.endsWith(".json"));
console.log("Found " + allJsonFiles.length + " JSON files");

let matched = 0, unmatched = 0;

const COLLECTION_NAMES = {
  "air-force-1":"Air Force 1","aja-wilson":"A'ja Wilson","nike-golf-sneakers":"Golf",
  "nike-nocta":"NOCTA","nike-mind":"Nike Mind","nike-p-6000":"P-6000",
  "nike-shoes-dunk":"Dunk","nike-shoes-flyknit":"Flyknit",
  "nike-shoes-nike-air-max":"Air Max","nike-shoes-nike-air-max-air-max-1":"Air Max 1",
  "nike-shoes-nike-air-max-air-max-90":"Air Max 90","nike-shoes-nike-air-max-air-max-95":"Air Max 95",
  "nike-shoes-nike-air-max-air-max-97":"Air Max 97","nike-shoes-nike-air-max-vapormax":"VaporMax",
  "nike-shoes-nike-basketball-kobe-bryant":"Kobe Bryant","nike-shoes-nike-basketball-lebron-james":"LeBron James",
  "nike-shoes-nike-basketball-uptempo":"Uptempo","nike-shoes-nike-lifestyle-react":"React",
  "nike-shoes-presto":"Presto","nike-shoes-roshe":"Roshe","sb-dunk":"SB Dunk",
  "travis-scott":"Travis Scott","vomero-5":"Vomero 5","nike-toddler":"Kids",
  "nike-running":"Running","adidas-shoes-samba":"Samba","adidas-shoes-gazelle":"Gazelle",
  "adidas-shoes-campus":"Campus","adidas-shoes-superstar":"Superstar",
  "adidas-shoes-ultra-boost":"Ultra Boost","adidas-shoes-handball-spezial":"Handball Spezial",
  "adidas-shoes-james-harden":"James Harden","adidas-shoes-pharrell":"Pharrell",
  "adidas-shoes-tubular":"Tubular","adidas-x-fear-of-god":"Fear of God",
  "adidas-new-releases":"New Releases","adidas-shoes-best-sellers":"Best Sellers",
  "adidas-toddler":"Kids","sl-72":"SL 72",
  "asics-gel-1130":"GEL-1130","asics-gel-kayano":"GEL-KAYANO","asics-gt-2160":"GT-2160",
  "asics-best-sellers":"Best Sellers","asics-new-releases":"New Releases",
  "gel-ds-trainer-14":"GEL DS Trainer 14","jordans":"Jordan",
  "new-balance-new-releases":"New Releases",
  "ugg":"UGG","ugg-disquette":"Disquette","tasman-womens":"Tasman","tazz-womens":"Tazz",
  "new releases":"New Releases","pum-running":"Running","pum-running-2":"Running",
  "puma-running":"Running","puma-running-2":"Running",
};

for (const jsonFile of allJsonFiles) {
  let data;
  try { data = JSON.parse(readFileSync(jsonFile, "utf8")); } catch { continue; }
  if (!Array.isArray(data)) data = [data];
  const relPath = relative(SHOP_DIR, jsonFile);

  for (const entry of data) {
    const key = entry.product_group_key;
    if (!key || productMap.has(key)) continue;
    const imgData = imageIndex.get(key);
    if (!imgData || imgData.images.length === 0) { unmatched++; continue; }
    matched++;

    const { amount, currency } = parsePrice(entry.price);
    if (amount <= 0) continue;
    const name = (entry.product_name_hint || entry.product_name || "").trim();
    if (!name) continue;

    let brand = normalizeBrand(imgData.brandFromPath || entry.platform || "");
    if (/^jordan\b/i.test(name) && brand === "NIKE") brand = "JORDAN";

    const gender = detectGender(relPath + " " + imgData.pathStr, name);
    const realCategory = CATEGORY_TAG[imgData.category] || "sneakers";
    const cats = [...gender, realCategory];
    if (Math.random() > 0.8) cats.push("new");

    let sku = "";
    const skuMatch = name.match(/([A-Z0-9]{2,}[-\s]\d{3})$/i);
    if (skuMatch) sku = skuMatch[1].replace(/\s/, "-");
    else if (entry.page_url) {
      const urlSku = entry.page_url.match(/\/([A-Z0-9]+-[A-Z0-9]+)(?:\?|$)/i);
      if (urlSku) sku = urlSku[1];
    }

    let cleanedName = name
      .replace(/\s+[A-Z0-9]{2,}[-\s]\d{3}$/i, "")
      .replace(/\s+[A-Z0-9]{2,}-[A-Z0-9]+$/i, "")
      .trim().replace(/^["']|["']$/g, "").trim();

    let collection = "";
    if (realCategory === "sneakers" || realCategory === "running") {
      const jsonBaseName = basename(jsonFile, ".json");
      collection = COLLECTION_NAMES[jsonBaseName] || "";
    }

    const sizes = getSizes(realCategory);
    let salePrice = null;
    const isSale = Math.random() > 0.85;
    if (isSale) {
      const discount = 0.15 + Math.random() * 0.25;
      salePrice = Math.round(amount * (1 - discount) * 100) / 100;
    }

    productMap.set(key, {
      name: cleanedName, sku, brand, collection,
      price: amount, currency, salePrice,
      category: cats, sizes, color: "",
      description: entry.product_description || "",
      image: imgData.images[0],
      hoverImage: imgData.images.length > 1 ? imgData.images[1] : imgData.images[0],
      allImages: imgData.images,
      slug: key, isNew: cats.includes("new"), isSale, realCategory,
    });
  }
}

console.log("Matched: " + matched + ", Unmatched (no images): " + unmatched);
console.log("Final unique products: " + productMap.size);

const brandGroups = {};
for (const [, p] of productMap) {
  const brandKey = p.brand.toLowerCase().replace(/\s+/g, "");
  if (!brandGroups[brandKey]) brandGroups[brandKey] = [];
  brandGroups[brandKey].push(p);
}

const catSummary = {};
for (const [, p] of productMap) {
  if (!catSummary[p.realCategory]) catSummary[p.realCategory] = 0;
  catSummary[p.realCategory]++;
}
console.log("\nBy category:");
for (const [cat, count] of Object.entries(catSummary).sort((a,b)=>b[1]-a[1])) {
  console.log("  " + cat + ": " + count);
}
console.log("\nBy brand:");
for (const [brand, products] of Object.entries(brandGroups).sort((a,b)=>b[1].length-a[1].length)) {
  console.log("  " + brand + ": " + products.length);
}

let nextId = 1;
const esc = s => String(s||"").replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g," ");

function genBrandFile(displayName, varName, products) {
  const entries = products.map(p => {
    const id = nextId++;
    const allImgs = p.allImages.map(img => '      "' + esc(img) + '"').join(",\n");
    return '  {\n' +
      '    id: ' + id + ',\n' +
      '    name: "' + esc(p.name) + '",\n' +
      '    sku: "' + esc(p.sku) + '",\n' +
      '    brand: "' + esc(p.brand) + '",\n' +
      '    collection: "' + esc(p.collection) + '",\n' +
      '    price: ' + p.price.toFixed(2) + ',\n' +
      '    currency: "' + p.currency + '",\n' +
      '    salePrice: ' + (p.salePrice ? p.salePrice.toFixed(2) : 'null') + ',\n' +
      '    category: [' + p.category.map(c=>'"'+c+'"').join(', ') + '],\n' +
      '    sizes: [' + p.sizes.map(s=>'"'+s+'"').join(', ') + '],\n' +
      '    color: "' + esc(p.color) + '",\n' +
      '    description: "' + esc(p.description) + '",\n' +
      '    image: "' + esc(p.image) + '",\n' +
      '    hoverImage: "' + esc(p.hoverImage) + '",\n' +
      '    allImages: [\n' + allImgs + '\n    ],\n' +
      '    slug: "' + esc(p.slug) + '",\n' +
      '    isNew: ' + p.isNew + ',\n' +
      '    isSale: ' + p.isSale + ',\n' +
      '  }';
  });
  return '// Auto-generated ' + displayName + ' products from JSON data\n' +
    '// Total: ' + products.length + ' products\n\n' +
    'const ' + varName + ' = [\n' + entries.join(",\n") + '\n];\n\n' +
    'export default ' + varName + ';\n';
}

const brandConfig = {
  nike: { display: "Nike", varName: "nikeProducts", file: "nikeProducts.js" },
  nikesb: { merge: "nike" }, nocta: { merge: "nike" },
  adidas: { display: "Adidas", varName: "adidasProducts", file: "adidasProducts.js" },
  asics: { display: "ASICS", varName: "asicsProducts", file: "asicsProducts.js" },
  jordan: { display: "Jordan", varName: "jordanProducts", file: "jordanProducts.js" },
  newbalance: { display: "New Balance", varName: "newbalanceProducts", file: "newbalanceProducts.js" },
  puma: { display: "Puma", varName: "pumaProducts", file: "pumaProducts.js" },
  ugg: { display: "UGG", varName: "uggProducts", file: "uggProducts.js" },
};

for (const [key, cfg] of Object.entries(brandConfig)) {
  if (cfg.merge) {
    if (!brandGroups[cfg.merge]) brandGroups[cfg.merge] = [];
    if (brandGroups[key]) {
      brandGroups[cfg.merge].push(...brandGroups[key]);
      delete brandGroups[key];
    }
  }
}

const writtenBrands = [];
for (const [brandKey, products] of Object.entries(brandGroups)) {
  const cfg = brandConfig[brandKey];
  if (!cfg || !cfg.file) continue;
  const content = genBrandFile(cfg.display, cfg.varName, products);
  writeFileSync(join(DATA_DIR, cfg.file), content, "utf8");
  console.log("Wrote " + cfg.file + ": " + products.length + " products");
  writtenBrands.push({ varName: cfg.varName, file: cfg.file, count: products.length });
}

const imports = writtenBrands.map(b => 'import ' + b.varName + ' from "./' + basename(b.file, '.js') + '";').join("\n");
const spreads = writtenBrands.map(b => '  ...' + b.varName + ',').join("\n");
const productsJs = imports + '\n\nconst allProducts = [\n' + spreads + '\n];\n\nexport default allProducts;\n';
writeFileSync(join(DATA_DIR, "products.js"), productsJs, "utf8");
console.log("\nWrote products.js (" + productMap.size + " total products)");
console.log("Done!");
