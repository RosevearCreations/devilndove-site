// File: /functions/api/admin/command-center.js
// Brief description: Build 190 Command Center API with live counts, product readiness rollups, funnel rows, local SEO scorecard rows, visual proof queues, costing placeholders, customer history, and performance budgets.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 190';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function resultRows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function safeAll(db, sql, bindings = []) { try { return resultRows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function safeRun(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
async function tableExists(db, tableName) { const row = await safeFirst(db, `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`, [tableName], null); return !!row?.name; }
async function columnsFor(db, tableName) { try { return resultRows(await db.prepare(`PRAGMA table_info(${tableName})`).all()).map((row) => String(row.name || '')); } catch { return []; } }
function has(cols, name) { return cols.includes(name); }
function escLike(value) { return String(value || '').replace(/[%_]/g, (m) => `\\${m}`); }
function toPercent(value) { const n = Number(value || 0); return Number.isFinite(n) ? Math.max(0, Math.min(100, Number(n.toFixed(1)))) : 0; }

async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS schema_migration_ledger (schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT, migration_key TEXT NOT NULL UNIQUE, file_name TEXT NOT NULL, migration_label TEXT, applied_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
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
    `CREATE TABLE IF NOT EXISTS performance_budget_value_rows (performance_budget_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL UNIQUE, target_total_kb INTEGER NOT NULL DEFAULT 900, target_image_kb INTEGER NOT NULL DEFAULT 650, target_js_kb INTEGER NOT NULL DEFAULT 250, current_total_kb INTEGER NOT NULL DEFAULT 0, current_image_kb INTEGER NOT NULL DEFAULT 0, current_js_kb INTEGER NOT NULL DEFAULT 0, budget_status TEXT NOT NULL DEFAULT 'needs_measurement', low_bandwidth_status TEXT NOT NULL DEFAULT 'supported', reduced_motion_status TEXT NOT NULL DEFAULT 'supported', next_best_action TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS command_center_live_count_runs (command_center_live_count_run_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 189', run_status TEXT NOT NULL DEFAULT 'ok', total_products INTEGER NOT NULL DEFAULT 0, blocked_products INTEGER NOT NULL DEFAULT 0, open_orders INTEGER NOT NULL DEFAULT 0, checkout_starts INTEGER NOT NULL DEFAULT 0, orders_created INTEGER NOT NULL DEFAULT 0, seo_rows INTEGER NOT NULL DEFAULT 0, visual_rows INTEGER NOT NULL DEFAULT 0, performance_rows INTEGER NOT NULL DEFAULT 0, summary_json TEXT DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS mobile_product_autosave_recovery_snapshots (mobile_product_autosave_recovery_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT, snapshot_key TEXT NOT NULL UNIQUE, route_path TEXT NOT NULL DEFAULT '/admin/mobile-product/', draft_status TEXT NOT NULL DEFAULT 'browser_local_recovery', field_count INTEGER NOT NULL DEFAULT 0, image_count INTEGER NOT NULL DEFAULT 0, latest_saved_at TEXT, recovered_at TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS approved_visual_replacement_candidates (approved_visual_replacement_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL, placeholder_asset TEXT, desired_real_media TEXT, approval_status TEXT NOT NULL DEFAULT 'needs_real_approved_photo', consent_status TEXT NOT NULL DEFAULT 'needs_review', alt_text_suggestion TEXT, performance_note TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(route_path, placeholder_asset))`,
    `CREATE TABLE IF NOT EXISTS local_seo_observation_rows (local_seo_observation_row_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, observation_source TEXT NOT NULL DEFAULT 'manual', observation_label TEXT, clicks INTEGER NOT NULL DEFAULT 0, impressions INTEGER NOT NULL DEFAULT 0, average_position REAL NOT NULL DEFAULT 0, google_business_profile_note TEXT, observed_at TEXT DEFAULT CURRENT_TIMESTAMP, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS product_cost_margin_review_rows (product_cost_margin_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, product_label TEXT, material_cost_cents INTEGER NOT NULL DEFAULT 0, labour_cost_cents INTEGER NOT NULL DEFAULT 0, marketplace_fee_cents INTEGER NOT NULL DEFAULT 0, suggested_price_cents INTEGER NOT NULL DEFAULT 0, current_price_cents INTEGER NOT NULL DEFAULT 0, margin_status TEXT NOT NULL DEFAULT 'needs_review', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`
  ];
  for (const s of statements) await safeRun(db, s);
}

