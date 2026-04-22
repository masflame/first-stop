import { readFileSync, existsSync } from 'fs';

const content = readFileSync('src/data/pumaProducts.js', 'utf8');

function getBlock(id) {
  const s = content.indexOf(`id: ${id},`);
  if (s < 0) return null;
  const e = content.indexOf(`id: ${id + 1},`, s + 1);
  return content.slice(s, e > 0 ? e : content.length);
}

for (let id = 1; id <= 260; id++) {
  const block = getBlock(id);
  if (!block) continue;
  if (!block.includes('"hats & headwear"')) continue;
  const name = block.match(/name: "([^"]+)"/)?.[1] || `id-${id}`;
  const image = block.match(/image: "([^"]+)"/)?.[1] || '';
  const hover = block.match(/hoverImage: "([^"]+)"/)?.[1] || '';
  const imgPath = image ? `src/assets/${image}` : '';
  const hovPath = hover ? `src/assets/${hover}` : '';
  const imgOk = imgPath ? existsSync(imgPath) : false;
  const hovOk = hovPath ? existsSync(hovPath) : false;
  console.log(`${id} | ${name} | image:${imgOk?'OK':'MISS'} | hover:${hovOk?'OK':'MISS'} | ${image}`);
}
