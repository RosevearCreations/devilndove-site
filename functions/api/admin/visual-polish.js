// File: /functions/api/admin/visual-polish.js
// Brief description: Build 182 API for desktop/mobile parity, visual enrichment candidates, CSS drift rows, fallback review rows, and schema markup validation queue.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 182';
const PUBLIC_PAGES = [
  ['/', 'home_visual_story', 'hero_accent'],
  ['/shop/', 'shop_card_depth', 'product_card_polish'],
  ['/collections/', 'collection_path_cards', 'section_cards'],
  ['/custom-gifts-southern-ontario/', 'custom_gifts_local_story', 'local_visual_story'],
  ['/handmade-jewelry-ontario/', 'jewelry_workshop_story', 'local_visual_story'],
  ['/laser-engraving-ontario/', 'engraving_process_story', 'process_visual'],
  ['/custom-candle-making-ontario/', 'candle_colour_story', 'process_visual'],
  ['/custom-soap-making-ontario/', 'soap_colour_story', 'process_visual'],
  ['/vintage-finds-ontario/', 'vintage_detail_story', 'collection_visual'],
  ['/workshop-made-gifts-ontario/', 'workshop_gifts_story', 'workshop_visual']
];
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function runSafe(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS desktop_mobile_parity_checks (desktop_mobile_parity_check_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, viewport_label TEXT NOT NULL DEFAULT 'mobile_390', check_status TEXT NOT NULL DEFAULT 'needs_review', desktop_note TEXT, mobile_note TEXT, issue_count INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS visual_enrichment_candidates (visual_enrichment_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, candidate_key TEXT NOT NULL, visual_kind TEXT NOT NULL DEFAULT 'image_slot', candidate_status TEXT NOT NULL DEFAULT 'needs_review', placement_selector TEXT, asset_hint TEXT, alt_text_hint TEXT, motion_safety TEXT NOT NULL DEFAULT 'reduced_motion_safe', local_seo_phrase TEXT, created_by_user_id INTEGER, approved_by_user_id INTEGER, approved_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT, UNIQUE(page_path, candidate_key))`,
    `CREATE TABLE IF NOT EXISTS visual_effect_safety_reviews (visual_effect_safety_review_id INTEGER PRIMARY KEY AUTOINCREMENT, effect_key TEXT NOT NULL, effect_status TEXT NOT NULL DEFAULT 'allowed_with_reduced_motion', affected_selector TEXT, prefers_reduced_motion_supported INTEGER NOT NULL DEFAULT 1, contrast_review_status TEXT NOT NULL DEFAULT 'passed_static', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS mobile_nav_touch_target_audits (mobile_nav_touch_target_audit_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, target_selector TEXT NOT NULL DEFAULT '.nav a, .nav button, .btn', min_target_px INTEGER NOT NULL DEFAULT 44, audit_status TEXT NOT NULL DEFAULT 'prepared', issue_count INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS css_drift_review_runs (css_drift_review_run_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 182', css_path TEXT NOT NULL DEFAULT 'css/styles.css', open_brace_count INTEGER NOT NULL DEFAULT 0, close_brace_count INTEGER NOT NULL DEFAULT 0, review_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS public_page_visual_asset_budgets (public_page_visual_asset_budget_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, budget_status TEXT NOT NULL DEFAULT 'prepared', max_inline_effects INTEGER NOT NULL DEFAULT 3, max_new_images INTEGER NOT NULL DEFAULT 2, preferred_image_ratio TEXT NOT NULL DEFAULT '4:3 or square', lazy_loading_required INTEGER NOT NULL DEFAULT 1, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS route_fallback_review_rows (route_fallback_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL, fallback_kind TEXT NOT NULL DEFAULT 'static_or_cached_message', fallback_status TEXT NOT NULL DEFAULT 'needs_live_review', user_message TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS schema_markup_validation_queue (schema_markup_validation_queue_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, schema_type TEXT NOT NULL DEFAULT 'LocalBusiness', validation_status TEXT NOT NULL DEFAULT 'queued', source_hint TEXT NOT NULL DEFAULT 'static_jsonld', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS json_db_migration_candidates (json_db_migration_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT NOT NULL, target_table TEXT, ownership_status TEXT NOT NULL DEFAULT 'needs_decision', duplication_risk TEXT NOT NULL DEFAULT 'medium', migration_notes TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS visual_polish_admin_preferences (visual_polish_admin_preference_id INTEGER PRIMARY KEY AUTOINCREMENT, preference_key TEXT NOT NULL UNIQUE, preference_value TEXT, preference_status TEXT NOT NULL DEFAULT 'active', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`
  ];
  for (const sql of statements) await db.prepare(sql).run().catch(() => null);
}
async function seedParityRows(db, user) {
  for (const [page] of PUBLIC_PAGES) {
    await db.prepare(`INSERT INTO desktop_mobile_parity_checks (page_path, viewport_label, check_status, desktop_note, mobile_note, issue_count, created_by_user_id, created_at, updated_at) VALUES (?, 'desktop_1440_mobile_390', 'prepared', 'Desktop layout should keep hero/cards readable without crowding.', 'Mobile layout should keep buttons at 44px+ and avoid horizontal scroll.', 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(page, Number(user.user_id || 0) || null).run();
    await db.prepare(`INSERT INTO mobile_nav_touch_target_audits (page_path, target_selector, min_target_px, audit_status, issue_count, created_by_user_id, created_at, notes) VALUES (?, '.nav a, .nav button, .btn', 44, 'prepared', 0, ?, CURRENT_TIMESTAMP, 'Build 182 touch-target audit row for phone navigation and CTA buttons.')`).bind(page, Number(user.user_id || 0) || null).run();
  }
}
async function seedVisualCandidates(db, user) {
  for (const [page, key, kind] of PUBLIC_PAGES) {
    await runSafe(db, `INSERT INTO visual_enrichment_candidates (page_path, candidate_key, visual_kind, candidate_status, placement_selector, asset_hint, alt_text_hint, motion_safety, local_seo_phrase, created_by_user_id, created_at, updated_at, notes) VALUES (?, ?, ?, 'needs_review', '.hero, .customer-welcome, .grid', 'Use existing workshop/product image or R2 approved derivative; prefer 1200px webp.', ?, 'reduced_motion_safe', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Build 182 candidate for sharper professional visuals without adding extra H1 headings.') ON CONFLICT(page_path, candidate_key) DO UPDATE SET updated_at=CURRENT_TIMESTAMP, notes=excluded.notes`, [page, key, kind, `Devil n Dove ${page.replaceAll('/', ' ').trim() || 'home'} visual`, page.includes('ontario') || page.includes('southern') ? 'Southern Ontario handmade gifts' : 'Devil n Dove workshop creations', Number(user.user_id || 0) || null]);
    await runSafe(db, `INSERT INTO public_page_visual_asset_budgets (page_path, budget_status, max_inline_effects, max_new_images, preferred_image_ratio, lazy_loading_required, created_by_user_id, created_at, notes) VALUES (?, 'prepared', 3, 2, '4:3 or square', 1, ?, CURRENT_TIMESTAMP, 'Keep visual polish crisp: no heavy animation, no image bloat, lazy-load any new media.')`, [page, Number(user.user_id || 0) || null]);
  }
}
async function seedEffectSafety(db, user) {
  const effects = [
    ['hero_glow', '.hero::after', 'Subtle static glow only; reduced motion disables animation.'],
    ['polished_card_lift', '.card', 'Hover lift for pointer devices only; no layout shift on touch.'],
    ['visual_ribbon', '.visual-polish-strip', 'Decorative gradient strip, text remains readable without it.'],
    ['product_image_depth', '.product-card img', 'Soft shadow/border only; no colour distortion of product photos.']
  ];
  for (const row of effects) await db.prepare(`INSERT INTO visual_effect_safety_reviews (effect_key, affected_selector, effect_status, prefers_reduced_motion_supported, contrast_review_status, created_by_user_id, created_at, notes) VALUES (?, ?, 'allowed_with_reduced_motion', 1, 'passed_static', ?, CURRENT_TIMESTAMP, ?)`).bind(row[0], row[1], Number(user.user_id || 0) || null, row[2]).run();
}
async function seedCssDrift(db, user) {
  await db.prepare(`INSERT INTO css_drift_review_runs (build_label, css_path, open_brace_count, close_brace_count, review_status, created_by_user_id, created_at, notes) VALUES (?, 'css/styles.css', 0, 0, 'prepared_static_package_check', ?, CURRENT_TIMESTAMP, 'Static package check validates real brace counts before zip handoff; live row records review intent for admin history.')`).bind(BUILD_LABEL, Number(user.user_id || 0) || null).run();
}
async function seedFallbackRows(db, user) {
  const routes = ['/api/admin/visual-polish','/api/admin/deployment-preflight','/api/admin/release-control','/api/admin/live-ops-followthrough','/api/products','/api/catalog-items'];
  for (const route of routes) await db.prepare(`INSERT INTO route_fallback_review_rows (route_path, fallback_kind, fallback_status, user_message, created_by_user_id, created_at, updated_at, notes) VALUES (?, 'admin_or_public_error_state', 'needs_live_review', 'If this fails, show a readable retry message instead of a blank panel.', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Build 182 fallback review row for robust error handling.')`).bind(route, Number(user.user_id || 0) || null).run();
}
async function seedSchemaQueue(db, user) {
  for (const [page] of PUBLIC_PAGES) {
    for (const type of ['LocalBusiness','WebSite','Product']) {
      await db.prepare(`INSERT INTO schema_markup_validation_queue (page_path, schema_type, validation_status, source_hint, created_by_user_id, created_at, notes) VALUES (?, ?, 'queued', 'static_jsonld_or_product_detail', ?, CURRENT_TIMESTAMP, 'Validate structured data after public page updates and product media changes.')`).bind(page, type, Number(user.user_id || 0) || null).run();
    }
  }
}
async function seedJsonDbCandidates(db, user) {
  const items = [
    ['data/site/local-business-schema.json','local_business_schema_settings','D1 should own editable business fields; JSON remains deploy artifact.'],
    ['data/site/local-seo-bake-actions.json','local_seo_bake_actions','D1 should own reviewed local SEO actions; JSON remains static export.'],
    ['data/site/seo-page-overrides.json','seo_page_overrides','D1/admin overrides should remain source of truth when available.'],
    ['data/site/release-notes.json','release_note_runs','Release rows can be stored in D1 and exported into JSON for deploy packages.'],
    ['data/catalog.json','products','Catalog DB should own product rows; JSON remains fallback/public seed only.']
  ];
  for (const row of items) await db.prepare(`INSERT INTO json_db_migration_candidates (source_path, target_table, ownership_status, duplication_risk, migration_notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, 'needs_decision', 'medium', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(row[0], row[1], row[2], Number(user.user_id || 0) || null).run();
}
async function savePreference(db, user, body) {
  const key = lc(body.preference_key || 'visual_density');
  const value = normalizeText(body.preference_value || 'balanced');
  await db.prepare(`INSERT INTO visual_polish_admin_preferences (preference_key, preference_value, preference_status, created_by_user_id, created_at, updated_at, notes) VALUES (?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Saved from Build 182 Visual Polish admin page.') ON CONFLICT(preference_key) DO UPDATE SET preference_value=excluded.preference_value, preference_status='active', updated_at=CURRENT_TIMESTAMP, notes=excluded.notes`).bind(key, value, Number(user.user_id || 0) || null).run();
}
async function approveCandidate(db, user, body) {
  const id = Number(body.visual_enrichment_candidate_id || 0);
  if (!id) return;
  await db.prepare(`UPDATE visual_enrichment_candidates SET candidate_status='approved_for_next_media_pass', approved_by_user_id=?, approved_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE visual_enrichment_candidate_id=?`).bind(Number(user.user_id || 0) || null, id).run();
}
async function buildPayload(db) {
  await ensureTables(db);
  const summary = {
    parity_rows: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM desktop_mobile_parity_checks`, [], { count: 0 })).count || 0),
    visual_candidates: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM visual_enrichment_candidates`, [], { count: 0 })).count || 0),
    fallback_rows: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM route_fallback_review_rows`, [], { count: 0 })).count || 0),
    schema_queue: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM schema_markup_validation_queue`, [], { count: 0 })).count || 0)
  };
  return {
    ok: true,
    build_label: BUILD_LABEL,
    summary,
    parity: await safeAll(db, `SELECT * FROM desktop_mobile_parity_checks ORDER BY created_at DESC LIMIT 40`),
    touch_targets: await safeAll(db, `SELECT * FROM mobile_nav_touch_target_audits ORDER BY created_at DESC LIMIT 40`),
    candidates: await safeAll(db, `SELECT * FROM visual_enrichment_candidates ORDER BY updated_at DESC LIMIT 60`),
    effects: await safeAll(db, `SELECT * FROM visual_effect_safety_reviews ORDER BY created_at DESC LIMIT 20`),
    budgets: await safeAll(db, `SELECT * FROM public_page_visual_asset_budgets ORDER BY created_at DESC LIMIT 40`),
    fallback_rows: await safeAll(db, `SELECT * FROM route_fallback_review_rows ORDER BY updated_at DESC LIMIT 40`),
    schema_queue: await safeAll(db, `SELECT * FROM schema_markup_validation_queue ORDER BY created_at DESC LIMIT 50`),
    json_candidates: await safeAll(db, `SELECT * FROM json_db_migration_candidates ORDER BY created_at DESC LIMIT 30`),
    preferences: await safeAll(db, `SELECT * FROM visual_polish_admin_preferences ORDER BY preference_key LIMIT 20`),
    css_runs: await safeAll(db, `SELECT * FROM css_drift_review_runs ORDER BY created_at DESC LIMIT 20`)
  };
}
export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env); if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env); if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  return json(await buildPayload(db));
}
export async function onRequestPost(context) {
  const user = await getAdminUserFromRequest(context.request, context.env); if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env); if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureTables(db);
  const body = await context.request.json().catch(() => ({})); const action = lc(body.action || 'seed_all');
  try {
    if (action === 'seed_parity' || action === 'seed_all') await seedParityRows(db, user);
    if (action === 'seed_visual_candidates' || action === 'seed_all') await seedVisualCandidates(db, user);
    if (action === 'seed_effect_safety' || action === 'seed_all') await seedEffectSafety(db, user);
    if (action === 'seed_css_drift' || action === 'seed_all') await seedCssDrift(db, user);
    if (action === 'seed_fallbacks' || action === 'seed_all') await seedFallbackRows(db, user);
    if (action === 'seed_schema_queue' || action === 'seed_all') await seedSchemaQueue(db, user);
    if (action === 'seed_json_db_candidates' || action === 'seed_all') await seedJsonDbCandidates(db, user);
    if (action === 'save_preference') await savePreference(db, user, body);
    if (action === 'approve_candidate') await approveCandidate(db, user, body);
    return json(await buildPayload(db));
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Build 182 visual polish action failed.' }, 400);
  }
}
