// Copie tarteaucitron.js (node_modules) vers public/tarteaucitron pour l'auto-héberger.
import { cpSync, mkdirSync } from 'node:fs';

const src = 'node_modules/tarteaucitronjs';
const dest = 'public/tarteaucitron';
const files = [
  'tarteaucitron.min.js',
  'tarteaucitron.services.min.js',
  'lang/tarteaucitron.fr.min.js',
  'css/tarteaucitron.min.css',
  'LICENSE',
];

for (const f of files) {
  const out = `${dest}/${f}`;
  mkdirSync(out.slice(0, out.lastIndexOf('/')), { recursive: true });
  cpSync(`${src}/${f}`, out);
}
console.log(`tarteaucitron copié dans ${dest}`);
