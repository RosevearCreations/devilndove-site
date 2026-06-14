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
