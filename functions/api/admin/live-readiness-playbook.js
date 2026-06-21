// File: /functions/api/admin/live-readiness-playbook.js
// Build 193: Admin-only tracked live test playbook. It records evidence without exposing secrets.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function safeAll(db, sql, bindings = []) {
  try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; }
}
async function safeFirst(db, sql, bindings = [], fallback = null) {
  try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; }
}
async function safeRun(db, sql, bindings = []) {
  try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; }
}

const TESTS = [
  ['fee_cost_configuration','business_data','Enter one reviewed channel fee and one product-family cost default',10,'high',0,'/admin/command-center/','1. Log in as admin.\n2. Open Command Center fee/cost settings.\n3. Enter one actual provider fee shown in that provider account.\n4. Enter one realistic material, labour, packaging, overhead, and waste default.\n5. Save with a factual reason.\n6. Refresh Product Readiness and confirm margin status changes.','Fee/cost rows are configured and Product Readiness no longer calls them unknown.'],
  ['marketplace_margin_gate','business_data','Confirm marketplace export blocks an unhealthy margin',20,'high',0,'/admin/marketplace-exports/','1. Use a test/draft product with incomplete cost or an intentionally low price.\n2. Open Marketplace Export Preview.\n3. Attempt the export.\n4. Confirm the export blocks with a margin/cost reason.\n5. Only test an override using a temporary expiry and factual reason.','Unhealthy margin blocks export unless an active approved override exists.'],
  ['mobile_draft_recovery','mobile','Save and recover a mobile product draft',30,'high',0,'/admin/mobile-product/','1. On a phone or narrow browser, open Mobile Product Add.\n2. Enter name, reference, and short description.\n3. Save partial draft.\n4. Reload/reopen draft list.\n5. Select the draft and confirm fields/review checklist return.','The D1 draft is recoverable and layout remains usable.'],
  ['mobile_resumable_media','mobile','Test resumable R2 media upload on a real phone',40,'high',1,'/admin/mobile-product/','1. Save a text-only product draft and reopen it.\n2. Use the Resumable image upload panel with one non-sensitive test image.\n3. Start upload on Wi-Fi.\n4. Briefly interrupt connectivity if practical.\n5. Re-select the same file and resume.\n6. Complete and confirm the image appears on the draft.\n7. Remove the test image if it is not needed.','Upload resumes from completed parts, attaches one product image, and logs the object key.'],
  ['r2_derivative_worker','media','Run R2 derivative health checks',50,'high',1,'/admin/command-center/','1. Confirm PRODUCT_MEDIA_BUCKET in Cloudflare Pages bindings.\n2. Deploy derivative worker route.\n3. Create a tiny approved test image.\n4. Generate WebP and AVIF.\n5. Confirm URLs and responsive references load.\n6. Run cleanup and confirm test objects disappear.','WebP/AVIF, responsive URLs, and cleanup all pass with evidence.'],
  ['approved_real_media','media','Replace one placeholder with approved real workshop media',60,'medium',0,'/admin/visual-enrichment-studio/','1. Choose one visible placeholder.\n2. Confirm ownership or public-use consent.\n3. Compress image and add descriptive alt text.\n4. Review on phone and desktop.\n5. Publish after approval.\n6. Confirm nearby text remains relevant and H1 is unchanged.','One approved real image replaces one placeholder with consent, alt text, performance, and device review.'],
  ['search_console_import','seo','Import a real Search Console export',70,'high',0,'/admin/local-seo-review/','1. Open Search Console Performance.\n2. Export pages/queries CSV for a useful range.\n3. Use the admin mapping preview.\n4. Check headers and samples before save.\n5. Create one factual opportunity action.\n6. Save date/source note.','Import mapping is reviewed before data is saved and actions are traceable.'],
  ['gbp_monthly_evidence','seo','Record monthly Google Business Profile evidence',80,'medium',0,'/admin/command-center/','1. Open Google Business Profile.\n2. Check category, hours, service area, phone, website, photos, reviews, and posts.\n3. Record only accurate observations.\n4. Add link/screenshot reference where available.\n5. Add correction as a task.\n6. Do not claim a ranking guarantee.','A dated evidence record exists for profile accuracy and local proof.'],
  ['customer_duplicate_review','customers','Review customer duplicate suggestions',90,'medium',0,'/admin/command-center/','1. Refresh duplicate candidates.\n2. Read each source summary.\n3. Confirm records truly match before merge.\n4. Keep shared-household/gift/uncertain records separate.\n5. Add factual review note.\n6. Never bulk merge automatically.','Every duplicate suggestion has a manual, auditable decision.'],
  ['stripe_webhook_signature','payments','Test Stripe webhook signature verification',100,'high',1,'/admin/webhook-events/','1. Open Stripe Developers > Webhooks.\n2. Confirm endpoint and STRIPE_WEBHOOK_SECRET in Cloudflare.\n3. Send a Stripe test event from Stripe.\n4. Check app webhook log for verified event ID.\n5. Confirm same event ID does not duplicate effects.\n6. Record outcome without secrets.','Stripe event is verified, logged once, and makes no duplicate state change.'],
  ['email_test_delivery','communications','Run a safe email provider delivery test',110,'high',1,'/admin/live-ops-followthrough/','1. Keep customer automation off.\n2. Confirm EMAIL_PROVIDER/key.\n3. Send only to an owner-controlled inbox.\n4. Check sender, content, delivery, and spam placement.\n5. Record provider reference/result.\n6. Do not test on customers.','One owner-controlled inbox receives the test and customer automation remains disabled.'],
  ['r2_live_health','deployment','Run R2 upload, signed-read, and delete health test',120,'high',1,'/admin/live-ops-followthrough/','1. Upload a tiny non-sensitive test object.\n2. Open its signed-read URL while authorized.\n3. Confirm expiry/denial behaviour.\n4. Delete the object.\n5. Confirm it is gone.\n6. Record evidence.','Upload, signed read, expiry behaviour, and delete all pass.'],
  ['pagespeed_lighthouse','performance','Import mobile and desktop Lighthouse/PageSpeed evidence',130,'medium',0,'/admin/command-center/','1. Run PageSpeed/Lighthouse for home, shop, gallery, and one local page.\n2. Run mobile and desktop.\n3. Record score, date, and major warnings.\n4. Create remediation only for meaningful issues.\n5. Recheck after CSS/image changes.','Dated mobile/desktop evidence informs performance budgets.'],
  ['real_device_qa','performance','Capture real-device QA evidence',140,'medium',0,'/admin/post-deploy-smoke-tests/','1. Check narrow phone, large phone, tablet, laptop, and large desktop.\n2. Test navigation, media, cart, login, mobile capture, and an admin table.\n3. Confirm readable text, taps, no clipping, and no overlap.\n4. Save screenshots/notes for defects.\n5. Record result.','Every target device class has dated pass/fail evidence.'],
  ['legacy_admin_usage','operations','Review legacy admin usage before retiring pages',150,'low',0,'/admin/command-center/','1. Use Command Center in normal work for several weeks.\n2. Review use events and missing workflow needs.\n3. Keep detailed pages until Command Center covers essentials.\n4. Archive/redirect only after documented decision.\n5. Do not retire on short-term low use alone.','Consolidation follows observed use and replacement coverage.']
];

