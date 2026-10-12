// Copie un point d'entrée dans dist/ : Hostinger peut résoudre le « Fichier d'entrée »
// depuis la racine du projet (server.mjs) ou depuis le répertoire de sortie (dist/server.mjs).
import { writeFileSync } from 'node:fs';

writeFileSync(
  'dist/server.mjs',
  "// Généré par scripts/postbuild.mjs : démarre le serveur Astro.\nimport './server/entry.mjs';\n",
);
console.log('dist/server.mjs créé');
