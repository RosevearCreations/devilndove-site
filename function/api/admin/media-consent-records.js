// File: /functions/api/admin/media-consent-records.js
// Brief description: Admin-only media consent registry for customer/job/product photos before public product or social use.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function cleanStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['unknown','requested','granted','revoked','blocked','not_required'].includes(raw) ? raw : 'unknown';
}
function cleanScope(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['product_page','social_post','website_gallery','internal_only','all_public'].includes(raw) ? raw : 'internal_only';
}
function consentKey(sourceType, sourceId, mediaUrl, subjectLabel) {
  const seed = [sourceType, sourceId, mediaUrl, subjectLabel].map((part) => normalizeText(part).toLowerCase()).join('|') || `${Date.now()}-${crypto.randomUUID()}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) { hash = ((hash << 5) - hash) + seed.charCodeAt(index); hash |= 0; }
  return `consent_${Math.abs(hash)}_${Date.now().toString(36)}`;
}
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS media_consent_records (
    consent_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    consent_key TEXT NOT NULL UNIQUE,
    subject_label TEXT,
    source_type TEXT DEFAULT 'general',
    source_id TEXT,
    media_url TEXT,
    consent_status TEXT NOT NULL DEFAULT 'unknown',
    consent_scope TEXT NOT NULL DEFAULT 'internal_only',
    public_use_allowed INTEGER NOT NULL DEFAULT 0,
    social_use_allowed INTEGER NOT NULL DEFAULT 0,
    privacy_notes TEXT,
    reviewed_by_user_id INTEGER,
    expires_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_consent_records_status ON media_consent_records(consent_status, consent_scope, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_media_consent_records_source ON media_consent_records(source_type, source_id, updated_at)`).run().catch(() => null);
}
async function loadRecords(db) {
  await ensureSchema(db);
  const result = await db.prepare(`
    SELECT * FROM media_consent_records
    ORDER BY datetime(COALESCE(updated_at, created_at, '1970-01-01')) DESC
    LIMIT 150
  `).all();
  const records = rows(result);
  const summary = records.reduce((acc, row) => {
    const key = row.consent_status || 'unknown';
    acc.total += 1;
    acc[key] = (acc[key] || 0) + 1;
    if (Number(row.public_use_allowed || 0) === 1) acc.public_allowed += 1;
    if (Number(row.social_use_allowed || 0) === 1) acc.social_allowed += 1;
    return acc;
  }, { total: 0, public_allowed: 0, social_allowed: 0 });
  return { records, summary };
}

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  try {
    const payload = await loadRecords(db);
    return json({ ok: true, ...payload });
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'admin_media_consent', incident_code: 'media_consent_load_failed', severity: 'warning',
      message: error?.message || 'Media consent registry load failed.', details: { error: String(error?.message || error) }
    }).catch(() => null);
    return json({ ok: false, error: error?.message || 'Failed to load media consent records.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  try {
    await ensureSchema(db);
    const body = await request.json().catch(() => ({}));
    const action = normalizeText(body.action || 'create');
    if (action === 'create') {
      const sourceType = normalizeText(body.source_type || 'general').toLowerCase().replace(/[^a-z0-9_-]+/g, '_') || 'general';
      const sourceId = normalizeText(body.source_id);
      const mediaUrl = normalizeText(body.media_url);
      const subjectLabel = normalizeText(body.subject_label) || 'Product/customer media';
      const consentStatus = cleanStatus(body.consent_status);
      const consentScope = cleanScope(body.consent_scope);
      const publicAllowed = ['granted','not_required'].includes(consentStatus) && ['product_page','website_gallery','all_public'].includes(consentScope) ? 1 : Number(body.public_use_allowed || 0) === 1 ? 1 : 0;
      const socialAllowed = ['granted','not_required'].includes(consentStatus) && ['social_post','all_public'].includes(consentScope) ? 1 : Number(body.social_use_allowed || 0) === 1 ? 1 : 0;
      const key = normalizeText(body.consent_key) || consentKey(sourceType, sourceId, mediaUrl, subjectLabel);
      await db.prepare(`
        INSERT INTO media_consent_records (
          consent_key, subject_label, source_type, source_id, media_url, consent_status, consent_scope,
          public_use_allowed, social_use_allowed, privacy_notes, reviewed_by_user_id, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(consent_key) DO UPDATE SET
          subject_label = excluded.subject_label,
          source_type = excluded.source_type,
          source_id = excluded.source_id,
          media_url = excluded.media_url,
          consent_status = excluded.consent_status,
          consent_scope = excluded.consent_scope,
          public_use_allowed = excluded.public_use_allowed,
          social_use_allowed = excluded.social_use_allowed,
          privacy_notes = excluded.privacy_notes,
          reviewed_by_user_id = excluded.reviewed_by_user_id,
          expires_at = excluded.expires_at,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        key, subjectLabel, sourceType, sourceId || null, mediaUrl || null, consentStatus, consentScope,
        publicAllowed, socialAllowed, normalizeText(body.privacy_notes) || null, Number(adminUser.user_id || 0) || null, normalizeText(body.expires_at) || null
      ).run();
      await auditAdminAction(env, request, adminUser, { action_type: 'media_consent_save', target_type: 'media_consent_records', target_key: key, details: { source_type: sourceType, source_id: sourceId, consent_status: consentStatus, consent_scope: consentScope } }).catch(() => null);
      return json({ ok: true, message: 'Media consent record saved.', ...(await loadRecords(db)) });
    }
    if (action === 'update_status') {
      const id = Number(body.consent_record_id || 0);
      if (!id) return json({ ok: false, error: 'consent_record_id is required.' }, 400);
      const consentStatus = cleanStatus(body.consent_status);
      const consentScope = cleanScope(body.consent_scope);
      const publicAllowed = Number(body.public_use_allowed || 0) === 1 ? 1 : 0;
      const socialAllowed = Number(body.social_use_allowed || 0) === 1 ? 1 : 0;
      await db.prepare(`
        UPDATE media_consent_records
        SET consent_status = ?, consent_scope = ?, public_use_allowed = ?, social_use_allowed = ?, privacy_notes = ?, reviewed_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE consent_record_id = ?
      `).bind(consentStatus, consentScope, publicAllowed, socialAllowed, normalizeText(body.privacy_notes) || null, Number(adminUser.user_id || 0) || null, id).run();
      return json({ ok: true, message: 'Media consent record updated.', ...(await loadRecords(db)) });
    }
    return json({ ok: false, error: 'Unknown action.' }, 400);
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'admin_media_consent', incident_code: 'media_consent_save_failed', severity: 'warning',
      message: error?.message || 'Media consent registry save failed.', details: { error: String(error?.message || error) }
    }).catch(() => null);
    return json({ ok: false, error: error?.message || 'Failed to save media consent record.' }, 500);
  }
}
