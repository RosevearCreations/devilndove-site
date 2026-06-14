// File: /functions/api/admin/trust-block-placements.js
// Brief description: Admin trust-block placement toggles by storefront page/context.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 160) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS trust_block_placements (
    trust_block_placement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_context TEXT NOT NULL UNIQUE,
    placement_label TEXT,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    max_items INTEGER NOT NULL DEFAULT 3,
    item_kind_filter TEXT,
    locality_filter TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  const defaults = [['sitewide','Sitewide footer proof'],['shop','Shop product-card proof'],['creations','Creations proof'],['gift-cards','Gift-card confidence'],['product','Product detail confidence'],['gallery','Gallery proof']];
  for (const [context, label] of defaults) {
    await db.prepare(`INSERT OR IGNORE INTO trust_block_placements (page_context, placement_label, is_enabled, max_items, sort_order, created_at, updated_at) VALUES (?, ?, 1, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(context, label).run().catch(() => null);
  }
}
export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  return json({ ok: true, placements: rows(await db.prepare(`SELECT * FROM trust_block_placements ORDER BY sort_order ASC, page_context ASC`).all()) });
}
export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  let body = {}; try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const pageContext = clean(body.page_context, 80).toLowerCase() || 'sitewide';
  await db.prepare(`INSERT INTO trust_block_placements (page_context, placement_label, is_enabled, max_items, item_kind_filter, locality_filter, sort_order, updated_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(page_context) DO UPDATE SET placement_label=excluded.placement_label, is_enabled=excluded.is_enabled, max_items=excluded.max_items, item_kind_filter=excluded.item_kind_filter, locality_filter=excluded.locality_filter, sort_order=excluded.sort_order, updated_by_user_id=excluded.updated_by_user_id, updated_at=CURRENT_TIMESTAMP`).bind(pageContext, clean(body.placement_label, 120), Number(body.is_enabled) === 0 ? 0 : 1, Math.max(1, Math.min(12, Number(body.max_items || 3) || 3)), clean(body.item_kind_filter, 80) || null, clean(body.locality_filter, 120) || null, Number(body.sort_order || 0) || 0, Number(adminUser.user_id || 0) || null).run();
  return json({ ok: true, message: `Trust placement saved for ${pageContext}.` });
}
