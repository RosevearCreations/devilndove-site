// File: /functions/api/admin/marketplace-export-preview.js
// Brief description: Admin-only marketplace export preview, image selector persistence, validation, and CSV download.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 1200) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function csvEscape(value) { const text = String(value ?? ''); return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function csv(data, filename) { return new Response(data, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } }); }
const RULES = {
  etsy: { minImages: 3, needsPrice: true, needsSku: true, needsTags: true, minAlt: 10, label: 'Etsy', maxImages: 10 },
  facebook: { minImages: 1, needsPrice: true, needsSku: false, needsTags: false, minAlt: 8, label: 'Facebook Marketplace', maxImages: 10 },
  pinterest: { minImages: 1, needsPrice: false, needsSku: false, needsTags: true, minAlt: 10, label: 'Pinterest', maxImages: 5 },
  manual: { minImages: 1, needsPrice: false, needsSku: false, needsTags: false, minAlt: 8, label: 'Manual listing', maxImages: 10 }
};
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_export_image_selections (
    marketplace_export_image_selection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    selected_image_urls_json TEXT,
    selected_product_image_ids_json TEXT,
    notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel, product_id)
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_marketplace_export_image_selections_channel ON marketplace_export_image_selections(channel, product_id)`).run().catch(() => null);
}
function issuesFor(product, imgs, channel, selectedUrls = []) {
  const rule = RULES[channel] || RULES.manual;
  const publicImgs = imgs.filter((img) => ['product_page_ok','social_ok','all_public_ok'].includes(String(img.public_use_status || '').toLowerCase()));
  const chosen = selectedUrls.length ? selectedUrls.map((url) => publicImgs.find((img) => img.image_url === url)).filter(Boolean) : publicImgs;
  const tags = String(product.keywords || product.product_category || '').split(',').map((x) => x.trim()).filter(Boolean);
  const issues = [];
  if (chosen.length < rule.minImages) issues.push(`Needs at least ${rule.minImages} selected public image(s)`);
  if (!publicImgs.length) issues.push('No public-use-cleared image');
  if (rule.needsPrice && Number(product.price_cents || 0) <= 0) issues.push('Missing price');
  if (rule.needsSku && !clean(product.sku, 100)) issues.push('Missing SKU');
  if (rule.needsTags && tags.length < 3) issues.push('Needs at least 3 tags/keywords');
  if (chosen.some((img) => clean(img?.image_url, 1200) && clean(img?.alt_text, 500).length < rule.minAlt)) issues.push(`Selected image alt text is under ${rule.minAlt} characters`);
  if (channel === 'etsy' && String(product.description || product.short_description || '').length < 40) issues.push('Etsy export needs a fuller description');
  return { issues, publicImgs, selectedPublicImgs: chosen.slice(0, rule.maxImages), tags };
}
async function loadSelections(db, channel) {
  const selectionRows = rows(await db.prepare(`SELECT * FROM marketplace_export_image_selections WHERE channel = ?`).bind(channel).all().catch(() => ({ results: [] })));
  const map = new Map();
  for (const row of selectionRows) {
    let urls = [];
    try { urls = JSON.parse(row.selected_image_urls_json || '[]'); } catch { urls = []; }
    map.set(Number(row.product_id || 0), { urls: Array.isArray(urls) ? urls : [], notes: row.notes || '', updated_at: row.updated_at || '' });
  }
  return map;
}
async function buildPreview(db, channel) {
  await ensureSchema(db);
  const selections = await loadSelections(db, channel);
  const products = rows(await db.prepare(`SELECT p.product_id, p.name, p.slug, p.sku, p.featured_image_url, p.status, p.review_status, p.price_cents, p.currency, p.product_category, p.short_description, p.description, ps.keywords FROM products p LEFT JOIN product_seo ps ON ps.product_id = p.product_id WHERE COALESCE(p.status,'') != 'archived' ORDER BY p.product_id DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const imageRows = rows(await db.prepare(`SELECT product_image_id, product_id, image_url, alt_text, image_role, public_use_status, width_px, height_px, merchandising_score FROM product_images ORDER BY product_id, sort_order ASC, product_image_id ASC`).all().catch(() => ({ results: [] })));
  const grouped = new Map();
  imageRows.forEach((row) => { const id = Number(row.product_id || 0); if (!grouped.has(id)) grouped.set(id, []); grouped.get(id).push(row); });
  return products.map((product) => {
    const id = Number(product.product_id || 0);
    const imgs = grouped.get(id) || [];
    const selected = selections.get(id) || { urls: [], notes: '' };
    const validated = issuesFor(product, imgs, channel, selected.urls || []);
    return { product_id: id, name: product.name || '', slug: product.slug || '', sku: product.sku || '', channel, ok: validated.issues.length === 0, image_count: imgs.length, public_ready_images: validated.publicImgs.length, available_images: validated.publicImgs.map((img) => ({ product_image_id: Number(img.product_image_id || 0), image_url: img.image_url || '', alt_text: img.alt_text || '', image_role: img.image_role || '', width_px: Number(img.width_px || 0), height_px: Number(img.height_px || 0) })).slice(0, 20), selected_image_urls: validated.selectedPublicImgs.map((img) => img.image_url), export_image_urls: validated.selectedPublicImgs.map((img) => img.image_url), tags: validated.tags.slice(0, 13), price_cents: Number(product.price_cents || 0), currency: product.currency || 'CAD', category: product.product_category || '', description: product.description || product.short_description || '', issues: validated.issues, selection_notes: selected.notes || '', selection_saved_at: selected.updated_at || '' };
  });
}
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const channel = clean(url.searchParams.get('channel') || 'etsy', 40).toLowerCase();
  if (!RULES[channel]) return json({ ok: false, error: 'Supported channels: etsy, facebook, pinterest, manual.' }, 400);
  const previews = await buildPreview(db, channel);
  if (url.searchParams.get('format') === 'csv') {
    const headers = ['channel','ready','product_id','sku','title','slug','price_cents','currency','category','tags','description','image_1','image_2','image_3','image_4','image_5','issues'];
    const lines = [headers.join(',')];
    previews.forEach((row) => {
      const images = row.export_image_urls.concat(['','','','','']).slice(0,5);
      lines.push([channel, row.ok ? 'yes' : 'no', row.product_id, row.sku, row.name, row.slug, row.price_cents, row.currency, row.category, row.tags.join('|'), row.description, ...images, row.issues.join('|')].map(csvEscape).join(','));
    });
    return csv(lines.join('\n'), `devilndove-${channel}-marketplace-preview.csv`);
  }
  return json({ ok: true, channel, rules: RULES[channel], summary: { total: previews.length, ready: previews.filter((row) => row.ok).length, blocked: previews.filter((row) => !row.ok).length, selected_products: previews.filter((row) => row.selected_image_urls.length > 0).length }, previews });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  let body = {}; try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const channel = clean(body.channel || 'etsy', 40).toLowerCase();
  const productId = Number(body.product_id || 0);
  if (!RULES[channel]) return json({ ok: false, error: 'Supported channels: etsy, facebook, pinterest, manual.' }, 400);
  if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);
  const urls = Array.isArray(body.selected_image_urls) ? body.selected_image_urls.map((url) => clean(url, 1200)).filter(Boolean).slice(0, RULES[channel].maxImages || 10) : [];
  const ids = Array.isArray(body.selected_product_image_ids) ? body.selected_product_image_ids.map((id) => Number(id || 0)).filter(Boolean).slice(0, RULES[channel].maxImages || 10) : [];
  await db.prepare(`INSERT INTO marketplace_export_image_selections (channel, product_id, selected_image_urls_json, selected_product_image_ids_json, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(channel, product_id) DO UPDATE SET selected_image_urls_json = excluded.selected_image_urls_json, selected_product_image_ids_json = excluded.selected_product_image_ids_json, notes = excluded.notes, updated_at = CURRENT_TIMESTAMP`).bind(channel, productId, JSON.stringify(urls), JSON.stringify(ids), clean(body.notes || '', 800), Number(adminUser.user_id || 0) || null).run();
  return json({ ok: true, message: 'Marketplace image selection saved.', channel, product_id: productId, selected_image_urls: urls });
}
