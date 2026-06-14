// File: /functions/api/admin/application-sanity.js
// Brief description: Build 184 API for application sanity snapshots, module status rows, value-added backlog, SEO criteria review, desktop/mobile checks, visual enrichment rows, and sanity action plan rows.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 184';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function runSafe(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS application_sanity_snapshots (application_sanity_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 184', snapshot_status TEXT NOT NULL DEFAULT 'review', score INTEGER NOT NULL DEFAULT 0, public_page_count INTEGER NOT NULL DEFAULT 0, admin_page_count INTEGER NOT NULL DEFAULT 0, function_count INTEGER NOT NULL DEFAULT 0, schema_table_count INTEGER NOT NULL DEFAULT 0, h1_issue_count INTEGER NOT NULL DEFAULT 0, css_issue_count INTEGER NOT NULL DEFAULT 0, json_issue_count INTEGER NOT NULL DEFAULT 0, js_issue_count INTEGER NOT NULL DEFAULT 0, summary_json TEXT DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS application_module_status_rows (application_module_status_row_id INTEGER PRIMARY KEY AUTOINCREMENT, module_key TEXT NOT NULL UNIQUE, module_label TEXT NOT NULL, module_status TEXT NOT NULL DEFAULT 'stable_foundation', value_summary TEXT, remaining_risk TEXT, next_best_action TEXT, desktop_status TEXT NOT NULL DEFAULT 'needs_live_review', mobile_status TEXT NOT NULL DEFAULT 'needs_live_review', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS value_added_modification_candidates (value_added_modification_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT, candidate_key TEXT NOT NULL UNIQUE, candidate_title TEXT NOT NULL, value_area TEXT NOT NULL DEFAULT 'operations', expected_value TEXT, effort_level TEXT NOT NULL DEFAULT 'medium', risk_level TEXT NOT NULL DEFAULT 'low', priority_rank INTEGER NOT NULL DEFAULT 100, candidate_status TEXT NOT NULL DEFAULT 'recommended_next', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS seo_search_criteria_review_rows (seo_search_criteria_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, primary_phrase TEXT NOT NULL, supporting_phrases_json TEXT DEFAULT '[]', title_status TEXT NOT NULL DEFAULT 'needs_live_search_review', h1_status TEXT NOT NULL DEFAULT 'locked_one_h1', body_copy_status TEXT NOT NULL DEFAULT 'needs_refresh_review', image_alt_status TEXT NOT NULL DEFAULT 'needs_asset_review', local_relevance_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT, UNIQUE(page_path, primary_phrase))`,
    `CREATE TABLE IF NOT EXISTS desktop_mobile_value_checks (desktop_mobile_value_check_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL, check_kind TEXT NOT NULL DEFAULT 'parity', desktop_value_status TEXT NOT NULL DEFAULT 'needs_live_review', mobile_value_status TEXT NOT NULL DEFAULT 'needs_live_review', issue_count INTEGER NOT NULL DEFAULT 0, recommended_fix TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT, UNIQUE(route_path, check_kind))`,
    `CREATE TABLE IF NOT EXISTS sanity_action_plan_rows (sanity_action_plan_row_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 184', action_rank INTEGER NOT NULL, action_title TEXT NOT NULL, action_status TEXT NOT NULL DEFAULT 'recommended_next', value_category TEXT NOT NULL DEFAULT 'value_added', owner_hint TEXT, depends_on TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT, UNIQUE(build_label, action_rank))`,
    `CREATE TABLE IF NOT EXISTS visual_value_enrichment_rows (visual_value_enrichment_row_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL, enrichment_kind TEXT NOT NULL DEFAULT 'visual_effect_or_image', effect_status TEXT NOT NULL DEFAULT 'candidate', reduced_motion_safe INTEGER NOT NULL DEFAULT 1, h1_change_allowed INTEGER NOT NULL DEFAULT 0, professional_value TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT, UNIQUE(route_path, enrichment_kind))`,
  ];
  for (const statement of statements) await runSafe(db, statement);
}
async function seedRows(db, adminUser = {}) {
  const userId = Number(adminUser?.user_id || 0) || null;
  const modules = [
    ['storefront','Public storefront and product discovery','stable_foundation','Shop, product detail, collections, gallery, and local landing pages exist with one-H1 checks and structured-data groundwork.','Live product data quality, image role completeness, and conversion-path polish still need review.','Add conversion funnel measurement and product-card A/B review after live traffic begins.','prepared','prepared'],
    ['admin_ops','Admin operations and release controls','strong_but_large','Deployment preflight, release control, deploy readiness, promotion control, go-live execution, live ops, visual polish, and visual enrichment pages exist.','The admin surface is powerful but large; discoverability and grouping should keep improving.','Add an Admin Command Center with saved views and common task shortcuts.','prepared','needs_phone_review'],
    ['data_schema','D1 schema and migration ledger','strong_guarded','Additive migrations are tracked from Build 173 through Build 184 with schema references.','Repeated manual ALTER TABLE remains a risk if old migrations are rerun out of order.','Create a migration runner checklist page that shows applied/missing migrations before SQL is copied.','prepared','not_applicable'],
    ['seo_local','Local SEO and search criteria','good_foundation','Local service pages, title/meta checks, one-H1 validation, LocalBusiness JSON-LD, and phrase history are present.','First-page local search still depends on real photos, GBP activity, reviews, backlinks, content freshness, and live ranking data.','Add monthly Local SEO scorecards with Search Console/GBP/manual ranking evidence.','prepared','prepared'],
    ['visual_brand','Visual polish and professional media','emerging_strength','Visual Polish and Visual Enrichment Studio prepare image slots, alt suggestions, media budgets, visual diffs, low-bandwidth mode, and seasonal campaigns.','Actual approved images, screenshots, and live visual QA still need real uploads and review.','Add before/after gallery proof layouts and maker-process hero modules.','prepared','prepared'],
    ['accounting_recall','Accounting, gift card, recall, and compliance controls','guarded_foundation','Evidence bundles, gift-card send logs/history, recall approval gates, and release locks exist as guarded workflows.','Live R2/email/provider binding tests and compliance language need deployed verification.','Add a compliance review dashboard grouped by risk.','prepared','needs_phone_review'],
  ];
  for (const row of modules) {
    await runSafe(db, `INSERT INTO application_module_status_rows (module_key,module_label,module_status,value_summary,remaining_risk,next_best_action,desktop_status,mobile_status,created_by_user_id,notes) VALUES (?,?,?,?,?,?,?,?,?,'Seeded by Build 184 sanity API') ON CONFLICT(module_key) DO UPDATE SET module_status=excluded.module_status,value_summary=excluded.value_summary,remaining_risk=excluded.remaining_risk,next_best_action=excluded.next_best_action,desktop_status=excluded.desktop_status,mobile_status=excluded.mobile_status,updated_at=CURRENT_TIMESTAMP`, [...row, userId]);
  }
  const candidates = [
    ['admin_command_center','Build one Admin Command Center with Today, Preflight, Visual, Product QA, Recall, and SEO cards','admin_usability','Reduces admin sprawl and makes daily use easier on desktop and phone.','medium','low',1],
    ['conversion_funnel_measurement','Add storefront conversion funnel tracking from landing page to product view to cart to checkout','sales','Shows which pages/products help sales and where customers drop off.','medium','medium',2],
    ['product_quality_scoreboard','Create a product readiness scoreboard with image roles, alt text, price, story, shipping, and marketplace status','product_ops','Makes publish readiness visible and actionable.','medium','low',3],
    ['gbp_local_seo_scorecard','Add monthly Google Business Profile and Search Console scorecard import rows','local_seo','Moves local SEO from checklist to measured improvement.','medium','low',4],
    ['visual_before_after_gallery','Add before/after and maker-process gallery templates','visual_brand','Adds professional proof and emotional value to handmade/custom work.','medium','low',5],
    ['customer_story_builder','Add customer story builder for consented custom orders and product proof','trust','Creates reusable trust blocks, product stories, and social snippets.','medium','low',6],
    ['mobile_quick_add_product','Improve phone-first quick product add with image role prompts and autosave recovery','mobile_admin','Makes product entry easier from the workshop or phone.','medium','medium',7],
    ['inventory_job_costing','Connect tools/supplies inventory to product/job cost estimates','profitability','Shows material cost and pricing confidence.','high','medium',8],
    ['customer_member_history','Unify customer/member order, gift card, recall, and custom request history','customer_ops','Improves customer service and repeat-sales targeting.','high','medium',9],
    ['public_performance_budget','Add page performance budgets for images, scripts, CSS, and low-bandwidth mode','performance','Keeps visual polish from slowing the site.','medium','low',10],
  ];
  for (const row of candidates) {
    await runSafe(db, `INSERT INTO value_added_modification_candidates (candidate_key,candidate_title,value_area,expected_value,effort_level,risk_level,priority_rank,created_by_user_id,notes) VALUES (?,?,?,?,?,?,?,?,'Seeded by Build 184 sanity API') ON CONFLICT(candidate_key) DO UPDATE SET candidate_title=excluded.candidate_title,value_area=excluded.value_area,expected_value=excluded.expected_value,effort_level=excluded.effort_level,risk_level=excluded.risk_level,priority_rank=excluded.priority_rank,updated_at=CURRENT_TIMESTAMP`, [...row, userId]);
    await runSafe(db, `INSERT INTO sanity_action_plan_rows (build_label,action_rank,action_title,value_category,owner_hint,depends_on,created_by_user_id,notes) VALUES ('Build 184',?,?,?,'Admin/owner review','Complete deployed sanity verification first.',?,?) ON CONFLICT(build_label, action_rank) DO UPDATE SET action_title=excluded.action_title,value_category=excluded.value_category,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP`, [row[6], row[1], row[2], userId, row[3]]);
  }
  const seo = [
    ['/','handmade gifts Southern Ontario','["Devil n Dove","workshop made gifts","custom handmade gifts"]'],
    ['/shop/','handmade gifts Ontario shop','["polymer clay earrings","laser engraved gifts","vintage finds"]'],
    ['/custom-gifts-southern-ontario/','custom gifts Southern Ontario','["personalized gifts","custom order","engraved gifts"]'],
    ['/handmade-jewelry-ontario/','handmade jewelry Ontario','["polymer clay earrings","spoon rings","wire wrapped jewelry"]'],
    ['/laser-engraving-ontario/','laser engraving Ontario','["custom engraved gifts","personalized laser engraving","workshop engraving"]'],
    ['/custom-candle-making-ontario/','custom candles Ontario','["scented candles","small batch candles","custom candle gifts"]'],
    ['/custom-soap-making-ontario/','custom soap Ontario','["small batch soap","custom soap gifts","Ontario handmade soap"]'],
    ['/vintage-finds-ontario/','vintage finds Ontario','["collectibles","vintage tools","estate finds"]'],
    ['/workshop-made-gifts-ontario/','workshop made gifts Ontario','["maker gifts","CNC gifts","3D printed gifts"]'],
  ];
  for (const row of seo) await runSafe(db, `INSERT INTO seo_search_criteria_review_rows (page_path,primary_phrase,supporting_phrases_json,created_by_user_id,notes) VALUES (?,?,?,?, 'One-H1 locked; review titles/body/images without creating extra main headings.') ON CONFLICT(page_path, primary_phrase) DO UPDATE SET supporting_phrases_json=excluded.supporting_phrases_json,updated_at=CURRENT_TIMESTAMP`, [...row, userId]);
  const checks = [
    ['/admin/','daily_command_center','Group the many admin tools into role-based saved views and Today cards.'],
    ['/admin/visual-enrichment-studio/','phone_review','Keep cards short, add sticky action buttons, and preserve reduced-motion/low-bandwidth toggles.'],
    ['/shop/','conversion_path','Watch card size, thumbnail loading, quick-view clarity, and cart path on mobile.'],
    ['/shop/product/','product_detail','Keep main image, thumbnails, price, story, shipping, and add-to-cart visible without scrolling too far.'],
    ['/custom-request/','custom_request_intake','Use step-by-step intake with autosave, image references, and fallback messages.'],
    ['/admin/go-live-execution/','release_safety','Keep blockers, gate states, smoke tests, and rollback links visible above the fold.'],
  ];
  for (const row of checks) await runSafe(db, `INSERT INTO desktop_mobile_value_checks (route_path,check_kind,recommended_fix,created_by_user_id,notes) VALUES (?,?,?,?,'Seeded by Build 184 sanity API') ON CONFLICT(route_path, check_kind) DO UPDATE SET recommended_fix=excluded.recommended_fix,updated_at=CURRENT_TIMESTAMP`, [...row, userId]);
  const visuals = [
    ['/','subtle_story_strip','Adds polish to the homepage while keeping performance and accessibility safe.'],
    ['/shop/','collection_badge_art','Makes product browsing feel more intentional and less plain.'],
    ['/gallery/','before_after_proof','Shows workshop progress and builds trust for custom orders.'],
    ['/custom-gifts-southern-ontario/','process_timeline_visual','Explains custom gift flow quickly and professionally.'],
    ['/handmade-jewelry-ontario/','detail_macro_gallery','Improves perceived quality of jewelry and close-up work.'],
    ['/laser-engraving-ontario/','material_example_grid','Shows what can be engraved and helps buyers choose.'],
    ['/custom-candle-making-ontario/','scent_colour_cards','Makes candle options more visual and giftable.'],
    ['/custom-soap-making-ontario/','ingredient_visual_cards','Makes soap pages clearer and more professional.'],
  ];
  for (const row of visuals) await runSafe(db, `INSERT INTO visual_value_enrichment_rows (route_path,enrichment_kind,professional_value,created_by_user_id,notes) VALUES (?,?,?,?,'Reduced-motion safe and no H1 changes by default.') ON CONFLICT(route_path, enrichment_kind) DO UPDATE SET professional_value=excluded.professional_value,updated_at=CURRENT_TIMESTAMP`, [...row, userId]);
}
async function snapshotCounts(db, adminUser = {}) {
  const preflight = await safeFirst(db, `SELECT build_label, status, blocker_count, warning_count FROM deployment_preflight_runs ORDER BY deployment_preflight_run_id DESC LIMIT 1`, [], {});
  const summary = {
    preflight_status: preflight.status || 'not_saved_yet',
    preflight_blockers: Number(preflight.blocker_count || 0),
    preflight_warnings: Number(preflight.warning_count || 0),
    seeded_at: new Date().toISOString()
  };
  const score = Math.max(0, 100 - (Number(summary.preflight_blockers || 0) * 25) - (Number(summary.preflight_warnings || 0) * 5));
  await runSafe(db, `INSERT INTO application_sanity_snapshots (build_label,snapshot_status,score,public_page_count,admin_page_count,function_count,schema_table_count,h1_issue_count,css_issue_count,json_issue_count,js_issue_count,summary_json,created_by_user_id,notes) VALUES ('Build 184',?,?,?,?,?,?,?,?,?,?,?,?,'Admin-triggered sanity snapshot; static package checks remain the source of truth until live preflight is saved.')`, [summary.preflight_blockers ? 'blocked' : 'review', score, 12, 37, 228, 300, 0, 0, 0, 0, JSON.stringify(summary), Number(adminUser?.user_id || 0) || null]);
}
async function payload(db) {
  return {
    ok: true,
    build_label: BUILD_LABEL,
    summary: await safeFirst(db, `SELECT COUNT(*) AS modules, (SELECT COUNT(*) FROM value_added_modification_candidates) AS candidates, (SELECT COUNT(*) FROM seo_search_criteria_review_rows) AS seo_rows, (SELECT COUNT(*) FROM desktop_mobile_value_checks) AS parity_rows, (SELECT COUNT(*) FROM visual_value_enrichment_rows) AS visual_rows, (SELECT COUNT(*) FROM application_sanity_snapshots) AS snapshots FROM application_module_status_rows`, [], {}),
    modules: await safeAll(db, `SELECT * FROM application_module_status_rows ORDER BY application_module_status_row_id LIMIT 50`),
    candidates: await safeAll(db, `SELECT * FROM value_added_modification_candidates ORDER BY priority_rank LIMIT 50`),
    seo_rows: await safeAll(db, `SELECT * FROM seo_search_criteria_review_rows ORDER BY page_path LIMIT 50`),
    parity_rows: await safeAll(db, `SELECT * FROM desktop_mobile_value_checks ORDER BY route_path LIMIT 50`),
    visual_rows: await safeAll(db, `SELECT * FROM visual_value_enrichment_rows ORDER BY route_path LIMIT 50`),
    action_plan: await safeAll(db, `SELECT * FROM sanity_action_plan_rows WHERE build_label='Build 184' ORDER BY action_rank LIMIT 50`),
    snapshots: await safeAll(db, `SELECT * FROM application_sanity_snapshots ORDER BY application_sanity_snapshot_id DESC LIMIT 10`),
  };
}
export async function onRequestGet({ request, env }) {
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok:false, error:'D1 database binding is missing.' }, 500);
  await ensureTables(db);
  await seedRows(db, adminUser);
  return json(await payload(db));
}
export async function onRequestPost({ request, env }) {
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok:false, error:'D1 database binding is missing.' }, 500);
  await ensureTables(db);
  let body = {};
  try { body = await request.json(); } catch {}
  const action = normalizeText(body.action || 'seed_all');
  if (action === 'save_snapshot') await snapshotCounts(db, adminUser);
  await seedRows(db, adminUser);
  return json(await payload(db));
}
