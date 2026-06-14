// File: /functions/api/admin/command-center.js
// Brief description: Build 185 Admin Command Center API for daily operations, product readiness, conversion funnel, local SEO scorecard, visual proof, customer stories, mobile quick add, costing, customer history, and performance budgets.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 185';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function runSafe(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
async function tableExists(db, tableName) { const row = await safeFirst(db, `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], null); return !!row; }

async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS admin_command_center_daily_snapshots (admin_command_center_daily_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 185', snapshot_status TEXT NOT NULL DEFAULT 'review', total_products INTEGER NOT NULL DEFAULT 0, ready_products INTEGER NOT NULL DEFAULT 0, blocked_products INTEGER NOT NULL DEFAULT 0, open_orders INTEGER NOT NULL DEFAULT 0, open_recalls INTEGER NOT NULL DEFAULT 0, seo_pages_needing_review INTEGER NOT NULL DEFAULT 0, visual_items_needing_review INTEGER NOT NULL DEFAULT 0, marketplace_items_blocked INTEGER NOT NULL DEFAULT 0, performance_items_over_budget INTEGER NOT NULL DEFAULT 0, summary_json TEXT DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS admin_command_center_cards (admin_command_center_card_id INTEGER PRIMARY KEY AUTOINCREMENT, card_key TEXT NOT NULL UNIQUE, card_label TEXT NOT NULL, card_area TEXT NOT NULL DEFAULT 'daily_ops', card_status TEXT NOT NULL DEFAULT 'active', priority_rank INTEGER NOT NULL DEFAULT 100, desktop_status TEXT NOT NULL DEFAULT 'prepared', mobile_status TEXT NOT NULL DEFAULT 'prepared', primary_route TEXT, metric_label TEXT, metric_value INTEGER NOT NULL DEFAULT 0, action_label TEXT, action_route TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS product_readiness_scoreboard_snapshots (product_readiness_scoreboard_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 185', product_id INTEGER, product_name TEXT, product_slug TEXT, readiness_score INTEGER NOT NULL DEFAULT 0, missing_image_roles INTEGER NOT NULL DEFAULT 0, missing_alt_text INTEGER NOT NULL DEFAULT 0, missing_price INTEGER NOT NULL DEFAULT 0, missing_story INTEGER NOT NULL DEFAULT 0, missing_shipping INTEGER NOT NULL DEFAULT 0, marketplace_blockers INTEGER NOT NULL DEFAULT 0, inventory_blockers INTEGER NOT NULL DEFAULT 0, readiness_status TEXT NOT NULL DEFAULT 'needs_review', recommended_next_action TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS conversion_funnel_scorecard_rows (conversion_funnel_scorecard_row_id INTEGER PRIMARY KEY AUTOINCREMENT, funnel_step TEXT NOT NULL UNIQUE, step_label TEXT NOT NULL, step_order INTEGER NOT NULL DEFAULT 100, source_kind TEXT NOT NULL DEFAULT 'manual_or_analytics_import', event_count INTEGER NOT NULL DEFAULT 0, previous_step_count INTEGER NOT NULL DEFAULT 0, conversion_rate_percent REAL NOT NULL DEFAULT 0, dropoff_note TEXT, review_status TEXT NOT NULL DEFAULT 'needs_tracking', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS local_seo_value_scorecard_rows (local_seo_value_scorecard_row_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL UNIQUE, target_phrase TEXT NOT NULL, search_console_status TEXT NOT NULL DEFAULT 'needs_import', google_business_profile_status TEXT NOT NULL DEFAULT 'manual_review', ranking_check_status TEXT NOT NULL DEFAULT 'needs_manual_check', content_freshness_status TEXT NOT NULL DEFAULT 'needs_refresh_review', image_proof_status TEXT NOT NULL DEFAULT 'needs_approved_images', score INTEGER NOT NULL DEFAULT 0, next_best_action TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS maker_gallery_value_rows (maker_gallery_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT, gallery_key TEXT NOT NULL UNIQUE, gallery_label TEXT NOT NULL, proof_kind TEXT NOT NULL DEFAULT 'before_after_or_process', source_route TEXT, public_use_status TEXT NOT NULL DEFAULT 'needs_approved_media', consent_status TEXT NOT NULL DEFAULT 'needs_review', before_image_url TEXT, after_image_url TEXT, story_note TEXT, professional_value TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS customer_story_builder_rows (customer_story_builder_row_id INTEGER PRIMARY KEY AUTOINCREMENT, story_key TEXT NOT NULL UNIQUE, story_label TEXT NOT NULL, source_kind TEXT NOT NULL DEFAULT 'product_story_or_order', source_record_id INTEGER, consent_status TEXT NOT NULL DEFAULT 'needs_review', trust_block_status TEXT NOT NULL DEFAULT 'candidate', social_snippet_status TEXT NOT NULL DEFAULT 'draft_needed', public_page_target TEXT, story_summary TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS mobile_quick_product_add_checks (mobile_quick_product_add_check_id INTEGER PRIMARY KEY AUTOINCREMENT, check_key TEXT NOT NULL UNIQUE, check_label TEXT NOT NULL, mobile_status TEXT NOT NULL DEFAULT 'needs_live_test', desktop_status TEXT NOT NULL DEFAULT 'prepared', failure_recovery_status TEXT NOT NULL DEFAULT 'fallback_needed', autosave_status TEXT NOT NULL DEFAULT 'needs_review', image_role_prompt_status TEXT NOT NULL DEFAULT 'needs_review', route_path TEXT NOT NULL DEFAULT '/admin/mobile-product/', next_best_action TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS inventory_job_costing_value_rows (inventory_job_costing_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT, costing_key TEXT NOT NULL UNIQUE, costing_label TEXT NOT NULL, source_kind TEXT NOT NULL DEFAULT 'inventory_or_product', product_id INTEGER, inventory_item_id INTEGER, material_cost_cents INTEGER NOT NULL DEFAULT 0, labour_cost_cents INTEGER NOT NULL DEFAULT 0, packaging_cost_cents INTEGER NOT NULL DEFAULT 0, marketplace_fee_cents INTEGER NOT NULL DEFAULT 0, suggested_price_cents INTEGER NOT NULL DEFAULT 0, margin_status TEXT NOT NULL DEFAULT 'needs_review', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS unified_customer_member_history_rows (unified_customer_member_history_row_id INTEGER PRIMARY KEY AUTOINCREMENT, customer_key TEXT NOT NULL UNIQUE, customer_label TEXT, email_hash TEXT, order_count INTEGER NOT NULL DEFAULT 0, gift_card_count INTEGER NOT NULL DEFAULT 0, custom_request_count INTEGER NOT NULL DEFAULT 0, recall_match_count INTEGER NOT NULL DEFAULT 0, proof_approval_count INTEGER NOT NULL DEFAULT 0, latest_activity_at TEXT, history_status TEXT NOT NULL DEFAULT 'needs_unified_view', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS performance_budget_value_rows (performance_budget_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL UNIQUE, target_total_kb INTEGER NOT NULL DEFAULT 900, target_image_kb INTEGER NOT NULL DEFAULT 650, target_js_kb INTEGER NOT NULL DEFAULT 250, current_total_kb INTEGER NOT NULL DEFAULT 0, current_image_kb INTEGER NOT NULL DEFAULT 0, current_js_kb INTEGER NOT NULL DEFAULT 0, budget_status TEXT NOT NULL DEFAULT 'needs_measurement', low_bandwidth_status TEXT NOT NULL DEFAULT 'supported', reduced_motion_status TEXT NOT NULL DEFAULT 'supported', next_best_action TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`
  ];
  for (const statement of statements) await runSafe(db, statement);
}