async function seedBaseline(db, userId = null) {
  const cards = [
    ['products_readiness','Product Readiness Scoreboard','products',1,'/admin/readiness/','blocked products','Open product readiness','/admin/readiness/','Live count now rolls up products, product images, product QA, price/story gaps, inventory hints, and marketplace blockers.'],
    ['orders_today','Orders and Today Tasks','orders',2,'/admin/orders/','open work','Open orders','/admin/orders/','Daily orders, custom requests, and Today-task triage.'],
    ['conversion_funnel','Conversion Funnel','analytics',3,'/admin/analytics/','drop-off rows','Open analytics','/admin/analytics/','Landing page → product view → add to cart → checkout → order.'],
    ['local_seo_scorecard','Local SEO Scorecard','seo',4,'/admin/local-seo-review/','pages needing proof','Open local SEO','/admin/local-seo-review/','Search Console imports, Google Business Profile notes, ranking checks, content freshness, and image proof.'],
    ['visual_enrichment','Visual Proof and Placeholder Replacement','visuals',5,'/admin/visual-enrichment-studio/','visual candidates','Open visuals','/admin/visual-enrichment-studio/','Replace SVG placeholders with approved real media without adding H1 drift.'],
    ['customer_stories','Customer Story Builder','trust',6,'/admin/public-proof-candidates/','story candidates','Open proof candidates','/admin/public-proof-candidates/','Consent proof, product stories, trust blocks, and social snippets.'],
    ['mobile_quick_add','Mobile Quick Product Add','mobile',7,'/admin/mobile-product/','mobile checks','Open phone capture','/admin/mobile-product/','Phone-first upload, autosave, image role prompts, and recovery from failures.'],
    ['inventory_costing','Inventory and Job Costing','accounting',8,'/admin/inventory-operations/','costing rows','Open inventory ops','/admin/inventory-operations/','Connect supplies/tools to pricing and marketplace profit previews.'],
    ['customer_history','Unified Customer/Member History','customers',9,'/admin/members/','history rows','Open members','/admin/members/','Orders, gift cards, recalls, custom requests, proof approvals, and notes.'],
    ['performance_budgets','Performance Budgets','performance',10,'/admin/visual-polish/','over-budget routes','Open visual polish','/admin/visual-polish/','Keep polished visuals from slowing pages down.'],
  ];
  for (const c of cards) {
    await safeRun(db, `INSERT INTO admin_command_center_cards (card_key,card_label,card_area,priority_rank,primary_route,metric_label,action_label,action_route,notes,created_by_user_id) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(card_key) DO UPDATE SET card_label=excluded.card_label,card_area=excluded.card_area,priority_rank=excluded.priority_rank,primary_route=excluded.primary_route,metric_label=excluded.metric_label,action_label=excluded.action_label,action_route=excluded.action_route,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP`, [...c, userId]);
  }
  const pages = [
    ['/', 'Devil n Dove handmade gifts Southern Ontario', 'Add approved real workshop media, improve internal links to shop/custom/local pages, and keep one clear H1.'],
    ['/custom-gifts-southern-ontario/', 'custom gifts Southern Ontario', 'Add real process photos, custom request call-to-action proof, and consented customer examples.'],
    ['/handmade-jewelry-ontario/', 'handmade jewelry Ontario', 'Replace placeholder macro with approved close-ups and link to matching jewelry products.'],
    ['/laser-engraving-ontario/', 'laser engraving Ontario', 'Add engraved material examples and request intake path.'],
    ['/custom-candle-making-ontario/', 'custom candles Ontario', 'Add scent/colour proof with safety wording and batch notes.'],
    ['/custom-soap-making-ontario/', 'custom soap Ontario', 'Add ingredient/allergen clarity and approved texture photos.'],
    ['/vintage-finds-ontario/', 'vintage finds Ontario', 'Add condition/provenance style image proof for finds.'],
    ['/workshop-made-gifts-ontario/', 'workshop made gifts Ontario', 'Use process proof and maker story blocks.'],
  ];
  for (const p of pages) await safeRun(db, `INSERT INTO local_seo_value_scorecard_rows (page_path,target_phrase,next_best_action,notes,created_by_user_id) VALUES (?,?,?,'Build 189 scorecard row; pair Google Search Console and GBP observations with real approved images.',?) ON CONFLICT(page_path) DO UPDATE SET target_phrase=excluded.target_phrase,next_best_action=excluded.next_best_action,updated_at=CURRENT_TIMESTAMP`, [...p, userId]);
  const placeholders = [
    ['/', '/assets/visual-placeholders/workshop-process.svg', 'Approved real shop/process hero photo', 'Southern Ontario handmade gift workshop process photo'],
    ['/shop/', '/assets/visual-placeholders/product-detail.svg', 'Approved product collection photo', 'Devil n Dove product collection preview'],
    ['/gallery/', '/assets/visual-placeholders/before-after.svg', 'Approved before/after maker proof', 'Before and after workshop proof image'],
    ['/custom-gifts-southern-ontario/', '/assets/visual-placeholders/before-after.svg', 'Approved custom gift process photo', 'Custom gift process proof in Southern Ontario'],
    ['/handmade-jewelry-ontario/', '/assets/visual-placeholders/jewelry-macro.svg', 'Approved jewelry macro detail', 'Handmade jewelry close-up detail'],
    ['/laser-engraving-ontario/', '/assets/visual-placeholders/engraving-proof.svg', 'Approved engraving example photo', 'Laser engraved material example'],
    ['/custom-candle-making-ontario/', '/assets/visual-placeholders/candle-colour.svg', 'Approved candle colour/scent photo', 'Custom candle colour and scent example'],
    ['/custom-soap-making-ontario/', '/assets/visual-placeholders/soap-texture.svg', 'Approved soap texture/ingredient photo', 'Custom soap texture and ingredient example'],
    ['/vintage-finds-ontario/', '/assets/visual-placeholders/vintage-condition.svg', 'Approved vintage condition photo', 'Vintage find condition detail'],
  ];
  for (const row of placeholders) await safeRun(db, `INSERT INTO approved_visual_replacement_candidates (route_path,placeholder_asset,desired_real_media,alt_text_suggestion,performance_note,created_by_user_id) VALUES (?,?,?,?, 'Compress before publishing; keep low-bandwidth mode and no extra H1.', ?) ON CONFLICT(route_path, placeholder_asset) DO UPDATE SET desired_real_media=excluded.desired_real_media,alt_text_suggestion=excluded.alt_text_suggestion,updated_at=CURRENT_TIMESTAMP`, [...row, userId]);
  const mobile = [
    ['phone_image_upload_autosave','Phone image upload and autosave','Confirm local browser recovery plus D1 draft save after failed upload/network interruption.'],
    ['image_role_prompts','Image role prompts','Prompt for hero/detail/scale/context before publish review.'],
    ['quick_price_story_fields','Quick price and story fields','Keep price, short story, material, and shipping fields easy to reach on phone.'],
    ['offline_failure_recovery','Upload failure recovery','Show clear fallback message and preserve local draft text.'],
  ];
  for (const row of mobile) await safeRun(db, `INSERT INTO mobile_quick_product_add_checks (check_key,check_label,next_best_action,notes,created_by_user_id) VALUES (?,?,?,'Build 189 mobile autosave/recovery should be live-reviewed on a phone.',?) ON CONFLICT(check_key) DO UPDATE SET check_label=excluded.check_label,next_best_action=excluded.next_best_action,updated_at=CURRENT_TIMESTAMP`, [...row, userId]);
  const perf = [
    ['/',900,650,250,'Measure homepage after real visual replacements.'],
    ['/shop/',1100,800,300,'Review product cards and lazy image loading.'],
    ['/shop/product/',1200,900,300,'Review main image, thumbnails, and product proof blocks.'],
    ['/gallery/',1400,1100,300,'Use approved thumbnails and low-bandwidth controls.'],
    ['/admin/command-center/',700,200,500,'Keep admin dashboard lightweight on phone.'],
  ];
  for (const row of perf) await safeRun(db, `INSERT INTO performance_budget_value_rows (route_path,target_total_kb,target_image_kb,target_js_kb,next_best_action,notes) VALUES (?,?,?,?,?,'Build 189 performance budget baseline.') ON CONFLICT(route_path) DO UPDATE SET target_total_kb=excluded.target_total_kb,target_image_kb=excluded.target_image_kb,target_js_kb=excluded.target_js_kb,next_best_action=excluded.next_best_action,updated_at=CURRENT_TIMESTAMP`, row);
}

