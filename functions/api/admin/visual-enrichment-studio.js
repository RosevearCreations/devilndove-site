// File: /functions/api/admin/visual-enrichment-studio.js
// Brief description: Build 183 API for visual media picker rows, screenshot pairs, image-slot assignments, budgets, visual diffs, alt text suggestions, seasonal campaigns, gallery rotation, low-bandwidth preference, and final visual deployment report.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 183';
const PUBLIC_PAGES = [
  ['/', 'home_visual_story', 'hero_media_slot'],
  ['/shop/', 'shop_cards', 'product_card_media'],
  ['/collections/', 'collections_path', 'collection_media_slot'],
  ['/custom-gifts-southern-ontario/', 'custom_gifts', 'local_service_media'],
  ['/handmade-jewelry-ontario/', 'handmade_jewelry', 'local_service_media'],
  ['/laser-engraving-ontario/', 'laser_engraving', 'process_media'],
  ['/custom-candle-making-ontario/', 'custom_candles', 'process_media'],
  ['/custom-soap-making-ontario/', 'custom_soap', 'process_media'],
  ['/vintage-finds-ontario/', 'vintage_finds', 'condition_media'],
  ['/workshop-made-gifts-ontario/', 'workshop_gifts', 'maker_story_media']
];
const SEASONS = [
  ['christmas_custom_gifts', 'Christmas custom gifts', 'November/December gift searches and market prep'],
  ['mothers_day_gifts', 'Mother’s Day handmade gifts', 'Spring handmade jewelry, candles, soap, and engraved gifts'],
  ['fathers_day_gifts', 'Father’s Day engraved gifts', 'Engraving, vintage tools, workshop-made gifts, and custom requests'],
  ['local_markets', 'Southern Ontario markets', 'Pickup, market-table visuals, proof photos, and local community trust'],
  ['custom_gift_events', 'Custom gift events', 'Birthdays, anniversaries, memorial pieces, and small-batch creative work']
];
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function runSafe(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
function cleanSlug(value) { return lc(value || 'item').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item'; }
function altSuggestion(row = {}) {
  const page = normalizeText(row.page_path || '/');
  const kind = normalizeText(row.visual_kind || row.slot_kind || 'workshop image').replaceAll('_', ' ');
  const local = page.includes('ontario') || page.includes('southern') ? ' in Southern Ontario' : '';
  return `Devil n Dove ${kind}${local} for ${page === '/' ? 'the handmade and vintage shop homepage' : page.replaceAll('/', ' ').trim()}`.slice(0, 150);
}
async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS visual_candidate_media_assets (visual_candidate_media_asset_id INTEGER PRIMARY KEY AUTOINCREMENT, visual_enrichment_candidate_id INTEGER, page_path TEXT NOT NULL, candidate_key TEXT, source_kind TEXT NOT NULL DEFAULT 'product_image', source_id INTEGER, thumbnail_url TEXT, image_url TEXT, alt_text TEXT, asset_status TEXT NOT NULL DEFAULT 'available', file_size_bytes INTEGER NOT NULL DEFAULT 0, width INTEGER, height INTEGER, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS visual_parity_screenshot_pairs (visual_parity_screenshot_pair_id INTEGER PRIMARY KEY AUTOINCREMENT, desktop_mobile_parity_check_id INTEGER, page_path TEXT NOT NULL, desktop_screenshot_url TEXT, mobile_screenshot_url TEXT, desktop_object_key TEXT, mobile_object_key TEXT, pair_status TEXT NOT NULL DEFAULT 'needs_upload', diff_status TEXT NOT NULL DEFAULT 'not_compared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS visual_polish_screenshot_jobs (visual_polish_screenshot_job_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, viewport_label TEXT NOT NULL DEFAULT 'mobile_390', job_status TEXT NOT NULL DEFAULT 'queued', evidence_page TEXT NOT NULL DEFAULT '/admin/dark-theme-evidence/', dark_theme_required INTEGER NOT NULL DEFAULT 1, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS local_seo_visual_candidate_badges (local_seo_visual_candidate_badge_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, badge_label TEXT, badge_status TEXT NOT NULL DEFAULT 'prepared', candidate_count INTEGER NOT NULL DEFAULT 0, approved_count INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT, UNIQUE(page_path))`,
    `CREATE TABLE IF NOT EXISTS public_page_image_slot_assignments (public_page_image_slot_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, slot_key TEXT NOT NULL, visual_enrichment_candidate_id INTEGER, media_asset_id INTEGER, assignment_status TEXT NOT NULL DEFAULT 'draft', h1_change_allowed INTEGER NOT NULL DEFAULT 0, image_url TEXT, alt_text TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT, UNIQUE(page_path, slot_key))`,
    `CREATE TABLE IF NOT EXISTS media_compression_budget_reports (media_compression_budget_report_id INTEGER PRIMARY KEY AUTOINCREMENT, image_url TEXT NOT NULL, source_kind TEXT NOT NULL DEFAULT 'visual_candidate', source_id INTEGER, file_size_bytes INTEGER NOT NULL DEFAULT 0, budget_status TEXT NOT NULL DEFAULT 'unknown_size', max_size_bytes INTEGER NOT NULL DEFAULT 350000, recommended_action TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS visual_diff_overlay_pairs (visual_diff_overlay_pair_id INTEGER PRIMARY KEY AUTOINCREMENT, screenshot_pair_id INTEGER, page_path TEXT NOT NULL, previous_image_url TEXT, current_image_url TEXT, overlay_status TEXT NOT NULL DEFAULT 'needs_review', difference_score INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS visual_candidate_alt_text_suggestions (visual_candidate_alt_text_suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT, visual_enrichment_candidate_id INTEGER, page_path TEXT NOT NULL, suggested_alt_text TEXT NOT NULL, suggestion_status TEXT NOT NULL DEFAULT 'draft', copied_at TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS schema_validation_result_imports (schema_validation_result_import_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, schema_type TEXT NOT NULL DEFAULT 'LocalBusiness', validator_name TEXT NOT NULL DEFAULT 'manual', validation_status TEXT NOT NULL DEFAULT 'needs_import', issue_count INTEGER NOT NULL DEFAULT 0, imported_by_user_id INTEGER, imported_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS json_db_ownership_decisions (json_db_ownership_decision_id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT NOT NULL, target_table TEXT, ownership_status TEXT NOT NULL DEFAULT 'needs_decision', decision_reason TEXT, decided_by_user_id INTEGER, decided_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(source_path, target_table))`,
    `CREATE TABLE IF NOT EXISTS public_api_fallback_preview_cards (public_api_fallback_preview_card_id INTEGER PRIMARY KEY AUTOINCREMENT, endpoint_path TEXT NOT NULL, customer_message TEXT NOT NULL, fallback_status TEXT NOT NULL DEFAULT 'prepared', preview_context TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS mobile_visual_candidate_quick_cards (mobile_visual_candidate_quick_card_id INTEGER PRIMARY KEY AUTOINCREMENT, visual_enrichment_candidate_id INTEGER, page_path TEXT NOT NULL, quick_card_status TEXT NOT NULL DEFAULT 'ready_for_phone_review', tap_target_ok INTEGER NOT NULL DEFAULT 1, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS seasonal_visual_campaigns (seasonal_visual_campaign_id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_key TEXT NOT NULL UNIQUE, campaign_label TEXT NOT NULL, campaign_status TEXT NOT NULL DEFAULT 'planning', page_path TEXT, image_need_count INTEGER NOT NULL DEFAULT 3, local_seo_phrase TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS gallery_hero_rotation_queue (gallery_hero_rotation_queue_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL DEFAULT '/gallery/', media_asset_id INTEGER, image_url TEXT, alt_text TEXT, rotation_status TEXT NOT NULL DEFAULT 'candidate', sort_order INTEGER NOT NULL DEFAULT 0, approved_media_only INTEGER NOT NULL DEFAULT 1, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS product_detail_visual_polish_checks (product_detail_visual_polish_check_id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, product_slug TEXT, thumbnail_strip_status TEXT NOT NULL DEFAULT 'needs_review', featured_image_status TEXT NOT NULL DEFAULT 'needs_review', image_roles_status TEXT NOT NULL DEFAULT 'needs_review', mobile_zoom_status TEXT NOT NULL DEFAULT 'needs_review', issue_count INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS css_token_drift_checks (css_token_drift_check_id INTEGER PRIMARY KEY AUTOINCREMENT, token_key TEXT NOT NULL, expected_value TEXT, detected_value TEXT, drift_status TEXT NOT NULL DEFAULT 'prepared', token_group TEXT NOT NULL DEFAULT 'visual', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS visual_accessibility_notes (visual_accessibility_note_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, note_kind TEXT NOT NULL DEFAULT 'motion_contrast_touch', note_status TEXT NOT NULL DEFAULT 'prepared', note_text TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS safe_deploy_json_ownership_exports (safe_deploy_json_ownership_export_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 183', source_path TEXT NOT NULL, target_table TEXT, ownership_status TEXT NOT NULL DEFAULT 'documented', export_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS public_low_bandwidth_preferences (public_low_bandwidth_preference_id INTEGER PRIMARY KEY AUTOINCREMENT, preference_key TEXT NOT NULL UNIQUE, preference_status TEXT NOT NULL DEFAULT 'available', default_value TEXT NOT NULL DEFAULT 'auto', customer_label TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS final_visual_deployment_report_rows (final_visual_deployment_report_row_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 183', row_kind TEXT NOT NULL, row_status TEXT NOT NULL DEFAULT 'prepared', row_summary TEXT NOT NULL, source_count INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`
  ];
  for (const statement of statements) await runSafe(db, statement);
}
async function availableCandidateRows(db) {
  return await safeAll(db, `SELECT visual_enrichment_candidate_id, page_path, candidate_key, visual_kind, candidate_status, asset_hint, alt_text_hint FROM visual_enrichment_candidates ORDER BY updated_at DESC LIMIT 40`);
}
async function seedMediaPickerAssets(db, user) {
  const candidates = await availableCandidateRows(db);
  const productImages = await safeAll(db, `SELECT pi.product_image_id, pi.product_id, pi.image_url, pi.alt_text, pi.image_role, p.slug, p.name FROM product_images pi LEFT JOIN products p ON p.product_id=pi.product_id WHERE pi.image_url IS NOT NULL AND TRIM(pi.image_url)<>'' ORDER BY pi.product_image_id DESC LIMIT 30`);
  const fallbackImages = productImages.length ? productImages : PUBLIC_PAGES.map(([page, key]) => ({ product_image_id: null, product_id: null, image_url: '/assets/logo-clear.png', alt_text: altSuggestion({ page_path: page, visual_kind: key }), image_role: 'fallback', slug: key, name: 'Devil n Dove approved placeholder' }));
  let inserted = 0;
  for (const c of (candidates.length ? candidates : PUBLIC_PAGES.map(([page, key, kind], i) => ({ visual_enrichment_candidate_id: null, page_path: page, candidate_key: key, visual_kind: kind })))) {
    const img = fallbackImages[inserted % fallbackImages.length];
    await runSafe(db, `INSERT INTO visual_candidate_media_assets (visual_enrichment_candidate_id, page_path, candidate_key, source_kind, source_id, thumbnail_url, image_url, alt_text, asset_status, file_size_bytes, created_by_user_id, created_at, updated_at, notes) VALUES (?, ?, ?, 'product_image_or_static_fallback', ?, ?, ?, ?, 'available', 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Build 183 media picker candidate. Replace fallback logo with R2/product thumbnail when real approved media is selected.')`, [Number(c.visual_enrichment_candidate_id || 0) || null, c.page_path, c.candidate_key || cleanSlug(c.page_path), Number(img.product_image_id || 0) || null, img.image_url, img.image_url, img.alt_text || altSuggestion(c), Number(user.user_id || 0) || null]);
    inserted += 1;
  }
  return inserted;
}
async function seedScreenshotPairs(db, user) {
  let count = 0;
  for (const [page] of PUBLIC_PAGES) {
    await runSafe(db, `INSERT INTO visual_parity_screenshot_pairs (page_path, pair_status, diff_status, created_by_user_id, created_at, updated_at, notes) VALUES (?, 'needs_upload', 'not_compared', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Upload desktop and mobile screenshots side-by-side after deploy.')`, [page, Number(user.user_id || 0) || null]);
    await runSafe(db, `INSERT INTO visual_polish_screenshot_jobs (page_path, viewport_label, job_status, dark_theme_required, created_by_user_id, created_at, notes) VALUES (?, 'desktop_1440', 'queued', 1, ?, CURRENT_TIMESTAMP, 'Build 183 screenshot capture job for desktop visual review.')`, [page, Number(user.user_id || 0) || null]);
    await runSafe(db, `INSERT INTO visual_polish_screenshot_jobs (page_path, viewport_label, job_status, dark_theme_required, created_by_user_id, created_at, notes) VALUES (?, 'mobile_390', 'queued', 1, ?, CURRENT_TIMESTAMP, 'Build 183 screenshot capture job for phone visual review.')`, [page, Number(user.user_id || 0) || null]);
    count += 1;
  }
  return count;
}
async function seedSeoBadgesAndSlots(db, user) {
  for (const [page, key, kind] of PUBLIC_PAGES) {
    const candidateCount = await safeFirst(db, `SELECT COUNT(*) AS c, SUM(CASE WHEN candidate_status LIKE 'approved%' THEN 1 ELSE 0 END) AS a FROM visual_enrichment_candidates WHERE page_path=?`, [page], { c: 0, a: 0 });
    await runSafe(db, `INSERT INTO local_seo_visual_candidate_badges (page_path, badge_label, badge_status, candidate_count, approved_count, created_by_user_id, created_at, updated_at, notes) VALUES (?, ?, 'prepared', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Shown beside Local SEO Review rows so visual readiness is visible with SEO readiness.') ON CONFLICT(page_path) DO UPDATE SET candidate_count=excluded.candidate_count, approved_count=excluded.approved_count, updated_at=CURRENT_TIMESTAMP`, [page, `${kind.replaceAll('_', ' ')} ready`, Number(candidateCount.c || 0), Number(candidateCount.a || 0), Number(user.user_id || 0) || null]);
    await runSafe(db, `INSERT INTO public_page_image_slot_assignments (page_path, slot_key, assignment_status, h1_change_allowed, alt_text, created_by_user_id, created_at, updated_at, notes) VALUES (?, ?, 'draft', 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Draft image slot assignment. Do not change the page H1 when placing approved media.') ON CONFLICT(page_path, slot_key) DO UPDATE SET alt_text=excluded.alt_text, updated_at=CURRENT_TIMESTAMP`, [page, key, altSuggestion({ page_path: page, visual_kind: kind }), Number(user.user_id || 0) || null]);
  }
}
async function seedBudgetsDiffsAndAltText(db, user) {
  const assets = await safeAll(db, `SELECT * FROM visual_candidate_media_assets ORDER BY created_at DESC LIMIT 40`);
  const candidates = await availableCandidateRows(db);
  for (const asset of assets) {
    await runSafe(db, `INSERT INTO media_compression_budget_reports (image_url, source_kind, source_id, file_size_bytes, budget_status, max_size_bytes, recommended_action, created_by_user_id, created_at, notes) VALUES (?, 'visual_candidate_media_asset', ?, ?, ?, 350000, ?, ?, CURRENT_TIMESTAMP, 'Build 183 compression budget row before image promotion.')`, [asset.image_url || asset.thumbnail_url || '/assets/logo-clear.png', Number(asset.visual_candidate_media_asset_id || 0), Number(asset.file_size_bytes || 0), Number(asset.file_size_bytes || 0) > 350000 ? 'over_budget' : 'unknown_size', Number(asset.file_size_bytes || 0) > 350000 ? 'Compress to webp/avif and keep under 350 KB before public use.' : 'Confirm real byte size from R2 before final promotion.', Number(user.user_id || 0) || null]);
  }
  for (const pair of await safeAll(db, `SELECT * FROM visual_parity_screenshot_pairs ORDER BY created_at DESC LIMIT 30`)) {
    await runSafe(db, `INSERT INTO visual_diff_overlay_pairs (screenshot_pair_id, page_path, previous_image_url, current_image_url, overlay_status, difference_score, created_by_user_id, created_at, notes) VALUES (?, ?, ?, ?, 'needs_review', 0, ?, CURRENT_TIMESTAMP, 'Build 183 visual diff placeholder. Upload previous/current screenshots to compare layout drift.')`, [Number(pair.visual_parity_screenshot_pair_id || 0), pair.page_path, pair.desktop_screenshot_url || '', pair.mobile_screenshot_url || '', Number(user.user_id || 0) || null]);
  }
  for (const candidate of candidates.length ? candidates : PUBLIC_PAGES.map(([page, key, kind]) => ({ visual_enrichment_candidate_id: null, page_path: page, visual_kind: kind }))) {
    await runSafe(db, `INSERT INTO visual_candidate_alt_text_suggestions (visual_enrichment_candidate_id, page_path, suggested_alt_text, suggestion_status, created_by_user_id, created_at, notes) VALUES (?, ?, ?, 'draft', ?, CURRENT_TIMESTAMP, 'One-click copy source for approved visual candidates. Review before publishing.')`, [Number(candidate.visual_enrichment_candidate_id || 0) || null, candidate.page_path, altSuggestion(candidate), Number(user.user_id || 0) || null]);
  }
}
async function seedValidationOwnershipAndFallbacks(db, user) {
  const jsonRows = [
    ['data/catalog.json', 'products', 'D1 should own live catalog records; JSON remains emergency fallback until migration is fully proven.'],
    ['data/site/seo-page-overrides.json', 'seo_page_overrides', 'D1 should own reviewed SEO overrides; static JSON remains baked public fallback.'],
    ['data/site/local-business-schema.json', 'local_business_schema_extended_fields', 'D1 should own admin edits; static JSON remains generated output.'],
    ['data/site/local-seo-bake-actions.json', 'local_seo_bake_actions', 'D1 should own review queue; JSON remains safe deploy export.']
  ];
  for (const [source, table, reason] of jsonRows) {
    await runSafe(db, `INSERT INTO json_db_ownership_decisions (source_path, target_table, ownership_status, decision_reason, decided_by_user_id, decided_at, created_at, updated_at) VALUES (?, ?, 'd1_primary_json_fallback', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(source_path, target_table) DO UPDATE SET ownership_status=excluded.ownership_status, decision_reason=excluded.decision_reason, updated_at=CURRENT_TIMESTAMP`, [source, table, reason, Number(user.user_id || 0) || null]);
    await runSafe(db, `INSERT INTO safe_deploy_json_ownership_exports (build_label, source_path, target_table, ownership_status, export_status, created_by_user_id, created_at, notes) VALUES (?, ?, ?, 'd1_primary_json_fallback', 'prepared', ?, CURRENT_TIMESTAMP, ?)`, [BUILD_LABEL, source, table, Number(user.user_id || 0) || null, reason]);
  }
  for (const [page] of PUBLIC_PAGES) {
    await runSafe(db, `INSERT INTO schema_validation_result_imports (page_path, schema_type, validator_name, validation_status, issue_count, created_at, notes) VALUES (?, 'LocalBusiness', 'manual_rich_results_or_schema_validator', 'needs_import', 0, CURRENT_TIMESTAMP, 'Paste manual validator result after checking the deployed page.')`, [page]);
  }
  const fallbacks = [
    ['/api/products', 'Products are temporarily unavailable. Please try again soon or contact us for help finding a piece.'],
    ['/api/shop-products', 'The shop is having trouble loading. The static page still shows ways to contact Devil n Dove.'],
    ['/api/gift-cards', 'Gift card tools are temporarily unavailable. No charge was made.'],
    ['/api/social-feed', 'Social links are temporarily using the saved fallback links.'],
    ['/api/local-trust-block', 'Local trust notes are temporarily unavailable, but the page content remains readable.']
  ];
  for (const [endpoint, msg] of fallbacks) {
    await runSafe(db, `INSERT INTO public_api_fallback_preview_cards (endpoint_path, customer_message, fallback_status, preview_context, created_by_user_id, created_at, notes) VALUES (?, ?, 'prepared', 'public_error_state', ?, CURRENT_TIMESTAMP, 'Review the exact customer-facing fallback copy before deploy.')`, [endpoint, msg, Number(user.user_id || 0) || null]);
  }
}
async function seedMobileSeasonalGalleryProductCssAccessibility(db, user) {
  for (const c of await availableCandidateRows(db)) {
    await runSafe(db, `INSERT INTO mobile_visual_candidate_quick_cards (visual_enrichment_candidate_id, page_path, quick_card_status, tap_target_ok, created_by_user_id, created_at, notes) VALUES (?, ?, 'ready_for_phone_review', 1, ?, CURRENT_TIMESTAMP, 'Phone-friendly approval card for visual candidate review.')`, [Number(c.visual_enrichment_candidate_id || 0) || null, c.page_path, Number(user.user_id || 0) || null]);
  }
  for (const [key, label, note] of SEASONS) {
    await runSafe(db, `INSERT INTO seasonal_visual_campaigns (campaign_key, campaign_label, campaign_status, page_path, image_need_count, local_seo_phrase, created_by_user_id, created_at, updated_at, notes) VALUES (?, ?, 'planning', '/custom-gifts-southern-ontario/', 3, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?) ON CONFLICT(campaign_key) DO UPDATE SET campaign_status=excluded.campaign_status, updated_at=CURRENT_TIMESTAMP`, [key, label, label + ' Southern Ontario', Number(user.user_id || 0) || null, note]);
  }
  const assets = await safeAll(db, `SELECT * FROM visual_candidate_media_assets WHERE asset_status IN ('available','approved','selected') ORDER BY created_at DESC LIMIT 6`);
  let order = 0;
  for (const asset of assets.length ? assets : [{ image_url:'/assets/logo-clear.png', alt_text:'Devil n Dove gallery hero image', visual_candidate_media_asset_id:null }]) {
    await runSafe(db, `INSERT INTO gallery_hero_rotation_queue (page_path, media_asset_id, image_url, alt_text, rotation_status, sort_order, approved_media_only, created_by_user_id, created_at, updated_at, notes) VALUES ('/gallery/', ?, ?, ?, 'candidate', ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Approved-media-only hero rotation queue.')`, [Number(asset.visual_candidate_media_asset_id || 0) || null, asset.image_url, asset.alt_text || 'Devil n Dove gallery hero image', order++, Number(user.user_id || 0) || null]);
  }
  const products = await safeAll(db, `SELECT product_id, slug, name FROM products ORDER BY updated_at DESC LIMIT 30`);
  for (const p of products) {
    await runSafe(db, `INSERT INTO product_detail_visual_polish_checks (product_id, product_slug, thumbnail_strip_status, featured_image_status, image_roles_status, mobile_zoom_status, issue_count, created_by_user_id, created_at, notes) VALUES (?, ?, 'needs_review', 'needs_review', 'needs_review', 'needs_review', 0, ?, CURRENT_TIMESTAMP, 'Review thumbnail strip, featured image, roles, and mobile zoom before publishing.')`, [Number(p.product_id || 0), p.slug || cleanSlug(p.name), Number(user.user_id || 0) || null]);
  }
  const tokens = [
    ['button_min_height','44px','touch_target'], ['card_radius','16px','shape'], ['focus_outline','3px','accessibility'], ['image_border_radius','12px','shape'], ['text_overlay_contrast','AA_review_required','contrast'], ['card_gap','12px','spacing']
  ];
  for (const [key, expected, group] of tokens) await runSafe(db, `INSERT INTO css_token_drift_checks (token_key, expected_value, detected_value, drift_status, token_group, created_by_user_id, created_at, notes) VALUES (?, ?, '', 'prepared', ?, ?, CURRENT_TIMESTAMP, 'Check CSS token drift during visual polish review.')`, [key, expected, group, Number(user.user_id || 0) || null]);
  for (const [page] of PUBLIC_PAGES) {
    await runSafe(db, `INSERT INTO visual_accessibility_notes (page_path, note_kind, note_status, note_text, created_by_user_id, created_at, notes) VALUES (?, 'motion_contrast_touch', 'prepared', 'Respect reduced motion, keep text readable over images, confirm 44px+ touch targets, and avoid visual clutter.', ?, CURRENT_TIMESTAMP, 'Build 183 accessibility review row.')`, [page, Number(user.user_id || 0) || null]);
  }
  await runSafe(db, `INSERT INTO public_low_bandwidth_preferences (preference_key, preference_status, default_value, customer_label, created_by_user_id, created_at, updated_at, notes) VALUES ('public_low_bandwidth_mode', 'available', 'auto', 'Lighter images and quieter visual effects', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Customer-facing lighter media preference stored locally by browser.') ON CONFLICT(preference_key) DO UPDATE SET updated_at=CURRENT_TIMESTAMP, preference_status='available'`, [Number(user.user_id || 0) || null]);
}
async function seedFinalReportRows(db, user) {
  const summaryRows = [
    ['media_picker', 'Visual candidates now have media-picker asset rows.'],
    ['screenshots', 'Desktop/mobile screenshot pair rows and automated capture job placeholders are prepared.'],
    ['seo_badges', 'Local SEO visual candidate badges and image-slot assignments are prepared.'],
    ['budgets', 'Image compression budgets, visual diffs, and alt-text suggestion rows are prepared.'],
    ['fallbacks', 'Public API fallback preview cards and schema validation import rows are prepared.'],
    ['mobile_campaigns', 'Phone quick cards, seasonal campaigns, gallery hero rotation, and product detail visual checks are prepared.'],
    ['accessibility', 'CSS token drift, accessibility notes, low-bandwidth mode, and JSON ownership exports are prepared.']
  ];
  for (const [kind, summary] of summaryRows) {
    await runSafe(db, `INSERT INTO final_visual_deployment_report_rows (build_label, row_kind, row_status, row_summary, source_count, created_by_user_id, created_at, notes) VALUES (?, ?, 'prepared', ?, 0, ?, CURRENT_TIMESTAMP, 'Include this in the final printable deployment report with Release Control and Live Ops.')`, [BUILD_LABEL, kind, summary, Number(user.user_id || 0) || null]);
  }
}
async function seedAll(db, user) {
  const insertedMedia = await seedMediaPickerAssets(db, user);
  await seedScreenshotPairs(db, user);
  await seedSeoBadgesAndSlots(db, user);
  await seedBudgetsDiffsAndAltText(db, user);
  await seedValidationOwnershipAndFallbacks(db, user);
  await seedMobileSeasonalGalleryProductCssAccessibility(db, user);
  await seedFinalReportRows(db, user);
  return { insertedMedia };
}
async function selectMedia(db, user, body) {
  const assignmentId = Number(body.public_page_image_slot_assignment_id || 0);
  const mediaId = Number(body.visual_candidate_media_asset_id || 0);
  const asset = mediaId ? await safeFirst(db, `SELECT * FROM visual_candidate_media_assets WHERE visual_candidate_media_asset_id=? LIMIT 1`, [mediaId], null) : null;
  if (!assignmentId || !asset) return { ok: false, status: 400, error: 'Image slot assignment and media asset are required.' };
  await db.prepare(`UPDATE public_page_image_slot_assignments SET media_asset_id=?, image_url=?, alt_text=?, assignment_status='selected_for_review', created_by_user_id=COALESCE(created_by_user_id, ?), updated_at=CURRENT_TIMESTAMP, notes='Media selected from Build 183 visual picker; review before publishing.' WHERE public_page_image_slot_assignment_id=?`).bind(mediaId, asset.image_url || asset.thumbnail_url || '', asset.alt_text || altSuggestion(asset), Number(user.user_id || 0) || null, assignmentId).run();
  return { ok: true };
}
async function copyAltText(db, user, body) {
  const id = Number(body.visual_candidate_alt_text_suggestion_id || 0);
  if (!id) return { ok: false, status: 400, error: 'Alt-text suggestion id is required.' };
  await db.prepare(`UPDATE visual_candidate_alt_text_suggestions SET suggestion_status='copied_for_review', copied_at=CURRENT_TIMESTAMP, created_by_user_id=COALESCE(created_by_user_id, ?) WHERE visual_candidate_alt_text_suggestion_id=?`).bind(Number(user.user_id || 0) || null, id).run();
  return { ok: true };
}
async function buildPayload(db) {
  await ensureTables(db);
  const summary = {
    media_assets: Number((await safeFirst(db, `SELECT COUNT(*) AS c FROM visual_candidate_media_assets`, [], { c: 0 })).c || 0),
    screenshot_pairs: Number((await safeFirst(db, `SELECT COUNT(*) AS c FROM visual_parity_screenshot_pairs`, [], { c: 0 })).c || 0),
    image_slots: Number((await safeFirst(db, `SELECT COUNT(*) AS c FROM public_page_image_slot_assignments`, [], { c: 0 })).c || 0),
    alt_suggestions: Number((await safeFirst(db, `SELECT COUNT(*) AS c FROM visual_candidate_alt_text_suggestions`, [], { c: 0 })).c || 0),
    seasonal_campaigns: Number((await safeFirst(db, `SELECT COUNT(*) AS c FROM seasonal_visual_campaigns`, [], { c: 0 })).c || 0),
    final_report_rows: Number((await safeFirst(db, `SELECT COUNT(*) AS c FROM final_visual_deployment_report_rows`, [], { c: 0 })).c || 0)
  };
  return {
    ok: true,
    build_label: BUILD_LABEL,
    summary,
    media_assets: await safeAll(db, `SELECT * FROM visual_candidate_media_assets ORDER BY updated_at DESC LIMIT 30`),
    screenshot_pairs: await safeAll(db, `SELECT * FROM visual_parity_screenshot_pairs ORDER BY created_at DESC LIMIT 20`),
    screenshot_jobs: await safeAll(db, `SELECT * FROM visual_polish_screenshot_jobs ORDER BY created_at DESC LIMIT 20`),
    seo_badges: await safeAll(db, `SELECT * FROM local_seo_visual_candidate_badges ORDER BY page_path LIMIT 20`),
    image_slots: await safeAll(db, `SELECT * FROM public_page_image_slot_assignments ORDER BY page_path LIMIT 20`),
    budgets: await safeAll(db, `SELECT * FROM media_compression_budget_reports ORDER BY created_at DESC LIMIT 20`),
    diffs: await safeAll(db, `SELECT * FROM visual_diff_overlay_pairs ORDER BY created_at DESC LIMIT 20`),
    alt_suggestions: await safeAll(db, `SELECT * FROM visual_candidate_alt_text_suggestions ORDER BY created_at DESC LIMIT 20`),
    schema_imports: await safeAll(db, `SELECT * FROM schema_validation_result_imports ORDER BY created_at DESC LIMIT 20`),
    ownership: await safeAll(db, `SELECT * FROM json_db_ownership_decisions ORDER BY source_path LIMIT 20`),
    fallbacks: await safeAll(db, `SELECT * FROM public_api_fallback_preview_cards ORDER BY endpoint_path LIMIT 20`),
    mobile_cards: await safeAll(db, `SELECT * FROM mobile_visual_candidate_quick_cards ORDER BY created_at DESC LIMIT 20`),
    campaigns: await safeAll(db, `SELECT * FROM seasonal_visual_campaigns ORDER BY campaign_key LIMIT 20`),
    hero_queue: await safeAll(db, `SELECT * FROM gallery_hero_rotation_queue ORDER BY sort_order LIMIT 20`),
    product_checks: await safeAll(db, `SELECT * FROM product_detail_visual_polish_checks ORDER BY created_at DESC LIMIT 20`),
    css_tokens: await safeAll(db, `SELECT * FROM css_token_drift_checks ORDER BY token_group, token_key LIMIT 40`),
    accessibility: await safeAll(db, `SELECT * FROM visual_accessibility_notes ORDER BY created_at DESC LIMIT 20`),
    low_bandwidth: await safeAll(db, `SELECT * FROM public_low_bandwidth_preferences ORDER BY preference_key LIMIT 10`),
    final_report: await safeAll(db, `SELECT * FROM final_visual_deployment_report_rows ORDER BY created_at DESC LIMIT 20`)
  };
}
export async function onRequestGet({ request, env }) {
  try {
    await getAdminUserFromRequest(request, env);
    const db = getDb(env);
    return json(await buildPayload(db));
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Build 183 visual enrichment studio failed to load.' }, 500);
  }
}
export async function onRequestPost({ request, env }) {
  try {
    const user = await getAdminUserFromRequest(request, env);
    const db = getDb(env);
    await ensureTables(db);
    const body = await request.json().catch(() => ({}));
    const action = lc(body.action || 'seed_all');
    let result = { ok: true };
    if (action === 'seed_all') result = await seedAll(db, user);
    else if (action === 'seed_media_picker') result = { ok: true, insertedMedia: await seedMediaPickerAssets(db, user) };
    else if (action === 'seed_screenshots') result = { ok: true, insertedPairs: await seedScreenshotPairs(db, user) };
    else if (action === 'seed_seo_slots') { await seedSeoBadgesAndSlots(db, user); result = { ok: true }; }
    else if (action === 'seed_budgets') { await seedBudgetsDiffsAndAltText(db, user); result = { ok: true }; }
    else if (action === 'seed_fallbacks') { await seedValidationOwnershipAndFallbacks(db, user); result = { ok: true }; }
    else if (action === 'seed_campaigns') { await seedMobileSeasonalGalleryProductCssAccessibility(db, user); result = { ok: true }; }
    else if (action === 'select_media') result = await selectMedia(db, user, body);
    else if (action === 'copy_alt_text') result = await copyAltText(db, user, body);
    else return json({ ok: false, error: 'Unknown Build 183 visual enrichment action.' }, 400);
    if (result?.ok === false) return json(result, result.status || 400);
    return json({ ...await buildPayload(db), action_result: result });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Build 183 visual enrichment action failed.' }, 400);
  }
}
