// File: /functions/api/admin/value-ops-followthrough.js
// Build 191: configurable fees/cost defaults, margin gates, customer notes/story outputs,
// Search Console mapping preview, GBP tasks, review eligibility, approved galleries,
// server-backed mobile drafts, performance evidence, owner summaries, freshness, QA, and live environment checks.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 191';
const CACHE_HEADERS = { 'Cache-Control': 'no-store' };

function json(data, status = 200) { return jsonResponse(data, status, CACHE_HEADERS); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, max = 1200) {
  const text = normalizeText(value);
  return text.length > max ? text.slice(0, max).trim() : text;
}
function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function integer(value, fallback = 0) { return Math.round(number(value, fallback)); }
function lower(value) { return clean(value, 300).toLowerCase(); }
function safeJson(value, fallback = {}) { try { return JSON.parse(value || ''); } catch { return fallback; } }
function bool(value) { return value === true || value === 1 || String(value || '').toLowerCase() === 'true'; }

async function safeAll(db, sql, bindings = []) {
  try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; }
}
async function safeFirst(db, sql, bindings = [], fallback = null) {
  try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; }
}
async function safeRun(db, sql, bindings = []) {
  try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; }
}
async function tableExists(db, name) {
  return !!(await safeFirst(db, `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`, [name], null));
}

