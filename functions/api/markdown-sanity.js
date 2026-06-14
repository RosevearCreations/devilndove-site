// File: /functions/api/admin/markdown-sanity.js
// Brief description: Build 186 Markdown consolidation and value-enhancement sanity API.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 186';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function runSafe(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }

async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS markdown_consolidation_runs (markdown_consolidation_run_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 186', run_status TEXT NOT NULL DEFAULT 'prepared', canonical_file_count INTEGER NOT NULL DEFAULT 2, supporting_file_count INTEGER NOT NULL DEFAULT 0, retired_reference_count INTEGER NOT NULL DEFAULT 0, summary_json TEXT DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS markdown_file_status_rows (markdown_file_status_row_id INTEGER PRIMARY KEY AUTOINCREMENT, file_path TEXT NOT NULL UNIQUE, file_role TEXT NOT NULL DEFAULT 'supporting_reference', keep_active INTEGER NOT NULL DEFAULT 1, canonical_replacement TEXT, owner_note TEXT, last_review_build TEXT NOT NULL DEFAULT 'Build 186', review_status TEXT NOT NULL DEFAULT 'reviewed', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS value_enhancement_execution_rows (value_enhancement_execution_row_id INTEGER PRIMARY KEY AUTOINCREMENT, enhancement_key TEXT NOT NULL UNIQUE, enhancement_label TEXT NOT NULL, business_value TEXT, app_surface TEXT, desktop_status TEXT NOT NULL DEFAULT 'prepared', mobile_status TEXT NOT NULL DEFAULT 'prepared', seo_status TEXT NOT NULL DEFAULT 'aligned', data_owner TEXT NOT NULL DEFAULT 'D1_or_static_json_under_review', implementation_status TEXT NOT NULL DEFAULT 'active_tracking', priority_rank INTEGER NOT NULL DEFAULT 100, next_best_action TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS visual_graphic_placeholder_rows (visual_graphic_placeholder_row_id INTEGER PRIMARY KEY AUTOINCREMENT, placeholder_key TEXT NOT NULL UNIQUE, page_path TEXT NOT NULL, image_slot_label TEXT NOT NULL, placeholder_asset_url TEXT NOT NULL, alt_text TEXT NOT NULL, desktop_status TEXT NOT NULL DEFAULT 'visible_placeholder', mobile_status TEXT NOT NULL DEFAULT 'visible_placeholder', replacement_status TEXT NOT NULL DEFAULT 'awaiting_approved_media', h1_change_allowed INTEGER NOT NULL DEFAULT 0, performance_budget_status TEXT NOT NULL DEFAULT 'lazy_loaded_svg', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS desktop_mobile_surface_audit_rows (desktop_mobile_surface_audit_row_id INTEGER PRIMARY KEY AUTOINCREMENT, surface_key TEXT NOT NULL UNIQUE, route_path TEXT NOT NULL, surface_label TEXT NOT NULL, desktop_status TEXT NOT NULL DEFAULT 'prepared', mobile_status TEXT NOT NULL DEFAULT 'prepared', touch_target_status TEXT NOT NULL DEFAULT 'needs_live_device_check', overflow_status TEXT NOT NULL DEFAULT 'static_pass', fallback_status TEXT NOT NULL DEFAULT 'has_readable_fallback', next_best_action TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS css_drift_overlap_review_rows (css_drift_overlap_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT, review_key TEXT NOT NULL UNIQUE, selector_or_area TEXT NOT NULL, review_kind TEXT NOT NULL DEFAULT 'css_drift', desktop_status TEXT NOT NULL DEFAULT 'static_pass', mobile_status TEXT NOT NULL DEFAULT 'static_pass', risk_level TEXT NOT NULL DEFAULT 'watch', recommended_fix TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS next_step_sanity_rows (next_step_sanity_row_id INTEGER PRIMARY KEY AUTOINCREMENT, step_key TEXT NOT NULL UNIQUE, step_label TEXT NOT NULL, step_group TEXT NOT NULL DEFAULT 'next_20', priority_rank INTEGER NOT NULL DEFAULT 100, expected_value TEXT, target_surface TEXT, current_status TEXT NOT NULL DEFAULT 'queued', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`
  ];
  for (const statement of statements) await runSafe(db, statement);
}

