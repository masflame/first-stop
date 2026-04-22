import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const base = 'src/assets/shop';
const srcBase = 'c:/Users/Lil Steez-E/Pictures/Stores/Clothes/overkill/src/assets/shop';

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/R\s*/g, '').replace(/\s/g, '').replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

function toSlug(name) {
  return name.toLowerCase()
    .replace(/[™®]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getImagesForProduct(categoryPath, productFolderName, slugFolderName) {
  const folderPath = join(srcBase, categoryPath, productFolderName, slugFolderName);
  if (!existsSync(folderPath)) return [];
  const files = readdirSync(folderPath)
    .filter(f => f.endsWith('.png'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/_(\d+)_/)?.[1] || '99');
      const numB = parseInt(b.match(/_(\d+)_/)?.[1] || '99');
      return numA - numB;
    });
  return files.map(f => `${base}/${categoryPath}/${productFolderName}/${slugFolderName}/${f}`);
}

function parseCSV(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',');
    const nameIdx = headers.indexOf('product_name');
    const priceIdx = headers.indexOf('price');
    const groupIdx = headers.indexOf('product_group_key');
    const descIdx = headers.indexOf('product_description');
    
    const seen = new Set();
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Parse CSV with quoted fields
      const fields = [];
      let field = '';
      let inQuote = false;
      for (let c = 0; c < line.length; c++) {
        if (line[c] === '"') {
          inQuote = !inQuote;
        } else if (line[c] === ',' && !inQuote) {
          fields.push(field);
          field = '';
        } else {
          field += line[c];
        }
      }
      fields.push(field);
      
      const name = fields[nameIdx]?.trim() || '';
      const price = fields[priceIdx]?.trim() || '';
      const group = fields[groupIdx]?.trim() || '';
      const desc = fields[descIdx]?.trim() || '';
      
      if (name && !seen.has(group)) {
        seen.add(group);
        products.push({ name, price, group, desc });
      }
    }
    return products;
  } catch(e) {
    console.error('Error reading', filePath, e.message);
    return [];
  }
}

// =====================
// SLIDES & SANDALS
// =====================
console.log('\n=== SLIDES-SANDALS Puma Men ===');
const slidesMen = parseCSV(join(srcBase, 'Slides-Sandals/Puma/men/Slides-Sandals.csv'));
slidesMen.forEach(p => console.log(`${p.name} | ${p.price} | ${p.group}`));

console.log('\n=== SLIDES-SANDALS Puma Women ===');
const slidesWomen = parseCSV(join(srcBase, 'Slides-Sandals/Puma/women/Slides-Sandals.csv'));
slidesWomen.forEach(p => console.log(`${p.name} | ${p.price} | ${p.group}`));

// =====================
// RUNNING
// =====================
const runningFiles = [
  { file: 'Running/Puma/Men/pum-running.json', brand: 'PUMA', gender: 'men' },
  { file: 'Running/Puma/Men/pum-running-2.json', brand: 'PUMA', gender: 'men' },
  { file: 'Running/Puma/Women/puma-running.json', brand: 'PUMA', gender: 'women' },
  { file: 'Running/Puma/Women/puma-running-2.json', brand: 'PUMA', gender: 'women' },
  { file: 'Running/Nike/nike-running.json', brand: 'Nike', gender: 'unisex' },
  { file: 'Running/Asics/gel-ds-trainer-14.json', brand: 'ASICS', gender: 'unisex' },
];

for (const { file, brand } of runningFiles) {
  try {
    const content = readFileSync(join(srcBase, file), 'utf8');
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : (data.products || [data]);
    const seen = new Set();
    console.log(`\n=== RUNNING ${file} ===`);
    for (const item of items) {
      const key = item.product_group_key || toSlug(item.product_name || '');
      if (!seen.has(key)) {
        seen.add(key);
        console.log(`${item.product_name} | ${item.price} | ${key}`);
      }
    }
  } catch(e) {
    console.error('Error reading', file, e.message.substring(0, 100));
  }
}
