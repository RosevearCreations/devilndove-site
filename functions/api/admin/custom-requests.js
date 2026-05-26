// File: /functions/api/admin/custom-requests.js
// Brief description: Admin review queue for custom gift, engraving, and personalized work requests, including quote/job/product draft conversion.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 1200) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function status(value) { const cleanValue = clean(value, 40).toLowerCase(); return ['new', 'reviewing', 'quote_needed', 'quoted', 'accepted', 'declined', 'archived'].includes(cleanValue) ? cleanValue : 'new'; }
function cents(value) { const n = Number(value); return Number.isFinite(n) ? Math.round(n) : 0; }
function key(prefix) { return `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`; }

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_requests (
    custom_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    request_type TEXT NOT NULL,
    product_interest TEXT,
    deadline_date TEXT,
    budget_cents INTEGER,
    message TEXT NOT NULL,
    attachment_urls_json TEXT DEFAULT '[]',
    consent_to_contact INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    admin_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_quote_drafts (
    custom_request_quote_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL UNIQUE,
    quote_key TEXT NOT NULL UNIQUE,
    quote_status TEXT NOT NULL DEFAULT 'draft',
    title TEXT NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    request_type TEXT,
    requested_deadline TEXT,
    estimated_budget_cents INTEGER NOT NULL DEFAULT 0,
    scope_notes TEXT,
    quote_notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_job_drafts (
    custom_request_job_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL UNIQUE,
    job_key TEXT NOT NULL UNIQUE,
    job_status TEXT NOT NULL DEFAULT 'draft',
    title TEXT NOT NULL,
    source_quote_draft_id INTEGER,
    customer_name TEXT,
    customer_email TEXT,
    work_type TEXT,
    target_due_date TEXT,
    estimated_budget_cents INTEGER NOT NULL DEFAULT 0,
    work_notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_product_drafts (
    custom_request_product_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL UNIQUE,
    product_draft_key TEXT NOT NULL UNIQUE,
    product_draft_status TEXT NOT NULL DEFAULT 'draft',
    suggested_product_name TEXT NOT NULL,
    product_category TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    story_seed TEXT,
    seo_seed_title TEXT,
    seo_seed_description TEXT,
    source_payload_json TEXT DEFAULT '{}',
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_conversion_events (
    custom_request_conversion_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    conversion_type TEXT NOT NULL,
    target_key TEXT,
    target_table TEXT,
    target_id INTEGER,
    event_notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status, created_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email, created_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_request_conversion_events_request ON custom_request_conversion_events(custom_request_id, created_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_quote_drafts_status ON custom_request_quote_drafts(quote_status, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_job_drafts_status ON custom_request_job_drafts(job_status, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_product_drafts_status ON custom_request_product_drafts(product_draft_status, updated_at)`).run().catch(() => null);
}

async function requestById(db, id) {
  return db.prepare(`SELECT * FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(Number(id || 0)).first();
}

function titleForRequest(row) {
  return clean(row?.product_interest || `${row?.request_type || 'Custom request'} for ${row?.name || 'customer'}`, 160) || 'Custom request';
}

function quoteScope(row) {
  return [
    `Original request type: ${row.request_type || 'custom request'}`,
    row.product_interest ? `Product/idea: ${row.product_interest}` : '',
    row.deadline_date ? `Requested deadline: ${row.deadline_date}` : '',
    row.budget_cents ? `Customer budget noted: ${(Number(row.budget_cents || 0) / 100).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}` : '',
    '',
    row.message || ''
  ].filter((part) => part !== '').join('\n');
}

async function listPayload(db) {
  await ensureSchema(db);
  const requests = rows(await db.prepare(`SELECT * FROM custom_requests ORDER BY datetime(created_at) DESC, custom_request_id DESC LIMIT 100`).all().catch(() => ({ results: [] })));
  const summary = await db.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status IN ('new','reviewing','quote_needed') THEN 1 ELSE 0 END) AS open_count,
    SUM(CASE WHEN status='quote_needed' THEN 1 ELSE 0 END) AS quote_needed_count,
    SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) AS accepted_count
    FROM custom_requests`).first().catch(() => ({ total: 0, open_count: 0, quote_needed_count: 0, accepted_count: 0 }));
  const quoteDrafts = rows(await db.prepare(`SELECT * FROM custom_request_quote_drafts ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const jobDrafts = rows(await db.prepare(`SELECT * FROM custom_request_job_drafts ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const productDrafts = rows(await db.prepare(`SELECT * FROM custom_request_product_drafts ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const conversionEvents = rows(await db.prepare(`SELECT * FROM custom_request_conversion_events ORDER BY datetime(created_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const customerHistory = rows(await db.prepare(`SELECT email, COUNT(*) AS request_count, MAX(created_at) AS last_request_at FROM custom_requests WHERE COALESCE(email,'') <> '' GROUP BY email HAVING COUNT(*) > 1 ORDER BY request_count DESC, last_request_at DESC LIMIT 50`).all().catch(() => ({ results: [] })));
  return { ok: true, requests, summary, quote_drafts: quoteDrafts, job_drafts: jobDrafts, product_drafts: productDrafts, conversion_events: conversionEvents, customer_history: customerHistory };
}

async function recordConversion(db, adminUser, requestId, type, tableName, targetId, targetKey, notes) {
  await db.prepare(`INSERT INTO custom_request_conversion_events (custom_request_id, conversion_type, target_table, target_id, target_key, event_notes, created_by_user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(Number(requestId || 0), type, tableName, Number(targetId || 0) || null, targetKey || null, notes || null, Number(adminUser.user_id || 0)).run();
}

async function createQuoteDraft(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const existing = await db.prepare(`SELECT * FROM custom_request_quote_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (existing) return { ok: true, message: 'Quote draft already exists.', target_key: existing.quote_key, target_id: existing.custom_request_quote_draft_id };
  const quoteKey = key('quote');
  const insert = await db.prepare(`INSERT INTO custom_request_quote_drafts (
    custom_request_id, quote_key, quote_status, title, customer_name, customer_email, customer_phone, request_type,
    requested_deadline, estimated_budget_cents, scope_notes, quote_notes, created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId), quoteKey, titleForRequest(row), row.name || null, row.email || null, row.phone || null, row.request_type || null,
    row.deadline_date || null, cents(row.budget_cents), quoteScope(row), 'Review materials, labor, pickup/shipping, taxes, and deposit needs before sending.', Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await db.prepare(`UPDATE custom_requests SET status='quote_needed', updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(Number(requestId)).run();
  await recordConversion(db, adminUser, requestId, 'quote_draft', 'custom_request_quote_drafts', targetId, quoteKey, 'Quote draft created from custom request.');
  return { ok: true, message: 'Quote draft created.', target_key: quoteKey, target_id: targetId };
}

async function createJobDraft(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const existing = await db.prepare(`SELECT * FROM custom_request_job_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (existing) return { ok: true, message: 'Job draft already exists.', target_key: existing.job_key, target_id: existing.custom_request_job_draft_id };
  const quote = await db.prepare(`SELECT custom_request_quote_draft_id FROM custom_request_quote_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const jobKey = key('job');
  const insert = await db.prepare(`INSERT INTO custom_request_job_drafts (
    custom_request_id, job_key, job_status, title, source_quote_draft_id, customer_name, customer_email, work_type,
    target_due_date, estimated_budget_cents, work_notes, created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId), jobKey, titleForRequest(row), Number(quote?.custom_request_quote_draft_id || 0) || null, row.name || null, row.email || null,
    row.request_type || 'custom_work', row.deadline_date || null, cents(row.budget_cents), quoteScope(row), Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await db.prepare(`UPDATE custom_requests SET status=CASE WHEN status='new' THEN 'reviewing' ELSE status END, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(Number(requestId)).run();
  await recordConversion(db, adminUser, requestId, 'job_draft', 'custom_request_job_drafts', targetId, jobKey, 'Job draft created from custom request.');
  return { ok: true, message: 'Job draft created.', target_key: jobKey, target_id: targetId };
}

async function createProductDraft(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const existing = await db.prepare(`SELECT * FROM custom_request_product_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (existing) return { ok: true, message: 'Product draft plan already exists.', target_key: existing.product_draft_key, target_id: existing.custom_request_product_draft_id };
  const productKey = key('prodplan');
  const title = titleForRequest(row);
  const story = clean(`Custom request from ${row.name || 'customer'}: ${row.message || ''}`, 1200);
  const seoTitle = clean(`${title} — Custom Devil n Dove request`, 70);
  const seoDescription = clean(`Custom handmade ${row.request_type || 'gift'} idea for Devil n Dove in Southern Ontario. Review materials, sizing, timing, price, and media consent before publishing.`, 160);
  const sourcePayload = JSON.stringify({ custom_request_id: row.custom_request_id, request_key: row.request_key, attachment_urls_json: row.attachment_urls_json || '[]' });
  const insert = await db.prepare(`INSERT INTO custom_request_product_drafts (
    custom_request_id, product_draft_key, product_draft_status, suggested_product_name, product_category, price_cents,
    story_seed, seo_seed_title, seo_seed_description, source_payload_json, created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId), productKey, title, row.request_type || 'custom_work', cents(row.budget_cents), story, seoTitle, seoDescription, sourcePayload, Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await recordConversion(db, adminUser, requestId, 'product_draft_plan', 'custom_request_product_drafts', targetId, productKey, 'Product draft plan created from custom request.');
  return { ok: true, message: 'Product draft plan created.', target_key: productKey, target_id: targetId };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try { return jsonResponse(await listPayload(db), 200, { 'Cache-Control': 'no-store' }); }
  catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'admin_custom_requests', incident_code: 'custom_requests_list_failed', severity: 'error', message: error?.message || 'Custom request list failed.', details: { error: String(error?.stack || error?.message || error) }, related_user_id: adminUser.user_id }).catch(() => null);
    return jsonResponse({ ok: false, error: error?.message || 'Could not load custom requests.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }
  const id = Number(body.custom_request_id || 0);
  if (!id) return jsonResponse({ ok: false, error: 'Choose a custom request first.' }, 400);
  const action = clean(body.action || 'update_review', 80).toLowerCase();
  try {
    await ensureSchema(db);
    let actionResult = null;
    if (action === 'create_quote_draft') actionResult = await createQuoteDraft(db, adminUser, id);
    else if (action === 'create_job_draft') actionResult = await createJobDraft(db, adminUser, id);
    else if (action === 'create_product_draft') actionResult = await createProductDraft(db, adminUser, id);
    else {
      const nextStatus = status(body.status);
      const adminNotes = clean(body.admin_notes || '', 1600);
      await db.prepare(`UPDATE custom_requests SET status=?, admin_notes=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(nextStatus, adminNotes || null, id).run();
      actionResult = { ok: true, message: 'Custom request updated.' };
    }
    if (!actionResult?.ok) return jsonResponse({ ok: false, error: actionResult?.error || 'Custom request action failed.' }, 400);
    await auditAdminAction(context.env, context.request, adminUser, { action_type: action, target_type: 'custom_requests', target_id: id, details: { status: body.status || null, target_key: actionResult.target_key || null } }).catch(() => null);
    const data = await listPayload(db);
    return jsonResponse({ ...data, message: actionResult.message || 'Custom request saved.' }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'admin_custom_requests', incident_code: 'custom_request_action_failed', severity: 'error', message: error?.message || 'Custom request action failed.', details: { error: String(error?.stack || error?.message || error), action }, related_user_id: adminUser.user_id }).catch(() => null);
    return jsonResponse({ ok: false, error: error?.message || 'Could not update custom request.' }, 500);
  }
}