async function seed(db) {
  const mdRows = [
    ['PROJECT_STATUS_AND_ROADMAP.md','primary_canonical',1,null,'Main human-readable project status, current value roadmap, SEO direction, and next 20 steps.','active'],
    ['AI_HANDOFF.md','primary_canonical',1,null,'Main new-chat handoff with D1 order, live checks, and where the app is heading.','active'],
    ['DEVELOPMENT_ROADMAP.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Detailed historical build trail; start with canonical project status first.','reviewed'],
    ['KNOWN_GAPS_AND_RISKS.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Detailed risk log; current summary lives in canonical project status.','reviewed'],
    ['DATABASE_SCHEMA_REFERENCE.md','supporting_reference',1,'AI_HANDOFF.md','Detailed schema log; current order is summarized in AI handoff.','reviewed'],
    ['RELEASE_NOTES.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Chronological build history.','reviewed'],
    ['SANITY_HEALTH_CHECK.md','supporting_reference',1,'AI_HANDOFF.md','Validation and post-deploy notes.','reviewed'],
    ['LOCAL_SEO_PLAYBOOK.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Detailed local SEO workflow.','reviewed'],
    ['IMAGES.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Visual placeholder, image, proof, consent, and performance rules.','reviewed'],
    ['NEW_CHAT_STATUS.md','handoff_reference',1,'AI_HANDOFF.md','Short compatibility handoff; prefer AI_HANDOFF.md.','reviewed'],
    ['AI_CONTEXT.md','handoff_reference',1,'AI_HANDOFF.md','Broad context; prefer AI_HANDOFF.md for current state.','reviewed'],
    ['COMPETITIVE.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Competitor and market-direction notes.','reviewed'],
    ['README.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Repo overview and route notes.','reviewed'],
    ['REPO_BASE_GUIDE.md','supporting_reference',1,'AI_HANDOFF.md','Technical repository guide.','reviewed'],
    ['REPO_RULES.md','supporting_reference',1,'AI_HANDOFF.md','Working rules and guardrails.','reviewed'],
    ['AMAZON_MATCHING_NOTES.md','specialized_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Inventory/Amazon matching only.','reviewed']
  ];
  for (const row of mdRows) await runSafe(db, `INSERT INTO markdown_file_status_rows (file_path,file_role,keep_active,canonical_replacement,owner_note,review_status,last_review_build) VALUES (?,?,?,?,?,?,'Build 186') ON CONFLICT(file_path) DO UPDATE SET file_role=excluded.file_role, keep_active=excluded.keep_active, canonical_replacement=excluded.canonical_replacement, owner_note=excluded.owner_note, review_status=excluded.review_status, last_review_build='Build 186', updated_at=CURRENT_TIMESTAMP`, row);
  const enhancements = [
    ['admin_command_center','Admin Command Center','Daily calm operating layer.','/admin/command-center/',1,'Connect live rollups from products/orders/SEO/visuals/performance.'],
    ['product_readiness_scoreboard','Product Readiness Scoreboard','Publish more complete trustworthy products.','/admin/readiness/',2,'Add more safe QA apply buttons.'],
    ['conversion_funnel_tracking','Conversion funnel tracking','Show landing → product → cart → checkout → order movement.','/admin/analytics/',3,'Connect event pipeline.'],
    ['local_seo_scorecard','Local SEO scorecard','Focus local relevance, distance, prominence, photos, and proof.','/admin/local-seo-review/',4,'Add GBP observations and manual rank checks.'],
    ['before_after_maker_gallery','Before/after maker gallery','Show real workshop process proof.','/admin/visual-enrichment-studio/',5,'Replace placeholders with approved media.'],
    ['customer_story_builder','Customer story builder','Turn consented proof into trust blocks and captions.','/admin/public-proof-candidates/',6,'Add guided wizard.'],
    ['mobile_quick_product_add','Mobile quick product add','Phone-first capture while work is fresh.','/admin/mobile-product/',7,'Add offline autosave.'],
    ['inventory_job_costing','Inventory/job costing','Protect pricing and marketplace margins.','/admin/inventory-operations/',8,'Roll up material/labour/fee costs.'],
    ['unified_customer_history','Unified customer/member history','Show orders, gift cards, recalls, custom requests, proof approvals.','/admin/members/',9,'Build timeline cards.'],
    ['performance_budgets','Performance budgets','Keep visuals sharp without slowing pages.','/admin/visual-polish/',10,'Import page weight measurements.'],
    ['markdown_consolidation','Markdown consolidation','Make future AI/new-chat work safer.','/admin/markdown-sanity/',11,'Use two canonical docs.']
  ];
  for (const row of enhancements) await runSafe(db, `INSERT INTO value_enhancement_execution_rows (enhancement_key,enhancement_label,business_value,app_surface,priority_rank,next_best_action) VALUES (?,?,?,?,?,?) ON CONFLICT(enhancement_key) DO UPDATE SET enhancement_label=excluded.enhancement_label, business_value=excluded.business_value, app_surface=excluded.app_surface, priority_rank=excluded.priority_rank, next_best_action=excluded.next_best_action, updated_at=CURRENT_TIMESTAMP`, row);
  const placeholders = [
    ['home_workshop_process','/','Workshop process hero support','/assets/visual-placeholders/workshop-process.svg','Placeholder for an approved Devil n Dove workshop process photo.'],
    ['shop_product_detail','/shop/','Product detail proof','/assets/visual-placeholders/product-detail.svg','Placeholder for approved product detail photography.'],
    ['gallery_before_after','/gallery/','Before and after maker proof','/assets/visual-placeholders/before-after.svg','Placeholder for approved before and after workshop images.'],
    ['jewelry_macro','/handmade-jewelry-ontario/','Jewelry macro close-up','/assets/visual-placeholders/jewelry-macro.svg','Placeholder for approved handmade jewelry close-up image.'],
    ['candle_colour','/custom-candle-making-ontario/','Candle colour and scent proof','/assets/visual-placeholders/candle-colour.svg','Placeholder for approved custom candle colour photo.'],
    ['soap_texture','/custom-soap-making-ontario/','Soap texture and ingredient clarity','/assets/visual-placeholders/soap-texture.svg','Placeholder for approved custom soap texture photo.'],
    ['engraving_proof','/laser-engraving-ontario/','Laser engraving material proof','/assets/visual-placeholders/engraving-proof.svg','Placeholder for approved laser engraving proof image.'],
    ['vintage_condition','/vintage-finds-ontario/','Vintage condition proof','/assets/visual-placeholders/vintage-condition.svg','Placeholder for approved vintage condition detail image.'],
    ['workshop_made_gifts','/workshop-made-gifts-ontario/','Workshop-made gifts process','/assets/visual-placeholders/workshop-process.svg','Placeholder for approved workshop-made gift process image.']
  ];
  for (const row of placeholders) await runSafe(db, `INSERT INTO visual_graphic_placeholder_rows (placeholder_key,page_path,image_slot_label,placeholder_asset_url,alt_text) VALUES (?,?,?,?,?) ON CONFLICT(placeholder_key) DO UPDATE SET page_path=excluded.page_path, image_slot_label=excluded.image_slot_label, placeholder_asset_url=excluded.placeholder_asset_url, alt_text=excluded.alt_text, updated_at=CURRENT_TIMESTAMP`, row);
  const cssRows = [
    ['visual_placeholder_grid','.visual-placeholder-gallery','responsive_grid','Use auto-fit cards on desktop and one-column flow on phone.'],
    ['admin_table_overflow','.admin-table','overflow','Keep table-wrap around admin tables.'],
    ['hero_visual_overlays','.hero::after and visual accents','motion_safety','Respect reduced-motion and low-bandwidth mode.'],
    ['nav_touch_targets','.nav a, .btn','mobile_tap_target','Keep 44px-ish targets on small screens.'],
    ['placeholder_images','.visual-placeholder-card img','image_budget','Lazy-load SVG placeholders until approved compressed media exists.']
  ];
  for (const row of cssRows) await runSafe(db, `INSERT INTO css_drift_overlap_review_rows (review_key,selector_or_area,review_kind,recommended_fix) VALUES (?,?,?,?) ON CONFLICT(review_key) DO UPDATE SET selector_or_area=excluded.selector_or_area, review_kind=excluded.review_kind, recommended_fix=excluded.recommended_fix, updated_at=CURRENT_TIMESTAMP`, row);
}