async function computeLiveSummary(db) {
  const hasProducts = await tableExists(db, 'products');
  const products = hasProducts ? await safeAll(db, `SELECT product_id,name,slug,status,price_cents,featured_image_url,short_description,description,meta_title,meta_description,inventory_quantity FROM products ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 200`) : [];
  const hasProductImages = await tableExists(db, 'product_images');
  const imageCounts = new Map();
  const missingAlt = new Map();
  if (hasProductImages) {
    for (const row of await safeAll(db, `SELECT product_id, COUNT(*) AS image_count, SUM(CASE WHEN COALESCE(alt_text,'')='' THEN 1 ELSE 0 END) AS missing_alt FROM product_images GROUP BY product_id`)) {
      imageCounts.set(Number(row.product_id || 0), Number(row.image_count || 0));
      missingAlt.set(Number(row.product_id || 0), Number(row.missing_alt || 0));
    }
  }
  const readiness = products.slice(0, 40).map((p) => {
    const id = Number(p.product_id || 0);
    const imageCount = imageCounts.get(id) || (p.featured_image_url ? 1 : 0);
    const misses = {
      image: imageCount ? 0 : 1,
      alt: missingAlt.get(id) || 0,
      price: Number(p.price_cents || 0) > 0 ? 0 : 1,
      story: (String(p.short_description || p.description || '').trim().length >= 40) ? 0 : 1,
      shipping: 0,
      marketplace: String(p.status || '').toLowerCase() === 'archived' ? 1 : 0,
      inventory: Number(p.inventory_quantity || 0) < 0 ? 1 : 0
    };
    const blockerCount = Object.values(misses).reduce((a,b) => a + Number(b || 0), 0);
    const score = Math.max(0, 100 - blockerCount * 15 - Math.min(20, misses.alt * 5));
    const next = misses.image ? 'Add at least one approved product image.' : misses.alt ? 'Add descriptive alt text to product images.' : misses.price ? 'Set a product price.' : misses.story ? 'Add a short product story/description.' : 'Review for publish/marketplace export.';
    return { product_id:id, product_name:p.name || '', product_slug:p.slug || '', readiness_score:score, missing_image_roles:misses.image, missing_alt_text:misses.alt, missing_price:misses.price, missing_story:misses.story, missing_shipping:misses.shipping, marketplace_blockers:misses.marketplace, inventory_blockers:misses.inventory, readiness_status:blockerCount ? 'needs_review' : 'ready', recommended_next_action:next };
  });
  const totalProducts = products.length;
  const blockedProducts = readiness.filter((r) => r.readiness_status !== 'ready').length;
  const readyProducts = readiness.filter((r) => r.readiness_status === 'ready').length;
  const openOrders = await tableExists(db, 'orders') ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM orders WHERE lower(COALESCE(order_status,status,'')) NOT IN ('complete','completed','cancelled','canceled','refunded','paid')`, [], {total:0})).total || 0) : 0;
  const openRecalls = await tableExists(db, 'candle_soap_batch_recalls') ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM candle_soap_batch_recalls WHERE lower(COALESCE(recall_status,'')) NOT IN ('closed','resolved','cancelled')`, [], {total:0})).total || 0) : 0;
  const seoRows = await tableExists(db, 'local_seo_value_scorecard_rows') ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM local_seo_value_scorecard_rows WHERE score < 80 OR search_console_status LIKE 'needs_%' OR image_proof_status LIKE 'needs_%'`, [], {total:0})).total || 0) : 0;
  const visualRows = await tableExists(db, 'approved_visual_replacement_candidates') ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM approved_visual_replacement_candidates WHERE approval_status <> 'approved_real_media'`, [], {total:0})).total || 0) : 0;
  const perfRows = await tableExists(db, 'performance_budget_value_rows') ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM performance_budget_value_rows WHERE budget_status IN ('over_budget','needs_measurement')`, [], {total:0})).total || 0) : 0;
  const marketplaceBlocked = await tableExists(db, 'marketplace_export_download_gates') ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM marketplace_export_download_gates WHERE lower(COALESCE(gate_status,'')) IN ('blocked','needs_review')`, [], {total:0})).total || 0) : 0;
  const cartStarts = await tableExists(db, 'cart_activity') ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM cart_activity WHERE event_type IN ('checkout_started','checkout_start')`, [], {total:0})).total || 0) : 0;
  const ordersCreated = await tableExists(db, 'orders') ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM orders`, [], {total:0})).total || 0) : 0;
  return { total_products: totalProducts, ready_products: readyProducts, blocked_products: blockedProducts, open_orders: openOrders, open_recalls: openRecalls, seo_pages_needing_review: seoRows, visual_items_needing_review: visualRows, marketplace_items_blocked: marketplaceBlocked, performance_items_over_budget: perfRows, checkout_starts: cartStarts, orders_created: ordersCreated, readiness };
}

