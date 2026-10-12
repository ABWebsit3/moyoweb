// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Pages pré-générées (statiques) + route serveur /api/devis (Node) pour relayer vers Dolibarr.
export default defineConfig({
  site: 'https://moyoweb.fr',
  adapter: node({ mode: 'standalone' }),
  server: { host: true },
});