async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS marketplace_channel_fee_settings (
      marketplace_channel_fee_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_key TEXT NOT NULL UNIQUE, channel_label TEXT NOT NULL,
      percent_rate REAL NOT NULL DEFAULT 0, fixed_fee_cents INTEGER NOT NULL DEFAULT 0,
      payment_percent_rate REAL NOT NULL DEFAULT 0, payment_fixed_fee_cents INTEGER NOT NULL DEFAULT 0,
      advertising_percent_rate REAL NOT NULL DEFAULT 0, reserve_percent_rate REAL NOT NULL DEFAULT 0,
      calculation_status TEXT NOT NULL DEFAULT 'needs_configuration', effective_date TEXT,
      source_note TEXT, updated_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS product_family_cost_defaults (
      product_family_cost_default_id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_key TEXT NOT NULL UNIQUE, family_label TEXT NOT NULL,
      material_cost_cents INTEGER NOT NULL DEFAULT 0, labour_minutes INTEGER NOT NULL DEFAULT 0,
      labour_rate_cents_per_hour INTEGER NOT NULL DEFAULT 0, packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
      overhead_percent REAL NOT NULL DEFAULT 0, waste_percent REAL NOT NULL DEFAULT 0,
      default_channel_key TEXT, calculation_status TEXT NOT NULL DEFAULT 'needs_configuration',
      updated_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS marketplace_margin_override_history (
      marketplace_margin_override_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL, channel_key TEXT NOT NULL, margin_status TEXT NOT NULL DEFAULT 'blocked',
      requested_reason TEXT, requested_by_user_id INTEGER, requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
      approval_status TEXT NOT NULL DEFAULT 'pending', approved_by_user_id INTEGER, approved_at TEXT,
      expires_at TEXT, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS customer_timeline_admin_notes (
      customer_timeline_admin_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_key TEXT NOT NULL, customer_email TEXT, note_text TEXT NOT NULL,
      visibility_scope TEXT NOT NULL DEFAULT 'admin_private', note_status TEXT NOT NULL DEFAULT 'active',
      created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS customer_story_output_drafts (
      customer_story_output_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_story_approval_batch_id INTEGER, source_kind TEXT NOT NULL, source_record_id INTEGER,
      product_id INTEGER, customer_key TEXT, consent_evidence_url TEXT, product_story_title TEXT,
      product_story_body TEXT, trust_block_body TEXT, gallery_caption TEXT, social_snippet TEXT,
      output_status TEXT NOT NULL DEFAULT 'draft', created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS search_console_mapping_previews (
      search_console_mapping_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_file TEXT, detected_headers_json TEXT NOT NULL DEFAULT '[]', mapping_json TEXT NOT NULL DEFAULT '{}',
      sample_rows_json TEXT NOT NULL DEFAULT '[]', validation_status TEXT NOT NULL DEFAULT 'needs_review',
      validation_notes TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS gbp_monthly_task_reminders (
      gbp_monthly_task_reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_month TEXT NOT NULL, task_key TEXT NOT NULL, task_label TEXT NOT NULL, page_path TEXT,
      task_status TEXT NOT NULL DEFAULT 'open', completed_at TEXT, completed_by_user_id INTEGER,
      evidence_url TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(task_month, task_key, page_path)
    )`,
    `CREATE TABLE IF NOT EXISTS review_request_eligibility_rows (
      review_request_eligibility_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE, customer_email TEXT, order_status TEXT, payment_status TEXT,
      fulfilled_at TEXT, eligible_after TEXT, eligibility_status TEXT NOT NULL DEFAULT 'needs_review',
      permission_status TEXT NOT NULL DEFAULT 'needs_review', cooldown_status TEXT NOT NULL DEFAULT 'not_checked',
      exclusion_reason TEXT, last_review_request_at TEXT, reviewed_by_user_id INTEGER, reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS approved_before_after_gallery_items (
      approved_before_after_gallery_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      gallery_key TEXT NOT NULL UNIQUE, gallery_label TEXT NOT NULL, proof_kind TEXT NOT NULL DEFAULT 'before_after',
      route_context TEXT NOT NULL DEFAULT '/gallery/', product_id INTEGER, custom_request_id INTEGER,
      before_image_url TEXT, after_image_url TEXT, process_image_url TEXT, alt_text TEXT, story_note TEXT,
      consent_status TEXT NOT NULL DEFAULT 'needs_review', public_use_status TEXT NOT NULL DEFAULT 'needs_review',
      approval_status TEXT NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0,
      approved_by_user_id INTEGER, approved_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS product_image_role_requirements (
      product_image_role_requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_key TEXT NOT NULL, role_key TEXT NOT NULL, role_label TEXT NOT NULL, role_description TEXT,
      minimum_count INTEGER NOT NULL DEFAULT 0, is_publish_blocker INTEGER NOT NULL DEFAULT 0,
      phone_prompt TEXT, desktop_prompt TEXT, is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(family_key, role_key)
    )`,
    `CREATE TABLE IF NOT EXISTS mobile_product_server_drafts (
      mobile_product_server_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
      draft_key TEXT NOT NULL UNIQUE, user_id INTEGER, device_key TEXT,
      route_path TEXT NOT NULL DEFAULT '/admin/mobile-product/', payload_json TEXT NOT NULL DEFAULT '{}',
      field_count INTEGER NOT NULL DEFAULT 0, image_count INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced', client_saved_at TEXT,
      server_saved_at TEXT DEFAULT CURRENT_TIMESTAMP, recovered_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS deployed_performance_measurements (
      deployed_performance_measurement_id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_path TEXT NOT NULL, measured_url TEXT, device_profile TEXT NOT NULL DEFAULT 'mobile',
      performance_score INTEGER, accessibility_score INTEGER, seo_score INTEGER, best_practices_score INTEGER,
      largest_contentful_paint_ms INTEGER, cumulative_layout_shift REAL, interaction_to_next_paint_ms INTEGER,
      total_transfer_bytes INTEGER, measurement_source TEXT NOT NULL DEFAULT 'manual_import',
      measured_at TEXT, imported_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS responsive_image_publication_jobs (
      responsive_image_publication_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_image_url TEXT NOT NULL, source_record_kind TEXT, source_record_id INTEGER, route_context TEXT,
      target_widths_json TEXT NOT NULL DEFAULT '[480,768,1200,1600]', output_format TEXT NOT NULL DEFAULT 'webp',
      job_status TEXT NOT NULL DEFAULT 'queued', srcset_value TEXT, sizes_value TEXT,
      created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS owner_daily_summary_exports (
      owner_daily_summary_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
      summary_date TEXT NOT NULL, summary_json TEXT NOT NULL DEFAULT '{}',
      export_format TEXT NOT NULL DEFAULT 'json', export_status TEXT NOT NULL DEFAULT 'generated',
      generated_by_user_id INTEGER, generated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS campaign_readiness_check_rows (
      campaign_readiness_check_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_key TEXT NOT NULL, check_key TEXT NOT NULL, check_label TEXT NOT NULL,
      check_status TEXT NOT NULL DEFAULT 'needs_review', evidence_url TEXT,
      checked_by_user_id INTEGER, checked_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT, UNIQUE(campaign_key, check_key)
    )`,
    `CREATE TABLE IF NOT EXISTS local_page_freshness_rows (
      local_page_freshness_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_path TEXT NOT NULL UNIQUE, last_content_update_at TEXT, last_product_proof_at TEXT,
      last_customer_proof_at TEXT, last_gbp_observation_month TEXT,
      freshness_status TEXT NOT NULL DEFAULT 'needs_review', next_review_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS real_device_qa_evidence (
      real_device_qa_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_path TEXT NOT NULL, device_label TEXT NOT NULL, viewport_width INTEGER, viewport_height INTEGER,
      browser_label TEXT, theme_mode TEXT NOT NULL DEFAULT 'light', qa_status TEXT NOT NULL DEFAULT 'needs_review',
      screenshot_url TEXT, issue_summary TEXT, checked_by_user_id INTEGER, checked_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS live_environment_verification_runs (
      live_environment_verification_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_label TEXT NOT NULL, verification_scope TEXT NOT NULL DEFAULT 'bindings_and_providers',
      d1_status TEXT NOT NULL DEFAULT 'unchecked', r2_status TEXT NOT NULL DEFAULT 'unchecked',
      stripe_status TEXT NOT NULL DEFAULT 'unchecked', stripe_webhook_status TEXT NOT NULL DEFAULT 'unchecked',
      email_provider_status TEXT NOT NULL DEFAULT 'unchecked', cloudflare_api_status TEXT NOT NULL DEFAULT 'unchecked',
      overall_status TEXT NOT NULL DEFAULT 'needs_review', verified_by_user_id INTEGER,
      verified_at TEXT DEFAULT CURRENT_TIMESTAMP, details_json TEXT NOT NULL DEFAULT '{}', notes TEXT
    )`
  ];
  for (const statement of statements) await safeRun(db, statement);
}

async function seedDefaults(db) {
  const channels = [
    ['onsite_stripe','Onsite Stripe','Use actual Stripe Canada account pricing.'],
    ['etsy','Etsy','Use current Etsy Canada listing, transaction, processing, ads, currency, tax, and regulatory fees.'],
    ['facebook_meta','Facebook / Meta marketplace','Use the active terms for the exact selling method.'],
    ['paypal','PayPal','Use actual PayPal Canada merchant pricing.'],
    ['manual_local','Manual local sale / pickup','Enter actual payment and packaging assumptions.']
  ];
  for (const [key,label,note] of channels) {
    await safeRun(db, `INSERT INTO marketplace_channel_fee_settings
      (channel_key,channel_label,calculation_status,source_note,notes)
      VALUES (?,?,'needs_configuration',?,?)
      ON CONFLICT(channel_key) DO UPDATE SET channel_label=excluded.channel_label,
      source_note=excluded.source_note,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`,
      [key,label,note,'No assumed rate is applied until reviewed.']);
  }
  const families = [
    ['jewelry','Jewelry'],['engraving','Engraving'],['candles','Candles'],
    ['soap','Soap'],['vintage','Vintage / collectible'],['mixed_media','Mixed media'],['custom','Custom work']
  ];
  for (const [key,label] of families) {
    await safeRun(db, `INSERT INTO product_family_cost_defaults
      (family_key,family_label,calculation_status,notes)
      VALUES (?,?,'needs_configuration','Enter real material, labour, packaging, overhead, and waste defaults.')
      ON CONFLICT(family_key) DO UPDATE SET family_label=excluded.family_label,updated_at=CURRENT_TIMESTAMP`, [key,label]);
  }
}

function environmentStatus(env) {
  const provider = lower(env.EMAIL_PROVIDER || 'manual') || 'manual';
  const checks = {
    d1: !!(env.DB || env.DD_DB),
    r2: !!(env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA),
    stripe: !!env.STRIPE_SECRET_KEY,
    stripe_webhook: !!env.STRIPE_WEBHOOK_SECRET,
    email_provider: provider === 'manual'
      ? 'manual'
      : provider === 'resend' ? !!env.RESEND_API_KEY
      : provider === 'sendgrid' ? !!env.SENDGRID_API_KEY
      : provider === 'postmark' ? !!env.POSTMARK_SERVER_TOKEN : false,
    cloudflare_api: !!(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID && (env.CLOUDFLARE_PAGES_PROJECT_NAME || env.CLOUDFLARE_PAGES_PROJECT)),
    public_site_url: !!env.PUBLIC_SITE_URL,
    session_secret: !!env.SESSION_SECRET
  };
  const missingRequired = !checks.d1;
  const overall = missingRequired ? 'blocked' : (checks.r2 && checks.stripe && checks.session_secret ? 'configured_core' : 'partial');
  return { ...checks, email_provider_name: provider, overall };
}

function parseCsv(text) {
  const source = String(text || '').replace(/^\uFEFF/, '');
  const output = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i], next = source[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); output.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) { row.push(field); output.push(row); }
  return output.filter((entry) => entry.some((value) => String(value || '').trim()));
}

function suggestMapping(headers) {
  const aliases = {
    query:['query','top queries','queries'],
    page:['page','top pages','pages','url','landing page'],
    date:['date','dates'],
    clicks:['clicks'],
    impressions:['impressions'],
    ctr:['ctr','click through rate'],
    position:['position','average position']
  };
  const result = {};
  headers.forEach((header) => {
    const normalized = lower(header).replace(/[^a-z0-9]+/g, ' ').trim();
    for (const [key, options] of Object.entries(aliases)) {
      if (!result[key] && options.includes(normalized)) result[key] = header;
    }
  });
  return result;
}

async function refreshReviewEligibility(db) {
  if (!(await tableExists(db, 'orders'))) return { refreshed: 0 };
  const orders = await safeAll(db, `SELECT order_id,customer_email,order_status,payment_status,created_at,updated_at
    FROM orders ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 500`);
  let refreshed = 0;
  for (const order of orders) {
    const fulfilled = ['fulfilled','completed'].includes(lower(order.order_status));
    const paid = ['paid','completed','captured','partially_refunded'].includes(lower(order.payment_status));
    const eligible = fulfilled && paid;
    const exclusion = !paid ? 'payment_not_complete' : !fulfilled ? 'order_not_fulfilled' : '';
    await safeRun(db, `INSERT INTO review_request_eligibility_rows
      (order_id,customer_email,order_status,payment_status,fulfilled_at,eligible_after,eligibility_status,permission_status,cooldown_status,exclusion_reason,updated_at)
      VALUES (?,?,?,?,COALESCE(?,?),datetime(COALESCE(?,?),'+3 days'),?,'needs_review','not_checked',?,CURRENT_TIMESTAMP)
      ON CONFLICT(order_id) DO UPDATE SET customer_email=excluded.customer_email,order_status=excluded.order_status,
      payment_status=excluded.payment_status,fulfilled_at=excluded.fulfilled_at,eligible_after=excluded.eligible_after,
      eligibility_status=excluded.eligibility_status,exclusion_reason=excluded.exclusion_reason,updated_at=CURRENT_TIMESTAMP`,
      [integer(order.order_id), clean(order.customer_email,300), clean(order.order_status,80), clean(order.payment_status,80),
       order.updated_at, order.created_at, order.updated_at, order.created_at, eligible ? 'eligible_pending_permission' : 'excluded', exclusion || null]);
    refreshed += 1;
  }
  return { refreshed };
}

async function refreshFreshness(db) {
  const pages = [
    '/','/shop/','/gallery/','/about/','/custom-gifts-southern-ontario/',
    '/handmade-jewelry-ontario/','/laser-engraving-southern-ontario/',
    '/candles-soap-southern-ontario/','/vintage-collectibles-southern-ontario/'
  ];
  for (const page of pages) {
    const gbp = await safeFirst(db, `SELECT MAX(observation_month) AS month FROM google_business_profile_observations WHERE page_path=?`, [page], {});
    const media = await safeFirst(db, `SELECT MAX(updated_at) AS proof_at FROM media_publication_review_queue WHERE route_path=? AND review_status IN ('approved','published')`, [page], {});
    const stories = await safeFirst(db, `SELECT MAX(updated_at) AS proof_at FROM customer_story_output_drafts WHERE output_status='approved'`, [], {});
    const recentProof = media?.proof_at || stories?.proof_at || null;
    const status = recentProof ? 'proof_recorded_review_dates' : 'needs_real_proof';
    await safeRun(db, `INSERT INTO local_page_freshness_rows
      (page_path,last_product_proof_at,last_customer_proof_at,last_gbp_observation_month,freshness_status,next_review_at,notes)
      VALUES (?,?,?,?,?,date('now','+30 days'),'Review content, real proof, internal links, and GBP observations monthly.')
      ON CONFLICT(page_path) DO UPDATE SET last_product_proof_at=excluded.last_product_proof_at,
      last_customer_proof_at=excluded.last_customer_proof_at,last_gbp_observation_month=excluded.last_gbp_observation_month,
      freshness_status=excluded.freshness_status,next_review_at=excluded.next_review_at,
      updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`,
      [page, recentProof, stories?.proof_at || null, gbp?.month || null, status]);
  }
  return { refreshed: pages.length };
}

async function ownerSummary(db, env) {
  const count = async (table, where = '1=1') => {
    if (!(await tableExists(db, table))) return 0;
    return integer((await safeFirst(db, `SELECT COUNT(*) AS total FROM ${table} WHERE ${where}`, [], { total:0 }))?.total);
  };
  return {
    generated_at: new Date().toISOString(),
    products_active: await count('products', `lower(COALESCE(status,''))='active'`),
    products_draft: await count('products', `lower(COALESCE(status,'draft'))='draft'`),
    orders_open: await count('orders', `lower(COALESCE(order_status,'pending')) NOT IN ('fulfilled','cancelled','refunded')`),
    margin_warnings: await count('product_margin_warning_rows', `warning_status <> 'healthy_margin'`),
    media_waiting: await count('media_publication_review_queue', `review_status NOT IN ('approved','published')`),
    gbp_tasks_open: await count('gbp_monthly_task_reminders', `task_status <> 'completed'`),
    review_requests_pending: await count('review_request_eligibility_rows', `eligibility_status='eligible_pending_permission'`),
    campaign_checks_open: await count('campaign_readiness_check_rows', `check_status <> 'passed'`),
    device_qa_open: await count('real_device_qa_evidence', `qa_status <> 'passed'`),
    environment: environmentStatus(env)
  };
}

async function summary(db, env, query = '') {
  const q = lower(query);
  const like = `%${q.replace(/[%_]/g,'')}%`;
  const customerNotes = q
    ? await safeAll(db, `SELECT * FROM customer_timeline_admin_notes WHERE lower(customer_key) LIKE ? OR lower(COALESCE(customer_email,'')) LIKE ? OR lower(note_text) LIKE ? ORDER BY created_at DESC LIMIT 100`, [like,like,like])
    : await safeAll(db, `SELECT * FROM customer_timeline_admin_notes ORDER BY created_at DESC LIMIT 40`);
  const feeSettings = await safeAll(db, `SELECT * FROM marketplace_channel_fee_settings ORDER BY channel_label`);
  const costDefaults = await safeAll(db, `SELECT * FROM product_family_cost_defaults ORDER BY family_label`);
  const marginOverrides = await safeAll(db, `SELECT * FROM marketplace_margin_override_history ORDER BY requested_at DESC LIMIT 80`);
  const storyOutputs = await safeAll(db, `SELECT * FROM customer_story_output_drafts ORDER BY updated_at DESC LIMIT 60`);
  const mappings = await safeAll(db, `SELECT * FROM search_console_mapping_previews ORDER BY created_at DESC LIMIT 20`);
  const gbpTasks = await safeAll(db, `SELECT * FROM gbp_monthly_task_reminders ORDER BY task_month DESC, task_status, task_label LIMIT 100`);
  const reviewEligibility = await safeAll(db, `SELECT * FROM review_request_eligibility_rows ORDER BY updated_at DESC LIMIT 120`);
  const gallery = await safeAll(db, `SELECT * FROM approved_before_after_gallery_items ORDER BY sort_order, updated_at DESC LIMIT 80`);
  const imageRoles = await safeAll(db, `SELECT * FROM product_image_role_requirements WHERE is_active=1 ORDER BY family_key, is_publish_blocker DESC, role_key`);
  const mobileDrafts = await safeAll(db, `SELECT mobile_product_server_draft_id,draft_key,user_id,device_key,route_path,field_count,image_count,sync_status,client_saved_at,server_saved_at,recovered_at,updated_at,notes FROM mobile_product_server_drafts ORDER BY updated_at DESC LIMIT 40`);
  const performance = await safeAll(db, `SELECT * FROM deployed_performance_measurements ORDER BY COALESCE(measured_at,created_at) DESC LIMIT 80`);
  const responsiveJobs = await safeAll(db, `SELECT * FROM responsive_image_publication_jobs ORDER BY created_at DESC LIMIT 80`);
  const ownerExports = await safeAll(db, `SELECT * FROM owner_daily_summary_exports ORDER BY generated_at DESC LIMIT 20`);
  const campaignChecks = await safeAll(db, `SELECT * FROM campaign_readiness_check_rows ORDER BY campaign_key, check_status, check_key`);
  const freshness = await safeAll(db, `SELECT * FROM local_page_freshness_rows ORDER BY freshness_status, page_path`);
  const deviceQa = await safeAll(db, `SELECT * FROM real_device_qa_evidence ORDER BY COALESCE(checked_at,created_at) DESC LIMIT 100`);
  const environmentRuns = await safeAll(db, `SELECT * FROM live_environment_verification_runs ORDER BY verified_at DESC LIMIT 20`);
  const currentOwnerSummary = await ownerSummary(db, env);
  return {
    ok: true,
    build_label: BUILD_LABEL,
    query: q,
    current_owner_summary: currentOwnerSummary,
    environment_status: environmentStatus(env),
    fee_settings: feeSettings,
    cost_defaults: costDefaults,
    margin_overrides: marginOverrides,
    customer_notes: customerNotes,
    story_outputs: storyOutputs,
    search_console_mapping_previews: mappings.map((row) => ({
      ...row,
      detected_headers: safeJson(row.detected_headers_json, []),
      mapping: safeJson(row.mapping_json, {}),
      sample_rows: safeJson(row.sample_rows_json, [])
    })),
    gbp_tasks: gbpTasks,
    review_eligibility: reviewEligibility,
    gallery_items: gallery,
    image_roles: imageRoles,
    mobile_server_drafts: mobileDrafts,
    performance_measurements: performance,
    responsive_image_jobs: responsiveJobs,
    owner_exports: ownerExports.map((row) => ({ ...row, summary: safeJson(row.summary_json,{}) })),
    campaign_checks: campaignChecks,
    local_freshness: freshness,
    device_qa: deviceQa,
    environment_runs: environmentRuns.map((row) => ({ ...row, details: safeJson(row.details_json,{}) }))
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok:false, error:'Admin authentication required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok:false, error:'D1 binding DB is not configured.', fallback:{ environment_status:environmentStatus(context.env) } }, 503);
  await ensureTables(db);
  await seedDefaults(db);
  const url = new URL(context.request.url);
  const draftKey = clean(url.searchParams.get('draft_key'), 200);
  if (draftKey) {
    const draft = await safeFirst(db, `SELECT draft_key,device_key,route_path,payload_json,field_count,image_count,sync_status,client_saved_at,server_saved_at,recovered_at,updated_at,notes FROM mobile_product_server_drafts WHERE draft_key=? AND user_id=? LIMIT 1`, [draftKey, adminUser.user_id], null);
    return json({ ok:true, build_label:BUILD_LABEL, mobile_server_draft:draft ? { ...draft, payload:safeJson(draft.payload_json,{}) } : null });
  }
  const query = clean(url.searchParams.get('q'), 300);
  return json(await summary(db, context.env, query));
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok:false, error:'Admin authentication required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok:false, error:'D1 binding DB is not configured.' }, 503);
  await ensureTables(db);
  await seedDefaults(db);
  const payload = await context.request.json().catch(() => ({}));
  const action = lower(payload.action);
  let result = {};

  if (action === 'save_fee_setting') {
    const key = lower(payload.channel_key);
    if (!key) return json({ok:false,error:'Channel key is required.'},400);
    await db.prepare(`INSERT INTO marketplace_channel_fee_settings
      (channel_key,channel_label,percent_rate,fixed_fee_cents,payment_percent_rate,payment_fixed_fee_cents,
       advertising_percent_rate,reserve_percent_rate,calculation_status,effective_date,source_note,updated_by_user_id,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(channel_key) DO UPDATE SET channel_label=excluded.channel_label,percent_rate=excluded.percent_rate,
      fixed_fee_cents=excluded.fixed_fee_cents,payment_percent_rate=excluded.payment_percent_rate,
      payment_fixed_fee_cents=excluded.payment_fixed_fee_cents,advertising_percent_rate=excluded.advertising_percent_rate,
      reserve_percent_rate=excluded.reserve_percent_rate,calculation_status=excluded.calculation_status,
      effective_date=excluded.effective_date,source_note=excluded.source_note,updated_by_user_id=excluded.updated_by_user_id,
      updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(key,clean(payload.channel_label,200)||key,number(payload.percent_rate),integer(payload.fixed_fee_cents),
        number(payload.payment_percent_rate),integer(payload.payment_fixed_fee_cents),number(payload.advertising_percent_rate),
        number(payload.reserve_percent_rate),clean(payload.calculation_status,80)||'reviewed',
        clean(payload.effective_date,40)||null,clean(payload.source_note,500)||null,adminUser.user_id,clean(payload.notes,1000)||null).run();
    result = { saved:true, channel_key:key };
  } else if (action === 'save_cost_default') {
    const key = lower(payload.family_key);
    if (!key) return json({ok:false,error:'Family key is required.'},400);
    await db.prepare(`INSERT INTO product_family_cost_defaults
      (family_key,family_label,material_cost_cents,labour_minutes,labour_rate_cents_per_hour,
       packaging_cost_cents,overhead_percent,waste_percent,default_channel_key,calculation_status,updated_by_user_id,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(family_key) DO UPDATE SET family_label=excluded.family_label,material_cost_cents=excluded.material_cost_cents,
      labour_minutes=excluded.labour_minutes,labour_rate_cents_per_hour=excluded.labour_rate_cents_per_hour,
      packaging_cost_cents=excluded.packaging_cost_cents,overhead_percent=excluded.overhead_percent,
      waste_percent=excluded.waste_percent,default_channel_key=excluded.default_channel_key,
      calculation_status=excluded.calculation_status,updated_by_user_id=excluded.updated_by_user_id,
      updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(key,clean(payload.family_label,200)||key,integer(payload.material_cost_cents),integer(payload.labour_minutes),
        integer(payload.labour_rate_cents_per_hour),integer(payload.packaging_cost_cents),number(payload.overhead_percent),
        number(payload.waste_percent),lower(payload.default_channel_key)||null,clean(payload.calculation_status,80)||'reviewed',
        adminUser.user_id,clean(payload.notes,1000)||null).run();
    result = { saved:true, family_key:key };
  } else if (action === 'request_margin_override') {
    const productId = integer(payload.product_id);
    const channelKey = lower(payload.channel_key);
    const reason = clean(payload.requested_reason,1000);
    if (!productId || !channelKey || !reason) return json({ok:false,error:'Product, channel, and reason are required.'},400);
    const inserted = await db.prepare(`INSERT INTO marketplace_margin_override_history
      (product_id,channel_key,margin_status,requested_reason,requested_by_user_id,approval_status,expires_at,notes)
      VALUES (?,?,'blocked',?,?,'pending',?,?) RETURNING marketplace_margin_override_history_id`)
      .bind(productId,channelKey,reason,adminUser.user_id,clean(payload.expires_at,40)||null,clean(payload.notes,1000)||null).first();
    result = { created:true, id:inserted?.marketplace_margin_override_history_id || null };
  } else if (action === 'approve_margin_override') {
    const id = integer(payload.id);
    const status = ['approved','denied','expired'].includes(lower(payload.approval_status)) ? lower(payload.approval_status) : 'approved';
    await db.prepare(`UPDATE marketplace_margin_override_history SET approval_status=?,approved_by_user_id=?,
      approved_at=CURRENT_TIMESTAMP,expires_at=COALESCE(?,expires_at),notes=COALESCE(?,notes)
      WHERE marketplace_margin_override_history_id=?`)
      .bind(status,adminUser.user_id,clean(payload.expires_at,40)||null,clean(payload.notes,1000)||null,id).run();
    result = { updated:true, id, approval_status:status };
  } else if (action === 'add_customer_note') {
    const customerKey = lower(payload.customer_key || payload.customer_email);
    const note = clean(payload.note_text,2000);
    if (!customerKey || !note) return json({ok:false,error:'Customer key/email and note are required.'},400);
    const inserted = await db.prepare(`INSERT INTO customer_timeline_admin_notes
      (customer_key,customer_email,note_text,visibility_scope,note_status,created_by_user_id)
      VALUES (?,?,?,'admin_private','active',?) RETURNING customer_timeline_admin_note_id`)
      .bind(customerKey,clean(payload.customer_email,300)||customerKey,note,adminUser.user_id).first();
    result = { created:true, id:inserted?.customer_timeline_admin_note_id || null };
  } else if (action === 'generate_story_outputs') {
    const sourceKind = clean(payload.source_kind,80) || 'customer_story';
    const sourceId = integer(payload.source_record_id);
    const title = clean(payload.story_title,300) || 'A Devil n Dove customer story';
    const summaryText = clean(payload.story_summary,2000);
    const consentUrl = clean(payload.consent_evidence_url,1000);
    if (!summaryText) return json({ok:false,error:'Story summary/source text is required.'},400);
    const productBody = `${summaryText}\n\nMade or prepared with the same honest small-workshop approach shown throughout Devil n Dove.`;
    const trust = clean(payload.trust_block_body,1000) || summaryText;
    const gallery = clean(payload.gallery_caption,500) || `${title} — approved customer/workshop proof.`;
    const social = clean(payload.social_snippet,500) || `${title}: ${summaryText}`.slice(0,480);
    const inserted = await db.prepare(`INSERT INTO customer_story_output_drafts
      (customer_story_approval_batch_id,source_kind,source_record_id,product_id,customer_key,consent_evidence_url,
       product_story_title,product_story_body,trust_block_body,gallery_caption,social_snippet,output_status,created_by_user_id,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'draft',?,?) RETURNING customer_story_output_draft_id`)
      .bind(integer(payload.customer_story_approval_batch_id)||null,sourceKind,sourceId||null,integer(payload.product_id)||null,
        lower(payload.customer_key)||null,consentUrl||null,title,productBody,trust,gallery,social,adminUser.user_id,
        'Generated as drafts only. Human consent, accuracy, tone, and placement review remain required.').first();
    result = { created:true, id:inserted?.customer_story_output_draft_id || null };
  } else if (action === 'preview_search_console_csv') {
    const parsed = parseCsv(payload.csv_text);
    if (parsed.length < 2) return json({ok:false,error:'CSV needs a header row and at least one data row.'},400);
    const headers = parsed[0].map((value) => clean(value,200));
    const mapping = suggestMapping(headers);
    const required = ['clicks','impressions','position'];
    const missing = required.filter((key) => !mapping[key]);
    if (!mapping.page && !mapping.query) missing.push('page_or_query');
    const status = missing.length ? 'needs_mapping' : 'ready_for_import_review';
    const preview = parsed.slice(1,6).map((values) => Object.fromEntries(headers.map((header,index) => [header, clean(values[index],500)])));
    const inserted = await db.prepare(`INSERT INTO search_console_mapping_previews
      (source_file,detected_headers_json,mapping_json,sample_rows_json,validation_status,validation_notes,created_by_user_id)
      VALUES (?,?,?,?,?,?,?) RETURNING search_console_mapping_preview_id`)
      .bind(clean(payload.source_file,300)||'search-console.csv',JSON.stringify(headers),JSON.stringify(mapping),
        JSON.stringify(preview),status,missing.length?`Missing/ambiguous: ${missing.join(', ')}`:'Headers mapped; inspect sample rows before import.',
        adminUser.user_id).first();
    result = { created:true, id:inserted?.search_console_mapping_preview_id || null, headers, mapping, sample_rows:preview, validation_status:status, missing };
  } else if (action === 'complete_gbp_task') {
    const id = integer(payload.id);
    await db.prepare(`UPDATE gbp_monthly_task_reminders SET task_status=?,completed_at=CASE WHEN ?='completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
      completed_by_user_id=?,evidence_url=COALESCE(?,evidence_url),notes=COALESCE(?,notes),updated_at=CURRENT_TIMESTAMP
      WHERE gbp_monthly_task_reminder_id=?`)
      .bind(clean(payload.task_status,80)||'completed',clean(payload.task_status,80)||'completed',adminUser.user_id,
        clean(payload.evidence_url,1000)||null,clean(payload.notes,1000)||null,id).run();
    result = { updated:true, id };
  } else if (action === 'refresh_review_eligibility') {
    result = await refreshReviewEligibility(db);
  } else if (action === 'save_gallery_item') {
    const key = lower(payload.gallery_key) || `proof_${Date.now()}`;
    await db.prepare(`INSERT INTO approved_before_after_gallery_items
      (gallery_key,gallery_label,proof_kind,route_context,product_id,custom_request_id,before_image_url,after_image_url,
       process_image_url,alt_text,story_note,consent_status,public_use_status,approval_status,sort_order,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(gallery_key) DO UPDATE SET gallery_label=excluded.gallery_label,proof_kind=excluded.proof_kind,
      route_context=excluded.route_context,product_id=excluded.product_id,custom_request_id=excluded.custom_request_id,
      before_image_url=excluded.before_image_url,after_image_url=excluded.after_image_url,
      process_image_url=excluded.process_image_url,alt_text=excluded.alt_text,story_note=excluded.story_note,
      consent_status=excluded.consent_status,public_use_status=excluded.public_use_status,
      approval_status=excluded.approval_status,sort_order=excluded.sort_order,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(key,clean(payload.gallery_label,300)||'Workshop proof',clean(payload.proof_kind,80)||'before_after',
        clean(payload.route_context,300)||'/gallery/',integer(payload.product_id)||null,integer(payload.custom_request_id)||null,
        clean(payload.before_image_url,1000)||null,clean(payload.after_image_url,1000)||null,clean(payload.process_image_url,1000)||null,
        clean(payload.alt_text,500)||null,clean(payload.story_note,1500)||null,clean(payload.consent_status,80)||'needs_review',
        clean(payload.public_use_status,80)||'needs_review',clean(payload.approval_status,80)||'draft',
        integer(payload.sort_order),clean(payload.notes,1000)||null).run();
    result = { saved:true, gallery_key:key };
  } else if (action === 'approve_gallery_item') {
    const id = integer(payload.id);
    const consent = lower(payload.consent_status);
    const publicUse = lower(payload.public_use_status);
    if (consent !== 'approved' || publicUse !== 'approved') return json({ok:false,error:'Consent and public-use status must both be approved.'},400);
    await db.prepare(`UPDATE approved_before_after_gallery_items SET consent_status='approved',public_use_status='approved',
      approval_status='approved',approved_by_user_id=?,approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,
      notes=COALESCE(?,notes) WHERE approved_before_after_gallery_item_id=?`)
      .bind(adminUser.user_id,clean(payload.notes,1000)||null,id).run();
    result = { approved:true, id };
  } else if (action === 'save_mobile_draft') {
    const draftKey = clean(payload.draft_key,200);
    const draftPayload = payload.payload && typeof payload.payload === 'object' ? payload.payload : {};
    if (!draftKey) return json({ok:false,error:'Draft key is required.'},400);
    await db.prepare(`INSERT INTO mobile_product_server_drafts
      (draft_key,user_id,device_key,route_path,payload_json,field_count,image_count,sync_status,client_saved_at,notes)
      VALUES (?,?,?,?,?,?,?,'synced',?,?)
      ON CONFLICT(draft_key) DO UPDATE SET user_id=excluded.user_id,device_key=excluded.device_key,
      route_path=excluded.route_path,payload_json=excluded.payload_json,field_count=excluded.field_count,
      image_count=excluded.image_count,sync_status='synced',client_saved_at=excluded.client_saved_at,
      server_saved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(draftKey,adminUser.user_id,clean(payload.device_key,200)||null,clean(payload.route_path,300)||'/admin/mobile-product/',
        JSON.stringify(draftPayload),Object.keys(draftPayload).length,integer(payload.image_count),
        clean(payload.client_saved_at,80)||new Date().toISOString(),clean(payload.notes,1000)||'Encrypted session-authenticated server draft. File inputs are not stored in JSON.').run();
    result = { synced:true, draft_key:draftKey };
  } else if (action === 'import_performance') {
    const route = clean(payload.route_path,500);
    if (!route) return json({ok:false,error:'Route path is required.'},400);
    const inserted = await db.prepare(`INSERT INTO deployed_performance_measurements
      (route_path,measured_url,device_profile,performance_score,accessibility_score,seo_score,best_practices_score,
       largest_contentful_paint_ms,cumulative_layout_shift,interaction_to_next_paint_ms,total_transfer_bytes,
       measurement_source,measured_at,imported_by_user_id,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING deployed_performance_measurement_id`)
      .bind(route,clean(payload.measured_url,1000)||null,clean(payload.device_profile,80)||'mobile',
        integer(payload.performance_score)||null,integer(payload.accessibility_score)||null,integer(payload.seo_score)||null,
        integer(payload.best_practices_score)||null,integer(payload.largest_contentful_paint_ms)||null,
        number(payload.cumulative_layout_shift)||null,integer(payload.interaction_to_next_paint_ms)||null,
        integer(payload.total_transfer_bytes)||null,clean(payload.measurement_source,80)||'manual_import',
        clean(payload.measured_at,80)||new Date().toISOString(),adminUser.user_id,clean(payload.notes,1000)||null).first();
    result = { created:true, id:inserted?.deployed_performance_measurement_id || null };
  } else if (action === 'queue_responsive_image') {
    const source = clean(payload.source_image_url,1000);
    if (!source) return json({ok:false,error:'Source image URL is required.'},400);
    const inserted = await db.prepare(`INSERT INTO responsive_image_publication_jobs
      (source_image_url,source_record_kind,source_record_id,route_context,target_widths_json,output_format,job_status,
       sizes_value,created_by_user_id,notes)
      VALUES (?,?,?,?,?,?,'queued',?,?,?) RETURNING responsive_image_publication_job_id`)
      .bind(source,clean(payload.source_record_kind,80)||'media',integer(payload.source_record_id)||null,
        clean(payload.route_context,500)||null,JSON.stringify(Array.isArray(payload.target_widths)?payload.target_widths:[480,768,1200,1600]),
        clean(payload.output_format,20)||'webp',clean(payload.sizes_value,500)||'(max-width: 768px) 100vw, 50vw',
        adminUser.user_id,clean(payload.notes,1000)||'Worker generation remains required; this row is the guarded queue.').first();
    result = { queued:true, id:inserted?.responsive_image_publication_job_id || null };
  } else if (action === 'generate_owner_summary') {
    const owner = await ownerSummary(db, context.env);
    const inserted = await db.prepare(`INSERT INTO owner_daily_summary_exports
      (summary_date,summary_json,export_format,export_status,generated_by_user_id,notes)
      VALUES (date('now'),?,'json','generated',?,'Generated from Build 191 Command Center follow-through.')
      RETURNING owner_daily_summary_export_id`)
      .bind(JSON.stringify(owner),adminUser.user_id).first();
    result = { generated:true, id:inserted?.owner_daily_summary_export_id || null, summary:owner };
  } else if (action === 'update_campaign_check') {
    const campaign = lower(payload.campaign_key), check = lower(payload.check_key);
    if (!campaign || !check) return json({ok:false,error:'Campaign and check keys are required.'},400);
    await db.prepare(`INSERT INTO campaign_readiness_check_rows
      (campaign_key,check_key,check_label,check_status,evidence_url,checked_by_user_id,checked_at,notes)
      VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,?)
      ON CONFLICT(campaign_key,check_key) DO UPDATE SET check_label=excluded.check_label,check_status=excluded.check_status,
      evidence_url=excluded.evidence_url,checked_by_user_id=excluded.checked_by_user_id,checked_at=CURRENT_TIMESTAMP,
      updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(campaign,check,clean(payload.check_label,300)||check,clean(payload.check_status,80)||'needs_review',
        clean(payload.evidence_url,1000)||null,adminUser.user_id,clean(payload.notes,1000)||null).run();
    result = { updated:true, campaign_key:campaign, check_key:check };
  } else if (action === 'refresh_freshness') {
    result = await refreshFreshness(db);
  } else if (action === 'add_device_qa') {
    const route = clean(payload.route_path,500), device = clean(payload.device_label,200);
    if (!route || !device) return json({ok:false,error:'Route and device label are required.'},400);
    const inserted = await db.prepare(`INSERT INTO real_device_qa_evidence
      (route_path,device_label,viewport_width,viewport_height,browser_label,theme_mode,qa_status,screenshot_url,
       issue_summary,checked_by_user_id,checked_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) RETURNING real_device_qa_evidence_id`)
      .bind(route,device,integer(payload.viewport_width)||null,integer(payload.viewport_height)||null,
        clean(payload.browser_label,200)||null,clean(payload.theme_mode,40)||'light',
        clean(payload.qa_status,80)||'needs_review',clean(payload.screenshot_url,1000)||null,
        clean(payload.issue_summary,1500)||null,adminUser.user_id).first();
    result = { created:true, id:inserted?.real_device_qa_evidence_id || null };
  } else if (action === 'run_environment_verification') {
    const details = environmentStatus(context.env);
    const statuses = {
      d1: details.d1 ? 'configured' : 'missing',
      r2: details.r2 ? 'configured' : 'missing',
      stripe: details.stripe ? 'configured' : 'missing',
      webhook: details.stripe_webhook ? 'configured' : 'missing',
      email: details.email_provider === 'manual' ? 'manual' : details.email_provider ? 'configured' : 'missing',
      cloudflare: details.cloudflare_api ? 'configured' : 'missing'
    };
    const inserted = await db.prepare(`INSERT INTO live_environment_verification_runs
      (build_label,verification_scope,d1_status,r2_status,stripe_status,stripe_webhook_status,email_provider_status,
       cloudflare_api_status,overall_status,verified_by_user_id,details_json,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING live_environment_verification_run_id`)
      .bind(BUILD_LABEL,'configuration_presence',statuses.d1,statuses.r2,statuses.stripe,statuses.webhook,statuses.email,
        statuses.cloudflare,details.overall,adminUser.user_id,JSON.stringify(details),
        'Presence check only. Live provider actions, webhook signatures, bucket permissions, and payments still require deployed tests.').first();
    result = { created:true, id:inserted?.live_environment_verification_run_id || null, details };
  } else {
    return json({ok:false,error:'Unsupported Build 191 action.'},400);
  }

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: `build191_${action || 'unknown'}`,
    target_type: 'value_operations_followthrough',
    target_key: action || 'unknown',
    details: result
  });
  return json({ ok:true, message:'Build 191 action completed.', result, ...(await summary(db, context.env, clean(payload.q,300))) });
}
