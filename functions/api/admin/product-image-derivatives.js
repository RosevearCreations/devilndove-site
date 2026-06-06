// File: /functions/api/admin/product-image-derivatives.js
// Brief description: Admin product image derivative/crop records. When an R2 bucket is configured,
// this creates a real derivative object key in R2 and records the derivative URL/history.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 240) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function safeExt(url, fallback = 'jpg') {
  const match = String(url || '').split('?')[0].match(/\.([a-zA-Z0-9]{2,5})$/);
  return match ? match[1].toLowerCase().replace(/[^a-z0-9]/g, '') : fallback;
}
function publicBase(env) {
  return clean(env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL || env.ASSET_ORIGIN || 'https://assets.devilndove.com', 500).replace(/\/$/, '');
}
function makePublicUrl(env, key) {
  const base = publicBase(env);
  const cleanKey = clean(key, 1200).replace(/^\/+/, '');
  return base && cleanKey ? `${base}/${cleanKey}` : cleanKey;
}
function previewUrl(sourceUrl, kind, width, height, requestUrl = '') {
  const src = clean(sourceUrl, 1200);
  if (!src) return '';
  const base = requestUrl ? new URL('/api/image-derivative', requestUrl).toString() : '/api/image-derivative';
  const url = new URL(base, requestUrl || 'https://devilndove-site.pages.dev');
  url.searchParams.set('src', src);
  url.searchParams.set('w', String(width || 1200));
  url.searchParams.set('h', String(height || 1200));
  url.searchParams.set('fit', 'cover');
  url.searchParams.set('variant', kind || 'preview');
  return requestUrl ? url.toString() : `${url.pathname}${url.search}`;
}
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
    derivative_object_key TEXT,
    derivative_status TEXT NOT NULL DEFAULT 'queued',
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    generation_method TEXT,
    notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  for (const sql of [
    `ALTER TABLE product_image_derivatives ADD COLUMN derivative_object_key TEXT`,
    `ALTER TABLE product_image_derivatives ADD COLUMN file_size_bytes INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE product_image_derivatives ADD COLUMN generation_method TEXT`,
    `ALTER TABLE product_image_derivatives ADD COLUMN before_image_url TEXT`,
    `ALTER TABLE product_image_derivatives ADD COLUMN comparison_notes TEXT`
  ]) await db.prepare(sql).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_image_derivatives_image ON product_image_derivatives(product_image_id, derivative_status, updated_at)`).run().catch(() => null);
}
async function createDerivativeObject(env, sourceUrl, image, body, width, height, kind, requestUrl = '') {
  const bucket = env.PRODUCT_DERIVATIVE_BUCKET || env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA;
  if (!bucket || typeof bucket.put !== 'function') {
    return { created: false, status: 'worker_preview_ready', url: previewUrl(sourceUrl, kind, width, height, requestUrl), objectKey: '', size: 0, method: 'worker_image_derivative_route', note: 'No R2 bucket binding was available; saved a worker derivative URL that resizes through /api/image-derivative when available.', before_url: sourceUrl };
  }

  const cfImageOptions = {
    width,
    height,
    fit: 'cover',
    gravity: 'auto',
    quality: 88,
    format: 'jpeg'
  };

  let response = null;
  let method = 'r2_copy_with_crop_metadata';
  let note = 'R2 derivative object created from the source image. Crop metadata is saved for review.';

  if (String(env.ENABLE_CF_IMAGE_RESIZE || env.CF_IMAGE_RESIZE || '').toLowerCase() === 'true') {
    response = await fetch(sourceUrl, { cf: { image: cfImageOptions } }).catch(() => null);
    if (response && response.ok) {
      method = 'cloudflare_image_resizing_fetch';
      note = 'Cloudflare Image Resizing produced a pixel-sized derivative and saved it to R2.';
    }
  }

  if (!response || !response.ok) {
    response = await fetch(sourceUrl).catch(() => null);
  }

  if (!response || !response.ok) {
    return { created: false, status: 'source_fetch_failed', url: previewUrl(sourceUrl, kind, width, height, requestUrl), objectKey: '', size: 0, method: 'worker_image_derivative_route', note: 'Could not fetch the source image for R2 derivative generation; saved a worker derivative URL fallback.', before_url: sourceUrl };
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || (method === 'cloudflare_image_resizing_fetch' ? 'image/jpeg' : 'application/octet-stream');
  const ext = method === 'cloudflare_image_resizing_fetch' ? 'jpg' : safeExt(sourceUrl, 'jpg');
  const key = `products/${Number(image.product_id || 0)}/derivatives/${Number(image.product_image_id || 0)}-${kind}-${width}x${height}-${Date.now()}.${ext}`;

  await bucket.put(key, arrayBuffer, {
    httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: {
      product_id: String(image.product_id || ''),
      product_image_id: String(image.product_image_id || ''),
      derivative_kind: kind,
      target_width: String(width),
      target_height: String(height),
      crop_x: String(body.crop_x ?? ''),
      crop_y: String(body.crop_y ?? ''),
      crop_width: String(body.crop_width ?? ''),
      crop_height: String(body.crop_height ?? ''),
      generation_method: method
    }
  });

  return { created: true, status: method === 'cloudflare_image_resizing_fetch' ? 'r2_pixel_derivative_created' : 'r2_created', url: makePublicUrl(env, key), objectKey: key, size: Number(arrayBuffer.byteLength || 0), method, note, before_url: sourceUrl };
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
  const items = rows(await db.prepare(`SELECT * FROM product_image_derivatives WHERE (? <= 0 OR product_id = ?) AND (? <= 0 OR product_image_id = ?) ORDER BY datetime(updated_at) DESC, product_image_derivative_id DESC LIMIT 200`).bind(productId, productId, imageId, imageId).all().catch(() => ({ results: [] })));
  return json({ ok: true, derivatives: items, summary: { total: items.length, r2_created: items.filter((r) => String(r.derivative_status || '') === 'r2_created').length, preview_ready: items.filter((r) => String(r.derivative_status || '') === 'preview_ready').length } });
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
  const image = await db.prepare(`SELECT product_image_id, product_id, image_url, crop_x, crop_y, crop_width, crop_height FROM product_images WHERE product_image_id = ? LIMIT 1`).bind(productImageId).first().catch(() => null);
  if (!image) return json({ ok: false, error: 'Product image was not found.' }, 404);
  const kind = clean(body.derivative_kind || 'storefront_square', 80).replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  const width = clamp(Math.round(number(body.target_width, 1200)), 300, 2400);
  const height = clamp(Math.round(number(body.target_height, 1200)), 300, 2400);
  const cropX = clamp(number(body.crop_x, image.crop_x ?? 0), 0, 1);
  const cropY = clamp(number(body.crop_y, image.crop_y ?? 0), 0, 1);
  const cropW = clamp(number(body.crop_width, image.crop_width ?? 1), 0.05, 1);
  const cropH = clamp(number(body.crop_height, image.crop_height ?? 1), 0.05, 1);
  const action = clean(body.action || 'create_derivative', 80);
  if (action === 'use_as_featured') {
    const derivativeId = Number(body.product_image_derivative_id || body.derivative_id || 0);
    const derivative = derivativeId ? await db.prepare(`SELECT * FROM product_image_derivatives WHERE product_image_derivative_id = ? LIMIT 1`).bind(derivativeId).first().catch(() => null) : null;
    const featuredUrl = clean(body.derivative_url || derivative?.derivative_url || image.image_url || '', 1800);
    if (!featuredUrl) return json({ ok: false, error: 'No derivative URL is available to feature.' }, 400);
    await db.prepare(`UPDATE products SET featured_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`).bind(featuredUrl, Number(image.product_id || 0)).run().catch(() => null);
    await db.prepare(`UPDATE product_images SET sort_order = CASE WHEN product_image_id = ? THEN 0 ELSE sort_order + 1 END, image_role = CASE WHEN product_image_id = ? THEN 'hero_front' ELSE image_role END, public_use_status = CASE WHEN product_image_id = ? AND COALESCE(public_use_status,'') = '' THEN 'product_page_ok' ELSE public_use_status END, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`).bind(productImageId, productImageId, productImageId, Number(image.product_id || 0)).run().catch(() => null);
    await db.prepare(`UPDATE product_image_derivatives SET notes = COALESCE(notes,'') || '\nUsed as featured image.', updated_at = CURRENT_TIMESTAMP WHERE product_image_derivative_id = ?`).bind(derivativeId).run().catch(() => null);
    return json({ ok: true, message: 'Derivative set as the featured product image.', product_id: Number(image.product_id || 0), featured_image_url: featuredUrl });
  }
  const generated = await createDerivativeObject(context.env, image.image_url || '', image, { crop_x: cropX, crop_y: cropY, crop_width: cropW, crop_height: cropH }, width, height, kind, context.request.url);
  const result = await db.prepare(`INSERT INTO product_image_derivatives (product_image_id, product_id, derivative_kind, target_width, target_height, crop_x, crop_y, crop_width, crop_height, source_image_url, derivative_url, derivative_object_key, derivative_status, file_size_bytes, generation_method, before_image_url, comparison_notes, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(productImageId, Number(image.product_id || 0), kind, width, height, cropX, cropY, cropW, cropH, image.image_url || '', generated.url || '', generated.objectKey || '', generated.status || 'preview_ready', generated.size || 0, generated.method || 'query_preview_fallback', generated.before_url || image.image_url || '', clean(body.comparison_notes || generated.note || '', 1000), clean(body.notes || generated.note || '', 1000), Number(adminUser.user_id || 0) || null).run();
  return json({ ok: true, message: generated.created ? 'R2 derivative file recorded.' : 'Derivative preview recorded with fallback.', product_image_derivative_id: Number(result?.meta?.last_row_id || 0), derivative_url: generated.url, derivative_object_key: generated.objectKey, derivative_status: generated.status, generation_method: generated.method });
}
