import products from '../src/data/products.js';

const sale = products.filter((p) => p.isSale);
const categories = new Map();

for (const p of sale) {
  const cats = Array.isArray(p.category) ? p.category : [];
  for (const c of cats) {
    if (["men", "women", "kids", "new", "sale"].includes(c)) continue;
    categories.set(c, (categories.get(c) || 0) + 1);
  }
}

console.log('total products:', products.length);
console.log('sale products:', sale.length);
console.log('sale categories covered:', categories.size);
console.log('categories:', [...categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20));
