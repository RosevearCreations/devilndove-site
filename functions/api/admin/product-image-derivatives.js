// File: /functions/api/admin/product-image-derivatives.js
// Brief description: Admin product image derivative/crop preview records for R2-ready storefront image variants.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 240) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_image_derivatives (
    product_image_derivative_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_image_id INTEGER NOT NULL,
    product_id INTEGER,
    derivative_kind TEXT NOT NULL DEFAULT 'preview',
    target_width INTEGER NOT NULL DEFAULT 1200,
    target_height INTEGER NOT NULL DEFAULT 1200,
    crop_x REAL NOT NULL DEFAULT 0,
    crop_y REAL NOT NULL DEFAULT 0,
    crop_width REAL NOT NULL DEFAULT 1,
    crop_height REAL NOT NULL DEFAULT 1,
    source_image_url TEXT,
    derivative_url TEXT,
    derivative_status TEXT NOT NULL DEFAULT 'queued',
    notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}
function derivativeUrl(sourceUrl, kind, width, height) {
  const src = clean(sourceUrl, 1200);
  if (!src) return '';
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}dd_variant=${encodeURIComponent(kind)}&w=${encodeURIComponent(width)}&h=${encodeURIComponent(height)}`;
}
export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  const url = new URL(context.request.url);
  const productId = Number(url.searchParams.get('product_id') || 0);
  const imageId = Number(url.searchParams.get('product_image_id') || 0);
  const items = rows(await db.prepare(`SELECT * FROM product_image_derivatives WHERE (?<=0 OR product_id=?) AND (?<=0 OR product_image_id=?) ORDER BY datetime(updated_at) DESC LIMIT 200`).bind(productId, productId, imageId, imageId).all().catch(() => ({ results: [] })));
  return json({ ok: true, derivatives: items, summary: { total: items.length, queued: items.filter((r) => String(r.derivative_status || '') === 'queued').length } });
}
export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  let body = {}; try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const productImageId = Number(body.product_image_id || 0);
  if (!productImageId) return json({ ok: false, error: 'product_image_id is required.' }, 400);
  const image = await db.prepare(`SELECT product_image_id, product_id, image_url, crop_x, crop_y, crop_width, crop_height FROM product_images WHERE product_image_id=? LIMIT 1`).bind(productImageId).first().catch(() => null);
  if (!image) return json({ ok: false, error: 'Product image was not found.' }, 404);
  const kind = clean(body.derivative_kind || 'storefront_square', 80);
  const width = Math.max(300, Math.min(2400, Math.round(number(body.target_width, 1200))));
  const height = Math.max(300, Math.min(2400, Math.round(number(body.target_height, 1200))));
  const cropX = Math.max(0, Math.min(1, number(body.crop_x, image.crop_x ?? 0)));
  const cropY = Math.max(0, Math.min(1, number(body.crop_y, image.crop_y ?? 0)));
  const cropW = Math.max(0.05, Math.min(1, number(body.crop_width, image.crop_width ?? 1)));
  const cropH = Math.max(0.05, Math.min(1, number(body.crop_height, image.crop_height ?? 1)));
  const previewUrl = derivativeUrl(image.image_url, kind, width, height);
  const result = await db.prepare(`INSERT INTO product_image_derivatives (product_image_id, product_id, derivative_kind, target_width, target_height, crop_x, crop_y, crop_width, crop_height, source_image_url, derivative_url, derivative_status, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'preview_ready', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(productImageId, Number(image.product_id || 0), kind, width, height, cropX, cropY, cropW, cropH, image.image_url || '', previewUrl, clean(body.notes || 'Preview derivative record. Replace query-string preview with real R2 derivative when worker image processing is connected.', 800), Number(adminUser.user_id || 0) || null).run();
  return json({ ok: true, message: 'Derivative crop preview recorded.', product_image_derivative_id: Number(result?.meta?.last_row_id || 0), derivative_url: previewUrl });
}
