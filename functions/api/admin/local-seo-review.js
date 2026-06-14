// File: /functions/api/admin/local-seo-review.js
// Brief description: Admin local SEO landing-page review queue for major Devil n Dove categories and services.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 240) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_seo_landing_page_reviews (
    local_seo_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_path TEXT NOT NULL UNIQUE,
    page_label TEXT,
    target_keyword TEXT,
    target_locality TEXT,
    review_status TEXT NOT NULL DEFAULT 'needs_review',
    h1_status TEXT NOT NULL DEFAULT 'unchecked',
    title_meta_status TEXT NOT NULL DEFAULT 'unchecked',
    internal_link_status TEXT NOT NULL DEFAULT 'unchecked',
    notes TEXT,
    reviewed_by_user_id INTEGER,
    reviewed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  const defaults = [
    ['/shop/', 'Shop', 'handmade gifts Ontario', 'Southern Ontario'],
    ['/creations/', 'Creations', 'mixed media creations Ontario', 'Southern Ontario'],
    ['/handmade-jewelry-ontario/', 'Handmade jewelry', 'handmade jewelry Ontario', 'Ontario'],
    ['/laser-engraving-ontario/', 'Laser engraving', 'laser engraving Ontario', 'Ontario'],
    ['/custom-candle-making-ontario/', 'Custom candle making', 'custom candles Ontario', 'Ontario'],
    ['/custom-soap-making-ontario/', 'Custom soap making', 'custom soap Ontario', 'Ontario'],
    ['/gift-cards/', 'Gift cards', 'handmade gift cards Ontario', 'Ontario']
  ];
  for (const row of defaults) await db.prepare(`INSERT OR IGNORE INTO local_seo_landing_page_reviews (page_path, page_label, target_keyword, target_locality, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(...row).run().catch(() => null);
}
export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  const reviews = rows(await db.prepare(`SELECT * FROM local_seo_landing_page_reviews ORDER BY CASE review_status WHEN 'needs_review' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, page_path ASC`).all());
  return json({ ok: true, reviews, summary: { total: reviews.length, needs_review: reviews.filter((row) => row.review_status !== 'complete').length } });
}
export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  let body = {}; try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const path = clean(body.page_path, 180);
  if (!path.startsWith('/')) return json({ ok: false, error: 'page_path must start with /.' }, 400);
  await db.prepare(`INSERT INTO local_seo_landing_page_reviews (page_path, page_label, target_keyword, target_locality, review_status, h1_status, title_meta_status, internal_link_status, notes, reviewed_by_user_id, reviewed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(page_path) DO UPDATE SET page_label=excluded.page_label, target_keyword=excluded.target_keyword, target_locality=excluded.target_locality, review_status=excluded.review_status, h1_status=excluded.h1_status, title_meta_status=excluded.title_meta_status, internal_link_status=excluded.internal_link_status, notes=excluded.notes, reviewed_by_user_id=excluded.reviewed_by_user_id, reviewed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP`).bind(path, clean(body.page_label, 120), clean(body.target_keyword, 160), clean(body.target_locality, 120), clean(body.review_status || 'needs_review', 60), clean(body.h1_status || 'unchecked', 60), clean(body.title_meta_status || 'unchecked', 60), clean(body.internal_link_status || 'unchecked', 60), clean(body.notes, 1200), Number(adminUser.user_id || 0) || null).run();
  return json({ ok: true, message: 'Local SEO review row saved.' });
}
