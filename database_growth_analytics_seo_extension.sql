-- Current pass verification — 2026-04-24: reviewed during the accounting/GIFI/schema sanity pass; no structural change required in this file.
-- Current pass note: customer engagement workflow depth now includes purchaser-versus-recipient gift-card support, broader engagement queues, and storefront featured-testimonial placement.
-- Current pass note: phone-first finished-product entry now supports a lightweight wizard mode plus capture metadata for same-day draft review and safer bulk cleanup.
-- Current pass note: stock-unit versus usage-unit inventory handling was expanded for clearer craft-material costing and planning.
-- Current pass note: DD finished-product numbering now has a configurable start value in app_settings, defaulting to 1000 when older databases have not seeded the setting yet.
-- Current pass note: broad product repricing is now handled in code through the existing products table and admin bulk tooling; no new required schema tables were needed for this pass.
-- File: /database_growth_analytics_seo_extension.sql
-- Brief description: Adds analytics/security, SEO, media, inventory, movement history,
-- search logging, and notification foundations for the current Devil n Dove build.

-- Current pass note: phone product capture now resolves the shared D1 binding through DB or DD_DB and returns structured JSON failures instead of HTML parser breaks.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_visitors (
  site_visitor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_token TEXT NOT NULL UNIQUE,
  ip_hash TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  user_agent TEXT,
  referrer_host TEXT,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visit_count INTEGER NOT NULL DEFAULT 1,
  is_bot INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS site_visitor_sessions (
  site_visitor_session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_visitor_id INTEGER NOT NULL,
  session_token TEXT NOT NULL,
  user_id INTEGER,
  entry_path TEXT,
  last_path TEXT,
  country TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  page_view_count INTEGER NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  is_checkout_started INTEGER NOT NULL DEFAULT 0,
  is_abandoned_cart INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (site_visitor_id) REFERENCES site_visitors(site_visitor_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE(site_visitor_id, session_token)
);

CREATE TABLE IF NOT EXISTS site_page_views (
  site_page_view_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_visitor_id INTEGER,
  site_visitor_session_id INTEGER,
  user_id INTEGER,
  path TEXT NOT NULL,
  query_string TEXT,
  referrer TEXT,
  page_title TEXT,
  page_h1 TEXT,
  event_type TEXT NOT NULL DEFAULT 'page_view',
  duration_ms INTEGER,
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_visitor_id) REFERENCES site_visitors(site_visitor_id) ON DELETE SET NULL,
  FOREIGN KEY (site_visitor_session_id) REFERENCES site_visitor_sessions(site_visitor_session_id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS site_search_events (
  site_search_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_visitor_id INTEGER,
  site_visitor_session_id INTEGER,
  user_id INTEGER,
  search_term TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_visitor_id) REFERENCES site_visitors(site_visitor_id) ON DELETE SET NULL,
  FOREIGN KEY (site_visitor_session_id) REFERENCES site_visitor_sessions(site_visitor_session_id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_activity (
  cart_activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_token TEXT,
  session_token TEXT,
  user_id INTEGER,
  order_id INTEGER,
  event_type TEXT NOT NULL,
  path TEXT,
  cart_count INTEGER NOT NULL DEFAULT 0,
  cart_value_cents INTEGER NOT NULL DEFAULT 0,
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  app_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  updated_by_user_id INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notification_jobs (
  notification_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  job_type TEXT NOT NULL,
  target TEXT,
  payload_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_attempt_at TEXT,
  last_attempt_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_dispatch_logs (
  notification_dispatch_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_job_id INTEGER,
  status TEXT NOT NULL,
  error_text TEXT,
  attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_job_id) REFERENCES notification_jobs(notification_job_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_seo (
  product_seo_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT,
  h1_override TEXT,
  canonical_url TEXT,
  schema_type TEXT NOT NULL DEFAULT 'Product',
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_seo_product_131 ON product_seo(product_id);

CREATE TABLE IF NOT EXISTS product_image_annotations (
  product_image_annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_image_id INTEGER,
  image_url TEXT,
  alt_text TEXT,
  image_title TEXT,
  caption TEXT,
  focal_point_x REAL,
  focal_point_y REAL,
  annotation_notes TEXT,
  merchandising_override_reason TEXT,
  merchandising_override_note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_media_score_history (
  product_media_score_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  actor_user_id INTEGER,
  image_count INTEGER NOT NULL DEFAULT 0,
  lead_image_score INTEGER,
  gallery_merchandising_score INTEGER,
  weak_image_count INTEGER NOT NULL DEFAULT 0,
  weak_unapproved_image_count INTEGER NOT NULL DEFAULT 0,
  overridden_image_count INTEGER NOT NULL DEFAULT 0,
  override_reasons_json TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_media_score_history_product_id_created_at ON product_media_score_history(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS site_item_inventory (
  site_item_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  external_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  source_url TEXT,
  amazon_url TEXT,
  image_url TEXT,
  on_hand_quantity INTEGER NOT NULL DEFAULT 1,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  incoming_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  stock_unit_label TEXT NOT NULL DEFAULT 'unit',
  usage_unit_label TEXT NOT NULL DEFAULT 'unit',
  usage_units_per_stock_unit REAL NOT NULL DEFAULT 1,
  supplier_name TEXT,
  supplier_sku TEXT,
  supplier_contact TEXT,
  reorder_notes TEXT,
  preferred_reorder_quantity INTEGER NOT NULL DEFAULT 0,
  is_on_reorder_list INTEGER NOT NULL DEFAULT 0,
  do_not_reorder INTEGER NOT NULL DEFAULT 0,
  do_not_reuse INTEGER NOT NULL DEFAULT 0,
  reuse_status TEXT,
  reservation_notes TEXT,
  last_reorder_requested_at TEXT,
  last_counted_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_type, external_key)
);


CREATE TABLE IF NOT EXISTS site_inventory_movements (
  site_inventory_movement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER,
  source_type TEXT,
  external_key TEXT,
  item_name TEXT,
  movement_type TEXT NOT NULL DEFAULT 'adjustment' CHECK (movement_type IN ('create','adjustment','reserve','release','incoming','delete','correction','receive','reorder_request','reservation_add','reservation_release','consume','update','sync')),
  quantity_delta INTEGER NOT NULL DEFAULT 0,
  previous_on_hand_quantity INTEGER NOT NULL DEFAULT 0,
  new_on_hand_quantity INTEGER NOT NULL DEFAULT 0,
  previous_reserved_quantity INTEGER NOT NULL DEFAULT 0,
  new_reserved_quantity INTEGER NOT NULL DEFAULT 0,
  previous_incoming_quantity INTEGER NOT NULL DEFAULT 0,
  new_incoming_quantity INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_site_visitors_token ON site_visitors(visitor_token);
CREATE INDEX IF NOT EXISTS idx_site_visitors_country ON site_visitors(country);
CREATE INDEX IF NOT EXISTS idx_site_visitor_sessions_site_visitor_id ON site_visitor_sessions(site_visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_visitor_sessions_last_seen_at ON site_visitor_sessions(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_site_page_views_path ON site_page_views(path);
CREATE INDEX IF NOT EXISTS idx_site_page_views_created_at ON site_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_site_search_events_search_term ON site_search_events(search_term);
CREATE INDEX IF NOT EXISTS idx_cart_activity_event_type ON cart_activity(event_type);
CREATE INDEX IF NOT EXISTS idx_cart_activity_created_at ON cart_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status ON notification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_site_item_inventory_source ON site_item_inventory(source_type, category);
CREATE INDEX IF NOT EXISTS idx_site_inventory_movements_item_id ON site_inventory_movements(site_item_inventory_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_inventory_movements_created_at ON site_inventory_movements(created_at DESC);




-- Current pass: D1 migration ledger to track SQL files after they are run in Cloudflare D1.
CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','skipped','failed','pending_review')),
  destructive INTEGER NOT NULL DEFAULT 0,
  applied_by_user_id INTEGER,
  applied_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_status ON schema_migration_ledger(status, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_file ON schema_migration_ledger(file_name);

INSERT OR IGNORE INTO app_settings (setting_key, setting_value, is_public)
VALUES
  ('site.seo.business_name', 'Devil n Dove', 1),
  ('site.seo.default_title_suffix', 'Devil n Dove', 1),
  ('site.seo.default_description', 'Devil n Dove is a Southern Ontario creative workshop and online store focused on handcrafted jewelry, custom artisan goods, tools, supplies, and maker projects.', 1),
  ('site.seo.default_keywords', 'Devil n Dove, handmade jewelry Ontario, artisan workshop, creative supplies, workshop tools, polymer clay jewelry, maker shop Southern Ontario', 1),
  ('site.seo.primary_h1_pattern', 'Devil n Dove | Handmade Jewelry, Creative Supplies, and Workshop Tools in Southern Ontario', 1),
  ('site.business.primary_location', 'Tillsonburg, Ontario, Canada', 1),
  ('site.catalog.product_number_start', '1000', 0),
  ('site.notifications.retry_minutes', '15', 0),
  ('payments.paypal.enabled', 'true', 1),
  ('payments.stripe.enabled', 'true', 1);


CREATE TABLE IF NOT EXISTS notification_outbox (
  notification_outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  destination TEXT,
  related_order_id INTEGER,
  related_payment_id INTEGER,
  payload_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','retry','sent','failed','cancelled')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status ON notification_outbox(status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_order_payment ON notification_outbox(related_order_id, related_payment_id);



-- Current pass additions: governed product review actions and supplier purchase-order drafts.


CREATE TABLE IF NOT EXISTS supplier_purchase_orders (
  supplier_purchase_order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','ordered','received','cancelled')),
  notes TEXT,
  total_estimated_cents INTEGER NOT NULL DEFAULT 0,
  ordered_applied_at TEXT,
  received_completed_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_supplier_purchase_orders_status ON supplier_purchase_orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS supplier_purchase_order_items (
  supplier_purchase_order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_purchase_order_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER,
  item_name TEXT NOT NULL,
  source_type TEXT,
  external_key TEXT,
  quantity_ordered INTEGER NOT NULL DEFAULT 1,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  incoming_applied_at TEXT,
  received_at TEXT,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  line_total_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_purchase_order_id) REFERENCES supplier_purchase_orders(supplier_purchase_order_id) ON DELETE CASCADE,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_supplier_purchase_order_items_po ON supplier_purchase_order_items(supplier_purchase_order_id);

CREATE TABLE IF NOT EXISTS product_review_actions (
  product_review_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve','request_changes','publish','unpublish')),
  previous_review_status TEXT,
  new_review_status TEXT,
  previous_status TEXT,
  new_status TEXT,
  actor_user_id INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_product_review_actions_product ON product_review_actions(product_id, created_at DESC);


-- Current pass note: the initial D1 catalog migration completed successfully for Tools, Supplies, Movies, and Featured Creations.
-- The main Catalog admin page no longer exposes the day-to-day migration panel, while `/api/admin/catalog-sync` remains available for maintenance or reseed recovery only.

-- 2026-04-13 pass note:
-- No brand-new required tables were introduced in this pass.
-- Current pass focused on DD-series label display, standalone brand-asset uploads,
-- and public social-link restoration through shared UI/footer behavior.

-- Current pass note
-- Added bulk site-inventory unit-cost update workflow in application code.
-- No schema expansion was required in this pass; existing site_item_inventory and site_inventory_movements tables were reused.

-- Pass 20 note — mobile capture compatibility repair
-- The live production database may still be missing one or more newer mobile-capture columns
-- on `products` (for example `capture_reference`) even though the current schema files include them.
-- Application code now checks the live table shape before writing optional mobile-capture fields so
-- `/api/admin/mobile-create-product` and `/api/admin/mobile-product-drafts` keep working during a
-- partial migration window. The preferred long-term fix is still to complete the products-table upgrade.

-- Current Pass Note — 2026-04-14
-- Approval-required storefront fields are now surfaced in the mobile capture UI and approval is blocked until readiness checks pass.


-- Current Pass Note — 2026-04-15
-- Added app_settings-backed dropdown master-data keys for product categories, colours, and shipping codes.
-- Product resource links now support per-unit, end-of-lot, and story-only inventory usage modes.
-- End-of-lot mode is intended for supplies such as wax/resin/clay where one lot may cover many finished products before inventory should be reduced.

-- Current Pass Note — 2026-04-16
-- Admin dropdown master-data is now wired through app_settings and tax_classes in application code.
-- Site inventory usage-unit support was added in application/runtime migration logic for cups, wicks, grams, spools, and end-of-lot costing.

-- Current Pass Update — 2026-04-17
-- This pass assumes/uses the following current-direction features in code:
-- 1) member wishlist and product interest request review workflows
-- 2) checkout recovery leads and recovery email notification outbox support
-- 3) gift card validation / redemption support
-- 4) product review / testimonial submission and approved review display
-- 5) pricing suggestion load/apply actions in admin
-- 6) continued schema-compatibility hardening for older D1 tables
-- Pass 29 - footer socials, engagement depth, and editor price write-back
-- Notes: live code now expects footer social fallback behavior, deeper engagement admin actions, and editor-side price preset write-back.

-- Pass 30 schema note: storefront gift-card purchases may use gift_cards.order_id, purchase_source, and pending_activation status; publish scoring now expects image-count-aware readiness.

-- Pass 32 update (2026-04-20)
-- Current pass expects/supports these schema capabilities where applicable:
-- 1) notification_exclusions, notification_cooldown_rules, customer_engagement_runs, notification_dispatch_log
-- 2) product_publish_overrides plus product publish_readiness_score / image_quality_score / ready_check_notes support
-- 3) media_assets and product_image_annotations dimension/orientation tracking for listing-quality checks
-- 4) gift_cards purchaser/recipient/order/purchase_source friendly fulfillment support
-- 5) inventory and pricing decision support to continue using landed-cost, markup, packaging, shipping, and increase-planning signals

-- Pass 33 update
-- Deepened gift card delivery history and resend controls with recipient/purchaser audit support.
-- Strengthened listing-photo readiness with crop history, first-image scoring, and richer media-quality checks.
-- Expanded public trust/testimonial placement and support CTA coverage.
-- Pushed pricing toward a fuller operating console with receiving/packaging/shipping assumptions and save-time warnings.

-- Current Pass Update
-- Added/expected usage this pass:
-- 1) Member/storefront order-history views can read gift_cards by order_id.
-- 2) Member/storefront order-history views can read gift_card_delivery_audit by gift_card_id.
-- 3) product_image_annotations should continue to support width/height/orientation/crop/first_image_score.
-- 4) No destructive schema changes were introduced in this pass; this is a documentation sync note.


-- Current pass note: product image review now also supports merchandising_override_reason / merchandising_override_note and product_media_score_history trend snapshots.

-- Current pass: saved statement-import provider profiles for bank, PayPal, Stripe, Square, Etsy, and manual CSV formats.
CREATE TABLE IF NOT EXISTS accounting_statement_provider_profiles (
  accounting_statement_provider_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_scope TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  date_column TEXT,
  description_column TEXT,
  gross_column TEXT,
  fee_column TEXT,
  net_column TEXT,
  currency_column TEXT,
  reference_column TEXT,
  default_currency TEXT NOT NULL DEFAULT 'CAD',
  mapping_json TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_provider_profiles_active ON accounting_statement_provider_profiles(is_active, provider_scope);

-- Build 125 current pass: Amazon review/apply workflow, inventory cost history, and reconciliation queue hardening.
CREATE TABLE IF NOT EXISTS site_item_inventory_cost_history (
  site_item_inventory_cost_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER,
  source_type TEXT,
  external_key TEXT,
  item_name TEXT,
  previous_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  new_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  source_kind TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  source_reference TEXT,
  reason_note TEXT,
  changed_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_item ON site_item_inventory_cost_history(site_item_inventory_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_source ON site_item_inventory_cost_history(source_kind, source_id);

ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_inventory_id INTEGER;
ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_cost_history_id INTEGER;
ALTER TABLE amazon_purchase_import_staging ADD COLUMN applied_at TEXT;
ALTER TABLE amazon_purchase_import_staging ADD COLUMN reviewed_by_user_id INTEGER;

ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN assigned_to_user_id INTEGER;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN accountant_review_flag INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN resolved_by_user_id INTEGER;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN resolved_at TEXT;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN reopened_by_user_id INTEGER;
ALTER TABLE accounting_reconciliation_exceptions ADD COLUMN reopened_at TEXT;
CREATE INDEX IF NOT EXISTS idx_accounting_reconciliation_exceptions_queue ON accounting_reconciliation_exceptions(exception_status, accountant_review_flag, updated_at DESC);

ALTER TABLE accounting_journal_entries ADD COLUMN posted_by_user_id INTEGER;
ALTER TABLE accounting_journal_entries ADD COLUMN posted_at TEXT;
ALTER TABLE accounting_journal_entries ADD COLUMN validation_message TEXT;

-- Build 132 note: no structural D1 schema change; mobile-navigation and predeploy-sanity code-only pass recorded in database_upgrade_current_pass.sql.

-- Build 133 SEO extension: Search Console CSV staging foundation.
CREATE TABLE IF NOT EXISTS search_console_import_batches (
  search_console_import_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_key TEXT NOT NULL UNIQUE,
  source_file TEXT,
  site_property TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  imported_by_user_id INTEGER,
  imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS search_console_page_queries (
  search_console_page_query_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_key TEXT,
  report_date TEXT,
  page_url TEXT NOT NULL,
  query_text TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  average_position REAL NOT NULL DEFAULT 0,
  country TEXT,
  device TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_page
  ON search_console_page_queries(page_url, report_date);
CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_query
  ON search_console_page_queries(query_text, report_date);
CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_batch
  ON search_console_page_queries(import_batch_key);

-- Build 134 note: no structural schema change; create-product/admin product editor now adapts to existing product/media/SEO columns and treats draft-only fields as optional until publish readiness.

-- Build 135 schema sync note: no new structural tables are required for the media/R2 diagnostics,
-- product image health report, draft checklist, or reusable image picker. These features reuse existing
-- products, product_images, media_assets, product_image_annotations, runtime_incidents, and schema_migration_ledger tables.

-- Build 136 note: Operations > Search Console CSV Import now writes to the Search Console staging tables above
-- and summarizes pages/queries for manual SEO title/meta/internal-link review.

-- Build 137 SEO action queue for Search Console opportunity review.
CREATE TABLE IF NOT EXISTS seo_opportunity_actions (
  seo_opportunity_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_key TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'search_console',
  page_url TEXT NOT NULL,
  query_text TEXT,
  priority_score INTEGER NOT NULL DEFAULT 0,
  suggested_title TEXT,
  suggested_meta_description TEXT,
  suggested_internal_link_note TEXT,
  action_status TEXT NOT NULL DEFAULT 'open',
  created_from_batch_key TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  applied_override_id INTEGER,
  applied_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_filters
  ON search_console_page_queries(report_date, country, device, impressions, average_position);
CREATE INDEX IF NOT EXISTS idx_seo_opportunity_actions_status
  ON seo_opportunity_actions(action_status, priority_score);
CREATE INDEX IF NOT EXISTS idx_seo_opportunity_actions_page
  ON seo_opportunity_actions(page_url);


-- Build 138 - Social posting queue for job/process photos and summaries.
CREATE TABLE IF NOT EXISTS social_platform_connections (
  social_platform_connection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  profile_url TEXT,
  connection_status TEXT NOT NULL DEFAULT 'manual_ready',
  api_ready INTEGER NOT NULL DEFAULT 0,
  requires_oauth INTEGER NOT NULL DEFAULT 1,
  required_scopes TEXT,
  notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_post_queue (
  social_post_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  social_post_key TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'job_update',
  source_id TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  caption TEXT,
  hashtags TEXT,
  target_platforms_json TEXT NOT NULL DEFAULT '[]',
  image_urls_json TEXT NOT NULL DEFAULT '[]',
  video_url TEXT,
  link_url TEXT,
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  post_status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TEXT,
  published_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  last_publish_attempt_at TEXT,
  api_publish_mode TEXT DEFAULT 'review_first',
  platform_caption_overrides_json TEXT DEFAULT '{}',
  media_quality_warnings_json TEXT DEFAULT '[]',
  duplicate_signature TEXT,
  do_not_repost INTEGER DEFAULT 0,
  schedule_timezone TEXT,
  dry_run_payload_json TEXT DEFAULT '{}',
  last_dry_run_at TEXT
);

CREATE TABLE IF NOT EXISTS social_post_attempts (
  social_post_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  social_post_queue_id INTEGER NOT NULL,
  platform_key TEXT NOT NULL,
  attempt_status TEXT NOT NULL DEFAULT 'manual_ready',
  external_post_url TEXT,
  external_post_id TEXT,
  platform_response_id TEXT,
  published_url TEXT,
  request_mode TEXT,
  http_status INTEGER,
  response_json TEXT,
  attempted_by_user_id INTEGER,
  attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (social_post_queue_id) REFERENCES social_post_queue(social_post_queue_id)
);

CREATE INDEX IF NOT EXISTS idx_social_post_queue_status ON social_post_queue(post_status, approval_status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_post_queue_source ON social_post_queue(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_social_post_queue_duplicate ON social_post_queue(duplicate_signature, do_not_repost);
CREATE INDEX IF NOT EXISTS idx_social_post_attempts_queue ON social_post_attempts(social_post_queue_id, platform_key);

INSERT INTO social_platform_connections (platform_key, display_name, connection_status, api_ready, requires_oauth, required_scopes, notes, updated_at) VALUES
('facebook','Facebook Page','manual_ready',0,1,'pages_manage_posts,pages_read_engagement,pages_show_list','Manual-ready now. API posting later requires Meta Page permissions and app review where applicable.',CURRENT_TIMESTAMP),
('instagram','Instagram Business/Creator','manual_ready',0,1,'instagram_business_content_publish,pages_show_list','Manual-ready now. API publishing later requires Instagram professional account + Meta Content Publishing API flow.',CURRENT_TIMESTAMP),
('tiktok','TikTok','manual_ready',0,1,'video.upload,video.publish','Manual-ready now. API posting later requires TikTok developer app approval and verified media URL/domain rules.',CURRENT_TIMESTAMP),
('x','X','manual_ready',0,1,'tweet.write,users.read,offline.access','Manual-ready now. API posting later requires X API access and OAuth tokens.',CURRENT_TIMESTAMP),
('youtube','YouTube Shorts/Community','manual_ready',0,1,'youtube.upload,youtube.force-ssl','Manual-ready now. API upload/posting later requires Google OAuth/app setup.',CURRENT_TIMESTAMP),
('pinterest','Pinterest','manual_ready',0,1,'pins:write,boards:read','Manual-ready now. Good fit for finished goods and workshop inspiration boards after OAuth setup.',CURRENT_TIMESTAMP)
ON CONFLICT(platform_key) DO UPDATE SET
  display_name = excluded.display_name,
  required_scopes = excluded.required_scopes,
  updated_at = CURRENT_TIMESTAMP;

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build138',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 138. Adds review-first social post queue and platform readiness for job/process photo summaries.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 141 social caption templates / UTM social links note:
-- Social queue schema now includes social_caption_templates and social_post_queue caption_template_key, content_pillar, call_to_action, utm_source, utm_medium, utm_campaign, and utm_url.
-- The runtime endpoint self-heals these optional columns before use to stay safe on older D1 databases.


-- Build 142 competitive roadmap tracker
CREATE TABLE IF NOT EXISTS competitive_opportunities (
  competitive_opportunity_id INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_key TEXT NOT NULL UNIQUE,
  area TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority_score INTEGER DEFAULT 50,
  impact_level TEXT DEFAULT 'medium',
  effort_level TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  owner_note TEXT,
  source_note TEXT,
  suggested_next_step TEXT,
  last_reviewed_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_competitive_opportunities_status ON competitive_opportunities(status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_competitive_opportunities_area ON competitive_opportunities(area, priority_score DESC);

CREATE TABLE IF NOT EXISTS competitive_opportunity_events (
  competitive_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  competitive_opportunity_id INTEGER,
  event_type TEXT,
  old_status TEXT,
  new_status TEXT,
  note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);


-- Build 143 - Social media privacy guard before API/social publishing.
CREATE TABLE IF NOT EXISTS social_media_privacy_rules (
  social_media_privacy_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  applies_to TEXT,
  default_blocked INTEGER NOT NULL DEFAULT 1,
  public_post_allowed INTEGER NOT NULL DEFAULT 0,
  consent_status TEXT NOT NULL DEFAULT 'requires_review',
  checklist TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_social_media_privacy_rules_active ON social_media_privacy_rules(is_active, default_blocked);

CREATE TABLE IF NOT EXISTS social_post_privacy_reviews (
  social_post_privacy_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  social_post_queue_id INTEGER NOT NULL,
  privacy_status TEXT NOT NULL DEFAULT 'needs_review',
  customer_media_present INTEGER NOT NULL DEFAULT 0,
  media_consent_required INTEGER NOT NULL DEFAULT 1,
  approved_for_public_post INTEGER NOT NULL DEFAULT 0,
  reviewer_note TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_social_post_privacy_reviews_queue ON social_post_privacy_reviews(social_post_queue_id, privacy_status);

INSERT OR IGNORE INTO social_media_privacy_rules (rule_key, display_name, applies_to, default_blocked, public_post_allowed, consent_status, checklist, notes, is_active, updated_at) VALUES
('customer_faces_or_names','Customer faces, names, plates, addresses, or private identifiers','customer_or_job_media',1,0,'requires_explicit_consent','Do not post until the customer has clearly approved the exact photo/video/caption or identifiers are removed.','Blocks accidental sharing of customer/private details.',1,CURRENT_TIMESTAMP),
('workshop_background_private_info','Workshop background with receipts, screens, labels, or private paperwork','workshop_process_media',1,0,'requires_review','Check the image background for addresses, order IDs, customer notes, screens, payment info, or private documents.','Useful for bench/process shots where background clutter can leak private information.',1,CURRENT_TIMESTAMP),
('finished_product_only','Finished product only — no private/customer details visible','product_media',0,1,'safe_when_reviewed','Confirm the photo only shows the product, packaging, tools, or shop-safe background.','Safe default for product and gallery posts after visual review.',1,CURRENT_TIMESTAMP),
('therapy_or_health_context','Personal therapy/health context mentioned in caption','caption_copy',0,1,'review_wording','Keep wording human and honest without sharing more personal health detail than intended.','Allows process storytelling while avoiding oversharing.',1,CURRENT_TIMESTAMP),
('kids_or_visitors_visible','Children, visitors, or bystanders visible','people_in_media',1,0,'requires_explicit_consent','Do not post unless each visible person has consented, and avoid posting children without explicit guardian approval.','High-safety rule for public social sharing.',1,CURRENT_TIMESTAMP)
ON CONFLICT(rule_key) DO UPDATE SET
  display_name = excluded.display_name,
  applies_to = excluded.applies_to,
  default_blocked = excluded.default_blocked,
  public_post_allowed = excluded.public_post_allowed,
  consent_status = excluded.consent_status,
  checklist = excluded.checklist,
  notes = excluded.notes,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;

-- Existing social_post_queue installs are self-healed by /api/admin/social-post-queue and /api/admin/social-media-privacy-guard:
--   privacy_status, privacy_notes, media_consent_required, customer_media_present, approved_for_public_post.

-- Build 144: public product-story notes and product/social competitive execution.
CREATE TABLE IF NOT EXISTS product_story_public_notes (
  product_story_public_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  story_heading TEXT,
  story_summary TEXT,
  story_body TEXT,
  process_notes TEXT,
  care_notes TEXT,
  local_pickup_note TEXT,
  display_status TEXT NOT NULL DEFAULT 'draft',
  story_source TEXT,
  privacy_status TEXT DEFAULT 'needs_review',
  review_notes TEXT,
  internal_notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);
CREATE INDEX IF NOT EXISTS idx_product_story_public_notes_product ON product_story_public_notes(product_id, display_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_product_story_public_notes_status ON product_story_public_notes(display_status, privacy_status, updated_at);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_144_product_story_local_trust_social_shortcut',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 144 adds product story note schema, reusable local trust assets, and product-to-social queue workflow notes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);



-- Build 147: media consent registry for product/social media privacy checks.
CREATE TABLE IF NOT EXISTS media_consent_records (
  consent_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_key TEXT NOT NULL UNIQUE,
  subject_label TEXT,
  source_type TEXT DEFAULT 'general',
  source_id TEXT,
  media_url TEXT,
  consent_status TEXT NOT NULL DEFAULT 'unknown',
  consent_scope TEXT NOT NULL DEFAULT 'internal_only',
  public_use_allowed INTEGER NOT NULL DEFAULT 0,
  social_use_allowed INTEGER NOT NULL DEFAULT 0,
  privacy_notes TEXT,
  reviewed_by_user_id INTEGER,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_consent_records_status ON media_consent_records(consent_status, consent_scope, updated_at);
CREATE INDEX IF NOT EXISTS idx_media_consent_records_source ON media_consent_records(source_type, source_id, updated_at);


-- Build 148 note: product image role/public-use/consent fields are represented in database_full_schema.sql and are self-healed by /api/admin/product-images for existing D1 installs.

-- Build 150: reviewed trust blocks, Search Console SEO override apply loop, and accounting close workflow.
CREATE TABLE IF NOT EXISTS trust_block_items (
  trust_block_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_review_id INTEGER,
  item_kind TEXT NOT NULL DEFAULT 'testimonial',
  display_context TEXT NOT NULL DEFAULT 'sitewide',
  title TEXT,
  body TEXT NOT NULL,
  attribution_label TEXT,
  rating_label TEXT,
  related_product_id INTEGER,
  related_product_slug TEXT,
  related_product_name TEXT,
  locality_label TEXT,
  block_status TEXT NOT NULL DEFAULT 'draft',
  is_featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 0,
  privacy_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewer_notes TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trust_block_items_public ON trust_block_items(block_status, is_public, display_context, sort_order);
CREATE INDEX IF NOT EXISTS idx_trust_block_items_product ON trust_block_items(related_product_id, related_product_slug);

CREATE TABLE IF NOT EXISTS seo_page_overrides (
  seo_page_override_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  source_action_id INTEGER,
  source_query_text TEXT,
  override_status TEXT NOT NULL DEFAULT 'draft',
  title_override TEXT,
  meta_description_override TEXT,
  internal_link_note TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_seo_page_overrides_status ON seo_page_overrides(override_status, page_path);

CREATE TABLE IF NOT EXISTS accounting_payment_applications (
  accounting_payment_application_id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER,
  order_id INTEGER,
  period_month TEXT NOT NULL,
  application_status TEXT NOT NULL DEFAULT 'draft',
  applied_amount_cents INTEGER NOT NULL DEFAULT 0,
  fee_amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_component_cents INTEGER NOT NULL DEFAULT 0,
  provider TEXT,
  transaction_reference TEXT,
  application_notes TEXT,
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_payment_applications_period ON accounting_payment_applications(period_month, application_status);

CREATE TABLE IF NOT EXISTS accounting_hst_gst_reviews (
  accounting_hst_gst_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL UNIQUE,
  review_status TEXT NOT NULL DEFAULT 'draft',
  sales_tax_collected_cents INTEGER NOT NULL DEFAULT 0,
  input_tax_credit_cents INTEGER NOT NULL DEFAULT 0,
  net_tax_payable_cents INTEGER NOT NULL DEFAULT 0,
  filing_reference TEXT,
  filing_due_date TEXT,
  remittance_status TEXT NOT NULL DEFAULT 'not_ready',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_hst_gst_reviews_period ON accounting_hst_gst_reviews(period_month, review_status);

CREATE TABLE IF NOT EXISTS accountant_export_packages (
  accountant_export_package_id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_key TEXT NOT NULL UNIQUE,
  period_month TEXT,
  tax_year TEXT,
  package_status TEXT NOT NULL DEFAULT 'draft',
  manifest_json TEXT,
  created_by_user_id INTEGER,
  finalized_by_user_id INTEGER,
  finalized_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_accountant_export_packages_period ON accountant_export_packages(period_month, tax_year, package_status);

-- Build 150 compatibility note: existing Build 137 seo_opportunity_actions tables need
-- applied_override_id INTEGER and applied_at TEXT. The admin Search Console endpoint
-- self-heals those columns safely at runtime, avoiding duplicate-column migration failures.

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_150_trust_seo_close_workflow',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 150 adds approved trust blocks, reviewed SEO override application from Search Console actions, payment application, HST/GST review, month-end close readiness, and accountant export manifest packaging.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 151: custom request conversion drafts, UTM attribution joins, and accountant close CSV/evidence fields.
CREATE TABLE IF NOT EXISTS custom_request_quote_drafts (
  custom_request_quote_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  quote_key TEXT NOT NULL UNIQUE,
  quote_status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  request_type TEXT,
  requested_deadline TEXT,
  estimated_budget_cents INTEGER NOT NULL DEFAULT 0,
  scope_notes TEXT,
  quote_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_drafts_status ON custom_request_quote_drafts(quote_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_job_drafts (
  custom_request_job_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  job_key TEXT NOT NULL UNIQUE,
  job_status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  source_quote_draft_id INTEGER,
  customer_name TEXT,
  customer_email TEXT,
  work_type TEXT,
  target_due_date TEXT,
  estimated_budget_cents INTEGER NOT NULL DEFAULT 0,
  work_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_job_drafts_status ON custom_request_job_drafts(job_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_product_drafts (
  custom_request_product_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  product_draft_key TEXT NOT NULL UNIQUE,
  product_draft_status TEXT NOT NULL DEFAULT 'draft',
  suggested_product_name TEXT NOT NULL,
  product_category TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  story_seed TEXT,
  seo_seed_title TEXT,
  seo_seed_description TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_product_drafts_status ON custom_request_product_drafts(product_draft_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_conversion_events (
  custom_request_conversion_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  conversion_type TEXT NOT NULL,
  target_key TEXT,
  target_table TEXT,
  target_id INTEGER,
  event_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_request_conversion_events_request ON custom_request_conversion_events(custom_request_id, created_at);

-- Runtime APIs self-heal these attribution/support columns when older D1 installs are missing them.
-- custom_requests: utm_source, utm_medium, utm_campaign, utm_content, utm_term, visitor_token, browser_session_token
-- site_visitor_sessions/site_page_views: utm_source, utm_medium, utm_campaign, utm_content, utm_term
-- accounting_hst_gst_reviews: remittance_evidence_url, reminder_date

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_151_custom_request_conversion_utm_close_export',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 151 mounts Custom Requests in Operations, adds quote/job/product draft conversion tables, captures UTM attribution for requests and visitor analytics, joins social UTM rollups to traffic/custom-request conversions, and adds accountant close CSV/remittance evidence support.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- =========================================================
-- BUILD 152 — CUSTOM REQUEST REPLY/PAYMENT CANDIDATES + HST REMINDER QUEUE
-- =========================================================

CREATE TABLE IF NOT EXISTS custom_request_reply_templates (
  custom_request_reply_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  template_key TEXT NOT NULL UNIQUE,
  template_status TEXT NOT NULL DEFAULT 'draft',
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  copied_at TEXT,
  sent_manually_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_reply_templates_request ON custom_request_reply_templates(custom_request_id, template_status, updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_reply_templates_unique_email ON custom_request_reply_templates(custom_request_id, channel);

CREATE TABLE IF NOT EXISTS custom_request_payment_candidates (
  custom_request_payment_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  candidate_key TEXT NOT NULL UNIQUE,
  candidate_type TEXT NOT NULL DEFAULT 'deposit',
  candidate_status TEXT NOT NULL DEFAULT 'draft',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  due_date TEXT,
  description TEXT,
  customer_name TEXT,
  customer_email TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_candidates_request ON custom_request_payment_candidates(custom_request_id, candidate_type, candidate_status);

CREATE TABLE IF NOT EXISTS notification_outbox (
  notification_outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  destination TEXT,
  related_order_id INTEGER,
  related_payment_id INTEGER,
  related_product_id INTEGER,
  payload_json TEXT,
  metadata_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status ON notification_outbox(status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_kind ON notification_outbox(notification_kind, destination, created_at);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_152_custom_request_reply_payment_candidates_hst_reminders',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 152 adds manual customer reply templates, deposit/invoice candidates for custom requests, and HST/GST reminder queue support through notification_outbox.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- =========================================================
-- BUILD 153 — PRIVATE QUOTE PREVIEWS + CUSTOM REQUEST REFERENCE UPLOADS
-- =========================================================

CREATE TABLE IF NOT EXISTS custom_request_quote_share_links (
  custom_request_quote_share_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  share_token TEXT NOT NULL UNIQUE,
  share_status TEXT NOT NULL DEFAULT 'active',
  version_number INTEGER NOT NULL DEFAULT 1,
  supersedes_share_link_id INTEGER,
  resent_at TEXT,
  resend_note TEXT,
  customer_name TEXT,
  customer_email TEXT,
  title TEXT,
  quote_total_cents INTEGER NOT NULL DEFAULT 0,
  scope_summary TEXT,
  payment_summary_json TEXT DEFAULT '{}',
  expires_at TEXT,
  accepted_at TEXT,
  declined_at TEXT,
  customer_response_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_request ON custom_request_quote_share_links(custom_request_id, share_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_token ON custom_request_quote_share_links(share_token, share_status);

CREATE TABLE IF NOT EXISTS custom_request_reference_uploads (
  custom_request_reference_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  request_key TEXT NOT NULL,
  public_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  reference_use_status TEXT NOT NULL DEFAULT 'private_review_only',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_request_reference_uploads_request ON custom_request_reference_uploads(custom_request_id, created_at);

-- Runtime APIs self-heal these optional request upload columns on older D1 installs:
-- custom_requests.upload_token
-- custom_requests.reference_upload_count

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_153_custom_quote_preview_reference_uploads',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 153 adds private custom quote preview links, customer accept/decline tracking, and request-bound private-review reference image uploads for custom requests.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 154 custom quote, consent, SEO bake, gallery filter, and accountant export extension
ALTER TABLE custom_request_quote_drafts ADD COLUMN material_cost_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN labor_cost_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN pickup_shipping_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN tax_estimate_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN quote_total_cents INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS custom_request_quote_line_items (
  custom_request_quote_line_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER NOT NULL,
  line_type TEXT NOT NULL DEFAULT 'custom',
  line_label TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_amount_cents INTEGER NOT NULL DEFAULT 0,
  line_amount_cents INTEGER NOT NULL DEFAULT 0,
  is_taxable INTEGER NOT NULL DEFAULT 1,
  line_status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_line_items_quote ON custom_request_quote_line_items(quote_draft_id, line_status, sort_order);

CREATE TABLE IF NOT EXISTS custom_request_quote_revisions (
  custom_request_quote_revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  revision_type TEXT NOT NULL DEFAULT 'changed',
  revision_status TEXT NOT NULL DEFAULT 'open',
  revision_notes TEXT,
  snapshot_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_revisions_request ON custom_request_quote_revisions(custom_request_id, created_at);

CREATE TABLE IF NOT EXISTS custom_request_payment_request_drafts (
  custom_request_payment_request_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  share_link_id INTEGER,
  payment_request_key TEXT NOT NULL UNIQUE,
  payment_request_status TEXT NOT NULL DEFAULT 'review_needed',
  request_type TEXT NOT NULL DEFAULT 'deposit',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  customer_name TEXT,
  customer_email TEXT,
  due_date TEXT,
  review_notes TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  approved_payment_link_id INTEGER,
  approved_payment_link_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (share_link_id) REFERENCES custom_request_quote_share_links(custom_request_quote_share_link_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_request_drafts_request ON custom_request_payment_request_drafts(custom_request_id, payment_request_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_order_drafts (
  custom_request_order_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  share_link_id INTEGER,
  order_draft_key TEXT NOT NULL UNIQUE,
  order_draft_status TEXT NOT NULL DEFAULT 'review_needed',
  customer_name TEXT,
  customer_email TEXT,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  fulfillment_notes TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  order_id INTEGER,
  converted_by_user_id INTEGER,
  converted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (share_link_id) REFERENCES custom_request_quote_share_links(custom_request_quote_share_link_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_order_drafts_request ON custom_request_order_drafts(custom_request_id, order_draft_status, updated_at);

-- Reference uploads now also create media_consent_records rows with source_type='custom_request_reference_upload', consent_status='requested', and consent_scope='internal_only'.
-- Approved SEO can now be baked from data/site/seo-page-overrides.json using scripts/bake_approved_seo_overrides.py.
-- Accounting close workflow now supports format=zip for a CSV bundle plus evidence-index.csv and manifest.json.

-- Build 155 - approved custom request payment links, real order conversion, marketplace packs, and post-fulfillment prompts.
CREATE TABLE IF NOT EXISTS custom_request_payment_links (
  custom_request_payment_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  payment_request_draft_id INTEGER,
  quote_draft_id INTEGER,
  payment_link_key TEXT NOT NULL UNIQUE,
  link_token TEXT NOT NULL UNIQUE,
  link_status TEXT NOT NULL DEFAULT 'active',
  link_url_path TEXT,
  request_type TEXT NOT NULL DEFAULT 'deposit',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  customer_name TEXT,
  customer_email TEXT,
  provider TEXT NOT NULL DEFAULT 'manual_review',
  provider_reference TEXT,
  approval_notes TEXT,
  customer_viewed_at TEXT,
  customer_ready_at TEXT,
  customer_note TEXT,
  viewed_at TEXT,
  ready_to_pay_at TEXT,
  customer_ready_note TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (payment_request_draft_id) REFERENCES custom_request_payment_request_drafts(custom_request_payment_request_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_links_request ON custom_request_payment_links(custom_request_id, link_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_payment_links_token ON custom_request_payment_links(link_token, link_status);

CREATE TABLE IF NOT EXISTS custom_request_marketplace_export_packs (
  custom_request_marketplace_export_pack_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  product_draft_id INTEGER,
  export_key TEXT NOT NULL UNIQUE,
  export_status TEXT NOT NULL DEFAULT 'draft',
  etsy_title TEXT,
  etsy_description TEXT,
  etsy_tags TEXT,
  facebook_title TEXT,
  facebook_description TEXT,
  pinterest_title TEXT,
  pinterest_description TEXT,
  manual_listing_title TEXT,
  manual_listing_description TEXT,
  suggested_local_keywords TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (product_draft_id) REFERENCES custom_request_product_drafts(custom_request_product_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_marketplace_export_request ON custom_request_marketplace_export_packs(custom_request_id, export_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_fulfillment_prompts (
  custom_request_fulfillment_prompt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER,
  prompt_key TEXT NOT NULL UNIQUE,
  prompt_status TEXT NOT NULL DEFAULT 'draft',
  customer_name TEXT,
  customer_email TEXT,
  review_prompt_text TEXT,
  photo_prompt_text TEXT,
  consent_prompt_text TEXT,
  created_by_user_id INTEGER,
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_request ON custom_request_fulfillment_prompts(custom_request_id, prompt_status, updated_at);

-- Build 156 custom request payment/order/marketplace/consent upgrade
-- Runtime functions use PRAGMA table_info guarded ALTER TABLE ADD COLUMN for existing tables.
-- Keep this reference block with the current pass so D1, docs, and app expectations stay aligned.
CREATE TABLE IF NOT EXISTS custom_request_payment_link_approval_gates (
  custom_request_payment_link_approval_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  payment_request_draft_id INTEGER,
  order_draft_id INTEGER,
  order_id INTEGER,
  gate_status TEXT NOT NULL DEFAULT 'pending',
  gate_notes TEXT,
  gate_snapshot_json TEXT DEFAULT '{}',
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_gates_request ON custom_request_payment_link_approval_gates(custom_request_id, gate_status, checked_at);

CREATE TABLE IF NOT EXISTS custom_request_payment_checkout_records (
  custom_request_payment_checkout_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  payment_link_id INTEGER,
  order_id INTEGER,
  payment_id INTEGER,
  provider TEXT NOT NULL DEFAULT 'manual',
  checkout_status TEXT NOT NULL DEFAULT 'prepared',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  redirect_url TEXT,
  mode TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_checkout_records_request ON custom_request_payment_checkout_records(custom_request_id, provider, checkout_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_order_status_links (
  custom_request_order_status_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  order_status_token TEXT NOT NULL UNIQUE,
  link_status TEXT NOT NULL DEFAULT 'active',
  customer_email TEXT,
  customer_name TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_order_status_links_request ON custom_request_order_status_links(custom_request_id, link_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_order_status_links_token ON custom_request_order_status_links(order_status_token, link_status);

-- Existing table column expectations added by guarded runtime migrations in Build 156:
-- custom_request_payment_links: order_id, payment_id, external_share_status, gate_status, gate_checked_at, gate_notes, preferred_provider, checkout_redirect_url.
-- custom_request_marketplace_export_packs: csv_status, etsy_csv_row_json, facebook_csv_row_json, pinterest_csv_row_json.
-- custom_request_fulfillment_prompts: prompt_token, public_response_status, public_use_scope, review_text, customer_response_note, responded_at.

-- Build 157 - custom commerce hardening, candle/soap specs, marketplace presets, and consent proof review
ALTER TABLE products ADD COLUMN scent_profile TEXT;
ALTER TABLE products ADD COLUMN wax_or_base TEXT;
ALTER TABLE products ADD COLUMN soap_base TEXT;
ALTER TABLE products ADD COLUMN colour_recipe TEXT;
ALTER TABLE products ADD COLUMN batch_number TEXT;
ALTER TABLE products ADD COLUMN ingredient_notes TEXT;
ALTER TABLE products ADD COLUMN allergen_safety_notes TEXT;
ALTER TABLE products ADD COLUMN cure_ready_date TEXT;

ALTER TABLE custom_requests ADD COLUMN upload_token TEXT;
ALTER TABLE custom_requests ADD COLUMN reference_upload_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_requests ADD COLUMN scent_profile TEXT;
ALTER TABLE custom_requests ADD COLUMN wax_or_base TEXT;
ALTER TABLE custom_requests ADD COLUMN colour_notes TEXT;
ALTER TABLE custom_requests ADD COLUMN batch_number TEXT;
ALTER TABLE custom_requests ADD COLUMN ingredient_notes TEXT;
ALTER TABLE custom_requests ADD COLUMN allergen_safety_notes TEXT;

ALTER TABLE custom_request_quote_share_links ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_quote_share_links ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_quote_share_links ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_share_links ADD COLUMN lifecycle_note TEXT;

ALTER TABLE custom_request_payment_links ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_payment_links ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_payment_links ADD COLUMN resent_at TEXT;
ALTER TABLE custom_request_payment_links ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_payment_links ADD COLUMN lifecycle_note TEXT;

ALTER TABLE custom_request_order_status_links ADD COLUMN order_stage TEXT NOT NULL DEFAULT 'planning';
ALTER TABLE custom_request_order_status_links ADD COLUMN stage_notes TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN stage_updated_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN resent_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_order_status_links ADD COLUMN lifecycle_note TEXT;

ALTER TABLE custom_request_marketplace_export_packs ADD COLUMN manual_csv_row_json TEXT DEFAULT '{}';
ALTER TABLE custom_request_marketplace_export_packs ADD COLUMN preset_summary_json TEXT DEFAULT '{}';

ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN resent_at TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN lifecycle_note TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN public_proof_candidate_id INTEGER;

CREATE TABLE IF NOT EXISTS marketplace_channel_presets (
  marketplace_channel_preset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL UNIQUE,
  category_label TEXT,
  shipping_profile_label TEXT,
  default_tags_json TEXT DEFAULT '[]',
  default_fields_json TEXT DEFAULT '{}',
  preset_status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_channel_presets_status ON marketplace_channel_presets(preset_status, channel);

CREATE TABLE IF NOT EXISTS custom_request_order_stage_events (
  custom_request_order_stage_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER,
  stage_key TEXT NOT NULL,
  stage_label TEXT NOT NULL,
  stage_status TEXT NOT NULL DEFAULT 'current',
  stage_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_order_stage_events_request ON custom_request_order_stage_events(custom_request_id, created_at);

CREATE TABLE IF NOT EXISTS custom_request_public_proof_candidates (
  custom_request_public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  fulfillment_prompt_id INTEGER,
  candidate_key TEXT NOT NULL UNIQUE,
  candidate_type TEXT NOT NULL DEFAULT 'trust_block',
  candidate_status TEXT NOT NULL DEFAULT 'review_needed',
  public_use_scope TEXT,
  title TEXT,
  body_text TEXT,
  attribution_label TEXT,
  locality_label TEXT,
  source_review_text TEXT,
  customer_note TEXT,
  trust_block_item_id INTEGER,
  product_story_public_note_id INTEGER,
  review_notes TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_public_proof_candidates_status ON custom_request_public_proof_candidates(candidate_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_payment_provider_tests (
  custom_request_payment_provider_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  test_status TEXT NOT NULL DEFAULT 'not_configured',
  mode TEXT,
  result_notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_provider_tests_provider ON custom_request_payment_provider_tests(provider, checked_at);

CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs (
  custom_candle_soap_product_spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  product_id INTEGER,
  product_draft_id INTEGER,
  product_family TEXT NOT NULL DEFAULT 'candle',
  scent_profile TEXT,
  wax_or_base TEXT,
  colour_notes TEXT,
  batch_number TEXT,
  ingredient_notes TEXT,
  allergen_safety_notes TEXT,
  cure_ready_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_candle_soap_specs_request ON custom_candle_soap_product_specs(custom_request_id, product_family);

-- Build 158 catalog/media repair note:
-- No destructive schema migration is required. Existing tables used/verified this pass:
-- products.featured_image_url, product_images, product_image_annotations,
-- product_review_actions, product_publish_overrides, site_item_inventory,
-- product_resource_links, product_seo. Runtime guards now ensure the review/media
-- support tables exist before admin catalog actions run.
-- Build 159: Catalog Product Editor visual image manager repair.
-- No D1 schema migration required; existing products.featured_image_url and product_images/image URL update handling are reused.

-- Build 160 catalog/editor repair note:
-- No new table is required. Product save now synchronizes the featured image and gallery URLs
-- into product_images in displayed order, preserving existing product_image rows where URLs match
-- so product_image_annotations and publish-readiness checks remain attached.
-- Canonical URL handling now accepts relative internal product paths in product_seo.canonical_url.

-- Build 161 note: no new D1 tables required. Public product APIs now enrich products with image arrays from existing product_images rows. Admin catalog work was split into /admin/catalog-media/ and /admin/inventory-operations/. Product detail now has a JSON error wrapper so late query failures do not return HTML to the browser.
-- Build 162: shop/creations CSS contrast, dedicated gift-card page, and inventory image preview/list URL polish. No D1 schema migration required.

-- Build 163 — product readiness preview, image health counters, and gift-card artwork
-- No required D1 migration is introduced in this pass.
-- New endpoint `/api/admin/product-readiness` reads existing tables: products, product_seo, product_images, and product_image_annotations.
-- Dashboard counters read the same existing product/image/SEO fields and degrade safely through safeCount wrappers.
-- The new `/admin/readiness/` page is admin-only and noindex/nofollow.
-- Recommended future schema work: optional persisted readiness snapshots if we want historical blocker trends instead of live reads only.



-- Build 164 additions: custom_order_stage_photos, product-publish QA endpoint, and candle/soap spec editing.
CREATE TABLE IF NOT EXISTS custom_order_stage_photos (
  custom_order_stage_photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  order_id INTEGER,
  stage_key TEXT NOT NULL DEFAULT 'planning',
  image_url TEXT,
  image_caption TEXT,
  public_use_status TEXT NOT NULL DEFAULT 'internal_review',
  uploaded_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs (
  custom_candle_soap_product_spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  custom_request_id INTEGER,
  product_kind TEXT NOT NULL DEFAULT 'custom',
  scent_profile TEXT,
  wax_or_base TEXT,
  colour_notes TEXT,
  batch_number TEXT,
  ingredient_notes TEXT,
  allergen_safety_notes TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_candle_soap_product_specs_product ON custom_candle_soap_product_specs(product_id);

-- Build 165 notes:
-- Restores custom-requests.js deployment safety and adds admin workflow coverage for post-publish QA, marketplace preview, gift-card lookup, order-stage photos, candle/soap public specs, and accountant evidence URL checks.
-- New/confirmed runtime tables used by this pass include gift_cards, gift_card_redemptions, custom_order_stage_photos, custom_candle_soap_product_specs, trust_block_items, and accountant/HST evidence records.
-- No destructive migration is required; new endpoints create/ensure supporting tables where needed and rely on the existing current-pass schema notes.


-- Build 166 additions: gift-card lifecycle controls, public balance lookup, QA persistence, trust placements, local SEO queue, task queue, and moderated order-stage photos.
ALTER TABLE custom_order_stage_photos ADD COLUMN object_key TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN original_filename TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN mime_type TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN file_size_bytes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_order_stage_photos ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'needs_review';
ALTER TABLE custom_order_stage_photos ADD COLUMN proof_candidate_status TEXT NOT NULL DEFAULT 'not_requested';
ALTER TABLE custom_order_stage_photos ADD COLUMN approved_by_user_id INTEGER;
ALTER TABLE custom_order_stage_photos ADD COLUMN approved_at TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS product_publish_qa_results (
  product_publish_qa_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_slug TEXT,
  qa_status TEXT NOT NULL DEFAULT 'failed',
  passed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  checks_json TEXT,
  checked_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_publish_qa_results_product ON product_publish_qa_results(product_id, created_at);

CREATE TABLE IF NOT EXISTS gift_card_admin_events (
  gift_card_admin_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER,
  source_gift_card_id INTEGER,
  action_key TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trust_block_placements (
  trust_block_placement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_context TEXT NOT NULL UNIQUE,
  placement_label TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  max_items INTEGER NOT NULL DEFAULT 3,
  item_kind_filter TEXT,
  locality_filter TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_seo_landing_page_reviews (
  local_seo_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  page_label TEXT,
  target_keyword TEXT,
  target_locality TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  h1_status TEXT NOT NULL DEFAULT 'unchecked',
  title_meta_status TEXT NOT NULL DEFAULT 'unchecked',
  internal_link_status TEXT NOT NULL DEFAULT 'unchecked',
  notes TEXT,
  local_seo_score INTEGER NOT NULL DEFAULT 0,
  scoring_notes TEXT,
  scored_at TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Build 167: image derivatives, stage-photo moderation, gift-card redemption, marketplace CSV mapping, evidence attachments, Today task actions, local SEO scoring, and QA history.
CREATE TABLE IF NOT EXISTS product_image_derivatives (
  product_image_derivative_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_image_id INTEGER NOT NULL,
  product_id INTEGER,
  derivative_kind TEXT NOT NULL DEFAULT 'preview',
  target_width INTEGER NOT NULL DEFAULT 1200,
  target_height INTEGER NOT NULL DEFAULT 1200,
  crop_x REAL NOT NULL DEFAULT 0,
  crop_y REAL NOT NULL DEFAULT 0,
  crop_width REAL NOT NULL DEFAULT 1,
  crop_height REAL NOT NULL DEFAULT 1,
  source_image_url TEXT,
  derivative_url TEXT,
  derivative_status TEXT NOT NULL DEFAULT 'queued',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS stage_photo_moderation_events (
  stage_photo_moderation_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_order_stage_photo_id INTEGER NOT NULL,
  action_key TEXT NOT NULL,
  moderation_status TEXT,
  public_use_status TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gift_card_lookup_attempts (
  gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hint TEXT,
  email_hash TEXT,
  client_key TEXT,
  was_success INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS marketplace_csv_mappings (
  marketplace_csv_mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL UNIQUE,
  mapping_json TEXT NOT NULL DEFAULT '[]',
  validation_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS accounting_evidence_attachments (
  accounting_evidence_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  evidence_kind TEXT,
  title TEXT,
  evidence_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  attachment_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS today_task_actions (
  today_task_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_key TEXT NOT NULL,
  task_label TEXT,
  action_status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS product_publish_qa_results (
  product_publish_qa_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  qa_status TEXT NOT NULL DEFAULT 'unchecked',
  qa_score INTEGER NOT NULL DEFAULT 0,
  qa_summary_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
-- local_seo_score, scoring_notes, and scored_at are included in the CREATE TABLE above.

