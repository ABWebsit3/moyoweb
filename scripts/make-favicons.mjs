// Génère les favicons à partir de la mascotte (src/assets/moyo_transat.png).
// Usage : node scripts/make-favicons.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const src = 'src/assets/moyo_transat.png';
const square = (size, background = { r: 0, g: 0, b: 0, alpha: 0 }, pad = 0) =>
  sharp(src)
    .resize(size - pad * 2, size - pad * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background })
    .png()
    .toBuffer();

const png32 = await square(32);
const png16 = await square(16);
writeFileSync('public/favicon-32x32.png', png32);
writeFileSync('public/icon-192.png', await square(192));
writeFileSync('public/icon-512.png', await square(512));
// iOS n'affiche pas la transparence : fond crème du site.
writeFileSync('public/apple-touch-icon.png', await square(180, { r: 255, g: 250, b: 242, alpha: 1 }, 14));

// favicon.ico contenant des PNG 16 et 32 px (format ICO avec images PNG).
const images = [png16, png32];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map((img, i) => {
  const size = i === 0 ? 16 : 32;
  const e = Buffer.alloc(16);
  e.writeUInt8(size, 0);
  e.writeUInt8(size, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(img.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.length;
  return e;
});
writeFileSync('public/favicon.ico', Buffer.concat([header, ...entries, ...images]));
console.log('Favicons générés dans public/');
