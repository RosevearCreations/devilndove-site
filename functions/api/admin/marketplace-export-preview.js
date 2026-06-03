// File: /functions/api/admin/marketplace-export-preview.js
// Brief description: Admin-only marketplace export preview and CSV download with channel-specific image/listing validation.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value) { return normalizeText(value); }
function csvEscape(value) { const text = String(value ?? ''); return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function csv(data, filename) {
  return new Response(data, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } });
}
const RULES = {
  etsy: { minImages: 3, needsPrice: true, needsSku: true, needsTags: true, minAlt: 10, label: 'Etsy' },
  facebook: { minImages: 1, needsPrice: true, needsSku: false, needsTags: false, minAlt: 8, label: 'Facebook Marketplace' },
  pinterest: { minImages: 1, needsPrice: false, needsSku: false, needsTags: true, minAlt: 10, label: 'Pinterest' },
  manual: { minImages: 1, needsPrice: false, needsSku: false, needsTags: false, minAlt: 8, label: 'Manual listing' }
};
function issuesFor(product, imgs, channel) {
  const rule = RULES[channel] || RULES.manual;
  const publicImgs = imgs.filter((img) => ['product_page_ok','social_ok','all_public_ok'].includes(String(img.public_use_status || '').toLowerCase()));
  const tags = String(product.keywords || product.product_category || '').split(',').map((x) => x.trim()).filter(Boolean);
  const issues = [];
  if (imgs.length < rule.minImages) issues.push(`Needs at least ${rule.minImages} image(s)`);
  if (!publicImgs.length) issues.push('No public-use-cleared image');
  if (rule.needsPrice && Number(product.price_cents || 0) <= 0) issues.push('Missing price');
  if (rule.needsSku && !clean(product.sku)) issues.push('Missing SKU');
  if (rule.needsTags && tags.length < 3) issues.push('Needs at least 3 tags/keywords');
  if (imgs.some((img) => clean(img.image_url) && clean(img.alt_text).length < rule.minAlt)) issues.push(`Some image alt text is under ${rule.minAlt} characters`);
  if (channel === 'etsy' && String(product.description || product.short_description || '').length < 40) issues.push('Etsy export needs a fuller description');
  return { issues, publicImgs, tags };
}
async function buildPreview(db, channel) {
  const products = rows(await db.prepare(`SELECT p.product_id, p.name, p.slug, p.sku, p.featured_image_url, p.status, p.review_status, p.price_cents, p.currency, p.product_category, p.short_description, p.description, ps.keywords FROM products p LEFT JOIN product_seo ps ON ps.product_id=p.product_id WHERE COALESCE(p.status,'') != 'archived' ORDER BY p.product_id DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const imageRows = rows(await db.prepare(`SELECT product_id, image_url, alt_text, image_role, public_use_status, width_px, height_px, merchandising_score FROM product_images ORDER BY product_id, sort_order ASC`).all().catch(() => ({ results: [] })));
  const grouped = new Map();
  imageRows.forEach((row) => { const id = Number(row.product_id || 0); if (!grouped.has(id)) grouped.set(id, []); grouped.get(id).push(row); });
  return products.map((product) => {
    const imgs = grouped.get(Number(product.product_id || 0)) || [];
    const validated = issuesFor(product, imgs, channel);
    return {
      product_id: Number(product.product_id || 0), name: product.name || '', slug: product.slug || '', sku: product.sku || '', channel,
      ok: validated.issues.length === 0,
      image_count: imgs.length,
      public_ready_images: validated.publicImgs.length,
      export_image_urls: validated.publicImgs.map((img) => img.image_url).slice(0, 10),
      tags: validated.tags.slice(0, 13),
      price_cents: Number(product.price_cents || 0), currency: product.currency || 'CAD',
      category: product.product_category || '', description: product.description || product.short_description || '',
      issues: validated.issues
    };
  });
}
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const channel = clean(url.searchParams.get('channel') || 'etsy').toLowerCase();
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
  return json({ ok: true, channel, rules: RULES[channel], summary: { total: previews.length, ready: previews.filter((row) => row.ok).length, blocked: previews.filter((row) => !row.ok).length }, previews });
}
