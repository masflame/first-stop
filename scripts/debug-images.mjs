import fs from 'fs';
import path from 'path';

// Parse products from JS files (they export arrays)
function loadProducts(filename) {
  const content = fs.readFileSync(`src/data/${filename}.js`, 'utf8');
  // Extract the array between [ and the final ];
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start === -1 || end === -1) { console.log('No array for', filename); return []; }
  const arrStr = content.substring(start, end + 1);
  try {
    return new Function('return ' + arrStr)();
  } catch(e) { console.log('Parse error for', filename, e.message); return []; }
}

const brands = ['pumaProducts','newbalanceProducts','nikeProducts','jordanProducts','asicsProducts','adidasProducts','uggProducts'];
let products = [];
for (const b of brands) {
  const items = loadProducts(b);
  products.push(...items);
}
console.log('Loaded', products.length, 'products\n');

const brandNames = ['NIKE', 'ADIDAS', 'JORDAN', 'NEW BALANCE', 'ASICS', 'PUMA', 'UGG'];

console.log('=== SHOP BY BRAND TILES ===');
for (const br of brandNames) {
  const bp = products.find(p => p.brand === br && p.image && !p.image.includes('placeholder'));
  if (bp) {
    const diskPath = path.join('src', 'assets', bp.image);
    const exists = fs.existsSync(diskPath);
    const enc = bp.image.split('/').map(s => encodeURIComponent(s)).join('/');
    console.log(`${br}: exists=${exists} url=/src/assets/${enc.substring(0, 70)}`);
  } else {
    console.log(`${br}: NO PRODUCT FOUND`);
  }
}

console.log('\n=== NEW ARRIVALS (first 8) ===');
const newArrivals = products.filter(p => p.isNew).slice(0, 8);
for (const p of newArrivals) {
  const diskPath = path.join('src', 'assets', p.image);
  const exists = fs.existsSync(diskPath);
  console.log(`${p.brand} | exists=${exists} | ${p.image.substring(0, 80)}`);
}

console.log('\n=== FEATURED JORDANS (first 8) ===');
const jordans = products.filter(p => p.brand === 'JORDAN' && p.image && !p.image.includes('placeholder')).slice(0, 8);
for (const p of jordans) {
  const cat = p.image.split('/')[0] + '/' + p.image.split('/')[1];
  console.log(`${p.name.substring(0, 50)} | cat=${cat} | ${p.image.substring(0, 80)}`);
}

console.log('\n=== TOTAL PRODUCTS ===');
console.log('Total:', products.length);
for (const br of brandNames) {
  console.log(`${br}: ${products.filter(p => p.brand === br).length}`);
}