async function updateCardMetrics(db, summary) {
  const metrics = {
    products_readiness: summary.blocked_products,
    orders_today: summary.open_orders,
    conversion_funnel: Math.max(0, summary.checkout_starts - summary.orders_created),
    local_seo_scorecard: summary.seo_pages_needing_review,
    visual_enrichment: summary.visual_items_needing_review,
    customer_stories: (await safeFirst(db, `SELECT COUNT(*) AS total FROM customer_story_builder_rows WHERE consent_status <> 'approved' OR trust_block_status <> 'placed'`, [], {total:0})).total || 0,
    mobile_quick_add: (await safeFirst(db, `SELECT COUNT(*) AS total FROM mobile_quick_product_add_checks WHERE autosave_status <> 'verified' OR failure_recovery_status <> 'verified'`, [], {total:0})).total || 0,
    inventory_costing: (await safeFirst(db, `SELECT COUNT(*) AS total FROM inventory_job_costing_value_rows WHERE margin_status <> 'ready'`, [], {total:0})).total || 0,
    customer_history: (await safeFirst(db, `SELECT COUNT(*) AS total FROM unified_customer_member_history_rows WHERE history_status <> 'ready'`, [], {total:0})).total || 0,
    performance_budgets: summary.performance_items_over_budget,
    deploy_safety: Math.max(0, summary.open_recalls + summary.marketplace_items_blocked)
  };
  for (const [key, value] of Object.entries(metrics)) await safeRun(db, `UPDATE admin_command_center_cards SET metric_value=?, updated_at=CURRENT_TIMESTAMP WHERE card_key=?`, [Number(value || 0), key]);
}