async function seedRows(db) {
  const statements = [
    [`INSERT INTO admin_command_center_cards (card_key, card_label, card_area, priority_rank, primary_route, metric_label, action_label, action_route, notes) VALUES
      ('products_readiness','Product Readiness Scoreboard','products',1,'/admin/readiness/','blocked products','Open product readiness','/admin/readiness/','Image roles, alt text, price, story, shipping, inventory, marketplace status, and blockers.'),
      ('orders_today','Orders and Today Tasks','orders',2,'/admin/orders/','open work','Open orders','/admin/orders/','Daily order, custom request, and Today-task triage.'),
      ('local_seo_scorecard','Local SEO Scorecard','seo',3,'/admin/local-seo-review/','pages needing proof','Open local SEO','/admin/local-seo-review/','Search Console, GBP observations, manual ranking checks, content freshness, and image proof.'),
      ('visual_enrichment','Visual Enrichment and Maker Gallery','visuals',4,'/admin/visual-enrichment-studio/','visual candidates','Open visual studio','/admin/visual-enrichment-studio/','Approved workshop/process images, before/after proof, and reduced-motion-safe visual effects.'),
      ('customer_stories','Customer Story Builder','trust',5,'/admin/public-proof-candidates/','story candidates','Open proof candidates','/admin/public-proof-candidates/','Consented proof, product stories, trust blocks, and social snippets.'),
      ('mobile_quick_add','Mobile Quick Product Add','mobile',6,'/admin/mobile-product/','mobile checks','Open phone capture','/admin/mobile-product/','Phone-first upload, autosave, image-role prompts, and failure recovery.'),
      ('inventory_costing','Inventory and Job Costing','accounting',7,'/admin/inventory-operations/','costing rows','Open inventory ops','/admin/inventory-operations/','Connect supplies/tools to pricing and marketplace profit previews.'),
      ('customer_history','Unified Customer/Member History','customers',8,'/admin/members/','history rows','Open members','/admin/members/','Orders, gift cards, recalls, custom requests, proof approvals, and notes.'),
      ('performance_budgets','Performance Budgets','performance',9,'/admin/visual-polish/','over-budget routes','Open visual polish','/admin/visual-polish/','Keep visual polish sharp without slowing public pages.'),
      ('deploy_safety','Deploy, Accounting, and Recall Safety','release',10,'/admin/go-live-execution/','live blockers','Open go-live execution','/admin/go-live-execution/','D1/R2/email/recall/export gates visible before changes go live.')
      ON CONFLICT(card_key) DO UPDATE SET card_label=excluded.card_label, card_area=excluded.card_area, priority_rank=excluded.priority_rank, primary_route=excluded.primary_route, metric_label=excluded.metric_label, action_label=excluded.action_label, action_route=excluded.action_route, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`],
    [`INSERT INTO conversion_funnel_scorecard_rows (funnel_step, step_label, step_order, dropoff_note, notes) VALUES
      ('landing_page_view','Landing page view',1,'Start tracking local and collection landing traffic.','Privacy-safe analytics/import row.'),
      ('product_view','Product view',2,'Compare product views against landing traffic.','Use product detail views once live analytics are available.'),
      ('add_to_cart','Add to cart',3,'Shows whether product pages are convincing.','Track cart button events without personal data.'),
      ('checkout_start','Checkout start',4,'Shows checkout intent and possible payment friction.','Pair with payment provider checks.'),
      ('order_complete','Order complete',5,'Shows real conversion and revenue.','Tie to order table when available.')
      ON CONFLICT(funnel_step) DO UPDATE SET step_label=excluded.step_label, step_order=excluded.step_order, dropoff_note=excluded.dropoff_note, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`],
    [`INSERT INTO local_seo_value_scorecard_rows (page_path, target_phrase, next_best_action, notes) VALUES
      ('/','Devil n Dove handmade gifts Southern Ontario','Add fresh proof images and internal links to best handmade/vintage/custom pages.','Homepage should stay clear and locally relevant.'),
      ('/custom-gifts-southern-ontario/','custom gifts Southern Ontario','Add approved workshop proof and request-intake calls to action.','High-value local custom order page.'),
      ('/handmade-jewelry-ontario/','handmade jewelry Ontario','Add sharper close-up photos, product proof, and links to matching shop categories.','Jewelry page needs visual trust.'),
      ('/laser-engraving-ontario/','laser engraving Ontario','Add material examples and custom request pathway.','Strong local service phrase.'),
      ('/custom-candle-making-ontario/','custom candles Ontario','Add scent/colour proof with safety wording and batch notes.','Avoid medical claims.'),
      ('/custom-soap-making-ontario/','custom soap Ontario','Add ingredient/allergen clarity and approved product photos.','Avoid medical claims.'),
      ('/vintage-finds-ontario/','vintage finds Ontario','Add real finds and provenance-style notes where known.','Separate vintage/collectible from handmade.'),
      ('/workshop-made-gifts-ontario/','workshop made gifts Ontario','Use this as a mixed-media maker umbrella page with process proof.','Good brand story page.')
      ON CONFLICT(page_path) DO UPDATE SET target_phrase=excluded.target_phrase, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`],
    [`INSERT INTO maker_gallery_value_rows (gallery_key, gallery_label, proof_kind, source_route, professional_value, story_note, notes) VALUES
      ('before_after_custom_gifts','Before/after custom gifts','before_after','/custom-gifts-southern-ontario/','Builds trust for custom work by showing transformation.','Use only approved public-use media.','Needs real approved photos.'),
      ('workshop_process','Workshop process proof','process','/workshop-made-gifts-ontario/','Shows handmade credibility without pretending every piece is perfect.','Good fit for therapy/workshop story.','Keep wording humble and honest.'),
      ('jewelry_macro_details','Jewelry macro detail gallery','detail','/handmade-jewelry-ontario/','Close-ups improve perceived quality when images are sharp.','Use honest descriptions of handmade imperfections.','Needs compression budget review.'),
      ('laser_examples','Laser engraving material examples','example_grid','/laser-engraving-ontario/','Helps customers choose material and request type.','Show limits and safety notes.','Good image-slot candidate.')
      ON CONFLICT(gallery_key) DO UPDATE SET gallery_label=excluded.gallery_label, proof_kind=excluded.proof_kind, source_route=excluded.source_route, professional_value=excluded.professional_value, story_note=excluded.story_note, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`],
    [`INSERT INTO customer_story_builder_rows (story_key, story_label, source_kind, public_page_target, story_summary, notes) VALUES
      ('product_story_to_social','Product story to social snippet','product_story_note','/shop/','Turn approved product stories into short trust notes and captions.','Requires consent/public-use review.'),
      ('custom_request_to_trust','Custom request to trust block','custom_request','/custom-gifts-southern-ontario/','Promote approved custom request proof into page-specific trust blocks.','Requires customer approval.'),
      ('maker_note_to_gallery','Maker note to gallery caption','maker_note','/gallery/','Convert workshop notes into honest gallery captions.','Good for process-based trust.'),
      ('review_to_local_page','Review to local page proof','customer_review','/','Map approved customer wording to the best local page.','Avoid overusing the same review everywhere.')
      ON CONFLICT(story_key) DO UPDATE SET story_label=excluded.story_label, source_kind=excluded.source_kind, public_page_target=excluded.public_page_target, story_summary=excluded.story_summary, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`],
    [`INSERT INTO mobile_quick_product_add_checks (check_key, check_label, next_best_action, notes) VALUES
      ('phone_image_upload_autosave','Phone image upload and autosave','Confirm drafts survive failed upload/network interruption.','High value for workshop phone capture.'),
      ('image_role_prompts','Image role prompts','Prompt for hero/detail/scale/context before publish review.','Reduces Product QA blockers.'),
      ('quick_price_story_fields','Quick price and story fields','Keep price, short story, material, and shipping fields easy to reach on phone.','Supports product readiness.'),
      ('offline_failure_recovery','Upload failure recovery','Show clear fallback message and preserve local draft text.','Important because upload failures are common.')
      ON CONFLICT(check_key) DO UPDATE SET check_label=excluded.check_label, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`],
    [`INSERT INTO inventory_job_costing_value_rows (costing_key, costing_label, source_kind, notes) VALUES
      ('materials_to_price','Material cost to product price','product','Connect supplies/tools to product margins before marketplace export.'),
      ('labour_packaging_margin','Labour and packaging margin preview','product','Keep pricing realistic without overcomplicating casual workshop products.'),
      ('marketplace_fee_preview','Marketplace fee preview','marketplace','Show expected Etsy/marketplace fee impact before export.'),
      ('tools_consumables_usage','Tools and consumables usage notes','inventory','Tie supplies/tools to repeat product types where helpful.')
      ON CONFLICT(costing_key) DO UPDATE SET costing_label=excluded.costing_label, source_kind=excluded.source_kind, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`],
    [`INSERT INTO unified_customer_member_history_rows (customer_key, customer_label, notes) VALUES
      ('customer_history_rollup_placeholder','Customer history rollup placeholder','Future rollup for orders, gift cards, custom requests, recalls, proof approvals, and notes.'),
      ('member_order_story_link','Member order/story link','Connect order history to approved story/proof rows.'),
      ('gift_card_customer_history','Gift card customer history','Show gift card sends, redemptions, and lockout notes inside customer/member views.'),
      ('recall_customer_history','Recall customer history','Show recall matches and notification status inside customer/member views.')
      ON CONFLICT(customer_key) DO UPDATE SET customer_label=excluded.customer_label, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`],
    [`INSERT INTO performance_budget_value_rows (route_path, target_total_kb, target_image_kb, target_js_kb, next_best_action, notes) VALUES
      ('/',900,650,250,'Measure homepage image weight after visual strip/image slots are approved.','Keep homepage polished but quick.'),
      ('/shop/',1100,800,300,'Review product-card thumbnails and lazy loading.','Shop can become image-heavy quickly.'),
      ('/shop/product/',1200,900,300,'Measure detail page galleries and thumbnail strips.','Product pages need sharp visuals but not oversized files.'),
      ('/gallery/',1400,1100,300,'Use approved thumbnails and low-bandwidth controls.','Gallery has the highest image risk.'),
      ('/custom-gifts-southern-ontario/',1000,750,250,'Keep process visuals compressed and reduced-motion safe.','Important landing page for conversion.')
      ON CONFLICT(route_path) DO UPDATE SET target_total_kb=excluded.target_total_kb, target_image_kb=excluded.target_image_kb, target_js_kb=excluded.target_js_kb, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`]
  ];
  for (const [statement] of statements) await runSafe(db, statement);
}

