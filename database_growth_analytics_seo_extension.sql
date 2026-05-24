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
  notes TEXT
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