async function refreshFunnel(db) {
  const hasViews = await tableExists(db, 'site_page_views');
  const hasCart = await tableExists(db, 'cart_activity');
  const hasOrders = await tableExists(db, 'orders');
  const counts = {
    landing_page_view: hasViews ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM site_page_views WHERE event_type='page_view' AND (path='/' OR path LIKE '%ontario/%' OR path LIKE '%southern-ontario/%')`, [], {total:0})).total || 0) : 0,
    product_view: hasViews ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM site_page_views WHERE event_type IN ('product_view','product_detail_view') OR path LIKE '/shop/product/%' OR path LIKE '/shop/product/?%'`, [], {total:0})).total || 0) : 0,
    add_to_cart: hasCart ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM cart_activity WHERE event_type IN ('add_to_cart','cart_updated')`, [], {total:0})).total || 0) : 0,
    checkout_start: hasCart ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM cart_activity WHERE event_type IN ('checkout_started','checkout_start')`, [], {total:0})).total || 0) : 0,
    order_complete: hasOrders ? Number((await safeFirst(db, `SELECT COUNT(*) AS total FROM orders WHERE lower(COALESCE(order_status,status,'')) IN ('paid','complete','completed')`, [], {total:0})).total || 0) : 0
  };
  const labels = { landing_page_view:'Landing page view', product_view:'Product view', add_to_cart:'Add to cart', checkout_start:'Checkout start', order_complete:'Order complete' };
  let previous = 0; let order = 1;
  for (const key of ['landing_page_view','product_view','add_to_cart','checkout_start','order_complete']) {
    const count = Number(counts[key] || 0);
    const rate = previous > 0 ? toPercent((count / previous) * 100) : (order === 1 ? 100 : 0);
    const status = count > 0 ? 'tracked' : 'needs_tracking';
    await safeRun(db, `INSERT INTO conversion_funnel_scorecard_rows (funnel_step,step_label,step_order,source_kind,event_count,previous_step_count,conversion_rate_percent,review_status,dropoff_note,notes) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(funnel_step) DO UPDATE SET event_count=excluded.event_count,previous_step_count=excluded.previous_step_count,conversion_rate_percent=excluded.conversion_rate_percent,review_status=excluded.review_status,dropoff_note=excluded.dropoff_note,updated_at=CURRENT_TIMESTAMP`, [key, labels[key], order, 'live_analytics_rollup', count, previous, rate, status, count ? 'Live count connected into Command Center.' : 'No live events yet; keep tracking script deployed.', 'Build 190 live funnel rollup']);
    previous = count; order += 1;
  }
}

