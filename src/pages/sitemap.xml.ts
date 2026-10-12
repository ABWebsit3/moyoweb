// sitemap.xml généré au build à partir des pages du site (hors 404 et routes /api).
import type { APIRoute } from 'astro';

const pages = Object.keys(import.meta.glob('./**/*.astro'))
  .map((f) => f.replace(/^\.\//, '').replace(/\.astro$/, ''))
  .filter((p) => p !== '404' && !p.startsWith('api/'))
  .map((p) => (p === 'index' ? '/' : `/${p.replace(/\/index$/, '')}/`))
  .sort();

export const GET: APIRoute = ({ site }) => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = pages
    .map((p) => `  <url>\n    <loc>${new URL(p, site)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