async function productSummary(db) {
  if (!(await tableExists(db, 'products'))) return { total_products: 0, blocked_products: 0, missing_price: 0, missing_featured_image: 0, missing_story: 0 };
  return safeFirst(db, `SELECT COUNT(*) AS total_products, SUM(CASE WHEN COALESCE(price_cents,0) <= 0 THEN 1 ELSE 0 END) AS missing_price, SUM(CASE WHEN COALESCE(featured_image_url,'') = '' THEN 1 ELSE 0 END) AS missing_featured_image, SUM(CASE WHEN LENGTH(TRIM(COALESCE(short_description,''))) < 40 THEN 1 ELSE 0 END) AS missing_story FROM products`, [], { total_products:0, missing_price:0, missing_featured_image:0, missing_story:0 });
}
async function simpleCount(db, tableName, where = '1=1') { return (await safeFirst(db, `SELECT COUNT(*) AS c FROM ${tableName} WHERE ${where}`, [], { c:0 })).c || 0; }
async function updateCardMetrics(db) {
  const p = await productSummary(db);
  const blocked = Number(p.missing_price || 0) + Number(p.missing_featured_image || 0) + Number(p.missing_story || 0);
  const orderCount = await (await tableExists(db, 'orders') ? simpleCount(db, 'orders', `LOWER(COALESCE(order_status,'')) NOT IN ('complete','completed','cancelled','refunded')`) : 0);
  const recallCount = await (await tableExists(db, 'candle_soap_batch_recalls') ? simpleCount(db, 'candle_soap_batch_recalls', `LOWER(COALESCE(recall_status,'')) NOT IN ('closed','resolved')`) : 0);
  const seoNeed = await simpleCount(db, 'local_seo_value_scorecard_rows', `LOWER(COALESCE(image_proof_status,'')) LIKE '%needs%' OR LOWER(COALESCE(content_freshness_status,'')) LIKE '%needs%'`);
  const visualNeed = await simpleCount(db, 'maker_gallery_value_rows', `LOWER(COALESCE(public_use_status,'')) LIKE '%needs%' OR LOWER(COALESCE(consent_status,'')) LIKE '%needs%'`);
  const perfNeed = await simpleCount(db, 'performance_budget_value_rows', `LOWER(COALESCE(budget_status,'')) NOT IN ('pass','within_budget')`);
  await runSafe(db, `UPDATE admin_command_center_cards SET metric_value=?, updated_at=CURRENT_TIMESTAMP WHERE card_key='products_readiness'`, [blocked]);
  await runSafe(db, `UPDATE admin_command_center_cards SET metric_value=?, updated_at=CURRENT_TIMESTAMP WHERE card_key='orders_today'`, [Number(orderCount || 0)]);
  await runSafe(db, `UPDATE admin_command_center_cards SET metric_value=?, updated_at=CURRENT_TIMESTAMP WHERE card_key='local_seo_scorecard'`, [Number(seoNeed || 0)]);
  await runSafe(db, `UPDATE admin_command_center_cards SET metric_value=?, updated_at=CURRENT_TIMESTAMP WHERE card_key='visual_enrichment'`, [Number(visualNeed || 0)]);
  await runSafe(db, `UPDATE admin_command_center_cards SET metric_value=?, updated_at=CURRENT_TIMESTAMP WHERE card_key='performance_budgets'`, [Number(perfNeed || 0)]);
  await runSafe(db, `UPDATE admin_command_center_cards SET metric_value=?, updated_at=CURRENT_TIMESTAMP WHERE card_key='deploy_safety'`, [Number(recallCount || 0)]);
  return { ...p, blocked_products: blocked, open_orders: Number(orderCount || 0), open_recalls: Number(recallCount || 0), seo_pages_needing_review: Number(seoNeed || 0), visual_items_needing_review: Number(visualNeed || 0), performance_items_over_budget: Number(perfNeed || 0) };
}
async function saveSnapshot(db, adminUser, summary) {
  await runSafe(db, `INSERT INTO admin_command_center_daily_snapshots (build_label, snapshot_status, total_products, blocked_products, open_orders, open_recalls, seo_pages_needing_review, visual_items_needing_review, performance_items_over_budget, summary_json, created_by_user_id, notes) VALUES ('Build 185','review',?,?,?,?,?,?,?,?,?,?,'Saved from Admin Command Center; live integrations still need deployed verification.')`, [Number(summary.total_products || 0), Number(summary.blocked_products || 0), Number(summary.open_orders || 0), Number(summary.open_recalls || 0), Number(summary.seo_pages_needing_review || 0), Number(summary.visual_items_needing_review || 0), Number(summary.performance_items_over_budget || 0), JSON.stringify(summary), Number(adminUser?.user_id || 0) || null]);
}
async function payload(db) {
  const summary = await updateCardMetrics(db);
  return {
    ok: true,
    build_label: BUILD_LABEL,
    summary,
    cards: await safeAll(db, `SELECT * FROM admin_command_center_cards ORDER BY priority_rank LIMIT 30`),
    readiness: await safeAll(db, `SELECT * FROM product_readiness_scoreboard_snapshots ORDER BY product_readiness_scoreboard_snapshot_id DESC LIMIT 20`),
    funnel: await safeAll(db, `SELECT * FROM conversion_funnel_scorecard_rows ORDER BY step_order LIMIT 20`),
    seo: await safeAll(db, `SELECT * FROM local_seo_value_scorecard_rows ORDER BY page_path LIMIT 40`),
    maker_gallery: await safeAll(db, `SELECT * FROM maker_gallery_value_rows ORDER BY maker_gallery_value_row_id LIMIT 40`),
    stories: await safeAll(db, `SELECT * FROM customer_story_builder_rows ORDER BY customer_story_builder_row_id LIMIT 40`),
    mobile: await safeAll(db, `SELECT * FROM mobile_quick_product_add_checks ORDER BY mobile_quick_product_add_check_id LIMIT 40`),
    costing: await safeAll(db, `SELECT * FROM inventory_job_costing_value_rows ORDER BY inventory_job_costing_value_row_id LIMIT 40`),
    customers: await safeAll(db, `SELECT * FROM unified_customer_member_history_rows ORDER BY unified_customer_member_history_row_id LIMIT 40`),
    performance: await safeAll(db, `SELECT * FROM performance_budget_value_rows ORDER BY route_path LIMIT 40`),
    snapshots: await safeAll(db, `SELECT * FROM admin_command_center_daily_snapshots ORDER BY admin_command_center_daily_snapshot_id DESC LIMIT 10`)
  };
}

export async function onRequestGet({ request, env }) {
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok:false, error:'D1 database binding is missing.' }, 500);
  await ensureTables(db);
  await seedRows(db);
  return json(await payload(db));
}

export async function onRequestPost({ request, env }) {
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok:false, error:'D1 database binding is missing.' }, 500);
  await ensureTables(db);
  await seedRows(db);
  let body = {};
  try { body = await request.json(); } catch {}
  const action = normalizeText(body.action || 'refresh');
  const summary = await updateCardMetrics(db);
  if (action === 'save_snapshot') await saveSnapshot(db, adminUser, summary);
  return json(await payload(db));
}
