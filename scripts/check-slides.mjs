import { readFileSync } from 'fs';

const content = readFileSync('src/data/pumaProducts.js', 'utf8');

for (let id = 133; id <= 161; id++) {
  const marker = `id: ${id},`;
  const nextMarker = `id: ${id + 1},`;
  const s = content.indexOf(marker);
  const e = id < 161 ? content.indexOf(nextMarker) : s + 500;
  if (s < 0) { console.log(id, 'NOT FOUND'); continue; }
  const block = content.substring(s, e);
  const name = block.match(/name: "([^"]+)"/)?.[1];
  const img = block.match(/image: "([^"]+)"/)?.[1];
  const cat = block.match(/category: \[([^\]]+)\]/)?.[1];
  console.log(id, name, `[${cat}]`, '->', img?.substring(0, 65));
}
