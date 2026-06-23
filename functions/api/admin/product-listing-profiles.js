// File: /functions/api/admin/product-listing-profiles.js
// Brief description: Admin-only listing facts for buyer-facing product highlights, dimensions, care, variation notes, and optional approved product video.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function id(value) { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : 0; }
function trim(value, limit) { return normalizeText(value).slice(0, limit); }
function safeHttps(value) { const text = normalizeText(value); if (!text) return ''; try { const url = new URL(text); return url.protocol === 'https:' ? url.toString() : ''; } catch { return ''; } }
function profileStatus(value) { const text = normalizeText(value).toLowerCase(); return ['draft','review','approved','published','blocked'].includes(text) ? text : 'draft'; }

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_listing_profiles (
    product_listing_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL UNIQUE,
    best_for_text TEXT,
    materials_text TEXT,
    finish_text TEXT,
    dimensions_text TEXT,
    care_summary TEXT,
    handmade_variation_note TEXT,
    availability_note TEXT,
    shipping_pickup_note TEXT,
    product_video_url TEXT,
    profile_status TEXT NOT NULL DEFAULT 'draft',
    internal_notes TEXT,
    created_by_user_id INTEGER,
    updated_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_product_listing_profiles_status ON product_listing_profiles(profile_status, updated_at DESC)').run();
}

async function payload(db) {
  await ensureSchema(db);
  const products = rows(await db.prepare(`
    SELECT p.product_id, p.name, p.slug, p.sku, p.status, p.product_category, p.merchandise_origin,
           p.featured_image_url, p.updated_at, lp.product_listing_profile_id, lp.best_for_text,
           lp.materials_text, lp.finish_text, lp.dimensions_text, lp.care_summary,
           lp.handmade_variation_note, lp.availability_note, lp.shipping_pickup_note,
           lp.product_video_url, lp.profile_status, lp.internal_notes, lp.updated_at AS profile_updated_at
    FROM products p
    LEFT JOIN product_listing_profiles lp ON lp.product_id = p.product_id
    WHERE COALESCE(p.status,'draft') <> 'archived'
    ORDER BY datetime(COALESCE(p.updated_at,p.created_at,CURRENT_TIMESTAMP)) DESC, p.product_id DESC
    LIMIT 400
  `).all().catch(() => ({ results: [] })));
  const summary = {
    total_products: products.length,
    with_profile: products.filter((row) => Number(row.product_listing_profile_id || 0) > 0).length,
    approved_profiles: products.filter((row) => ['approved','published'].includes(String(row.profile_status || '').toLowerCase())).length,
    missing_dimensions: products.filter((row) => Number(row.product_listing_profile_id || 0) > 0 && !normalizeText(row.dimensions_text)).length,
    missing_care: products.filter((row) => Number(row.product_listing_profile_id || 0) > 0 && !normalizeText(row.care_summary)).length
  };
  return { ok: true, products, summary };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok:false, error:'Database binding is not configured.' }, 500);
  try { return jsonResponse(await payload(db), 200, { 'Cache-Control':'no-store' }); }
  catch (error) { return jsonResponse({ ok:false, error:'Listing profiles are temporarily unavailable.' }, 503); }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return jsonResponse({ ok:false, error:'Database binding is not configured.' }, 500);
  let body = {}; try { body = await request.json(); } catch { return jsonResponse({ ok:false, error:'Invalid JSON body.' }, 400); }
  const productId = id(body.product_id);
  if (!productId) return jsonResponse({ ok:false, error:'Choose a product first.' }, 400);
  try {
    await ensureSchema(db);
    const product = await db.prepare('SELECT product_id, name FROM products WHERE product_id=? LIMIT 1').bind(productId).first();
    if (!product) return jsonResponse({ ok:false, error:'Product was not found.' }, 404);
    const video = safeHttps(body.product_video_url);
    if (normalizeText(body.product_video_url) && !video) return jsonResponse({ ok:false, error:'Product video must use a valid HTTPS URL.' }, 400);
    const values = {
      best_for_text: trim(body.best_for_text, 420), materials_text: trim(body.materials_text, 1200),
      finish_text: trim(body.finish_text, 420), dimensions_text: trim(body.dimensions_text, 420),
      care_summary: trim(body.care_summary, 1200), handmade_variation_note: trim(body.handmade_variation_note, 800),
      availability_note: trim(body.availability_note, 420), shipping_pickup_note: trim(body.shipping_pickup_note, 800),
      product_video_url: video, profile_status: profileStatus(body.profile_status), internal_notes: trim(body.internal_notes, 1200)
    };
    await db.prepare(`INSERT INTO product_listing_profiles (
      product_id,best_for_text,materials_text,finish_text,dimensions_text,care_summary,handmade_variation_note,
      availability_note,shipping_pickup_note,product_video_url,profile_status,internal_notes,created_by_user_id,updated_by_user_id,created_at,updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(product_id) DO UPDATE SET
      best_for_text=excluded.best_for_text, materials_text=excluded.materials_text, finish_text=excluded.finish_text,
      dimensions_text=excluded.dimensions_text, care_summary=excluded.care_summary, handmade_variation_note=excluded.handmade_variation_note,
      availability_note=excluded.availability_note, shipping_pickup_note=excluded.shipping_pickup_note,
      product_video_url=excluded.product_video_url, profile_status=excluded.profile_status, internal_notes=excluded.internal_notes,
      updated_by_user_id=excluded.updated_by_user_id, updated_at=CURRENT_TIMESTAMP
    `).bind(productId, values.best_for_text || null, values.materials_text || null, values.finish_text || null,
      values.dimensions_text || null, values.care_summary || null, values.handmade_variation_note || null,
      values.availability_note || null, values.shipping_pickup_note || null, values.product_video_url || null,
      values.profile_status, values.internal_notes || null, Number(adminUser.user_id || 0) || null, Number(adminUser.user_id || 0) || null).run();
    await auditAdminAction(env, request, adminUser, { action_type:'save_product_listing_profile', target_type:'product', target_id:productId, target_key:String(product.name || productId), details:{ profile_status:values.profile_status, has_video:Boolean(values.product_video_url) } });
    return jsonResponse({ ...(await payload(db)), message:'Product listing profile saved.' }, 200, { 'Cache-Control':'no-store' });
  } catch (error) { return jsonResponse({ ok:false, error:'Could not save product listing profile.' }, 500); }
}
