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


-- Included from database_build189_value_ops_live_counts.sql
-- Devil n Dove Build 189 — Value Ops Live Counts and Customer Funnel Controls
-- Safe additive D1 migration. Run after database_build186_markdown_consolidation_visual_placeholders.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS command_center_live_count_runs (
  command_center_live_count_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 189',
  run_status TEXT NOT NULL DEFAULT 'ok',
  total_products INTEGER NOT NULL DEFAULT 0,
  blocked_products INTEGER NOT NULL DEFAULT 0,
  open_orders INTEGER NOT NULL DEFAULT 0,
  checkout_starts INTEGER NOT NULL DEFAULT 0,
  orders_created INTEGER NOT NULL DEFAULT 0,
  seo_rows INTEGER NOT NULL DEFAULT 0,
  visual_rows INTEGER NOT NULL DEFAULT 0,
  performance_rows INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_command_center_live_runs_created ON command_center_live_count_runs(created_at DESC, run_status);

CREATE TABLE IF NOT EXISTS mobile_product_autosave_recovery_snapshots (
  mobile_product_autosave_recovery_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_key TEXT NOT NULL UNIQUE,
  route_path TEXT NOT NULL DEFAULT '/admin/mobile-product/',
  draft_status TEXT NOT NULL DEFAULT 'browser_local_recovery',
  field_count INTEGER NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  latest_saved_at TEXT,
  recovered_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobile_autosave_recovery_status ON mobile_product_autosave_recovery_snapshots(draft_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS approved_visual_replacement_candidates (
  approved_visual_replacement_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  placeholder_asset TEXT,
  desired_real_media TEXT,
  approval_status TEXT NOT NULL DEFAULT 'needs_real_approved_photo',
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  alt_text_suggestion TEXT,
  performance_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(route_path, placeholder_asset)
);
CREATE INDEX IF NOT EXISTS idx_visual_replacement_status ON approved_visual_replacement_candidates(approval_status, consent_status, route_path);

CREATE TABLE IF NOT EXISTS local_seo_observation_rows (
  local_seo_observation_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  observation_source TEXT NOT NULL DEFAULT 'manual',
  observation_label TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  average_position REAL NOT NULL DEFAULT 0,
  google_business_profile_note TEXT,
  observed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_seo_observations_page ON local_seo_observation_rows(page_path, observed_at DESC);

CREATE TABLE IF NOT EXISTS product_cost_margin_review_rows (
  product_cost_margin_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  product_label TEXT,
  material_cost_cents INTEGER NOT NULL DEFAULT 0,
  labour_cost_cents INTEGER NOT NULL DEFAULT 0,
  marketplace_fee_cents INTEGER NOT NULL DEFAULT 0,
  suggested_price_cents INTEGER NOT NULL DEFAULT 0,
  current_price_cents INTEGER NOT NULL DEFAULT 0,
  margin_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_product_cost_margin_status ON product_cost_margin_review_rows(margin_status, product_id);

INSERT INTO approved_visual_replacement_candidates (route_path, placeholder_asset, desired_real_media, alt_text_suggestion, performance_note)
VALUES
('/', '/assets/visual-placeholders/workshop-process.svg', 'Approved real shop/process hero photo', 'Southern Ontario handmade gift workshop process photo', 'Compress before publishing; keep one H1 and low-bandwidth mode.'),
('/shop/', '/assets/visual-placeholders/product-detail.svg', 'Approved product collection photo', 'Devil n Dove product collection preview', 'Compress before publishing; use lazy loading.'),
('/gallery/', '/assets/visual-placeholders/before-after.svg', 'Approved before/after maker proof', 'Before and after workshop proof image', 'Use thumbnail versions for gallery speed.'),
('/custom-gifts-southern-ontario/', '/assets/visual-placeholders/before-after.svg', 'Approved custom gift process photo', 'Custom gift process proof in Southern Ontario', 'Consent review required before public use.'),
('/handmade-jewelry-ontario/', '/assets/visual-placeholders/jewelry-macro.svg', 'Approved jewelry macro detail', 'Handmade jewelry close-up detail', 'Crop square or 4:5 for mobile cards.'),
('/laser-engraving-ontario/', '/assets/visual-placeholders/engraving-proof.svg', 'Approved engraving example photo', 'Laser engraved material example', 'Show material examples near request CTA.'),
('/custom-candle-making-ontario/', '/assets/visual-placeholders/candle-colour.svg', 'Approved candle colour/scent photo', 'Custom candle colour and scent example', 'Avoid medical/aromatherapy claims.'),
('/custom-soap-making-ontario/', '/assets/visual-placeholders/soap-texture.svg', 'Approved soap texture/ingredient photo', 'Custom soap texture and ingredient example', 'Avoid medical claims; include allergen clarity.'),
('/vintage-finds-ontario/', '/assets/visual-placeholders/vintage-condition.svg', 'Approved vintage condition photo', 'Vintage find condition detail', 'Show wear/condition honestly.')
ON CONFLICT(route_path, placeholder_asset) DO UPDATE SET desired_real_media=excluded.desired_real_media, alt_text_suggestion=excluded.alt_text_suggestion, performance_note=excluded.performance_note, updated_at=CURRENT_TIMESTAMP;

INSERT INTO local_seo_observation_rows (page_path, observation_source, observation_label, notes)
VALUES
('/', 'manual', 'GBP and Search Console observation placeholder', 'Add real Search Console clicks/impressions and Google Business Profile notes after deployment.'),
('/custom-gifts-southern-ontario/', 'manual', 'Custom gifts local ranking check', 'Record manual ranking checks and GBP observations here.'),
('/handmade-jewelry-ontario/', 'manual', 'Handmade jewelry local ranking check', 'Pair impressions/clicks with approved product proof images.'),
('/laser-engraving-ontario/', 'manual', 'Laser engraving local ranking check', 'Track relevant search phrases, not just generic traffic.')
;

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_189_value_ops_live_counts', 'database_build189_value_ops_live_counts.sql', CURRENT_TIMESTAMP, 'Adds live Command Center count run rows, mobile autosave recovery rows, approved visual replacement candidates, local SEO observation rows, and product margin review rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;



-- Appended Build 190 integrated value operations migration
-- Devil n Dove Build 190 — Integrated value operations, customer timelines, SEO/GBP actions, visual publication review, margin warnings, cart recovery review, seasonal planning, and Markdown retirement
-- Safe additive D1 migration. Run after database_build189_value_ops_live_counts.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS admin_command_center_saved_views (
  admin_command_center_saved_view_id INTEGER PRIMARY KEY AUTOINCREMENT,
  view_key TEXT NOT NULL UNIQUE,
  view_label TEXT NOT NULL,
  view_area TEXT NOT NULL DEFAULT 'owner',
  filter_json TEXT NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 0,
  view_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS search_console_opportunity_actions (
  search_console_opportunity_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  query_text TEXT,
  opportunity_kind TEXT NOT NULL DEFAULT 'title_meta_internal_link',
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  average_position REAL NOT NULL DEFAULT 0,
  action_status TEXT NOT NULL DEFAULT 'queued',
  proposed_title TEXT,
  proposed_meta_description TEXT,
  internal_link_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_search_console_opportunity_status ON search_console_opportunity_actions(action_status, page_path, created_at DESC);

CREATE TABLE IF NOT EXISTS google_business_profile_observations (
  google_business_profile_observation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  observation_month TEXT NOT NULL,
  profile_action TEXT,
  search_phrase TEXT,
  position_note TEXT,
  calls INTEGER NOT NULL DEFAULT 0,
  website_clicks INTEGER NOT NULL DEFAULT 0,
  direction_requests INTEGER NOT NULL DEFAULT 0,
  photo_views INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  observation_status TEXT NOT NULL DEFAULT 'manual_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(page_path, observation_month, search_phrase)
);
CREATE INDEX IF NOT EXISTS idx_gbp_observations_page_month ON google_business_profile_observations(page_path, observation_month DESC);

CREATE TABLE IF NOT EXISTS media_publication_review_queue (
  media_publication_review_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'placeholder_replacement',
  source_record_id INTEGER,
  media_url TEXT,
  placeholder_asset TEXT,
  desired_role TEXT,
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  public_use_status TEXT NOT NULL DEFAULT 'needs_approved_media',
  compression_status TEXT NOT NULL DEFAULT 'needs_measurement',
  alt_text_status TEXT NOT NULL DEFAULT 'needs_review',
  performance_status TEXT NOT NULL DEFAULT 'needs_measurement',
  review_status TEXT NOT NULL DEFAULT 'queued',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(route_path, placeholder_asset, desired_role)
);
CREATE INDEX IF NOT EXISTS idx_media_publication_review_status ON media_publication_review_queue(review_status, consent_status, public_use_status, route_path);

CREATE TABLE IF NOT EXISTS customer_timeline_events (
  customer_timeline_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_key TEXT NOT NULL,
  customer_email TEXT,
  customer_label TEXT,
  event_kind TEXT NOT NULL,
  source_table TEXT,
  source_record_id INTEGER,
  event_label TEXT,
  event_status TEXT,
  event_amount_cents INTEGER NOT NULL DEFAULT 0,
  event_at TEXT,
  event_json TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_key, event_kind, source_table, source_record_id)
);
CREATE INDEX IF NOT EXISTS idx_customer_timeline_key_date ON customer_timeline_events(customer_key, event_at DESC);

CREATE TABLE IF NOT EXISTS customer_story_approval_batches (
  customer_story_approval_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_kind TEXT NOT NULL,
  source_record_id INTEGER,
  customer_key TEXT,
  product_id INTEGER,
  order_id INTEGER,
  story_title TEXT,
  story_summary TEXT,
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  approval_status TEXT NOT NULL DEFAULT 'candidate',
  target_context TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(source_kind, source_record_id, target_context)
);
CREATE INDEX IF NOT EXISTS idx_customer_story_approval_status ON customer_story_approval_batches(approval_status, consent_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS product_margin_warning_rows (
  product_margin_warning_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE,
  product_label TEXT,
  current_price_cents INTEGER NOT NULL DEFAULT 0,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  estimated_marketplace_fee_cents INTEGER NOT NULL DEFAULT 0,
  estimated_margin_cents INTEGER NOT NULL DEFAULT 0,
  estimated_margin_percent REAL NOT NULL DEFAULT 0,
  warning_status TEXT NOT NULL DEFAULT 'needs_costs',
  marketplace_export_status TEXT NOT NULL DEFAULT 'review_required',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_product_margin_warning_status ON product_margin_warning_rows(warning_status, marketplace_export_status, product_id);

CREATE TABLE IF NOT EXISTS cart_recovery_review_rows (
  cart_recovery_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  checkout_recovery_lead_id INTEGER,
  customer_email TEXT,
  cart_value_cents INTEGER NOT NULL DEFAULT 0,
  recovery_status TEXT NOT NULL DEFAULT 'needs_review',
  contact_permission_status TEXT NOT NULL DEFAULT 'needs_review',
  suggested_action TEXT,
  gift_card_opportunity_status TEXT NOT NULL DEFAULT 'not_reviewed',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(checkout_recovery_lead_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_recovery_review_status ON cart_recovery_review_rows(recovery_status, contact_permission_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS seasonal_campaign_plans (
  seasonal_campaign_plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_key TEXT NOT NULL UNIQUE,
  campaign_label TEXT NOT NULL,
  campaign_kind TEXT NOT NULL DEFAULT 'gift_moment',
  target_start_date TEXT,
  target_end_date TEXT,
  target_locality TEXT DEFAULT 'Southern Ontario',
  product_focus TEXT,
  image_status TEXT NOT NULL DEFAULT 'needs_approved_media',
  seo_status TEXT NOT NULL DEFAULT 'needs_review',
  campaign_status TEXT NOT NULL DEFAULT 'planning',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS image_compression_report_rows (
  image_compression_report_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_path TEXT NOT NULL UNIQUE,
  original_bytes INTEGER NOT NULL DEFAULT 0,
  optimized_asset_path TEXT,
  optimized_bytes INTEGER NOT NULL DEFAULT 0,
  savings_percent REAL NOT NULL DEFAULT 0,
  public_usage_count INTEGER NOT NULL DEFAULT 0,
  compression_status TEXT NOT NULL DEFAULT 'needs_review',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_image_compression_status ON image_compression_report_rows(compression_status, original_bytes DESC);

CREATE TABLE IF NOT EXISTS markdown_retirement_registry (
  markdown_retirement_registry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  canonical_replacement TEXT,
  retirement_status TEXT NOT NULL DEFAULT 'supporting_reference',
  archived_path TEXT,
  retained_reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO admin_command_center_saved_views (view_key, view_label, view_area, filter_json, is_default, notes) VALUES
('owner_daily','Owner Daily','owner','{"days":30,"area":"all"}',1,'Products, orders, SEO, visuals, customers, and deploy risks.'),
('products','Product','products','{"days":30,"area":"products"}',0,'Readiness, low stock, missing media, and margin warnings.'),
('seo','SEO','seo','{"days":90,"area":"seo"}',0,'Search Console opportunities, GBP observations, and image proof.'),
('customers','Customers','customers','{"days":90,"area":"customers"}',0,'Timeline, cart recovery, stories, gift cards, and custom requests.'),
('visuals','Visuals','visuals','{"days":30,"area":"visuals"}',0,'Approved real media, compression, alt text, and performance budgets.'),
('accounting','Accounting','accounting','{"days":90,"area":"accounting"}',0,'Product cost/margin and evidence review.'),
('deploy','Deploy','deploy','{"days":30,"area":"deploy"}',0,'Preflight, environment health, smoke tests, and blockers.')
ON CONFLICT(view_key) DO UPDATE SET view_label=excluded.view_label, view_area=excluded.view_area, filter_json=excluded.filter_json, is_default=excluded.is_default, updated_at=CURRENT_TIMESTAMP, notes=excluded.notes;

INSERT INTO seasonal_campaign_plans (campaign_key,campaign_label,campaign_kind,target_start_date,target_end_date,target_locality,product_focus,notes) VALUES
('holiday_gifts','Holiday handmade gifts','holiday','2026-10-01','2026-12-20','Southern Ontario','Gift sets, jewelry, engraving, candles, soap, vintage finds','Review dates, approved media, inventory, pickup timing, and SEO before activation.'),
('mothers_day','Mother’s Day gift ideas','gift_moment','2027-03-15','2027-05-09','Ontario','Jewelry, custom gifts, candles, engraved keepsakes','Prepare real product images, gift timing, and local pickup details.'),
('local_market','Local market and pickup season','local_market','2026-06-01','2026-09-30','Southern Ontario','Pickup-ready gifts, small-batch pieces, workshop stories','Keep location wording natural and avoid implying a storefront if pickup is appointment-based.')
ON CONFLICT(campaign_key) DO UPDATE SET campaign_label=excluded.campaign_label,target_start_date=excluded.target_start_date,target_end_date=excluded.target_end_date,product_focus=excluded.product_focus,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO image_compression_report_rows (asset_path,original_bytes,optimized_asset_path,optimized_bytes,savings_percent,public_usage_count,compression_status,notes) VALUES
('assets/logo-full.png',5717185,NULL,0,0,0,'oversized_needs_optimization','Generated by scripts/build190_performance_report.py'),
('assets/banner-spicing-it-up.png',5537699,'assets/banner-spicing-it-up.webp',297984,94.6,0,'optimized_variant_ready','Generated by scripts/build190_performance_report.py'),
('assets/free-shipping.png',4323246,NULL,0,0,0,'oversized_needs_optimization','Generated by scripts/build190_performance_report.py'),
('assets/logo.png',3583441,NULL,0,0,0,'oversized_needs_optimization','Generated by scripts/build190_performance_report.py'),
('assets/hero-workshop.webp',715488,NULL,0,0,5,'review_size','Generated by scripts/build190_performance_report.py'),
('assets/logo-clear.png',687421,'assets/logo-clear-nav.webp',36714,94.7,86,'optimized_variant_ready','Generated by scripts/build190_performance_report.py'),
('assets/mainpage-collage.jpeg',599474,'assets/mainpage-collage.webp',198358,66.9,0,'optimized_variant_ready','Generated by scripts/build190_performance_report.py'),
('assets/mark.png',532773,'assets/mark-display.webp',22082,95.9,82,'optimized_variant_ready','Generated by scripts/build190_performance_report.py'),
('assets/banner-spicing-it-up.webp',297984,NULL,0,0,2,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/mainpage-collage.webp',198358,NULL,0,0,1,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/icons/icon-512.png',137582,NULL,0,0,1,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/logo-clear-nav.webp',36714,NULL,0,0,62,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/icons/icon-192.png',36263,NULL,0,0,1,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/icons/icon-180.png',32614,NULL,0,0,1,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/mark-display.webp',22082,NULL,0,0,0,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/vintage-condition.svg',1461,NULL,0,0,2,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/before-after.svg',1456,NULL,0,0,4,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/engraving-proof.svg',1455,NULL,0,0,2,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/workshop-process.svg',1455,NULL,0,0,2,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/jewelry-macro.svg',1453,NULL,0,0,2,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/product-detail.svg',1452,NULL,0,0,2,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/candle-colour.svg',1449,NULL,0,0,2,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/soap-texture.svg',1446,NULL,0,0,2,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/gift-card-art.svg',1375,NULL,0,0,0,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/gift-card-placeholder.svg',1375,NULL,0,0,1,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/product-process.svg',894,NULL,0,0,1,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/product-material.svg',857,NULL,0,0,1,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/product-scale.svg',809,NULL,0,0,1,'within_static_budget','Generated by scripts/build190_performance_report.py'),
('assets/visual-placeholders/product-care.svg',759,NULL,0,0,1,'within_static_budget','Generated by scripts/build190_performance_report.py')
ON CONFLICT(asset_path) DO UPDATE SET original_bytes=excluded.original_bytes,optimized_asset_path=excluded.optimized_asset_path,optimized_bytes=excluded.optimized_bytes,savings_percent=excluded.savings_percent,public_usage_count=excluded.public_usage_count,compression_status=excluded.compression_status,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO markdown_retirement_registry (file_path,canonical_replacement,retirement_status,archived_path,retained_reason,notes) VALUES
('PROJECT_STATUS_AND_ROADMAP.md','PROJECT_STATUS_AND_ROADMAP.md','canonical',NULL,'Primary human/business roadmap','Build 190 canonical file.'),
('AI_HANDOFF.md','AI_HANDOFF.md','canonical',NULL,'Primary new-chat and next-AI handoff','Build 190 canonical file.'),
('DEVELOPMENT_ROADMAP.md','PROJECT_STATUS_AND_ROADMAP.md','retired_to_stub','docs/archive/DEVELOPMENT_ROADMAP_HISTORY_THROUGH_BUILD189.md','Historical implementation log preserved in archive','Root file is now a concise pointer/current list.'),
('KNOWN_GAPS_AND_RISKS.md','PROJECT_STATUS_AND_ROADMAP.md','retired_to_stub','docs/archive/KNOWN_GAPS_AND_RISKS_HISTORY_THROUGH_BUILD189.md','Historical gap log preserved in archive','Root file is now a concise pointer/current risk list.'),
('AI_CONTEXT.md','AI_HANDOFF.md','retired_to_stub','docs/archive/AI_CONTEXT_HISTORY_THROUGH_BUILD189.md','Older AI context preserved','Use AI_HANDOFF.md first.'),
('NEW_CHAT_STATUS.md','AI_HANDOFF.md','retired_to_stub','docs/archive/NEW_CHAT_STATUS_HISTORY_THROUGH_BUILD189.md','Older chat status preserved','Use AI_HANDOFF.md first.'),
('COMPETITIVE.md','PROJECT_STATUS_AND_ROADMAP.md','supporting_reference',NULL,'Current competitive/SEO research remains useful','Keep as supporting research, not first-read handoff.')
ON CONFLICT(file_path) DO UPDATE SET canonical_replacement=excluded.canonical_replacement,retirement_status=excluded.retirement_status,archived_path=excluded.archived_path,retained_reason=excluded.retained_reason,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes) VALUES ('build_190_integrated_value_operations','database_build190_integrated_value_operations.sql',CURRENT_TIMESTAMP,'Adds saved Command Center views, filtered funnel support, Search Console/GBP actions, media publication review, customer timelines, customer-story approvals, product margin warnings, guarded cart recovery, seasonal planning, image compression reporting, and Markdown retirement registry.') ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;


-- =========================================================
-- BUILD 191 VALUE OPERATIONS FOLLOW-THROUGH
-- =========================================================

-- Devil n Dove Build 191 — Value Operations Follow-through
-- Safe additive D1 migration. Run after database_build190_integrated_value_operations.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_channel_fee_settings (
  marketplace_channel_fee_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_key TEXT NOT NULL UNIQUE,
  channel_label TEXT NOT NULL,
  percent_rate REAL NOT NULL DEFAULT 0,
  fixed_fee_cents INTEGER NOT NULL DEFAULT 0,
  payment_percent_rate REAL NOT NULL DEFAULT 0,
  payment_fixed_fee_cents INTEGER NOT NULL DEFAULT 0,
  advertising_percent_rate REAL NOT NULL DEFAULT 0,
  reserve_percent_rate REAL NOT NULL DEFAULT 0,
  calculation_status TEXT NOT NULL DEFAULT 'needs_configuration',
  effective_date TEXT,
  source_note TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_family_cost_defaults (
  product_family_cost_default_id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_key TEXT NOT NULL UNIQUE,
  family_label TEXT NOT NULL,
  material_cost_cents INTEGER NOT NULL DEFAULT 0,
  labour_minutes INTEGER NOT NULL DEFAULT 0,
  labour_rate_cents_per_hour INTEGER NOT NULL DEFAULT 0,
  packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
  overhead_percent REAL NOT NULL DEFAULT 0,
  waste_percent REAL NOT NULL DEFAULT 0,
  default_channel_key TEXT,
  calculation_status TEXT NOT NULL DEFAULT 'needs_configuration',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_margin_override_history (
  marketplace_margin_override_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  channel_key TEXT NOT NULL,
  margin_status TEXT NOT NULL DEFAULT 'blocked',
  requested_reason TEXT,
  requested_by_user_id INTEGER,
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  expires_at TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_marketplace_margin_override_product ON marketplace_margin_override_history(product_id, channel_key, approval_status, expires_at);

CREATE TABLE IF NOT EXISTS customer_timeline_admin_notes (
  customer_timeline_admin_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_key TEXT NOT NULL,
  customer_email TEXT,
  note_text TEXT NOT NULL,
  visibility_scope TEXT NOT NULL DEFAULT 'admin_private',
  note_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customer_timeline_notes_key ON customer_timeline_admin_notes(customer_key, created_at DESC);

CREATE TABLE IF NOT EXISTS customer_story_output_drafts (
  customer_story_output_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_story_approval_batch_id INTEGER,
  source_kind TEXT NOT NULL,
  source_record_id INTEGER,
  product_id INTEGER,
  customer_key TEXT,
  consent_evidence_url TEXT,
  product_story_title TEXT,
  product_story_body TEXT,
  trust_block_body TEXT,
  gallery_caption TEXT,
  social_snippet TEXT,
  output_status TEXT NOT NULL DEFAULT 'draft',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_customer_story_output_status ON customer_story_output_drafts(output_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS search_console_mapping_previews (
  search_console_mapping_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_file TEXT,
  detected_headers_json TEXT NOT NULL DEFAULT '[]',
  mapping_json TEXT NOT NULL DEFAULT '{}',
  sample_rows_json TEXT NOT NULL DEFAULT '[]',
  validation_status TEXT NOT NULL DEFAULT 'needs_review',
  validation_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gbp_monthly_task_reminders (
  gbp_monthly_task_reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_month TEXT NOT NULL,
  task_key TEXT NOT NULL,
  task_label TEXT NOT NULL,
  page_path TEXT,
  task_status TEXT NOT NULL DEFAULT 'open',
  completed_at TEXT,
  completed_by_user_id INTEGER,
  evidence_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_month, task_key, page_path)
);

CREATE TABLE IF NOT EXISTS review_request_eligibility_rows (
  review_request_eligibility_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  customer_email TEXT,
  order_status TEXT,
  payment_status TEXT,
  fulfilled_at TEXT,
  eligible_after TEXT,
  eligibility_status TEXT NOT NULL DEFAULT 'needs_review',
  permission_status TEXT NOT NULL DEFAULT 'needs_review',
  cooldown_status TEXT NOT NULL DEFAULT 'not_checked',
  exclusion_reason TEXT,
  last_review_request_at TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approved_before_after_gallery_items (
  approved_before_after_gallery_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gallery_key TEXT NOT NULL UNIQUE,
  gallery_label TEXT NOT NULL,
  proof_kind TEXT NOT NULL DEFAULT 'before_after',
  route_context TEXT NOT NULL DEFAULT '/gallery/',
  product_id INTEGER,
  custom_request_id INTEGER,
  before_image_url TEXT,
  after_image_url TEXT,
  process_image_url TEXT,
  alt_text TEXT,
  story_note TEXT,
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  public_use_status TEXT NOT NULL DEFAULT 'needs_review',
  approval_status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_before_after_public ON approved_before_after_gallery_items(approval_status, public_use_status, consent_status, sort_order);

CREATE TABLE IF NOT EXISTS product_image_role_requirements (
  product_image_role_requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_key TEXT NOT NULL,
  role_key TEXT NOT NULL,
  role_label TEXT NOT NULL,
  role_description TEXT,
  minimum_count INTEGER NOT NULL DEFAULT 0,
  is_publish_blocker INTEGER NOT NULL DEFAULT 0,
  phone_prompt TEXT,
  desktop_prompt TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_key, role_key)
);

CREATE TABLE IF NOT EXISTS mobile_product_server_drafts (
  mobile_product_server_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_key TEXT NOT NULL UNIQUE,
  user_id INTEGER,
  device_key TEXT,
  route_path TEXT NOT NULL DEFAULT '/admin/mobile-product/',
  payload_json TEXT NOT NULL DEFAULT '{}',
  field_count INTEGER NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  client_saved_at TEXT,
  server_saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
  recovered_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobile_server_drafts_user ON mobile_product_server_drafts(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS deployed_performance_measurements (
  deployed_performance_measurement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  measured_url TEXT,
  device_profile TEXT NOT NULL DEFAULT 'mobile',
  performance_score INTEGER,
  accessibility_score INTEGER,
  seo_score INTEGER,
  best_practices_score INTEGER,
  largest_contentful_paint_ms INTEGER,
  cumulative_layout_shift REAL,
  interaction_to_next_paint_ms INTEGER,
  total_transfer_bytes INTEGER,
  measurement_source TEXT NOT NULL DEFAULT 'manual_import',
  measured_at TEXT,
  imported_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_deployed_performance_route ON deployed_performance_measurements(route_path, device_profile, measured_at DESC);

CREATE TABLE IF NOT EXISTS responsive_image_publication_jobs (
  responsive_image_publication_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_image_url TEXT NOT NULL,
  source_record_kind TEXT,
  source_record_id INTEGER,
  route_context TEXT,
  target_widths_json TEXT NOT NULL DEFAULT '[480,768,1200,1600]',
  output_format TEXT NOT NULL DEFAULT 'webp',
  job_status TEXT NOT NULL DEFAULT 'queued',
  srcset_value TEXT,
  sizes_value TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_responsive_image_jobs_status ON responsive_image_publication_jobs(job_status, created_at DESC);

CREATE TABLE IF NOT EXISTS owner_daily_summary_exports (
  owner_daily_summary_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  summary_date TEXT NOT NULL,
  summary_json TEXT NOT NULL DEFAULT '{}',
  export_format TEXT NOT NULL DEFAULT 'json',
  export_status TEXT NOT NULL DEFAULT 'generated',
  generated_by_user_id INTEGER,
  generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_owner_daily_summary_date ON owner_daily_summary_exports(summary_date DESC, generated_at DESC);

CREATE TABLE IF NOT EXISTS campaign_readiness_check_rows (
  campaign_readiness_check_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_key TEXT NOT NULL,
  check_key TEXT NOT NULL,
  check_label TEXT NOT NULL,
  check_status TEXT NOT NULL DEFAULT 'needs_review',
  evidence_url TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(campaign_key, check_key)
);

CREATE TABLE IF NOT EXISTS local_page_freshness_rows (
  local_page_freshness_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  last_content_update_at TEXT,
  last_product_proof_at TEXT,
  last_customer_proof_at TEXT,
  last_gbp_observation_month TEXT,
  freshness_status TEXT NOT NULL DEFAULT 'needs_review',
  next_review_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS real_device_qa_evidence (
  real_device_qa_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  device_label TEXT NOT NULL,
  viewport_width INTEGER,
  viewport_height INTEGER,
  browser_label TEXT,
  theme_mode TEXT NOT NULL DEFAULT 'light',
  qa_status TEXT NOT NULL DEFAULT 'needs_review',
  screenshot_url TEXT,
  issue_summary TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_real_device_qa_route ON real_device_qa_evidence(route_path, qa_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS live_environment_verification_runs (
  live_environment_verification_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  verification_scope TEXT NOT NULL DEFAULT 'bindings_and_providers',
  d1_status TEXT NOT NULL DEFAULT 'unchecked',
  r2_status TEXT NOT NULL DEFAULT 'unchecked',
  stripe_status TEXT NOT NULL DEFAULT 'unchecked',
  stripe_webhook_status TEXT NOT NULL DEFAULT 'unchecked',
  email_provider_status TEXT NOT NULL DEFAULT 'unchecked',
  cloudflare_api_status TEXT NOT NULL DEFAULT 'unchecked',
  overall_status TEXT NOT NULL DEFAULT 'needs_review',
  verified_by_user_id INTEGER,
  verified_at TEXT DEFAULT CURRENT_TIMESTAMP,
  details_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT
);

INSERT INTO marketplace_channel_fee_settings (channel_key,channel_label,calculation_status,source_note,notes) VALUES
('onsite_stripe','Onsite Stripe','needs_configuration','Use the actual Stripe Canada pricing and account agreement.','Do not rely on an assumed percentage. Enter the current account-specific rate before using margin gates.'),
('etsy','Etsy','needs_configuration','Use current Etsy Canada listing, transaction, payment processing, ad, currency, tax, and regulatory fee details.','Fees can vary by country, ads, currency conversion, and account settings.'),
('facebook_meta','Facebook / Meta marketplace','needs_configuration','Use the active Meta commerce/marketplace terms for the selling method in use.','Manual local-sale and shipped-commerce fee structures can differ.'),
('paypal','PayPal','needs_configuration','Use the actual PayPal Canada merchant agreement and account rate.','Enter the current account-specific rate before enabling margin automation.'),
('manual_local','Manual local sale / pickup','needs_configuration','Enter actual cash/e-transfer/card processing assumptions.','Keep payment and packaging costs explicit.')
ON CONFLICT(channel_key) DO UPDATE SET channel_label=excluded.channel_label,source_note=excluded.source_note,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO product_family_cost_defaults (family_key,family_label,calculation_status,notes) VALUES
('jewelry','Jewelry','needs_configuration','Enter metal/findings, stones, labour, packaging, overhead, and expected scrap.'),
('engraving','Engraving','needs_configuration','Enter blank, masking, machine time, setup, finishing, packaging, and failed-piece allowance.'),
('candles','Candles','needs_configuration','Enter wax, vessel, wick, fragrance, dye, label, cure/storage, labour, and waste.'),
('soap','Soap','needs_configuration','Enter oils/base, fragrance, colour, additives, packaging, cure/storage, labour, and waste.'),
('vintage','Vintage / collectible','needs_configuration','Enter acquisition cost, cleaning, research, listing labour, packaging, and marketplace fees.'),
('mixed_media','Mixed media','needs_configuration','Enter materials, machine/hand labour, finishing, packaging, overhead, and waste.'),
('custom','Custom work','needs_configuration','Use quote-specific material, labour, setup, revisions, packaging, and contingency.')
ON CONFLICT(family_key) DO UPDATE SET family_label=excluded.family_label,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO product_image_role_requirements (family_key,role_key,role_label,role_description,minimum_count,is_publish_blocker,phone_prompt,desktop_prompt) VALUES
('all','hero','Hero image','Clear primary image showing the full item.',1,1,'Take one clear full-item photo first.','Select the strongest primary image.'),
('all','scale','Scale reference','Shows size in hand, beside a ruler, coin, or familiar object.',1,0,'Add one size/scale photo.','Add a measurement or scale reference.'),
('all','material','Material detail','Close-up of materials, texture, finish, or condition.',1,0,'Add one material close-up.','Add a material/texture detail.'),
('all','process','Process / workshop','Shows the honest making, restoration, or preparation process.',0,0,'Optional: add a process photo.','Add approved process proof where it helps trust.'),
('all','care','Care / use','Shows care, packaging, use, or handling instructions.',0,0,'Optional: add care/use photo.','Add care or use proof when relevant.'),
('vintage','condition','Condition detail','Shows wear, marks, maker marks, repairs, or age-related condition.',2,1,'Photograph every important condition detail.','Condition images are required for honest vintage listings.'),
('custom','before_after','Before / after','Shows customer-approved starting point and finished result.',0,0,'Add only with explicit public-use consent.','Link consent evidence before public placement.')
ON CONFLICT(family_key,role_key) DO UPDATE SET role_label=excluded.role_label,role_description=excluded.role_description,minimum_count=excluded.minimum_count,is_publish_blocker=excluded.is_publish_blocker,phone_prompt=excluded.phone_prompt,desktop_prompt=excluded.desktop_prompt,updated_at=CURRENT_TIMESTAMP;

INSERT INTO gbp_monthly_task_reminders (task_month,task_key,task_label,page_path,notes) VALUES
(strftime('%Y-%m','now'),'profile_accuracy','Review business hours, service area, categories, contact links, and appointment wording','/','Monthly manual review.'),
(strftime('%Y-%m','now'),'fresh_photos','Add or review approved recent product/workshop photos','/gallery/','Use real approved media; do not upload placeholders.'),
(strftime('%Y-%m','now'),'reviews','Review new customer reviews and responses','/reviews/','Respond honestly and avoid incentivized or fabricated reviews.'),
(strftime('%Y-%m','now'),'posts','Review whether a useful current product, event, or pickup update should be posted','/','Only publish accurate current information.'),
(strftime('%Y-%m','now'),'local_pages','Review local landing-page freshness and proof','/southern-ontario/','Keep wording useful and non-duplicative.')
ON CONFLICT(task_month,task_key,page_path) DO UPDATE SET task_label=excluded.task_label,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO campaign_readiness_check_rows (campaign_key,check_key,check_label,notes) VALUES
('holiday_gifts','inventory','Inventory and supply readiness','Confirm products and key supplies are available.'),
('holiday_gifts','approved_media','Approved real images','Use consented, compressed, mobile-reviewed images.'),
('holiday_gifts','seo','Titles, descriptions, internal links, and structured data','Keep visible copy and schema consistent.'),
('holiday_gifts','pickup_shipping','Pickup and shipping timing','State realistic order-by and pickup timing.'),
('holiday_gifts','social','Social drafts and source links','Use approved product/story sources.'),
('local_market','inventory','Market/pickup inventory','Confirm sale-ready quantities.'),
('local_market','approved_media','Local proof images','Use current real products and workshop proof.'),
('local_market','pickup_shipping','Pickup details','Use appointment/service-area wording accurately.')
ON CONFLICT(campaign_key,check_key) DO UPDATE SET check_label=excluded.check_label,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_191_value_operations_followthrough',
  'database_build191_value_operations_followthrough.sql',
  CURRENT_TIMESTAMP,
  'Adds configurable channel fees, family cost defaults, margin overrides, customer notes, story outputs, Search Console mapping previews, GBP reminders, review eligibility, approved before/after galleries, image-role prompts, D1 mobile drafts, deployed performance imports, responsive image jobs, owner summaries, campaign readiness, local freshness, real-device QA, and environment verification.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;



-- Devil n Dove Build 192 — Operational Data Connection and Live Proof Controls
-- Safe additive D1 migration. Run after database_build191_value_operations_followthrough.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS value_ops_next_snapshots (
  value_ops_next_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_label TEXT NOT NULL DEFAULT 'Build 192 follow-through',
  fee_configured_count INTEGER NOT NULL DEFAULT 0,
  fee_needs_review_count INTEGER NOT NULL DEFAULT 0,
  cost_configured_count INTEGER NOT NULL DEFAULT 0,
  cost_needs_review_count INTEGER NOT NULL DEFAULT 0,
  r2_derivative_open_count INTEGER NOT NULL DEFAULT 0,
  mobile_upload_open_count INTEGER NOT NULL DEFAULT 0,
  duplicate_candidate_count INTEGER NOT NULL DEFAULT 0,
  seo_schedule_open_count INTEGER NOT NULL DEFAULT 0,
  gbp_evidence_count INTEGER NOT NULL DEFAULT 0,
  performance_import_open_count INTEGER NOT NULL DEFAULT 0,
  legacy_admin_review_count INTEGER NOT NULL DEFAULT 0,
  snapshot_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS fee_cost_change_audit_rows (
  fee_cost_change_audit_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_kind TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  previous_json TEXT NOT NULL DEFAULT '{}',
  next_json TEXT NOT NULL DEFAULT '{}',
  change_reason TEXT,
  effective_date TEXT,
  changed_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fee_cost_audit_key ON fee_cost_change_audit_rows(setting_kind, setting_key, created_at DESC);

CREATE TABLE IF NOT EXISTS r2_derivative_worker_readiness_checks (
  r2_derivative_worker_readiness_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_key TEXT NOT NULL UNIQUE,
  check_label TEXT NOT NULL,
  check_status TEXT NOT NULL DEFAULT 'needs_review',
  expected_binding TEXT,
  route_path TEXT,
  evidence_url TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_resumable_upload_sessions (
  mobile_resumable_upload_session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_key TEXT NOT NULL UNIQUE,
  draft_key TEXT,
  user_id INTEGER,
  product_id INTEGER,
  device_key TEXT,
  file_name TEXT,
  mime_type TEXT,
  expected_bytes INTEGER NOT NULL DEFAULT 0,
  uploaded_bytes INTEGER NOT NULL DEFAULT 0,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  upload_status TEXT NOT NULL DEFAULT 'created',
  conflict_status TEXT NOT NULL DEFAULT 'not_checked',
  r2_object_key TEXT,
  client_started_at TEXT,
  last_client_sync_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobile_resumable_status ON mobile_resumable_upload_sessions(upload_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS mobile_draft_conflict_reviews (
  mobile_draft_conflict_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_key TEXT NOT NULL,
  local_version_at TEXT,
  server_version_at TEXT,
  conflict_status TEXT NOT NULL DEFAULT 'needs_review',
  chosen_resolution TEXT,
  resolved_by_user_id INTEGER,
  resolved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(draft_key, local_version_at, server_version_at)
);

CREATE TABLE IF NOT EXISTS approved_media_replacement_plan_rows (
  approved_media_replacement_plan_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  placeholder_asset_path TEXT,
  desired_media_role TEXT NOT NULL,
  approved_media_url TEXT,
  consent_status TEXT NOT NULL DEFAULT 'not_required',
  public_use_status TEXT NOT NULL DEFAULT 'needs_review',
  compression_status TEXT NOT NULL DEFAULT 'needs_review',
  alt_text_status TEXT NOT NULL DEFAULT 'needs_review',
  mobile_review_status TEXT NOT NULL DEFAULT 'needs_review',
  publication_status TEXT NOT NULL DEFAULT 'candidate',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(route_path, desired_media_role)
);
CREATE INDEX IF NOT EXISTS idx_media_replacement_status ON approved_media_replacement_plan_rows(publication_status, route_path);

CREATE TABLE IF NOT EXISTS search_console_import_schedules (
  search_console_import_schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_key TEXT NOT NULL UNIQUE,
  schedule_label TEXT NOT NULL,
  import_source TEXT NOT NULL DEFAULT 'manual_csv',
  expected_frequency TEXT NOT NULL DEFAULT 'monthly',
  target_report TEXT NOT NULL DEFAULT 'performance_pages_queries',
  last_import_at TEXT,
  next_due_at TEXT,
  schedule_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS google_business_profile_evidence_records (
  google_business_profile_evidence_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_month TEXT NOT NULL,
  evidence_key TEXT NOT NULL,
  evidence_label TEXT NOT NULL,
  page_path TEXT,
  evidence_url TEXT,
  observed_value TEXT,
  observation_status TEXT NOT NULL DEFAULT 'recorded',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(observation_month, evidence_key, page_path)
);

CREATE TABLE IF NOT EXISTS customer_duplicate_merge_candidates (
  customer_duplicate_merge_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_key TEXT NOT NULL UNIQUE,
  match_kind TEXT NOT NULL DEFAULT 'email',
  match_value TEXT NOT NULL,
  source_summary_json TEXT NOT NULL DEFAULT '{}',
  confidence_score INTEGER NOT NULL DEFAULT 0,
  merge_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_customer_duplicate_status ON customer_duplicate_merge_candidates(merge_status, confidence_score DESC);

CREATE TABLE IF NOT EXISTS provider_live_test_runs (
  provider_live_test_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_key TEXT NOT NULL,
  test_kind TEXT NOT NULL DEFAULT 'configuration_presence',
  test_status TEXT NOT NULL DEFAULT 'not_run',
  request_reference TEXT,
  response_summary TEXT,
  secret_value_exposed INTEGER NOT NULL DEFAULT 0,
  tested_by_user_id INTEGER,
  tested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_provider_live_tests ON provider_live_test_runs(provider_key, test_kind, tested_at DESC);

CREATE TABLE IF NOT EXISTS lighthouse_import_schedules (
  lighthouse_import_schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  device_profile TEXT NOT NULL DEFAULT 'mobile',
  expected_frequency TEXT NOT NULL DEFAULT 'monthly',
  last_import_at TEXT,
  next_due_at TEXT,
  schedule_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(route_path, device_profile)
);

CREATE TABLE IF NOT EXISTS legacy_admin_usage_rows (
  legacy_admin_usage_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL UNIQUE,
  route_label TEXT NOT NULL,
  command_center_area TEXT,
  last_used_at TEXT,
  usage_count_30d INTEGER NOT NULL DEFAULT 0,
  consolidation_status TEXT NOT NULL DEFAULT 'needs_usage_data',
  recommended_destination TEXT DEFAULT '/admin/command-center/',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS admin_consolidation_recommendations (
  admin_consolidation_recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL UNIQUE,
  recommendation_status TEXT NOT NULL DEFAULT 'needs_usage_data',
  recommended_action TEXT NOT NULL DEFAULT 'keep_until_usage_data_confirms',
  replacement_route TEXT DEFAULT '/admin/command-center/',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO r2_derivative_worker_readiness_checks (check_key,check_label,expected_binding,route_path,notes) VALUES
('binding_product_media_bucket','PRODUCT_MEDIA_BUCKET binding is present','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Required before real derivative generation.'),
('webp_generation','WebP derivative generation succeeds','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Create a tiny test object and confirm WebP output.'),
('avif_generation','AVIF derivative generation succeeds','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Optional but valuable for modern browsers.'),
('srcset_writeback','Generated srcset writes back to product/image records','DB','/admin/command-center/','Do not publish responsive markup until srcset has verified URLs.'),
('delete_cleanup','Derivative cleanup deletes test objects','PRODUCT_MEDIA_BUCKET','/api/image-derivative','Prevents abandoned test files in R2.')
ON CONFLICT(check_key) DO UPDATE SET check_label=excluded.check_label,expected_binding=excluded.expected_binding,route_path=excluded.route_path,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO search_console_import_schedules (schedule_key,schedule_label,import_source,expected_frequency,target_report,next_due_at,notes) VALUES
('monthly_pages_queries','Monthly Search Console pages + queries CSV','manual_csv','monthly','performance_pages_queries',date('now','+30 days'),'Export Search Console performance data and validate headers before import.'),
('weekly_top_pages','Weekly top pages opportunity review','manual_csv','weekly','top_pages',date('now','+7 days'),'Review pages with impressions but weak clicks/CTR.'),
('quarterly_image_search','Quarterly image-search opportunity review','manual_csv','quarterly','image_search',date('now','+90 days'),'Check product/visual pages for image discovery opportunities.')
ON CONFLICT(schedule_key) DO UPDATE SET schedule_label=excluded.schedule_label,next_due_at=excluded.next_due_at,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO lighthouse_import_schedules (route_path,device_profile,next_due_at,notes) VALUES
('/','mobile',date('now','+30 days'),'Import PageSpeed/Lighthouse mobile evidence after deploy.'),
('/','desktop',date('now','+30 days'),'Import PageSpeed/Lighthouse desktop evidence after deploy.'),
('/shop/','mobile',date('now','+30 days'),'Shop page must stay fast despite visuals.'),
('/shop/','desktop',date('now','+30 days'),'Desktop shop grid should avoid layout drift.'),
('/gallery/','mobile',date('now','+30 days'),'Gallery proof images need compression and stable layout.'),
('/admin/command-center/','desktop',date('now','+30 days'),'Admin dashboard should remain usable on desktop.')
ON CONFLICT(route_path,device_profile) DO UPDATE SET next_due_at=excluded.next_due_at,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO legacy_admin_usage_rows (route_path,route_label,command_center_area,recommended_destination,notes) VALUES
('/admin/readiness/','Product Readiness','products','/admin/command-center/','Keep until Command Center shows equal or better daily product readiness workflow.'),
('/admin/visual-polish/','Visual Polish','visuals','/admin/command-center/','Keep until real media replacement workflow is fully integrated.'),
('/admin/visual-enrichment-studio/','Visual Enrichment Studio','visuals','/admin/command-center/','Keep for detailed visual work; Command Center should summarize.'),
('/admin/live-ops-followthrough/','Live Ops Follow-through','deploy','/admin/command-center/','Keep until live verification cards move fully into Command Center.'),
('/admin/go-live-execution/','Go-Live Execution','deploy','/admin/command-center/','Keep for final release gates; summarize in Command Center.'),
('/admin/application-sanity/','Application Sanity','planning','/admin/command-center/','Keep as reference until usage data confirms it is not needed often.'),
('/admin/markdown-sanity/','Markdown Sanity','planning','/admin/command-center/','Keep for documentation reviews; avoid deleting until handoff is stable.')
ON CONFLICT(route_path) DO UPDATE SET route_label=excluded.route_label,command_center_area=excluded.command_center_area,recommended_destination=excluded.recommended_destination,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO admin_consolidation_recommendations (route_path,recommendation_status,recommended_action,replacement_route,notes) VALUES
('/admin/readiness/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/visual-polish/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/visual-enrichment-studio/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/live-ops-followthrough/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/go-live-execution/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/application-sanity/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.'),
('/admin/markdown-sanity/','needs_usage_data','keep_until_usage_data_confirms','/admin/command-center/','Do not delete until real usage data and replacement coverage are reviewed.')
ON CONFLICT(route_path) DO UPDATE SET recommendation_status=excluded.recommendation_status,recommended_action=excluded.recommended_action,replacement_route=excluded.replacement_route,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO approved_media_replacement_plan_rows (route_path,placeholder_asset_path,desired_media_role,notes,sort_order) VALUES
('/','/assets/visual-placeholders/workshop-process.svg','homepage_workshop_process','Replace with approved real workshop process photo.',10),
('/shop/','/assets/visual-placeholders/product-detail.svg','shop_product_detail','Replace with approved representative product photo.',20),
('/gallery/','/assets/visual-placeholders/before-after.svg','gallery_before_after','Replace with consented before/after proof.',30),
('/handmade-jewelry-ontario/','/assets/visual-placeholders/jewelry-macro.svg','jewelry_macro','Replace with approved jewelry macro photo.',40),
('/custom-candle-making-ontario/','/assets/visual-placeholders/candle-colour.svg','candle_colour','Replace with approved candle colour/process photo.',50),
('/custom-soap-making-ontario/','/assets/visual-placeholders/soap-texture.svg','soap_texture','Replace with approved soap texture/process photo.',60),
('/laser-engraving-ontario/','/assets/visual-placeholders/engraving-proof.svg','engraving_proof','Replace with approved engraving proof photo.',70),
('/vintage-finds-ontario/','/assets/visual-placeholders/vintage-condition.svg','vintage_condition','Replace with approved vintage condition photo.',80)
ON CONFLICT(route_path,desired_media_role) DO UPDATE SET placeholder_asset_path=excluded.placeholder_asset_path,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_192_operational_data_connection',
  'database_build192_operational_data_connection.sql',
  CURRENT_TIMESTAMP,
  'Adds Build 192 follow-through records for real fee/cost audit, R2 derivative readiness, resumable mobile upload sessions and conflicts, approved real-media replacement planning, scheduled Search Console imports, GBP evidence, customer duplicate review, provider live-test records, Lighthouse schedules, and legacy admin consolidation telemetry.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;

-- Devil n Dove Build 193 — Live Readiness Playbook and Resumable Mobile Media
-- Safe additive D1 migration. Run after database_build192_operational_data_connection.sql.
-- Purpose: turns the remaining live-only work into a tracked, evidence-based checklist and
-- adds R2 multipart-upload metadata for resumable mobile image uploads.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS live_readiness_test_cases (
  live_readiness_test_case_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_key TEXT NOT NULL UNIQUE,
  test_area TEXT NOT NULL,
  test_label TEXT NOT NULL,
  priority_rank INTEGER NOT NULL DEFAULT 100,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  requires_live_binding INTEGER NOT NULL DEFAULT 0,
  target_route TEXT,
  instructions_markdown TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  test_status TEXT NOT NULL DEFAULT 'not_started',
  evidence_url TEXT,
  evidence_notes TEXT,
  last_run_at TEXT,
  last_run_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_readiness_cases_area
  ON live_readiness_test_cases(test_area, priority_rank, test_status);

CREATE TABLE IF NOT EXISTS live_readiness_test_runs (
  live_readiness_test_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_key TEXT NOT NULL,
  run_status TEXT NOT NULL DEFAULT 'not_started',
  result_summary TEXT,
  evidence_url TEXT,
  tested_by_user_id INTEGER,
  tested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_live_readiness_runs_test
  ON live_readiness_test_runs(test_key, tested_at DESC);

CREATE TABLE IF NOT EXISTS mobile_resumable_upload_runtime_rows (
  mobile_resumable_upload_runtime_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_key TEXT NOT NULL UNIQUE,
  r2_object_key TEXT NOT NULL,
  multipart_upload_id TEXT NOT NULL,
  public_url TEXT,
  attached_product_id INTEGER,
  alt_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  aborted_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_resumable_upload_parts (
  mobile_resumable_upload_part_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_key TEXT NOT NULL,
  part_number INTEGER NOT NULL,
  part_etag TEXT NOT NULL,
  byte_count INTEGER NOT NULL DEFAULT 0,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(upload_key, part_number)
);

CREATE INDEX IF NOT EXISTS idx_mobile_resumable_parts_upload
  ON mobile_resumable_upload_parts(upload_key, part_number);

CREATE TABLE IF NOT EXISTS mobile_resumable_upload_events (
  mobile_resumable_upload_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upload_key TEXT NOT NULL,
  event_kind TEXT NOT NULL,
  event_status TEXT NOT NULL DEFAULT 'recorded',
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS command_center_usage_events (
  command_center_usage_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  event_kind TEXT NOT NULL DEFAULT 'view',
  source_route TEXT,
  user_id INTEGER,
  session_key TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_command_center_usage_route
  ON command_center_usage_events(route_path, created_at DESC);

INSERT INTO live_readiness_test_cases
(test_key,test_area,test_label,priority_rank,risk_level,requires_live_binding,target_route,instructions_markdown,expected_result)
VALUES
(
  'fee_cost_configuration',
  'business_data',
  'Enter one reviewed channel fee and one product-family cost default',
  10,'high',0,'/admin/command-center/',
  '1. Log in as an admin.\n2. Open Admin Command Center.\n3. In the fee/cost section, enter one real channel fee using the exact rate shown in that provider account.\n4. Enter one realistic product-family material, labour, packaging, overhead, and waste default.\n5. Save the change with a short factual reason.\n6. Refresh Product Readiness and confirm the margin status changes.',
  'The fee/cost row is marked configured, the audit row exists, and Product Readiness no longer calls that setting unknown.'
),
(
  'marketplace_margin_gate',
  'business_data',
  'Confirm marketplace export blocks an unhealthy margin',
  20,'high',0,'/admin/marketplace-exports/',
  '1. Use a draft/test product with intentionally incomplete costs or a low price.\n2. Open Marketplace Export Preview.\n3. Try to download the channel CSV.\n4. Confirm the export is blocked and the reason names the margin/cost issue.\n5. Do not create an override unless there is a real business reason.\n6. If testing an override, use a temporary expiry and record why.',
  'The CSV is blocked for unknown, low, or negative margin unless a current approved override exists.'
),
(
  'mobile_draft_recovery',
  'mobile',
  'Save and recover a mobile product draft',
  30,'high',0,'/admin/mobile-product/',
  '1. On a phone or narrow browser, open Mobile Product Add.\n2. Enter a product name, reference, and short description.\n3. Save a partial draft.\n4. Reload the page or reopen the draft list.\n5. Select the saved draft.\n6. Confirm the saved fields return and the readiness checklist identifies remaining work.\n7. Record any missing field or layout issue before continuing.',
  'The product draft is recoverable from D1 and the mobile readiness view remains usable without overlap.'
),
(
  'mobile_resumable_media',
  'mobile',
  'Test resumable R2 media upload on a real phone',
  40,'high',1,'/admin/mobile-product/',
  '1. Save a text-only product draft first and reopen it.\n2. In the Resumable image upload panel choose one non-sensitive test image.\n3. Start the upload while on Wi-Fi.\n4. If practical, briefly disable/re-enable connectivity after the first part completes.\n5. Re-select the same file and resume.\n6. Complete the upload.\n7. Confirm the image appears on the reopened draft and the R2 object key is recorded.\n8. Delete the test image after verification if it should not remain in the catalog.',
  'The upload can resume from completed parts, completes into R2, and attaches a product image without duplicate rows.'
),
(
  'r2_derivative_worker',
  'media',
  'Run R2 derivative health checks',
  50,'high',1,'/admin/command-center/',
  '1. Confirm PRODUCT_MEDIA_BUCKET is bound in Cloudflare Pages.\n2. Confirm the derivative worker route/binding is deployed.\n3. Create a tiny approved test image object.\n4. Generate WebP and AVIF derivatives.\n5. Verify the derivative URLs load, the product record receives valid responsive URLs, and the visual output looks correct.\n6. Run cleanup and confirm test objects are removed.\n7. Mark each check only after evidence is saved.',
  'WebP and AVIF derivatives load, srcset/sizes references are valid, and cleanup removes test objects.'
),
(
  'approved_real_media',
  'media',
  'Replace one placeholder with approved real workshop media',
  60,'medium',0,'/admin/visual-enrichment-studio/',
  '1. Choose one visible placeholder from the media replacement plan.\n2. Confirm the photo is owned by you or public-use consent is recorded.\n3. Compress the image and add descriptive alt text.\n4. Check it on a phone and desktop.\n5. Publish only after the visual review status is approved.\n6. Confirm the replacement uses relevant nearby text and does not change the page H1.',
  'One real photo safely replaces one placeholder with consent, alt text, mobile review, and performance evidence.'
),
(
  'search_console_import',
  'seo',
  'Import a real Search Console export',
  70,'high',0,'/admin/local-seo-review/',
  '1. Open Google Search Console for the verified property.\n2. Open Performance search results.\n3. Choose an appropriate date range and export pages and queries as CSV.\n4. In the admin import tool, upload or preview the CSV.\n5. Review detected headers and sample rows before saving.\n6. Create one follow-up action from an opportunity, not a promise of ranking.\n7. Save the import date and source note.',
  'The CSV mapping is reviewed before import, rows are stored, and actions are factual and traceable.'
),
(
  'gbp_monthly_evidence',
  'seo',
  'Record monthly Google Business Profile evidence',
  80,'medium',0,'/admin/command-center/',
  '1. Open the Google Business Profile.\n2. Check business name, category, hours, service area, phone, website, and current photos.\n3. Record only accurate observations in the GBP evidence panel.\n4. Add a link or screenshot reference where available.\n5. Note any needed update as a task.\n6. Do not claim that posting or photo updates guarantee a ranking result.',
  'A dated monthly record exists for profile accuracy, photos, reviews, posts, and local-page evidence.'
),
(
  'customer_duplicate_review',
  'customers',
  'Review customer duplicate suggestions',
  90,'medium',0,'/admin/command-center/',
  '1. Refresh duplicate customer candidates.\n2. Open each candidate source summary.\n3. Confirm two records truly describe the same person before choosing any merge action.\n4. Keep separate records for shared family emails, gifts, or uncertain matches.\n5. Record a short factual review note.\n6. Do not bulk merge automatically.',
  'Duplicate suggestions are reviewed manually with an auditable outcome.'
),
(
  'stripe_webhook_signature',
  'payments',
  'Test Stripe webhook signature verification',
  100,'high',1,'/admin/webhook-events/',
  '1. In Stripe, use the Developers and Webhooks area.\n2. Confirm the endpoint URL and STRIPE_WEBHOOK_SECRET are configured in Cloudflare.\n3. Send a Stripe test event from Stripe, not a fabricated browser request.\n4. Check the app webhook event log for verified status and event ID.\n5. Confirm the same event ID does not create duplicate payment effects.\n6. Record the outcome without exposing a secret.',
  'A Stripe test event is signature-verified, logged once, and produces no duplicate state changes.'
),
(
  'email_test_delivery',
  'communications',
  'Run a safe email provider delivery test',
  110,'high',1,'/admin/live-ops-followthrough/',
  '1. Keep customer automation disabled.\n2. Confirm EMAIL_PROVIDER and the provider API key are configured.\n3. Send a test only to an owner-controlled inbox.\n4. Confirm sender identity, subject, body, delivery, and spam placement.\n5. Record provider response/reference and delivery result.\n6. Do not send gift-card or review emails to customers during this test.',
  'A test reaches an owner-controlled inbox and is logged without customer automation being enabled.'
),
(
  'r2_live_health',
  'deployment',
  'Run R2 upload, signed-read, and delete health test',
  120,'high',1,'/admin/live-ops-followthrough/',
  '1. Use the private evidence/R2 health panel.\n2. Upload a tiny non-sensitive test image or text object.\n3. Open the signed-read URL while logged in.\n4. Confirm access expires or is denied when expected.\n5. Delete the test object.\n6. Confirm the object no longer exists and the result is logged.',
  'Upload, authorized signed read, expiry behaviour, and delete all pass with evidence.'
),
(
  'pagespeed_lighthouse',
  'performance',
  'Import mobile and desktop Lighthouse/PageSpeed evidence',
  130,'medium',0,'/admin/command-center/',
  '1. Run PageSpeed Insights or Lighthouse for the homepage, shop, gallery, and one local page.\n2. Run both mobile and desktop reports.\n3. Record the score/date and major warnings.\n4. Add a remediation task only for meaningful issues.\n5. Recheck after image or CSS changes.\n6. Keep performance decisions tied to real measured evidence.',
  'Dated mobile and desktop reports are stored and performance budgets reflect evidence.'
),
(
  'real_device_qa',
  'performance',
  'Capture real-device QA evidence',
  140,'medium',0,'/admin/post-deploy-smoke-tests/',
  '1. Check a narrow phone, larger phone, tablet, laptop, and large desktop.\n2. Test navigation, product media, cart, login, mobile product capture, and one admin table.\n3. Confirm tap targets, no horizontal clipping, readable text, and no overlapping cards.\n4. Save screenshots or notes for any defect.\n5. Record each device/result in the QA evidence rows.',
  'Each target device class has dated pass/fail evidence and defects become tracked tasks.'
),
(
  'legacy_admin_usage',
  'operations',
  'Review legacy admin usage before retiring pages',
  150,'low',0,'/admin/command-center/',
  '1. Use the Command Center for normal daily work for at least several weeks.\n2. Review recorded route usage and missing workflow needs.\n3. Keep detailed pages until the Command Center covers their essential daily work.\n4. Archive or redirect only after a documented decision.\n5. Do not remove a route merely because it has low use during a short test period.',
  'Legacy-page consolidation is based on observed use and replacement coverage, not guesswork.'
)
ON CONFLICT(test_key) DO UPDATE SET
  test_area=excluded.test_area,
  test_label=excluded.test_label,
  priority_rank=excluded.priority_rank,
  risk_level=excluded.risk_level,
  requires_live_binding=excluded.requires_live_binding,
  target_route=excluded.target_route,
  instructions_markdown=excluded.instructions_markdown,
  expected_result=excluded.expected_result,
  updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_193_live_readiness_playbook',
  'database_build193_live_readiness_playbook.sql',
  CURRENT_TIMESTAMP,
  'Adds tracked live-readiness test cases/runs, R2 multipart mobile upload metadata, and Command Center usage telemetry. Includes detailed test instructions for costs, margins, mobile recovery, R2, media, Search Console, GBP, provider tests, performance, and legacy-page consolidation.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;

-- Devil n Dove Build 194 — Storefront Discovery, Product Facts, and Media Roles
-- Run after database_build193_live_readiness_playbook.sql.
-- Adds sidecar listing-profile and image-role tables. No product row is changed automatically.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_listing_profiles (
  product_listing_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE,
  best_for_text TEXT,
  materials_text TEXT,
  finish_text TEXT,
  dimensions_text TEXT,
  care_summary TEXT,
  handmade_variation_note TEXT,
  availability_note TEXT,
  shipping_pickup_note TEXT,
  product_video_url TEXT,
  profile_status TEXT NOT NULL DEFAULT 'draft',
  internal_notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_listing_profiles_status ON product_listing_profiles(profile_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS product_media_role_assignments (
  product_media_role_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  role_key TEXT NOT NULL,
  product_image_id INTEGER,
  image_url TEXT,
  assignment_status TEXT NOT NULL DEFAULT 'assigned',
  notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, role_key),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_product_media_role_assignments_product ON product_media_role_assignments(product_id, role_key);

CREATE TABLE IF NOT EXISTS storefront_discovery_audit_rows (
  storefront_discovery_audit_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_key TEXT NOT NULL UNIQUE,
  route_path TEXT NOT NULL,
  audit_status TEXT NOT NULL DEFAULT 'planned',
  evidence_url TEXT,
  notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO storefront_discovery_audit_rows (audit_key,route_path,audit_status,notes)
VALUES
 ('home_hero_clarity','/','planned','Review the homepage on phone and desktop with a first-time visitor: workshop identity, handmade/vintage distinction, and four primary choices should be understandable within a few seconds.'),
 ('home_featured_products','/','planned','Confirm featured creations render only active approved storefront products and empty state stays helpful.'),
 ('shop_quick_filters','/shop/','planned','Confirm quick chips set familiar filters without hiding normal search/filter controls.'),
 ('product_quick_facts','/shop/product/','planned','Approve listing facts before public display; verify dimensions, care, pickup/shipping, and handmade variation are truthful.'),
 ('product_media_roles','/admin/catalog-media/','planned','Assign real photo roles and replace public placeholders only after consent, alt text, performance, and device review.'),
 ('workshop_journal','/workshop-journal/','planned','Review journal pages for accuracy and replace visual placeholders only with approved real media.')
ON CONFLICT(audit_key) DO UPDATE SET route_path=excluded.route_path, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_194_storefront_discovery_product_facts_media_roles',
  'database_build194_storefront_discovery_product_facts_media_roles.sql',
  CURRENT_TIMESTAMP,
  'Adds approved public product listing profiles, buyer-question media role assignments, storefront discovery audit rows, workshop journal support, and product media role coverage.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;

-- Devil n Dove Build 195 — Product Lifecycle, Permanent System Numbers, and Inventory Card Readability
-- Run after database_build194_storefront_discovery_product_facts_media_roles.sql.
-- This migration is additive and safe to rerun. It does not change existing product numbers or SKUs.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- One persistent sequence prevents deletion of the highest product from causing a later product number to be reused.
CREATE TABLE IF NOT EXISTS catalog_product_number_sequence (
  sequence_key TEXT PRIMARY KEY,
  next_product_number INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO catalog_product_number_sequence (sequence_key, next_product_number, updated_at)
VALUES (
  'products',
  CASE
    WHEN COALESCE((SELECT MAX(product_number) FROM products), 0) + 1 < 1000 THEN 1000
    ELSE COALESCE((SELECT MAX(product_number) FROM products), 0) + 1
  END,
  CURRENT_TIMESTAMP
)
ON CONFLICT(sequence_key) DO UPDATE SET
  next_product_number = CASE
    WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number
      THEN excluded.next_product_number
    ELSE catalog_product_number_sequence.next_product_number
  END,
  updated_at = CURRENT_TIMESTAMP;

-- Permanent deletion is audit-visible. Business/order/history references still block deletion and require archive instead.
CREATE TABLE IF NOT EXISTS product_deletion_audit (
  product_deletion_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id_deleted INTEGER NOT NULL,
  product_number INTEGER,
  sku TEXT,
  product_name TEXT,
  product_slug TEXT,
  deletion_reason TEXT,
  deleted_by_user_id INTEGER,
  product_snapshot_json TEXT NOT NULL DEFAULT '{}',
  orphan_media_urls_json TEXT NOT NULL DEFAULT '[]',
  deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_deletion_audit_number ON product_deletion_audit(product_number, deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_deletion_audit_user ON product_deletion_audit(deleted_by_user_id, deleted_at DESC);

-- Keeps customer-facing/operational description separate from inventory source/name data.
CREATE TABLE IF NOT EXISTS site_inventory_item_descriptions (
  site_inventory_item_description_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL UNIQUE,
  item_description TEXT NOT NULL DEFAULT '',
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_site_inventory_item_descriptions_updated ON site_inventory_item_descriptions(updated_at DESC);

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_195_product_lifecycle_sku_inventory_cards',
  'database_build195_product_lifecycle_sku_inventory_cards.sql',
  CURRENT_TIMESTAMP,
  'Adds permanent product-number sequence, auto DND SKU support, safe unused-product deletion audit, and readable inventory descriptions below media.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;

