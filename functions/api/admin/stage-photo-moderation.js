// File: /functions/api/admin/stage-photo-moderation.js
// Brief description: Dedicated moderation queue for custom order-stage photos before public proof use, with consent matching and proof-candidate generation.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 240) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
async function tableExists(db, tableName) { try { return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first()); } catch { return false; } }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_order_stage_photos (
    custom_order_stage_photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER,
    order_id INTEGER,
    stage_key TEXT NOT NULL DEFAULT 'planning',
    image_url TEXT,
    image_caption TEXT,
    public_use_status TEXT NOT NULL DEFAULT 'internal_review',
    moderation_status TEXT NOT NULL DEFAULT 'needs_review',
    proof_candidate_status TEXT NOT NULL DEFAULT 'not_requested',
    consent_match_status TEXT NOT NULL DEFAULT 'not_checked',
    approved_by_user_id INTEGER,
    approved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  for (const sql of [
    `ALTER TABLE custom_order_stage_photos ADD COLUMN consent_match_status TEXT NOT NULL DEFAULT 'not_checked'`,
    `ALTER TABLE custom_order_stage_photos ADD COLUMN approved_by_user_id INTEGER`,
    `ALTER TABLE custom_order_stage_photos ADD COLUMN approved_at TEXT`
  ]) await db.prepare(sql).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS stage_photo_moderation_events (
    stage_photo_moderation_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_order_stage_photo_id INTEGER NOT NULL,
    action_key TEXT NOT NULL,
    moderation_status TEXT,
    public_use_status TEXT,
    consent_match_status TEXT,
    notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_public_proof_candidates (
    custom_request_public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER,
    order_id INTEGER,
    source_kind TEXT NOT NULL DEFAULT 'stage_photo',
    source_record_id INTEGER,
    image_url TEXT,
    candidate_title TEXT,
    candidate_body TEXT,
    approval_status TEXT NOT NULL DEFAULT 'needs_review',
    trust_block_item_id INTEGER,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}
async function consentMatches(db, photo) {
  if (!photo) return { ok: false, status: 'missing_photo', note: 'Photo record was not found.' };
  if (!(await tableExists(db, 'media_consent_records'))) return { ok: false, status: 'missing_consent_table', note: 'No media consent table exists yet.' };
  const customRequestId = Number(photo.custom_request_id || 0);
  const orderId = Number(photo.order_id || 0);
  const imageUrl = clean(photo.image_url || '', 1200);
  const match = await db.prepare(`SELECT * FROM media_consent_records WHERE LOWER(COALESCE(consent_status,'')) IN ('approved','granted','cleared') AND (COALESCE(approved_for_public_use,0)=1 OR LOWER(COALESCE(consent_scope,'')) IN ('public','public_proof','social_ok','all_public_ok')) AND ((? > 0 AND custom_request_id = ?) OR (? > 0 AND order_id = ?) OR (? != '' AND (source_image_url = ? OR media_url = ? OR image_url = ?))) ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(customRequestId, customRequestId, orderId, orderId, imageUrl, imageUrl, imageUrl, imageUrl).first().catch(() => null);
  if (match) return { ok: true, status: 'matched', note: `Matched consent record #${match.media_consent_record_id || ''}.`, media_consent_record_id: Number(match.media_consent_record_id || 0) || null };
  return { ok: false, status: 'missing_public_consent', note: 'Public-proof approval needs a matching public-use media consent record.' };
}
async function createProofCandidate(db, adminUser, photo, note) {
  const existing = await db.prepare(`SELECT custom_request_public_proof_candidate_id FROM custom_request_public_proof_candidates WHERE source_kind='stage_photo' AND source_record_id=? LIMIT 1`).bind(Number(photo.custom_order_stage_photo_id)).first().catch(() => null);
  if (existing?.custom_request_public_proof_candidate_id) return Number(existing.custom_request_public_proof_candidate_id);
  const title = `Custom work proof - ${clean(photo.stage_key || 'stage photo', 80)}`;
  const body = clean(photo.image_caption || note || 'Approved stage photo ready for public proof review.', 800);
  const result = await db.prepare(`INSERT INTO custom_request_public_proof_candidates (custom_request_id, order_id, source_kind, source_record_id, image_url, candidate_title, candidate_body, approval_status, created_by_user_id, created_at, updated_at) VALUES (?, ?, 'stage_photo', ?, ?, ?, ?, 'needs_review', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(Number(photo.custom_request_id || 0) || null, Number(photo.order_id || 0) || null, Number(photo.custom_order_stage_photo_id), clean(photo.image_url || '', 1200), title, body, Number(adminUser.user_id || 0) || null).run();
  return Number(result?.meta?.last_row_id || 0) || null;
}
export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  const url = new URL(context.request.url);
  const status = clean(url.searchParams.get('status') || 'needs_review', 80);
  const photos = rows(await db.prepare(`SELECT * FROM custom_order_stage_photos WHERE (?='all' OR moderation_status=?) ORDER BY CASE moderation_status WHEN 'needs_review' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, datetime(created_at) DESC LIMIT 200`).bind(status, status).all().catch(() => ({ results: [] })));
  return json({ ok: true, photos, summary: { total: photos.length, needs_review: photos.filter((p) => String(p.moderation_status || '') === 'needs_review').length, approved: photos.filter((p) => String(p.moderation_status || '') === 'approved').length, public_candidates: photos.filter((p) => String(p.proof_candidate_status || '').includes('candidate')).length } });
}
export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  let body = {}; try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const id = Number(body.custom_order_stage_photo_id || 0);
  if (!id) return json({ ok: false, error: 'custom_order_stage_photo_id is required.' }, 400);
  const photo = await db.prepare(`SELECT * FROM custom_order_stage_photos WHERE custom_order_stage_photo_id=? LIMIT 1`).bind(id).first().catch(() => null);
  if (!photo) return json({ ok: false, error: 'Stage photo was not found.' }, 404);
  const action = clean(body.action || 'review', 40);
  const moderation = ['approved','rejected','needs_review'].includes(clean(body.moderation_status, 80)) ? clean(body.moderation_status, 80) : 'needs_review';
  const publicUse = ['internal_review','customer_private','public_proof_ok','blocked'].includes(clean(body.public_use_status, 80)) ? clean(body.public_use_status, 80) : 'internal_review';
  let consent = { ok: true, status: 'not_required', note: 'Private/internal moderation does not need public consent.' };
  if (moderation === 'approved' && publicUse === 'public_proof_ok') {
    consent = await consentMatches(db, photo);
    if (!consent.ok && body.force_without_consent !== true) {
      await db.prepare(`UPDATE custom_order_stage_photos SET consent_match_status=?, updated_at=CURRENT_TIMESTAMP WHERE custom_order_stage_photo_id=?`).bind(consent.status, id).run().catch(() => null);
      return json({ ok: false, error: consent.note, consent_match_status: consent.status, requires_consent: true }, 409);
    }
  }
  let proofStatus = moderation === 'approved' && publicUse === 'public_proof_ok' ? 'ready_for_proof_candidate' : 'not_requested';
  await db.prepare(`UPDATE custom_order_stage_photos SET moderation_status=?, public_use_status=?, proof_candidate_status=?, consent_match_status=?, approved_by_user_id=CASE WHEN ?='approved' THEN ? ELSE approved_by_user_id END, approved_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE approved_at END, updated_at=CURRENT_TIMESTAMP WHERE custom_order_stage_photo_id=?`).bind(moderation, publicUse, proofStatus, consent.status, moderation, Number(adminUser.user_id || 0) || null, moderation, id).run();
  let proofCandidateId = null;
  if (proofStatus === 'ready_for_proof_candidate') {
    proofCandidateId = await createProofCandidate(db, adminUser, { ...photo, moderation_status: moderation, public_use_status: publicUse }, clean(body.notes || consent.note || '', 1000));
    proofStatus = proofCandidateId ? 'proof_candidate_created' : proofStatus;
    await db.prepare(`UPDATE custom_order_stage_photos SET proof_candidate_status=?, updated_at=CURRENT_TIMESTAMP WHERE custom_order_stage_photo_id=?`).bind(proofStatus, id).run().catch(() => null);
  }
  await db.prepare(`INSERT INTO stage_photo_moderation_events (custom_order_stage_photo_id, action_key, moderation_status, public_use_status, consent_match_status, notes, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(id, action, moderation, publicUse, consent.status, clean(body.notes || consent.note || '', 1200), Number(adminUser.user_id || 0) || null).run().catch(() => null);
  return json({ ok: true, message: `Stage photo ${moderation}.`, proof_candidate_status: proofStatus, proof_candidate_id: proofCandidateId, consent_match_status: consent.status });
}
