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
