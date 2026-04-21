import { readFileSync, existsSync } from 'fs';

const c = readFileSync('src/data/pumaProducts.js', 'utf8');

for (let id = 1; id <= 260; id++) {
  const s = c.indexOf(`id: ${id},`);
  if (s < 0) continue;
  const e = c.indexOf(`id: ${id + 1},`, s + 1);
  const b = c.slice(s, e > 0 ? e : c.length);
  if (!b.includes('"hats & headwear"')) continue;

  const name = b.match(/name: "([^"]+)"/)?.[1] || `id-${id}`;
  const paths = [];
  const add = (m) => {
    if (m && m[1]) paths.push(m[1]);
  };

  add(b.match(/image: "([^"]+)"/));
  add(b.match(/hoverImage: "([^"]+)"/));

  const all = [...b.matchAll(/"(shop\/Accesories\/Hats-Headwear\/Puma\/[^"]+\.png)"/g)].map((x) => x[1]);
  paths.push(...all);

  const unique = [...new Set(paths)];
  const missing = unique.filter((p) => !existsSync(`src/assets/${p}`));
  if (missing.length) {
    console.log(`${id} | ${name} | missing: ${missing.length}`);
    for (const p of missing) console.log(`  ${p}`);
  }
}
