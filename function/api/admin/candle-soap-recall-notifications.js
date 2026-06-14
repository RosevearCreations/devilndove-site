// File: /functions/api/admin/candle-soap-recall-notifications.js
// Brief description: Admin recall notification queue with release-lock enforcement before status can leave draft/review.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
async function ensure(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS candle_soap_recall_notification_queue (candle_soap_recall_notification_queue_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, recipient_email TEXT, notification_status TEXT NOT NULL DEFAULT 'draft', subject TEXT, body TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS recall_notification_locks (recall_notification_lock_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, recall_id INTEGER, lock_status TEXT NOT NULL DEFAULT 'locked_pending_review', required_review_status TEXT NOT NULL DEFAULT 'approved', matching_review_id INTEGER, last_checked_at TEXT DEFAULT CURRENT_TIMESTAMP, checked_by_user_id INTEGER, notes TEXT, UNIQUE(batch_number, recall_id))`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS recall_notification_release_gates (recall_notification_release_gate_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, recall_id INTEGER, copy_review_status TEXT NOT NULL DEFAULT 'needs_review', signature_status TEXT NOT NULL DEFAULT 'needs_review', customer_match_status TEXT NOT NULL DEFAULT 'needs_review', release_status TEXT NOT NULL DEFAULT 'blocked', gate_notes TEXT, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(batch_number, recall_id))`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS recall_endpoint_gate_checks (recall_endpoint_gate_check_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, endpoint_path TEXT NOT NULL DEFAULT '/api/admin/candle-soap-recall-notifications', legacy_lock_status TEXT, release_gate_status TEXT, endpoint_gate_status TEXT NOT NULL DEFAULT 'blocked', checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run().catch(() => null);
}
async function hasReleaseLock(db, batchNumber, userId = null) {
  const legacy = await db.prepare(`SELECT lock_status FROM recall_notification_locks WHERE batch_number=? ORDER BY last_checked_at DESC LIMIT 1`).bind(batchNumber).first().catch(() => null);
  const release = await db.prepare(`SELECT release_status FROM recall_notification_release_gates WHERE batch_number=? ORDER BY checked_at DESC LIMIT 1`).bind(batchNumber).first().catch(() => null);
  const allowed = lc(legacy?.lock_status) === 'release_allowed' && lc(release?.release_status) === 'release_allowed';
  await db.prepare(`INSERT INTO recall_endpoint_gate_checks (batch_number, legacy_lock_status, release_gate_status, endpoint_gate_status, checked_by_user_id, checked_at, notes) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(batchNumber, legacy?.lock_status || 'missing', release?.release_status || 'missing', allowed ? 'release_allowed' : 'blocked', userId, allowed ? 'Both recall gate systems allowed release.' : 'Blocked: legacy recall lock and Build 179 release gate must both be release_allowed.').run().catch(() => null);
  return allowed;
}
export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env); if (!user) return json({ ok:false, error:'Unauthorized.' }, 401);
  const db = getDb(context.env); if (!db) return json({ ok:false, error:'Database binding is missing.' }, 500);
  await ensure(db);
  const queue = rows(await db.prepare(`SELECT * FROM candle_soap_recall_notification_queue ORDER BY updated_at DESC LIMIT 100`).all().catch(() => ({ results: [] })));
  return json({ ok:true, queue });
}
export async function onRequestPost(context) {
  const user = await getAdminUserFromRequest(context.request, context.env); if (!user) return json({ ok:false, error:'Unauthorized.' }, 401);
  const db = getDb(context.env); if (!db) return json({ ok:false, error:'Database binding is missing.' }, 500);
  await ensure(db);
  let body = {}; try { body = await context.request.json(); } catch { body = {}; }
  const action = lc(body.action || '');
  if (action === 'update_status') {
    const id = Number(body.candle_soap_recall_notification_queue_id || 0);
    const row = await db.prepare(`SELECT * FROM candle_soap_recall_notification_queue WHERE candle_soap_recall_notification_queue_id=? LIMIT 1`).bind(id).first();
    if (!row) return json({ ok:false, error:'Notification draft not found.' }, 404);
    const next = lc(body.notification_status || 'draft');
    if (!['draft','needs_review','review'].includes(next) && !(await hasReleaseLock(db, row.batch_number, Number(user.user_id || 0) || null))) {
      return json({ ok:false, error:'Recall notification cannot leave draft/review until both recall locks and release gates show release_allowed for this batch.' }, 409);
    }
    await db.prepare(`UPDATE candle_soap_recall_notification_queue SET notification_status=?, updated_at=CURRENT_TIMESTAMP WHERE candle_soap_recall_notification_queue_id=?`).bind(next, id).run();
    return json({ ok:true, notification_status: next });
  }
  return json({ ok:false, error:'Unknown action.' }, 400);
}