async function ensure(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS live_readiness_test_cases (live_readiness_test_case_id INTEGER PRIMARY KEY AUTOINCREMENT,test_key TEXT NOT NULL UNIQUE,test_area TEXT NOT NULL,test_label TEXT NOT NULL,priority_rank INTEGER NOT NULL DEFAULT 100,risk_level TEXT NOT NULL DEFAULT 'medium',requires_live_binding INTEGER NOT NULL DEFAULT 0,target_route TEXT,instructions_markdown TEXT NOT NULL,expected_result TEXT NOT NULL,test_status TEXT NOT NULL DEFAULT 'not_started',evidence_url TEXT,evidence_notes TEXT,last_run_at TEXT,last_run_by_user_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS live_readiness_test_runs (live_readiness_test_run_id INTEGER PRIMARY KEY AUTOINCREMENT,test_key TEXT NOT NULL,run_status TEXT NOT NULL DEFAULT 'not_started',result_summary TEXT,evidence_url TEXT,tested_by_user_id INTEGER,tested_at TEXT DEFAULT CURRENT_TIMESTAMP,created_at TEXT DEFAULT CURRENT_TIMESTAMP,notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS command_center_usage_events (command_center_usage_event_id INTEGER PRIMARY KEY AUTOINCREMENT,route_path TEXT NOT NULL,event_kind TEXT NOT NULL DEFAULT 'view',source_route TEXT,user_id INTEGER,session_key TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,notes TEXT)`
  ];
  for (const statement of statements) await safeRun(db, statement);
}

async function seed(db) {
  for (const test of TESTS) {
    await safeRun(db, `INSERT INTO live_readiness_test_cases
      (test_key,test_area,test_label,priority_rank,risk_level,requires_live_binding,target_route,instructions_markdown,expected_result)
      VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(test_key) DO UPDATE SET test_area=excluded.test_area,test_label=excluded.test_label,priority_rank=excluded.priority_rank,risk_level=excluded.risk_level,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,instructions_markdown=excluded.instructions_markdown,expected_result=excluded.expected_result,updated_at=CURRENT_TIMESTAMP`, test);
  }
}

function safeUrl(value) {
  const input = normalizeText(value);
  if (!input) return '';
  if (input.startsWith('/') || /^https:\/\//i.test(input)) return input;
  return '';
}

function status(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['not_started','in_progress','passed','failed','blocked','needs_review','not_applicable'].includes(raw) ? raw : 'needs_review';
}

function summaryMarkdown(cases) {
  const lines = ['# Devil n Dove Live Testing Playbook', '', 'Generated from the Command Center. Record a status/evidence URL after each live test.', ''];
  for (const row of cases) {
    lines.push(`## ${row.priority_rank}. ${row.test_label}`, '');
    lines.push(`- **Area:** ${row.test_area}`);
    lines.push(`- **Route:** ${row.target_route || 'Manual check'}`);
    lines.push(`- **Expected result:** ${row.expected_result}`);
    lines.push(`- **Current status:** ${row.test_status}`);
    lines.push('', row.instructions_markdown || '', '');
  }
  return lines.join('\n');
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok:false, error:'Database binding is not configured.' }, 500);
  const admin = await getAdminUserFromRequest(context.request, context.env);
  if (!admin) return json({ ok:false, error:'Unauthorized.' }, 401);
  await ensure(db); await seed(db);

  const cases = await safeAll(db, `SELECT * FROM live_readiness_test_cases ORDER BY priority_rank ASC, test_key ASC`);
  const recentRuns = await safeAll(db, `SELECT * FROM live_readiness_test_runs ORDER BY tested_at DESC, live_readiness_test_run_id DESC LIMIT 40`);
  const usage = await safeAll(db, `SELECT route_path, COUNT(*) AS event_count, MAX(created_at) AS last_used_at FROM command_center_usage_events WHERE created_at >= datetime('now','-30 days') GROUP BY route_path ORDER BY event_count DESC, route_path ASC LIMIT 30`);
  const stats = {
    total: cases.length,
    passed: cases.filter((row) => row.test_status === 'passed').length,
    failed: cases.filter((row) => row.test_status === 'failed').length,
    open: cases.filter((row) => !['passed','not_applicable'].includes(row.test_status)).length,
    live_required: cases.filter((row) => Number(row.requires_live_binding || 0) === 1).length
  };
  return json({ ok:true, build_label:'Build 193', cases, recent_runs:recentRuns, usage, stats, markdown:summaryMarkdown(cases) });
}