async function updateSeoScores(db) {
  if (!(await tableExists(db, 'local_seo_value_scorecard_rows'))) return;
  const rows = await safeAll(db, `SELECT * FROM local_seo_value_scorecard_rows LIMIT 200`);
  for (const row of rows) {
    const page = row.page_path || '/';
    const trend = await safeFirst(db, `SELECT SUM(clicks) AS clicks, SUM(impressions) AS impressions, AVG(average_position) AS average_position FROM local_seo_search_console_trends WHERE page_path=? OR page_path LIKE '%' || ? || '%'`, [page, page], { clicks:0, impressions:0, average_position:0 });
    const obs = await safeFirst(db, `SELECT google_business_profile_note FROM local_seo_observation_rows WHERE page_path=? ORDER BY observed_at DESC LIMIT 1`, [page], {});
    const impressions = Number(trend.impressions || 0);
    const clicks = Number(trend.clicks || 0);
    const position = Number(trend.average_position || 0);
    let score = 25;
    if (impressions > 0) score += 20;
    if (clicks > 0) score += 15;
    if (position > 0 && position <= 20) score += 15;
    if (String(obs.google_business_profile_note || '').trim()) score += 10;
    if (!String(row.image_proof_status || '').startsWith('needs_')) score += 10;
    const scStatus = impressions > 0 ? 'imported' : row.search_console_status || 'needs_import';
    const gbpStatus = String(obs.google_business_profile_note || '').trim() ? 'noted' : row.google_business_profile_status || 'manual_review';
    await safeRun(db, `UPDATE local_seo_value_scorecard_rows SET score=?, search_console_status=?, google_business_profile_status=?, updated_at=CURRENT_TIMESTAMP WHERE page_path=?`, [Math.min(100, score), scStatus, gbpStatus, page]);
  }
}

async function saveSnapshots(db, summary, adminUser = {}) {
  const userId = Number(adminUser?.user_id || 0) || null;
  await safeRun(db, `INSERT INTO admin_command_center_daily_snapshots (build_label,snapshot_status,total_products,ready_products,blocked_products,open_orders,open_recalls,seo_pages_needing_review,visual_items_needing_review,marketplace_items_blocked,performance_items_over_budget,summary_json,created_by_user_id,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'Build 190 daily snapshot with integrated value-ops companion panels.')`, [BUILD_LABEL, summary.blocked_products ? 'needs_review' : 'ready', summary.total_products, summary.ready_products, summary.blocked_products, summary.open_orders, summary.open_recalls, summary.seo_pages_needing_review, summary.visual_items_needing_review, summary.marketplace_items_blocked, summary.performance_items_over_budget, JSON.stringify(summary), userId]);
  await safeRun(db, `INSERT INTO command_center_live_count_runs (build_label,run_status,total_products,blocked_products,open_orders,checkout_starts,orders_created,seo_rows,visual_rows,performance_rows,summary_json,created_by_user_id,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'Live-count refresh saved from Command Center.')`, [BUILD_LABEL, 'ok', summary.total_products, summary.blocked_products, summary.open_orders, summary.checkout_starts, summary.orders_created, summary.seo_pages_needing_review, summary.visual_items_needing_review, summary.performance_items_over_budget, JSON.stringify(summary), userId]);
  for (const r of summary.readiness.slice(0, 50)) {
    await safeRun(db, `INSERT INTO product_readiness_scoreboard_snapshots (build_label,product_id,product_name,product_slug,readiness_score,missing_image_roles,missing_alt_text,missing_price,missing_story,missing_shipping,marketplace_blockers,inventory_blockers,readiness_status,recommended_next_action,created_by_user_id,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'Saved from Build 190 live Product Readiness rollup.')`, [BUILD_LABEL, r.product_id, r.product_name, r.product_slug, r.readiness_score, r.missing_image_roles, r.missing_alt_text, r.missing_price, r.missing_story, r.missing_shipping, r.marketplace_blockers, r.inventory_blockers, r.readiness_status, r.recommended_next_action, userId]);
  }
}

