-- Devil n Dove Build 184 — Sanity Check Snapshot, Value Roadmap, SEO Risk Review, and Desktop/Mobile Value Planning
-- Safe additive D1 migration. Run after database_build183_visual_enrichment_studio.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS application_sanity_snapshots (
  application_sanity_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 184',
  snapshot_status TEXT NOT NULL DEFAULT 'review',
  score INTEGER NOT NULL DEFAULT 0,
  public_page_count INTEGER NOT NULL DEFAULT 0,
  admin_page_count INTEGER NOT NULL DEFAULT 0,
  function_count INTEGER NOT NULL DEFAULT 0,
  schema_table_count INTEGER NOT NULL DEFAULT 0,
  h1_issue_count INTEGER NOT NULL DEFAULT 0,
  css_issue_count INTEGER NOT NULL DEFAULT 0,
  json_issue_count INTEGER NOT NULL DEFAULT 0,
  js_issue_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_application_sanity_snapshots_build ON application_sanity_snapshots(build_label, created_at);

CREATE TABLE IF NOT EXISTS application_module_status_rows (
  application_module_status_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_key TEXT NOT NULL UNIQUE,
  module_label TEXT NOT NULL,
  module_status TEXT NOT NULL DEFAULT 'stable_foundation',
  value_summary TEXT,
  remaining_risk TEXT,
  next_best_action TEXT,
  desktop_status TEXT NOT NULL DEFAULT 'needs_live_review',
  mobile_status TEXT NOT NULL DEFAULT 'needs_live_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS value_added_modification_candidates (
  value_added_modification_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_key TEXT NOT NULL UNIQUE,
  candidate_title TEXT NOT NULL,
  value_area TEXT NOT NULL DEFAULT 'operations',
  expected_value TEXT,
  effort_level TEXT NOT NULL DEFAULT 'medium',
  risk_level TEXT NOT NULL DEFAULT 'low',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  candidate_status TEXT NOT NULL DEFAULT 'recommended_next',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_value_added_candidates_priority ON value_added_modification_candidates(candidate_status, priority_rank);

CREATE TABLE IF NOT EXISTS seo_search_criteria_review_rows (
  seo_search_criteria_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  primary_phrase TEXT NOT NULL,
  supporting_phrases_json TEXT DEFAULT '[]',
  title_status TEXT NOT NULL DEFAULT 'needs_live_search_review',
  h1_status TEXT NOT NULL DEFAULT 'locked_one_h1',
  body_copy_status TEXT NOT NULL DEFAULT 'needs_refresh_review',
  image_alt_status TEXT NOT NULL DEFAULT 'needs_asset_review',
  local_relevance_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(page_path, primary_phrase)
);
CREATE INDEX IF NOT EXISTS idx_seo_search_criteria_review_page ON seo_search_criteria_review_rows(page_path, local_relevance_status);

CREATE TABLE IF NOT EXISTS desktop_mobile_value_checks (
  desktop_mobile_value_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  check_kind TEXT NOT NULL DEFAULT 'parity',
  desktop_value_status TEXT NOT NULL DEFAULT 'needs_live_review',
  mobile_value_status TEXT NOT NULL DEFAULT 'needs_live_review',
  issue_count INTEGER NOT NULL DEFAULT 0,
  recommended_fix TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(route_path, check_kind)
);

CREATE TABLE IF NOT EXISTS sanity_action_plan_rows (
  sanity_action_plan_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 184',
  action_rank INTEGER NOT NULL,
  action_title TEXT NOT NULL,
  action_status TEXT NOT NULL DEFAULT 'recommended_next',
  value_category TEXT NOT NULL DEFAULT 'value_added',
  owner_hint TEXT,
  depends_on TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(build_label, action_rank)
);

CREATE TABLE IF NOT EXISTS visual_value_enrichment_rows (
  visual_value_enrichment_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  enrichment_kind TEXT NOT NULL DEFAULT 'visual_effect_or_image',
  effect_status TEXT NOT NULL DEFAULT 'candidate',
  reduced_motion_safe INTEGER NOT NULL DEFAULT 1,
  h1_change_allowed INTEGER NOT NULL DEFAULT 0,
  professional_value TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(route_path, enrichment_kind)
);

INSERT INTO application_module_status_rows (module_key, module_label, module_status, value_summary, remaining_risk, next_best_action, desktop_status, mobile_status, notes)
VALUES
('storefront', 'Public storefront and product discovery', 'stable_foundation', 'Shop, product detail, collections, gallery, and local landing pages exist with one-H1 checks and LocalBusiness/Product/Breadcrumb structured-data work in progress.', 'Live product data quality, image role completeness, and conversion-path polish still need ongoing review.', 'Add conversion funnel measurement and product-card A/B review after live traffic begins.', 'prepared', 'prepared', 'Build 184 sanity seeded row.'),
('admin_ops', 'Admin operations and release controls', 'strong_but_large', 'Admin now has deployment preflight, release control, deploy readiness, promotion control, go-live execution, live ops, visual polish, and visual enrichment pages.', 'The admin surface is powerful but large; discoverability and role-based grouping should keep improving.', 'Add an Admin Command Center with saved views and common task shortcuts.', 'prepared', 'needs_phone_review', 'Build 184 sanity seeded row.'),
('data_schema', 'D1 schema and migration ledger', 'strong_guarded', 'Additive migrations are tracked from Build 173 through Build 184 with schema references and no destructive changes in this pass.', 'Repeated manual ALTER TABLE remains a risk if old migrations are rerun out of order.', 'Create a migration runner checklist page that shows applied/missing migrations before SQL is copied.', 'prepared', 'not_applicable', 'Build 184 sanity seeded row.'),
('seo_local', 'Local SEO and search criteria', 'good_foundation', 'Local service pages, title/meta checks, one-H1 validation, LocalBusiness JSON-LD, internal-link planning, and phrase history are present.', 'First-page local search still depends on real photos, GBP activity, reviews, backlinks, content freshness, and live ranking data.', 'Add monthly Local SEO scorecards with Search Console/GBP/manual ranking evidence.', 'prepared', 'prepared', 'Build 184 sanity seeded row.'),
('visual_brand', 'Visual polish and professional media', 'emerging_strength', 'Visual Polish and Visual Enrichment Studio prepare image slots, alt suggestions, media budgets, visual diffs, low-bandwidth mode, and seasonal campaign rows.', 'Actual approved images, screenshots, and live visual QA still need real uploads and review.', 'Add before/after gallery proof layouts and maker-process hero modules with reduced-motion-safe effects.', 'prepared', 'prepared', 'Build 184 sanity seeded row.'),
('accounting_recall', 'Accounting, gift card, recall, and compliance controls', 'guarded_foundation', 'Evidence bundles, gift-card send logs/history, recall approval gates, and release locks exist as guarded workflows.', 'Live R2/email/provider binding tests and legal/compliance language need final deployed verification.', 'Add a compliance review dashboard that groups accounting, recall, gift card, and privacy checks by risk.', 'prepared', 'needs_phone_review', 'Build 184 sanity seeded row.')
ON CONFLICT(module_key) DO UPDATE SET module_status=excluded.module_status, value_summary=excluded.value_summary, remaining_risk=excluded.remaining_risk, next_best_action=excluded.next_best_action, desktop_status=excluded.desktop_status, mobile_status=excluded.mobile_status, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO value_added_modification_candidates (candidate_key, candidate_title, value_area, expected_value, effort_level, risk_level, priority_rank, candidate_status, notes)
VALUES
('admin_command_center', 'Build one Admin Command Center with Today, Preflight, Visual, Product QA, Recall, and SEO cards', 'admin_usability', 'Reduces admin sprawl and makes daily use easier on desktop and phone.', 'medium', 'low', 1, 'recommended_next', 'Best next value step after many specialized admin pages.'),
('conversion_funnel_measurement', 'Add storefront conversion funnel tracking from landing page to product view to cart to checkout', 'sales', 'Shows which pages/products actually help sales and where customers drop off.', 'medium', 'medium', 2, 'recommended_next', 'Needs privacy-safe analytics rules.'),
('product_quality_scoreboard', 'Create a product readiness scoreboard with image roles, alt text, price, story, shipping, and marketplace status', 'product_ops', 'Makes publish readiness visible and actionable.', 'medium', 'low', 3, 'recommended_next', 'Build on Product QA rows already present.'),
('gbp_local_seo_scorecard', 'Add monthly Google Business Profile and Search Console scorecard import rows', 'local_seo', 'Moves local SEO from checklist to measured improvement.', 'medium', 'low', 4, 'recommended_next', 'Manual CSV import first, API later.'),
('visual_before_after_gallery', 'Add before/after and maker-process gallery templates', 'visual_brand', 'Adds professional proof and emotional value to handmade/custom work.', 'medium', 'low', 5, 'recommended_next', 'Use approved media only.'),
('customer_story_builder', 'Add customer story builder for consented custom orders and product proof', 'trust', 'Creates reusable trust blocks, product stories, and social snippets.', 'medium', 'low', 6, 'recommended_next', 'Must respect consent status.'),
('mobile_quick_add_product', 'Improve phone-first quick product add with image role prompts and autosave recovery', 'mobile_admin', 'Makes product entry easier from the workshop or phone.', 'medium', 'medium', 7, 'recommended_next', 'Focus on safety and drafts.'),
('inventory_job_costing', 'Connect tools/supplies inventory to product/job cost estimates', 'profitability', 'Shows material cost and pricing confidence.', 'high', 'medium', 8, 'recommended_next', 'Needs clean inventory ownership.'),
('customer_member_history', 'Unify customer/member order, gift card, recall, and custom request history', 'customer_ops', 'Improves customer service and repeat-sales targeting.', 'high', 'medium', 9, 'recommended_next', 'Keep privacy controls clear.'),
('public_performance_budget', 'Add page performance budgets for images, scripts, CSS, and low-bandwidth mode', 'performance', 'Keeps visual polish from slowing the site.', 'medium', 'low', 10, 'recommended_next', 'Pairs well with visual enrichment.'),
('structured_data_lab', 'Add structured-data lab with Product, LocalBusiness, Breadcrumb, FAQ, and Organization previews', 'seo_schema', 'Reduces schema errors and improves eligibility for rich search displays.', 'medium', 'low', 11, 'recommended_next', 'Use validator import rows.'),
('returns_and_policy_center', 'Add policy center for returns, custom work approvals, pickup, gift cards, and recalls', 'trust', 'Improves buyer confidence and reduces confusion.', 'medium', 'low', 12, 'recommended_next', 'Needs plain-language review.'),
('content_calendar', 'Create content calendar for seasonal campaigns, markets, product launches, and blog/social posts', 'marketing', 'Turns visual assets and SEO phrases into publishable content.', 'medium', 'low', 13, 'recommended_next', 'Start with manual calendar rows.'),
('abandoned_cart_followup', 'Add privacy-safe abandoned-cart and saved-cart follow-up planning', 'sales', 'Helps recover sales without being pushy.', 'medium', 'medium', 14, 'recommended_next', 'Requires email consent rules.'),
('maker_profile_pages', 'Add maker/process profile sections that explain therapy/workshop story without overcomplicating products', 'brand', 'Differentiates Devil n Dove from commodity gift shops.', 'low', 'low', 15, 'recommended_next', 'Keep wording concise and product-focused.'),
('error_recovery_center', 'Add visible error recovery center for failed API, upload, payment, and provider tasks', 'reliability', 'Makes fallback/error handling actionable.', 'medium', 'low', 16, 'recommended_next', 'Build on runtime incidents.'),
('marketplace_profit_preview', 'Add marketplace profit preview after fees, shipping, and materials', 'profitability', 'Prevents exports that look good but lose money.', 'medium', 'medium', 17, 'recommended_next', 'Requires accurate costs.'),
('photo_shot_list_mobile', 'Add mobile photo shot-list for product, trust proof, and local SEO images', 'visual_brand', 'Makes better imagery easier to capture consistently.', 'low', 'low', 18, 'recommended_next', 'Useful for workshop workflow.'),
('search_query_landing_refresh', 'Add periodic refresh queue for landing page titles, headings, alt text, and internal links', 'seo_local', 'Keeps local pages fresh without breaking one-H1 rules.', 'medium', 'low', 19, 'recommended_next', 'Use Search Console evidence when available.'),
('deployment_training_mode', 'Add training/simulation mode for deploy, rollback, recall, and gift-card provider actions', 'safety', 'Lets admin practice without touching live customers.', 'high', 'low', 20, 'recommended_next', 'Good safety feature before live scale.')
ON CONFLICT(candidate_key) DO UPDATE SET candidate_title=excluded.candidate_title, value_area=excluded.value_area, expected_value=excluded.expected_value, effort_level=excluded.effort_level, risk_level=excluded.risk_level, priority_rank=excluded.priority_rank, candidate_status=excluded.candidate_status, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO seo_search_criteria_review_rows (page_path, primary_phrase, supporting_phrases_json, notes)
VALUES
('/', 'handmade gifts Southern Ontario', '["Devil n Dove", "workshop made gifts", "custom handmade gifts"]', 'Homepage should keep clear brand + local gift wording without adding more than one H1.'),
('/shop/', 'handmade gifts Ontario shop', '["polymer clay earrings", "laser engraved gifts", "vintage finds"]', 'Shop page should connect product names, categories, alt text, and collection links.'),
('/custom-gifts-southern-ontario/', 'custom gifts Southern Ontario', '["personalized gifts", "custom order", "engraved gifts"]', 'High-value service page; add proof images and clear request path.'),
('/handmade-jewelry-ontario/', 'handmade jewelry Ontario', '["polymer clay earrings", "spoon rings", "wire wrapped jewelry"]', 'Needs strong product proof and internal links to matching categories.'),
('/laser-engraving-ontario/', 'laser engraving Ontario', '["custom engraved gifts", "personalized laser engraving", "workshop engraving"]', 'Good service target for local discovery; show materials and examples.'),
('/custom-candle-making-ontario/', 'custom candles Ontario', '["scented candles", "small batch candles", "custom candle gifts"]', 'Add safety, scent, and batch wording carefully.'),
('/custom-soap-making-ontario/', 'custom soap Ontario', '["small batch soap", "custom soap gifts", "Ontario handmade soap"]', 'Use ingredient/safety language and product proof photos.'),
('/vintage-finds-ontario/', 'vintage finds Ontario', '["collectibles", "vintage tools", "estate finds"]', 'Separate vintage from handmade so searchers and customers understand the difference.'),
('/workshop-made-gifts-ontario/', 'workshop made gifts Ontario', '["maker gifts", "CNC gifts", "3D printed gifts"]', 'Good umbrella page for the mixed-media workshop story.')
ON CONFLICT(page_path, primary_phrase) DO UPDATE SET supporting_phrases_json=excluded.supporting_phrases_json, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO desktop_mobile_value_checks (route_path, check_kind, recommended_fix, notes)
VALUES
('/admin/', 'daily_command_center', 'Group the many admin tools into role-based saved views and Today cards.', 'Large admin surface needs a calmer desktop/mobile home.'),
('/admin/visual-enrichment-studio/', 'phone_review', 'Keep cards short, add sticky action buttons, and preserve reduced-motion/low-bandwidth toggles.', 'Visual review must stay usable on phones.'),
('/shop/', 'conversion_path', 'Watch card size, thumbnail loading, quick-view clarity, and cart path on mobile.', 'Shop conversion depends on product-card clarity.'),
('/shop/product/', 'product_detail', 'Keep main image, thumbnails, price, story, shipping, and add-to-cart visible without scrolling too far.', 'Product pages should be visually sharp and easy to buy from.'),
('/custom-request/', 'custom_request_intake', 'Use step-by-step intake with autosave, image references, and fallback messages.', 'Custom request conversion depends on simple flow.'),
('/admin/go-live-execution/', 'release_safety', 'Keep blockers, gate states, smoke tests, and rollback links visible above the fold.', 'Go-live screen must be quick to understand.')
ON CONFLICT(route_path, check_kind) DO UPDATE SET recommended_fix=excluded.recommended_fix, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO visual_value_enrichment_rows (route_path, enrichment_kind, professional_value, notes)
VALUES
('/', 'subtle_story_strip', 'Adds polish to the homepage while keeping performance and accessibility safe.', 'Use approved images, no H1 changes, and reduced-motion-safe effects.'),
('/shop/', 'collection_badge_art', 'Makes product browsing feel more intentional and less plain.', 'Use compressed thumbnails and descriptive alt text.'),
('/gallery/', 'before_after_proof', 'Shows workshop progress and builds trust for custom orders.', 'Must tie to consent/public-use status.'),
('/custom-gifts-southern-ontario/', 'process_timeline_visual', 'Explains custom gift flow quickly and professionally.', 'Good candidate for icon strip plus real photos.'),
('/handmade-jewelry-ontario/', 'detail_macro_gallery', 'Improves perceived quality of jewelry and close-up work.', 'Needs sharp images and honest descriptions.'),
('/laser-engraving-ontario/', 'material_example_grid', 'Shows what can be engraved and helps buyers choose.', 'Keep material limitations clear.'),
('/custom-candle-making-ontario/', 'scent_colour_cards', 'Makes candle options more visual and giftable.', 'Avoid unsafe/medical claims.'),
('/custom-soap-making-ontario/', 'ingredient_visual_cards', 'Makes soap pages clearer and more professional.', 'Avoid medical claims and keep allergens clear.')
ON CONFLICT(route_path, enrichment_kind) DO UPDATE SET professional_value=excluded.professional_value, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO sanity_action_plan_rows (build_label, action_rank, action_title, value_category, owner_hint, depends_on, notes)
SELECT 'Build 184', priority_rank, candidate_title, value_area, 'Admin/owner review', 'Complete deployed sanity verification first.', expected_value
FROM value_added_modification_candidates
WHERE priority_rank BETWEEN 1 AND 20
ON CONFLICT(build_label, action_rank) DO UPDATE SET action_title=excluded.action_title, value_category=excluded.value_category, owner_hint=excluded.owner_hint, depends_on=excluded.depends_on, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_184_sanity_check_and_value_roadmap', 'database_build184_sanity_check_and_value_roadmap.sql', CURRENT_TIMESTAMP, 'Safe additive Build 184 sanity-check schema for application module status, value-added candidates, SEO criteria review, desktop/mobile value checks, visual enrichment rows, and action plan rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

-- Devil n Dove Build 185 — Admin Command Center and Value-Added Operating Dashboards
-- Safe additive D1 migration. Run after database_build184_sanity_check_and_value_roadmap.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS admin_command_center_daily_snapshots (
  admin_command_center_daily_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 185',
  snapshot_status TEXT NOT NULL DEFAULT 'review',
  total_products INTEGER NOT NULL DEFAULT 0,
  ready_products INTEGER NOT NULL DEFAULT 0,
  blocked_products INTEGER NOT NULL DEFAULT 0,
  open_orders INTEGER NOT NULL DEFAULT 0,
  open_recalls INTEGER NOT NULL DEFAULT 0,
  seo_pages_needing_review INTEGER NOT NULL DEFAULT 0,
  visual_items_needing_review INTEGER NOT NULL DEFAULT 0,
  marketplace_items_blocked INTEGER NOT NULL DEFAULT 0,
  performance_items_over_budget INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_command_center_snapshots_build ON admin_command_center_daily_snapshots(build_label, created_at);

CREATE TABLE IF NOT EXISTS admin_command_center_cards (
  admin_command_center_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_key TEXT NOT NULL UNIQUE,
  card_label TEXT NOT NULL,
  card_area TEXT NOT NULL DEFAULT 'daily_ops',
  card_status TEXT NOT NULL DEFAULT 'active',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  mobile_status TEXT NOT NULL DEFAULT 'prepared',
  primary_route TEXT,
  metric_label TEXT,
  metric_value INTEGER NOT NULL DEFAULT 0,
  action_label TEXT,
  action_route TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_command_center_cards_priority ON admin_command_center_cards(card_status, priority_rank);

CREATE TABLE IF NOT EXISTS product_readiness_scoreboard_snapshots (
  product_readiness_scoreboard_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 185',
  product_id INTEGER,
  product_name TEXT,
  product_slug TEXT,
  readiness_score INTEGER NOT NULL DEFAULT 0,
  missing_image_roles INTEGER NOT NULL DEFAULT 0,
  missing_alt_text INTEGER NOT NULL DEFAULT 0,
  missing_price INTEGER NOT NULL DEFAULT 0,
  missing_story INTEGER NOT NULL DEFAULT 0,
  missing_shipping INTEGER NOT NULL DEFAULT 0,
  marketplace_blockers INTEGER NOT NULL DEFAULT 0,
  inventory_blockers INTEGER NOT NULL DEFAULT 0,
  readiness_status TEXT NOT NULL DEFAULT 'needs_review',
  recommended_next_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_product_readiness_scoreboard_status ON product_readiness_scoreboard_snapshots(readiness_status, readiness_score);

CREATE TABLE IF NOT EXISTS conversion_funnel_scorecard_rows (
  conversion_funnel_scorecard_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  funnel_step TEXT NOT NULL UNIQUE,
  step_label TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 100,
  source_kind TEXT NOT NULL DEFAULT 'manual_or_analytics_import',
  event_count INTEGER NOT NULL DEFAULT 0,
  previous_step_count INTEGER NOT NULL DEFAULT 0,
  conversion_rate_percent REAL NOT NULL DEFAULT 0,
  dropoff_note TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_tracking',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_scorecard_order ON conversion_funnel_scorecard_rows(step_order, review_status);

CREATE TABLE IF NOT EXISTS local_seo_value_scorecard_rows (
  local_seo_value_scorecard_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  target_phrase TEXT NOT NULL,
  search_console_status TEXT NOT NULL DEFAULT 'needs_import',
  google_business_profile_status TEXT NOT NULL DEFAULT 'manual_review',
  ranking_check_status TEXT NOT NULL DEFAULT 'needs_manual_check',
  content_freshness_status TEXT NOT NULL DEFAULT 'needs_refresh_review',
  image_proof_status TEXT NOT NULL DEFAULT 'needs_approved_images',
  score INTEGER NOT NULL DEFAULT 0,
  next_best_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_seo_value_scorecard_score ON local_seo_value_scorecard_rows(score, page_path);

CREATE TABLE IF NOT EXISTS maker_gallery_value_rows (
  maker_gallery_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gallery_key TEXT NOT NULL UNIQUE,
  gallery_label TEXT NOT NULL,
  proof_kind TEXT NOT NULL DEFAULT 'before_after_or_process',
  source_route TEXT,
  public_use_status TEXT NOT NULL DEFAULT 'needs_approved_media',
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  before_image_url TEXT,
  after_image_url TEXT,
  story_note TEXT,
  professional_value TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS customer_story_builder_rows (
  customer_story_builder_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_key TEXT NOT NULL UNIQUE,
  story_label TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'product_story_or_order',
  source_record_id INTEGER,
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  trust_block_status TEXT NOT NULL DEFAULT 'candidate',
  social_snippet_status TEXT NOT NULL DEFAULT 'draft_needed',
  public_page_target TEXT,
  story_summary TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_quick_product_add_checks (
  mobile_quick_product_add_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_key TEXT NOT NULL UNIQUE,
  check_label TEXT NOT NULL,
  mobile_status TEXT NOT NULL DEFAULT 'needs_live_test',
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  failure_recovery_status TEXT NOT NULL DEFAULT 'fallback_needed',
  autosave_status TEXT NOT NULL DEFAULT 'needs_review',
  image_role_prompt_status TEXT NOT NULL DEFAULT 'needs_review',
  route_path TEXT NOT NULL DEFAULT '/admin/mobile-product/',
  next_best_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS inventory_job_costing_value_rows (
  inventory_job_costing_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  costing_key TEXT NOT NULL UNIQUE,
  costing_label TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'inventory_or_product',
  product_id INTEGER,
  inventory_item_id INTEGER,
  material_cost_cents INTEGER NOT NULL DEFAULT 0,
  labour_cost_cents INTEGER NOT NULL DEFAULT 0,
  packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
  marketplace_fee_cents INTEGER NOT NULL DEFAULT 0,
  suggested_price_cents INTEGER NOT NULL DEFAULT 0,
  margin_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS unified_customer_member_history_rows (
  unified_customer_member_history_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_key TEXT NOT NULL UNIQUE,
  customer_label TEXT,
  email_hash TEXT,
  order_count INTEGER NOT NULL DEFAULT 0,
  gift_card_count INTEGER NOT NULL DEFAULT 0,
  custom_request_count INTEGER NOT NULL DEFAULT 0,
  recall_match_count INTEGER NOT NULL DEFAULT 0,
  proof_approval_count INTEGER NOT NULL DEFAULT 0,
  latest_activity_at TEXT,
  history_status TEXT NOT NULL DEFAULT 'needs_unified_view',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS performance_budget_value_rows (
  performance_budget_value_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL UNIQUE,
  target_total_kb INTEGER NOT NULL DEFAULT 900,
  target_image_kb INTEGER NOT NULL DEFAULT 650,
  target_js_kb INTEGER NOT NULL DEFAULT 250,
  current_total_kb INTEGER NOT NULL DEFAULT 0,
  current_image_kb INTEGER NOT NULL DEFAULT 0,
  current_js_kb INTEGER NOT NULL DEFAULT 0,
  budget_status TEXT NOT NULL DEFAULT 'needs_measurement',
  low_bandwidth_status TEXT NOT NULL DEFAULT 'supported',
  reduced_motion_status TEXT NOT NULL DEFAULT 'supported',
  next_best_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_performance_budget_value_status ON performance_budget_value_rows(budget_status, route_path);

INSERT INTO admin_command_center_cards (card_key, card_label, card_area, priority_rank, primary_route, metric_label, action_label, action_route, notes)
VALUES
('products_readiness', 'Product Readiness Scoreboard', 'products', 1, '/admin/readiness/', 'blocked products', 'Open product readiness', '/admin/readiness/', 'Shows image roles, alt text, price, story, shipping, inventory, marketplace status, and blockers.'),
('orders_today', 'Orders and Today Tasks', 'orders', 2, '/admin/orders/', 'open work', 'Open orders', '/admin/orders/', 'Daily order, custom request, and Today-task triage.'),
('local_seo_scorecard', 'Local SEO Scorecard', 'seo', 3, '/admin/local-seo-review/', 'pages needing proof', 'Open local SEO', '/admin/local-seo-review/', 'Search Console, Google Business Profile observations, ranking checks, content freshness, and image proof.'),
('visual_enrichment', 'Visual Enrichment and Maker Gallery', 'visuals', 4, '/admin/visual-enrichment-studio/', 'visual candidates', 'Open visual studio', '/admin/visual-enrichment-studio/', 'Approved workshop/process images, before/after proof, and reduced-motion-safe visual effects.'),
('customer_stories', 'Customer Story Builder', 'trust', 5, '/admin/public-proof-candidates/', 'story candidates', 'Open proof candidates', '/admin/public-proof-candidates/', 'Consented proof, product stories, trust blocks, and social snippets.'),
('mobile_quick_add', 'Mobile Quick Product Add', 'mobile', 6, '/admin/mobile-product/', 'mobile checks', 'Open phone capture', '/admin/mobile-product/', 'Phone-first upload, autosave, image-role prompts, and recovery from failures.'),
('inventory_costing', 'Inventory and Job Costing', 'accounting', 7, '/admin/inventory-operations/', 'costing rows', 'Open inventory ops', '/admin/inventory-operations/', 'Connect supplies/tools to pricing and marketplace profit previews.'),
('customer_history', 'Unified Customer/Member History', 'customers', 8, '/admin/members/', 'history rows', 'Open members', '/admin/members/', 'Orders, gift cards, recalls, custom requests, proof approvals, and notes.'),
('performance_budgets', 'Performance Budgets', 'performance', 9, '/admin/visual-polish/', 'over-budget routes', 'Open visual polish', '/admin/visual-polish/', 'Keep sharp visuals without making public pages slow.'),
('deploy_safety', 'Deploy, Accounting, and Recall Safety', 'release', 10, '/admin/go-live-execution/', 'live blockers', 'Open go-live execution', '/admin/go-live-execution/', 'Keeps D1/R2/email/recall/export gates visible before changes go live.')
ON CONFLICT(card_key) DO UPDATE SET card_label=excluded.card_label, card_area=excluded.card_area, priority_rank=excluded.priority_rank, primary_route=excluded.primary_route, metric_label=excluded.metric_label, action_label=excluded.action_label, action_route=excluded.action_route, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO conversion_funnel_scorecard_rows (funnel_step, step_label, step_order, dropoff_note, notes)
VALUES
('landing_page_view', 'Landing page view', 1, 'Start tracking local and collection landing traffic.', 'Privacy-safe analytics/import row.'),
('product_view', 'Product view', 2, 'Compare product views against landing traffic.', 'Use product detail views once live analytics are available.'),
('add_to_cart', 'Add to cart', 3, 'Shows whether product pages are convincing.', 'Track cart button events without personal data.'),
('checkout_start', 'Checkout start', 4, 'Shows checkout intent and possible payment friction.', 'Pair with payment provider checks.'),
('order_complete', 'Order complete', 5, 'Shows real conversion and revenue.', 'Tie to order table when available.')
ON CONFLICT(funnel_step) DO UPDATE SET step_label=excluded.step_label, step_order=excluded.step_order, dropoff_note=excluded.dropoff_note, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO local_seo_value_scorecard_rows (page_path, target_phrase, next_best_action, notes)
VALUES
('/', 'Devil n Dove handmade gifts Southern Ontario', 'Add fresh proof images and internal links to best handmade/vintage/custom pages.', 'Homepage should stay clear and locally relevant.'),
('/custom-gifts-southern-ontario/', 'custom gifts Southern Ontario', 'Add approved workshop proof and request-intake calls to action.', 'High-value local custom order page.'),
('/handmade-jewelry-ontario/', 'handmade jewelry Ontario', 'Add sharper close-up photos, product proof, and links to matching shop categories.', 'Jewelry page needs visual trust.'),
('/laser-engraving-ontario/', 'laser engraving Ontario', 'Add material examples and custom request pathway.', 'Strong local service phrase.'),
('/custom-candle-making-ontario/', 'custom candles Ontario', 'Add scent/colour proof with safety wording and batch notes.', 'Avoid medical claims.'),
('/custom-soap-making-ontario/', 'custom soap Ontario', 'Add ingredient/allergen clarity and approved product photos.', 'Avoid medical claims.'),
('/vintage-finds-ontario/', 'vintage finds Ontario', 'Add real finds and provenance-style notes where known.', 'Separate vintage/collectible from handmade.'),
('/workshop-made-gifts-ontario/', 'workshop made gifts Ontario', 'Use this as a mixed-media maker umbrella page with process proof.', 'Good brand story page.')
ON CONFLICT(page_path) DO UPDATE SET target_phrase=excluded.target_phrase, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO maker_gallery_value_rows (gallery_key, gallery_label, proof_kind, source_route, professional_value, story_note, notes)
VALUES
('before_after_custom_gifts', 'Before/after custom gifts', 'before_after', '/custom-gifts-southern-ontario/', 'Builds trust for custom work by showing the transformation.', 'Use only approved public-use media.', 'Needs real approved photos.'),
('workshop_process', 'Workshop process proof', 'process', '/workshop-made-gifts-ontario/', 'Shows handmade credibility without pretending every piece is perfect.', 'Good fit for therapy/workshop story.', 'Keep wording humble and honest.'),
('jewelry_macro_details', 'Jewelry macro detail gallery', 'detail', '/handmade-jewelry-ontario/', 'Close-ups improve perceived quality when images are sharp.', 'Use honest descriptions of handmade imperfections.', 'Needs compression budget review.'),
('laser_examples', 'Laser engraving material examples', 'example_grid', '/laser-engraving-ontario/', 'Helps customers choose material and request type.', 'Show limits and safety notes.', 'Good candidate for image-slot assignments.')
ON CONFLICT(gallery_key) DO UPDATE SET gallery_label=excluded.gallery_label, proof_kind=excluded.proof_kind, source_route=excluded.source_route, professional_value=excluded.professional_value, story_note=excluded.story_note, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO customer_story_builder_rows (story_key, story_label, source_kind, public_page_target, story_summary, notes)
VALUES
('product_story_to_social', 'Product story to social snippet', 'product_story_note', '/shop/', 'Turn approved product stories into short trust notes and captions.', 'Requires consent/public-use review.'),
('custom_request_to_trust', 'Custom request to trust block', 'custom_request', '/custom-gifts-southern-ontario/', 'Promote approved custom request proof into page-specific trust blocks.', 'Requires customer approval.'),
('maker_note_to_gallery', 'Maker note to gallery caption', 'maker_note', '/gallery/', 'Convert workshop notes into honest gallery captions.', 'Good for process-based trust.'),
('review_to_local_page', 'Review to local page proof', 'customer_review', '/', 'Map approved customer wording to the best local page.', 'Avoid overusing the same review everywhere.')
ON CONFLICT(story_key) DO UPDATE SET story_label=excluded.story_label, source_kind=excluded.source_kind, public_page_target=excluded.public_page_target, story_summary=excluded.story_summary, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO mobile_quick_product_add_checks (check_key, check_label, next_best_action, notes)
VALUES
('phone_image_upload_autosave', 'Phone image upload and autosave', 'Confirm drafts survive failed upload/network interruption.', 'High value for workshop phone capture.'),
('image_role_prompts', 'Image role prompts', 'Prompt for hero/detail/scale/context before publish review.', 'Reduces Product QA blockers.'),
('quick_price_story_fields', 'Quick price and story fields', 'Keep price, short story, material, and shipping fields easy to reach on phone.', 'Supports product readiness.'),
('offline_failure_recovery', 'Upload failure recovery', 'Show clear fallback message and preserve local draft text.', 'Important because upload failures are common.')
ON CONFLICT(check_key) DO UPDATE SET check_label=excluded.check_label, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO inventory_job_costing_value_rows (costing_key, costing_label, source_kind, notes)
VALUES
('materials_to_price', 'Material cost to product price', 'product', 'Connect supplies/tools to product margins before marketplace export.'),
('labour_packaging_margin', 'Labour and packaging margin preview', 'product', 'Keep pricing realistic without overcomplicating casual workshop products.'),
('marketplace_fee_preview', 'Marketplace fee preview', 'marketplace', 'Show expected Etsy/marketplace fee impact before export.'),
('tools_consumables_usage', 'Tools and consumables usage notes', 'inventory', 'Tie supplies/tools to repeat product types where helpful.')
ON CONFLICT(costing_key) DO UPDATE SET costing_label=excluded.costing_label, source_kind=excluded.source_kind, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO unified_customer_member_history_rows (customer_key, customer_label, notes)
VALUES
('customer_history_rollup_placeholder', 'Customer history rollup placeholder', 'Future rollup for orders, gift cards, custom requests, recalls, proof approvals, and notes.'),
('member_order_story_link', 'Member order/story link', 'Connect order history to approved story/proof rows.'),
('gift_card_customer_history', 'Gift card customer history', 'Show gift card sends, redemptions, and lockout notes inside customer/member views.'),
('recall_customer_history', 'Recall customer history', 'Show recall matches and notification status inside customer/member views.')
ON CONFLICT(customer_key) DO UPDATE SET customer_label=excluded.customer_label, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO performance_budget_value_rows (route_path, target_total_kb, target_image_kb, target_js_kb, next_best_action, notes)
VALUES
('/', 900, 650, 250, 'Measure homepage image weight after visual strip/image slots are approved.', 'Keep homepage polished but quick.'),
('/shop/', 1100, 800, 300, 'Review product-card thumbnails and lazy loading.', 'Shop can become image-heavy quickly.'),
('/shop/product/', 1200, 900, 300, 'Measure detail page galleries and thumbnail strips.', 'Product pages need sharp visuals but not oversized files.'),
('/gallery/', 1400, 1100, 300, 'Use approved thumbnails and low-bandwidth controls.', 'Gallery has the highest image risk.'),
('/custom-gifts-southern-ontario/', 1000, 750, 250, 'Keep process visuals compressed and reduced-motion safe.', 'Important landing page for conversion.')
ON CONFLICT(route_path) DO UPDATE SET target_total_kb=excluded.target_total_kb, target_image_kb=excluded.target_image_kb, target_js_kb=excluded.target_js_kb, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_185_admin_command_center_value_dashboards', 'database_build185_admin_command_center_value_dashboards.sql', CURRENT_TIMESTAMP, 'Safe additive Build 185 schema for Admin Command Center, product readiness scoreboard snapshots, conversion funnel, local SEO scorecard, maker gallery, customer stories, mobile quick product add checks, inventory costing, unified customer history, and performance budgets.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

-- Build 186 append: Markdown consolidation and visual placeholders
-- Devil n Dove Build 186 — Markdown consolidation, value backlog execution, and visual placeholder enrichment
-- Safe additive D1 migration. Run after database_build185_admin_command_center_value_dashboards.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS markdown_consolidation_runs (
  markdown_consolidation_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 186',
  run_status TEXT NOT NULL DEFAULT 'prepared',
  canonical_file_count INTEGER NOT NULL DEFAULT 2,
  supporting_file_count INTEGER NOT NULL DEFAULT 0,
  retired_reference_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS markdown_file_status_rows (
  markdown_file_status_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  file_role TEXT NOT NULL DEFAULT 'supporting_reference',
  keep_active INTEGER NOT NULL DEFAULT 1,
  canonical_replacement TEXT,
  owner_note TEXT,
  last_review_build TEXT NOT NULL DEFAULT 'Build 186',
  review_status TEXT NOT NULL DEFAULT 'reviewed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_markdown_file_status_role ON markdown_file_status_rows(file_role, keep_active);

CREATE TABLE IF NOT EXISTS value_enhancement_execution_rows (
  value_enhancement_execution_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  enhancement_key TEXT NOT NULL UNIQUE,
  enhancement_label TEXT NOT NULL,
  business_value TEXT,
  app_surface TEXT,
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  mobile_status TEXT NOT NULL DEFAULT 'prepared',
  seo_status TEXT NOT NULL DEFAULT 'aligned',
  data_owner TEXT NOT NULL DEFAULT 'D1_or_static_json_under_review',
  implementation_status TEXT NOT NULL DEFAULT 'active_tracking',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  next_best_action TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_value_enhancement_execution_priority ON value_enhancement_execution_rows(priority_rank, implementation_status);

CREATE TABLE IF NOT EXISTS visual_graphic_placeholder_rows (
  visual_graphic_placeholder_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  placeholder_key TEXT NOT NULL UNIQUE,
  page_path TEXT NOT NULL,
  image_slot_label TEXT NOT NULL,
  placeholder_asset_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  desktop_status TEXT NOT NULL DEFAULT 'visible_placeholder',
  mobile_status TEXT NOT NULL DEFAULT 'visible_placeholder',
  replacement_status TEXT NOT NULL DEFAULT 'awaiting_approved_media',
  h1_change_allowed INTEGER NOT NULL DEFAULT 0,
  performance_budget_status TEXT NOT NULL DEFAULT 'lazy_loaded_svg',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_visual_placeholder_page ON visual_graphic_placeholder_rows(page_path, replacement_status);

CREATE TABLE IF NOT EXISTS desktop_mobile_surface_audit_rows (
  desktop_mobile_surface_audit_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  surface_key TEXT NOT NULL UNIQUE,
  route_path TEXT NOT NULL,
  surface_label TEXT NOT NULL,
  desktop_status TEXT NOT NULL DEFAULT 'prepared',
  mobile_status TEXT NOT NULL DEFAULT 'prepared',
  touch_target_status TEXT NOT NULL DEFAULT 'needs_live_device_check',
  overflow_status TEXT NOT NULL DEFAULT 'static_pass',
  fallback_status TEXT NOT NULL DEFAULT 'has_readable_fallback',
  next_best_action TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS css_drift_overlap_review_rows (
  css_drift_overlap_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_key TEXT NOT NULL UNIQUE,
  selector_or_area TEXT NOT NULL,
  review_kind TEXT NOT NULL DEFAULT 'css_drift',
  desktop_status TEXT NOT NULL DEFAULT 'static_pass',
  mobile_status TEXT NOT NULL DEFAULT 'static_pass',
  risk_level TEXT NOT NULL DEFAULT 'watch',
  recommended_fix TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS next_step_sanity_rows (
  next_step_sanity_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  step_key TEXT NOT NULL UNIQUE,
  step_label TEXT NOT NULL,
  step_group TEXT NOT NULL DEFAULT 'next_20',
  priority_rank INTEGER NOT NULL DEFAULT 100,
  expected_value TEXT,
  target_surface TEXT,
  current_status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO markdown_file_status_rows (file_path, file_role, keep_active, canonical_replacement, owner_note, review_status)
VALUES
('PROJECT_STATUS_AND_ROADMAP.md','primary_canonical',1,NULL,'Main human-readable project status, current value roadmap, SEO direction, and next 20 steps.','active'),
('AI_HANDOFF.md','primary_canonical',1,NULL,'Main new-chat handoff with D1 order, live checks, and where the app is heading.','active'),
('DEVELOPMENT_ROADMAP.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep detailed historical build trail but use the canonical project file first.','reviewed'),
('KNOWN_GAPS_AND_RISKS.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep as detailed risk log while the primary summary moves to canonical docs.','reviewed'),
('DATABASE_SCHEMA_REFERENCE.md','supporting_reference',1,'AI_HANDOFF.md','Keep schema details and D1 order, but summarize current order in AI handoff.','reviewed'),
('RELEASE_NOTES.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep chronological build notes.','reviewed'),
('SANITY_HEALTH_CHECK.md','supporting_reference',1,'AI_HANDOFF.md','Keep latest validation and post-deploy verification notes.','reviewed'),
('LOCAL_SEO_PLAYBOOK.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep detailed local SEO playbook.','reviewed'),
('IMAGES.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep visual/image workflow details.','reviewed'),
('NEW_CHAT_STATUS.md','handoff_reference',1,'AI_HANDOFF.md','Keep short compatibility handoff for old chats but prefer AI_HANDOFF.md.','reviewed'),
('AI_CONTEXT.md','handoff_reference',1,'AI_HANDOFF.md','Keep broad context but prefer AI_HANDOFF.md for the current build.','reviewed'),
('COMPETITIVE.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep competitor and market-direction notes.','reviewed'),
('README.md','supporting_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep repo overview and route notes.','reviewed'),
('REPO_BASE_GUIDE.md','supporting_reference',1,'AI_HANDOFF.md','Keep technical repository notes.','reviewed'),
('REPO_RULES.md','supporting_reference',1,'AI_HANDOFF.md','Keep working rules and guardrails.','reviewed'),
('AMAZON_MATCHING_NOTES.md','specialized_reference',1,'PROJECT_STATUS_AND_ROADMAP.md','Keep only for inventory/Amazon import matching.','reviewed')
ON CONFLICT(file_path) DO UPDATE SET file_role=excluded.file_role, keep_active=excluded.keep_active, canonical_replacement=excluded.canonical_replacement, owner_note=excluded.owner_note, last_review_build='Build 186', review_status=excluded.review_status, updated_at=CURRENT_TIMESTAMP;

INSERT INTO value_enhancement_execution_rows (enhancement_key, enhancement_label, business_value, app_surface, priority_rank, next_best_action, notes)
VALUES
('admin_command_center','Admin Command Center','Reduces admin overwhelm and makes daily work easier.','/admin/command-center/',1,'Add true live rollups from orders/products/SEO instead of mostly seeded rows.','Build 185 started this; Build 186 keeps it as primary daily entry.');
INSERT INTO value_enhancement_execution_rows (enhancement_key, enhancement_label, business_value, app_surface, priority_rank, next_best_action, notes) VALUES
('product_readiness_scoreboard','Product Readiness Scoreboard','Helps publish only complete, trustworthy products.','/admin/readiness/',2,'Add one-click safe fixes for approved low-risk blockers.',''),
('conversion_funnel_tracking','Conversion funnel tracking','Shows which pages and products turn visitors into orders.','/admin/command-center/',3,'Connect page view/cart/checkout/order analytics into funnel rows.',''),
('local_seo_scorecard','Local SEO scorecard','Keeps local discovery focused on relevance, distance, and prominence signals.','/admin/local-seo-review/',4,'Import Search Console and record manual Google Business Profile observations.',''),
('before_after_maker_gallery','Before/after maker gallery','Builds real workshop trust with process proof.','/admin/visual-enrichment-studio/',5,'Replace placeholders with approved before/after images and captions.',''),
('customer_story_builder','Customer story builder','Turns consented proof into product stories, trust blocks, and social snippets.','/admin/public-proof-candidates/',6,'Add story wizard that chooses page placement and social caption.',''),
('mobile_quick_product_add','Mobile quick product add','Captures products directly from the phone while work is fresh.','/admin/mobile-product/',7,'Add offline autosave and image role prompts.',''),
('inventory_job_costing','Inventory/job costing','Protects margins and makes marketplace pricing more realistic.','/admin/inventory-operations/',8,'Connect tool/supply cost rollups to product price suggestions.',''),
('unified_customer_history','Unified customer/member history','Shows orders, recalls, gift cards, stories, and proof approvals in one place.','/admin/members/',9,'Create customer timeline cards from existing tables.',''),
('performance_budgets','Performance budgets','Keeps visual polish sharp without slowing the site.','/admin/visual-polish/',10,'Measure route payloads after real image uploads.',''),
('markdown_consolidation','Markdown consolidation','Makes future AI/new-chat work safer and less confusing.','/admin/markdown-sanity/',11,'Use PROJECT_STATUS_AND_ROADMAP.md and AI_HANDOFF.md as the two main files.','')
ON CONFLICT(enhancement_key) DO UPDATE SET enhancement_label=excluded.enhancement_label, business_value=excluded.business_value, app_surface=excluded.app_surface, priority_rank=excluded.priority_rank, next_best_action=excluded.next_best_action, updated_at=CURRENT_TIMESTAMP;

INSERT INTO visual_graphic_placeholder_rows (placeholder_key, page_path, image_slot_label, placeholder_asset_url, alt_text, notes)
VALUES
('home_workshop_process','/','Workshop process hero support','/assets/visual-placeholders/workshop-process.svg','Placeholder for an approved Devil n Dove workshop process photo.','Homepage enrichment without changing the H1.'),
('shop_product_detail','/shop/','Product detail proof','/assets/visual-placeholders/product-detail.svg','Placeholder for approved product detail photography.','Shop enrichment and product trust.'),
('gallery_before_after','/gallery/','Before and after maker proof','/assets/visual-placeholders/before-after.svg','Placeholder for approved before and after workshop images.','Use only approved public-use media later.'),
('jewelry_macro','/handmade-jewelry-ontario/','Jewelry macro close-up','/assets/visual-placeholders/jewelry-macro.svg','Placeholder for approved handmade jewelry close-up image.','Supports handmade jewelry Ontario search intent.'),
('candle_colour','/custom-candle-making-ontario/','Candle colour and scent proof','/assets/visual-placeholders/candle-colour.svg','Placeholder for approved custom candle colour photo.','Supports custom candles Ontario page.'),
('soap_texture','/custom-soap-making-ontario/','Soap texture and ingredient clarity','/assets/visual-placeholders/soap-texture.svg','Placeholder for approved custom soap texture photo.','Avoid medical claims.'),
('engraving_proof','/laser-engraving-ontario/','Laser engraving material proof','/assets/visual-placeholders/engraving-proof.svg','Placeholder for approved laser engraving proof image.','Helps custom request confidence.'),
('vintage_condition','/vintage-finds-ontario/','Vintage condition proof','/assets/visual-placeholders/vintage-condition.svg','Placeholder for approved vintage condition detail image.','Keeps vintage separate from handmade.'),
('workshop_made_gifts','/workshop-made-gifts-ontario/','Workshop-made gifts process','/assets/visual-placeholders/workshop-process.svg','Placeholder for approved workshop-made gift process image.','Mixed-media gift umbrella page.')
ON CONFLICT(placeholder_key) DO UPDATE SET page_path=excluded.page_path, image_slot_label=excluded.image_slot_label, placeholder_asset_url=excluded.placeholder_asset_url, alt_text=excluded.alt_text, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO desktop_mobile_surface_audit_rows (surface_key, route_path, surface_label, next_best_action, notes)
VALUES
('public_home','/','Public homepage','Check hero/card spacing on phone and desktop after visual placeholder injection.','No extra H1 allowed.'),
('shop','/shop/','Shop landing page','Check placeholder and product grid spacing on phone.','Keep product cards readable.'),
('admin_command_center','/admin/command-center/','Admin Command Center','Keep as daily entry point and avoid another scattered page.','Mobile cards should stack.'),
('markdown_sanity','/admin/markdown-sanity/','Markdown Sanity','Use for doc cleanup and AI handoff clarity.','New Build 186 page.'),
('visual_enrichment','/admin/visual-enrichment-studio/','Visual Enrichment Studio','Keep media rows responsive and touch friendly.','Replace placeholders with approved media.')
ON CONFLICT(surface_key) DO UPDATE SET route_path=excluded.route_path, surface_label=excluded.surface_label, next_best_action=excluded.next_best_action, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO css_drift_overlap_review_rows (review_key, selector_or_area, review_kind, recommended_fix, notes)
VALUES
('visual_placeholder_grid','.visual-placeholder-gallery','responsive_grid','Use auto-fit cards on desktop and one-column flow on phone.','Build 186 CSS added.'),
('admin_table_overflow','.admin-table','overflow','Keep table-wrap around admin tables; never force wide tables on mobile.','Existing pattern reinforced.'),
('hero_visual_overlays','.hero::after and visual accents','motion_safety','Respect prefers-reduced-motion and low-bandwidth mode.','No required animation.'),
('nav_touch_targets','.nav a, .btn','mobile_tap_target','Keep min-height near 44px on small screens.','Build 182/183 rule retained.'),
('placeholder_images','.visual-placeholder-card img','image_budget','Use lazy-loaded SVG placeholders until approved compressed media exists.','Sharp placeholders, low byte cost.')
ON CONFLICT(review_key) DO UPDATE SET selector_or_area=excluded.selector_or_area, review_kind=excluded.review_kind, recommended_fix=excluded.recommended_fix, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO next_step_sanity_rows (step_key, step_label, step_group, priority_rank, expected_value, target_surface, notes)
VALUES
('live_rollups_command_center','Live rollups into Command Center','next_20',1,'Daily dashboard becomes truly operational.','/admin/command-center/','Connect products/orders/SEO/visuals/performance counts.'),
('product_readiness_apply_more','More safe Product QA applies','next_20',2,'Less manual catalog cleanup.','/admin/readiness/','Limit to low-risk fixes first.'),
('replace_visual_placeholders','Replace placeholders with approved media','next_20',3,'Public pages look sharper and more trustworthy.','/admin/visual-enrichment-studio/','Use consent/public-use checks.'),
('customer_story_wizard','Customer story wizard','next_20',4,'More trust blocks and social proof.','/admin/public-proof-candidates/','Consent required.'),
('mobile_product_autosave','Mobile product autosave','next_20',5,'Phone product capture becomes safer.','/admin/mobile-product/','Preserve drafts after network failures.'),
('conversion_event_pipeline','Conversion event pipeline','next_20',6,'Know which pages make sales.','/admin/analytics/','Landing → product → cart → checkout → order.'),
('local_seo_gbp_log','Google Business Profile observation log','next_20',7,'Track local prominence work.','/admin/local-seo-review/','Manual observations until API integration exists.'),
('customer_timeline_cards','Customer/member timeline cards','next_20',8,'Better service and recall visibility.','/admin/members/','Orders, gift cards, recalls, proof approvals.'),
('costing_margin_cards','Costing margin cards','next_20',9,'Protect profit on handmade/vintage listings.','/admin/inventory-operations/','Material/labour/fees/packaging.'),
('performance_measurement_import','Performance measurement import','next_20',10,'Prevent visual polish from becoming slow.','/admin/visual-polish/','Store route payload measurements.')
ON CONFLICT(step_key) DO UPDATE SET step_label=excluded.step_label, step_group=excluded.step_group, priority_rank=excluded.priority_rank, expected_value=excluded.expected_value, target_surface=excluded.target_surface, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO markdown_consolidation_runs (build_label, run_status, canonical_file_count, supporting_file_count, retired_reference_count, summary_json, notes)
VALUES ('Build 186','prepared',2,14,0,'{"canonical":["PROJECT_STATUS_AND_ROADMAP.md","AI_HANDOFF.md"],"approach":"Keep existing Markdown for compatibility, but make two files primary for future AI/new-chat handoff."}','Build 186 Markdown sanity pass. Existing files are not deleted; they are reclassified so future work starts from the two canonical files.');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_186_markdown_consolidation_visual_placeholders', 'database_build186_markdown_consolidation_visual_placeholders.sql', CURRENT_TIMESTAMP, 'Safe additive Build 186 schema for Markdown consolidation, value enhancement execution rows, visual graphic placeholders, desktop/mobile audits, CSS drift/overlap review, and next-step sanity rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;
