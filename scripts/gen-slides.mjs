import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const WORKSPACE = 'c:/Users/Lil Steez-E/Pictures/Stores/Clothes/overkill';
const SLIDES_BASE = `${WORKSPACE}/src/assets/shop/Slides-Sandals`;

function getPngsInDir(dir) {
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.png'))
      .map(f => join(dir, f).replace(/\\/g, '/').replace(/.*\/src\/assets\//, ''));
  } catch (e) { return []; }
}

function sortImages(paths) {
  return paths.sort((a, b) => {
    const numA = parseInt(a.match(/_(\d+)_/)?.[1] || '99');
    const numB = parseInt(b.match(/_(\d+)_/)?.[1] || '99');
    return numA - numB;
  });
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  return parseFloat(priceStr.replace(/R\s*/g, '').replace(/\s/g, '').replace(/,/g, '')) || 0;
}

function parseCsv(filePath) {
  const products = new Map();
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return products;
    const headers = lines[0].split(',');
    const nameIdx = headers.indexOf('product_name');
    const priceIdx = headers.indexOf('price');
    const groupIdx = headers.indexOf('product_group_key');
    const descIdx = headers.indexOf('product_description');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = [];
      let field = '', inQuote = false;
      for (let c = 0; c < line.length; c++) {
        if (line[c] === '"') inQuote = !inQuote;
        else if (line[c] === ',' && !inQuote) { fields.push(field); field = ''; }
        else field += line[c];
      }
      fields.push(field);
      const name = fields[nameIdx]?.trim() || '';
      const price = fields[priceIdx]?.trim() || '';
      const group = fields[groupIdx]?.trim() || '';
      const desc = fields[descIdx]?.trim() || '';
      if (name && !products.has(group)) {
        products.set(group, { name, price: parsePrice(price), description: desc });
      }
    }
  } catch (e) { console.error('CSV error', filePath, e.message); }
  return products;
}

const menCsv = parseCsv(`${SLIDES_BASE}/Puma/men/Slides-Sandals.csv`);
const womenCsv = parseCsv(`${SLIDES_BASE}/Puma/women/Slides-Sandals.csv`);

const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

// Build entries: each colorway subfolder is its own product
// key: `${gender}/${prodName}/${slug}/${subfolder}` for dedup
const entries = []; // { name, price, desc, pngs, slug, genders }

// Track products that appear in both men + women folders (unisex)
// Use productKey = prodName+slug+subfolder, but share genders
const seenKeys = new Map(); // productKey -> entries index

for (const gender of ['men', 'women']) {
  const csvData = gender === 'men' ? menCsv : womenCsv;
  const genderPath = join(SLIDES_BASE, 'Puma', gender);
  const prodDirs = readdirSync(genderPath).filter(d => {
    const full = join(genderPath, d);
    return !d.endsWith('.csv') && statSync(full).isDirectory();
  });
  for (const prodName of prodDirs) {
    const prodPath = join(genderPath, prodName);
    const slugDirs = readdirSync(prodPath).filter(d => {
      return statSync(join(prodPath, d)).isDirectory();
    });
    for (const slugDir of slugDirs) {
      const slugPath = join(prodPath, slugDir);
      const children = readdirSync(slugPath, { withFileTypes: true });
      const subfolders = children.filter(c => c.isDirectory()).map(c => c.name).sort();
      const directPngs = sortImages(getPngsInDir(slugPath));

      if (subfolders.length > 0) {
        // Each subfolder = separate colorway product
        for (let i = 0; i < subfolders.length; i++) {
          const sub = subfolders[i];
          const pngs = sortImages(getPngsInDir(join(slugPath, sub)));
          if (pngs.length === 0) continue;
          const colorIdx = i + 1;
          const uniqueSlug = subfolders.length === 1 ? slugDir : `${slugDir}-${colorIdx}`;
          // Dedup for unisex: same slug across men/women folders
          const dedupeKey = `${prodName}|${uniqueSlug}`;
          if (seenKeys.has(dedupeKey)) {
            const existing = entries[seenKeys.get(dedupeKey)];
            if (!existing.genders.includes(gender)) existing.genders.push(gender);
            continue;
          }
          const csvEntry = csvData.get(slugDir) || {};
          const name = csvEntry.name ? `${csvEntry.name}` : prodName;
          const price = csvEntry.price || 399;
          const desc = csvEntry.description || `${name} by PUMA.`;
          seenKeys.set(dedupeKey, entries.length);
          entries.push({ name, price, desc, pngs, slug: uniqueSlug, genders: [gender] });
        }
        // Also include any direct pngs if present
        if (directPngs.length > 0) {
          const dedupeKey = `${prodName}|${slugDir}-direct`;
          if (!seenKeys.has(dedupeKey)) {
            const csvEntry = csvData.get(slugDir) || {};
            const name = csvEntry.name || prodName;
            const price = csvEntry.price || 399;
            const desc = csvEntry.description || `${name} by PUMA.`;
            seenKeys.set(dedupeKey, entries.length);
            entries.push({ name, price, desc, pngs: directPngs, slug: slugDir, genders: [gender] });
          }
        }
      } else {
        // No subfolders: single product with all direct pngs
        const pngs = sortImages(getPngsInDir(slugPath));
        if (pngs.length === 0) continue;
        const dedupeKey = `${prodName}|${slugDir}`;
        if (seenKeys.has(dedupeKey)) {
          const existing = entries[seenKeys.get(dedupeKey)];
          if (!existing.genders.includes(gender)) existing.genders.push(gender);
          continue;
        }
        const csvEntry = csvData.get(slugDir) || {};
        const name = csvEntry.name || prodName;
        const price = csvEntry.price || 399;
        const desc = csvEntry.description || `${name} by PUMA.`;
        seenKeys.set(dedupeKey, entries.length);
        entries.push({ name, price, desc, pngs, slug: slugDir, genders: [gender] });
      }
    }
  }
}

// Generate JS blocks
let id = 133;
const jsBlocks = [];
for (const { name, price, desc, pngs, slug, genders } of entries) {
  const category = [...new Set([...genders, 'slides'])];
  const img1 = pngs[0];
  const img2 = pngs[1] || pngs[0];
  const allImagesStr = pngs.map(p => `      "${p}"`).join(',\n');
  const cleanDesc = desc.replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"');
  jsBlocks.push(`  {
    id: ${id++},
    name: "${name}",
    sku: "",
    brand: "PUMA",
    collection: "",
    price: ${price.toFixed(2)},
    currency: "ZAR",
    salePrice: null,
    category: ${JSON.stringify(category)},
    sizes: ${JSON.stringify(SHOE_SIZES)},
    color: "",
    description: "${cleanDesc.replace(/"/g, '\\"')}",
    image: "${img1}",
    hoverImage: "${img2}",
    allImages: [
${allImagesStr}
    ],
    slug: "${slug}",
    isNew: false,
    isSale: false,
  }`);
}

const output = jsBlocks.join(',\n');
writeFileSync(`${WORKSPACE}/scripts/slides-output.js`, output, 'utf8');
console.log(`Generated ${jsBlocks.length} slide products (IDs 133-${132 + jsBlocks.length})`);
console.log(`Output written to scripts/slides-output.js`);