export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok:false, error:'Database binding is not configured.' }, 500);
  const admin = await getAdminUserFromRequest(context.request, context.env);
  if (!admin) return json({ ok:false, error:'Unauthorized.' }, 401);
  await ensure(db); await seed(db);

  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok:false, error:'Expected JSON request body.' }, 400); }
  const action = normalizeText(body.action).toLowerCase();

  if (action === 'seed_cases') {
    await seed(db);
  } else if (action === 'record_usage') {
    const routePath = normalizeText(body.route_path);
    if (!routePath.startsWith('/admin/')) return json({ ok:false, error:'A valid admin route is required.' }, 400);
    await safeRun(db, `INSERT INTO command_center_usage_events (route_path,event_kind,source_route,user_id,session_key,notes) VALUES (?,?,?,?,?,?)`,
      [routePath, normalizeText(body.event_kind) || 'view', normalizeText(body.source_route) || '/admin/command-center/', Number(admin.user_id || 0) || null, normalizeText(body.session_key) || null, normalizeText(body.notes) || null]);
  } else if (action === 'record_run') {
    const testKey = normalizeText(body.test_key);
    const nextStatus = status(body.run_status || body.test_status);
    const existing = await safeFirst(db, `SELECT test_key FROM live_readiness_test_cases WHERE test_key=?`, [testKey]);
    if (!existing) return json({ ok:false, error:'Unknown test case.' }, 404);
    const resultSummary = normalizeText(body.result_summary).slice(0, 2000);
    const evidenceUrl = safeUrl(body.evidence_url);
    const notes = normalizeText(body.notes).slice(0, 5000);
    await safeRun(db, `INSERT INTO live_readiness_test_runs (test_key,run_status,result_summary,evidence_url,tested_by_user_id,notes) VALUES (?,?,?,?,?,?)`,
      [testKey, nextStatus, resultSummary || null, evidenceUrl || null, Number(admin.user_id || 0) || null, notes || null]);
    await safeRun(db, `UPDATE live_readiness_test_cases SET test_status=?,evidence_url=?,evidence_notes=?,last_run_at=CURRENT_TIMESTAMP,last_run_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE test_key=?`,
      [nextStatus, evidenceUrl || null, resultSummary || notes || null, Number(admin.user_id || 0) || null, testKey]);
    await auditAdminAction(db, admin, 'live_readiness_test_recorded', 'live_readiness_test_case', null, { test_key:testKey, test_status:nextStatus, evidence_url:!!evidenceUrl }).catch(() => null);
  } else if (action === 'export_markdown') {
    // GET response includes markdown; keeping this action lets the UI refresh the same reviewed source.
  } else {
    return json({ ok:false, error:'Unsupported playbook action.' }, 400);
  }

  const cases = await safeAll(db, `SELECT * FROM live_readiness_test_cases ORDER BY priority_rank ASC, test_key ASC`);
  const recentRuns = await safeAll(db, `SELECT * FROM live_readiness_test_runs ORDER BY tested_at DESC, live_readiness_test_run_id DESC LIMIT 40`);
  const usage = await safeAll(db, `SELECT route_path, COUNT(*) AS event_count, MAX(created_at) AS last_used_at FROM command_center_usage_events WHERE created_at >= datetime('now','-30 days') GROUP BY route_path ORDER BY event_count DESC, route_path ASC LIMIT 30`);
  const stats = { total:cases.length, passed:cases.filter(r=>r.test_status==='passed').length, failed:cases.filter(r=>r.test_status==='failed').length, open:cases.filter(r=>!['passed','not_applicable'].includes(r.test_status)).length, live_required:cases.filter(r=>Number(r.requires_live_binding||0)===1).length };
  return json({ ok:true, message:'Live readiness playbook updated.', cases, recent_runs:recentRuns, usage, stats, markdown:summaryMarkdown(cases) });
}
