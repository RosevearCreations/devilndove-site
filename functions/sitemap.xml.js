// File: /functions/sitemap.xml.js
// Brief description: Generates a basic XML sitemap including public pages and active product URLs.

function xml(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;
  const staticPaths = ['/', '/about/', '/gallery/', '/creations/', '/tools/', '/supplies/', '/movies/', '/contact/', '/shop/', '/login/', '/register/'];
  const products = await env.DB.prepare(`SELECT slug, updated_at FROM products WHERE status = 'active' ORDER BY updated_at DESC`).all();
  const productUrls = (products.results || []).map((row) => ({
    loc: `${origin}/shop/product/?slug=${encodeURIComponent(row.slug || '')}`,
    lastmod: row.updated_at || null
  }));
  const urls = staticPaths.map((path) => ({ loc: `${origin}${path}`, lastmod: null })).concat(productUrls);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${String(u.lastmod).replace(' ', 'T')}Z</lastmod>` : ''}</url>`).join('
')}
</urlset>`;
  return xml(body);
}
