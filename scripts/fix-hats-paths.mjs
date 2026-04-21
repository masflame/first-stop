import { readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';

const file = 'src/data/pumaProducts.js';
let content = readFileSync(file, 'utf8');

const targets = [
  {
    name: 'BMW M Motorsport Heritage Dad Cap',
    slug: 'bmw-m-motorsport-heritage-dad-cap',
  },
  {
    name: 'McLAREN RACING Baseball Cap',
    slug: 'mclaren-racing-baseball-cap',
  },
  {
    name: 'Prime Graphic Dad Cap',
    slug: 'prime-graphic-dad-cap',
  },
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

for (const t of targets) {
  const marker = `name: "${t.name}"`;
  const start = content.indexOf(marker);
  if (start < 0) {
    console.log('missing block for', t.name);
    continue;
  }
  const nextObj = content.indexOf('\n  {', start + 1);
  const end = nextObj > 0 ? nextObj : content.length;
  const block = content.slice(start, end);

  const absBase = path.join(
    'src/assets/shop/Accesories/Hats-Headwear/Puma',
    t.name,
    t.slug
  );

  const filenameToPath = new Map();
  for (const sub of readdirSync(absBase, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const subDir = path.join(absBase, sub.name);
    for (const f of readdirSync(subDir).filter((n) => n.endsWith('.png'))) {
      filenameToPath.set(
        f,
        `shop/Accesories/Hats-Headwear/Puma/${t.name}/${t.slug}/${sub.name}/${f}`
      );
    }
  }

  const basePrefix = `shop/Accesories/Hats-Headwear/Puma/${t.name}/${t.slug}/`;
  const rx = new RegExp(`${esc(basePrefix)}([^\"\\n]+\\.png)`, 'g');

  const updatedBlock = block.replace(rx, (match, fileName) => {
    return filenameToPath.get(fileName) || match;
  });

  content = content.slice(0, start) + updatedBlock + content.slice(end);
  console.log('patched', t.name, 'with', filenameToPath.size, 'files mapped');
}

writeFileSync(file, content, 'utf8');
console.log('done');
