// File: /functions/api/admin/candle-soap-specs.js
// Brief description: Admin editor API for candle/soap product specification rows after product creation.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs (
    custom_candle_soap_product_spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    custom_request_id INTEGER,
    product_kind TEXT NOT NULL DEFAULT 'custom',
    scent_profile TEXT,
    wax_or_base TEXT,
    colour_notes TEXT,
    batch_number TEXT,
    ingredient_notes TEXT,
    allergen_safety_notes TEXT,
    updated_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_candle_soap_product_specs_product ON custom_candle_soap_product_specs(product_id)`).run().catch(() => null);
}
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  const url = new URL(request.url);
  const productId = Number(url.searchParams.get('product_id') || 0);
  const row = productId ? await db.prepare(`SELECT * FROM custom_candle_soap_product_specs WHERE product_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(productId).first() : null;
  return json({ ok: true, spec: row || null });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const productId = Number(body.product_id || 0);
  if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);
  await db.prepare(`INSERT INTO custom_candle_soap_product_specs (product_id, custom_request_id, product_kind, scent_profile, wax_or_base, colour_notes, batch_number, ingredient_notes, allergen_safety_notes, updated_by_user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(product_id) DO UPDATE SET custom_request_id=excluded.custom_request_id, product_kind=excluded.product_kind, scent_profile=excluded.scent_profile, wax_or_base=excluded.wax_or_base, colour_notes=excluded.colour_notes, batch_number=excluded.batch_number, ingredient_notes=excluded.ingredient_notes, allergen_safety_notes=excluded.allergen_safety_notes, updated_by_user_id=excluded.updated_by_user_id, updated_at=CURRENT_TIMESTAMP`).bind(
      productId, Number(body.custom_request_id || 0) || null, normalizeText(body.product_kind || 'custom'), normalizeText(body.scent_profile), normalizeText(body.wax_or_base), normalizeText(body.colour_notes), normalizeText(body.batch_number), normalizeText(body.ingredient_notes), normalizeText(body.allergen_safety_notes), Number(adminUser.user_id || 0)
    ).run();
  return json({ ok: true, message: 'Candle/soap spec saved.' });
}
