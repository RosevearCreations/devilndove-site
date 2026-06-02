// File: /functions/api/admin/custom-requests.js
// Brief description: Admin review queue for custom gift, engraving, and personalized work requests, including quote/job/product conversion, editable quote line items, approved payment links, real checkout handoffs, customer order-status links, marketplace CSV exports, post-fulfillment consent prompts, private quote links, revision history, link lifecycle controls, order-stage tracking, marketplace presets, and consent-to-public-proof review candidates.

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

  await ensureColumn(db, 'custom_request_order_drafts', 'order_id', 'order_id INTEGER');
  await ensureColumn(db, 'custom_request_order_drafts', 'converted_by_user_id', 'converted_by_user_id INTEGER');
  await ensureColumn(db, 'custom_request_order_drafts', 'converted_at', 'converted_at TEXT');
  await ensureColumn(db, 'custom_request_payment_request_drafts', 'approved_payment_link_id', 'approved_payment_link_id INTEGER');
  await ensureColumn(db, 'custom_request_payment_request_drafts', 'approved_payment_link_url', 'approved_payment_link_url TEXT');
  await ensureColumn(db, 'custom_request_quote_share_links', 'version_number', 'version_number INTEGER NOT NULL DEFAULT 1');
  await ensureColumn(db, 'custom_request_quote_share_links', 'supersedes_share_link_id', 'supersedes_share_link_id INTEGER');
  await ensureColumn(db, 'custom_request_quote_share_links', 'resent_at', 'resent_at TEXT');
  await ensureColumn(db, 'custom_request_quote_share_links', 'resend_note', 'resend_note TEXT');
  await ensureColumn(db, 'custom_request_quote_share_links', 'voided_at', 'voided_at TEXT');
  await ensureColumn(db, 'custom_request_quote_share_links', 'expired_at', 'expired_at TEXT');
  await ensureColumn(db, 'custom_request_quote_share_links', 'resend_count', 'resend_count INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'custom_request_quote_share_links', 'lifecycle_note', 'lifecycle_note TEXT');

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_payment_links (
    custom_request_payment_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    payment_request_draft_id INTEGER,
    quote_draft_id INTEGER,
    payment_link_key TEXT NOT NULL UNIQUE,
    link_token TEXT NOT NULL UNIQUE,
    link_status TEXT NOT NULL DEFAULT 'active',
    link_url_path TEXT NOT NULL,
    request_type TEXT NOT NULL DEFAULT 'deposit',
    amount_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'CAD',
    customer_name TEXT,
    customer_email TEXT,
    provider TEXT NOT NULL DEFAULT 'manual_review',
    provider_reference TEXT,
    approval_notes TEXT,
    customer_viewed_at TEXT,
    customer_ready_at TEXT,
    customer_note TEXT,
    approved_by_user_id INTEGER,
    approved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
    FOREIGN KEY (payment_request_draft_id) REFERENCES custom_request_payment_request_drafts(custom_request_payment_request_draft_id) ON DELETE SET NULL,
    FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
  )`).run();
  await ensureColumn(db, 'custom_request_payment_links', 'provider', "provider TEXT NOT NULL DEFAULT 'manual_review'");
  await ensureColumn(db, 'custom_request_payment_links', 'provider_reference', 'provider_reference TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'customer_viewed_at', 'customer_viewed_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'customer_ready_at', 'customer_ready_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'customer_note', 'customer_note TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'viewed_at', 'viewed_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'ready_to_pay_at', 'ready_to_pay_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'customer_ready_note', 'customer_ready_note TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'order_id', 'order_id INTEGER');
  await ensureColumn(db, 'custom_request_payment_links', 'payment_id', 'payment_id INTEGER');
  await ensureColumn(db, 'custom_request_payment_links', 'external_share_status', "external_share_status TEXT NOT NULL DEFAULT 'gate_pending'");
  await ensureColumn(db, 'custom_request_payment_links', 'gate_status', "gate_status TEXT NOT NULL DEFAULT 'pending'");
  await ensureColumn(db, 'custom_request_payment_links', 'gate_checked_at', 'gate_checked_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'gate_notes', 'gate_notes TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'preferred_provider', "preferred_provider TEXT NOT NULL DEFAULT 'manual'");
  await ensureColumn(db, 'custom_request_payment_links', 'checkout_redirect_url', 'checkout_redirect_url TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'voided_at', 'voided_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'expired_at', 'expired_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'resent_at', 'resent_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'resend_count', 'resend_count INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'custom_request_payment_links', 'lifecycle_note', 'lifecycle_note TEXT');
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_payment_links_request ON custom_request_payment_links(custom_request_id, link_status, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_payment_links_token ON custom_request_payment_links(link_token, link_status)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_payment_link_approval_gates (
    custom_request_payment_link_approval_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    payment_request_draft_id INTEGER,
    order_draft_id INTEGER,
    order_id INTEGER,
    gate_status TEXT NOT NULL DEFAULT 'failed',
    gate_notes TEXT,
    gate_snapshot_json TEXT DEFAULT '{}',
    checked_by_user_id INTEGER,
    checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_payment_gate_request ON custom_request_payment_link_approval_gates(custom_request_id, gate_status, checked_at)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_payment_checkout_records (
    custom_request_payment_checkout_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    payment_link_id INTEGER,
    order_id INTEGER,
    payment_id INTEGER,
    provider TEXT NOT NULL DEFAULT 'manual',
    checkout_status TEXT NOT NULL DEFAULT 'prepared',
    provider_order_id TEXT,
    provider_payment_id TEXT,
    redirect_url TEXT,
    mode TEXT,
    source_payload_json TEXT DEFAULT '{}',
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_checkout_records_request ON custom_request_payment_checkout_records(custom_request_id, provider, checkout_status, updated_at)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_order_status_links (
    custom_request_order_status_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    order_status_token TEXT NOT NULL UNIQUE,
    link_status TEXT NOT NULL DEFAULT 'active',
    customer_email TEXT,
    customer_name TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_order_status_links_request ON custom_request_order_status_links(custom_request_id, link_status, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_order_status_links_token ON custom_request_order_status_links(order_status_token, link_status)`).run().catch(() => null);
  await ensureColumn(db, 'custom_request_order_status_links', 'order_stage', "order_stage TEXT NOT NULL DEFAULT 'planning'");
  await ensureColumn(db, 'custom_request_order_status_links', 'stage_notes', 'stage_notes TEXT');
  await ensureColumn(db, 'custom_request_order_status_links', 'stage_updated_at', 'stage_updated_at TEXT');
  await ensureColumn(db, 'custom_request_order_status_links', 'voided_at', 'voided_at TEXT');
  await ensureColumn(db, 'custom_request_order_status_links', 'expired_at', 'expired_at TEXT');
  await ensureColumn(db, 'custom_request_order_status_links', 'resent_at', 'resent_at TEXT');
  await ensureColumn(db, 'custom_request_order_status_links', 'resend_count', 'resend_count INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'custom_request_order_status_links', 'lifecycle_note', 'lifecycle_note TEXT');

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_marketplace_export_packs (
    custom_request_marketplace_export_pack_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    quote_draft_id INTEGER,
    product_draft_id INTEGER,
    pack_key TEXT NOT NULL UNIQUE,
    pack_status TEXT NOT NULL DEFAULT 'draft',
    etsy_title TEXT,
    etsy_description TEXT,
    facebook_title TEXT,
    facebook_description TEXT,
    pinterest_title TEXT,
    pinterest_description TEXT,
    manual_listing_copy TEXT,
    tags_json TEXT DEFAULT '[]',
    readiness_notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
    FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
    FOREIGN KEY (product_draft_id) REFERENCES custom_request_product_drafts(custom_request_product_draft_id) ON DELETE SET NULL
  )`).run();
  await ensureColumn(db, 'custom_request_marketplace_export_packs', 'csv_status', "csv_status TEXT NOT NULL DEFAULT 'draft'");
  await ensureColumn(db, 'custom_request_marketplace_export_packs', 'etsy_csv_row_json', "etsy_csv_row_json TEXT DEFAULT '{}'");
  await ensureColumn(db, 'custom_request_marketplace_export_packs', 'facebook_csv_row_json', "facebook_csv_row_json TEXT DEFAULT '{}'");
  await ensureColumn(db, 'custom_request_marketplace_export_packs', 'pinterest_csv_row_json', "pinterest_csv_row_json TEXT DEFAULT '{}'");
  await ensureColumn(db, 'custom_request_marketplace_export_packs', 'manual_csv_row_json', "manual_csv_row_json TEXT DEFAULT '{}'");
  await ensureColumn(db, 'custom_request_marketplace_export_packs', 'preset_summary_json', "preset_summary_json TEXT DEFAULT '{}'");
  await ensureColumn(db, 'custom_request_marketplace_export_packs', 'image_validation_status', "image_validation_status TEXT DEFAULT 'needs_review'");
  await ensureColumn(db, 'custom_request_marketplace_export_packs', 'image_validation_notes', "image_validation_notes TEXT");
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_channel_presets (
    marketplace_channel_preset_id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL UNIQUE,
    category_label TEXT,
    shipping_profile_label TEXT,
    default_tags_json TEXT DEFAULT '[]',
    default_fields_json TEXT DEFAULT '{}',
    preset_status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_marketplace_channel_presets_status ON marketplace_channel_presets(preset_status, channel)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_marketplace_exports_request ON custom_request_marketplace_export_packs(custom_request_id, pack_status, updated_at)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_fulfillment_prompts (
    custom_request_fulfillment_prompt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    order_id INTEGER,
    prompt_key TEXT NOT NULL UNIQUE,
    prompt_status TEXT NOT NULL DEFAULT 'draft',
    prompt_type TEXT NOT NULL DEFAULT 'review_photo_consent',
    customer_name TEXT,
    customer_email TEXT,
    subject TEXT,
    body_text TEXT,
    consent_question_text TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'prompt_token', 'prompt_token TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'public_response_status', "public_response_status TEXT NOT NULL DEFAULT 'not_sent'");
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'public_use_scope', 'public_use_scope TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'review_text', 'review_text TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'customer_response_note', 'customer_response_note TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'responded_at', 'responded_at TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'voided_at', 'voided_at TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'expired_at', 'expired_at TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'resent_at', 'resent_at TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'resend_count', 'resend_count INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'lifecycle_note', 'lifecycle_note TEXT');
  await ensureColumn(db, 'custom_request_fulfillment_prompts', 'public_proof_candidate_id', 'public_proof_candidate_id INTEGER');
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_public_proof_candidates (
    custom_request_public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    fulfillment_prompt_id INTEGER,
    candidate_key TEXT NOT NULL UNIQUE,
    candidate_type TEXT NOT NULL DEFAULT 'trust_block',
    candidate_status TEXT NOT NULL DEFAULT 'review_needed',
    public_use_scope TEXT,
    title TEXT,
    body_text TEXT,
    attribution_label TEXT,
    locality_label TEXT,
    source_review_text TEXT,
    customer_note TEXT,
    trust_block_item_id INTEGER,
    product_story_public_note_id INTEGER,
    review_notes TEXT,
    created_by_user_id INTEGER,
    approved_by_user_id INTEGER,
    approved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_public_proof_candidates_status ON custom_request_public_proof_candidates(candidate_status, updated_at)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_order_stage_events (
    custom_request_order_stage_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    order_id INTEGER,
    stage_key TEXT NOT NULL,
    stage_label TEXT NOT NULL,
    stage_status TEXT NOT NULL DEFAULT 'current',
    stage_notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_order_stage_events_request ON custom_request_order_stage_events(custom_request_id, created_at)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_payment_provider_tests (
    custom_request_payment_provider_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    test_status TEXT NOT NULL DEFAULT 'not_configured',
    mode TEXT,
    result_notes TEXT,
    checked_by_user_id INTEGER,
    checked_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_payment_provider_tests_provider ON custom_request_payment_provider_tests(provider, checked_at)`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs (
    custom_candle_soap_product_spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER,
    product_id INTEGER,
    product_draft_id INTEGER,
    product_family TEXT NOT NULL DEFAULT 'candle',
    scent_profile TEXT,
    wax_or_base TEXT,
    colour_notes TEXT,
    batch_number TEXT,
    ingredient_notes TEXT,
    allergen_safety_notes TEXT,
    cure_ready_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_candle_soap_specs_request ON custom_candle_soap_product_specs(custom_request_id, product_family)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_request ON custom_request_fulfillment_prompts(custom_request_id, prompt_status, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_token ON custom_request_fulfillment_prompts(prompt_token)`).run().catch(() => null);

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_payment_candidates_request ON custom_request_payment_candidates(custom_request_id, candidate_type, candidate_status)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_request ON custom_request_quote_share_links(custom_request_id, share_status, updated_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_token ON custom_request_quote_share_links(share_token, share_status)`).run().catch(() => null);
  for (const [columnName, definition] of [
    ['scent_profile', 'scent_profile TEXT'],
    ['wax_or_base', 'wax_or_base TEXT'],
    ['soap_base', 'soap_base TEXT'],
    ['colour_recipe', 'colour_recipe TEXT'],
    ['batch_number', 'batch_number TEXT'],
    ['ingredient_notes', 'ingredient_notes TEXT'],
    ['allergen_safety_notes', 'allergen_safety_notes TEXT'],
    ['cure_ready_date', 'cure_ready_date TEXT']
  ]) {
    await ensureColumn(db, 'products', columnName, definition);
  }
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
  const paymentLinks = rows(await db.prepare(`SELECT * FROM custom_request_payment_links ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const paymentGates = rows(await db.prepare(`SELECT * FROM custom_request_payment_link_approval_gates ORDER BY datetime(checked_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const checkoutRecords = rows(await db.prepare(`SELECT * FROM custom_request_payment_checkout_records ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const orderStatusLinks = rows(await db.prepare(`SELECT * FROM custom_request_order_status_links ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const marketplaceExportPacks = rows(await db.prepare(`SELECT * FROM custom_request_marketplace_export_packs ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const fulfillmentPrompts = rows(await db.prepare(`SELECT * FROM custom_request_fulfillment_prompts ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const orderStageEvents = rows(await db.prepare(`SELECT * FROM custom_request_order_stage_events ORDER BY datetime(created_at) DESC LIMIT 160`).all().catch(() => ({ results: [] })));
  const publicProofCandidates = rows(await db.prepare(`SELECT * FROM custom_request_public_proof_candidates ORDER BY datetime(updated_at) DESC LIMIT 120`).all().catch(() => ({ results: [] })));
  const marketplacePresets = rows(await db.prepare(`SELECT * FROM marketplace_channel_presets ORDER BY channel ASC`).all().catch(() => ({ results: [] })));
  const paymentProviderTests = rows(await db.prepare(`SELECT * FROM custom_request_payment_provider_tests ORDER BY datetime(checked_at) DESC LIMIT 40`).all().catch(() => ({ results: [] })));
  const referenceUploads = rows(await db.prepare(`SELECT * FROM custom_request_reference_uploads ORDER BY datetime(created_at) DESC LIMIT 160`).all().catch(() => ({ results: [] })));
  const conversionEvents = rows(await db.prepare(`SELECT * FROM custom_request_conversion_events ORDER BY datetime(created_at) DESC LIMIT 160`).all().catch(() => ({ results: [] })));
  const customerHistory = rows(await db.prepare(`SELECT email, COUNT(*) AS request_count, MAX(created_at) AS last_request_at FROM custom_requests WHERE COALESCE(email,'') <> '' GROUP BY email HAVING COUNT(*) > 1 ORDER BY request_count DESC, last_request_at DESC LIMIT 50`).all().catch(() => ({ results: [] })));
  return { ok: true, requests, summary, quote_drafts: quoteDrafts, quote_line_items: quoteLineItems, quote_revisions: quoteRevisions, payment_request_drafts: paymentRequestDrafts, order_drafts: orderDrafts, payment_links: paymentLinks, payment_gates: paymentGates, checkout_records: checkoutRecords, order_status_links: orderStatusLinks, order_stage_events: orderStageEvents, marketplace_export_packs: marketplaceExportPacks, marketplace_presets: marketplacePresets, fulfillment_prompts: fulfillmentPrompts, public_proof_candidates: publicProofCandidates, payment_provider_tests: paymentProviderTests, job_drafts: jobDrafts, product_drafts: productDrafts, reply_templates: replyTemplates, payment_candidates: paymentCandidates, quote_preview_links: previewLinks, reference_uploads: referenceUploads, conversion_events: conversionEvents, customer_history: customerHistory };
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


async function paymentShareGate(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const quote = await db.prepare(`SELECT * FROM custom_request_quote_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const draft = await db.prepare(`SELECT * FROM custom_request_payment_request_drafts WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const orderDraft = await db.prepare(`SELECT * FROM custom_request_order_drafts WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const lines = quote?.custom_request_quote_draft_id ? await quoteLineItems(db, quote.custom_request_quote_draft_id) : [];
  const blockers = [];
  if (!quote) blockers.push('quote draft missing');
  if (!lines.length) blockers.push('quote line items missing');
  if (!draft) blockers.push('payment request draft missing');
  if (draft && Number(draft.amount_cents || 0) <= 0) blockers.push('payment amount must be greater than zero');
  if (draft && !String(draft.customer_email || row.email || '').includes('@')) blockers.push('customer email missing');
  if (!orderDraft) blockers.push('order draft missing');
  if (orderDraft && String(orderDraft.order_draft_status || '').toLowerCase() !== 'converted_to_order') blockers.push('order draft must be converted to a real order first');
  if (orderDraft && Number(orderDraft.order_id || 0) <= 0) blockers.push('real order ID missing');
  if (!['accepted','quoted'].includes(String(row.status || '').toLowerCase())) blockers.push('request must be quoted or accepted before payment link sharing');
  const statusValue = blockers.length ? 'failed' : 'passed';
  const snapshot = {
    request_key: row.request_key || null,
    quote_key: quote?.quote_key || null,
    line_count: lines.length,
    payment_request_key: draft?.payment_request_key || null,
    amount_cents: Number(draft?.amount_cents || 0),
    order_draft_key: orderDraft?.order_draft_key || null,
    order_id: Number(orderDraft?.order_id || 0) || null,
    blockers
  };
  const insert = await db.prepare(`INSERT INTO custom_request_payment_link_approval_gates (custom_request_id, payment_request_draft_id, order_draft_id, order_id, gate_status, gate_notes, gate_snapshot_json, checked_by_user_id, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(
    Number(requestId),
    Number(draft?.custom_request_payment_request_draft_id || 0) || null,
    Number(orderDraft?.custom_request_order_draft_id || 0) || null,
    Number(orderDraft?.order_id || 0) || null,
    statusValue,
    blockers.length ? blockers.join('; ') : 'All payment share gates passed.',
    JSON.stringify(snapshot),
    Number(adminUser?.user_id || 0) || null
  ).run();
  const gateId = Number(insert?.meta?.last_row_id || 0) || null;
  await recordConversion(db, adminUser || { user_id: 0 }, requestId, `payment_share_gate_${statusValue}`, 'custom_request_payment_link_approval_gates', gateId, statusValue, blockers.length ? blockers.join('; ') : 'Payment link gate passed.');
  if (blockers.length) return { ok: false, error: `Payment link cannot be shared yet: ${blockers.join('; ')}.`, gate_status: statusValue, blockers, gate_id: gateId, draft, orderDraft, quote };
  return { ok: true, message: 'Payment share gate passed.', gate_status: statusValue, gate_id: gateId, draft, orderDraft, quote };
}

async function runPaymentShareGate(db, adminUser, requestId) {
  const result = await paymentShareGate(db, adminUser, requestId);
  if (!result.ok) return result;
  return { ok: true, message: 'Payment share gate passed. The payment link may now be approved.', target_id: result.gate_id, target_key: 'gate_passed' };
}

async function ensureOrderStatusLink(db, adminUser, requestId, orderId, origin) {
  if (!Number(orderId || 0)) return null;
  const existing = await db.prepare(`SELECT * FROM custom_request_order_status_links WHERE custom_request_id=? AND order_id=? AND link_status IN ('active','viewed') LIMIT 1`).bind(Number(requestId), Number(orderId)).first().catch(() => null);
  if (existing) return { ...existing, share_url: `${origin}/custom-request/order/?token=${encodeURIComponent(existing.order_status_token || '')}` };
  const row = await requestById(db, requestId).catch(() => null);
  const token = `order_${crypto.randomUUID().replace(/-/g, '')}`;
  const insert = await db.prepare(`INSERT INTO custom_request_order_status_links (custom_request_id, order_id, order_status_token, link_status, customer_email, customer_name, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId), Number(orderId), token, row?.email || null, row?.name || null, Number(adminUser?.user_id || 0) || null
  ).run();
  const id = Number(insert?.meta?.last_row_id || 0) || null;
  await recordConversion(db, adminUser || { user_id: 0 }, requestId, 'order_status_link', 'custom_request_order_status_links', id, token, 'Private customer order-status link created.');
  return { custom_request_order_status_link_id: id, order_status_token: token, share_url: `${origin}/custom-request/order/?token=${encodeURIComponent(token)}` };
}

async function approvePaymentLink(db, adminUser, requestId, origin) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const follow = await createAcceptedPaymentAndOrderDrafts(db, adminUser, requestId);
  if (!follow.ok) return follow;
  const gate = await paymentShareGate(db, adminUser, requestId);
  if (!gate.ok) return gate;
  const draft = gate.draft || await db.prepare(`SELECT * FROM custom_request_payment_request_drafts WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (!draft) return { ok: false, error: 'Create a payment request draft first.' };
  const orderDraft = gate.orderDraft || await db.prepare(`SELECT * FROM custom_request_order_drafts WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const orderId = Number(orderDraft?.order_id || 0) || null;
  if (String(draft.payment_request_status || '').toLowerCase() === 'approved_link_active' && draft.approved_payment_link_url) {
    await ensureOrderStatusLink(db, adminUser, requestId, orderId, origin);
    return { ok: true, message: 'Approved payment link already exists.', target_key: draft.payment_request_key, share_url: draft.approved_payment_link_url };
  }
  const existing = await db.prepare(`SELECT * FROM custom_request_payment_links WHERE payment_request_draft_id=? AND link_status IN ('active','viewed','ready_to_pay') LIMIT 1`).bind(Number(draft.custom_request_payment_request_draft_id || 0)).first().catch(() => null);
  if (existing) {
    await ensureOrderStatusLink(db, adminUser, requestId, orderId, origin);
    return { ok: true, message: 'Approved payment link already exists.', target_key: existing.payment_link_key, share_url: `${origin}${existing.link_url_path}` };
  }
  const paymentKey = key('paylink');
  const token = `pay_${crypto.randomUUID().replace(/-/g, '')}`;
  const path = `/custom-request/pay/?token=${encodeURIComponent(token)}`;
  let paymentId = null;
  if (orderId) {
    const existingPayment = await db.prepare(`SELECT payment_id FROM payments WHERE order_id=? AND provider='manual' AND payment_status IN ('pending','authorized') ORDER BY payment_id DESC LIMIT 1`).bind(orderId).first().catch(() => null);
    if (existingPayment?.payment_id) paymentId = Number(existingPayment.payment_id || 0);
    else {
      const paymentInsert = await db.prepare(`INSERT INTO payments (order_id, provider, payment_status, amount_cents, currency, payment_method_label, created_at, updated_at, notes) VALUES (?, 'manual', 'pending', ?, ?, 'Custom request payment review', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`).bind(
        orderId,
        Number(draft.amount_cents || 0),
        draft.currency || 'CAD',
        `Created from approved custom request payment link ${paymentKey}. Stripe/PayPal/Square handoff can be prepared from the private payment page.`
      ).run().catch(() => null);
      paymentId = Number(paymentInsert?.meta?.last_row_id || 0) || null;
    }
  }
  const insert = await db.prepare(`INSERT INTO custom_request_payment_links (
    custom_request_id, payment_request_draft_id, quote_draft_id, order_id, payment_id, payment_link_key, link_token, link_status, link_url_path,
    request_type, amount_cents, tax_cents, currency, customer_name, customer_email, provider, preferred_provider, external_share_status, gate_status, gate_checked_at, gate_notes, approval_notes, approved_by_user_id, approved_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, 'manual_review', 'manual', 'share_allowed', 'passed', CURRENT_TIMESTAMP, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId),
    Number(draft.custom_request_payment_request_draft_id || 0),
    Number(draft.quote_draft_id || 0) || null,
    orderId,
    paymentId,
    paymentKey,
    token,
    path,
    draft.request_type || 'deposit',
    Number(draft.amount_cents || 0),
    Number(draft.tax_cents || 0),
    draft.currency || 'CAD',
    draft.customer_name || row.name || null,
    draft.customer_email || row.email || null,
    'All required approval gates passed: quote lines, positive amount, customer email, and converted real order.',
    'Approved payment link after strict share gate. Customer can choose Stripe/PayPal/Square/manual if configured; no payment is captured by this approval alone.',
    Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await ensureOrderStatusLink(db, adminUser, requestId, orderId, origin);
  await db.prepare(`UPDATE custom_request_payment_request_drafts SET payment_request_status='approved_link_active', approved_payment_link_id=?, approved_payment_link_url=?, reviewed_by_user_id=?, reviewed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE custom_request_payment_request_draft_id=?`).bind(targetId, `${origin}${path}`, Number(adminUser.user_id || 0), Number(draft.custom_request_payment_request_draft_id || 0)).run();
  await recordQuoteRevision(db, adminUser, requestId, draft.quote_draft_id, 'payment_link_approved', 'Reviewed payment request passed strict share gates and became an approved customer payment link.', { payment_link_key: paymentKey, amount_cents: Number(draft.amount_cents || 0), order_id: orderId, payment_id: paymentId });
  await recordConversion(db, adminUser, requestId, 'approved_payment_link', 'custom_request_payment_links', targetId, paymentKey, 'Reviewed payment request passed strict gates and converted to an approved payment link connected to a real order/payment record.');
  return { ok: true, message: 'Approved payment link created after strict payment-share gate.', target_key: paymentKey, target_id: targetId, share_url: `${origin}${path}` };
}

async function convertOrderDraftToOrder(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const follow = await createAcceptedPaymentAndOrderDrafts(db, adminUser, requestId);
  if (!follow.ok) return follow;
  const draft = await db.prepare(`SELECT * FROM custom_request_order_drafts WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (!draft) return { ok: false, error: 'Create an order draft first.' };
  if (Number(draft.order_id || 0) > 0) return { ok: true, message: 'Order draft is already converted to a real order record.', target_key: draft.order_draft_key, target_id: Number(draft.order_id || 0) };
  const orderNumber = `DD-CUSTOM-${Date.now().toString(36).toUpperCase()}-${String(requestId).padStart(4, '0')}`;
  const notes = [
    `Created from custom request ${row.request_key || requestId}.`,
    `Order draft: ${draft.order_draft_key || ''}.`,
    draft.fulfillment_notes || '',
    row.admin_notes ? `Admin notes: ${row.admin_notes}` : ''
  ].filter(Boolean).join('\n');
  const orderInsert = await db.prepare(`INSERT INTO orders (
    order_number, customer_email, customer_name, order_status, payment_status, payment_method, fulfillment_type, currency,
    subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, notes, created_at, updated_at
  ) VALUES (?, ?, ?, 'draft', 'pending', 'manual', 'shipping', ?, ?, 0, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    orderNumber,
    draft.customer_email || row.email || 'custom-request@example.invalid',
    draft.customer_name || row.name || 'Custom request customer',
    draft.currency || 'CAD',
    Number(draft.subtotal_cents || 0),
    Number(draft.shipping_cents || 0),
    Number(draft.tax_cents || 0),
    Number(draft.total_cents || 0),
    notes
  ).run();
  const orderId = Number(orderInsert?.meta?.last_row_id || 0);
  await db.prepare(`INSERT INTO order_items (
    order_id, product_id, sku, product_name, product_type, unit_price_cents, quantity, line_subtotal_cents, taxable, tax_class_code, requires_shipping, digital_file_url, created_at
  ) VALUES (?, NULL, ?, ?, 'physical', ?, 1, ?, 1, 'standard', 1, NULL, CURRENT_TIMESTAMP)`).bind(
    orderId,
    row.request_key || draft.order_draft_key || null,
    titleForRequest(row),
    Number(draft.subtotal_cents || draft.total_cents || 0),
    Number(draft.subtotal_cents || draft.total_cents || 0)
  ).run();
  await db.prepare(`UPDATE custom_request_order_drafts SET order_draft_status='converted_to_order', order_id=?, reviewed_by_user_id=?, reviewed_at=CURRENT_TIMESTAMP, converted_by_user_id=?, converted_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE custom_request_order_draft_id=?`).bind(orderId, Number(adminUser.user_id || 0), Number(adminUser.user_id || 0), Number(draft.custom_request_order_draft_id || 0)).run();
  await db.prepare(`UPDATE custom_requests SET status=CASE WHEN status IN ('quoted','accepted') THEN 'accepted' ELSE status END, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(Number(requestId)).run().catch(() => null);
  await recordQuoteRevision(db, adminUser, requestId, draft.quote_draft_id, 'order_converted', `Order draft converted into real order ${orderNumber}.`, { order_id: orderId, order_number: orderNumber });
  await recordConversion(db, adminUser, requestId, 'order_draft_to_order', 'orders', orderId, orderNumber, 'Reviewed order draft converted into a real order record.');
  await ensureOrderStatusLink(db, adminUser, requestId, orderId, 'https://devilndove.com').catch(() => null);
  return { ok: true, message: `Real order record created: ${orderNumber}.`, target_key: orderNumber, target_id: orderId };
}

async function createQuoteRevisionLink(db, adminUser, requestId, origin) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const quote = await getOrCreateQuote(db, adminUser, requestId);
  await ensureDefaultQuoteLineItems(db, adminUser, row, quote);
  const totals = await syncQuoteTotals(db, quote, row.budget_cents || 0);
  const previous = await db.prepare(`SELECT * FROM custom_request_quote_share_links WHERE custom_request_id=? ORDER BY version_number DESC, datetime(created_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (previous?.custom_request_quote_share_link_id) {
    await db.prepare(`UPDATE custom_request_quote_share_links SET share_status=CASE WHEN share_status IN ('active','viewed') THEN 'superseded' ELSE share_status END, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(Number(requestId)).run().catch(() => null);
  }
  const version = Math.max(1, Number(previous?.version_number || 1) + 1);
  const shareToken = `quote_${crypto.randomUUID().replace(/-/g, '')}`;
  const paymentSummary = JSON.stringify({ subtotal_cents: totals.subtotal_cents, pickup_shipping_cents: totals.pickup_shipping_cents, tax_estimate_cents: totals.tax_estimate_cents, quote_total_cents: totals.quote_total_cents, note: `Quote revision/version ${version}.` });
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const insert = await db.prepare(`INSERT INTO custom_request_quote_share_links (
    custom_request_id, quote_draft_id, share_token, share_status, customer_name, customer_email, title, quote_total_cents,
    scope_summary, payment_summary_json, expires_at, created_by_user_id, version_number, supersedes_share_link_id, resent_at, resend_note, created_at, updated_at
  ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId),
    Number(quote.custom_request_quote_draft_id || 0),
    shareToken,
    row.name || null,
    row.email || null,
    `${titleForRequest(row)} — revision ${version}`,
    Number(totals.quote_total_cents || 0),
    clean(quote.scope_notes || quoteScope(row), 3000),
    paymentSummary,
    expiresAt,
    Number(adminUser.user_id || 0),
    version,
    Number(previous?.custom_request_quote_share_link_id || 0) || null,
    `Revision ${version} link created after quote changes or customer response.`
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await db.prepare(`UPDATE custom_request_quote_drafts SET quote_status='shared', updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(Number(requestId)).run().catch(() => null);
  await recordQuoteRevision(db, adminUser, requestId, quote.custom_request_quote_draft_id, 'quote_revision_link', `Quote revision/version ${version} link created.`, { share_link_id: targetId, version_number: version, quote_total_cents: Number(totals.quote_total_cents || 0) });
  await recordConversion(db, adminUser, requestId, 'quote_revision_link', 'custom_request_quote_share_links', targetId, shareToken, `Quote revision/version ${version} link created for manual resend.`);
  return { ok: true, message: `Quote revision/version ${version} link created.`, target_key: shareToken, target_id: targetId, share_url: `${origin}/custom-request/quote/?token=${encodeURIComponent(shareToken)}` };
}

async function createMarketplaceExportPack(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const quote = await getOrCreateQuote(db, adminUser, requestId);
  const productDraft = await db.prepare(`SELECT * FROM custom_request_product_drafts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const existing = await db.prepare(`SELECT * FROM custom_request_marketplace_export_packs WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const title = clean(productDraft?.suggested_product_name || quote?.title || titleForRequest(row), 120);
  const baseDescription = clean([
    title,
    '',
    'Handmade or workshop-planned Devil n Dove custom piece from Southern Ontario.',
    quote?.scope_notes || quoteScope(row),
    '',
    'Please confirm size, material, colour, timing, local pickup/shipping, and reference-image consent before purchase.',
    'Images must include a main product photo plus proof/detail image before public marketplace posting.'
  ].join('\n'), 4500);
  const tags = ['Devil n Dove', 'Southern Ontario', row.request_type || 'custom gift', 'handmade', 'local maker'].filter(Boolean);
  await seedMarketplacePresets(db);
  const presets = defaultMarketplacePresets();
  const mergedTags = Array.from(new Set([...tags, ...(presets.etsy.tags || []), ...(presets.facebook.tags || []), ...(presets.pinterest.tags || [])])).slice(0, 13);
  const etsyCsv = { title: clean(title, 140), description: clean(baseDescription, 4500), price: Number(quote?.quote_total_cents || row.budget_cents || 0) > 0 ? (Number(quote?.quote_total_cents || row.budget_cents || 0) / 100).toFixed(2) : '', quantity: 1, category: presets.etsy.category_label, shipping_profile: presets.etsy.shipping_profile_label, tags: mergedTags.join(', ') };
  const facebookCsv = { title: clean(`${title} | Devil n Dove`, 100), description: clean(`${baseDescription}

Local pickup/shipping to be confirmed.`, 4500), price: Number(quote?.quote_total_cents || row.budget_cents || 0) > 0 ? (Number(quote?.quote_total_cents || row.budget_cents || 0) / 100).toFixed(2) : '', category: presets.facebook.category_label, availability: 'single_item', shipping_profile: presets.facebook.shipping_profile_label, tags: presets.facebook.tags.join(', ') };
  const pinterestCsv = { title: clean(`${title} by Devil n Dove`, 100), description: clean(`Custom workshop-made gift idea from Devil n Dove in Southern Ontario. ${row.product_interest || row.request_type || ''}`, 500), board: presets.pinterest.category_label, destination_url: '/custom-request/', tags: presets.pinterest.tags.join(', ') };
  const manualCsv = { title, description: baseDescription, price_note: 'Review final price, shipping, tax, marketplace fees, and media consent before posting.', category: presets.manual.category_label, shipping_profile: presets.manual.shipping_profile_label, tags: presets.manual.tags.join(', ') };
  const manualCopy = [
    `TITLE: ${title}`,
    '',
    `PRICE: ${money(quote?.quote_total_cents || row.budget_cents || 0)} CAD review-needed`,
    '',
    baseDescription,
    '',
    `TAGS: ${tags.join(', ')}`
  ].join('\n');
  const values = {
    etsy_title: clean(title, 140),
    etsy_description: clean(baseDescription, 4500),
    facebook_title: clean(`${title} | Devil n Dove`, 100),
    facebook_description: clean(`${baseDescription}\n\nLocal pickup/shipping to be confirmed.`, 4500),
    pinterest_title: clean(`${title} by Devil n Dove`, 100),
    pinterest_description: clean(`Custom workshop-made gift idea from Devil n Dove in Southern Ontario. ${row.product_interest || row.request_type || ''}`, 500),
    manual_listing_copy: clean(manualCopy, 5000),
    tags_json: JSON.stringify(mergedTags || tags),
    readiness_notes: 'Draft export only. Confirm price, images, consent, shipping, category, marketplace fees, and product readiness before posting.'
  };
  if (existing) {
    await db.prepare(`UPDATE custom_request_marketplace_export_packs SET etsy_title=?, etsy_description=?, facebook_title=?, facebook_description=?, pinterest_title=?, pinterest_description=?, manual_listing_copy=?, tags_json=?, readiness_notes=?, etsy_csv_row_json=?, facebook_csv_row_json=?, pinterest_csv_row_json=?, manual_csv_row_json=?, preset_summary_json=?, csv_status='ready', updated_at=CURRENT_TIMESTAMP WHERE custom_request_marketplace_export_pack_id=?`).bind(
      values.etsy_title, values.etsy_description, values.facebook_title, values.facebook_description, values.pinterest_title, values.pinterest_description, values.manual_listing_copy, values.tags_json, values.readiness_notes, JSON.stringify(etsyCsv), JSON.stringify(facebookCsv), JSON.stringify(pinterestCsv), JSON.stringify(manualCsv), JSON.stringify(presets), Number(existing.custom_request_marketplace_export_pack_id || 0)
    ).run();
    await recordConversion(db, adminUser, requestId, 'marketplace_export_pack_refreshed', 'custom_request_marketplace_export_packs', existing.custom_request_marketplace_export_pack_id, existing.pack_key, 'Marketplace export pack refreshed.');
    return { ok: true, message: 'Marketplace export pack refreshed.', target_key: existing.pack_key, target_id: existing.custom_request_marketplace_export_pack_id };
  }
  const packKey = key('mktpack');
  const insert = await db.prepare(`INSERT INTO custom_request_marketplace_export_packs (
    custom_request_id, quote_draft_id, product_draft_id, pack_key, pack_status, etsy_title, etsy_description,
    facebook_title, facebook_description, pinterest_title, pinterest_description, manual_listing_copy, tags_json,
    readiness_notes, etsy_csv_row_json, facebook_csv_row_json, pinterest_csv_row_json, manual_csv_row_json, preset_summary_json, csv_status,
    created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId),
    Number(quote?.custom_request_quote_draft_id || 0) || null,
    Number(productDraft?.custom_request_product_draft_id || 0) || null,
    packKey,
    values.etsy_title,
    values.etsy_description,
    values.facebook_title,
    values.facebook_description,
    values.pinterest_title,
    values.pinterest_description,
    values.manual_listing_copy,
    values.tags_json,
    values.readiness_notes,
    JSON.stringify(etsyCsv),
    JSON.stringify(facebookCsv),
    JSON.stringify(pinterestCsv),
    JSON.stringify(manualCsv),
    JSON.stringify(presets),
    Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await recordConversion(db, adminUser, requestId, 'marketplace_export_pack', 'custom_request_marketplace_export_packs', targetId, packKey, 'Marketplace export copy pack created for Etsy, Facebook Marketplace, Pinterest, and manual listings.');
  return { ok: true, message: 'Marketplace export pack created.', target_key: packKey, target_id: targetId };
}

async function createPostFulfillmentPrompts(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const orderDraft = await db.prepare(`SELECT * FROM custom_request_order_drafts WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  const existing = await db.prepare(`SELECT * FROM custom_request_fulfillment_prompts WHERE custom_request_id=? LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (existing) return { ok: true, message: 'Post-fulfillment prompt already exists.', target_key: existing.prompt_key, target_id: existing.custom_request_fulfillment_prompt_id };
  const promptKey = key('fulfillprompt');
  const promptToken = `consent_${crypto.randomUUID().replace(/-/g, '')}`;
  const subject = clean(`Thank you for your Devil n Dove custom piece`, 180);
  const body = clean(`Hi ${row.name || 'there'},\n\nThank you again for letting us make your custom Devil n Dove piece: ${titleForRequest(row)}.\n\nWhen everything is received and you have had a chance to look it over, we would love a short review or a quick note about what you liked. If you are comfortable with it, we may also ask whether finished photos or process photos can be used on our website, gallery, or social posts.\n\nNo pressure — private custom work stays private unless you clearly approve public use.\n\nThanks,\nDevil n Dove`, 2500);
  const consentQuestion = clean(`May Devil n Dove use finished photos or process photos from this custom request in public product stories, gallery examples, or social media? Please reply with one of: private only, website/gallery okay, social okay, or all public okay.`, 800);
  const insert = await db.prepare(`INSERT INTO custom_request_fulfillment_prompts (
    custom_request_id, order_id, prompt_key, prompt_token, prompt_status, prompt_type, public_response_status, customer_name, customer_email,
    subject, body_text, consent_question_text, created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, ?, ?, 'draft', 'review_photo_consent', 'not_sent', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId),
    Number(orderDraft?.order_id || 0) || null,
    promptKey,
    promptToken,
    row.name || null,
    row.email || null,
    subject,
    body,
    consentQuestion,
    Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await recordConversion(db, adminUser, requestId, 'post_fulfillment_prompt', 'custom_request_fulfillment_prompts', targetId, promptKey, 'Review/photo/consent prompt created for manual sending after fulfillment.');
  return { ok: true, message: 'Post-fulfillment review/photo/consent prompt created.', target_key: promptKey, target_id: targetId };
}


function defaultMarketplacePresets() {
  return {
    etsy: {
      category_label: 'Handmade > Home & Living / Jewelry > Custom order review needed',
      shipping_profile_label: 'Devil n Dove Canada Post / local pickup review',
      tags: ['custom gift', 'handmade Ontario', 'Devil n Dove', 'personalized gift', 'small batch', 'artisan']
    },
    facebook: {
      category_label: 'Home Decor / Jewellery / Handmade Goods',
      shipping_profile_label: 'Local pickup or shipping by arrangement',
      tags: ['local maker', 'handmade', 'custom gift', 'Southern Ontario']
    },
    pinterest: {
      category_label: 'Handmade gift idea pin',
      shipping_profile_label: 'Link to product or custom request page',
      tags: ['handmade gifts', 'custom order', 'Ontario maker', 'Devil n Dove']
    },
    manual: {
      category_label: 'Manual listing review',
      shipping_profile_label: 'Confirm per item',
      tags: ['handmade', 'custom', 'local']
    }
  };
}

async function seedMarketplacePresets(db) {
  const presets = defaultMarketplacePresets();
  for (const [channel, preset] of Object.entries(presets)) {
    await db.prepare(`INSERT INTO marketplace_channel_presets (channel, category_label, shipping_profile_label, default_tags_json, default_fields_json, preset_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(channel) DO UPDATE SET
        category_label = COALESCE(marketplace_channel_presets.category_label, excluded.category_label),
        shipping_profile_label = COALESCE(marketplace_channel_presets.shipping_profile_label, excluded.shipping_profile_label),
        default_tags_json = COALESCE(marketplace_channel_presets.default_tags_json, excluded.default_tags_json),
        default_fields_json = COALESCE(marketplace_channel_presets.default_fields_json, excluded.default_fields_json),
        updated_at = CURRENT_TIMESTAMP`).bind(
      channel,
      preset.category_label,
      preset.shipping_profile_label,
      JSON.stringify(preset.tags || []),
      JSON.stringify({ category_label: preset.category_label, shipping_profile_label: preset.shipping_profile_label })
    ).run().catch(() => null);
  }
}

function nextOrderStage(currentStage) {
  const flow = [
    ['planning', 'Planning'],
    ['making', 'Making'],
    ['curing_finishing', 'Curing / finishing'],
    ['ready', 'Ready for pickup/shipping'],
    ['shipped_pickup', 'Shipped / picked up'],
    ['complete', 'Complete']
  ];
  const current = String(currentStage || 'planning').toLowerCase();
  const index = flow.findIndex(([key]) => key === current);
  return flow[Math.min(index + 1, flow.length - 1)] || flow[0];
}

async function advanceOrderStage(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  let orderLink = await db.prepare(`SELECT * FROM custom_request_order_status_links WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (!orderLink) {
    const draft = await db.prepare(`SELECT * FROM custom_request_order_drafts WHERE custom_request_id=? AND order_id IS NOT NULL ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
    if (draft?.order_id) {
      await ensureOrderStatusLink(db, adminUser, requestId, Number(draft.order_id || 0), 'https://devilndove.com').catch(() => null);
      orderLink = await db.prepare(`SELECT * FROM custom_request_order_status_links WHERE custom_request_id=? ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
    }
  }
  if (!orderLink) return { ok: false, error: 'Create or convert a customer order before updating order stage.' };
  const [stageKey, stageLabel] = nextOrderStage(orderLink.order_stage || 'planning');
  const note = `Custom request moved to ${stageLabel}.`;
  await db.prepare(`UPDATE custom_request_order_status_links SET order_stage=?, stage_notes=?, stage_updated_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE custom_request_order_status_link_id=?`).bind(stageKey, note, Number(orderLink.custom_request_order_status_link_id || 0)).run();
  if (Number(orderLink.order_id || 0)) {
    const orderStatus = stageKey === 'complete' ? 'fulfilled' : (stageKey === 'shipped_pickup' ? 'fulfilled' : 'pending');
    await db.prepare(`UPDATE orders SET order_status=CASE WHEN order_status IN ('cancelled','refunded') THEN order_status ELSE ? END, notes=COALESCE(notes,'') || ?, updated_at=CURRENT_TIMESTAMP WHERE order_id=?`).bind(orderStatus, `\nStage update: ${note}`, Number(orderLink.order_id || 0)).run().catch(() => null);
  }
  const insert = await db.prepare(`INSERT INTO custom_request_order_stage_events (custom_request_id, order_id, stage_key, stage_label, stage_status, stage_notes, created_by_user_id, created_at) VALUES (?, ?, ?, ?, 'current', ?, ?, CURRENT_TIMESTAMP)`).bind(Number(requestId), Number(orderLink.order_id || 0) || null, stageKey, stageLabel, note, Number(adminUser.user_id || 0)).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await recordConversion(db, adminUser, requestId, `order_stage_${stageKey}`, 'custom_request_order_stage_events', targetId, stageKey, note);
  return { ok: true, message: `Order stage updated to ${stageLabel}.`, target_key: stageKey, target_id: targetId };
}

async function manageCustomRequestLinks(db, adminUser, requestId, mode) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const safeMode = ['void', 'expire', 'resend'].includes(mode) ? mode : 'resend';
  const note = `${safeMode} action recorded by admin.`;
  if (safeMode === 'void') {
    await db.prepare(`UPDATE custom_request_quote_share_links SET share_status='void', voided_at=CURRENT_TIMESTAMP, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=? AND share_status IN ('active','viewed','superseded')`).bind(note, Number(requestId)).run().catch(() => null);
    await db.prepare(`UPDATE custom_request_payment_links SET link_status='void', external_share_status='voided', voided_at=CURRENT_TIMESTAMP, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=? AND link_status IN ('active','viewed','ready_to_pay')`).bind(note, Number(requestId)).run().catch(() => null);
    await db.prepare(`UPDATE custom_request_order_status_links SET link_status='void', voided_at=CURRENT_TIMESTAMP, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=? AND link_status IN ('active','viewed')`).bind(note, Number(requestId)).run().catch(() => null);
    await db.prepare(`UPDATE custom_request_fulfillment_prompts SET prompt_status='void', public_response_status=CASE WHEN public_response_status='responded' THEN public_response_status ELSE 'voided' END, voided_at=CURRENT_TIMESTAMP, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=? AND prompt_status IN ('draft','sent','active')`).bind(note, Number(requestId)).run().catch(() => null);
  } else if (safeMode === 'expire') {
    await db.prepare(`UPDATE custom_request_quote_share_links SET share_status='expired', expired_at=CURRENT_TIMESTAMP, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=? AND share_status IN ('active','viewed')`).bind(note, Number(requestId)).run().catch(() => null);
    await db.prepare(`UPDATE custom_request_payment_links SET link_status='expired', external_share_status='expired', expired_at=CURRENT_TIMESTAMP, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=? AND link_status IN ('active','viewed','ready_to_pay')`).bind(note, Number(requestId)).run().catch(() => null);
    await db.prepare(`UPDATE custom_request_order_status_links SET link_status='expired', expired_at=CURRENT_TIMESTAMP, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=? AND link_status IN ('active','viewed')`).bind(note, Number(requestId)).run().catch(() => null);
    await db.prepare(`UPDATE custom_request_fulfillment_prompts SET prompt_status='expired', public_response_status=CASE WHEN public_response_status='responded' THEN public_response_status ELSE 'expired' END, expired_at=CURRENT_TIMESTAMP, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=? AND prompt_status IN ('draft','sent','active')`).bind(note, Number(requestId)).run().catch(() => null);
  } else {
    await db.prepare(`UPDATE custom_request_quote_share_links SET share_status=CASE WHEN share_status IN ('expired','void') THEN 'active' ELSE share_status END, resent_at=CURRENT_TIMESTAMP, resend_count=COALESCE(resend_count,0)+1, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(note, Number(requestId)).run().catch(() => null);
    await db.prepare(`UPDATE custom_request_payment_links SET link_status=CASE WHEN link_status IN ('expired','void') THEN 'active' ELSE link_status END, external_share_status=CASE WHEN gate_status='passed' THEN 'share_allowed' ELSE external_share_status END, resent_at=CURRENT_TIMESTAMP, resend_count=COALESCE(resend_count,0)+1, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(note, Number(requestId)).run().catch(() => null);
    await db.prepare(`UPDATE custom_request_order_status_links SET link_status=CASE WHEN link_status IN ('expired','void') THEN 'active' ELSE link_status END, resent_at=CURRENT_TIMESTAMP, resend_count=COALESCE(resend_count,0)+1, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(note, Number(requestId)).run().catch(() => null);
    await db.prepare(`UPDATE custom_request_fulfillment_prompts SET prompt_status=CASE WHEN prompt_status IN ('expired','void') THEN 'draft' ELSE prompt_status END, public_response_status=CASE WHEN public_response_status IN ('expired','voided') THEN 'not_sent' ELSE public_response_status END, resent_at=CURRENT_TIMESTAMP, resend_count=COALESCE(resend_count,0)+1, lifecycle_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(note, Number(requestId)).run().catch(() => null);
  }
  await recordConversion(db, adminUser, requestId, `${safeMode}_customer_links`, 'custom_requests', Number(requestId), row.request_key || String(requestId), `Quote/payment/order/consent link ${safeMode} controls applied.`);
  return { ok: true, message: `Customer quote/payment/order/consent links ${safeMode === 'resend' ? 'marked for resend' : `${safeMode}ed`}.`, target_key: row.request_key || String(requestId), target_id: Number(requestId) };
}

async function createConsentProofCandidate(db, adminUser, requestId) {
  const row = await requestById(db, requestId);
  if (!row) return { ok: false, error: 'Custom request was not found.' };
  const prompt = await db.prepare(`SELECT * FROM custom_request_fulfillment_prompts WHERE custom_request_id=? AND public_response_status='responded' ORDER BY datetime(responded_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (!prompt) return { ok: false, error: 'No responded consent prompt found yet.' };
  if (String(prompt.public_use_scope || '') === 'private_only') return { ok: false, error: 'Customer chose private-only use, so no public proof candidate was created.' };
  const existing = await db.prepare(`SELECT * FROM custom_request_public_proof_candidates WHERE custom_request_id=? AND fulfillment_prompt_id=? LIMIT 1`).bind(Number(requestId), Number(prompt.custom_request_fulfillment_prompt_id || 0)).first().catch(() => null);
  if (existing) return { ok: true, message: 'Public proof candidate already exists for this consent response.', target_key: existing.candidate_key, target_id: existing.custom_request_public_proof_candidate_id };
  const candidateKey = key('proof');
  const title = clean(`Custom work review: ${titleForRequest(row)}`, 180);
  const body = clean(prompt.review_text || prompt.customer_response_note || `Customer approved public proof use for ${titleForRequest(row)}.`, 1200);
  const insert = await db.prepare(`INSERT INTO custom_request_public_proof_candidates (custom_request_id, fulfillment_prompt_id, candidate_key, candidate_type, candidate_status, public_use_scope, title, body_text, attribution_label, locality_label, source_review_text, customer_note, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'trust_block', 'review_needed', ?, ?, ?, ?, 'Southern Ontario', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(requestId),
    Number(prompt.custom_request_fulfillment_prompt_id || 0),
    candidateKey,
    prompt.public_use_scope || 'website_gallery',
    title,
    body,
    row.name ? `${String(row.name).split(' ')[0]} — custom request customer` : 'Custom request customer',
    prompt.review_text || null,
    prompt.customer_response_note || null,
    Number(adminUser.user_id || 0)
  ).run();
  const targetId = Number(insert?.meta?.last_row_id || 0) || null;
  await db.prepare(`UPDATE custom_request_fulfillment_prompts SET public_proof_candidate_id=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_fulfillment_prompt_id=?`).bind(targetId, Number(prompt.custom_request_fulfillment_prompt_id || 0)).run().catch(() => null);
  await recordConversion(db, adminUser, requestId, 'public_proof_candidate', 'custom_request_public_proof_candidates', targetId, candidateKey, 'Consent response converted into a review-needed public proof candidate.');
  return { ok: true, message: 'Public proof candidate created for admin review.', target_key: candidateKey, target_id: targetId };
}

async function approveConsentPublicProof(db, adminUser, requestId) {
  const candidate = await db.prepare(`SELECT * FROM custom_request_public_proof_candidates WHERE custom_request_id=? AND candidate_status IN ('review_needed','approved') ORDER BY datetime(updated_at) DESC LIMIT 1`).bind(Number(requestId)).first().catch(() => null);
  if (!candidate) {
    const created = await createConsentProofCandidate(db, adminUser, requestId);
    if (!created.ok) return created;
    return approveConsentPublicProof(db, adminUser, requestId);
  }
  await db.prepare(`CREATE TABLE IF NOT EXISTS trust_block_items (
    trust_block_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_key TEXT UNIQUE,
    item_kind TEXT NOT NULL DEFAULT 'testimonial',
    display_context TEXT NOT NULL DEFAULT 'sitewide',
    title TEXT,
    body TEXT,
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
  )`).run().catch(() => null);
  const itemKey = key('trust');
  const trustInsert = await db.prepare(`INSERT INTO trust_block_items (item_key, item_kind, display_context, title, body, attribution_label, rating_label, locality_label, status, is_featured, approved_for_public_use, privacy_review_status, internal_notes, created_by_user_id, approved_by_user_id, approved_at, created_at, updated_at) VALUES (?, 'testimonial', 'custom_work', ?, ?, ?, 'Custom work', ?, 'active', 0, 1, 'approved', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    itemKey,
    candidate.title || 'Custom work review',
    candidate.body_text || candidate.source_review_text || 'Customer approved a public custom-work proof note.',
    candidate.attribution_label || 'Custom request customer',
    candidate.locality_label || 'Southern Ontario',
    `Approved from consent candidate ${candidate.candidate_key}. Scope: ${candidate.public_use_scope || ''}`,
    Number(adminUser.user_id || 0),
    Number(adminUser.user_id || 0)
  ).run();
  const trustId = Number(trustInsert?.meta?.last_row_id || 0) || null;
  await db.prepare(`UPDATE custom_request_public_proof_candidates SET candidate_status='approved', trust_block_item_id=?, approved_by_user_id=?, approved_at=CURRENT_TIMESTAMP, review_notes='Approved into public trust block.', updated_at=CURRENT_TIMESTAMP WHERE custom_request_public_proof_candidate_id=?`).bind(trustId, Number(adminUser.user_id || 0), Number(candidate.custom_request_public_proof_candidate_id || 0)).run();
  await recordConversion(db, adminUser, requestId, 'public_proof_approved', 'trust_block_items', trustId, itemKey, 'Consent response approved into a public trust block.');
  return { ok: true, message: 'Consent response approved into a public trust block.', target_key: itemKey, target_id: trustId };
}

async function testPaymentProviderHandoffs(db, env, adminUser) {
  const checks = [
    { provider: 'stripe', ok: Boolean(env.STRIPE_SECRET_KEY), mode: env.STRIPE_SECRET_KEY ? 'configured' : 'missing_secret', note: env.STRIPE_SECRET_KEY ? 'Stripe secret key is configured. Run a real checkout test with a low-value order before production use.' : 'STRIPE_SECRET_KEY is missing.' },
    { provider: 'paypal', ok: Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_SECRET), mode: env.PAYPAL_ENV || 'sandbox', note: env.PAYPAL_CLIENT_ID && env.PAYPAL_SECRET ? `PayPal credentials are configured in ${env.PAYPAL_ENV || 'sandbox'} mode. Confirm live mode before production.` : 'PAYPAL_CLIENT_ID or PAYPAL_SECRET is missing.' },
    { provider: 'square', ok: Boolean(env.SQUARE_ACCESS_TOKEN || env.SQUARE_APP_ID), mode: env.SQUARE_ENV || 'not_configured', note: env.SQUARE_ACCESS_TOKEN || env.SQUARE_APP_ID ? 'Square environment variables are present, but live Square checkout still needs a provider implementation test.' : 'Square credentials are not configured.' }
  ];
  for (const check of checks) {
    await db.prepare(`INSERT INTO custom_request_payment_provider_tests (provider, test_status, mode, result_notes, checked_by_user_id, checked_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(check.provider, check.ok ? 'configured_needs_live_test' : 'not_configured', check.mode, check.note, Number(adminUser.user_id || 0)).run().catch(() => null);
  }
  return { ok: true, message: 'Payment provider readiness checks recorded. This does not charge cards; real credential checkout should still be tested manually.', target_key: 'payment-provider-readiness' };
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function csvResponse(filename, headers, rowsData) {
  const body = [headers.join(','), ...rowsData.map((row) => headers.map((h) => csvEscape(row[h] ?? '')).join(','))].join('\n');
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } });
}

async function saveMarketplacePreset(db, adminUser, payload = {}) {
  await seedMarketplacePresets(db);
  const channel = clean(payload.channel || '', 40).toLowerCase();
  if (!['etsy','facebook','pinterest','manual'].includes(channel)) throw new Error('Choose a supported marketplace channel.');
  let tags = [];
  try {
    const parsed = JSON.parse(clean(payload.default_tags_json || '[]', 1200) || '[]');
    tags = Array.isArray(parsed) ? parsed.map((item) => clean(item, 60)).filter(Boolean).slice(0, 30) : [];
  } catch {
    tags = clean(payload.default_tags_json || '', 1200).split(/[,
;|]+/).map((item) => clean(item, 60)).filter(Boolean).slice(0, 30);
  }
  await db.prepare(`INSERT INTO marketplace_channel_presets (channel, category_label, shipping_profile_label, default_tags_json, default_fields_json, preset_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, '{}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(channel) DO UPDATE SET category_label=excluded.category_label, shipping_profile_label=excluded.shipping_profile_label, default_tags_json=excluded.default_tags_json, preset_status='active', updated_at=CURRENT_TIMESTAMP`)
    .bind(channel, clean(payload.category_label || '', 120), clean(payload.shipping_profile_label || '', 120), JSON.stringify(tags)).run();
  return { ok: true, message: `Marketplace preset saved for ${channel}.`, channel, updated_by: adminUser?.email || '' };
}

async function marketplaceCsv(context, db) {
  await ensureSchema(db);
  await seedMarketplacePresets(db).catch(() => null);
  const url = new URL(context.request.url);
  const channel = clean(url.searchParams.get('channel') || 'all', 40).toLowerCase();
  const rowsData = rows(await db.prepare(`SELECT * FROM custom_request_marketplace_export_packs ORDER BY datetime(updated_at) DESC LIMIT 500`).all().catch(() => ({ results: [] })));
  const headers = ['channel','pack_key','custom_request_id','title','description','price','category','shipping_profile','tags','destination_url','readiness_notes','status','updated_at'];
  const out = [];
  const parse = (value) => { try { const parsed = JSON.parse(value || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; } };
  rowsData.forEach((pack) => {
    const etsy = parse(pack.etsy_csv_row_json);
    const facebook = parse(pack.facebook_csv_row_json);
    const pinterest = parse(pack.pinterest_csv_row_json);
    const manual = parse(pack.manual_csv_row_json);
    const tags = (() => { try { const parsed = JSON.parse(pack.tags_json || '[]'); return Array.isArray(parsed) ? parsed.join(', ') : String(pack.tags_json || ''); } catch { return String(pack.tags_json || ''); } })();
    const add = (name, row) => out.push({
      channel: name,
      pack_key: pack.pack_key || '',
      custom_request_id: pack.custom_request_id || '',
      title: row.title || pack.etsy_title || pack.facebook_title || pack.pinterest_title || '',
      description: row.description || pack.manual_listing_copy || '',
      price: row.price || '',
      category: row.category || row.board || '',
      shipping_profile: row.shipping_profile || '',
      tags: row.tags || tags,
      destination_url: row.destination_url || '/custom-request/',
      readiness_notes: pack.readiness_notes || 'Review final price, media consent, shipping, and channel rules before posting.',
      status: pack.pack_status || 'draft',
      updated_at: pack.updated_at || ''
    });
    if (channel === 'all' || channel === 'etsy') add('etsy', etsy);
    if (channel === 'all' || channel === 'facebook') add('facebook_marketplace', facebook);
    if (channel === 'all' || channel === 'pinterest') add('pinterest', pinterest);
    if (channel === 'all' || channel === 'manual') add('manual_listing', manual);
  });
  return csvResponse(`devilndove-marketplace-${channel || 'all'}-export.csv`, headers, out);
}



export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try {
    const url = new URL(context.request.url);
    if (String(url.searchParams.get('format') || '').toLowerCase() === 'marketplace_csv') return marketplaceCsv(context, db);
    return jsonResponse(await listPayload(db), 200, { 'Cache-Control': 'no-store' });
  }
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
    else if (action === 'create_accepted_payment_order_drafts') actionResult = await createAcceptedPaymentAndOrderDrafts(db, adminUser, id);
    else if (action === 'create_quote_preview_link') actionResult = await createQuotePreviewLink(db, adminUser, id, new URL(context.request.url).origin);
    else if (action === 'create_quote_revision_link') actionResult = await createQuoteRevisionLink(db, adminUser, id, new URL(context.request.url).origin);
    else if (action === 'run_payment_share_gate') actionResult = await runPaymentShareGate(db, adminUser, id);
    else if (action === 'approve_payment_link') actionResult = await approvePaymentLink(db, adminUser, id, new URL(context.request.url).origin);
    else if (action === 'convert_order_draft_to_order') actionResult = await convertOrderDraftToOrder(db, adminUser, id);
    else if (action === 'create_marketplace_export_pack') actionResult = await createMarketplaceExportPack(db, adminUser, id);
    else if (action === 'create_post_fulfillment_prompts') actionResult = await createPostFulfillmentPrompts(db, adminUser, id);
    else if (action === 'advance_order_stage') actionResult = await advanceOrderStage(db, adminUser, id);
    else if (action === 'void_custom_links') actionResult = await manageCustomRequestLinks(db, adminUser, id, 'void');
    else if (action === 'expire_custom_links') actionResult = await manageCustomRequestLinks(db, adminUser, id, 'expire');
    else if (action === 'resend_custom_links') actionResult = await manageCustomRequestLinks(db, adminUser, id, 'resend');
    else if (action === 'create_consent_proof_candidate') actionResult = await createConsentProofCandidate(db, adminUser, id);
    else if (action === 'approve_consent_public_proof') actionResult = await approveConsentPublicProof(db, adminUser, id);
    else if (action === 'test_payment_provider_handoffs') actionResult = await testPaymentProviderHandoffs(db, context.env, adminUser);
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
