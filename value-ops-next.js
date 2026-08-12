// File: /functions/api/admin/value-ops-next.js
// Build 192 operational data connection API. Integrates fee/cost audit, R2 derivative readiness,
// resumable mobile upload planning, Search Console schedules, GBP evidence, customer duplicate review,
// provider tests, Lighthouse imports, and legacy admin consolidation into the existing Command Center.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 192';
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const clean = (value, max = 1000) => normalizeText(value).slice(0, max);
const lower = (value) => clean(value).toLowerCase();
const integer = (value) => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const rows = (result) => Array.isArray(result?.results) ? result.results : [];

async function safeRun(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function tableExists(db, table) { const row = await safeFirst(db, `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table], null); return !!row?.name; }

async function ensureSchema(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS value_ops_next_snapshots (
      value_ops_next_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT, snapshot_label TEXT NOT NULL DEFAULT 'Build 192 follow-through',
      fee_configured_count INTEGER NOT NULL DEFAULT 0, fee_needs_review_count INTEGER NOT NULL DEFAULT 0,
      cost_configured_count INTEGER NOT NULL DEFAULT 0, cost_needs_review_count INTEGER NOT NULL DEFAULT 0,
      r2_derivative_open_count INTEGER NOT NULL DEFAULT 0, mobile_upload_open_count INTEGER NOT NULL DEFAULT 0,
      duplicate_candidate_count INTEGER NOT NULL DEFAULT 0, seo_schedule_open_count INTEGER NOT NULL DEFAULT 0,
      gbp_evidence_count INTEGER NOT NULL DEFAULT 0, performance_import_open_count INTEGER NOT NULL DEFAULT 0,
      legacy_admin_review_count INTEGER NOT NULL DEFAULT 0, snapshot_status TEXT NOT NULL DEFAULT 'needs_review',
      created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS fee_cost_change_audit_rows (
      fee_cost_change_audit_row_id INTEGER PRIMARY KEY AUTOINCREMENT, setting_kind TEXT NOT NULL, setting_key TEXT NOT NULL,
      previous_json TEXT NOT NULL DEFAULT '{}', next_json TEXT NOT NULL DEFAULT '{}', change_reason TEXT, effective_date TEXT,
      changed_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS r2_derivative_worker_readiness_checks (
      r2_derivative_worker_readiness_check_id INTEGER PRIMARY KEY AUTOINCREMENT, check_key TEXT NOT NULL UNIQUE,
      check_label TEXT NOT NULL, check_status TEXT NOT NULL DEFAULT 'needs_review', expected_binding TEXT, route_path TEXT,
      evidence_url TEXT, checked_by_user_id INTEGER, checked_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS mobile_resumable_upload_sessions (
      mobile_resumable_upload_session_id INTEGER PRIMARY KEY AUTOINCREMENT, upload_key TEXT NOT NULL UNIQUE, draft_key TEXT,
      user_id INTEGER, product_id INTEGER, device_key TEXT, file_name TEXT, mime_type TEXT,
      expected_bytes INTEGER NOT NULL DEFAULT 0, uploaded_bytes INTEGER NOT NULL DEFAULT 0, chunk_count INTEGER NOT NULL DEFAULT 0,
      upload_status TEXT NOT NULL DEFAULT 'created', conflict_status TEXT NOT NULL DEFAULT 'not_checked', r2_object_key TEXT,
      client_started_at TEXT, last_client_sync_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS mobile_draft_conflict_reviews (
      mobile_draft_conflict_review_id INTEGER PRIMARY KEY AUTOINCREMENT, draft_key TEXT NOT NULL, local_version_at TEXT,
      server_version_at TEXT, conflict_status TEXT NOT NULL DEFAULT 'needs_review', chosen_resolution TEXT, resolved_by_user_id INTEGER,
      resolved_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT,
      UNIQUE(draft_key, local_version_at, server_version_at)
    )`,
    `CREATE TABLE IF NOT EXISTS approved_media_replacement_plan_rows (
      approved_media_replacement_plan_row_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL, placeholder_asset_path TEXT,
      desired_media_role TEXT NOT NULL, approved_media_url TEXT, consent_status TEXT NOT NULL DEFAULT 'not_required',
      public_use_status TEXT NOT NULL DEFAULT 'needs_review', compression_status TEXT NOT NULL DEFAULT 'needs_review',
      alt_text_status TEXT NOT NULL DEFAULT 'needs_review', mobile_review_status TEXT NOT NULL DEFAULT 'needs_review',
      publication_status TEXT NOT NULL DEFAULT 'candidate', sort_order INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT,
      UNIQUE(route_path, desired_media_role)
    )`,
    `CREATE TABLE IF NOT EXISTS search_console_import_schedules (
      search_console_import_schedule_id INTEGER PRIMARY KEY AUTOINCREMENT, schedule_key TEXT NOT NULL UNIQUE, schedule_label TEXT NOT NULL,
      import_source TEXT NOT NULL DEFAULT 'manual_csv', expected_frequency TEXT NOT NULL DEFAULT 'monthly', target_report TEXT NOT NULL DEFAULT 'performance_pages_queries',
      last_import_at TEXT, next_due_at TEXT, schedule_status TEXT NOT NULL DEFAULT 'open', created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS google_business_profile_evidence_records (
      google_business_profile_evidence_record_id INTEGER PRIMARY KEY AUTOINCREMENT, observation_month TEXT NOT NULL, evidence_key TEXT NOT NULL,
      evidence_label TEXT NOT NULL, page_path TEXT, evidence_url TEXT, observed_value TEXT, observation_status TEXT NOT NULL DEFAULT 'recorded',
      created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT,
      UNIQUE(observation_month, evidence_key, page_path)
    )`,
    `CREATE TABLE IF NOT EXISTS customer_duplicate_merge_candidates (
      customer_duplicate_merge_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT, candidate_key TEXT NOT NULL UNIQUE,
      match_kind TEXT NOT NULL DEFAULT 'email', match_value TEXT NOT NULL, source_summary_json TEXT NOT NULL DEFAULT '{}',
      confidence_score INTEGER NOT NULL DEFAULT 0, merge_status TEXT NOT NULL DEFAULT 'needs_review', reviewed_by_user_id INTEGER,
      reviewed_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS provider_live_test_runs (
      provider_live_test_run_id INTEGER PRIMARY KEY AUTOINCREMENT, provider_key TEXT NOT NULL, test_kind TEXT NOT NULL DEFAULT 'configuration_presence',
      test_status TEXT NOT NULL DEFAULT 'not_run', request_reference TEXT, response_summary TEXT, secret_value_exposed INTEGER NOT NULL DEFAULT 0,
      tested_by_user_id INTEGER, tested_at TEXT DEFAULT CURRENT_TIMESTAMP, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS lighthouse_import_schedules (
      lighthouse_import_schedule_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL, device_profile TEXT NOT NULL DEFAULT 'mobile',
      expected_frequency TEXT NOT NULL DEFAULT 'monthly', last_import_at TEXT, next_due_at TEXT, schedule_status TEXT NOT NULL DEFAULT 'open',
      created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT,
      UNIQUE(route_path, device_profile)
    )`,
    `CREATE TABLE IF NOT EXISTS legacy_admin_usage_rows (
      legacy_admin_usage_row_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL UNIQUE, route_label TEXT NOT NULL,
      command_center_area TEXT, last_used_at TEXT, usage_count_30d INTEGER NOT NULL DEFAULT 0,
      consolidation_status TEXT NOT NULL DEFAULT 'needs_usage_data', recommended_destination TEXT DEFAULT '/admin/command-center/',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS admin_consolidation_recommendations (
      admin_consolidation_recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL UNIQUE,
      recommendation_status TEXT NOT NULL DEFAULT 'needs_usage_data', recommended_action TEXT NOT NULL DEFAULT 'keep_until_usage_data_confirms',
      replacement_route TEXT DEFAULT '/admin/command-center/', reviewed_by_user_id INTEGER, reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT
    )`
  ];
  for (const statement of statements) await safeRun(db, statement);
}

async function seedDefaults(db) {
  const checks = [
    ['binding_product_media_bucket','PRODUCT_MEDIA_BUCKET binding is present','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Required before real derivative generation.'],
    ['webp_generation','WebP derivative generation succeeds','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Create a tiny test object and confirm WebP output.'],
    ['avif_generation','AVIF derivative generation succeeds','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Optional but valuable for modern browsers.'],
    ['srcset_writeback','Generated srcset writes back to product/image records','DB','/admin/command-center/','Do not publish responsive markup until srcset has verified URLs.'],
    ['delete_cleanup','Derivative cleanup deletes test objects','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Prevents abandoned test files in R2.']
  ];
  for (const row of checks) await safeRun(db, `INSERT INTO r2_derivative_worker_readiness_checks
    (check_key,check_label,expected_binding,route_path,notes) VALUES (?,?,?,?,?)
    ON CONFLICT(check_key) DO UPDATE SET check_label=excluded.check_label,expected_binding=excluded.expected_binding,route_path=excluded.route_path,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`, row);
  const sc = [
    ['monthly_pages_queries','Monthly Search Console pages + queries CSV','monthly','performance_pages_queries',30],
    ['weekly_top_pages','Weekly top pages opportunity review','weekly','top_pages',7],
    ['quarterly_image_search','Quarterly image-search opportunity review','quarterly','image_search',90]
  ];
  for (const [key,label,freq,report,days] of sc) await safeRun(db, `INSERT INTO search_console_import_schedules
    (schedule_key,schedule_label,expected_frequency,target_report,next_due_at,notes)
    VALUES (?,?,?,?,date('now',?),?) ON CONFLICT(schedule_key) DO UPDATE SET schedule_label=excluded.schedule_label,next_due_at=excluded.next_due_at,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`,
    [key,label,freq,report,`+${days} days`,'Export, validate headers, and import after review.']);
  const lighthouse = [['/','mobile'],['/','desktop'],['/shop/','mobile'],['/shop/','desktop'],['/gallery/','mobile'],['/admin/command-center/','desktop']];
  for (const [route,device] of lighthouse) await safeRun(db, `INSERT INTO lighthouse_import_schedules
    (route_path,device_profile,next_due_at,notes) VALUES (?,?,date('now','+30 days'),?)
    ON CONFLICT(route_path,device_profile) DO UPDATE SET next_due_at=excluded.next_due_at,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`,
    [route,device,'Import PageSpeed/Lighthouse evidence after deploy.']);
  const legacy = [
    ['/admin/readiness/','Product Readiness','products'],['/admin/visual-polish/','Visual Polish','visuals'],
    ['/admin/visual-enrichment-studio/','Visual Enrichment Studio','visuals'],['/admin/live-ops-followthrough/','Live Ops Follow-through','deploy'],
    ['/admin/go-live-execution/','Go-Live Execution','deploy'],['/admin/application-sanity/','Application Sanity','planning'],
    ['/admin/markdown-sanity/','Markdown Sanity','planning']
  ];
  for (const [route,label,area] of legacy) {
    await safeRun(db, `INSERT INTO legacy_admin_usage_rows (route_path,route_label,command_center_area,recommended_destination,notes)
      VALUES (?,?,?,'/admin/command-center/','Keep until usage data confirms this page can be safely consolidated.')
      ON CONFLICT(route_path) DO UPDATE SET route_label=excluded.route_label,command_center_area=excluded.command_center_area,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`, [route,label,area]);
    await safeRun(db, `INSERT INTO admin_consolidation_recommendations (route_path,recommendation_status,recommended_action,replacement_route,notes)
      VALUES (?,'needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.')
      ON CONFLICT(route_path) DO UPDATE SET updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`, [route]);
  }
  const media = [
    ['/','/assets/visual-placeholders/workshop-process.svg','homepage_workshop_process'],['/shop/','/assets/visual-placeholders/product-detail.svg','shop_product_detail'],
    ['/gallery/','/assets/visual-placeholders/before-after.svg','gallery_before_after'],['/handmade-jewelry-ontario/','/assets/visual-placeholders/jewelry-macro.svg','jewelry_macro'],
    ['/custom-candle-making-ontario/','/assets/visual-placeholders/candle-colour.svg','candle_colour'],['/custom-soap-making-ontario/','/assets/visual-placeholders/soap-texture.svg','soap_texture'],
    ['/laser-engraving-ontario/','/assets/visual-placeholders/engraving-proof.svg','engraving_proof'],['/vintage-finds-ontario/','/assets/visual-placeholders/vintage-condition.svg','vintage_condition']
  ];
  for (const [route,asset,role] of media) await safeRun(db, `INSERT INTO approved_media_replacement_plan_rows
    (route_path,placeholder_asset_path,desired_media_role,notes) VALUES (?,?,?,'Replace placeholder with approved real media only after consent, compression, alt text, and mobile review.')
    ON CONFLICT(route_path,desired_media_role) DO UPDATE SET placeholder_asset_path=excluded.placeholder_asset_path,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`, [route,asset,role]);
}

function environmentPresence(env) {
  const emailProvider = lower(env.EMAIL_PROVIDER || 'manual') || 'manual';
  return {
    d1: !!(env.DB || env.DD_DB),
    product_media_bucket: !!(env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA),
    derivative_candidate_bucket: !!(env.PRODUCT_DERIVATIVE_BUCKET || env.PRODUCT_MEDIA_BUCKET),
    stripe_secret: !!env.STRIPE_SECRET_KEY,
    stripe_webhook: !!env.STRIPE_WEBHOOK_SECRET,
    email_provider: emailProvider,
    email_provider_configured: emailProvider === 'manual' ? 'manual' : (emailProvider === 'resend' ? !!env.RESEND_API_KEY : emailProvider === 'sendgrid' ? !!env.SENDGRID_API_KEY : emailProvider === 'postmark' ? !!env.POSTMARK_SERVER_TOKEN : false),
    cloudflare_api: !!(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID && (env.CLOUDFLARE_PAGES_PROJECT_NAME || env.CLOUDFLARE_PAGES_PROJECT)),
    public_site_url: !!env.PUBLIC_SITE_URL,
    session_secret: !!env.SESSION_SECRET,
    private_evidence_secret: !!env.PRIVATE_EVIDENCE_DOWNLOAD_SECRET
  };
}

async function refreshDuplicates(db) {
  let created = 0;
  const sources = [];
  if (await tableExists(db, 'users')) {
    const rows = await safeAll(db, `SELECT lower(trim(email)) AS value, COUNT(*) AS total, group_concat(user_id) AS ids FROM users WHERE email IS NOT NULL AND trim(email)<>'' GROUP BY lower(trim(email)) HAVING COUNT(*)>1 LIMIT 100`);
    rows.forEach((row) => sources.push({ kind:'user_email', value: row.value, total: integer(row.total), ids: row.ids }));
  }
  if (await tableExists(db, 'orders')) {
    const rows = await safeAll(db, `SELECT lower(trim(customer_email)) AS value, COUNT(*) AS total, group_concat(order_id) AS ids FROM orders WHERE customer_email IS NOT NULL AND trim(customer_email)<>'' GROUP BY lower(trim(customer_email)) HAVING COUNT(*)>1 LIMIT 100`);
    rows.forEach((row) => sources.push({ kind:'order_email', value: row.value, total: integer(row.total), ids: row.ids }));
  }
  for (const item of sources) {
    const key = `${item.kind}:${item.value}`.slice(0, 500);
    await safeRun(db, `INSERT INTO customer_duplicate_merge_candidates
      (candidate_key,match_kind,match_value,source_summary_json,confidence_score,merge_status,notes)
      VALUES (?,?,?,?,?,'needs_review','Review manually before merging; no automatic merge is performed.')
      ON CONFLICT(candidate_key) DO UPDATE SET source_summary_json=excluded.source_summary_json,confidence_score=excluded.confidence_score,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`,
      [key, item.kind, item.value, JSON.stringify(item), Math.min(95, 45 + item.total * 15)]);
    created += 1;
  }
  return { refreshed:true, candidates_found: sources.length, rows_touched: created };
}

async function countWhere(db, table, where = '1=1') {
  if (!(await tableExists(db, table))) return 0;
  return integer((await safeFirst(db, `SELECT COUNT(*) AS total FROM ${table} WHERE ${where}`, [], { total:0 })).total);
}

async function currentSnapshot(db) {
  return {
    fee_configured_count: await countWhere(db, 'marketplace_channel_fee_settings', `calculation_status IN ('configured','reviewed','active')`),
    fee_needs_review_count: await countWhere(db, 'marketplace_channel_fee_settings', `calculation_status NOT IN ('configured','reviewed','active')`),
    cost_configured_count: await countWhere(db, 'product_family_cost_defaults', `calculation_status IN ('configured','reviewed','active')`),
    cost_needs_review_count: await countWhere(db, 'product_family_cost_defaults', `calculation_status NOT IN ('configured','reviewed','active')`),
    r2_derivative_open_count: await countWhere(db, 'r2_derivative_worker_readiness_checks', `check_status NOT IN ('passed','completed')`),
    mobile_upload_open_count: await countWhere(db, 'mobile_resumable_upload_sessions', `upload_status NOT IN ('completed','cancelled')`),
    duplicate_candidate_count: await countWhere(db, 'customer_duplicate_merge_candidates', `merge_status='needs_review'`),
    seo_schedule_open_count: await countWhere(db, 'search_console_import_schedules', `schedule_status NOT IN ('completed','disabled')`),
    gbp_evidence_count: await countWhere(db, 'google_business_profile_evidence_records', `1=1`),
    performance_import_open_count: await countWhere(db, 'lighthouse_import_schedules', `schedule_status NOT IN ('completed','disabled')`),
    legacy_admin_review_count: await countWhere(db, 'legacy_admin_usage_rows', `consolidation_status='needs_usage_data'`)
  };
}

async function summary(db, env) {
  await ensureSchema(db); await seedDefaults(db);
  return {
    ok:true,
    build_label: BUILD_LABEL,
    environment_presence: environmentPresence(env),
    snapshot: await currentSnapshot(db),
    derivative_checks: await safeAll(db, `SELECT * FROM r2_derivative_worker_readiness_checks ORDER BY check_status, check_key`),
    upload_sessions: await safeAll(db, `SELECT * FROM mobile_resumable_upload_sessions ORDER BY updated_at DESC LIMIT 40`),
    draft_conflicts: await safeAll(db, `SELECT * FROM mobile_draft_conflict_reviews ORDER BY updated_at DESC LIMIT 40`),
    media_replacements: await safeAll(db, `SELECT * FROM approved_media_replacement_plan_rows ORDER BY publication_status, sort_order, route_path`),
    search_console_schedules: await safeAll(db, `SELECT * FROM search_console_import_schedules ORDER BY schedule_status, next_due_at`),
    gbp_evidence: await safeAll(db, `SELECT * FROM google_business_profile_evidence_records ORDER BY observation_month DESC, evidence_key LIMIT 80`),
    duplicate_candidates: await safeAll(db, `SELECT * FROM customer_duplicate_merge_candidates ORDER BY merge_status, confidence_score DESC, updated_at DESC LIMIT 80`),
    provider_tests: await safeAll(db, `SELECT * FROM provider_live_test_runs ORDER BY tested_at DESC LIMIT 80`),
    lighthouse_schedules: await safeAll(db, `SELECT * FROM lighthouse_import_schedules ORDER BY schedule_status, next_due_at, route_path`),
    legacy_admin_rows: await safeAll(db, `SELECT * FROM legacy_admin_usage_rows ORDER BY consolidation_status, route_path`),
    consolidation_recommendations: await safeAll(db, `SELECT * FROM admin_consolidation_recommendations ORDER BY recommendation_status, route_path`),
    recent_snapshots: await safeAll(db, `SELECT * FROM value_ops_next_snapshots ORDER BY created_at DESC LIMIT 20`)
  };
}

async function handlePost(context, db, adminUser) {
  let payload = {};
  try { payload = await context.request.json(); } catch { payload = {}; }
  const action = clean(payload.action, 100);
  let result = {};
  if (action === 'seed_next_rows') {
    await seedDefaults(db); result = { seeded:true };
  } else if (action === 'refresh_duplicates') {
    result = await refreshDuplicates(db);
  } else if (action === 'save_snapshot') {
    const snap = await currentSnapshot(db);
    const status = (snap.fee_needs_review_count || snap.cost_needs_review_count || snap.r2_derivative_open_count || snap.legacy_admin_review_count) ? 'needs_review' : 'ready';
    const inserted = await db.prepare(`INSERT INTO value_ops_next_snapshots
      (snapshot_label,fee_configured_count,fee_needs_review_count,cost_configured_count,cost_needs_review_count,r2_derivative_open_count,
       mobile_upload_open_count,duplicate_candidate_count,seo_schedule_open_count,gbp_evidence_count,performance_import_open_count,legacy_admin_review_count,
       snapshot_status,created_by_user_id,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING value_ops_next_snapshot_id`)
      .bind(clean(payload.snapshot_label, 200) || 'Build 192 follow-through', snap.fee_configured_count, snap.fee_needs_review_count,
        snap.cost_configured_count, snap.cost_needs_review_count, snap.r2_derivative_open_count, snap.mobile_upload_open_count,
        snap.duplicate_candidate_count, snap.seo_schedule_open_count, snap.gbp_evidence_count, snap.performance_import_open_count,
        snap.legacy_admin_review_count, status, adminUser.user_id, clean(payload.notes, 1000) || null).first();
    result = { saved:true, id: inserted?.value_ops_next_snapshot_id || null, snapshot:snap };
  } else if (action === 'update_derivative_check') {
    const key = lower(payload.check_key);
    if (!key) return json({ok:false,error:'check_key is required.'},400);
    await db.prepare(`UPDATE r2_derivative_worker_readiness_checks SET check_status=?, evidence_url=?, checked_by_user_id=?, checked_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, notes=COALESCE(?,notes) WHERE check_key=?`)
      .bind(clean(payload.check_status, 80) || 'needs_review', clean(payload.evidence_url, 1000) || null, adminUser.user_id, clean(payload.notes, 1000) || null, key).run();
    result = { updated:true, check_key:key };
  } else if (action === 'create_upload_session') {
    const key = clean(payload.upload_key, 200) || `upload_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    await db.prepare(`INSERT INTO mobile_resumable_upload_sessions
      (upload_key,draft_key,user_id,product_id,device_key,file_name,mime_type,expected_bytes,uploaded_bytes,chunk_count,upload_status,client_started_at,notes)
      VALUES (?,?,?,?,?,?,?,?,0,0,'created',?,?) ON CONFLICT(upload_key) DO UPDATE SET updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(key, clean(payload.draft_key, 200) || null, adminUser.user_id, integer(payload.product_id) || null, clean(payload.device_key, 200) || null,
        clean(payload.file_name, 300) || null, clean(payload.mime_type, 100) || null, integer(payload.expected_bytes), clean(payload.client_started_at, 80) || new Date().toISOString(),
        clean(payload.notes, 1000) || 'Created from Build 192 Command Center. Actual bytes still require live upload endpoint.').run();
    result = { created:true, upload_key:key };
  } else if (action === 'record_draft_conflict') {
    const draftKey = clean(payload.draft_key, 200);
    if (!draftKey) return json({ok:false,error:'draft_key is required.'},400);
    await db.prepare(`INSERT INTO mobile_draft_conflict_reviews (draft_key,local_version_at,server_version_at,conflict_status,notes)
      VALUES (?,?,?,?,?) ON CONFLICT(draft_key,local_version_at,server_version_at) DO UPDATE SET conflict_status=excluded.conflict_status,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(draftKey, clean(payload.local_version_at, 80) || null, clean(payload.server_version_at, 80) || null, clean(payload.conflict_status, 80) || 'needs_review', clean(payload.notes, 1000) || null).run();
    result = { recorded:true, draft_key:draftKey };
  } else if (action === 'record_gbp_evidence') {
    const month = clean(payload.observation_month, 20) || new Date().toISOString().slice(0,7);
    const key = lower(payload.evidence_key) || 'manual_observation';
    await db.prepare(`INSERT INTO google_business_profile_evidence_records
      (observation_month,evidence_key,evidence_label,page_path,evidence_url,observed_value,observation_status,created_by_user_id,notes)
      VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(observation_month,evidence_key,page_path) DO UPDATE SET evidence_label=excluded.evidence_label,evidence_url=excluded.evidence_url,observed_value=excluded.observed_value,observation_status=excluded.observation_status,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(month, key, clean(payload.evidence_label, 300) || key, clean(payload.page_path, 500) || '/', clean(payload.evidence_url, 1000) || null,
        clean(payload.observed_value, 500) || null, clean(payload.observation_status, 80) || 'recorded', adminUser.user_id, clean(payload.notes, 1000) || null).run();
    result = { recorded:true, month, evidence_key:key };
  } else if (action === 'record_provider_test') {
    const provider = lower(payload.provider_key);
    if (!provider) return json({ok:false,error:'provider_key is required.'},400);
    const inserted = await db.prepare(`INSERT INTO provider_live_test_runs
      (provider_key,test_kind,test_status,request_reference,response_summary,secret_value_exposed,tested_by_user_id,notes)
      VALUES (?,?,?,?,?,0,?,?) RETURNING provider_live_test_run_id`)
      .bind(provider, clean(payload.test_kind, 100) || 'configuration_presence', clean(payload.test_status, 80) || 'not_run', clean(payload.request_reference, 500) || null,
        clean(payload.response_summary, 1000) || null, adminUser.user_id, clean(payload.notes, 1000) || null).first();
    result = { recorded:true, id: inserted?.provider_live_test_run_id || null };
  } else if (action === 'mark_legacy_review') {
    const route = clean(payload.route_path, 500);
    if (!route) return json({ok:false,error:'route_path is required.'},400);
    await db.prepare(`UPDATE legacy_admin_usage_rows SET consolidation_status=?, usage_count_30d=?, last_used_at=COALESCE(?,last_used_at), updated_at=CURRENT_TIMESTAMP, notes=COALESCE(?,notes) WHERE route_path=?`)
      .bind(clean(payload.consolidation_status, 80) || 'needs_usage_data', integer(payload.usage_count_30d), clean(payload.last_used_at, 80) || null, clean(payload.notes, 1000) || null, route).run();
    await db.prepare(`INSERT INTO admin_consolidation_recommendations (route_path,recommendation_status,recommended_action,replacement_route,reviewed_by_user_id,reviewed_at,notes)
      VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(route_path) DO UPDATE SET recommendation_status=excluded.recommendation_status,recommended_action=excluded.recommended_action,reviewed_by_user_id=excluded.reviewed_by_user_id,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(route, clean(payload.recommendation_status, 80) || 'needs_usage_data', clean(payload.recommended_action, 200) || 'keep_until_usage_data_confirms', clean(payload.replacement_route, 500) || '/admin/command-center/', adminUser.user_id, clean(payload.notes, 1000) || null).run();
    result = { updated:true, route_path:route };
  } else if (action === 'record_lighthouse_schedule') {
    const route = clean(payload.route_path, 500) || '/';
    const device = lower(payload.device_profile) || 'mobile';
    await db.prepare(`INSERT INTO lighthouse_import_schedules (route_path,device_profile,expected_frequency,last_import_at,next_due_at,schedule_status,created_by_user_id,notes)
      VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(route_path,device_profile) DO UPDATE SET expected_frequency=excluded.expected_frequency,last_import_at=excluded.last_import_at,next_due_at=excluded.next_due_at,schedule_status=excluded.schedule_status,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes`)
      .bind(route, device, clean(payload.expected_frequency, 80) || 'monthly', clean(payload.last_import_at, 80) || null, clean(payload.next_due_at, 80) || null, clean(payload.schedule_status, 80) || 'open', adminUser.user_id, clean(payload.notes, 1000) || null).run();
    result = { recorded:true, route_path:route, device_profile:device };
  } else {
    return json({ok:false,error:'Unsupported Build 192 action.'},400);
  }
  await auditAdminAction(context.env, context.request, adminUser, { action_type:`build192_${action}`, target_type:'value_ops_next', target_key:action, details:result });
  return json({ ok:true, message:'Build 192 action completed.', result, ...(await summary(db, context.env)) });
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type, Authorization' } });
  if (!['GET','POST'].includes(context.request.method)) return json({ok:false,error:'Method not allowed.'},405);
  const db = getDb(context.env);
  if (!db) return json({ok:false,error:'D1 binding DB is required.'},500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ok:false,error:'Admin login required.'},401);
  await ensureSchema(db); await seedDefaults(db);
  if (context.request.method === 'GET') return json(await summary(db, context.env));
  return handlePost(context, db, adminUser);
}
