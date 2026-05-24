// File: /functions/api/admin/social-media-privacy-guard.js
// Brief description: Admin-only privacy/consent guard for social posts made from workshop, job, customer, or process media.
// This keeps social posting review-first and blocks API publishing unless media privacy has been reviewed.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function slugKey(value) { return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function safeJson(value, fallback) { try { return JSON.parse(value || ''); } catch { return fallback; } }

async function tableColumns(db, table) {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all().catch(() => ({ results: [] }));
  return new Set(rows(result).map((row) => String(row.name || '').trim()).filter(Boolean));
}
async function ensureColumn(db, table, column, definition) {
  const cols = await tableColumns(db, table);
  if (cols.has(column)) return false;
  await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run().catch(() => null);
  return true;
}

const DEFAULT_RULES = [
  {
    rule_key: 'customer_faces_or_names',
    display_name: 'Customer faces, names, plates, addresses, or private identifiers',
    applies_to: 'customer_or_job_media',
    default_blocked: 1,
    public_post_allowed: 0,
    consent_status: 'requires_explicit_consent',
    checklist: 'Do not post until the customer has clearly approved the exact photo/video/caption or identifiers are removed.',
    notes: 'Blocks accidental sharing of customer/private details.'
  },
  {
    rule_key: 'workshop_background_private_info',
    display_name: 'Workshop background with receipts, screens, labels, or private paperwork',
    applies_to: 'workshop_process_media',
    default_blocked: 1,
    public_post_allowed: 0,
    consent_status: 'requires_review',
    checklist: 'Check the image background for addresses, order IDs, customer notes, screens, payment info, or private documents.',
    notes: 'Useful for bench/process shots where background clutter can leak private information.'
  },
  {
    rule_key: 'finished_product_only',
    display_name: 'Finished product only — no private/customer details visible',
    applies_to: 'product_media',
    default_blocked: 0,
    public_post_allowed: 1,
    consent_status: 'safe_when_reviewed',
    checklist: 'Confirm the photo only shows the product, packaging, tools, or shop-safe background.',
    notes: 'Safe default for product and gallery posts after visual review.'
  },
  {
    rule_key: 'therapy_or_health_context',
    display_name: 'Personal therapy/health context mentioned in caption',
    applies_to: 'caption_copy',
    default_blocked: 0,
    public_post_allowed: 1,
    consent_status: 'review_wording',
    checklist: 'Keep wording human and honest without sharing more personal health detail than intended.',
    notes: 'Allows process storytelling while avoiding oversharing.'
  },
  {
    rule_key: 'kids_or_visitors_visible',
    display_name: 'Children, visitors, or bystanders visible',
    applies_to: 'people_in_media',
    default_blocked: 1,
    public_post_allowed: 0,
    consent_status: 'requires_explicit_consent',
    checklist: 'Do not post unless each visible person has consented, and avoid posting children without explicit guardian approval.',
    notes: 'High-safety rule for public social sharing.'
  }
];

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS social_media_privacy_rules (
    social_media_privacy_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    applies_to TEXT,
    default_blocked INTEGER NOT NULL DEFAULT 1,
    public_post_allowed INTEGER NOT NULL DEFAULT 0,
    consent_status TEXT NOT NULL DEFAULT 'requires_review',
    checklist TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_media_privacy_rules_active ON social_media_privacy_rules(is_active, default_blocked)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS social_post_privacy_reviews (
    social_post_privacy_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    social_post_queue_id INTEGER NOT NULL,
    privacy_status TEXT NOT NULL DEFAULT 'needs_review',
    customer_media_present INTEGER NOT NULL DEFAULT 0,
    media_consent_required INTEGER NOT NULL DEFAULT 1,
    approved_for_public_post INTEGER NOT NULL DEFAULT 0,
    reviewer_note TEXT,
    reviewed_by_user_id INTEGER,
    reviewed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_social_post_privacy_reviews_queue ON social_post_privacy_reviews(social_post_queue_id, privacy_status)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS social_post_queue (
    social_post_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    social_post_key TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL DEFAULT 'job_update',
    source_id TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    caption TEXT,
    hashtags TEXT,
    target_platforms_json TEXT NOT NULL DEFAULT '[]',
    image_urls_json TEXT NOT NULL DEFAULT '[]',
    approval_status TEXT NOT NULL DEFAULT 'needs_review',
    post_status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);

  await ensureColumn(db, 'social_post_queue', 'privacy_status', "privacy_status TEXT DEFAULT 'needs_review'");
  await ensureColumn(db, 'social_post_queue', 'privacy_notes', 'privacy_notes TEXT');
  await ensureColumn(db, 'social_post_queue', 'media_consent_required', 'media_consent_required INTEGER DEFAULT 1');
  await ensureColumn(db, 'social_post_queue', 'customer_media_present', 'customer_media_present INTEGER DEFAULT 0');
  await ensureColumn(db, 'social_post_queue', 'approved_for_public_post', 'approved_for_public_post INTEGER DEFAULT 0');
  await ensureColumn(db, 'social_post_queue', 'updated_by_user_id', 'updated_by_user_id INTEGER');
  await ensureColumn(db, 'social_post_queue', 'updated_at', 'updated_at TEXT');

  for (const rule of DEFAULT_RULES) {
    await db.prepare(`INSERT INTO social_media_privacy_rules (
      rule_key, display_name, applies_to, default_blocked, public_post_allowed, consent_status, checklist, notes, is_active, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(rule_key) DO UPDATE SET
      display_name = excluded.display_name,
      applies_to = excluded.applies_to,
      default_blocked = excluded.default_blocked,
      public_post_allowed = excluded.public_post_allowed,
      consent_status = excluded.consent_status,
      checklist = excluded.checklist,
      notes = excluded.notes,
      is_active = 1,
      updated_at = CURRENT_TIMESTAMP`).bind(
        rule.rule_key,
        rule.display_name,
        rule.applies_to,
        rule.default_blocked,
        rule.public_post_allowed,
        rule.consent_status,
        rule.checklist,
        rule.notes
      ).run().catch(() => null);
  }
}

function inferPrivacyFromPost(row = {}) {
  const source = slugKey(row.source_type || '');
  const text = `${row.title || ''} ${row.summary || ''} ${row.caption || ''} ${row.notes || ''}`.toLowerCase();
  const images = safeJson(row.image_urls_json, []);
  const likelyCustomer = /customer|client|job|order|pickup|address|plate|vehicle|repair|custom/i.test(`${source} ${text}`);
  const likelyWorkshop = /process|making|workshop|bench|behind|in_progress|recent_media/i.test(`${source} ${text}`);
  const status = row.privacy_status || (likelyCustomer || likelyWorkshop || images.length ? 'needs_review' : 'no_private_media');
  return {
    privacy_status: status,
    customer_media_present: likelyCustomer ? 1 : Number(row.customer_media_present || 0),
    media_consent_required: likelyCustomer ? 1 : Number(row.media_consent_required ?? (likelyWorkshop ? 1 : 0)),
    approved_for_public_post: Number(row.approved_for_public_post || 0),
    image_count: images.length
  };
}

async function summarize(db) {
  await ensureSchema(db);
  const rules = rows(await db.prepare(`SELECT * FROM social_media_privacy_rules WHERE COALESCE(is_active,1)=1 ORDER BY default_blocked DESC, rule_key`).all().catch(() => ({ results: [] })));
  const queueRows = rows(await db.prepare(`SELECT * FROM social_post_queue WHERE COALESCE(post_status,'draft') IN ('draft','ready','failed') ORDER BY datetime(updated_at) DESC, social_post_queue_id DESC LIMIT 80`).all().catch(() => ({ results: [] })));
  const queue = queueRows.map((row) => ({ ...row, inferred_privacy: inferPrivacyFromPost(row), image_urls: safeJson(row.image_urls_json, []) }));
  const summary = await db.prepare(`SELECT
      COUNT(*) AS open_total,
      SUM(CASE WHEN COALESCE(privacy_status,'needs_review')='approved' OR COALESCE(approved_for_public_post,0)=1 THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN COALESCE(privacy_status,'needs_review') IN ('needs_review','consent_needed') THEN 1 ELSE 0 END) AS needs_review_count,
      SUM(CASE WHEN COALESCE(privacy_status,'needs_review') IN ('blocked','do_not_post') THEN 1 ELSE 0 END) AS blocked_count,
      SUM(CASE WHEN COALESCE(customer_media_present,0)=1 THEN 1 ELSE 0 END) AS customer_media_count
    FROM social_post_queue
    WHERE COALESCE(post_status,'draft') IN ('draft','ready','failed')`).first().catch(() => ({ open_total: 0, approved_count: 0, needs_review_count: 0, blocked_count: 0, customer_media_count: 0 }));
  return { rules, queue, summary };
}

async function updateQueuePrivacy(db, adminUser, payload = {}) {
  const id = Number(payload.social_post_queue_id || 0);
  if (!id) throw new Error('A social_post_queue_id is required.');
  const status = slugKey(payload.privacy_status || 'needs_review');
  const allowed = new Set(['needs_review', 'approved', 'no_private_media', 'consent_needed', 'blocked', 'do_not_post']);
  if (!allowed.has(status)) throw new Error('Choose a valid privacy status.');
  const customerMedia = payload.customer_media_present == null ? null : Number(payload.customer_media_present ? 1 : 0);
  const consentRequired = payload.media_consent_required == null ? null : Number(payload.media_consent_required ? 1 : 0);
  const approved = ['approved', 'no_private_media'].includes(status) ? 1 : 0;
  const notes = normalizeText(payload.privacy_notes || payload.reviewer_note || '');
  await db.prepare(`UPDATE social_post_queue SET
      privacy_status = ?,
      privacy_notes = ?,
      approved_for_public_post = ?,
      customer_media_present = COALESCE(?, customer_media_present, 0),
      media_consent_required = COALESCE(?, media_consent_required, 1),
      updated_by_user_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE social_post_queue_id = ?`).bind(status, notes || null, approved, customerMedia, consentRequired, adminUser.user_id, id).run();
  await db.prepare(`INSERT INTO social_post_privacy_reviews (
      social_post_queue_id, privacy_status, customer_media_present, media_consent_required,
      approved_for_public_post, reviewer_note, reviewed_by_user_id, reviewed_at, updated_at
    ) VALUES (?, ?, COALESCE(?,0), COALESCE(?,1), ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
      id, status, customerMedia, consentRequired, approved, notes || null, adminUser.user_id
    ).run().catch(() => null);
  return { social_post_queue_id: id, privacy_status: status, approved_for_public_post: approved };
}

async function seedRules(db) {
  await ensureSchema(db);
  return { seeded_rules: DEFAULT_RULES.length };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  try {
    return json({ ok: true, ...(await summarize(db)) });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'admin_social_privacy', incident_code: 'social_privacy_guard_get_failed', severity: 'error',
      message: error?.message || 'Social privacy guard failed to load.', details: { error: String(error?.stack || error?.message || error) }, related_user_id: adminUser.user_id
    });
    return json({ ok: false, error: error?.message || 'Social privacy guard failed to load.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  let payload = {};
  try { payload = await context.request.json(); } catch { payload = {}; }
  const action = slugKey(payload.action || 'update_queue_privacy');
  try {
    await ensureSchema(db);
    let result = {};
    if (action === 'seed_rules') result = await seedRules(db);
    else if (action === 'update_queue_privacy') result = await updateQueuePrivacy(db, adminUser, payload);
    else throw new Error(`Unsupported privacy guard action: ${action}`);
    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: `social_privacy_${action}`,
      target_type: 'social_post_queue',
      target_id: result.social_post_queue_id || payload.social_post_queue_id || null,
      details: { action, privacy_status: payload.privacy_status || null }
    });
    return json({ ok: true, message: 'Social media privacy guard updated.', result, ...(await summarize(db)) });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'admin_social_privacy', incident_code: 'social_privacy_guard_post_failed', severity: 'error',
      message: error?.message || 'Social privacy guard update failed.', details: { action, error: String(error?.stack || error?.message || error) }, related_user_id: adminUser.user_id
    });
    return json({ ok: false, error: error?.message || 'Social privacy guard update failed.' }, 500);
  }
}
