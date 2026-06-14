// File: /functions/api/admin/testimonial-trust-blocks.js
// Brief description: Admin workflow for approved testimonial and local trust block items.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 1200) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function intValue(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? Math.round(n) : fallback; }
function boolInt(value) { return value === true || value === 1 || value === '1' || String(value || '').toLowerCase() === 'true' ? 1 : 0; }
function itemKind(value) { const kind = clean(value, 40).toLowerCase(); return ['testimonial', 'local_proof', 'policy', 'process_note', 'buyer_note'].includes(kind) ? kind : 'testimonial'; }
function itemStatus(value) { const status = clean(value, 40).toLowerCase(); return ['draft', 'reviewing', 'approved', 'published', 'archived'].includes(status) ? status : 'draft'; }
function contextKey(value) { const key = clean(value, 80).toLowerCase().replace(/[^a-z0-9_/-]+/g, '_').replace(/^_+|_+$/g, ''); return key || 'sitewide'; }
function ratingText(value) { const rating = Math.max(1, Math.min(5, intValue(value, 5))); return `${rating}/5`; }

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_reviews (
    product_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    order_id INTEGER,
    user_id INTEGER,
    reviewer_name TEXT,
    reviewer_email TEXT,
    rating INTEGER NOT NULL DEFAULT 5,
    review_text TEXT,
    review_kind TEXT NOT NULL DEFAULT 'testimonial',
    status TEXT NOT NULL DEFAULT 'pending_review',
    is_featured INTEGER NOT NULL DEFAULT 0,
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS trust_block_items (
    trust_block_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_product_review_id INTEGER,
    item_kind TEXT NOT NULL DEFAULT 'testimonial',
    display_context TEXT NOT NULL DEFAULT 'sitewide',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    attribution_label TEXT,
    rating_label TEXT,
    related_product_id INTEGER,
    related_product_slug TEXT,
    related_product_name TEXT,
    locality_label TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    is_featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    approved_for_public_use INTEGER NOT NULL DEFAULT 0,
    privacy_review_status TEXT NOT NULL DEFAULT 'needs_review',
    internal_notes TEXT,
    created_by_user_id INTEGER,
    approved_by_user_id INTEGER,
    approved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  const alterStatements = [
    `ALTER TABLE trust_block_items ADD COLUMN source_product_review_id INTEGER`,
    `ALTER TABLE trust_block_items ADD COLUMN item_kind TEXT NOT NULL DEFAULT 'testimonial'`,
    `ALTER TABLE trust_block_items ADD COLUMN display_context TEXT NOT NULL DEFAULT 'sitewide'`,
    `ALTER TABLE trust_block_items ADD COLUMN title TEXT`,
    `ALTER TABLE trust_block_items ADD COLUMN body TEXT`,
    `ALTER TABLE trust_block_items ADD COLUMN attribution_label TEXT`,
    `ALTER TABLE trust_block_items ADD COLUMN rating_label TEXT`,
    `ALTER TABLE trust_block_items ADD COLUMN related_product_id INTEGER`,
    `ALTER TABLE trust_block_items ADD COLUMN related_product_slug TEXT`,
    `ALTER TABLE trust_block_items ADD COLUMN related_product_name TEXT`,
    `ALTER TABLE trust_block_items ADD COLUMN locality_label TEXT`,
    `ALTER TABLE trust_block_items ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'`,
    `ALTER TABLE trust_block_items ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE trust_block_items ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE trust_block_items ADD COLUMN approved_for_public_use INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE trust_block_items ADD COLUMN privacy_review_status TEXT NOT NULL DEFAULT 'needs_review'`,
    `ALTER TABLE trust_block_items ADD COLUMN internal_notes TEXT`,
    `ALTER TABLE trust_block_items ADD COLUMN created_by_user_id INTEGER`,
    `ALTER TABLE trust_block_items ADD COLUMN approved_by_user_id INTEGER`,
    `ALTER TABLE trust_block_items ADD COLUMN approved_at TEXT`,
    `ALTER TABLE trust_block_items ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE trust_block_items ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP`
  ];
  for (const sql of alterStatements) await db.prepare(sql).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_trust_block_items_public ON trust_block_items(status, approved_for_public_use, is_featured, display_context, sort_order)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_trust_block_items_review ON trust_block_items(status, privacy_review_status, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_reviews_admin_status ON product_reviews(status, is_featured, created_at)`).run().catch(() => null);
}

async function listPayload(db) {
  await ensureSchema(db);
  const reviews = rows(await db.prepare(`
    SELECT pr.product_review_id, pr.product_id, pr.order_id, pr.reviewer_name, pr.reviewer_email, pr.rating,
           pr.review_text, pr.review_kind, pr.status, pr.is_featured, pr.admin_notes, pr.created_at,
           p.name AS product_name, p.slug AS product_slug
    FROM product_reviews pr
    LEFT JOIN products p ON p.product_id = pr.product_id
    ORDER BY CASE LOWER(COALESCE(pr.status,'pending_review')) WHEN 'pending_review' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
             datetime(pr.created_at) DESC, pr.product_review_id DESC
    LIMIT 120
  `).all().catch(() => ({ results: [] })));
  const items = rows(await db.prepare(`
    SELECT trust_block_item_id, source_product_review_id, item_kind, display_context, title, body, attribution_label,
           rating_label, related_product_id, related_product_slug, related_product_name, locality_label, status,
           is_featured, sort_order, approved_for_public_use, privacy_review_status, internal_notes,
           approved_at, created_at, updated_at
    FROM trust_block_items
    ORDER BY CASE status WHEN 'reviewing' THEN 0 WHEN 'draft' THEN 1 WHEN 'approved' THEN 2 WHEN 'published' THEN 3 ELSE 4 END,
             is_featured DESC, sort_order ASC, datetime(updated_at) DESC
    LIMIT 120
  `).all().catch(() => ({ results: [] })));
  const summary = await db.prepare(`SELECT
      COUNT(*) AS item_count,
      SUM(CASE WHEN status IN ('approved','published') AND approved_for_public_use=1 THEN 1 ELSE 0 END) AS public_ready_count,
      SUM(CASE WHEN privacy_review_status!='cleared' THEN 1 ELSE 0 END) AS privacy_review_count,
      SUM(CASE WHEN is_featured=1 THEN 1 ELSE 0 END) AS featured_count
    FROM trust_block_items`).first().catch(() => ({ item_count: 0, public_ready_count: 0, privacy_review_count: 0, featured_count: 0 }));
  return { ok: true, summary, reviews, items };
}

async function createFromReview(db, adminUser, payload = {}) {
  const reviewId = intValue(payload.product_review_id, 0);
  if (!reviewId) throw new Error('Choose a review/testimonial first.');
  const review = await db.prepare(`
    SELECT pr.*, p.name AS product_name, p.slug AS product_slug
    FROM product_reviews pr
    LEFT JOIN products p ON p.product_id = pr.product_id
    WHERE pr.product_review_id=? LIMIT 1
  `).bind(reviewId).first();
  if (!review) throw new Error('Review was not found.');
  if (!['approved', 'published'].includes(String(review.status || '').toLowerCase())) {
    throw new Error('Approve the review before turning it into a public trust block.');
  }
  const title = clean(payload.title || `${review.review_kind === 'review' ? 'Buyer review' : 'Customer testimonial'}${review.product_name ? `: ${review.product_name}` : ''}`, 180);
  const body = clean(payload.body || review.review_text, 700);
  if (!body) throw new Error('Trust block body text is required.');
  const status = itemStatus(payload.status || 'reviewing');
  const isPublic = boolInt(payload.approved_for_public_use);
  await db.prepare(`INSERT INTO trust_block_items (
    source_product_review_id, item_kind, display_context, title, body, attribution_label, rating_label,
    related_product_id, related_product_slug, related_product_name, locality_label, status, is_featured,
    sort_order, approved_for_public_use, privacy_review_status, internal_notes, created_by_user_id,
    approved_by_user_id, approved_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    reviewId,
    itemKind(payload.item_kind || review.review_kind || 'testimonial'),
    contextKey(payload.display_context || 'sitewide'),
    title,
    body,
    clean(payload.attribution_label || review.reviewer_name || 'Devil n Dove customer', 120) || null,
    clean(payload.rating_label || ratingText(review.rating), 40) || null,
    Number(review.product_id || 0) || null,
    clean(review.product_slug || '', 160) || null,
    clean(review.product_name || '', 180) || null,
    clean(payload.locality_label || 'Southern Ontario', 120) || null,
    status,
    boolInt(payload.is_featured),
    intValue(payload.sort_order, 0),
    isPublic,
    isPublic ? 'cleared' : 'needs_review',
    clean(payload.internal_notes || 'Created from approved product review.', 1200) || null,
    Number(adminUser.user_id || 0),
    isPublic ? Number(adminUser.user_id || 0) : null,
    isPublic
  ).run();
  return { created: 1 };
}

async function saveItem(db, adminUser, payload = {}) {
  const id = intValue(payload.trust_block_item_id, 0);
  const title = clean(payload.title, 180);
  const body = clean(payload.body, 900);
  if (!title) throw new Error('Title is required.');
  if (!body) throw new Error('Body text is required.');
  const nextStatus = itemStatus(payload.status);
  const isPublic = boolInt(payload.approved_for_public_use);
  const privacyStatus = clean(payload.privacy_review_status || (isPublic ? 'cleared' : 'needs_review'), 60).toLowerCase();
  const approvedBy = isPublic && ['approved', 'published'].includes(nextStatus) ? Number(adminUser.user_id || 0) : null;
  if (id > 0) {
    await db.prepare(`UPDATE trust_block_items SET
      item_kind=?, display_context=?, title=?, body=?, attribution_label=?, rating_label=?, related_product_slug=?, related_product_name=?, locality_label=?,
      status=?, is_featured=?, sort_order=?, approved_for_public_use=?, privacy_review_status=?, internal_notes=?,
      approved_by_user_id=COALESCE(?, approved_by_user_id), approved_at=CASE WHEN ?=1 AND approved_at IS NULL THEN CURRENT_TIMESTAMP ELSE approved_at END,
      updated_at=CURRENT_TIMESTAMP
      WHERE trust_block_item_id=?`).bind(
      itemKind(payload.item_kind), contextKey(payload.display_context), title, body, clean(payload.attribution_label, 120) || null, clean(payload.rating_label, 40) || null,
      clean(payload.related_product_slug, 160) || null, clean(payload.related_product_name, 180) || null, clean(payload.locality_label, 120) || null,
      nextStatus, boolInt(payload.is_featured), intValue(payload.sort_order, 0), isPublic, privacyStatus || 'needs_review', clean(payload.internal_notes, 1200) || null,
      approvedBy, isPublic, id
    ).run();
    return { saved: 1, trust_block_item_id: id };
  }
  const result = await db.prepare(`INSERT INTO trust_block_items (
    item_kind, display_context, title, body, attribution_label, rating_label, related_product_slug, related_product_name,
    locality_label, status, is_featured, sort_order, approved_for_public_use, privacy_review_status, internal_notes,
    created_by_user_id, approved_by_user_id, approved_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    itemKind(payload.item_kind), contextKey(payload.display_context), title, body, clean(payload.attribution_label, 120) || null, clean(payload.rating_label, 40) || null,
    clean(payload.related_product_slug, 160) || null, clean(payload.related_product_name, 180) || null, clean(payload.locality_label, 120) || 'Southern Ontario',
    nextStatus, boolInt(payload.is_featured), intValue(payload.sort_order, 0), isPublic, privacyStatus || 'needs_review', clean(payload.internal_notes, 1200) || null,
    Number(adminUser.user_id || 0), approvedBy, isPublic
  ).run();
  return { saved: 1, trust_block_item_id: Number(result?.meta?.last_row_id || 0) || null };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try { return jsonResponse(await listPayload(db), 200, { 'Cache-Control': 'no-store' }); }
  catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'admin_trust_blocks', incident_code: 'trust_blocks_list_failed', severity: 'error', message: error?.message || 'Trust block list failed.', related_user_id: adminUser.user_id, details: { error: String(error?.stack || error?.message || error) } }).catch(() => null);
    return jsonResponse({ ok: false, error: error?.message || 'Could not load testimonial/trust blocks.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  let payload = {};
  try { payload = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = clean(payload.action || 'save_item', 80).toLowerCase();
  try {
    await ensureSchema(db);
    let result = {};
    if (action === 'create_from_review') result = await createFromReview(db, adminUser, payload);
    else if (action === 'save_item') result = await saveItem(db, adminUser, payload);
    else throw new Error('Unknown testimonial/trust block action.');
    await auditAdminAction(context.env, context.request, adminUser, { action_type: `trust_block_${action}`, target_type: 'trust_block_item', target_id: result.trust_block_item_id || null, details: { ...result, action } }).catch(() => null);
    return jsonResponse({ ok: true, message: action === 'create_from_review' ? 'Trust block created from approved review.' : 'Trust block saved.', ...result, ...(await listPayload(db)) }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'admin_trust_blocks', incident_code: 'trust_block_save_failed', severity: 'error', message: error?.message || 'Trust block save failed.', related_user_id: adminUser.user_id, details: { error: String(error?.stack || error?.message || error), action } }).catch(() => null);
    return jsonResponse({ ok: false, error: error?.message || 'Could not save testimonial/trust block.' }, 500);
  }
}
