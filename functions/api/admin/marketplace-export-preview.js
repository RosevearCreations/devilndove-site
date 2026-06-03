// File: /functions/api/admin/marketplace-export-preview.js
// Brief description: Admin-only marketplace export preview with image validation summary before CSV download.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value) { return normalizeText(value); }
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const channel = clean(url.searchParams.get('channel') || 'etsy').toLowerCase();
  const products = rows(await db.prepare(`SELECT product_id, name, slug, sku, featured_image_url, status, review_status, price_cents, currency FROM products WHERE COALESCE(status,'') != 'archived' ORDER BY product_id DESC LIMIT 80`).all().catch(() => ({ results: [] })));
  const imageRows = rows(await db.prepare(`SELECT product_id, image_url, alt_text, image_role, public_use_status, width_px, height_px, merchandising_score FROM product_images ORDER BY product_id, sort_order ASC`).all().catch(() => ({ results: [] })));
  const grouped = new Map();
  imageRows.forEach((row) => { const id = Number(row.product_id || 0); if (!grouped.has(id)) grouped.set(id, []); grouped.get(id).push(row); });
  const previews = products.map((product) => {
    const imgs = grouped.get(Number(product.product_id || 0)) || [];
    const hasMain = !!clean(product.featured_image_url) || imgs.some((img) => clean(img.image_url));
    const publicReady = imgs.some((img) => ['product_page_ok','social_ok','all_public_ok'].includes(String(img.public_use_status || '').toLowerCase()));
    const altReady = imgs.every((img) => !clean(img.image_url) || clean(img.alt_text).length >= 8);
    return { product_id: Number(product.product_id || 0), name: product.name || '', slug: product.slug || '', sku: product.sku || '', channel, ok: hasMain && publicReady && altReady, image_count: imgs.length, has_main_image: hasMain, public_ready_images: imgs.filter((img) => ['product_page_ok','social_ok','all_public_ok'].includes(String(img.public_use_status || '').toLowerCase())).length, alt_ready: altReady, issues: [!hasMain ? 'Missing main image' : '', !publicReady ? 'No public-use-cleared image' : '', !altReady ? 'Some images need alt text' : ''].filter(Boolean) };
  });
  return json({ ok: true, channel, summary: { total: previews.length, ready: previews.filter((row) => row.ok).length, blocked: previews.filter((row) => !row.ok).length }, previews });
}