async function load(db) {
  const summary = {
    markdown_files: (await safeFirst(db, `SELECT COUNT(*) AS count FROM markdown_file_status_rows`, [], { count: 0 })).count || 0,
    canonical_files: (await safeFirst(db, `SELECT COUNT(*) AS count FROM markdown_file_status_rows WHERE file_role='primary_canonical'`, [], { count: 0 })).count || 0,
    enhancements: (await safeFirst(db, `SELECT COUNT(*) AS count FROM value_enhancement_execution_rows`, [], { count: 0 })).count || 0,
    placeholders: (await safeFirst(db, `SELECT COUNT(*) AS count FROM visual_graphic_placeholder_rows`, [], { count: 0 })).count || 0,
    css_reviews: (await safeFirst(db, `SELECT COUNT(*) AS count FROM css_drift_overlap_review_rows`, [], { count: 0 })).count || 0
  };
  return {
    ok: true,
    build_label: BUILD_LABEL,
    summary,
    markdown: await safeAll(db, `SELECT * FROM markdown_file_status_rows ORDER BY CASE file_role WHEN 'primary_canonical' THEN 1 WHEN 'handoff_reference' THEN 2 WHEN 'supporting_reference' THEN 3 ELSE 4 END, file_path`),
    enhancements: await safeAll(db, `SELECT * FROM value_enhancement_execution_rows ORDER BY priority_rank, enhancement_label`),
    placeholders: await safeAll(db, `SELECT * FROM visual_graphic_placeholder_rows ORDER BY page_path, image_slot_label`),
    surfaces: await safeAll(db, `SELECT * FROM desktop_mobile_surface_audit_rows ORDER BY route_path`),
    css: await safeAll(db, `SELECT * FROM css_drift_overlap_review_rows ORDER BY risk_level, selector_or_area`),
    next_steps: await safeAll(db, `SELECT * FROM next_step_sanity_rows ORDER BY priority_rank, step_label`),
    runs: await safeAll(db, `SELECT * FROM markdown_consolidation_runs ORDER BY created_at DESC LIMIT 10`)
  };
}

export async function onRequestGet({ request, env }) {
  const user = await getAdminUserFromRequest(request, env);
  if (!user) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'D1 binding is not configured.' }, 500);
  await ensureTables(db);
  await seed(db);
  return json(await load(db));
}

export async function onRequestPost({ request, env }) {
  const user = await getAdminUserFromRequest(request, env);
  if (!user) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'D1 binding is not configured.' }, 500);
  await ensureTables(db);
  await seed(db);
  const body = await request.json().catch(() => ({}));
  if (body?.action === 'save_snapshot') {
    const md = await safeFirst(db, `SELECT COUNT(*) AS c FROM markdown_file_status_rows`, [], { c: 0 });
    const support = await safeFirst(db, `SELECT COUNT(*) AS c FROM markdown_file_status_rows WHERE file_role!='primary_canonical'`, [], { c: 0 });
    await runSafe(db, `INSERT INTO markdown_consolidation_runs (build_label, run_status, canonical_file_count, supporting_file_count, retired_reference_count, created_by_user_id, notes) VALUES ('Build 186','saved_snapshot',2,?,?,?,'Saved from Markdown Sanity admin page.')`, [Number(support.c || 0), 0, user.user_id || null]);
  }
  return json(await load(db));
}