async function payload(db) {
  const summary = await computeLiveSummary(db);
  await refreshFunnel(db);
  await updateSeoScores(db);
  await updateCardMetrics(db, summary);
  return {
    ok:true,
    build_label: BUILD_LABEL,
    summary,
    cards: await safeAll(db, `SELECT * FROM admin_command_center_cards WHERE card_status <> 'archived' ORDER BY priority_rank, card_label LIMIT 30`),
    readiness: summary.readiness.length ? summary.readiness : await safeAll(db, `SELECT * FROM product_readiness_scoreboard_snapshots ORDER BY created_at DESC LIMIT 30`),
    funnel: await safeAll(db, `SELECT * FROM conversion_funnel_scorecard_rows ORDER BY step_order LIMIT 20`),
    seo: await safeAll(db, `SELECT * FROM local_seo_value_scorecard_rows ORDER BY score ASC, page_path LIMIT 50`),
    maker_gallery: await safeAll(db, `SELECT * FROM maker_gallery_value_rows ORDER BY gallery_label LIMIT 50`),
    stories: await safeAll(db, `SELECT * FROM customer_story_builder_rows ORDER BY story_label LIMIT 50`),
    mobile: await safeAll(db, `SELECT * FROM mobile_quick_product_add_checks ORDER BY check_label LIMIT 50`),
    costing: await safeAll(db, `SELECT * FROM inventory_job_costing_value_rows ORDER BY costing_label LIMIT 50`),
    customers: await safeAll(db, `SELECT * FROM unified_customer_member_history_rows ORDER BY latest_activity_at DESC, customer_label LIMIT 50`),
    performance: await safeAll(db, `SELECT * FROM performance_budget_value_rows ORDER BY budget_status DESC, route_path LIMIT 50`),
    visual_replacements: await safeAll(db, `SELECT * FROM approved_visual_replacement_candidates ORDER BY route_path, placeholder_asset LIMIT 80`),
    local_observations: await safeAll(db, `SELECT * FROM local_seo_observation_rows ORDER BY observed_at DESC LIMIT 50`),
    snapshots: await safeAll(db, `SELECT * FROM admin_command_center_daily_snapshots ORDER BY admin_command_center_daily_snapshot_id DESC LIMIT 10`),
    live_count_runs: await safeAll(db, `SELECT * FROM command_center_live_count_runs ORDER BY command_center_live_count_run_id DESC LIMIT 10`)
  };
}

export async function onRequestGet({ request, env }) {
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok:false, error:'D1 database binding is missing.' }, 500);
  await ensureTables(db);
  await seedBaseline(db, Number(adminUser.user_id || 0) || null);
  return json(await payload(db));
}

export async function onRequestPost({ request, env }) {
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok:false, error:'D1 database binding is missing.' }, 500);
  await ensureTables(db);
  await seedBaseline(db, Number(adminUser.user_id || 0) || null);
  let body = {}; try { body = await request.json(); } catch {}
  const action = normalizeText(body.action || 'refresh');
  let current = await computeLiveSummary(db);
  await refreshFunnel(db);
  await updateSeoScores(db);
  await updateCardMetrics(db, current);
  if (action === 'save_snapshot' || action === 'refresh') await saveSnapshots(db, current, adminUser);
  return json(await payload(db));
}
