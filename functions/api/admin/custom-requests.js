// File: /functions/api/admin/custom-requests.js
// Brief description: Admin review queue for custom gift, engraving, and personalized work requests, including quote/job/product draft conversion, editable quote line items, payment/order draft follow-through, customer reply templates, payment candidates, private quote preview links, and quote revision history.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 1200) { const text = normalizeText(value).replace(/\s+$/g, ''); return text.length > limit ? text.slice(0, limit).trim() : text; }
function status(value) { const cleanValue = clean(value, 40).toLowerCase(); return ['new', 'reviewing', 'quote_needed', 'quoted', 'accepted', 'declined', 'archived'].includes(cleanValue) ? cleanValue : 'new'; }
function cents(value) { const n = Number(value); return Number.isFinite(n) ? Math.round(n) : 0; }
function key(prefix) { return `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`; }
function money(value) { return (Number(value || 0) / 100).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' }); }
async function tableColumnSet(db, tableName) {
  try { const result = await db.prepare(`PRAGMA table_info(${tableName})`).all(); return new Set(rows(result).map((row) => String(row.name || '').toLowerCase()).filter(Boolean)); }
  catch { return new Set(); }
}
async function ensureColumn(db, tableName, columnName, sql) {
  const columns = await tableColumnSet(db, tableName);
  if (!columns.has(String(columnName || '').toLowerCase())) await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${sql}`).run().catch(() => null);
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

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
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_reply_templates (
    custom_request_reply_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    quote_draft_id INTEGER,
    template_key TEXT NOT NULL UNIQUE,
    template_status TEXT NOT NULL DEFAULT 'draft',
    channel TEXT NOT NULL DEFAULT 'email',
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    copied_at TEXT,
    sent_manually_at TEXT,
    created_by_user_id INTEGER,
    updated_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
    FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_payment_candidates (
    custom_request_payment_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    quote_draft_id INTEGER,
    candidate_key TEXT NOT NULL UNIQUE,
    candidate_type TEXT NOT NULL DEFAULT 'deposit',
    candidate_status TEXT NOT NULL DEFAULT 'draft',
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'CAD',
    due_date TEXT,
    description TEXT,
    customer_name TEXT,
    customer_email TEXT,
    source_payload_json TEXT DEFAULT '{}',
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
    FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
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
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_reply_templates_request ON custom_request_reply_templates(custom_request_id, template_status, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_reply_templates_unique_email ON custom_request_reply_templates(custom_request_id, channel)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_quote_share_links (
    custom_request_quote_share_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    quote_draft_id INTEGER,
    share_token TEXT NOT NULL UNIQUE,
    share_status TEXT NOT NULL DEFAULT 'active',
    customer_name TEXT,
    customer_email TEXT,
    title TEXT,
    quote_total_cents INTEGER NOT NULL DEFAULT 0,
    scope_summary TEXT,
    payment_summary_json TEXT DEFAULT '{}',
    expires_at TEXT,
    accepted_at TEXT,
    declined_at TEXT,
    customer_response_note TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
    FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
  )`).run();

  await ensureColumn(db, 'custom_request_quote_drafts', 'material_cost_cents', 'material_cost_cents INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'custom_request_quote_drafts', 'labor_cost_cents', 'labor_cost_cents INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'custom_request_quote_drafts', 'pickup_shipping_cents', 'pickup_shipping_cents INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'custom_request_quote_drafts', 'tax_estimate_cents', 'tax_estimate_cents INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'custom_request_quote_drafts', 'quote_total_cents', 'quote_total_cents INTEGER NOT NULL DEFAULT 0');

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_quote_line_items (
    custom_request_quote_line_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    quote_draft_id INTEGER NOT NULL,
    line_type TEXT NOT NULL DEFAULT 'custom',
    line_label TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit_amount_cents INTEGER NOT NULL DEFAULT 0,
    line_amount_cents INTEGER NOT NULL DEFAULT 0,
    is_taxable INTEGER NOT NULL DEFAULT 1,
    line_status TEXT NOT NULL DEFAULT 'active',
    sort_order INTEGER NOT NULL DEFAULT 100,
    created_by_user_id INTEGER,
    updated_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
    FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_quote_line_items_quote ON custom_request_quote_line_items(quote_draft_id, line_status, sort_order)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_quote_revisions (
    custom_request_quote_revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    quote_draft_id INTEGER,
    revision_type TEXT NOT NULL DEFAULT 'changed',
    revision_status TEXT NOT NULL DEFAULT 'open',
    revision_notes TEXT,
    snapshot_json TEXT DEFAULT '{}',
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
    FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_quote_revisions_request ON custom_request_quote_revisions(custom_request_id, created_at)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_payment_request_drafts (
    custom_request_payment_request_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    quote_draft_id INTEGER,
    share_link_id INTEGER,
    payment_request_key TEXT NOT NULL UNIQUE,
    payment_request_status TEXT NOT NULL DEFAULT 'review_needed',
    request_type TEXT NOT NULL DEFAULT 'deposit',
    amount_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'CAD',
    customer_name TEXT,
    customer_email TEXT,
    due_date TEXT,
    review_notes TEXT,
    source_payload_json TEXT DEFAULT '{}',
    created_by_user_id INTEGER,
    reviewed_by_user_id INTEGER,
    reviewed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
    FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
    FOREIGN KEY (share_link_id) REFERENCES custom_request_quote_share_links(custom_request_quote_share_link_id) ON DELETE SET NULL
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_payment_request_drafts_request ON custom_request_payment_request_drafts(custom_request_id, payment_request_status, updated_at)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_order_drafts (
    custom_request_order_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    quote_draft_id INTEGER,
    share_link_id INTEGER,
    order_draft_key TEXT NOT NULL UNIQUE,
    order_draft_status TEXT NOT NULL DEFAULT 'review_needed',
    customer_name TEXT,
    customer_email TEXT,
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    shipping_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'CAD',
    fulfillment_notes TEXT,
    source_payload_json TEXT DEFAULT '{}',
    created_by_user_id INTEGER,
    reviewed_by_user_id INTEGER,
    reviewed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
    FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
    FOREIGN KEY (share_link_id) REFERENCES custom_request_quote_share_links(custom_request_quote_share_link_id) ON DELETE SET NULL
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_order_drafts_request ON custom_request_order_drafts(custom_request_id, order_draft_status, updated_at)`).run().catch(() => null);

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_payment_candidates_request ON custom_request_payment_candidates(custom_request_id, candidate_type, candidate_status)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_request ON custom_request_quote_share_links(custom_request_id, share_status, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_token ON custom_request_quote_share_links(share_token, share_status)`).run().catch(() => null);
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
    row.budget_cents ? `Customer budget noted: ${money(row.budget_cents)}` : '',
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
  const replyTemplates = rows(await db.prepare(`SELECT * FROM custom_request_reply_templates ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const paymentCandidates = rows(await db.prepare(`SELECT * FROM custom_request_payment_candidates ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const previewLinks = rows(await db.prepare(`SELECT * FROM custom_request_quote_share_links ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const quoteLineItems = rows(await db.prepare(`SELECT * FROM custom_request_quote_line_items ORDER BY quote_draft_id, sort_order, custom_request_quote_line_item_id LIMIT 300`).all().catch(() => ({ results: [] })));
  const quoteRevisions = rows(await db.prepare(`SELECT * FROM custom_request_quote_revisions ORDER BY datetime(created_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const paymentRequestDrafts = rows(await db.prepare(`SELECT * FROM custom_request_payment_request_drafts ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const orderDrafts = rows(await db.prepare(`SELECT * FROM custom_request_order_drafts ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const referenceUploads = rows(await db.prepare(`SELECT * FROM custom_request_reference_uploads ORDER BY datetime(created_at) DESC LIMIT 160`).all().catch(() => ({ results: [] })));
  const conversionEvents = rows(await db.prepare(`SELECT * FROM custom_request_conversion_events ORDER BY datetime(created_at) DESC LIMIT 160`).all().catch(() => ({ results: [] })));
  const customerHistory = rows(await db.prepare(`SELECT email, COUNT(*) AS request_count, MAX(created_at) AS last_request_at FROM custom_requests WHERE COALESCE(email,'') <> '' GROUP BY email HAVING COUNT(*) > 1 ORDER BY request_count DESC, last_request_at DESC LIMIT 50`).all().catch(() => ({ results: [] })));
  return { ok: true, requests, summary, quote_drafts: quoteDrafts, quote_line_items: quoteLineItems, quote_revisions: quoteRevisions, payment_request_drafts: paymentRequestDrafts, order_drafts: orderDrafts, job_drafts: jobDrafts, product_drafts: productDrafts, reply_templates: replyTemplates, payment_candidates: paymentCandidates, quote_preview_links: previewLinks, reference_uploads: referenceUploads, conversion_events: conversionEvents, customer_history: customerHistory };
}

async function recordConversion(db, adminUser, requestId, type, tableName, targetId, targetKey, notes) {
  await db.prepare(`INSERT INTO custom_request_conversion_events (custom_request_id, conversion_type, target_table, target_id, target_key, event_notes, created_by_user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(Number(requestId || 0), type, tableName, Number(targetId || 0) || null, targetKey || null, notes || null, Number(adminUser.user_id || 0)).run();
}


async function quoteLineItems(db, quoteId) {
  return rows(await db.prepare(`SELECT * FROM custom_request_quote_line_items WHERE quote_draft_id=? AND COALESCE(line_status,'active') <> 'void' ORDER BY sort_order, custom_request_quote_line_item_id`).bind(Number(quoteId || 0)).all().catch(() => ({ results: [] })));
}
function lineAmount(quantity, unitCents) {
  const qty = Number(quantity || 1);
  const centsValue = Number(unitCents || 0);
  return Math.max(0, Math.round((Number.isFinite(qty) ? qty : 1) * (Number.isFinite(centsValue) ? centsValue : 0)));
}
function quoteTotals(lines, fallbackBudget = 0) {
  const active = (Array.isArray(lines) ? lines : []).filter((line) => String(line.line_status || 'active') !== 'void');
  const subtotal = active.reduce((sum, line) => sum + Number(line.line_amount_cents || 0), 0) || cents(fallbackBudget);
  const shipping = active.filter((line) => String(line.line_type || '') === 'pickup_shipping').reduce((sum, line) => sum + Number(line.line_amount_cents || 0), 0);
  const taxable = active.filter((line) => Number(line.is_taxable) === 1 && !['tax','pickup_shipping'].includes(String(line.line_type || ''))).reduce((sum, line) => sum + Number(line.line_amount_cents || 0), 0);
  const explicitTax = active.filter((line) => String(line.line_type || '') === 'tax').reduce((sum, line) => sum + Number(line.line_amount_cents || 0), 0);
  const tax = explicitTax || Math.round(taxable * 0.13);
  return { subtotal_cents: subtotal, pickup_shipping_cents: shipping, tax_estimate_cents: tax, quote_total_cents: subtotal + tax };
}
async function syncQuoteTotals(db, quote, fallbackBudget = 0) {
  if (!quote?.custom_request_quote_draft_id) return { subtotal_cents: cents(fallbackBudget), pickup_shipping_cents: 0, tax_estimate_cents: 0, quote_total_cents: cents(fallbackBudget) };
  const lines = await quoteLineItems(db, quote.custom_request_quote_draft_id);
  const totals = quoteTotals(lines, fallbackBudget || quote.estimated_budget_cents || 0);
  const material = lines.filter((line) => String(line.line_type || '') === 'material').reduce((sum, line) => sum + Number(line.line_amount_cents || 0), 0);
  const labor = lines.filter((line) => String(line.line_type || '') === 'labour' || String(line.line_type || '') === 'labor').reduce((sum, line) => sum + Number(line.line_amount_cents || 0), 0);
  await db.prepare(`UPDATE custom_request_quote_drafts SET material_cost_cents=?, labor_cost_cents=?, pickup_shipping_cents=?, tax_estimate_cents=?, quote_total_cents=?, estimated_budget_cents=CASE WHEN ? > 0 THEN ? ELSE estimated_budget_cents END, updated_at=CURRENT_TIMESTAMP WHERE custom_request_quote_draft_id=?`).bind(
    material, labor, totals.pickup_shipping_cents, totals.tax_estimate_cents, totals.quote_total_cents, totals.quote_total_cents, totals.quote_total_cents, Number(quote.custom_request_quote_draft_id || 0)
  ).run().catch(() => null);
  return totals;
}
async function ensureDefaultQuoteLineItems(db, adminUser, requestRow, quote) {
  if (!quote?.custom_request_quote_draft_id) return [];
  const existing = await quoteLineItems(db, quote.custom_request_quote_draft_id);
  if (existing.length) return existing;
  const budget = cents(requestRow?.budget_cents || quote.estimated_budget_cents || 0);
  const material = budget > 0 ? Math.round(budget * 0.35) : 0;
  const labour = budget > 0 ? Math.max(0, budget - material) : 0;
  const defaultLines = [
    ['material', 'Estimated materials and consumables', 1, material, 1, 10],
    ['labour', 'Estimated design, making, finishing, and admin time', 1, labour, 1, 20],
    ['pickup_shipping', 'Pickup / shipping estimate to confirm', 1, 0, 0, 30]
  ];
  for (const line of defaultLines) {
    await db.prepare(`INSERT INTO custom_request_quote_line_items (custom_request_id, quote_draft_id, line_type, line_label, quantity, unit_amount_cents, line_amount_cents, is_taxable, sort_order, created_by_user_id, updated_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
      Number(requestRow.custom_request_id || 0), Number(quote.custom_request_quote_draft_id || 0), line[0], line[1], line[2], line[3], lineAmount(line[2], line[3]), line[4], line[5], Number(adminUser.user_id || 0), Number(adminUser.user_id || 0)
    ).run();
  }
  const lines = await quoteLineItems(db, quote.custom_request_quote_draft_id);
  await syncQuoteTotals(db, quote, budget);
  return lines;
}
async function recordQuoteRevision(db, adminUser, requestId, quoteId, revisionType, notes, snapshot = {}) {
  await db.prepare(`INSERT INTO custom_request_quote_revisions (custom_request_id, quote_draft_id, revision_type, revision_status, revision_notes, snapshot_json, created_by_user_id, created_at) VALUES (?, ?, ?, 'open', ?, ?, ?, CURRENT_TIMESTAMP)`).bind(
    Number(requestId || 0), Number(quoteId || 0) || null, clean(revisionType || 'changed', 60), clean(notes || '', 1200) || null, JSON.stringify(snapshot || {}), Number(adminUser?.user_id || 0) || null
  ).run().catch(() => null);
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
  const quote = await db.prepare(`SELECT * FROM custom_request_quote_drafts WHERE custom_request_quote_draft_id=? LIMIT 1`).bind(targetId).first().catch(() => null);
  if (quote) await ensureDefaultQuoteLineItems(db, adminUser, row, quote);
  await recordQuoteRevision(db, adminUser, requestId, targetId, 'quote_created', 'Initial quote draft and default editable line items created.', { request_key: row.request_key, quote_key: quoteKey });
  await recordConversion(db, adminUser, requestId, 'quote_draft', 'custom_request_quote_drafts', targetId, quoteKey, 'Quote draft created from custom request.');
  return { ok: true, message: 'Quote draft created with editable line items.', target_key: quoteKey, target_id: targetId };
}

async function getOrCreateQuote(db, adminUser, requestId) {
  let quote = await db.prepare(`SELECT * FROM custom_request_quote_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (quote) return quote;
  const created = await createQuoteDraft(db, adminUser, requestId);
  if (!created.ok) return null;
  return db.prepare(`SELECT * FROM custom_request_quote_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
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

function buildReplyText(row, quote) {
  const greeting = row.name ? `Hi ${row.name},` : 'Hi,';
  const idea = titleForRequest(row);
  const budgetLine = Number(quote?.estimated_budget_cents || row.budget_cents || 0) > 0 ? `\n\nRough budget/estimate placeholder: ${money(quote?.estimated_budget_cents || row.budget_cents)} CAD. We will confirm the final price before anything becomes an order.` : '\n\nWe still need to confirm materials, time, and final price before anything becomes an order.';
  const deadlineLine = row.deadline_date ? `\nRequested timing noted: ${row.deadline_date}.` : '\nTiming still needs to be confirmed.';
  return clean(`${greeting}\n\nThank you for sending your Devil n Dove custom request for: ${idea}.\n\nWe reviewed the request details and the next step is to confirm the design, size, material/finish, deadline, pickup or shipping needs, and any reference images before we quote it as real work.${budgetLine}\n${deadlineLine}\n\nOriginal notes we are using for review:\n${row.message || ''}\n\nBefore we move forward, please reply with any must-have wording, colours, measurements, allergies/material limits, pickup/shipping preference, and whether any reference images are okay for private planning only or can be used in public process/story posts.\n\nThanks,\nDevil n Dove`, 4000);
}

async function createReplyTemplate(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const quote = await getOrCreateQuote(db, adminUser, requestId);
  const existing = await db.prepare(`SELECT * FROM custom_request_reply_templates WHERE custom_request_id=? AND channel='email' LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const subject = clean(`Your Devil n Dove custom request: ${titleForRequest(row)}`, 180);
  const bodyText = buildReplyText(row, quote || {});
  if (existing) {
    await db.prepare(`UPDATE custom_request_reply_templates SET subject=?, body_text=?, quote_draft_id=?, template_status='draft', updated_by_user_id=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_reply_template_id=?`).bind(
      subject, bodyText, Number(quote?.custom_request_quote_draft_id || 0) || null, Number(adminUser.user_id || 0), Number(existing.custom_request_reply_template_id || 0)
    ).run();
    await recordConversion(db, adminUser, requestId, 'reply_template_refreshed', 'custom_request_reply_templates', existing.custom_request_reply_template_id, existing.template_key, 'Customer reply template refreshed from the latest request/quote draft.');
    return { ok: true, message: 'Customer reply template refreshed.', target_key: existing.template_key, target_id: existing.custom_request_reply_template_id };
  }
  const templateKey = key('reply');
  const insert = await db.prepare(`INSERT INTO custom_request_reply_templates (
    custom_request_id, quote_draft_id, template_key, template_status, channel, subject, body_text, created_by_user_id, updated_by_user_id, created_at, updated_at
  ) VALUES (?, ?, ?, 'draft', 'email', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId), Number(quote?.custom_request_quote_draft_id || 0) || null, templateKey, subject, bodyText, Number(adminUser.user_id || 0), Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await db.prepare(`UPDATE custom_requests SET status=CASE WHEN status='new' THEN 'reviewing' ELSE status END, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(Number(requestId)).run();
  await recordConversion(db, adminUser, requestId, 'reply_template', 'custom_request_reply_templates', targetId, templateKey, 'Customer reply template created for manual review/copy.');
  return { ok: true, message: 'Customer reply template created.', target_key: templateKey, target_id: targetId };
}

async function createPaymentCandidate(db, adminUser, requestId, candidateType) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const quote = await getOrCreateQuote(db, adminUser, requestId);
  const type = candidateType === 'invoice' ? 'invoice' : 'deposit';
  const existing = await db.prepare(`SELECT * FROM custom_request_payment_candidates WHERE custom_request_id=? AND candidate_type=? LIMIT 1`).bind(Number(requestId), type).first().catch(() => null);
  if (existing) return { ok: true, message: `${type === 'deposit' ? 'Deposit' : 'Invoice'} candidate already exists.`, target_key: existing.candidate_key, target_id: existing.custom_request_payment_candidate_id };
  await ensureDefaultQuoteLineItems(db, adminUser, row, quote);
  const totals = await syncQuoteTotals(db, quote, row.budget_cents || 0);
  const quoteTotal = cents(totals.quote_total_cents || quote?.estimated_budget_cents || row.budget_cents || 0);
  const deposit = quoteTotal > 0 ? Math.max(500, Math.round(quoteTotal * 0.5)) : 0;
  const amount = type === 'deposit' ? deposit : Math.max(0, quoteTotal - deposit);
  const statusValue = amount > 0 ? 'draft' : 'needs_amount';
  const candidateKey = key(type === 'deposit' ? 'deposit' : 'invoice');
  const description = type === 'deposit'
    ? `Deposit candidate for ${titleForRequest(row)}. Review amount before sending a payment request.`
    : `Final invoice candidate for ${titleForRequest(row)}. Review completion, balance, HST/GST, pickup/shipping, and evidence before sending.`;
  const payload = JSON.stringify({ quote_key: quote?.quote_key || null, request_key: row.request_key || null, quoted_total_cents: quoteTotal, default_deposit_rule: '50 percent or manual amount if no budget exists' });
  const insert = await db.prepare(`INSERT INTO custom_request_payment_candidates (
    custom_request_id, quote_draft_id, candidate_key, candidate_type, candidate_status, amount_cents, currency, due_date,
    description, customer_name, customer_email, source_payload_json, created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, 'CAD', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId), Number(quote?.custom_request_quote_draft_id || 0) || null, candidateKey, type, statusValue, amount,
    type === 'deposit' ? null : row.deadline_date || null, description, row.name || null, row.email || null, payload, Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await recordConversion(db, adminUser, requestId, type === 'deposit' ? 'deposit_candidate' : 'invoice_candidate', 'custom_request_payment_candidates', targetId, candidateKey, `${type === 'deposit' ? 'Deposit' : 'Invoice'} candidate created from custom request quote draft.`);
  return { ok: true, message: `${type === 'deposit' ? 'Deposit' : 'Invoice'} candidate created.`, target_key: candidateKey, target_id: targetId };
}

async function createQuotePreviewLink(db, adminUser, requestId, origin) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const quote = await getOrCreateQuote(db, adminUser, requestId);
  const existing = await db.prepare(`SELECT * FROM custom_request_quote_share_links WHERE custom_request_id=? AND share_status IN ('active','viewed') ORDER BY datetime(created_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (existing) return { ok: true, message: 'Quote preview link already exists.', target_key: existing.share_token, target_id: existing.custom_request_quote_share_link_id, share_url: `${origin}/custom-request/quote/?token=${encodeURIComponent(existing.share_token)}` };
  const shareToken = `quote_${crypto.randomUUID().replace(/-/g, '')}`;
  await ensureDefaultQuoteLineItems(db, adminUser, row, quote);
  const totals = await syncQuoteTotals(db, quote, row.budget_cents || 0);
  const quoteTotal = cents(totals.quote_total_cents || quote?.estimated_budget_cents || row.budget_cents || 0);
  const depositCandidate = await db.prepare(`SELECT amount_cents, candidate_status FROM custom_request_payment_candidates WHERE custom_request_id=? AND candidate_type='deposit' LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const invoiceCandidate = await db.prepare(`SELECT amount_cents, candidate_status FROM custom_request_payment_candidates WHERE custom_request_id=? AND candidate_type='invoice' LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const paymentSummary = JSON.stringify({
    subtotal_cents: totals.subtotal_cents,
    pickup_shipping_cents: totals.pickup_shipping_cents,
    tax_estimate_cents: totals.tax_estimate_cents,
    quote_total_cents: totals.quote_total_cents,
    deposit_cents: Number(depositCandidate?.amount_cents || 0),
    invoice_balance_cents: Number(invoiceCandidate?.amount_cents || 0),
    note: 'Payment amounts are planning values only until Devil n Dove sends a final payment request or invoice.'
  });
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const insert = await db.prepare(`INSERT INTO custom_request_quote_share_links (
    custom_request_id, quote_draft_id, share_token, share_status, customer_name, customer_email, title, quote_total_cents,
    scope_summary, payment_summary_json, expires_at, created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId), Number(quote?.custom_request_quote_draft_id || 0) || null, shareToken, row.name || null, row.email || null,
    titleForRequest(row), quoteTotal, clean(quote?.scope_notes || quoteScope(row), 3000), paymentSummary, expiresAt, Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await db.prepare(`UPDATE custom_requests SET status=CASE WHEN status IN ('new','reviewing','quote_needed') THEN 'quoted' ELSE status END, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(Number(requestId)).run();
  await db.prepare(`UPDATE custom_request_quote_drafts SET quote_status=CASE WHEN quote_status='draft' THEN 'shared' ELSE quote_status END, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(Number(requestId)).run().catch(() => null);
  await recordQuoteRevision(db, adminUser, requestId, quote?.custom_request_quote_draft_id, 'quote_shared', 'Private quote preview link created with current line item totals.', { share_link_id: targetId, quote_total_cents: quoteTotal });
  await recordConversion(db, adminUser, requestId, 'quote_preview_link', 'custom_request_quote_share_links', targetId, shareToken, 'Private quote preview link created for manual customer sharing.');
  return { ok: true, message: 'Private quote preview link created.', target_key: shareToken, target_id: targetId, share_url: `${origin}/custom-request/quote/?token=${encodeURIComponent(shareToken)}` };
}


async function saveQuoteLineItem(db, adminUser, requestId, body) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const quote = await getOrCreateQuote(db, adminUser, requestId);
  await ensureDefaultQuoteLineItems(db, adminUser, row, quote);
  const lineId = Number(body.quote_line_item_id || body.custom_request_quote_line_item_id || 0);
  const type = clean(body.line_type || 'custom', 40).toLowerCase() || 'custom';
  const label = clean(body.line_label || body.label || 'Custom quote line', 240) || 'Custom quote line';
  const qty = Number(body.quantity || 1);
  const unit = cents(body.unit_amount_cents);
  const amount = body.line_amount_cents == null || body.line_amount_cents === '' ? lineAmount(qty, unit) : cents(body.line_amount_cents);
  const taxable = body.is_taxable == null ? 1 : (Number(body.is_taxable) === 1 ? 1 : 0);
  if (lineId) {
    await db.prepare(`UPDATE custom_request_quote_line_items SET line_type=?, line_label=?, quantity=?, unit_amount_cents=?, line_amount_cents=?, is_taxable=?, line_status=?, sort_order=?, updated_by_user_id=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_quote_line_item_id=? AND custom_request_id=?`).bind(type, label, Number.isFinite(qty) ? qty : 1, unit, amount, taxable, clean(body.line_status || 'active', 40).toLowerCase(), Number(body.sort_order || 100), Number(adminUser.user_id || 0), lineId, Number(requestId)).run();
  } else {
    await db.prepare(`INSERT INTO custom_request_quote_line_items (custom_request_id, quote_draft_id, line_type, line_label, quantity, unit_amount_cents, line_amount_cents, is_taxable, line_status, sort_order, created_by_user_id, updated_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(Number(requestId), Number(quote.custom_request_quote_draft_id || 0), type, label, Number.isFinite(qty) ? qty : 1, unit, amount, taxable, clean(body.line_status || 'active', 40).toLowerCase(), Number(body.sort_order || 100), Number(adminUser.user_id || 0), Number(adminUser.user_id || 0)).run();
  }
  const totals = await syncQuoteTotals(db, quote, row.budget_cents || 0);
  await recordQuoteRevision(db, adminUser, requestId, quote.custom_request_quote_draft_id, 'line_item_changed', `Quote line item ${lineId ? 'updated' : 'added'}: ${label}`, { line_type: type, amount_cents: amount, totals });
  await recordConversion(db, adminUser, requestId, 'quote_line_item_saved', 'custom_request_quote_line_items', lineId || null, quote.quote_key, 'Editable quote line item saved.');
  return { ok: true, message: 'Quote line item saved.', target_key: quote.quote_key, target_id: lineId || null };
}
async function createAcceptedPaymentAndOrderDrafts(db, adminUser, requestId, shareLinkId = null) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const quote = await getOrCreateQuote(db, adminUser, requestId);
  await ensureDefaultQuoteLineItems(db, adminUser, row, quote);
  const totals = await syncQuoteTotals(db, quote, row.budget_cents || 0);
  const existingPayment = await db.prepare(`SELECT * FROM custom_request_payment_request_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const existingOrder = await db.prepare(`SELECT * FROM custom_request_order_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  let paymentKey = existingPayment?.payment_request_key || null;
  let orderKey = existingOrder?.order_draft_key || null;
  const lineItems = await quoteLineItems(db, quote.custom_request_quote_draft_id);
  const sourcePayload = JSON.stringify({ request_key: row.request_key, quote_key: quote.quote_key, share_link_id: shareLinkId || null, line_items: lineItems, totals });
  if (!existingPayment) {
    paymentKey = key('payreq');
    const depositCandidate = await db.prepare(`SELECT * FROM custom_request_payment_candidates WHERE custom_request_id=? AND candidate_type='deposit' LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
    const depositAmount = Number(depositCandidate?.amount_cents || 0) || Math.max(500, Math.round(Number(totals.quote_total_cents || 0) * 0.5));
    await db.prepare(`INSERT INTO custom_request_payment_request_drafts (custom_request_id, quote_draft_id, share_link_id, payment_request_key, payment_request_status, request_type, amount_cents, tax_cents, currency, customer_name, customer_email, due_date, review_notes, source_payload_json, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'review_needed', 'deposit', ?, ?, 'CAD', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(Number(requestId), Number(quote.custom_request_quote_draft_id || 0), Number(shareLinkId || 0) || null, paymentKey, depositAmount, Math.round(Number(totals.tax_estimate_cents || 0) * (depositAmount / Math.max(Number(totals.quote_total_cents || 1), 1))), row.name || null, row.email || null, todayIso(), 'Customer accepted quote preview. Review before sending any payment request.', sourcePayload, Number(adminUser?.user_id || 0) || null).run();
  }
  if (!existingOrder) {
    orderKey = key('orderdraft');
    await db.prepare(`INSERT INTO custom_request_order_drafts (custom_request_id, quote_draft_id, share_link_id, order_draft_key, order_draft_status, customer_name, customer_email, subtotal_cents, shipping_cents, tax_cents, total_cents, currency, fulfillment_notes, source_payload_json, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'review_needed', ?, ?, ?, ?, ?, ?, 'CAD', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(Number(requestId), Number(quote.custom_request_quote_draft_id || 0), Number(shareLinkId || 0) || null, orderKey, row.name || null, row.email || null, Number(totals.subtotal_cents || 0), Number(totals.pickup_shipping_cents || 0), Number(totals.tax_estimate_cents || 0), Number(totals.quote_total_cents || 0), 'Quote accepted. Confirm pickup/shipping, customer consent, payment status, and product/job handoff before converting to a real order.', sourcePayload, Number(adminUser?.user_id || 0) || null).run();
  }
  await recordQuoteRevision(db, adminUser, requestId, quote.custom_request_quote_draft_id, 'quote_accepted_followup', 'Accepted quote connected to reviewed payment-request and order draft records.', { payment_request_key: paymentKey, order_draft_key: orderKey, totals });
  await recordConversion(db, adminUser || { user_id: 0 }, requestId, 'accepted_quote_to_payment_order_drafts', 'custom_request_order_drafts', null, orderKey, 'Accepted quote connected to payment request and order draft planning records.');
  return { ok: true, message: 'Accepted quote connected to payment request and order draft records.', target_key: orderKey, payment_request_key: paymentKey };
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
    else if (action === 'create_reply_template') actionResult = await createReplyTemplate(db, adminUser, id);
    else if (action === 'create_deposit_candidate') actionResult = await createPaymentCandidate(db, adminUser, id, 'deposit');
    else if (action === 'create_invoice_candidate') actionResult = await createPaymentCandidate(db, adminUser, id, 'invoice');
    else if (action === 'create_quote_preview_link') actionResult = await createQuotePreviewLink(db, adminUser, id, new URL(context.request.url).origin);
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
