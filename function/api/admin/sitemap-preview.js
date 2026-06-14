// File: /functions/api/admin/sitemap-preview.js
// Brief description: Admin-only sitemap preview that combines important static pages with live D1 product URLs.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

function normalizeText(value) { return String(value == null ? '' : value).trim(); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function xmlEscape(value) { return normalizeText(value).replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch])); }

const STATIC_PAGES = [
  '/', '/shop/', '/gallery/', '/creations/', '/collections/', '/about/', '/contact/', '/events/', '/pickup/', '/marketplaces/', '/tools/', '/supplies/', '/toolshed/', '/handmade-jewelry-ontario/', '/polymer-clay-earrings-ontario/', '/custom-gifts-southern-ontario/', '/laser-engraving-ontario/', '/vintage-finds-ontario/', '/workshop-made-gifts-ontario/'
];

function baseOrigin(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`.replace(/\/$/, '');
}

async function productUrls(db) {
  if (!db) return { urls: [], warning: 'D1 binding unavailable.' };
  try {
    const result = await db.prepare(`
      SELECT slug, COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) AS lastmod
      FROM products
      WHERE COALESCE(slug,'') <> ''
        AND COALESCE(status,'active') = 'active'
      ORDER BY COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) DESC, product_id DESC
      LIMIT 1000
    `).all();
    return {
      urls: rows(result).map((row) => ({ path: `/shop/product/?slug=${encodeURIComponent(row.slug)}`, lastmod: normalizeText(row.lastmod).slice(0, 10) || null, source: 'd1_product' })),
      warning: ''
    };
  } catch (error) {
    return { urls: [], warning: String(error?.message || error || 'Product sitemap query failed.') };
  }
}

function buildXml(origin, items) {
  const body = items.map((item) => `  <url>\n    <loc>${xmlEscape(origin + item.path)}</loc>${item.lastmod ? `\n    <lastmod>${xmlEscape(item.lastmod)}</lastmod>` : ''}\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const origin = baseOrigin(request);
  const today = new Date().toISOString().slice(0, 10);
  const staticUrls = STATIC_PAGES.map((path) => ({ path, lastmod: today, source: 'static_priority_page' }));
  const live = await productUrls(getDb(env));
  const all = [...staticUrls, ...live.urls];
  const seen = new Set();
  const urls = all.filter((item) => {
    const key = item.path;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const xml = buildXml(origin, urls);
  const url = new URL(request.url);
  if (url.searchParams.get('format') === 'xml') {
    return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  return jsonResponse({
    ok: true,
    generated_at: new Date().toISOString(),
    summary: {
      status: live.warning ? 'warning' : 'ok',
      static_url_count: staticUrls.length,
      product_url_count: live.urls.length,
      total_url_count: urls.length,
      warning: live.warning
    },
    urls: urls.slice(0, 200),
    xml_preview: xml.slice(0, 12000),
    next_action: 'Use this as a live-D1 sitemap preview. Static sitemap.xml still needs to be regenerated/deployed or replaced with a dynamic function route later.'
  }, 200, { 'Cache-Control': 'no-store' });
}
