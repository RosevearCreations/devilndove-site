-- Build 226 sync: code-only Startup Readiness loading repair; Build 225 tables and 37 seeded gates remain current.
-- Current cleanup sync 2026-05-10: active schema retained; database_upgrade_current_pass.sql was archived and reset for the next migration batch.
-- Current pass note: accounting now adds statement-import tables, reconciliation exceptions, fixed-asset groundwork, attachment-required month-close checks, export bundle v2 groundwork, and public colour-filter/catalog-preference support.
-- Current pass note: this storefront/discovery pass adds dedicated public Collections and Marketplaces pages, stronger sale-channel/provenance guidance, and broader internal linking without requiring new database tables.
-- Current pass note: customer engagement workflow depth now includes purchaser-versus-recipient gift-card support, broader engagement queues, and storefront featured-testimonial placement.
-- Current pass note: phone-first finished-product entry now supports a lightweight wizard mode plus capture metadata for same-day draft review and safer bulk cleanup.
-- Current pass note: stock-unit versus usage-unit inventory handling was expanded for clearer craft-material costing and planning.
-- Current pass note: DD finished-product numbering now has a configurable start value in app_settings, defaulting to 1000 when older databases have not seeded the setting yet.
-- Current pass note: broad product repricing is now handled in code through the existing products table and admin bulk tooling; no new required schema tables were needed for this pass.
-- Current pass note: admin write-path resilience now extends beyond read-only fallback. Order status updates, manual payment recording, and refund/dispute actions log server-side incidents more defensively, while the order-detail UI can preserve failed admin writes locally for manual retry. Composite payment/refund/dispute indexes were added to keep these health and follow-up queries fast as the fallback layer grows.
-- Current pass note: no brand-new required tables were added in this pass; the main work was endpoint hardening against partially migrated or lightly seeded D1 data so admin and storefront JSON routes fail gracefully instead of returning HTML errors.
-- File: /database_full_schema.sql
-- Brief description: Full current database schema for the Devil n Dove platform.
-- Apply on a fresh database to create the complete current auth, commerce, payment,
-- media, analytics, notifications, profiles, and access-tier structure.

-- Current pass note: phone product capture now resolves the shared D1 binding through DB or DD_DB and returns structured JSON failures instead of HTML parser breaks.
PRAGMA foreign_keys = ON;

-- =========================================================
-- CORE AUTH / ADMIN
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id INTEGER,
  action TEXT,
  target_user_id INTEGER,
  target_type TEXT,
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);

-- =========================================================
-- PROFILES / ACCESS TIERS
-- =========================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  profile_type TEXT NOT NULL DEFAULT 'customer',
  preferred_name TEXT,
  company_name TEXT,
  phone TEXT,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  email_verified INTEGER NOT NULL DEFAULT 0,
  preferred_contact_method TEXT NOT NULL DEFAULT 'email',
  contact_notes TEXT,
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  order_updates_opt_in INTEGER NOT NULL DEFAULT 1,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  employee_code TEXT,
  department TEXT,
  job_title TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS access_tiers (
  access_tier_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  capture_reference TEXT,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_access_tiers (
  user_access_tier_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  access_tier_id INTEGER NOT NULL,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  granted_by_user_id INTEGER,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (access_tier_id) REFERENCES access_tiers(access_tier_id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by_user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_type ON user_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_access_tiers_unique ON user_access_tiers(user_id, access_tier_id);
CREATE INDEX IF NOT EXISTS idx_user_access_tiers_user_id ON user_access_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_tiers_access_tier_id ON user_access_tiers(access_tier_id);

INSERT OR IGNORE INTO access_tiers (code, name, description, is_active)
VALUES
  ('artist', 'Artist', 'Internal artist/creator access', 1),
  ('customer', 'Customer', 'Standard customer account access', 1),
  ('donor', 'Donor', 'Supporter/donor access tier', 1),
  ('vip_donor', 'VIP Donor', 'Higher donor/supporter tier', 1),
  ('subscriber', 'Subscriber', 'Subscriber/member content access', 1),
  ('customer_bronze', 'Customer Bronze', 'Entry customer tier for future discount and loyalty features', 1),
  ('customer_silver', 'Customer Silver', 'Mid customer tier for future discount and loyalty features', 1),
  ('customer_gold', 'Customer Gold', 'Higher customer tier for future discount and loyalty features', 1),
  ('customer_platinum', 'Customer Platinum', 'Top customer tier for future discount and loyalty features', 1),
  ('employee', 'Employee', 'Standard employee/internal access tier', 1),
  ('employee_senior', 'Senior Employee', 'Senior employee/internal access tier', 1),
  ('employee_manager', 'Employee Manager', 'Manager/internal leadership tier', 1);

-- =========================================================
-- STORE / COMMERCE
-- =========================================================
CREATE TABLE IF NOT EXISTS tax_classes (
  tax_class_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  capture_reference TEXT,
  description TEXT,
  tax_rate REAL NOT NULL DEFAULT 0.13,
  rate_percent REAL NOT NULL DEFAULT 13,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  product_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  product_number INTEGER UNIQUE,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  capture_reference TEXT,
  product_category TEXT,
  color_name TEXT,
  color_names_json TEXT,
  shipping_code TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_status IN ('pending_review','approved','needs_changes','published')),
  is_ready_for_storefront INTEGER NOT NULL DEFAULT 0,
  ready_check_notes TEXT,
  short_description TEXT,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('physical','digital')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  price_cents INTEGER NOT NULL DEFAULT 0,
  compare_at_price_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'CAD',
  taxable INTEGER NOT NULL DEFAULT 1,
  tax_class_id INTEGER,
  tax_class_code TEXT,
  requires_shipping INTEGER NOT NULL DEFAULT 0,
  weight_grams INTEGER,
  inventory_tracking INTEGER NOT NULL DEFAULT 0,
  inventory_quantity INTEGER NOT NULL DEFAULT 0,
  digital_file_url TEXT,
  featured_image_url TEXT,
  merchandise_origin TEXT NOT NULL DEFAULT 'handmade' CHECK (merchandise_origin IN ('handmade','vintage','collectible','antique','oddity','prebuilt')),
  sale_channel TEXT NOT NULL DEFAULT 'onsite' CHECK (sale_channel IN ('onsite','external_only','hybrid')),
  external_listing_url TEXT,
  external_listing_label TEXT,
  condition_summary TEXT,
  era_label TEXT,
  sourcing_notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  capture_entry_mode TEXT NOT NULL DEFAULT 'full' CHECK (capture_entry_mode IN ('full','wizard')),
  capture_created_by_user_id INTEGER,
  capture_updated_by_user_id INTEGER,
  capture_entry_started_at TEXT,
  capture_last_saved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tax_class_id) REFERENCES tax_classes(tax_class_id),
  FOREIGN KEY (capture_created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (capture_updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_products_capture_last_saved_at ON products(capture_last_saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_capture_updated_by ON products(capture_updated_by_user_id, capture_last_saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_origin_channel ON products(merchandise_origin, sale_channel, status, review_status);
CREATE INDEX IF NOT EXISTS idx_products_slug_131 ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_131 ON products(product_category);

CREATE TABLE IF NOT EXISTS product_images (
  product_image_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_tags (
  product_tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  user_id INTEGER,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  order_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (order_status IN ('draft','pending','paid','fulfilled','cancelled','refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','authorized','paid','failed','cancelled','refunded','partially_refunded')),
  payment_method TEXT NOT NULL DEFAULT 'manual'
    CHECK (payment_method IN ('paypal','stripe','square','manual','other','pending')),
  fulfillment_type TEXT NOT NULL DEFAULT 'shipping'
    CHECK (fulfillment_type IN ('shipping','digital','mixed')),
  currency TEXT NOT NULL DEFAULT 'CAD',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  shipping_name TEXT,
  shipping_company TEXT,
  shipping_address1 TEXT,
  shipping_address2 TEXT,
  shipping_city TEXT,
  shipping_province TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  billing_name TEXT,
  billing_company TEXT,
  billing_address1 TEXT,
  billing_address2 TEXT,
  billing_city TEXT,
  billing_province TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  sku TEXT,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('physical','digital')),
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  line_subtotal_cents INTEGER NOT NULL DEFAULT 0,
  taxable INTEGER NOT NULL DEFAULT 1,
  tax_class_code TEXT,
  requires_shipping INTEGER NOT NULL DEFAULT 0,
  digital_file_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
  order_status_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by_user_id INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

INSERT OR IGNORE INTO tax_classes (code, name, description, tax_rate, is_active)
VALUES
  ('standard', 'Standard Taxable Item', 'Default taxable item for Ontario sales', 0.13, 1),
  ('digital', 'Digital Product', 'Digital item tax profile', 0.13, 1),
  ('exempt', 'Tax Exempt', 'Non-taxable item', 0.00, 1);

-- =========================================================
-- PAYMENTS / WEBHOOKS / MEDIA ASSETS
-- =========================================================
CREATE TABLE IF NOT EXISTS payments (
  payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'stripe', 'square', 'manual', 'other')),
  provider_payment_id TEXT,
  provider_order_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  payment_method_label TEXT,
  transaction_reference TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_events (
  webhook_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'stripe', 'square', 'other')),
  provider_event_id TEXT NOT NULL,
  event_type TEXT,
  verification_status TEXT,
  process_status TEXT NOT NULL DEFAULT 'received'
    CHECK (process_status IN ('received', 'processed', 'ignored', 'duplicate', 'failed')),
  related_order_id INTEGER,
  related_payment_id INTEGER,
  payload_json TEXT,
  error_text TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_retry_at TEXT,
  replay_requested_at TEXT,
  replay_requested_by_user_id INTEGER,
  dispatch_notes TEXT,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (related_order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
  FOREIGN KEY (related_payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL,
  UNIQUE(provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS media_assets (
  media_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  storage_provider TEXT NOT NULL DEFAULT 'r2',
  bucket_name TEXT,
  object_key TEXT NOT NULL UNIQUE,
  public_url TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  variant_role TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  annotation_notes TEXT,
  width_px INTEGER,
  height_px INTEGER,
  image_orientation TEXT,
  background_consistency_score INTEGER,
  subject_fill_score INTEGER,
  sharpness_score INTEGER,
  brightness_score INTEGER,
  contrast_score INTEGER,
  angle_group TEXT,
  shot_style TEXT,
  merchandising_score INTEGER,
  deleted_at TEXT,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_status_created_at ON payments(order_id, payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_status ON webhook_events(provider, process_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_product_id ON media_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_sort_order ON media_assets(product_id, sort_order);

CREATE TABLE IF NOT EXISTS payment_refunds (
  refund_id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_refund_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  refund_status TEXT NOT NULL DEFAULT 'recorded' CHECK (refund_status IN ('recorded','requested','submitted','succeeded','failed','cancelled')),
  reason TEXT,
  note TEXT,
  provider_sync_status TEXT,
  provider_sync_note TEXT,
  provider_sync_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payment_disputes (
  dispute_id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_dispute_id TEXT,
  dispute_status TEXT NOT NULL DEFAULT 'open' CHECK (dispute_status IN ('open','under_review','won','lost','closed')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  reason TEXT,
  evidence_due_at TEXT,
  note TEXT,
  provider_sync_status TEXT,
  provider_sync_note TEXT,
  provider_sync_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_id ON payment_refunds(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_order_id ON payment_disputes(order_id, dispute_status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_sync_status ON payment_refunds(provider_sync_status, refund_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status_provider ON payment_disputes(dispute_status, provider_sync_status, created_at DESC);


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



-- =========================================================
-- GROWTH / ANALYTICS / SEO / NOTIFICATIONS / INVENTORY
-- =========================================================
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
  width_px INTEGER,
  height_px INTEGER,
  image_orientation TEXT,
  crop_x REAL,
  crop_y REAL,
  crop_width REAL,
  crop_height REAL,
  first_image_score INTEGER,
  background_consistency_score INTEGER,
  subject_fill_score INTEGER,
  sharpness_score INTEGER,
  brightness_score INTEGER,
  contrast_score INTEGER,
  angle_group TEXT,
  shot_style TEXT,
  merchandising_score INTEGER,
  merchandising_override_reason TEXT,
  merchandising_override_note TEXT,
  image_role TEXT,
  public_use_status TEXT DEFAULT 'internal_review',
  consent_record_id INTEGER,
  role_review_notes TEXT,
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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_product_media_score_history_product_id_created_at ON product_media_score_history(product_id, created_at DESC);


-- Build 148: optional product image role reference used by the admin media workflow.
CREATE TABLE IF NOT EXISTS product_image_role_reference (
  image_role_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  storefront_hint TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO product_image_role_reference (image_role_key, display_name, sort_order, storefront_hint, is_active, updated_at) VALUES
('hero_front','Hero/front',0,'Primary product image for shop cards and product detail hero.',1,CURRENT_TIMESTAMP),
('detail_texture','Detail/texture',1,'Close-up texture, finish, material, maker detail, or engraving proof.',1,CURRENT_TIMESTAMP),
('scale_context','Scale/context',2,'Scale reference, hand/display/context image, or practical sizing view.',1,CURRENT_TIMESTAMP),
('back_side','Back/side',3,'Back, clasp, edge, underside, side profile, or condition detail.',1,CURRENT_TIMESTAMP),
('process_story','Process/story',4,'Bench/process image that supports the maker story after privacy review.',1,CURRENT_TIMESTAMP),
('packaging_pickup','Packaging/pickup',5,'Packaging, pickup, gift-ready, or delivery context.',1,CURRENT_TIMESTAMP),
('material_tool_proof','Material/tool proof',6,'Material, supply, tool, or making-proof image for transparency.',1,CURRENT_TIMESTAMP),
('gallery_support','Gallery/support',7,'Extra supporting image that does not fit a specific required role.',1,CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS catalog_items (
  catalog_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_kind TEXT NOT NULL CHECK (item_kind IN ('tool','supply','creation','other')),
  source_key TEXT NOT NULL,
  slug TEXT,
  name TEXT NOT NULL,
  capture_reference TEXT,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  item_type TEXT,
  short_description TEXT,
  notes TEXT,
  image_url TEXT,
  r2_object_key TEXT,
  amazon_url TEXT,
  storage_location TEXT,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 0,
  visible_public INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_record_json TEXT,
  source_json_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_kind, source_key)
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_kind ON catalog_items(item_kind);
CREATE INDEX IF NOT EXISTS idx_catalog_items_slug ON catalog_items(slug);
CREATE INDEX IF NOT EXISTS idx_catalog_items_status_public ON catalog_items(status, visible_public);
CREATE INDEX IF NOT EXISTS idx_catalog_items_public_sort ON catalog_items(item_kind, status, visible_public, sort_order, name);
CREATE INDEX IF NOT EXISTS idx_catalog_items_grouping ON catalog_items(item_kind, category, subcategory, item_type);

CREATE TABLE IF NOT EXISTS movie_catalog (
  movie_catalog_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upc TEXT NOT NULL UNIQUE,
  slug TEXT,
  title TEXT,
  original_title TEXT,
  sort_title TEXT,
  summary TEXT,
  release_year INTEGER,
  media_format TEXT,
  genre TEXT,
  director_names TEXT,
  actor_names TEXT,
  front_image_url TEXT,
  back_image_url TEXT,
  runtime_minutes INTEGER,
  studio_name TEXT,
  trailer_url TEXT,
  imdb_id TEXT,
  alternate_identifier TEXT,
  metadata_status TEXT NOT NULL DEFAULT 'pending',
  metadata_source TEXT,
  estimated_value_low_cents INTEGER,
  estimated_value_high_cents INTEGER,
  estimated_value_currency TEXT,
  rarity_notes TEXT,
  collection_notes TEXT,
  value_search_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  featured_rank INTEGER,
  source_record_json TEXT,
  source_json_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_movie_catalog_title ON movie_catalog(sort_title, title);
CREATE INDEX IF NOT EXISTS idx_movie_catalog_year ON movie_catalog(release_year);
CREATE INDEX IF NOT EXISTS idx_movie_catalog_status ON movie_catalog(status);
CREATE INDEX IF NOT EXISTS idx_movie_catalog_imdb_id ON movie_catalog(imdb_id);


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
  ('site.catalog.product_category_options', '[]', 0),
  ('site.catalog.color_options', '[]', 0),
  ('site.catalog.shipping_code_options', '[]', 0),
  ('site.notifications.retry_minutes', '15', 0),
  ('payments.paypal.enabled', 'true', 1),
  ('payments.stripe.enabled', 'true', 1);


CREATE TABLE IF NOT EXISTS auth_recovery_requests (
  auth_recovery_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_type TEXT NOT NULL CHECK (request_type IN ('forgot_password','forgot_email')),
  contact_email TEXT NOT NULL,
  possible_email TEXT,
  display_name TEXT,
  note TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auth_recovery_requests_status_created_at ON auth_recovery_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_action_audit (
  admin_action_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  target_key TEXT,
  request_method TEXT,
  request_path TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_created_at ON admin_action_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_actor ON admin_action_audit(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_target ON admin_action_audit(target_type, target_id, created_at DESC);


CREATE TABLE IF NOT EXISTS runtime_incidents (
  runtime_incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_scope TEXT,
  incident_code TEXT,
  severity TEXT DEFAULT 'warning',
  endpoint_path TEXT,
  request_method TEXT,
  message TEXT,
  details_json TEXT,
  related_user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  review_status TEXT DEFAULT 'open',
  admin_note TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_created_at ON runtime_incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_scope ON runtime_incidents(incident_scope, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_code_path ON runtime_incidents(incident_code, endpoint_path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_review_status_created ON runtime_incidents(review_status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runtime_incidents_grouping ON runtime_incidents(severity, incident_scope, incident_code, endpoint_path, created_at DESC);




CREATE TABLE IF NOT EXISTS product_resource_links (
  product_resource_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  resource_kind TEXT NOT NULL CHECK (resource_kind IN ('tool','supply')),
  source_key TEXT NOT NULL,
  quantity_used INTEGER NOT NULL DEFAULT 1,
  usage_notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consumption_mode TEXT NOT NULL DEFAULT 'per_unit' CHECK (consumption_mode IN ('per_unit','end_of_lot','story_only')),
  lot_size_units INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  UNIQUE(product_id, resource_kind, source_key)
);
CREATE INDEX IF NOT EXISTS idx_product_resource_links_product ON product_resource_links(product_id, sort_order);


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


-- Current pass note: the public movies page uses front_image_url/back_image_url from data/movies/movie_catalog_enriched.v2.json and can derive a trailer search URL at runtime when trailer_url is blank.


-- Pass 16: departmental accounting + membership policy foundation
CREATE TABLE IF NOT EXISTS membership_tier_policies (
  membership_tier_policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_title TEXT,
  short_description TEXT,
  benefits_json TEXT,
  badge_color TEXT,
  is_visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS general_ledger_accounts (
  gl_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'expense',
  parent_group TEXT,
  normal_balance TEXT NOT NULL DEFAULT 'debit',
  sort_order INTEGER NOT NULL DEFAULT 0,
  gifi_code TEXT,
  gifi_label TEXT,
  gifi_section TEXT,
  gifi_review_state TEXT NOT NULL DEFAULT 'draft',
  gifi_review_note TEXT,
  gifi_reviewed_by_user_id INTEGER,
  gifi_reviewed_at TEXT,
  tax_deductibility_percent INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounting_vendors (
  accounting_vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_name TEXT NOT NULL UNIQUE,
  default_ledger_code TEXT,
  default_tax_percent REAL NOT NULL DEFAULT 0,
  payment_terms TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_vendors_active_name ON accounting_vendors(is_active, vendor_name);

CREATE TABLE IF NOT EXISTS accounting_expenses (
  expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_date TEXT,
  vendor_id INTEGER,
  vendor_name TEXT,
  amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  ledger_code TEXT,
  ledger_name TEXT,
  recurring_expense_rule_id INTEGER,
  source_mode TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_vendor ON accounting_expenses(vendor_id, vendor_name, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_recurring ON accounting_expenses(recurring_expense_rule_id, expense_date DESC);

CREATE TABLE IF NOT EXISTS accounting_recurring_expense_rules (
  recurring_expense_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER,
  vendor_name TEXT,
  rule_name TEXT NOT NULL,
  ledger_code TEXT,
  ledger_name TEXT,
  amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  due_day INTEGER,
  next_due_date TEXT,
  auto_create_mode TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_generated_at TEXT,
  last_generated_expense_id INTEGER,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_recurring_expense_rules_due ON accounting_recurring_expense_rules(is_active, next_due_date, frequency);

CREATE TABLE IF NOT EXISTS accounting_reconciliation_reviews (
  accounting_reconciliation_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  reconciliation_type TEXT NOT NULL,
  period_month TEXT NOT NULL,
  scope_key TEXT NOT NULL DEFAULT 'all',
  review_status TEXT NOT NULL DEFAULT 'draft',
  note TEXT,
  reference_amount_cents INTEGER NOT NULL DEFAULT 0,
  compared_amount_cents INTEGER NOT NULL DEFAULT 0,
  difference_cents INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reconciliation_type, period_month, scope_key)
);
CREATE INDEX IF NOT EXISTS idx_accounting_reconciliation_reviews_type_period ON accounting_reconciliation_reviews(reconciliation_type, period_month DESC, review_status);

CREATE TABLE IF NOT EXISTS accounting_writeoffs (
  writeoff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  writeoff_date TEXT,
  item_name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  reason_code TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_costs (
  product_cost_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_number TEXT NOT NULL,
  cost_per_unit REAL NOT NULL DEFAULT 0,
  effective_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS accounting_overhead_allocations (
  allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL,
  ledger_code TEXT NOT NULL DEFAULT '',
  ledger_name TEXT NOT NULL DEFAULT '',
  allocation_basis TEXT NOT NULL DEFAULT 'manual',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period_month, ledger_code)
);

-- Current pass: indexes to support phone dashboard, accounting overview, and item-costing reads.

CREATE INDEX IF NOT EXISTS idx_accounting_expenses_date ON accounting_expenses(expense_date, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_writeoffs_date ON accounting_writeoffs(writeoff_date, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_costs_product_number_effective ON product_costs(product_number, effective_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_overhead_allocations_month ON accounting_overhead_allocations(period_month, ledger_code);
-- Current pass note: runtime_incidents remains the server-side fallback/error log table, and `/api/admin/runtime-incidents` now reads from it for admin review while client pages keep last-good snapshot fallbacks in the browser. This pass also adds order/payment-focused partial fallbacks plus a code/path index so admin incident review can stay fast as more endpoint warnings are recorded.



CREATE TABLE IF NOT EXISTS accounting_overhead_product_allocations (
  overhead_product_allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL,
  ledger_code TEXT NOT NULL DEFAULT '',
  product_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period_month, ledger_code, product_id)
);
CREATE INDEX IF NOT EXISTS idx_accounting_overhead_product_allocations_month ON accounting_overhead_product_allocations(period_month, ledger_code, product_id);
CREATE INDEX IF NOT EXISTS idx_accounting_overhead_product_allocations_product ON accounting_overhead_product_allocations(product_id, period_month DESC);

CREATE TABLE IF NOT EXISTS accounting_journal_entries (
  journal_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_key TEXT NOT NULL,
  reference_code TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  total_debit_cents INTEGER NOT NULL DEFAULT 0,
  total_credit_cents INTEGER NOT NULL DEFAULT 0,
  imbalance_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (period_month, source_type, source_key)
);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_period ON accounting_journal_entries(period_month, entry_date DESC, journal_entry_id DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_source ON accounting_journal_entries(source_type, source_key, period_month);

CREATE TABLE IF NOT EXISTS accounting_journal_lines (
  journal_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  ledger_code TEXT,
  ledger_name TEXT,
  line_description TEXT,
  debit_cents INTEGER NOT NULL DEFAULT 0,
  credit_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (journal_entry_id, line_number),
  FOREIGN KEY (journal_entry_id) REFERENCES accounting_journal_entries(journal_entry_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_entry ON accounting_journal_lines(journal_entry_id, line_number ASC);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_ledger ON accounting_journal_lines(ledger_code, created_at DESC);


CREATE TABLE IF NOT EXISTS accounting_gifi_review_notes (
  accounting_gifi_review_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tax_year INTEGER NOT NULL,
  gifi_code TEXT NOT NULL,
  gifi_label TEXT,
  gifi_section TEXT,
  accountant_note TEXT,
  schedule_141_note TEXT,
  supporting_details TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft',
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tax_year, gifi_code)
);
CREATE INDEX IF NOT EXISTS idx_accounting_gifi_review_notes_year ON accounting_gifi_review_notes(tax_year, gifi_code);

CREATE TABLE IF NOT EXISTS accounting_period_closures (
  accounting_period_closure_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL UNIQUE,
  lock_state TEXT NOT NULL DEFAULT 'open',
  close_checklist_json TEXT,
  close_notes TEXT,
  locked_by_user_id INTEGER,
  locked_at TEXT,
  reopened_by_user_id INTEGER,
  reopened_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_period_closures_period ON accounting_period_closures(period_month, lock_state, updated_at DESC);

CREATE TABLE IF NOT EXISTS admin_pending_actions (
  admin_pending_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_action_id TEXT,
  action_scope TEXT,
  order_id INTEGER,
  action_label TEXT,
  endpoint_path TEXT,
  http_method TEXT,
  payload_json TEXT,
  queue_status TEXT DEFAULT 'queued',
  last_error TEXT,
  warning TEXT,
  attempt_count INTEGER DEFAULT 0,
  created_by_user_id INTEGER,
  resolved_by_user_id INTEGER,
  source_device_label TEXT,
  last_attempt_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_pending_actions_client_action_id ON admin_pending_actions(client_action_id);
CREATE INDEX IF NOT EXISTS idx_admin_pending_actions_status_created ON admin_pending_actions(queue_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_pending_actions_order_status ON admin_pending_actions(order_id, queue_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_pending_actions_scope_status ON admin_pending_actions(action_scope, queue_status, created_at DESC);

-- Current pass note: admin_pending_actions now provides a shared cross-device replay queue for failed admin writes, including order/payment actions and product review actions, while browser-local fallback remains the last safety net when even the queue cannot be reached.

-- Current pass note: catalog migration sync now accepts both collections and legacy item_kinds payloads.
-- Tools, supplies, and featured creations continue to upsert into catalog_items.
-- Movies now sync into movie_catalog so hybrid JSON + D1 movie authority can advance without violating the catalog_items item_kind constraint.
-- Current Pass Note — 2026-04-12
-- Movie catalog sync now uses chunked D1 batch upserts to stay below Worker invocation request ceilings.
-- Admin products now supports degraded query fallback during staged schema/data migrations.
-- No new tables were introduced in this pass; schema files were refreshed to reflect the current operational state.


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
-- Inventory items now support usage-unit labeling and per-stock-unit usage counts so cost/buildable math can work for cups, wicks, grams, and similar partial-use materials.

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

-- Pass 31 note: gift card webhook activation, publish override gating, notification cooldown/exclusion support, and image validation workflow updates.

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



-- Current pass note: product image review now also supports merchandising_override_reason / merchandising_override_note and product_media_score_history trend snapshots for admin drift review.


CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_category_sort ON general_ledger_accounts(category, sort_order, code);
CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_gifi ON general_ledger_accounts(gifi_section, gifi_code, code);
CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_review_state ON general_ledger_accounts(gifi_review_state, is_active, code);


-- Pass update: accounting attachments and deeper reconciliation metadata
CREATE TABLE IF NOT EXISTS accounting_attachments (
  accounting_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  attachment_kind TEXT NOT NULL DEFAULT 'other',
  attachment_status TEXT NOT NULL DEFAULT 'uploaded',
  attachment_scope TEXT NOT NULL DEFAULT 'other',
  document_date TEXT,
  scope_key TEXT,
  provider_scope TEXT,
  storage_provider TEXT NOT NULL DEFAULT 'r2',
  bucket_name TEXT,
  object_key TEXT NOT NULL UNIQUE,
  public_url TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  expense_id INTEGER,
  vendor_id INTEGER,
  reconciliation_type TEXT,
  period_month TEXT,
  tax_year TEXT,
  statement_reference TEXT,
  statement_gross_cents INTEGER NOT NULL DEFAULT 0,
  statement_fee_cents INTEGER NOT NULL DEFAULT 0,
  statement_net_cents INTEGER NOT NULL DEFAULT 0,
  statement_tax_cents INTEGER NOT NULL DEFAULT 0,
  statement_shipping_cents INTEGER NOT NULL DEFAULT 0,
  statement_txn_count INTEGER NOT NULL DEFAULT 0,
  statement_period_start TEXT,
  statement_period_end TEXT,
  statement_detail_json TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_attachments_expense ON accounting_attachments(expense_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_attachments_vendor ON accounting_attachments(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_attachments_period ON accounting_attachments(period_month, tax_year, reconciliation_type, attachment_kind);
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN attachment_status TEXT NOT NULL DEFAULT 'uploaded';
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN document_date TEXT;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN scope_key TEXT;
CREATE INDEX IF NOT EXISTS idx_accounting_attachments_scope ON accounting_attachments(reconciliation_type, period_month, scope_key, attachment_kind);

ALTER TABLE accounting_reconciliation_reviews ADD COLUMN statement_reference TEXT;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN difference_reason TEXT;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN detail_json TEXT;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN attachment_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN statement_amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN book_amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN tolerance_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN expected_rate_basis_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN observed_rate_basis_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounting_reconciliation_reviews ADD COLUMN unresolved_item_count INTEGER NOT NULL DEFAULT 0;

-- Current pass additions for statement-backed accounting attachments
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN attachment_scope TEXT NOT NULL DEFAULT 'other';
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN provider_scope TEXT;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN statement_gross_cents INTEGER NOT NULL DEFAULT 0;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN statement_fee_cents INTEGER NOT NULL DEFAULT 0;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN statement_net_cents INTEGER NOT NULL DEFAULT 0;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN statement_tax_cents INTEGER NOT NULL DEFAULT 0;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN statement_shipping_cents INTEGER NOT NULL DEFAULT 0;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN statement_txn_count INTEGER NOT NULL DEFAULT 0;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN statement_period_start TEXT;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN statement_period_end TEXT;
-- Removed from full schema by Build 132 sanity fix: ALTER TABLE accounting_attachments ADD COLUMN statement_detail_json TEXT;


-- Current pass update: customer engagement automation timing rules


-- Current pass update: statement imports, reconciliation exceptions, and fixed-asset groundwork


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

CREATE TABLE IF NOT EXISTS accounting_statement_imports (
  accounting_statement_import_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_scope TEXT NOT NULL DEFAULT 'other',
  import_status TEXT NOT NULL DEFAULT 'imported',
  source_filename TEXT,
  source_format TEXT NOT NULL DEFAULT 'csv',
  period_month TEXT,
  period_start TEXT,
  period_end TEXT,
  currency TEXT NOT NULL DEFAULT 'CAD',
  row_count INTEGER NOT NULL DEFAULT 0,
  gross_cents INTEGER NOT NULL DEFAULT 0,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  net_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  deposit_cents INTEGER NOT NULL DEFAULT 0,
  withdrawal_cents INTEGER NOT NULL DEFAULT 0,
  txn_count INTEGER NOT NULL DEFAULT 0,
  statement_reference TEXT,
  detail_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_imports_period ON accounting_statement_imports(provider_scope, period_month DESC, import_status);

CREATE TABLE IF NOT EXISTS accounting_statement_import_rows (
  accounting_statement_import_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  accounting_statement_import_id INTEGER NOT NULL,
  provider_scope TEXT NOT NULL DEFAULT 'other',
  txn_date TEXT,
  txn_type TEXT,
  description TEXT,
  reference_number TEXT,
  gross_cents INTEGER NOT NULL DEFAULT 0,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  net_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  debit_cents INTEGER NOT NULL DEFAULT 0,
  credit_cents INTEGER NOT NULL DEFAULT 0,
  running_balance_cents INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT,
  matched_scope_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (accounting_statement_import_id) REFERENCES accounting_statement_imports(accounting_statement_import_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_import_rows_import ON accounting_statement_import_rows(accounting_statement_import_id, txn_date);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_import_rows_provider_ref ON accounting_statement_import_rows(provider_scope, txn_date, reference_number);

CREATE TABLE IF NOT EXISTS accounting_reconciliation_exceptions (
  accounting_reconciliation_exception_id INTEGER PRIMARY KEY AUTOINCREMENT,
  reconciliation_type TEXT NOT NULL,
  period_month TEXT NOT NULL,
  scope_key TEXT NOT NULL DEFAULT 'all',
  provider_scope TEXT,
  exception_status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'warning',
  reference_label TEXT,
  statement_amount_cents INTEGER NOT NULL DEFAULT 0,
  book_amount_cents INTEGER NOT NULL DEFAULT 0,
  difference_cents INTEGER NOT NULL DEFAULT 0,
  tolerance_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  detail_json TEXT,
  source_import_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_import_id) REFERENCES accounting_statement_imports(accounting_statement_import_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_accounting_reconciliation_exceptions_period ON accounting_reconciliation_exceptions(reconciliation_type, period_month DESC, exception_status);

CREATE TABLE IF NOT EXISTS accounting_fixed_assets (
  accounting_fixed_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_label TEXT NOT NULL,
  asset_category TEXT,
  cca_class TEXT,
  acquisition_date TEXT,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  salvage_cents INTEGER NOT NULL DEFAULT 0,
  business_use_percent INTEGER NOT NULL DEFAULT 100,
  vendor_name TEXT,
  related_expense_id INTEGER,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_accounting_fixed_assets_category ON accounting_fixed_assets(asset_category, cca_class, acquisition_date DESC);

CREATE TABLE IF NOT EXISTS notification_automation_settings (
  notification_automation_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL UNIQUE,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  send_after_hours INTEGER NOT NULL DEFAULT 24,
  max_age_days INTEGER NOT NULL DEFAULT 30,
  order_statuses_json TEXT,
  payment_statuses_json TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_automation_settings_kind ON notification_automation_settings(notification_kind);

CREATE TABLE IF NOT EXISTS community_events (
  community_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'market',
  event_status TEXT NOT NULL DEFAULT 'planned',
  starts_at TEXT,
  ends_at TEXT,
  venue_name TEXT,
  city TEXT,
  region_label TEXT,
  event_url TEXT,
  public_note TEXT,
  sale_channel_note TEXT,
  pickup_supported INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT NOT NULL DEFAULT 'none',
  recurrence_interval INTEGER NOT NULL DEFAULT 1,
  recurrence_count INTEGER,
  recurrence_until TEXT,
  recurrence_label TEXT,
  image_url TEXT,
  image_alt TEXT,
  application_mode TEXT NOT NULL DEFAULT 'closed',
  application_url TEXT,
  vendor_capacity INTEGER NOT NULL DEFAULT 0,
  vendor_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_community_events_active_start ON community_events(is_active, starts_at, sort_order);

CREATE TABLE IF NOT EXISTS event_vendor_applications (
  event_vendor_application_id INTEGER PRIMARY KEY AUTOINCREMENT,
  community_event_id INTEGER,
  event_title_snapshot TEXT,
  vendor_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  city TEXT,
  offered_items TEXT,
  website_url TEXT,
  marketplace_url TEXT,
  instagram_url TEXT,
  setup_notes TEXT,
  application_status TEXT NOT NULL DEFAULT 'submitted',
  internal_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (community_event_id) REFERENCES community_events(community_event_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_event_vendor_applications_event_status ON event_vendor_applications(community_event_id, application_status, created_at DESC);

CREATE TABLE IF NOT EXISTS pickup_profiles (
  pickup_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  pickup_mode TEXT NOT NULL DEFAULT 'appointment',
  city TEXT,
  region_label TEXT,
  appointment_only INTEGER NOT NULL DEFAULT 1,
  lead_time_hours INTEGER NOT NULL DEFAULT 24,
  public_note TEXT,
  availability_note TEXT,
  map_url TEXT,
  contact_hint TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pickup_profiles_active_sort ON pickup_profiles(is_active, sort_order, label);

-- 2026-05-09 admin products resource-selector follow-up
-- No schema change was required for this pass.
-- The changes were admin UX/fallback improvements for inventory seed selectors and product resource-link editing.

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


-- Build 132 full-schema repair: Amazon purchase import staging must exist before compatibility ALTERs below.
CREATE TABLE IF NOT EXISTS amazon_purchase_import_staging (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_id TEXT NOT NULL,
  source_file TEXT NOT NULL,
  match_status TEXT NOT NULL DEFAULT 'unmatched',
  match_score REAL NOT NULL DEFAULT 0,
  token_coverage REAL NOT NULL DEFAULT 0,
  matched_token_count INTEGER NOT NULL DEFAULT 0,
  matched_tokens TEXT,
  safe_to_stage_after_review TEXT NOT NULL DEFAULT 'review',
  review_decision TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  inventory_type TEXT CHECK (inventory_type IN ('tool', 'supply') OR inventory_type IS NULL),
  inventory_key TEXT,
  inventory_key_loose TEXT,
  inventory_name TEXT,
  inventory_brand_guess TEXT,
  inventory_category_or_type TEXT,
  inventory_r2_object_key TEXT,
  order_date TEXT,
  payment_date TEXT,
  amazon_order_id TEXT,
  asin TEXT,
  amazon_title TEXT,
  amazon_brand TEXT,
  manufacturer TEXT,
  amazon_product_category TEXT,
  item_model_number TEXT,
  part_number TEXT,
  seller_name TEXT,
  currency TEXT NOT NULL DEFAULT 'CAD',
  item_quantity REAL,
  item_subtotal_cents INTEGER NOT NULL DEFAULT 0,
  item_shipping_cents INTEGER NOT NULL DEFAULT 0,
  item_tax_cents INTEGER NOT NULL DEFAULT 0,
  item_net_total_cents INTEGER NOT NULL DEFAULT 0,
  unit_net_cost_cents INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_batch ON amazon_purchase_import_staging(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_inventory ON amazon_purchase_import_staging(inventory_type, inventory_key);
CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_asin ON amazon_purchase_import_staging(asin);
CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_order ON amazon_purchase_import_staging(amazon_order_id, asin);
CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_review ON amazon_purchase_import_staging(review_decision, match_status);

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


-- Build 129 private Amazon import batch tracking.
CREATE TABLE IF NOT EXISTS amazon_purchase_import_batches (
  amazon_purchase_import_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_id TEXT NOT NULL UNIQUE,
  source_file TEXT,
  imported_row_count INTEGER NOT NULL DEFAULT 0,
  skipped_row_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Build 130 note: no destructive schema change was required for the public products API hotfix.
-- Public endpoints must tolerate missing optional product columns until reviewed D1 migrations add them.

-- Build 132 note: no structural D1 schema change; mobile-navigation and predeploy-sanity code-only pass recorded in database_upgrade_current_pass.sql.

-- Build 133 SEO performance import staging tables.
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

-- Build 136 note: Search Console CSV imports are staged through /api/admin/search-console-import.
-- Tables: search_console_import_batches and search_console_page_queries. No public static CSV storage is used.

-- Build 137 SEO action queue for Search Console opportunities.
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
  last_dry_run_at TEXT,
  caption_template_key TEXT,
  content_pillar TEXT,
  call_to_action TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_url TEXT
);

CREATE TABLE IF NOT EXISTS social_caption_templates (
  social_caption_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  content_pillar TEXT,
  default_platforms_json TEXT NOT NULL DEFAULT '[]',
  default_hashtags TEXT,
  body_template TEXT NOT NULL,
  call_to_action TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_caption_templates_active ON social_caption_templates(is_active, content_pillar);

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

-- Build 146: custom request intake table.
CREATE TABLE IF NOT EXISTS custom_requests (
  custom_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  request_type TEXT NOT NULL,
  product_interest TEXT,
  deadline_date TEXT,
  budget_cents INTEGER,
  message TEXT NOT NULL,
  attachment_urls_json TEXT DEFAULT '[]',
  consent_to_contact INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email, created_at);

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

-- Build 168 schema additions / compatibility notes
CREATE TABLE IF NOT EXISTS marketplace_export_image_selections (
  marketplace_export_image_selection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  selected_image_urls_json TEXT,
  selected_product_image_ids_json TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, product_id)
);
CREATE TABLE IF NOT EXISTS custom_request_public_proof_candidates (
  custom_request_public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  order_id INTEGER,
  source_kind TEXT NOT NULL DEFAULT 'stage_photo',
  source_record_id INTEGER,
  image_url TEXT,
  candidate_title TEXT,
  candidate_body TEXT,
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  trust_block_item_id INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gift_card_lookup_attempts (
  gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  lookup_email TEXT,
  code_suffix TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  result_status TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS candle_soap_batch_recalls (
  candle_soap_batch_recall_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  product_kind TEXT,
  recall_status TEXT NOT NULL DEFAULT 'watch',
  reason TEXT,
  customer_notice TEXT,
  created_by_user_id INTEGER,
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
ALTER TABLE product_image_derivatives ADD COLUMN derivative_object_key TEXT;
ALTER TABLE product_image_derivatives ADD COLUMN file_size_bytes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product_image_derivatives ADD COLUMN generation_method TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN consent_match_status TEXT NOT NULL DEFAULT 'not_checked';
ALTER TABLE today_task_actions ADD COLUMN snooze_until TEXT;


-- Build 169 schema additions: derivative output, proof candidates, gift delivery, local SEO, QA state, smoke tests.
CREATE TABLE IF NOT EXISTS gift_card_delivery_templates (
  gift_card_delivery_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT,
  body TEXT,
  template_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gift_card_delivery_queue (
  gift_card_delivery_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER,
  recipient_email TEXT,
  delivery_kind TEXT NOT NULL DEFAULT 'activation',
  template_key TEXT,
  subject TEXT,
  body TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  queued_by_user_id INTEGER,
  queued_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS public_proof_candidates (
  public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_kind TEXT NOT NULL DEFAULT 'stage_photo',
  source_id INTEGER,
  product_id INTEGER,
  custom_request_id INTEGER,
  proof_title TEXT,
  proof_body TEXT,
  image_url TEXT,
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  moderation_status TEXT NOT NULL DEFAULT 'needs_review',
  placement_context TEXT NOT NULL DEFAULT 'sitewide',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS marketplace_export_history (
  marketplace_export_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_format TEXT NOT NULL DEFAULT 'csv',
  product_count INTEGER NOT NULL DEFAULT 0,
  ready_count INTEGER NOT NULL DEFAULT 0,
  blocked_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS product_qa_panel_states (
  product_qa_panel_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER,
  panel_key TEXT NOT NULL DEFAULT 'catalog_qa',
  panel_state TEXT NOT NULL DEFAULT 'collapsed',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id,user_id,panel_key)
);
CREATE TABLE IF NOT EXISTS local_seo_bake_actions (
  local_seo_bake_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  proposed_title TEXT,
  proposed_meta_description TEXT,
  internal_link_notes TEXT,
  action_status TEXT NOT NULL DEFAULT 'queued',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS local_seo_competitor_phrases (
  local_seo_competitor_phrase_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  phrase TEXT NOT NULL,
  phrase_kind TEXT NOT NULL DEFAULT 'competitor_phrase',
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS candle_soap_recall_notification_queue (
  candle_soap_recall_notification_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recipient_email TEXT,
  notification_status TEXT NOT NULL DEFAULT 'draft',
  subject TEXT,
  body TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS post_deploy_smoke_test_results (
  post_deploy_smoke_test_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  page_url TEXT NOT NULL,
  check_kind TEXT NOT NULL DEFAULT 'manual',
  result_status TEXT NOT NULL DEFAULT 'pending',
  http_status INTEGER,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE product_image_derivatives ADD COLUMN before_image_url TEXT;
ALTER TABLE product_image_derivatives ADD COLUMN comparison_notes TEXT;

-- Build 170 deployment hardening and workflow schema notes
-- Added/extended by app code as defensive CREATE TABLE/ALTER TABLE calls:
-- product_image_derivatives: derivative URL worker fallback and featured-image promotion notes.
-- marketplace_export_history: snapshot_json, replayed_from_history_id, rollback_note.
-- marketplace_export_replay_events: channel replay/rollback audit.
-- public_proof_candidates: promoted_trust_block_item_id, promoted_at, source_label.
-- public_proof_candidate_events: promotion audit trail.
-- gift_card_delivery_queue: delivery sender/history bridge to notification_outbox.
-- gift_card_lookup_lockouts: admin lockout controls for public balance lookup abuse.
-- local_seo_competitor_phrases: last_page_score, phrase_count, last_scored_at.
-- product_qa_blocker_history: blocker resolution persistence.
-- candle_soap_recall_customer_matches and candle_soap_recall_notification_queue: recall matching and send-review drafts.
-- post_deploy_smoke_test_results: live URL smoke-test storage.
-- dark_theme_screenshot_evidence: dark-theme screenshot/review evidence rows.


-- Build 171 admin safety and release readiness schema additions.
CREATE TABLE IF NOT EXISTS dark_theme_screenshot_evidence (
  dark_theme_screenshot_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  evidence_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  checklist_key TEXT,
  section_label TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  contrast_status TEXT NOT NULL DEFAULT 'unchecked',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dark_theme_evidence_review ON dark_theme_screenshot_evidence(page_path, review_status, contrast_status, updated_at);

CREATE TABLE IF NOT EXISTS gift_card_provider_send_logs (
  gift_card_provider_send_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_delivery_queue_id INTEGER,
  gift_card_id INTEGER,
  provider TEXT,
  recipient_email TEXT,
  provider_message_id TEXT,
  send_status TEXT NOT NULL DEFAULT 'attempted',
  request_summary_json TEXT,
  response_summary_json TEXT,
  error_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gift_card_provider_send_logs_queue ON gift_card_provider_send_logs(gift_card_delivery_queue_id, created_at);

CREATE TABLE IF NOT EXISTS r2_derivative_health_checks (
  r2_derivative_health_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_status TEXT NOT NULL DEFAULT 'unknown',
  bucket_binding_name TEXT,
  object_key TEXT,
  public_base_url TEXT,
  worker_route TEXT,
  message TEXT,
  details_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_seo_competitor_phrase_score_history (
  local_seo_competitor_phrase_score_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_seo_competitor_phrase_id INTEGER,
  page_path TEXT,
  phrase TEXT,
  phrase_count INTEGER NOT NULL DEFAULT 0,
  page_score INTEGER NOT NULL DEFAULT 0,
  scoring_label TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_export_replay_events (
  marketplace_export_replay_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  source_history_id INTEGER,
  action_kind TEXT NOT NULL DEFAULT 'replay',
  affected_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE marketplace_export_history ADD COLUMN snapshot_json TEXT;
ALTER TABLE marketplace_export_history ADD COLUMN replayed_from_history_id INTEGER;
ALTER TABLE marketplace_export_history ADD COLUMN rollback_note TEXT;
ALTER TABLE public_proof_candidates ADD COLUMN consent_source_url TEXT;
ALTER TABLE public_proof_candidates ADD COLUMN promotion_contexts_json TEXT;
ALTER TABLE candle_soap_batch_recalls ADD COLUMN send_review_status TEXT NOT NULL DEFAULT 'draft';

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_171_admin_safety_release_readiness',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Admin evidence bundle, gift-card provider logs, marketplace rollback, local SEO history, recalls, and release readiness. Build 172 hotfix: file_name is included so the NOT NULL ledger constraint passes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_171_admin_safety_release_readiness');

-- Build 173 deployment preflight and release-run history.
CREATE TABLE IF NOT EXISTS deployment_preflight_runs (
  deployment_preflight_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  run_status TEXT NOT NULL DEFAULT 'warning',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployment_preflight_runs_status ON deployment_preflight_runs(run_status, created_at DESC);

-- Build 174: deployment preflight detail, post-deploy confirmations, and release package manifest support.
-- Safe to run after Build 173; additive only.

CREATE TABLE IF NOT EXISTS deployment_post_deploy_confirmations (
  deployment_post_deploy_confirmation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  confirmation_key TEXT NOT NULL,
  confirmation_label TEXT,
  confirmation_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  confirmed_by_user_id INTEGER,
  confirmed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label, confirmation_key)
);

CREATE INDEX IF NOT EXISTS idx_deploy_confirmations_status
  ON deployment_post_deploy_confirmations(build_label, confirmation_status, updated_at DESC);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_174_preflight_detail_manifest',
  'database_build174_deployment_preflight_detail.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Deployment preflight detail drawers, schema diff, Markdown export, post-deploy confirmations, R2 visibility, and release package manifest support.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_174_preflight_detail_manifest');

-- Build 175: release control center, deeper preflight checks, provider webhooks, recall compliance, and local business schema.
-- Safe to run after Build 174; additive only.

CREATE TABLE IF NOT EXISTS deployment_history (
  deployment_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  branch_name TEXT,
  commit_sha TEXT,
  deploy_url TEXT,
  build_zip_label TEXT,
  package_manifest_hash TEXT,
  deployment_status TEXT NOT NULL DEFAULT 'planned',
  promoted_by_user_id INTEGER,
  promoted_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployment_history_status ON deployment_history(deployment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_history_build ON deployment_history(build_label, created_at DESC);

CREATE TABLE IF NOT EXISTS deployment_manifest_comparisons (
  deployment_manifest_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  expected_manifest_path TEXT NOT NULL DEFAULT '/data/site/release-package-manifest.json',
  deployed_manifest_url TEXT,
  comparison_status TEXT NOT NULL DEFAULT 'not_run',
  expected_file_count INTEGER NOT NULL DEFAULT 0,
  deployed_file_count INTEGER NOT NULL DEFAULT 0,
  missing_file_count INTEGER NOT NULL DEFAULT 0,
  changed_file_count INTEGER NOT NULL DEFAULT 0,
  comparison_json TEXT NOT NULL DEFAULT '{}',
  compared_by_user_id INTEGER,
  compared_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_manifest_comparisons_build ON deployment_manifest_comparisons(build_label, comparison_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS deployment_screenshot_jobs (
  deployment_screenshot_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  page_path TEXT NOT NULL,
  screenshot_kind TEXT NOT NULL DEFAULT 'dark_theme_regression',
  viewport_width INTEGER NOT NULL DEFAULT 390,
  viewport_height INTEGER NOT NULL DEFAULT 844,
  theme TEXT NOT NULL DEFAULT 'dark',
  capture_status TEXT NOT NULL DEFAULT 'queued',
  evidence_url TEXT,
  r2_object_key TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  captured_by_user_id INTEGER,
  captured_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_screenshot_jobs_status ON deployment_screenshot_jobs(capture_status, build_label, created_at DESC);

CREATE TABLE IF NOT EXISTS preflight_response_keyword_checks (
  preflight_response_keyword_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  keyword TEXT NOT NULL,
  keyword_kind TEXT NOT NULL DEFAULT 'local_search',
  is_required INTEGER NOT NULL DEFAULT 1,
  last_status TEXT NOT NULL DEFAULT 'not_checked',
  last_count INTEGER NOT NULL DEFAULT 0,
  last_checked_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, keyword, keyword_kind)
);
CREATE INDEX IF NOT EXISTS idx_preflight_keywords_page ON preflight_response_keyword_checks(page_path, last_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_queue (
  product_qa_bulk_fix_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_code TEXT NOT NULL,
  fix_type TEXT NOT NULL DEFAULT 'manual_review',
  product_ids_json TEXT NOT NULL DEFAULT '[]',
  product_count INTEGER NOT NULL DEFAULT 0,
  approval_status TEXT NOT NULL DEFAULT 'needs_approval',
  preview_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  applied_at TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_bulk_fix_queue_status ON product_qa_bulk_fix_queue(approval_status, blocker_code, updated_at DESC);

CREATE TABLE IF NOT EXISTS r2_private_health_tests (
  r2_private_health_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_kind TEXT NOT NULL DEFAULT 'signed_download',
  bucket_label TEXT,
  object_key TEXT,
  test_status TEXT NOT NULL DEFAULT 'not_run',
  http_status INTEGER,
  checksum_sha256 TEXT,
  bytes_tested INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_r2_private_health_tests_status ON r2_private_health_tests(test_kind, test_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS accounting_evidence_bundle_checksums (
  accounting_evidence_bundle_checksum_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  export_label TEXT,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  zip_sha256 TEXT,
  manifest_json TEXT NOT NULL DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'not_verified',
  verified_by_user_id INTEGER,
  verified_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_bundle_checksums_period ON accounting_evidence_bundle_checksums(period_month, verification_status, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_provider_webhook_events (
  gift_card_provider_webhook_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  event_type TEXT,
  provider_event_id TEXT,
  provider_message_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'received',
  gift_card_delivery_log_id INTEGER,
  payload_json TEXT NOT NULL DEFAULT '{}',
  received_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  notes TEXT,
  UNIQUE(provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_gift_card_webhooks_provider ON gift_card_provider_webhook_events(provider, delivery_status, received_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_channel_validation_rules (
  marketplace_channel_validation_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  column_key TEXT NOT NULL,
  rule_kind TEXT NOT NULL DEFAULT 'required_column',
  is_required INTEGER NOT NULL DEFAULT 1,
  rule_status TEXT NOT NULL DEFAULT 'active',
  severity TEXT NOT NULL DEFAULT 'blocker',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, column_key, rule_kind)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_validation_rules_channel ON marketplace_channel_validation_rules(channel, rule_status, severity);

CREATE TABLE IF NOT EXISTS marketplace_export_snapshot_diffs (
  marketplace_export_snapshot_diff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  previous_history_id INTEGER,
  current_history_id INTEGER,
  diff_status TEXT NOT NULL DEFAULT 'not_run',
  changed_row_count INTEGER NOT NULL DEFAULT 0,
  changed_field_count INTEGER NOT NULL DEFAULT 0,
  diff_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_snapshot_diffs_channel ON marketplace_export_snapshot_diffs(channel, diff_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recall_compliance_reviews (
  recall_compliance_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  legal_note TEXT,
  compliance_note TEXT,
  approval_signature TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_compliance_reviews_batch ON recall_compliance_reviews(batch_number, review_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS recall_customer_previews (
  recall_customer_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  customer_id INTEGER,
  customer_email TEXT,
  product_summary TEXT,
  order_summary TEXT,
  preview_subject TEXT,
  preview_body TEXT,
  preview_status TEXT NOT NULL DEFAULT 'draft',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_customer_previews_batch ON recall_customer_previews(batch_number, preview_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS mobile_admin_saved_views (
  mobile_admin_saved_view_id INTEGER PRIMARY KEY AUTOINCREMENT,
  view_key TEXT NOT NULL UNIQUE,
  view_label TEXT NOT NULL,
  page_path TEXT NOT NULL,
  device_target TEXT NOT NULL DEFAULT 'phone',
  filter_json TEXT NOT NULL DEFAULT '{}',
  sort_json TEXT NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mobile_admin_saved_views_target ON mobile_admin_saved_views(device_target, is_default, updated_at DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_settings (
  local_business_schema_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL DEFAULT 'Devil n Dove',
  canonical_url TEXT NOT NULL DEFAULT 'https://devilndove.com/',
  telephone TEXT,
  email TEXT,
  area_served_json TEXT NOT NULL DEFAULT '["Southern Ontario","Oxford County","Norfolk County"]',
  service_types_json TEXT NOT NULL DEFAULT '["handmade jewelry","custom gifts","laser engraving","custom candles","custom soap"]',
  same_as_json TEXT NOT NULL DEFAULT '[]',
  schema_status TEXT NOT NULL DEFAULT 'draft',
  schema_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_status ON local_business_schema_settings(schema_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS safe_deploy_export_records (
  safe_deploy_export_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  export_label TEXT,
  release_notes_path TEXT DEFAULT 'RELEASE_NOTES.md',
  preflight_markdown_path TEXT,
  manifest_path TEXT DEFAULT 'data/site/release-package-manifest.json',
  schema_paths_json TEXT NOT NULL DEFAULT '[]',
  smoke_results_json TEXT NOT NULL DEFAULT '{}',
  export_status TEXT NOT NULL DEFAULT 'planned',
  zip_sha256 TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_safe_deploy_exports_build ON safe_deploy_export_records(build_label, export_status, created_at DESC);

CREATE TABLE IF NOT EXISTS preflight_runtime_incident_links (
  preflight_runtime_incident_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_preflight_run_id INTEGER,
  runtime_incident_id INTEGER,
  check_code TEXT,
  page_path TEXT,
  link_status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_preflight_incident_links_run ON preflight_runtime_incident_links(deployment_preflight_run_id, link_status, created_at DESC);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_175_release_control_center',
  'database_build175_release_control.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Release control center, deployment history, manifest comparison, screenshot jobs, deeper URL keyword checks, QA bulk queues, R2 signed tests, gift-card webhooks, marketplace validation, recall compliance previews, mobile saved views, and local business schema output.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_175_release_control_center');

-- Build 176: release safety controls, downloadable safe deploy package, QA previews, recall locks, and richer local SEO schema.
-- Safe to run after Build 175; additive only.

CREATE TABLE IF NOT EXISTS safe_deploy_package_downloads (
  safe_deploy_package_download_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  package_kind TEXT NOT NULL DEFAULT 'safe_deploy_zip',
  included_files_json TEXT NOT NULL DEFAULT '[]',
  file_count INTEGER NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  zip_sha256 TEXT,
  download_status TEXT NOT NULL DEFAULT 'prepared',
  prepared_by_user_id INTEGER,
  prepared_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_safe_deploy_package_downloads_build ON safe_deploy_package_downloads(build_label, download_status, prepared_at DESC);

CREATE TABLE IF NOT EXISTS release_manifest_live_diffs (
  release_manifest_live_diff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  expected_manifest_url TEXT,
  deployed_manifest_url TEXT,
  diff_status TEXT NOT NULL DEFAULT 'not_run',
  expected_file_count INTEGER NOT NULL DEFAULT 0,
  deployed_file_count INTEGER NOT NULL DEFAULT 0,
  missing_file_count INTEGER NOT NULL DEFAULT 0,
  changed_file_count INTEGER NOT NULL DEFAULT 0,
  extra_file_count INTEGER NOT NULL DEFAULT 0,
  diff_json TEXT NOT NULL DEFAULT '{}',
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_release_manifest_live_diffs_build ON release_manifest_live_diffs(build_label, diff_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_export_validation_runs (
  marketplace_export_validation_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_history_id INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'not_run',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  checked_rows INTEGER NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_export_validation_runs_channel ON marketplace_export_validation_runs(channel, validation_status, created_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_preview_items (
  product_qa_bulk_fix_preview_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER,
  product_id INTEGER NOT NULL,
  blocker_code TEXT NOT NULL,
  focus_field TEXT,
  current_value TEXT,
  suggested_value TEXT,
  fix_url TEXT,
  preview_status TEXT NOT NULL DEFAULT 'needs_review',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_preview_items_queue ON product_qa_bulk_fix_preview_items(product_qa_bulk_fix_queue_id, preview_status, blocker_code);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_apply_events (
  product_qa_bulk_fix_apply_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER,
  apply_status TEXT NOT NULL DEFAULT 'preview_only',
  applied_field TEXT,
  applied_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  event_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  applied_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_apply_events_queue ON product_qa_bulk_fix_apply_events(product_qa_bulk_fix_queue_id, apply_status, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_webhook_signature_checks (
  gift_card_webhook_signature_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  event_id INTEGER,
  signature_status TEXT NOT NULL DEFAULT 'not_checked',
  signature_header_present INTEGER NOT NULL DEFAULT 0,
  timestamp_header_present INTEGER NOT NULL DEFAULT 0,
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_gift_card_signature_checks_provider ON gift_card_webhook_signature_checks(provider, signature_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS recall_notification_locks (
  recall_notification_lock_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  lock_status TEXT NOT NULL DEFAULT 'locked_pending_review',
  required_review_status TEXT NOT NULL DEFAULT 'approved',
  matching_review_id INTEGER,
  last_checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  checked_by_user_id INTEGER,
  notes TEXT,
  UNIQUE(batch_number, recall_id)
);
CREATE INDEX IF NOT EXISTS idx_recall_notification_locks_status ON recall_notification_locks(lock_status, batch_number, last_checked_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_internal_link_suggestions (
  local_seo_internal_link_suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  suggested_anchor TEXT,
  reason TEXT,
  suggestion_status TEXT NOT NULL DEFAULT 'needs_review',
  score INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_path, target_path, suggested_anchor)
);
CREATE INDEX IF NOT EXISTS idx_local_link_suggestions_status ON local_seo_internal_link_suggestions(suggestion_status, score DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_search_console_trends (
  local_seo_search_console_trend_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  query_text TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  average_position REAL NOT NULL DEFAULT 0,
  period_start TEXT,
  period_end TEXT,
  trend_status TEXT NOT NULL DEFAULT 'imported',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_search_console_trends_page ON local_seo_search_console_trends(page_path, period_end DESC, impressions DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_bakes (
  local_business_schema_bake_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_setting_id INTEGER,
  bake_status TEXT NOT NULL DEFAULT 'draft',
  target_paths_json TEXT NOT NULL DEFAULT '[]',
  schema_json TEXT NOT NULL DEFAULT '{}',
  output_path TEXT DEFAULT 'data/site/local-business-schema.json',
  baked_by_user_id INTEGER,
  baked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_bakes_status ON local_business_schema_bakes(bake_status, baked_at DESC);

CREATE TABLE IF NOT EXISTS deployment_rollback_checklist_rows (
  deployment_rollback_checklist_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_history_id INTEGER,
  build_label TEXT,
  checklist_key TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  checklist_status TEXT NOT NULL DEFAULT 'not_checked',
  required_before_rollback INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label, checklist_key)
);
CREATE INDEX IF NOT EXISTS idx_deployment_rollback_checklist_status ON deployment_rollback_checklist_rows(build_label, checklist_status, required_before_rollback);

CREATE TABLE IF NOT EXISTS cloudflare_deployment_import_runs (
  cloudflare_deployment_import_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_status TEXT NOT NULL DEFAULT 'not_configured',
  account_id_present INTEGER NOT NULL DEFAULT 0,
  project_name_present INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  response_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_cloudflare_import_runs_status ON cloudflare_deployment_import_runs(import_status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_notification_routes (
  admin_notification_route_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_key TEXT NOT NULL UNIQUE,
  route_label TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'preflight',
  destination_page TEXT NOT NULL DEFAULT '/admin/',
  min_severity TEXT NOT NULL DEFAULT 'warn',
  route_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_notification_routes_status ON admin_notification_routes(route_status, source_kind, min_severity);

CREATE TABLE IF NOT EXISTS local_business_schema_extended_fields (
  local_business_schema_extended_field_id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_business_schema_setting_id INTEGER,
  opening_hours_json TEXT NOT NULL DEFAULT '[]',
  logo_url TEXT,
  image_url TEXT,
  payment_accepted_json TEXT NOT NULL DEFAULT '["Cash","Credit Card","Debit","E-transfer"]',
  price_range TEXT DEFAULT '$$',
  address_json TEXT NOT NULL DEFAULT '{}',
  geo_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(local_business_schema_setting_id)
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_extended_fields_setting ON local_business_schema_extended_fields(local_business_schema_setting_id, updated_at DESC);

INSERT OR IGNORE INTO admin_notification_routes (route_key, route_label, source_kind, destination_page, min_severity, route_status, created_at, updated_at)
VALUES
  ('preflight_blockers_dashboard', 'Preflight blockers to dashboard', 'preflight', '/admin/deployment-preflight/', 'fail', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('release_manifest_dashboard', 'Release manifest diffs to release control', 'release', '/admin/release-control/', 'warn', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recall_lock_dashboard', 'Recall locks to recall admin', 'recall', '/admin/release-control/#recall-locks', 'warn', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_176_release_safety_controls',
  'database_build176_release_safety_controls.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Adds safe deploy package download tracking, live manifest diffs, marketplace validation previews, Product QA preview items, recall notification locks, gift-card webhook signature checks, local SEO link/trend rows, richer LocalBusiness bake tracking, rollback checklist rows, Cloudflare deployment import runs, and notification routes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_176_release_safety_controls');



-- Build 177: deploy-readiness score, Cloudflare import, rollback controls, exact manifest diff rows, QA approvals, recall/customer previews, R2 private evidence test rows, and LocalBusiness JSON-LD injection targets.
-- Safe to run after Build 176; additive only.

CREATE TABLE IF NOT EXISTS release_manifest_diff_items (
  release_manifest_diff_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  release_manifest_live_diff_id INTEGER,
  build_label TEXT,
  file_path TEXT NOT NULL,
  diff_kind TEXT NOT NULL DEFAULT 'changed',
  expected_sha256 TEXT,
  deployed_sha256 TEXT,
  item_status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_release_manifest_diff_items_diff ON release_manifest_diff_items(release_manifest_live_diff_id, diff_kind, item_status);
CREATE INDEX IF NOT EXISTS idx_release_manifest_diff_items_file ON release_manifest_diff_items(file_path, diff_kind);

CREATE TABLE IF NOT EXISTS deployment_readiness_scores (
  deployment_readiness_score_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  score_status TEXT NOT NULL DEFAULT 'not_ready',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  manifest_blocker_count INTEGER NOT NULL DEFAULT 0,
  smoke_blocker_count INTEGER NOT NULL DEFAULT 0,
  rollback_blocker_count INTEGER NOT NULL DEFAULT 0,
  d1_marker_count INTEGER NOT NULL DEFAULT 0,
  score_json TEXT NOT NULL DEFAULT '{}',
  scored_by_user_id INTEGER,
  scored_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_scores_build ON deployment_readiness_scores(build_label, score_status, scored_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_approvals (
  product_qa_bulk_fix_approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'manual_only',
  approval_scope TEXT NOT NULL DEFAULT 'preview_group',
  approval_notes TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_bulk_fix_approvals_queue ON product_qa_bulk_fix_approvals(product_qa_bulk_fix_queue_id, approval_status, approved_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_channel_validation_rule_edits (
  marketplace_channel_validation_rule_edit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  column_key TEXT NOT NULL,
  rule_kind TEXT NOT NULL DEFAULT 'required_column',
  is_required INTEGER NOT NULL DEFAULT 1,
  severity TEXT NOT NULL DEFAULT 'blocker',
  rule_status TEXT NOT NULL DEFAULT 'active',
  edited_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, column_key, rule_kind)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_rule_edits_channel ON marketplace_channel_validation_rule_edits(channel, rule_status, severity);

CREATE TABLE IF NOT EXISTS recall_customer_match_previews (
  recall_customer_match_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  product_id INTEGER,
  order_id INTEGER,
  customer_email TEXT,
  customer_name TEXT,
  match_source TEXT NOT NULL DEFAULT 'order_product_batch',
  preview_status TEXT NOT NULL DEFAULT 'needs_review',
  notification_subject TEXT,
  notification_body TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_customer_matches_batch ON recall_customer_match_previews(batch_number, preview_status, created_at DESC);

CREATE TABLE IF NOT EXISTS r2_signed_download_health_tests (
  r2_signed_download_health_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_kind TEXT NOT NULL DEFAULT 'create_get_delete',
  bucket_label TEXT,
  object_key TEXT,
  create_status TEXT NOT NULL DEFAULT 'not_run',
  get_status TEXT NOT NULL DEFAULT 'not_run',
  delete_status TEXT NOT NULL DEFAULT 'not_run',
  checksum_sha256 TEXT,
  bytes_tested INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_r2_signed_download_tests_status ON r2_signed_download_health_tests(test_kind, create_status, get_status, delete_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS accounting_zip_checksum_links (
  accounting_zip_checksum_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  accounting_evidence_bundle_checksum_id INTEGER,
  safe_deploy_package_download_id INTEGER,
  period_month TEXT,
  zip_sha256 TEXT,
  link_status TEXT NOT NULL DEFAULT 'linked',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_accounting_zip_checksum_links_period ON accounting_zip_checksum_links(period_month, link_status, created_at DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_injection_targets (
  local_business_schema_injection_target_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  injection_status TEXT NOT NULL DEFAULT 'queued',
  schema_source TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  last_baked_at TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_business_injection_targets_status ON local_business_schema_injection_targets(injection_status, page_path);

CREATE TABLE IF NOT EXISTS dashboard_notification_cards (
  dashboard_notification_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_kind TEXT NOT NULL,
  source_id INTEGER,
  card_title TEXT NOT NULL,
  card_body TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  destination_page TEXT NOT NULL DEFAULT '/admin/',
  card_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dashboard_notification_cards_status ON dashboard_notification_cards(card_status, severity, created_at DESC);

INSERT OR IGNORE INTO local_business_schema_injection_targets (page_path, injection_status, schema_source, notes, created_at, updated_at)
VALUES
  ('/', 'queued', 'data/site/local-business-schema.json', 'Homepage JSON-LD target for LocalBusiness bake.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('/handmade-jewelry-ontario/', 'queued', 'data/site/local-business-schema.json', 'Local handmade jewelry landing page JSON-LD target.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('/custom-gifts-southern-ontario/', 'queued', 'data/site/local-business-schema.json', 'Custom gifts local landing page JSON-LD target.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('/laser-engraving-ontario/', 'queued', 'data/site/local-business-schema.json', 'Laser engraving local landing page JSON-LD target.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_177_deploy_score_and_controls',
  'database_build177_deploy_score_and_controls.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Adds deploy-readiness scores, real Cloudflare deployment import storage, exact manifest diff item rows, rollback status controls, Product QA preview approvals and safe image-alt apply logging, marketplace rule editor rows, recall customer preview rows, private R2 evidence test rows, accounting ZIP checksum links, LocalBusiness JSON-LD injection targets, and dashboard notification cards.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_177_deploy_score_and_controls');

-- Build 178: deploy-readiness page, promote-live guardrails, marketplace row validation, recall copy review, webhook/R2 verification rows, local SEO chart/map helpers, LocalBusiness edit drafts, and notification snooze controls.

CREATE TABLE IF NOT EXISTS deployment_promote_live_checklist (
  deployment_promote_live_checklist_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  checklist_key TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  checklist_status TEXT NOT NULL DEFAULT 'needs_review',
  required_to_promote INTEGER NOT NULL DEFAULT 1,
  source_kind TEXT,
  source_id INTEGER,
  blocking_reason TEXT,
  resolved_note TEXT,
  resolved_by_user_id INTEGER,
  resolved_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label, checklist_key)
);
CREATE INDEX IF NOT EXISTS idx_deployment_promote_live_checklist_status ON deployment_promote_live_checklist(build_label, checklist_status, required_to_promote);

CREATE TABLE IF NOT EXISTS deployment_readiness_drilldown_rows (
  deployment_readiness_drilldown_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_key TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  row_label TEXT NOT NULL,
  row_detail TEXT,
  destination_page TEXT,
  drilldown_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_drilldown_rows_status ON deployment_readiness_drilldown_rows(build_label, severity, drilldown_status, created_at DESC);

CREATE TABLE IF NOT EXISTS release_manifest_diff_view_filters (
  release_manifest_diff_view_filter_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_key TEXT NOT NULL UNIQUE,
  filter_label TEXT NOT NULL,
  diff_kind TEXT,
  path_contains TEXT,
  item_status TEXT,
  sort_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_apply_confirmations (
  product_qa_bulk_fix_apply_confirmation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER NOT NULL,
  confirmation_key TEXT NOT NULL DEFAULT 'apply_confirmed',
  confirmation_status TEXT NOT NULL DEFAULT 'pending',
  confirmed_by_user_id INTEGER,
  confirmed_at TEXT,
  confirmation_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_qa_bulk_fix_queue_id, confirmation_key)
);
CREATE INDEX IF NOT EXISTS idx_product_qa_apply_confirmations_status ON product_qa_bulk_fix_apply_confirmations(confirmation_status, confirmed_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_safe_apply_events (
  product_qa_safe_apply_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER,
  apply_kind TEXT NOT NULL,
  apply_status TEXT NOT NULL DEFAULT 'preview_only',
  affected_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  before_after_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_safe_apply_events_kind ON product_qa_safe_apply_events(apply_kind, apply_status, created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_export_row_validation_results (
  marketplace_export_row_validation_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  product_id INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'needs_review',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  missing_fields_json TEXT NOT NULL DEFAULT '[]',
  row_payload_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_row_validation_channel ON marketplace_export_row_validation_results(channel, validation_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recall_customer_notification_copy_reviews (
  recall_customer_notification_copy_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  recall_customer_match_preview_id INTEGER,
  batch_number TEXT NOT NULL,
  customer_email TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  subject_preview TEXT,
  body_preview TEXT,
  compliance_notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_copy_reviews_status ON recall_customer_notification_copy_reviews(batch_number, review_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recall_compliance_signature_attachments (
  recall_compliance_signature_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  candle_soap_batch_recall_id INTEGER,
  batch_number TEXT NOT NULL,
  attachment_kind TEXT NOT NULL DEFAULT 'signature_evidence',
  signer_name TEXT,
  evidence_url TEXT,
  r2_object_key TEXT,
  attachment_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_signature_attachments_batch ON recall_compliance_signature_attachments(batch_number, attachment_status, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_webhook_signature_verification_logs (
  gift_card_webhook_signature_verification_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  signature_status TEXT NOT NULL DEFAULT 'not_checked',
  algorithm TEXT,
  header_snapshot_json TEXT NOT NULL DEFAULT '{}',
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  verification_notes TEXT,
  event_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gift_card_webhook_verification_provider ON gift_card_webhook_signature_verification_logs(provider, signature_status, created_at DESC);

CREATE TABLE IF NOT EXISTS r2_signed_url_verification_results (
  r2_signed_url_verification_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket_label TEXT NOT NULL,
  object_key TEXT,
  signed_url_status TEXT NOT NULL DEFAULT 'not_configured',
  put_status TEXT NOT NULL DEFAULT 'not_run',
  get_status TEXT NOT NULL DEFAULT 'not_run',
  delete_status TEXT NOT NULL DEFAULT 'not_run',
  expires_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_r2_signed_url_verification_status ON r2_signed_url_verification_results(signed_url_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_search_console_chart_points (
  local_seo_search_console_chart_point_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  query_text TEXT,
  metric_kind TEXT NOT NULL DEFAULT 'impressions',
  metric_value REAL NOT NULL DEFAULT 0,
  period_start TEXT,
  period_end TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_seo_chart_points_page ON local_seo_search_console_chart_points(page_path, metric_kind, period_end DESC);

CREATE TABLE IF NOT EXISTS internal_link_map_edges (
  internal_link_map_edge_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  anchor_text TEXT,
  edge_status TEXT NOT NULL DEFAULT 'suggested',
  score INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_path, target_path, anchor_text)
);
CREATE INDEX IF NOT EXISTS idx_internal_link_map_edges_status ON internal_link_map_edges(edge_status, score DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_edit_drafts (
  local_business_schema_edit_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_status TEXT NOT NULL DEFAULT 'draft',
  business_name TEXT,
  canonical_url TEXT,
  telephone TEXT,
  email TEXT,
  area_served_json TEXT NOT NULL DEFAULT '[]',
  service_types_json TEXT NOT NULL DEFAULT '[]',
  same_as_json TEXT NOT NULL DEFAULT '[]',
  opening_hours_json TEXT NOT NULL DEFAULT '[]',
  address_json TEXT NOT NULL DEFAULT '{}',
  geo_json TEXT NOT NULL DEFAULT '{}',
  draft_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_edit_drafts_status ON local_business_schema_edit_drafts(draft_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS structured_data_validation_hints (
  structured_data_validation_hint_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  hint_status TEXT NOT NULL DEFAULT 'needs_review',
  hint_severity TEXT NOT NULL DEFAULT 'info',
  hint_label TEXT NOT NULL,
  hint_detail TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_structured_data_validation_hints_page ON structured_data_validation_hints(page_path, schema_type, hint_status);

CREATE TABLE IF NOT EXISTS release_package_previous_zip_comparisons (
  release_package_previous_zip_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  current_build_label TEXT NOT NULL,
  previous_build_label TEXT,
  current_manifest_hash TEXT,
  previous_manifest_hash TEXT,
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  comparison_json TEXT NOT NULL DEFAULT '{}',
  comparison_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_release_zip_comparisons_build ON release_package_previous_zip_comparisons(current_build_label, created_at DESC);

CREATE TABLE IF NOT EXISTS dashboard_notification_card_snoozes (
  dashboard_notification_card_snooze_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_notification_card_id INTEGER NOT NULL,
  snooze_until TEXT,
  snooze_status TEXT NOT NULL DEFAULT 'active',
  snooze_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dashboard_card_snoozes_status ON dashboard_notification_card_snoozes(snooze_status, snooze_until);

CREATE TABLE IF NOT EXISTS mobile_release_control_cards (
  mobile_release_control_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_key TEXT NOT NULL UNIQUE,
  card_label TEXT NOT NULL,
  destination_page TEXT NOT NULL DEFAULT '/admin/release-control/',
  card_status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mobile_release_control_cards_status ON mobile_release_control_cards(card_status, sort_order);

INSERT OR IGNORE INTO release_manifest_diff_view_filters (filter_key, filter_label, diff_kind, path_contains, item_status, sort_json, created_at, updated_at)
VALUES
  ('changed_public_pages', 'Changed public pages', 'changed', '.html', 'open', '{"sort":"file_path"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('missing_schema_or_data', 'Missing schema/data files', 'missing', 'data/', 'open', '{"sort":"file_path"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('changed_functions', 'Changed API functions', 'changed', 'functions/', 'open', '{"sort":"file_path"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO mobile_release_control_cards (card_key, card_label, destination_page, card_status, sort_order, payload_json, created_at, updated_at)
VALUES
  ('deploy_score', 'Deploy score', '/admin/deploy-readiness/', 'active', 10, '{"view":"score"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manifest_diff', 'Manifest diff', '/admin/release-control/#manifest-diff', 'active', 20, '{"view":"manifest"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recall_locks', 'Recall locks', '/admin/release-control/#recall-locks', 'active', 30, '{"view":"recall"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('safe_zip', 'Safe ZIP', '/admin/safe-deploy-package/', 'active', 40, '{"view":"zip"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('promote_live', 'Promote-live checklist', '/admin/deploy-readiness/#promote-live', 'active', 50, '{"view":"promote"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_178_promote_live_controls',
  'database_build178_promote_live_controls.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Adds deploy-readiness page support, promote-live checklist rows, manifest filters, QA apply confirmations, marketplace row validation, recall copy review/signature evidence rows, webhook/R2 verification logs, local SEO charts/link maps, LocalBusiness edit drafts, structured-data hints, dashboard snooze controls, mobile release cards, and previous ZIP comparison rows.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_178_promote_live_controls');



-- Build 179 promotion control additive migration.
-- Build 179 promotion control, local SEO visuals, provider verification, and go-live gates.
-- Safe additive migration. Run after database_build178_promote_live_controls.sql.

CREATE TABLE IF NOT EXISTS product_qa_safe_apply_rules (
  product_qa_safe_apply_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_code TEXT NOT NULL UNIQUE,
  apply_field TEXT NOT NULL,
  rule_status TEXT NOT NULL DEFAULT 'approval_required',
  requires_confirmation INTEGER NOT NULL DEFAULT 1,
  max_rows_per_run INTEGER NOT NULL DEFAULT 25,
  safety_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_seo_visual_chart_configs (
  local_seo_visual_chart_config_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  chart_key TEXT NOT NULL,
  chart_label TEXT NOT NULL,
  metric_kind TEXT NOT NULL DEFAULT 'impressions',
  period_label TEXT,
  chart_status TEXT NOT NULL DEFAULT 'active',
  config_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, chart_key)
);

CREATE TABLE IF NOT EXISTS internal_link_graph_snapshots (
  internal_link_graph_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_label TEXT NOT NULL,
  node_count INTEGER NOT NULL DEFAULT 0,
  edge_count INTEGER NOT NULL DEFAULT 0,
  missing_link_count INTEGER NOT NULL DEFAULT 0,
  graph_json TEXT NOT NULL DEFAULT '{}',
  snapshot_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_business_schema_bake_approvals (
  local_business_schema_bake_approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_business_schema_edit_draft_id INTEGER,
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  target_paths_json TEXT NOT NULL DEFAULT '[]',
  schema_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  bake_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_webhook_signature_secret_checks (
  provider_webhook_signature_secret_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  expected_secret_binding TEXT,
  signature_header_name TEXT,
  timestamp_header_name TEXT,
  secret_present INTEGER NOT NULL DEFAULT 0,
  signature_header_present INTEGER NOT NULL DEFAULT 0,
  timestamp_header_present INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'not_checked',
  verification_notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS r2_signed_url_expiry_tests (
  r2_signed_url_expiry_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket_label TEXT NOT NULL,
  object_key TEXT,
  create_status TEXT NOT NULL DEFAULT 'not_run',
  signed_url_status TEXT NOT NULL DEFAULT 'not_run',
  expiry_status TEXT NOT NULL DEFAULT 'not_run',
  expires_seconds INTEGER NOT NULL DEFAULT 60,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS recall_signature_evidence_uploads (
  recall_signature_evidence_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  evidence_url TEXT,
  r2_object_key TEXT,
  upload_status TEXT NOT NULL DEFAULT 'metadata_only',
  uploaded_by_user_id INTEGER,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS recall_notification_release_gates (
  recall_notification_release_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  copy_review_status TEXT NOT NULL DEFAULT 'needs_review',
  signature_status TEXT NOT NULL DEFAULT 'needs_review',
  customer_match_status TEXT NOT NULL DEFAULT 'needs_review',
  release_status TEXT NOT NULL DEFAULT 'blocked',
  gate_notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_number, recall_id)
);

CREATE TABLE IF NOT EXISTS accounting_zip_export_links (
  accounting_zip_export_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  accountant_export_id INTEGER,
  safe_deploy_package_download_id INTEGER,
  zip_sha256 TEXT,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  evidence_file_count INTEGER NOT NULL DEFAULT 0,
  link_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS previous_zip_manifest_imports (
  previous_zip_manifest_import_id INTEGER PRIMARY KEY AUTOINCREMENT,
  previous_build_label TEXT,
  current_build_label TEXT NOT NULL,
  previous_manifest_json TEXT NOT NULL DEFAULT '{}',
  current_manifest_json TEXT NOT NULL DEFAULT '{}',
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  import_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS dashboard_notification_card_actions (
  dashboard_notification_card_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_notification_card_id INTEGER NOT NULL,
  action_kind TEXT NOT NULL DEFAULT 'snooze',
  action_status TEXT NOT NULL DEFAULT 'active',
  snooze_until TEXT,
  action_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mobile_release_control_render_preferences (
  mobile_release_control_render_preference_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  preference_key TEXT NOT NULL DEFAULT 'mobile_release_cards',
  compact_mode INTEGER NOT NULL DEFAULT 1,
  large_tap_targets INTEGER NOT NULL DEFAULT 1,
  visible_cards_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, preference_key)
);

CREATE TABLE IF NOT EXISTS structured_data_page_previews (
  structured_data_page_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  preview_status TEXT NOT NULL DEFAULT 'needs_review',
  jsonld_excerpt TEXT,
  issue_count INTEGER NOT NULL DEFAULT 0,
  validation_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, schema_type)
);

CREATE TABLE IF NOT EXISTS marketplace_export_download_gates (
  marketplace_export_download_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_history_id INTEGER,
  validation_run_id INTEGER,
  gate_status TEXT NOT NULL DEFAULT 'blocked_pending_validation',
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  manual_override_required INTEGER NOT NULL DEFAULT 0,
  override_by_user_id INTEGER,
  override_at TEXT,
  gate_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, export_history_id)
);

CREATE TABLE IF NOT EXISTS release_rollback_row_actions (
  release_rollback_row_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_rollback_checklist_row_id INTEGER NOT NULL,
  action_status TEXT NOT NULL DEFAULT 'not_checked',
  action_note TEXT,
  acted_by_user_id INTEGER,
  acted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS release_manifest_path_filter_runs (
  release_manifest_path_filter_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_key TEXT NOT NULL,
  diff_kind TEXT,
  path_contains TEXT,
  matched_count INTEGER NOT NULL DEFAULT 0,
  run_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  result_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS deployment_readiness_markdown_exports (
  deployment_readiness_markdown_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  markdown_body TEXT NOT NULL,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloudflare_deployment_release_matches (
  cloudflare_deployment_release_match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_history_id INTEGER,
  build_label TEXT,
  branch_name TEXT,
  commit_sha TEXT,
  manifest_hash TEXT,
  match_status TEXT NOT NULL DEFAULT 'needs_review',
  match_score INTEGER NOT NULL DEFAULT 0,
  matched_by_user_id INTEGER,
  matched_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS promote_live_attempts (
  promote_live_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  attempt_status TEXT NOT NULL DEFAULT 'blocked',
  readiness_score INTEGER NOT NULL DEFAULT 0,
  blocker_count INTEGER NOT NULL DEFAULT 0,
  checklist_blocker_count INTEGER NOT NULL DEFAULT 0,
  smoke_blocker_count INTEGER NOT NULL DEFAULT 0,
  manifest_blocker_count INTEGER NOT NULL DEFAULT 0,
  d1_marker_blocker_count INTEGER NOT NULL DEFAULT 0,
  attempted_by_user_id INTEGER,
  attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS post_promotion_incident_watch_runs (
  post_promotion_incident_watch_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  watch_status TEXT NOT NULL DEFAULT 'not_run',
  runtime_404_count INTEGER NOT NULL DEFAULT 0,
  runtime_500_count INTEGER NOT NULL DEFAULT 0,
  provider_failure_count INTEGER NOT NULL DEFAULT 0,
  incident_rows_created INTEGER NOT NULL DEFAULT 0,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT OR IGNORE INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_179_promotion_control', 'database_build179_promotion_control.sql', CURRENT_TIMESTAMP, 'Build 179 promotion control, LocalBusiness bake approvals, provider/R2 verification, recall gates, marketplace gates, release matching, and post-promotion incident watcher.');

-- Build 180: Go-live execution controls, direct endpoint gates, visual SEO helpers, and post-promotion scheduling.
-- Safe additive migration only. Run after database_build179_promotion_control.sql.

CREATE TABLE IF NOT EXISTS product_qa_safe_apply_runs (
  product_qa_safe_apply_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 180',
  product_qa_bulk_fix_queue_id INTEGER,
  blocker_code TEXT NOT NULL,
  run_mode TEXT NOT NULL DEFAULT 'preview',
  apply_status TEXT NOT NULL DEFAULT 'preview_only',
  affected_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  run_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_safe_apply_runs_queue ON product_qa_safe_apply_runs(product_qa_bulk_fix_queue_id, blocker_code, created_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_chart_render_runs (
  local_seo_chart_render_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  metric_kind TEXT NOT NULL DEFAULT 'impressions',
  point_count INTEGER NOT NULL DEFAULT 0,
  min_value REAL NOT NULL DEFAULT 0,
  max_value REAL NOT NULL DEFAULT 0,
  svg_markup TEXT,
  render_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_seo_chart_render_runs_page ON local_seo_chart_render_runs(page_path, metric_kind, created_at DESC);

CREATE TABLE IF NOT EXISTS internal_link_graph_interactions (
  internal_link_graph_interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT,
  target_path TEXT,
  filter_kind TEXT NOT NULL DEFAULT 'click_through',
  interaction_status TEXT NOT NULL DEFAULT 'prepared',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_business_d1_export_bakes (
  local_business_d1_export_bake_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_table TEXT NOT NULL DEFAULT 'local_business_schema_settings',
  output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  target_paths_json TEXT NOT NULL DEFAULT '[]',
  schema_json TEXT NOT NULL DEFAULT '{}',
  bake_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_webhook_verification_runs (
  provider_webhook_verification_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  endpoint_path TEXT NOT NULL,
  signature_header TEXT,
  timestamp_header TEXT,
  verification_status TEXT NOT NULL DEFAULT 'setup_required',
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_provider_webhook_verification_runs_provider ON provider_webhook_verification_runs(provider, checked_at DESC);

CREATE TABLE IF NOT EXISTS r2_signed_download_route_tests (
  r2_signed_download_route_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL DEFAULT '/api/admin/private-evidence-download',
  object_key TEXT,
  token_status TEXT NOT NULL DEFAULT 'not_run',
  download_status TEXT NOT NULL DEFAULT 'not_run',
  expiry_status TEXT NOT NULL DEFAULT 'not_run',
  expires_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recall_evidence_ui_uploads (
  recall_evidence_ui_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  source_page TEXT NOT NULL DEFAULT '/admin/candle-soap-recalls/',
  upload_status TEXT NOT NULL DEFAULT 'needs_upload',
  evidence_url TEXT,
  r2_object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recall_endpoint_gate_checks (
  recall_endpoint_gate_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  endpoint_path TEXT NOT NULL DEFAULT '/api/admin/candle-soap-recall-notifications',
  legacy_lock_status TEXT,
  release_gate_status TEXT,
  endpoint_gate_status TEXT NOT NULL DEFAULT 'blocked',
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_recall_endpoint_gate_checks_batch ON recall_endpoint_gate_checks(batch_number, checked_at DESC);

CREATE TABLE IF NOT EXISTS accountant_zip_endpoint_logs (
  accountant_zip_endpoint_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  endpoint_path TEXT NOT NULL DEFAULT '/api/admin/accounting-monthly-summary-export',
  zip_sha256 TEXT,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  evidence_file_count INTEGER NOT NULL DEFAULT 0,
  log_status TEXT NOT NULL DEFAULT 'prepared',
  safe_deploy_package_download_id INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS previous_zip_binary_comparisons (
  previous_zip_binary_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  previous_filename TEXT,
  current_filename TEXT,
  previous_sha256 TEXT,
  current_sha256 TEXT,
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  comparison_status TEXT NOT NULL DEFAULT 'prepared',
  comparison_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_notification_visibility_states (
  dashboard_notification_visibility_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_notification_card_id INTEGER,
  visibility_status TEXT NOT NULL DEFAULT 'visible',
  snooze_until TEXT,
  dismissed_at TEXT,
  user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dashboard_notification_card_id, user_id)
);

CREATE TABLE IF NOT EXISTS mobile_release_control_layout_runs (
  mobile_release_control_layout_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  layout_key TEXT NOT NULL DEFAULT 'phone_release_cards',
  rendered_card_count INTEGER NOT NULL DEFAULT 0,
  large_tap_targets INTEGER NOT NULL DEFAULT 1,
  layout_status TEXT NOT NULL DEFAULT 'prepared',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployment_preflight_structured_data_excerpts (
  deployment_preflight_structured_data_excerpt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  excerpt_status TEXT NOT NULL DEFAULT 'needs_review',
  jsonld_excerpt TEXT,
  issue_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, schema_type)
);

CREATE TABLE IF NOT EXISTS marketplace_download_block_events (
  marketplace_download_block_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  gate_status TEXT NOT NULL,
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 1,
  requested_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS release_control_row_status_actions (
  release_control_row_status_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  row_kind TEXT NOT NULL,
  source_row_id INTEGER,
  action_status TEXT NOT NULL DEFAULT 'not_checked',
  action_note TEXT,
  acted_by_user_id INTEGER,
  acted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS release_manifest_filter_drawer_runs (
  release_manifest_filter_drawer_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_key TEXT NOT NULL,
  path_contains TEXT,
  diff_kind TEXT,
  matched_count INTEGER NOT NULL DEFAULT 0,
  drawer_status TEXT NOT NULL DEFAULT 'prepared',
  result_json TEXT NOT NULL DEFAULT '[]',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deploy_readiness_score_trend_exports (
  deploy_readiness_score_trend_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  point_count INTEGER NOT NULL DEFAULT 0,
  latest_score INTEGER NOT NULL DEFAULT 0,
  markdown_body TEXT NOT NULL,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloudflare_deployment_auto_matches (
  cloudflare_deployment_auto_match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_history_id INTEGER,
  build_label TEXT,
  branch_name TEXT,
  commit_sha TEXT,
  manifest_hash TEXT,
  auto_match_status TEXT NOT NULL DEFAULT 'needs_review',
  match_score INTEGER NOT NULL DEFAULT 0,
  matched_by_user_id INTEGER,
  matched_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS promote_live_ui_gate_states (
  promote_live_ui_gate_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  promote_button_status TEXT NOT NULL DEFAULT 'disabled',
  readiness_score INTEGER NOT NULL DEFAULT 0,
  blocker_count INTEGER NOT NULL DEFAULT 0,
  gate_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS post_promotion_watcher_schedule_runs (
  post_promotion_watcher_schedule_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  schedule_kind TEXT NOT NULL DEFAULT 'manual',
  watch_window_minutes INTEGER NOT NULL DEFAULT 60,
  run_status TEXT NOT NULL DEFAULT 'queued',
  triggered_from_path TEXT DEFAULT '/admin/post-deploy-smoke-tests/',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_180_go_live_execution', 'database_build180_go_live_execution.sql', CURRENT_TIMESTAMP, 'Safe additive Build 180 schema for direct gated apply/download/send/visibility controls.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

-- Devil n Dove Build 181 — live ops follow-through, private evidence downloads, marketplace overrides, and SEO content refresh tracking
-- Safe additive D1 migration. Run after database_build180_go_live_execution.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS private_evidence_download_tokens (
  private_evidence_download_token_id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT NOT NULL,
  bucket_label TEXT NOT NULL DEFAULT 'accounting_evidence',
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  max_download_count INTEGER NOT NULL DEFAULT 1,
  download_count INTEGER NOT NULL DEFAULT 0,
  token_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_downloaded_at TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_private_evidence_tokens_object ON private_evidence_download_tokens(object_key, bucket_label, token_status);
CREATE INDEX IF NOT EXISTS idx_private_evidence_tokens_expiry ON private_evidence_download_tokens(expires_at, token_status);

CREATE TABLE IF NOT EXISTS private_evidence_download_audit_events (
  private_evidence_download_audit_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT,
  bucket_label TEXT,
  event_status TEXT NOT NULL DEFAULT 'attempted',
  http_status INTEGER,
  token_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_private_evidence_download_audit_object ON private_evidence_download_audit_events(object_key, created_at);

CREATE TABLE IF NOT EXISTS product_qa_blocker_preview_counts (
  product_qa_blocker_preview_count_id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_code TEXT NOT NULL,
  affected_products INTEGER NOT NULL DEFAULT 0,
  preview_item_count INTEGER NOT NULL DEFAULT 0,
  safe_apply_candidate_count INTEGER NOT NULL DEFAULT 0,
  manual_only_count INTEGER NOT NULL DEFAULT 0,
  latest_queue_id INTEGER,
  count_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_qa_blocker_preview_counts_code ON product_qa_blocker_preview_counts(blocker_code, created_at);

CREATE TABLE IF NOT EXISTS marketplace_export_gate_overrides (
  marketplace_export_gate_override_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  gate_key TEXT NOT NULL DEFAULT 'download_gate',
  override_status TEXT NOT NULL DEFAULT 'requested',
  reason TEXT,
  expires_at TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_gate_overrides_channel ON marketplace_export_gate_overrides(channel, override_status, expires_at);

CREATE TABLE IF NOT EXISTS marketplace_gate_badge_snapshots (
  marketplace_gate_badge_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  badge_status TEXT NOT NULL DEFAULT 'unknown',
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  badge_label TEXT,
  blocker_reason TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_gate_badges_channel ON marketplace_gate_badge_snapshots(channel, created_at);

CREATE TABLE IF NOT EXISTS recall_evidence_upload_requests (
  recall_evidence_upload_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  requested_file_kind TEXT NOT NULL DEFAULT 'signature_evidence',
  upload_widget_status TEXT NOT NULL DEFAULT 'needs_upload',
  r2_target_prefix TEXT,
  evidence_url TEXT,
  r2_object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_recall_upload_requests_batch ON recall_evidence_upload_requests(batch_number, upload_widget_status);

CREATE TABLE IF NOT EXISTS local_business_admin_export_runs (
  local_business_admin_export_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_table TEXT NOT NULL DEFAULT 'local_business_schema_settings',
  output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  row_count INTEGER NOT NULL DEFAULT 0,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  export_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public_page_content_refreshes (
  public_page_content_refresh_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  target_phrase TEXT NOT NULL,
  placement_kind TEXT NOT NULL DEFAULT 'body_copy',
  refresh_status TEXT NOT NULL DEFAULT 'applied_static',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_public_content_refresh_page ON public_page_content_refreshes(page_path, target_phrase);

CREATE TABLE IF NOT EXISTS provider_webhook_crypto_test_vectors (
  provider_webhook_crypto_test_vector_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'hmac-sha256',
  header_name TEXT,
  test_status TEXT NOT NULL DEFAULT 'documented',
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manifest_drawer_saved_filters (
  manifest_drawer_saved_filter_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_label TEXT NOT NULL,
  path_prefix TEXT,
  diff_kind TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_notification_action_buttons (
  dashboard_notification_action_button_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_kind TEXT NOT NULL,
  source_row_id INTEGER,
  action_kind TEXT NOT NULL DEFAULT 'snooze',
  button_label TEXT,
  action_status TEXT NOT NULL DEFAULT 'available',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS post_promotion_watcher_execution_logs (
  post_promotion_watcher_execution_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_promotion_watcher_schedule_run_id INTEGER,
  build_label TEXT NOT NULL DEFAULT 'Build 181',
  execution_status TEXT NOT NULL DEFAULT 'queued',
  checked_url_count INTEGER NOT NULL DEFAULT 0,
  failed_url_count INTEGER NOT NULL DEFAULT 0,
  incident_count INTEGER NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Admin pages', 'admin/', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Admin pages');
INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Functions', 'functions/', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Functions');
INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Schema SQL', 'database_', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Schema SQL');
INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Local SEO data', 'data/site/', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Local SEO data');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_181_live_ops_followthrough', 'database_build181_live_ops_followthrough.sql', CURRENT_TIMESTAMP, 'Safe additive Build 181 schema for private evidence signed downloads, recall upload requests, QA blocker counts, marketplace overrides, local SEO content refresh tracking, and live-ops follow-through rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

-- Devil n Dove Build 182 — mobile/desktop parity, visual polish, SEO enrichment, and fallback safety
-- Safe additive D1 migration. Run after database_build181_live_ops_followthrough.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS desktop_mobile_parity_checks (
  desktop_mobile_parity_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  viewport_label TEXT NOT NULL DEFAULT 'mobile_390',
  check_status TEXT NOT NULL DEFAULT 'needs_review',
  desktop_note TEXT,
  mobile_note TEXT,
  issue_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_desktop_mobile_parity_page ON desktop_mobile_parity_checks(page_path, viewport_label, check_status);

CREATE TABLE IF NOT EXISTS visual_enrichment_candidates (
  visual_enrichment_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  candidate_key TEXT NOT NULL,
  visual_kind TEXT NOT NULL DEFAULT 'image_slot',
  candidate_status TEXT NOT NULL DEFAULT 'needs_review',
  placement_selector TEXT,
  asset_hint TEXT,
  alt_text_hint TEXT,
  motion_safety TEXT NOT NULL DEFAULT 'reduced_motion_safe',
  local_seo_phrase TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(page_path, candidate_key)
);
CREATE INDEX IF NOT EXISTS idx_visual_enrichment_candidates_status ON visual_enrichment_candidates(candidate_status, page_path);

CREATE TABLE IF NOT EXISTS visual_effect_safety_reviews (
  visual_effect_safety_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  effect_key TEXT NOT NULL,
  effect_status TEXT NOT NULL DEFAULT 'allowed_with_reduced_motion',
  affected_selector TEXT,
  prefers_reduced_motion_supported INTEGER NOT NULL DEFAULT 1,
  contrast_review_status TEXT NOT NULL DEFAULT 'passed_static',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_nav_touch_target_audits (
  mobile_nav_touch_target_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  target_selector TEXT NOT NULL DEFAULT '.nav a, .nav button, .btn',
  min_target_px INTEGER NOT NULL DEFAULT 44,
  audit_status TEXT NOT NULL DEFAULT 'prepared',
  issue_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_mobile_nav_touch_audits_page ON mobile_nav_touch_target_audits(page_path, created_at);

CREATE TABLE IF NOT EXISTS css_drift_review_runs (
  css_drift_review_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 182',
  css_path TEXT NOT NULL DEFAULT 'css/styles.css',
  open_brace_count INTEGER NOT NULL DEFAULT 0,
  close_brace_count INTEGER NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public_page_visual_asset_budgets (
  public_page_visual_asset_budget_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  budget_status TEXT NOT NULL DEFAULT 'prepared',
  max_inline_effects INTEGER NOT NULL DEFAULT 3,
  max_new_images INTEGER NOT NULL DEFAULT 2,
  preferred_image_ratio TEXT NOT NULL DEFAULT '4:3 or square',
  lazy_loading_required INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_public_visual_asset_budgets_page ON public_page_visual_asset_budgets(page_path, budget_status);

CREATE TABLE IF NOT EXISTS route_fallback_review_rows (
  route_fallback_review_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL,
  fallback_kind TEXT NOT NULL DEFAULT 'static_or_cached_message',
  fallback_status TEXT NOT NULL DEFAULT 'needs_live_review',
  user_message TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_route_fallback_review_rows_route ON route_fallback_review_rows(route_path, fallback_status);

CREATE TABLE IF NOT EXISTS schema_markup_validation_queue (
  schema_markup_validation_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL DEFAULT 'LocalBusiness',
  validation_status TEXT NOT NULL DEFAULT 'queued',
  source_hint TEXT NOT NULL DEFAULT 'static_jsonld',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_schema_markup_validation_queue_page ON schema_markup_validation_queue(page_path, schema_type, validation_status);

CREATE TABLE IF NOT EXISTS json_db_migration_candidates (
  json_db_migration_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_table TEXT,
  ownership_status TEXT NOT NULL DEFAULT 'needs_decision',
  duplication_risk TEXT NOT NULL DEFAULT 'medium',
  migration_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_json_db_migration_candidates_source ON json_db_migration_candidates(source_path, ownership_status);

CREATE TABLE IF NOT EXISTS visual_polish_admin_preferences (
  visual_polish_admin_preference_id INTEGER PRIMARY KEY AUTOINCREMENT,
  preference_key TEXT NOT NULL UNIQUE,
  preference_value TEXT,
  preference_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO visual_polish_admin_preferences (preference_key, preference_value, preference_status, created_at, notes)
SELECT 'default_viewport_pair', 'desktop_1440,mobile_390', 'active', CURRENT_TIMESTAMP, 'Build 182 default desktop/mobile review pair.'
WHERE NOT EXISTS (SELECT 1 FROM visual_polish_admin_preferences WHERE preference_key='default_viewport_pair');
INSERT INTO visual_polish_admin_preferences (preference_key, preference_value, preference_status, created_at, notes)
SELECT 'motion_policy', 'subtle_only_respect_reduced_motion', 'active', CURRENT_TIMESTAMP, 'Only subtle visual effects; CSS must respect prefers-reduced-motion.'
WHERE NOT EXISTS (SELECT 1 FROM visual_polish_admin_preferences WHERE preference_key='motion_policy');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_182_mobile_visual_polish', 'database_build182_mobile_visual_polish.sql', CURRENT_TIMESTAMP, 'Safe additive Build 182 schema for desktop/mobile parity checks, visual enrichment candidates, CSS drift rows, SEO structured-data validation queue, fallback review rows, and JSON-to-D1 ownership candidates.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;



-- Build 183 schema additions

-- Devil n Dove Build 183 — Visual Enrichment Studio, approved-media slots, screenshot pairs, alt-text suggestions, and low-bandwidth polish controls
-- Safe additive D1 migration. Run after database_build182_mobile_visual_polish.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS visual_candidate_media_assets (
  visual_candidate_media_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  visual_enrichment_candidate_id INTEGER,
  page_path TEXT NOT NULL,
  candidate_key TEXT,
  source_kind TEXT NOT NULL DEFAULT 'product_image',
  source_id INTEGER,
  thumbnail_url TEXT,
  image_url TEXT,
  alt_text TEXT,
  asset_status TEXT NOT NULL DEFAULT 'available',
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_visual_candidate_media_assets_candidate ON visual_candidate_media_assets(visual_enrichment_candidate_id, asset_status);
CREATE INDEX IF NOT EXISTS idx_visual_candidate_media_assets_page ON visual_candidate_media_assets(page_path, asset_status);

CREATE TABLE IF NOT EXISTS visual_parity_screenshot_pairs (
  visual_parity_screenshot_pair_id INTEGER PRIMARY KEY AUTOINCREMENT,
  desktop_mobile_parity_check_id INTEGER,
  page_path TEXT NOT NULL,
  desktop_screenshot_url TEXT,
  mobile_screenshot_url TEXT,
  desktop_object_key TEXT,
  mobile_object_key TEXT,
  pair_status TEXT NOT NULL DEFAULT 'needs_upload',
  diff_status TEXT NOT NULL DEFAULT 'not_compared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_visual_parity_screenshot_pairs_page ON visual_parity_screenshot_pairs(page_path, pair_status);

CREATE TABLE IF NOT EXISTS visual_polish_screenshot_jobs (
  visual_polish_screenshot_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  viewport_label TEXT NOT NULL DEFAULT 'mobile_390',
  job_status TEXT NOT NULL DEFAULT 'queued',
  evidence_page TEXT NOT NULL DEFAULT '/admin/dark-theme-evidence/',
  dark_theme_required INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_visual_polish_screenshot_jobs_status ON visual_polish_screenshot_jobs(job_status, page_path);

CREATE TABLE IF NOT EXISTS local_seo_visual_candidate_badges (
  local_seo_visual_candidate_badge_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  badge_label TEXT,
  badge_status TEXT NOT NULL DEFAULT 'prepared',
  candidate_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(page_path)
);

CREATE TABLE IF NOT EXISTS public_page_image_slot_assignments (
  public_page_image_slot_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  visual_enrichment_candidate_id INTEGER,
  media_asset_id INTEGER,
  assignment_status TEXT NOT NULL DEFAULT 'draft',
  h1_change_allowed INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  alt_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(page_path, slot_key)
);
CREATE INDEX IF NOT EXISTS idx_public_page_image_slot_assignments_status ON public_page_image_slot_assignments(assignment_status, page_path);

CREATE TABLE IF NOT EXISTS media_compression_budget_reports (
  media_compression_budget_report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'visual_candidate',
  source_id INTEGER,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  budget_status TEXT NOT NULL DEFAULT 'unknown_size',
  max_size_bytes INTEGER NOT NULL DEFAULT 350000,
  recommended_action TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS visual_diff_overlay_pairs (
  visual_diff_overlay_pair_id INTEGER PRIMARY KEY AUTOINCREMENT,
  screenshot_pair_id INTEGER,
  page_path TEXT NOT NULL,
  previous_image_url TEXT,
  current_image_url TEXT,
  overlay_status TEXT NOT NULL DEFAULT 'needs_review',
  difference_score INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS visual_candidate_alt_text_suggestions (
  visual_candidate_alt_text_suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT,
  visual_enrichment_candidate_id INTEGER,
  page_path TEXT NOT NULL,
  suggested_alt_text TEXT NOT NULL,
  suggestion_status TEXT NOT NULL DEFAULT 'draft',
  copied_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS schema_validation_result_imports (
  schema_validation_result_import_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL DEFAULT 'LocalBusiness',
  validator_name TEXT NOT NULL DEFAULT 'manual',
  validation_status TEXT NOT NULL DEFAULT 'needs_import',
  issue_count INTEGER NOT NULL DEFAULT 0,
  imported_by_user_id INTEGER,
  imported_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS json_db_ownership_decisions (
  json_db_ownership_decision_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_table TEXT,
  ownership_status TEXT NOT NULL DEFAULT 'needs_decision',
  decision_reason TEXT,
  decided_by_user_id INTEGER,
  decided_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_path, target_table)
);

CREATE TABLE IF NOT EXISTS public_api_fallback_preview_cards (
  public_api_fallback_preview_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint_path TEXT NOT NULL,
  customer_message TEXT NOT NULL,
  fallback_status TEXT NOT NULL DEFAULT 'prepared',
  preview_context TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mobile_visual_candidate_quick_cards (
  mobile_visual_candidate_quick_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  visual_enrichment_candidate_id INTEGER,
  page_path TEXT NOT NULL,
  quick_card_status TEXT NOT NULL DEFAULT 'ready_for_phone_review',
  tap_target_ok INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS seasonal_visual_campaigns (
  seasonal_visual_campaign_id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_key TEXT NOT NULL UNIQUE,
  campaign_label TEXT NOT NULL,
  campaign_status TEXT NOT NULL DEFAULT 'planning',
  page_path TEXT,
  image_need_count INTEGER NOT NULL DEFAULT 3,
  local_seo_phrase TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS gallery_hero_rotation_queue (
  gallery_hero_rotation_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL DEFAULT '/gallery/',
  media_asset_id INTEGER,
  image_url TEXT,
  alt_text TEXT,
  rotation_status TEXT NOT NULL DEFAULT 'candidate',
  sort_order INTEGER NOT NULL DEFAULT 0,
  approved_media_only INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_detail_visual_polish_checks (
  product_detail_visual_polish_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  product_slug TEXT,
  thumbnail_strip_status TEXT NOT NULL DEFAULT 'needs_review',
  featured_image_status TEXT NOT NULL DEFAULT 'needs_review',
  image_roles_status TEXT NOT NULL DEFAULT 'needs_review',
  mobile_zoom_status TEXT NOT NULL DEFAULT 'needs_review',
  issue_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS css_token_drift_checks (
  css_token_drift_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_key TEXT NOT NULL,
  expected_value TEXT,
  detected_value TEXT,
  drift_status TEXT NOT NULL DEFAULT 'prepared',
  token_group TEXT NOT NULL DEFAULT 'visual',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS visual_accessibility_notes (
  visual_accessibility_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  note_kind TEXT NOT NULL DEFAULT 'motion_contrast_touch',
  note_status TEXT NOT NULL DEFAULT 'prepared',
  note_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS safe_deploy_json_ownership_exports (
  safe_deploy_json_ownership_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 183',
  source_path TEXT NOT NULL,
  target_table TEXT,
  ownership_status TEXT NOT NULL DEFAULT 'documented',
  export_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public_low_bandwidth_preferences (
  public_low_bandwidth_preference_id INTEGER PRIMARY KEY AUTOINCREMENT,
  preference_key TEXT NOT NULL UNIQUE,
  preference_status TEXT NOT NULL DEFAULT 'available',
  default_value TEXT NOT NULL DEFAULT 'auto',
  customer_label TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS final_visual_deployment_report_rows (
  final_visual_deployment_report_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 183',
  row_kind TEXT NOT NULL,
  row_status TEXT NOT NULL DEFAULT 'prepared',
  row_summary TEXT NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO public_low_bandwidth_preferences (preference_key, preference_status, default_value, customer_label, created_at, notes)
SELECT 'public_low_bandwidth_mode', 'available', 'auto', 'Lighter images and quieter visual effects', CURRENT_TIMESTAMP, 'Customer-facing lighter media preference saved in browser storage and prepared for future account preference sync.'
WHERE NOT EXISTS (SELECT 1 FROM public_low_bandwidth_preferences WHERE preference_key='public_low_bandwidth_mode');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_183_visual_enrichment_studio', 'database_build183_visual_enrichment_studio.sql', CURRENT_TIMESTAMP, 'Safe additive Build 183 schema for real visual enrichment workflow: media picker assets, screenshot pairs, image slots, compression budgets, alt-text suggestions, schema imports, JSON ownership, mobile quick cards, seasonal campaigns, gallery rotation, product visual checks, CSS token drift, low-bandwidth mode, and final visual deployment report rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

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

-- Build 196: visible product correction and raw-material return audit.
-- Devil n Dove Build 196 — visible product correction and reviewed raw-material returns.
-- Run after database_build195_product_lifecycle_sku_inventory_cards.sql.
-- This migration is additive and safe to rerun.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Preserves a factual audit of raw-inventory changes made while removing an unused,
-- incorrect finished product. Product IDs are intentionally retained as values rather
-- than FKs because the product may be deleted after the audit is written.
CREATE TABLE IF NOT EXISTS product_material_return_audit (
  product_material_return_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id_deleted INTEGER NOT NULL,
  product_resource_link_id INTEGER,
  site_item_inventory_id INTEGER,
  resource_kind TEXT,
  source_key TEXT,
  item_name TEXT,
  action_key TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  previous_on_hand_quantity INTEGER NOT NULL DEFAULT 0,
  new_on_hand_quantity INTEGER NOT NULL DEFAULT 0,
  previous_reserved_quantity INTEGER NOT NULL DEFAULT 0,
  new_reserved_quantity INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_material_return_audit_product ON product_material_return_audit(product_id_deleted, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_material_return_audit_inventory ON product_material_return_audit(site_item_inventory_id, created_at DESC);

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build_196_product_correction_material_returns',
  'database_build196_product_correction_material_returns.sql',
  CURRENT_TIMESTAMP,
  'Adds visible unused-product correction workflow, reviewed raw-material return audit, and returns inventory display to item name below image.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;


-- Build 197: admin resilience, non-destructive media saves, and category governance.
CREATE TABLE IF NOT EXISTS product_media_change_audit (
  product_media_change_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_image_id INTEGER,
  action_key TEXT NOT NULL,
  media_kind TEXT NOT NULL DEFAULT 'image',
  media_url TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_media_change_audit_product_created
  ON product_media_change_audit(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_media_change_audit_image_created
  ON product_media_change_audit(product_image_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_images_product_order_build197
  ON product_images(product_id, sort_order, product_image_id);
CREATE INDEX IF NOT EXISTS idx_product_image_annotations_product_image_build197
  ON product_image_annotations(product_id, product_image_id);

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build_197_application_resilience_media_catalog',
  'database_build197_application_resilience_media_catalog.sql',
  CURRENT_TIMESTAMP,
  'Makes admin helper reads resilient, preserves product media on ordinary saves, adds explicit media-change audit support, fixes retryable-conflict handling, and adds Soap/Candles category governance.'
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name = excluded.file_name,
  notes = excluded.notes;

-- Build 198: inventory full editor and featured-media repair.
-- Devil n Dove Build 198 — inventory full editor and featured-media integrity.
-- Run after database_build197_application_resilience_media_catalog.sql.
-- Additive, idempotent, and safe to rerun. It never deletes product media or R2 objects.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_product_images_featured_recovery_build198
  ON product_images(product_id, sort_order, product_image_id);

-- Repair only blank featured fields. The first retained product image (sort order zero) is canonical.
UPDATE products
SET featured_image_url = (
  SELECT pi.image_url
  FROM product_images pi
  WHERE pi.product_id = products.product_id
    AND TRIM(COALESCE(pi.image_url, '')) <> ''
  ORDER BY COALESCE(pi.sort_order, 0) ASC, pi.product_image_id ASC
  LIMIT 1
)
WHERE TRIM(COALESCE(featured_image_url, '')) = ''
  AND EXISTS (
    SELECT 1
    FROM product_images pi
    WHERE pi.product_id = products.product_id
      AND TRIM(COALESCE(pi.image_url, '')) <> ''
  );

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build_198_inventory_editor_featured_media_integrity',
  'database_build198_inventory_editor_featured_media_integrity.sql',
  CURRENT_TIMESTAMP,
  'Adds product-image ordering index, safely restores blank featured image URLs from retained first media, and accompanies the full inventory-record editor.'
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name = excluded.file_name,
  notes = excluded.notes;

-- Devil n Dove Build 199 — Content Automation Studio.
-- Run after database_build198_inventory_editor_featured_media_integrity.sql.
-- Additive and safe to rerun. It records a source-linked archive and review-first
-- content plans; it does not delete, move, overwrite, or publish source media.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS content_projects (
  content_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_key TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'product',
  source_id TEXT NOT NULL,
  product_id INTEGER,
  project_title TEXT NOT NULL,
  project_status TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  public_release_status TEXT NOT NULL DEFAULT 'private',
  story_angle TEXT,
  factual_summary TEXT,
  internal_notes TEXT,
  source_snapshot_json TEXT NOT NULL DEFAULT '{}',
  content_policy_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_type, source_id)
);

CREATE TABLE IF NOT EXISTS content_project_media (
  content_project_media_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_id INTEGER NOT NULL,
  media_asset_id INTEGER,
  product_image_id INTEGER,
  archive_key TEXT NOT NULL,
  archive_path TEXT NOT NULL,
  source_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  original_filename TEXT,
  mime_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  selection_score INTEGER NOT NULL DEFAULT 0,
  selection_reason TEXT,
  safety_status TEXT NOT NULL DEFAULT 'needs_review',
  consent_record_id INTEGER,
  is_selected INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  source_metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_project_id, archive_key),
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_project_deliverables (
  content_project_deliverable_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_id INTEGER NOT NULL,
  deliverable_key TEXT NOT NULL,
  channel_key TEXT NOT NULL,
  deliverable_type TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT,
  script_text TEXT,
  body_content TEXT,
  asset_plan_json TEXT NOT NULL DEFAULT '{}',
  aspect_ratio TEXT,
  target_duration_seconds INTEGER NOT NULL DEFAULT 0,
  output_url TEXT,
  thumbnail_url TEXT,
  deliverable_status TEXT NOT NULL DEFAULT 'planned',
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  review_notes TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  published_at TEXT,
  social_post_queue_id INTEGER,
  copy_locked INTEGER NOT NULL DEFAULT 0,
  generated_by TEXT NOT NULL DEFAULT 'factual_template',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_project_id, deliverable_key),
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_render_jobs (
  content_render_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_deliverable_id INTEGER NOT NULL,
  render_provider TEXT NOT NULL DEFAULT 'manual_export',
  render_status TEXT NOT NULL DEFAULT 'planned',
  render_payload_json TEXT NOT NULL DEFAULT '{}',
  output_url TEXT,
  error_text TEXT,
  requested_by_user_id INTEGER,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_project_deliverable_id) REFERENCES content_project_deliverables(content_project_deliverable_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_project_events (
  content_project_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_projects_source ON content_projects(source_type, source_id, project_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_content_project_media_project ON content_project_media(content_project_id, is_selected, selection_score DESC, sort_order);
CREATE INDEX IF NOT EXISTS idx_content_deliverables_project ON content_project_deliverables(content_project_id, channel_key, deliverable_status, approval_status);
CREATE INDEX IF NOT EXISTS idx_content_render_jobs_deliverable ON content_render_jobs(content_project_deliverable_id, render_status, created_at);
CREATE INDEX IF NOT EXISTS idx_content_project_events_project ON content_project_events(content_project_id, created_at DESC);

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build_199_content_automation_studio',
  'database_build199_content_automation_studio.sql',
  CURRENT_TIMESTAMP,
  'Adds review-first Content Automation Studio: source-linked project archive, selected-media score/review rows, planned YouTube/Facebook/Instagram/TikTok/gallery/GBP/SEO/blog/thumbnail/caption deliverables, render-job placeholders, and audit events. Never auto-publishes or deletes source media.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;


-- Build 200 content publication release board
-- Devil n Dove Build 200 — Content Publication Release Board.
-- Run after database_build199_content_automation_studio.sql.
-- Additive and safe to rerun. It creates review-first public drafting/release records;
-- it never moves, deletes, overwrites, or duplicates original product/R2 media.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS content_publications (
  content_publication_id INTEGER PRIMARY KEY AUTOINCREMENT,
  publication_key TEXT NOT NULL UNIQUE,
  content_project_id INTEGER NOT NULL,
  content_project_deliverable_id INTEGER,
  destination TEXT NOT NULL DEFAULT 'workshop_journal',
  publication_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_content TEXT,
  hero_media_url TEXT,
  hero_alt_text TEXT,
  media_urls_json TEXT NOT NULL DEFAULT '[]',
  product_path TEXT,
  canonical_path TEXT,
  meta_title TEXT,
  meta_description TEXT,
  schema_json TEXT NOT NULL DEFAULT '{}',
  content_status TEXT NOT NULL DEFAULT 'draft',
  review_notes TEXT,
  copy_locked INTEGER NOT NULL DEFAULT 0,
  metrics_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  published_by_user_id INTEGER,
  published_at TEXT,
  unpublished_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(destination, publication_slug),
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE CASCADE,
  FOREIGN KEY (content_project_deliverable_id) REFERENCES content_project_deliverables(content_project_deliverable_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS content_publication_events (
  content_publication_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_publication_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_publication_id) REFERENCES content_publications(content_publication_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_publications_project
  ON content_publications(content_project_id, destination, content_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_publications_public
  ON content_publications(destination, content_status, published_at DESC, content_publication_id DESC);
CREATE INDEX IF NOT EXISTS idx_content_publication_events_publication
  ON content_publication_events(content_publication_id, created_at DESC);



-- Build 201 Creative Asset Intelligence Platform foundation
-- Devil n Dove Build 201 — Creative Asset Intelligence Platform (CAIP) foundation.
-- Run after database_build199_content_automation_studio.sql and database_build200_content_publication_release_board.sql.
-- Additive and safe to rerun. CAIP is reference-only: this migration does not copy, move,
-- delete, overwrite, or make public any R2 object, product image, media asset, or content record.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS creative_projects (
  creative_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_key TEXT NOT NULL UNIQUE,
  content_project_id INTEGER UNIQUE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  product_id INTEGER,
  project_title TEXT NOT NULL,
  project_status TEXT NOT NULL DEFAULT 'intake',
  governance_status TEXT NOT NULL DEFAULT 'needs_review',
  lifecycle_stage TEXT NOT NULL DEFAULT 'intake',
  source_snapshot_json TEXT NOT NULL DEFAULT '{}',
  policy_profile_json TEXT NOT NULL DEFAULT '{}',
  latest_manifest_version INTEGER NOT NULL DEFAULT 1,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_type, source_id),
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_assets (
  creative_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  content_project_media_id INTEGER,
  media_asset_id INTEGER,
  product_image_id INTEGER,
  asset_key TEXT NOT NULL,
  source_url TEXT,
  source_fingerprint TEXT NOT NULL,
  logical_archive_path TEXT,
  source_safety_status TEXT NOT NULL DEFAULT 'needs_review',
  rights_status TEXT NOT NULL DEFAULT 'needs_review',
  asset_status TEXT NOT NULL DEFAULT 'active',
  media_type TEXT NOT NULL DEFAULT 'image',
  original_filename TEXT,
  mime_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_source_selected INTEGER NOT NULL DEFAULT 0,
  is_source_featured INTEGER NOT NULL DEFAULT 0,
  manual_tags_json TEXT NOT NULL DEFAULT '[]',
  manual_caption TEXT,
  source_metadata_json TEXT NOT NULL DEFAULT '{}',
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_refreshed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, asset_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (content_project_media_id) REFERENCES content_project_media(content_project_media_id) ON DELETE SET NULL,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(media_asset_id) ON DELETE SET NULL,
  FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_asset_analyses (
  creative_asset_analysis_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_asset_id INTEGER NOT NULL,
  analysis_key TEXT NOT NULL,
  analysis_provider TEXT NOT NULL DEFAULT 'metadata_heuristic',
  provider_version TEXT NOT NULL DEFAULT 'v1',
  analysis_status TEXT NOT NULL DEFAULT 'complete',
  technical_score INTEGER NOT NULL DEFAULT 0,
  story_score INTEGER NOT NULL DEFAULT 0,
  reuse_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  requires_human_review INTEGER NOT NULL DEFAULT 1,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  source_snapshot_fingerprint TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_asset_id, analysis_key),
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_recommendations (
  creative_asset_recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER,
  recommendation_key TEXT NOT NULL,
  destination_key TEXT NOT NULL,
  intended_role TEXT NOT NULL,
  fit_score INTEGER NOT NULL DEFAULT 0,
  rationale_json TEXT NOT NULL DEFAULT '{}',
  recommendation_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, recommendation_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_story_evidence (
  creative_story_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER,
  evidence_key TEXT NOT NULL,
  evidence_type TEXT NOT NULL DEFAULT 'source_fact',
  source_reference TEXT,
  claim_text TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'internal',
  verification_status TEXT NOT NULL DEFAULT 'source_record',
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  evidence_json TEXT NOT NULL DEFAULT '{}',
  copy_locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, evidence_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_story_segments (
  creative_story_segment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  segment_key TEXT NOT NULL,
  segment_type TEXT NOT NULL DEFAULT 'context',
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  narrative_text TEXT NOT NULL,
  evidence_keys_json TEXT NOT NULL DEFAULT '[]',
  segment_status TEXT NOT NULL DEFAULT 'draft',
  copy_locked INTEGER NOT NULL DEFAULT 0,
  reviewer_notes TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, segment_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_policy_decisions (
  creative_policy_decision_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  policy_key TEXT NOT NULL,
  decision_status TEXT NOT NULL DEFAULT 'needs_review',
  severity TEXT NOT NULL DEFAULT 'info',
  rationale TEXT,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  decided_by_user_id INTEGER,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, policy_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_intelligence_runs (
  creative_intelligence_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  run_key TEXT NOT NULL UNIQUE,
  run_type TEXT NOT NULL DEFAULT 'ingestion_sync',
  provider_key TEXT NOT NULL DEFAULT 'local_metadata_v1',
  run_status TEXT NOT NULL DEFAULT 'completed',
  input_summary_json TEXT NOT NULL DEFAULT '{}',
  output_summary_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT,
  requested_by_user_id INTEGER,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_project_events (
  creative_project_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_projects_content_project
  ON creative_projects(content_project_id, project_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_assets_project
  ON creative_assets(creative_project_id, rights_status, asset_status, sort_order, creative_asset_id);
CREATE INDEX IF NOT EXISTS idx_creative_asset_analyses_asset
  ON creative_asset_analyses(creative_asset_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_creative_recommendations_project
  ON creative_asset_recommendations(creative_project_id, destination_key, recommendation_status, fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_creative_evidence_project
  ON creative_story_evidence(creative_project_id, review_status, verification_status, creative_story_evidence_id);
CREATE INDEX IF NOT EXISTS idx_creative_segments_project
  ON creative_story_segments(creative_project_id, sort_order, creative_story_segment_id);
CREATE INDEX IF NOT EXISTS idx_creative_policy_project
  ON creative_policy_decisions(creative_project_id, decision_status, severity);
CREATE INDEX IF NOT EXISTS idx_creative_runs_project
  ON creative_intelligence_runs(creative_project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_events_project
  ON creative_project_events(creative_project_id, created_at DESC);

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build_201_creative_asset_intelligence_platform',
  'database_build201_creative_asset_intelligence_platform.sql',
  CURRENT_TIMESTAMP,
  'Adds CAIP foundation: canonical reference-only creative projects/assets, deterministic metadata analysis, rights-aware reuse recommendations, evidence-backed story segments, policy decisions, runs, manifests, and audit events. No AI provider, media copying, auto-publish, or source-media deletion.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;

-- ============================================================================
-- Build 202 aggregate schema extension
-- ============================================================================

-- Devil n Dove Build 202 — CAIP media verification, derivative planning, and secure review.
-- Run after database_build201_creative_asset_intelligence_platform.sql.
-- Additive and safe to rerun. This migration records technical observations, immutable plans,
-- and short-lived review-grant metadata only. It never copies, transforms, publishes, moves,
-- reorders, deletes, or makes public any original product image, video, media asset, or R2 object.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS creative_asset_probe_jobs (
  creative_asset_probe_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  job_key TEXT NOT NULL UNIQUE,
  probe_mode TEXT NOT NULL DEFAULT 'metadata_r2_head',
  job_status TEXT NOT NULL DEFAULT 'queued',
  source_snapshot_fingerprint TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  input_summary_json TEXT NOT NULL DEFAULT '{}',
  output_summary_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT,
  requested_by_user_id INTEGER,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_technical_observations (
  creative_asset_technical_observation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  observation_key TEXT NOT NULL,
  creative_asset_probe_job_id INTEGER,
  source_snapshot_fingerprint TEXT,
  storage_provider TEXT,
  bucket_name TEXT,
  object_key TEXT,
  observed_public_url TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  etag TEXT,
  uploaded_at TEXT,
  width_px INTEGER,
  height_px INTEGER,
  orientation TEXT,
  duration_seconds REAL,
  codec TEXT,
  probe_status TEXT NOT NULL DEFAULT 'metadata_only',
  probe_scope TEXT NOT NULL DEFAULT 'catalog_metadata_only',
  evidence_json TEXT NOT NULL DEFAULT '{}',
  observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_asset_id, observation_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_probe_job_id) REFERENCES creative_asset_probe_jobs(creative_asset_probe_job_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_derivative_recipes (
  creative_derivative_recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  recipe_key TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  output_role TEXT NOT NULL,
  output_format TEXT NOT NULL,
  target_width_px INTEGER,
  target_height_px INTEGER,
  aspect_ratio TEXT,
  transformation_json TEXT NOT NULL DEFAULT '{}',
  source_policy_json TEXT NOT NULL DEFAULT '{}',
  recipe_hash TEXT NOT NULL,
  recipe_status TEXT NOT NULL DEFAULT 'draft',
  is_immutable INTEGER NOT NULL DEFAULT 1,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  retired_by_user_id INTEGER,
  retired_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, recipe_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_derivatives (
  creative_asset_derivative_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  creative_derivative_recipe_id INTEGER NOT NULL,
  derivative_key TEXT NOT NULL UNIQUE,
  derivative_status TEXT NOT NULL DEFAULT 'planned',
  source_snapshot_fingerprint TEXT,
  output_storage_provider TEXT,
  output_bucket_name TEXT,
  output_object_key TEXT,
  output_url TEXT,
  output_mime_type TEXT,
  output_file_size_bytes INTEGER,
  checksum_algorithm TEXT,
  output_checksum TEXT,
  verification_status TEXT NOT NULL DEFAULT 'not_created',
  verification_evidence_json TEXT NOT NULL DEFAULT '{}',
  verified_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_derivative_recipe_id) REFERENCES creative_derivative_recipes(creative_derivative_recipe_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_access_grants (
  creative_asset_access_grant_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  grant_key TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  access_scope TEXT NOT NULL DEFAULT 'admin_authenticated_review_proxy',
  bound_user_id INTEGER,
  expires_at TEXT NOT NULL,
  max_access_count INTEGER NOT NULL DEFAULT 25,
  access_count INTEGER NOT NULL DEFAULT 0,
  revoked_at TEXT,
  revoked_by_user_id INTEGER,
  last_accessed_at TEXT,
  source_snapshot_fingerprint TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_access_audit (
  creative_asset_access_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_asset_access_grant_id INTEGER,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  outcome TEXT NOT NULL DEFAULT 'recorded',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_asset_access_grant_id) REFERENCES creative_asset_access_grants(creative_asset_access_grant_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_provider_profiles (
  creative_provider_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  capability_key TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'disabled',
  endpoint_policy TEXT NOT NULL DEFAULT 'not_configured',
  config_redacted_json TEXT NOT NULL DEFAULT '{}',
  consent_required INTEGER NOT NULL DEFAULT 1,
  default_budget_cap_cents INTEGER NOT NULL DEFAULT 0,
  enabled_at TEXT,
  disabled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creative_execution_budget_controls (
  creative_execution_budget_control_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER,
  capability_key TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'CAD',
  per_run_cap_cents INTEGER NOT NULL DEFAULT 0,
  monthly_cap_cents INTEGER NOT NULL DEFAULT 0,
  policy_status TEXT NOT NULL DEFAULT 'disabled',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, capability_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_probe_jobs_asset
  ON creative_asset_probe_jobs(creative_project_id, creative_asset_id, job_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_observations_asset
  ON creative_asset_technical_observations(creative_project_id, creative_asset_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_recipes_asset
  ON creative_derivative_recipes(creative_project_id, creative_asset_id, recipe_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_derivatives_asset
  ON creative_asset_derivatives(creative_project_id, creative_asset_id, derivative_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_access_grants_asset
  ON creative_asset_access_grants(creative_project_id, creative_asset_id, expires_at, revoked_at);
CREATE INDEX IF NOT EXISTS idx_creative_access_audit_grant
  ON creative_asset_access_audit(creative_asset_access_grant_id, created_at DESC);

INSERT INTO creative_provider_profiles (
  provider_key, display_name, capability_key, lifecycle_status, endpoint_policy,
  config_redacted_json, consent_required, default_budget_cap_cents, created_at, updated_at
) VALUES
  ('r2_metadata_probe', 'Bound R2 metadata probe', 'technical_probe', 'disabled', 'not_configured', '{}', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('derivative_renderer', 'Derivative renderer adapter', 'render', 'disabled', 'not_configured', '{}', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('thumbnail_builder', 'Thumbnail builder adapter', 'thumbnail', 'disabled', 'not_configured', '{}', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('social_export_adapter', 'Social export adapter', 'export', 'disabled', 'not_configured', '{}', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(provider_key) DO NOTHING;

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build_202_caip_media_operations_secure_review',
  'database_build202_caip_media_operations_secure_review.sql',
  CURRENT_TIMESTAMP,
  'Adds CAIP metadata-only/R2-head probe records, immutable derivative recipes/plans, disabled provider/budget controls, and same-origin authenticated secure-review grant/audit metadata. Does not transform, copy, publish, delete, or expose source media publicly.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;
-- Build 216: explicit reviewed inventory posting, CAIP evidence mirroring, and reusable project cost templates.
CREATE TABLE IF NOT EXISTS creative_project_inventory_posts (
  creative_project_inventory_post_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_work_event_id INTEGER NOT NULL,
  creative_project_material_review_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER NOT NULL,
  stock_quantity_consumed INTEGER NOT NULL,
  previous_on_hand_quantity INTEGER NOT NULL,
  new_on_hand_quantity INTEGER NOT NULL,
  posting_status TEXT NOT NULL DEFAULT 'posted',
  reversal_post_id INTEGER,
  posted_by INTEGER,
  posted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(creative_project_material_review_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_creative_project_inventory_posts_project ON creative_project_inventory_posts(creative_work_project_id, posted_at DESC);
CREATE TABLE IF NOT EXISTS creative_project_caip_mirrors (
  creative_project_caip_mirror_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_project_id INTEGER NOT NULL,
  source_handoff_id INTEGER,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  mirror_status TEXT NOT NULL DEFAULT 'needs_review',
  mirrored_by INTEGER,
  mirrored_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(creative_work_project_id, creative_project_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_project_cost_templates (
  creative_project_cost_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name TEXT NOT NULL UNIQUE,
  labour_rate_cents INTEGER NOT NULL DEFAULT 0,
  packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
  overhead_cost_cents INTEGER NOT NULL DEFAULT 0,
  channel_fee_percent REAL NOT NULL DEFAULT 0,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Build 217 additive controls
-- Build 217 — additive Creative Project controls.
-- Safe to run after Build 216. No existing records are deleted or published.

CREATE TABLE IF NOT EXISTS creative_project_inventory_reversals (
  creative_project_inventory_reversal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_inventory_post_id INTEGER NOT NULL UNIQUE,
  creative_work_project_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER NOT NULL,
  stock_quantity_restored INTEGER NOT NULL,
  previous_on_hand_quantity INTEGER NOT NULL,
  new_on_hand_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  authorized_by INTEGER NOT NULL,
  authorized_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_inventory_post_id) REFERENCES creative_project_inventory_posts(creative_project_inventory_post_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS creative_project_profitability_extensions (
  creative_work_project_id INTEGER PRIMARY KEY,
  channel_fee_percent REAL NOT NULL DEFAULT 0,
  fixed_channel_fee_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_project_cost_allocations (
  creative_project_cost_allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  allocation_percent REAL NOT NULL DEFAULT 0,
  allocated_cost_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_work_project_id, product_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_project_knowledge_summaries (
  creative_project_knowledge_summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  summary_type TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  source_evidence_count INTEGER NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_by INTEGER,
  reviewed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_work_project_id, summary_type),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_project_reversals_project
  ON creative_project_inventory_reversals(creative_work_project_id, authorized_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_project_allocations_project
  ON creative_project_cost_allocations(creative_work_project_id, product_id);
CREATE INDEX IF NOT EXISTS idx_creative_project_summaries_project
  ON creative_project_knowledge_summaries(creative_work_project_id, review_status);

-- Build 220 — quantity-price specials, reserved product sets, purchase lots,
-- and content-only Creative Project handoffs.
-- Apply to the production D1 database before using Build 220 controls.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_quantity_price_tiers (
  product_quantity_price_tier_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  label TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, min_quantity),
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_quantity_price_tiers_product
  ON product_quantity_price_tiers(product_id, is_active, min_quantity);

CREATE TABLE IF NOT EXISTS product_bundle_settings (
  bundle_product_id INTEGER PRIMARY KEY,
  requested_bundle_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_bundle_quantity INTEGER NOT NULL DEFAULT 0,
  reservation_status TEXT NOT NULL DEFAULT 'draft',
  shortage_notes TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(bundle_product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_bundle_components (
  product_bundle_component_id INTEGER PRIMARY KEY AUTOINCREMENT,
  bundle_product_id INTEGER NOT NULL,
  component_product_id INTEGER NOT NULL,
  quantity_per_bundle INTEGER NOT NULL DEFAULT 1,
  reserved_component_quantity INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bundle_product_id, component_product_id),
  FOREIGN KEY(bundle_product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY(component_product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_product_bundle_components_bundle
  ON product_bundle_components(bundle_product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_bundle_components_component
  ON product_bundle_components(component_product_id, bundle_product_id);

CREATE TABLE IF NOT EXISTS inventory_purchase_lots (
  inventory_purchase_lot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  lot_code TEXT NOT NULL,
  purchase_date TEXT,
  received_date TEXT,
  supplier_name TEXT,
  supplier_order_number TEXT,
  supplier_sku TEXT,
  asin TEXT,
  source_url TEXT,
  quantity_received REAL NOT NULL DEFAULT 0,
  quantity_remaining REAL NOT NULL DEFAULT 0,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  tax_cost_cents INTEGER NOT NULL DEFAULT 0,
  expiry_date TEXT,
  storage_location TEXT,
  lot_status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_item_inventory_id, lot_code),
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_lots_item
  ON inventory_purchase_lots(site_item_inventory_id, purchase_date DESC, inventory_purchase_lot_id DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_lots_expiry
  ON inventory_purchase_lots(lot_status, expiry_date);

-- Content-only Creative Projects use the existing content_projects.source_type /
-- source_id columns with source_type='creative_project'. No new table is required.

-- Build 221 — Packaging Studio foundation, streamlined product cleanup,
-- purchase-lot reconciliation controls, and review-first packaging exports.
-- Apply after database_build220_quantity_sets_lots_content_only.sql.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS packaging_templates (
  packaging_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'soap_ribbon',
  description TEXT,
  page_width_mm REAL NOT NULL DEFAULT 279.4,
  page_height_mm REAL NOT NULL DEFAULT 19,
  front_width_mm REAL NOT NULL DEFAULT 50.8,
  front_height_mm REAL NOT NULL DEFAULT 38.1,
  rear_width_mm REAL NOT NULL DEFAULT 50,
  rear_height_mm REAL NOT NULL DEFAULT 50,
  layout_json TEXT NOT NULL DEFAULT '{}',
  theme_json TEXT NOT NULL DEFAULT '{}',
  is_system INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS packaging_projects (
  packaging_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_key TEXT NOT NULL UNIQUE,
  product_id INTEGER,
  packaging_template_id INTEGER NOT NULL,
  project_name TEXT NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'soap_ribbon',
  project_status TEXT NOT NULL DEFAULT 'draft',
  collection_name TEXT,
  product_name TEXT NOT NULL,
  product_subtitle TEXT,
  product_identity_en TEXT,
  product_identity_fr TEXT,
  ingredients_inci TEXT,
  ingredients_en TEXT,
  ingredients_fr TEXT,
  net_quantity_text TEXT,
  website_text TEXT,
  dealer_name TEXT,
  dealer_address TEXT,
  contact_text TEXT,
  made_in_canada_text TEXT,
  claims_json TEXT NOT NULL DEFAULT '[]',
  warnings_en TEXT,
  warnings_fr TEXT,
  icons_json TEXT NOT NULL DEFAULT '[]',
  theme_json TEXT NOT NULL DEFAULT '{}',
  artwork_json TEXT NOT NULL DEFAULT '{}',
  print_notes TEXT,
  compliance_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY(packaging_template_id) REFERENCES packaging_templates(packaging_template_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_packaging_projects_product ON packaging_projects(product_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_packaging_projects_status ON packaging_projects(project_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS packaging_project_versions (
  packaging_project_version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  snapshot_json TEXT NOT NULL,
  svg_markup TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(packaging_project_id, version_number),
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_packaging_project_versions_project ON packaging_project_versions(packaging_project_id, version_number DESC);

CREATE TABLE IF NOT EXISTS packaging_export_history (
  packaging_export_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  packaging_project_version_id INTEGER,
  export_format TEXT NOT NULL,
  file_name TEXT,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  source_snapshot_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_packaging_export_history_project ON packaging_export_history(packaging_project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inventory_lot_policies (
  site_item_inventory_id INTEGER PRIMARY KEY,
  depletion_method TEXT NOT NULL DEFAULT 'manual',
  reconcile_status TEXT NOT NULL DEFAULT 'needs_review',
  last_reconciled_quantity REAL,
  last_reconciled_at TEXT,
  updated_by_user_id INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_lot_reconciliations (
  inventory_lot_reconciliation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  main_on_hand_quantity REAL NOT NULL DEFAULT 0,
  lot_remaining_quantity REAL NOT NULL DEFAULT 0,
  discrepancy_quantity REAL NOT NULL DEFAULT 0,
  applied_to_main_inventory INTEGER NOT NULL DEFAULT 0,
  previous_on_hand_quantity REAL,
  new_on_hand_quantity REAL,
  depletion_method TEXT NOT NULL DEFAULT 'manual',
  review_note TEXT NOT NULL,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_inventory_lot_reconciliations_item ON inventory_lot_reconciliations(site_item_inventory_id, reviewed_at DESC);

INSERT OR IGNORE INTO packaging_templates (
  template_key, template_name, package_type, description,
  page_width_mm, page_height_mm, front_width_mm, front_height_mm,
  rear_width_mm, rear_height_mm, layout_json, theme_json, is_system, is_active
) VALUES (
  'soap-ribbon-scalloped-reference-v1',
  'Soap ribbon — scalloped medallion reference',
  'soap_ribbon',
  'Recreates the supplied ribbon structure: narrow 19 mm band, scalloped front medallion, curved collection and scent text, bilingual centre title, side botanical ornaments, ingredients, rear medallion, claims and net quantity.',
  279.4, 50, 50.8, 38.1, 50, 50,
  '{"sections":["front_scalloped_badge","ingredients_en","ingredients_fr","rear_medallion","claims"],"band_height_mm":19,"front_style":"scalloped_curved_text"}',
  '{"rose_colour":"#9b8068","theme_colour":"#f2ead8","border_colour":"#2f2721","accent_gold":"#b69a61"}',
  1, 1
);

INSERT OR IGNORE INTO packaging_templates (
  template_key, template_name, package_type, description,
  page_width_mm, page_height_mm, front_width_mm, front_height_mm,
  rear_width_mm, rear_height_mm, layout_json, theme_json, is_system, is_active
) VALUES (
  'soap-ribbon-11x0.75-v1',
  'Soap ribbon — standard 11 × 0.75 inch',
  'soap_ribbon',
  'Standard narrow ribbon with front oval, English ingredients, French ingredients, rear medallion, claims and net weight.',
  279.4, 19, 50.8, 19, 50, 19,
  '{"sections":["front","ingredients_en","ingredients_fr","rear","claims"],"band_height_mm":19}',
  '{"rose_colour":"#b74b63","theme_colour":"#f4eadb","border_colour":"#3b2c2f","accent_gold":"#b38a3b"}',
  1, 1
);

-- =========================================================
-- BUILD 221 AGGREGATE SCHEMA REPAIR
-- Restores the Build 213-215 Creative Process parent tables that later
-- Build 216-217 foreign keys depend on in fresh/aggregate installations.
-- =========================================================
-- Build 213 — Creative Process Engine foundation. Safe additive migration.
CREATE TABLE IF NOT EXISTS creative_work_projects (
 creative_work_project_id INTEGER PRIMARY KEY AUTOINCREMENT, project_key TEXT NOT NULL UNIQUE,
 project_title TEXT NOT NULL, project_type TEXT NOT NULL DEFAULT 'maker_project', project_status TEXT NOT NULL DEFAULT 'idea',
 summary TEXT, objective TEXT, story_angle TEXT, product_id INTEGER, started_at TEXT, completed_at TEXT,
 total_minutes INTEGER NOT NULL DEFAULT 0, estimated_cost_cents INTEGER NOT NULL DEFAULT 0, actual_cost_cents INTEGER NOT NULL DEFAULT 0,
 privacy_status TEXT NOT NULL DEFAULT 'internal', rights_status TEXT NOT NULL DEFAULT 'needs_review', created_by INTEGER, updated_by INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS creative_work_events (
 creative_work_event_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_work_project_id INTEGER NOT NULL,
 event_type TEXT NOT NULL DEFAULT 'note', event_title TEXT NOT NULL, event_notes TEXT, occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 duration_minutes INTEGER NOT NULL DEFAULT 0, material_name TEXT, material_quantity REAL, material_unit TEXT,
 material_cost_cents INTEGER NOT NULL DEFAULT 0, media_url TEXT, is_public_candidate INTEGER NOT NULL DEFAULT 0,
 created_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_work_outputs (
 creative_work_output_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_work_project_id INTEGER NOT NULL,
 output_key TEXT NOT NULL, output_label TEXT NOT NULL, output_group TEXT NOT NULL, output_status TEXT NOT NULL DEFAULT 'planned',
 approval_status TEXT NOT NULL DEFAULT 'needs_review', linked_record_type TEXT, linked_record_id INTEGER, output_url TEXT, notes TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(creative_work_project_id,output_key), FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_creative_work_projects_status ON creative_work_projects(project_status);
CREATE INDEX IF NOT EXISTS idx_creative_work_events_project ON creative_work_events(creative_work_project_id,occurred_at);
CREATE INDEX IF NOT EXISTS idx_creative_work_outputs_project ON creative_work_outputs(creative_work_project_id,output_status);

-- Devil n Dove Build 214
-- Additive optional relationship between Creative Projects and products.
-- Products are NOT required to have a project; existing direct and phone-capture workflows remain valid.
CREATE TABLE IF NOT EXISTS creative_project_product_links (
  creative_project_product_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'project_output',
  is_primary INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_work_project_id, product_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_creative_project_product_links_project ON creative_project_product_links(creative_work_project_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_creative_project_product_links_product ON creative_project_product_links(product_id);

-- Build 215 — additive Creative Intelligence Integration.
-- Review-first only. This migration does not consume inventory or publish content.
CREATE TABLE IF NOT EXISTS creative_project_evidence_selections (
  creative_project_evidence_selection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_work_event_id INTEGER NOT NULL,
  evidence_role TEXT NOT NULL DEFAULT 'process_evidence',
  selected INTEGER NOT NULL DEFAULT 1,
  review_notes TEXT, reviewed_by INTEGER, reviewed_at TEXT,
  UNIQUE(creative_work_project_id, creative_work_event_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_project_material_reviews (
  creative_project_material_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_work_event_id INTEGER NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending',
  actual_quantity REAL, waste_quantity REAL, reusable_quantity REAL,
  approved_cost_cents INTEGER NOT NULL DEFAULT 0,
  review_notes TEXT, inventory_consumed INTEGER NOT NULL DEFAULT 0,
  reviewed_by INTEGER, reviewed_at TEXT,
  UNIQUE(creative_work_project_id, creative_work_event_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_project_profitability (
  creative_work_project_id INTEGER PRIMARY KEY,
  labour_rate_cents INTEGER NOT NULL DEFAULT 0,
  packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
  overhead_cost_cents INTEGER NOT NULL DEFAULT 0,
  channel_fee_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  estimated_content_value_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT, updated_by INTEGER, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_project_content_handoffs (
  creative_project_content_handoff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  content_project_id INTEGER,
  handoff_status TEXT NOT NULL DEFAULT 'draft',
  evidence_count INTEGER NOT NULL DEFAULT 0,
  package_json TEXT NOT NULL,
  created_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);


-- Build 222 aggregate compatibility: normalized soap labels and print proof.
-- Build 222 — Soap Label Automation normalization, print proof evidence, exact template profiles, and startup-readiness documentation support.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS soap_label_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_template_id INTEGER NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  artboard_width_in REAL NOT NULL DEFAULT 11.0,
  artboard_height_in REAL NOT NULL DEFAULT 1.5,
  band_height_in REAL NOT NULL DEFAULT 0.75,
  front_oval_width_in REAL NOT NULL DEFAULT 2.0,
  front_oval_height_in REAL NOT NULL DEFAULT 1.5,
  rear_circle_mm REAL NOT NULL DEFAULT 38.1,
  bleed_in REAL NOT NULL DEFAULT 0.125,
  safe_margin_in REAL NOT NULL DEFAULT 0.0625,
  dimension_profile TEXT NOT NULL DEFAULT 'photo_fit',
  background_style TEXT NOT NULL DEFAULT 'cream_damask',
  default_font_set TEXT NOT NULL DEFAULT 'devil_dove_vintage',
  default_gold_colour TEXT NOT NULL DEFAULT '#B88A2F',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_template_id) REFERENCES packaging_templates(packaging_template_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS soap_products (
  soap_product_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL UNIQUE,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  product_family TEXT,
  soap_type TEXT,
  description_en TEXT,
  description_fr TEXT,
  net_weight_oz REAL,
  net_weight_g REAL,
  accent_colour TEXT,
  secondary_colour TEXT,
  rose_colour TEXT,
  rose_asset_id TEXT NOT NULL DEFAULT 'rose-purple-v1',
  website TEXT NOT NULL DEFAULT 'devilndove.com',
  made_in_text_en TEXT NOT NULL DEFAULT 'Made in Canada',
  made_in_text_fr TEXT NOT NULL DEFAULT 'Fabriqué au Canada',
  print_status TEXT NOT NULL DEFAULT 'draft',
  compliance_status TEXT NOT NULL DEFAULT 'needs_review',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_soap_products_product ON soap_products(product_id, active);

CREATE TABLE IF NOT EXISTS soap_ingredients (
  ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
  soap_product_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  inci_name TEXT,
  display_name_en TEXT,
  display_name_fr TEXT,
  organic_flag INTEGER NOT NULL DEFAULT 0,
  allergen_note TEXT,
  required_on_label INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(soap_product_id) REFERENCES soap_products(soap_product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_soap_ingredients_product ON soap_ingredients(soap_product_id, sort_order, ingredient_id);

CREATE TABLE IF NOT EXISTS soap_label_claims (
  claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
  soap_product_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  claim_en TEXT NOT NULL,
  claim_fr TEXT NOT NULL,
  icon_name TEXT,
  is_approved INTEGER NOT NULL DEFAULT 0,
  compliance_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(soap_product_id) REFERENCES soap_products(soap_product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_soap_label_claims_product ON soap_label_claims(soap_product_id, sort_order, claim_id);

CREATE TABLE IF NOT EXISTS soap_label_exports (
  export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  soap_product_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  packaging_project_version_id INTEGER,
  version TEXT,
  export_format TEXT NOT NULL,
  file_name TEXT NOT NULL,
  svg_url TEXT,
  pdf_url TEXT,
  png_url TEXT,
  webp_url TEXT,
  checksum TEXT,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by INTEGER,
  approval_status TEXT NOT NULL DEFAULT 'prepared',
  print_test_status TEXT NOT NULL DEFAULT 'not_tested',
  notes TEXT,
  FOREIGN KEY(soap_product_id) REFERENCES soap_products(soap_product_id) ON DELETE CASCADE,
  FOREIGN KEY(template_id) REFERENCES soap_label_templates(template_id) ON DELETE RESTRICT,
  FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_soap_label_exports_product ON soap_label_exports(soap_product_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS soap_label_print_tests (
  print_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  packaging_project_version_id INTEGER,
  test_status TEXT NOT NULL DEFAULT 'needs_test',
  printed_at TEXT,
  printer_name TEXT,
  paper_stock TEXT,
  scale_percent REAL NOT NULL DEFAULT 100,
  measured_strip_width_in REAL,
  measured_band_height_in REAL,
  measured_front_width_in REAL,
  measured_front_height_in REAL,
  measured_rear_circle_mm REAL,
  wrap_fit_status TEXT NOT NULL DEFAULT 'not_checked',
  legibility_status TEXT NOT NULL DEFAULT 'not_checked',
  overlap_status TEXT NOT NULL DEFAULT 'not_checked',
  proof_image_url TEXT,
  notes TEXT,
  reviewed_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_soap_label_print_tests_project ON soap_label_print_tests(packaging_project_id, created_at DESC);

-- Exact photo-match profile: the overall artboard and front oval follow the approved image/spec.
-- The rear seal is 38.1 mm so it fits the 38.1 mm artboard. A separate 50 mm profile is seeded below because the supplied specification contains a physical conflict between a 38.1 mm artboard and a 50 mm rear circle.
INSERT OR IGNORE INTO packaging_templates (
  template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active
) VALUES (
  'soap-ribbon-glacial-approved-v1',
  'Soap ribbon — Glacial Purple approved photo layout',
  'soap_ribbon',
  'Photo-matched continuous ribbon: English ingredients, 2 × 1.5 inch front oval with rose, French ingredients, rear seal, bilingual claims and net weight. The 0.75 inch band is centred in the 1.5 inch artboard.',
  279.4,38.1,50.8,38.1,38.1,38.1,
  '{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":38.1,"front_style":"glacial_photo_oval","rear_circle_spec_mm":50,"rear_circle_render_mm":38.1,"dimension_profile":"photo_fit","bleed_in":0.125,"safe_margin_in":0.0625}',
  '{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',
  1,1
);

INSERT OR IGNORE INTO packaging_templates (
  template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active
) VALUES (
  'soap-ribbon-spec-50mm-seal-v1',
  'Soap ribbon — 50 mm rear-seal specification profile',
  'soap_ribbon',
  'Uses a 50 mm-high artboard so the specified 50 mm rear circle is not clipped. Requires physical review because the supplied specification also states a 1.5 inch overall artboard.',
  279.4,50,50.8,38.1,50,50,
  '{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":50,"front_style":"glacial_photo_oval","rear_circle_spec_mm":50,"rear_circle_render_mm":50,"dimension_profile":"50mm_seal","bleed_in":0.125,"safe_margin_in":0.0625}',
  '{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',
  1,1
);

INSERT OR IGNORE INTO soap_label_templates (
  packaging_template_id,template_name,version,artboard_width_in,artboard_height_in,band_height_in,front_oval_width_in,front_oval_height_in,rear_circle_mm,bleed_in,safe_margin_in,dimension_profile,background_style,default_font_set,default_gold_colour,is_active
)
SELECT packaging_template_id,template_name,'1.1',11.0,1.5,0.75,2.0,1.5,38.1,0.125,0.0625,'photo_fit','cream_damask','devil_dove_vintage','#B88A2F',1
FROM packaging_templates WHERE template_key='soap-ribbon-glacial-approved-v1';

INSERT OR IGNORE INTO soap_label_templates (
  packaging_template_id,template_name,version,artboard_width_in,artboard_height_in,band_height_in,front_oval_width_in,front_oval_height_in,rear_circle_mm,bleed_in,safe_margin_in,dimension_profile,background_style,default_font_set,default_gold_colour,is_active
)
SELECT packaging_template_id,template_name,'1.1',11.0,1.96850394,0.75,2.0,1.5,50.0,0.125,0.0625,'50mm_seal','cream_damask','devil_dove_vintage','#B88A2F',1
FROM packaging_templates WHERE template_key='soap-ribbon-spec-50mm-seal-v1';

UPDATE packaging_templates
SET page_width_mm=279.4,
    page_height_mm=38.1,
    front_width_mm=50.8,
    front_height_mm=38.1,
    rear_width_mm=38.1,
    rear_height_mm=38.1,
    layout_json='{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":38.1,"front_style":"glacial_photo_oval","rear_circle_spec_mm":50,"rear_circle_render_mm":38.1,"dimension_profile":"photo_fit","bleed_in":0.125,"safe_margin_in":0.0625}',
    description='Build 222 exact photo-layout profile. The 0.75 inch band and 2 × 1.5 inch front oval are centred in the 11 × 1.5 inch artboard. Rear seal is rendered at 38.1 mm to fit; use the separate 50 mm profile when the larger seal is required.',
    updated_at=CURRENT_TIMESTAMP
WHERE template_key='soap-ribbon-scalloped-reference-v1';

-- Build 225 — actionable Startup Readiness Cockpit and Packaging Studio documentation authority.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS startup_readiness_items (
  startup_readiness_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_key TEXT NOT NULL UNIQUE,
  phase_key TEXT NOT NULL, phase_label TEXT NOT NULL, item_title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100, blocker_severity TEXT NOT NULL DEFAULT 'high',
  is_launch_blocker INTEGER NOT NULL DEFAULT 1, requires_live_binding INTEGER NOT NULL DEFAULT 0,
  target_route TEXT, external_location TEXT, instructions_markdown TEXT NOT NULL, pass_condition TEXT NOT NULL,
  item_status TEXT NOT NULL DEFAULT 'not_started', owner_name TEXT, due_date TEXT, evidence_url TEXT, evidence_notes TEXT, blocked_reason TEXT,
  completed_at TEXT, completed_by_user_id INTEGER, last_updated_by_user_id INTEGER, is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_startup_readiness_items_phase_status ON startup_readiness_items(is_active, phase_key, item_status, sort_order);
CREATE INDEX IF NOT EXISTS idx_startup_readiness_items_severity ON startup_readiness_items(is_active, blocker_severity, item_status);

CREATE TABLE IF NOT EXISTS startup_readiness_history (
  startup_readiness_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  startup_readiness_item_id INTEGER NOT NULL, item_key TEXT NOT NULL, previous_status TEXT, next_status TEXT NOT NULL,
  owner_name TEXT, due_date TEXT, evidence_url TEXT, evidence_notes TEXT, blocked_reason TEXT, changed_by_user_id INTEGER,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(startup_readiness_item_id) REFERENCES startup_readiness_items(startup_readiness_item_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_startup_readiness_history_item ON startup_readiness_history(startup_readiness_item_id, changed_at DESC);

INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('backup_migrate_deploy','foundation','Foundation and deployment','Back up D1, apply the current migration, and deploy the complete build',10,'critical',1,1,'/admin/deployment-preflight/','Cloudflare Dashboard → Workers & Pages → D1 and Pages deployments','1. Open Cloudflare D1 and create a production backup or export before changing the schema.
2. Record the backup date, database name, and safe storage location in the evidence notes.
3. Apply database_build225_startup_readiness_packaging_authority.sql or database_upgrade_current_pass.sql, but not both.
4. Deploy the complete ZIP rather than selected files.
5. Open Deployment Preflight and run every available check.
6. Save the deployment URL, commit or deployment identifier, and the preflight result.
7. Stop and restore the previous deployment if any critical migration or routing error appears.','A recoverable D1 backup exists, the Build 225 migration is applied once, the complete deployment is live, and Deployment Preflight has no unresolved critical result.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('production_bindings_secrets','foundation','Foundation and deployment','Verify production bindings, secrets, domains, and environment separation',20,'critical',1,1,'/admin/deployment-preflight/','Cloudflare Pages project → Settings → Variables and Bindings; custom domains; D1/R2 bindings','1. Confirm the production Pages project is connected to the intended D1 database and R2 buckets.
2. Confirm every required secret exists in Production, not only Preview.
3. Check payment, email, OAuth, admin-bootstrap, analytics, and storage variables against CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md.
4. Confirm preview/test credentials are not used in production and production credentials are not committed to the repository.
5. Confirm devilndove.com and any www redirect resolve to the production deployment with valid HTTPS.
6. Test one read and one safe write against each required binding.
7. Record only variable names and test results; never paste secret values into evidence.','The production domain, D1, R2, payment, email, and required application bindings are present in the correct environment and pass safe connectivity checks without exposing secrets.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('login_logout_recovery','access','Access, security, and recovery','Prove production login, logout, session expiry, and password recovery',30,'critical',1,1,'/login/','Production website and the configured transactional email provider','1. Open a private browser window and log in with a test administrator account.
2. Confirm successful login redirects correctly and does not return a 500 error.
3. Log out and verify protected pages and APIs are no longer accessible.
4. Request a password reset from the public recovery page.
5. Confirm the reset message arrives, the link can be used once, and an expired or reused link is rejected.
6. Test Logout All Sessions and confirm an older browser session is invalidated.
7. Leave a test session idle long enough to confirm expiry behaviour and a clear sign-in recovery path.
8. Record browser, time, account role, and result without storing passwords or tokens.','Login, logout, reset, one-time token use, session expiry, and logout-all work in production without 500 errors or continued access after invalidation.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('role_authorization','access','Access, security, and recovery','Verify server-side authorization for destructive, financial, and approval actions',40,'critical',1,1,'/admin/members/','Production admin APIs and role test accounts','1. Prepare an administrator account and at least one lower-privilege test account.
2. Test permanent product deletion, inventory reversal, label approval, accounting export, member administration, and publication approval.
3. Confirm the administrator can perform only the actions intended for that role.
4. Call the same APIs while signed in as the lower role and confirm 401 or 403 responses.
5. Confirm hiding a button is not the only protection; direct API calls must also be denied.
6. Confirm every successful sensitive action creates an audit record with actor, target, time, and reason.
7. Remove or disable temporary test accounts after the review.','Every sensitive action is enforced on the server, lower roles receive 401/403, and successful actions are attributable in the audit history.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('runtime_incident_fallback','access','Access, security, and recovery','Prove runtime incident capture and honest fallback behaviour',50,'high',1,1,'/admin/runtime-incidents/','Production Pages Functions logs and runtime incident records','1. Use a safe test condition that causes a non-destructive optional API failure, such as an unavailable optional table in a preview environment.
2. Confirm the API returns structured JSON with a useful status code and plain-language error.
3. Confirm the browser shows a usable fallback or retry path without claiming a save, payment, export, or approval succeeded.
4. Confirm the runtime incident includes scope, code, severity, user or request context, and a sanitized stack or detail.
5. Restore the optional dependency and verify the normal path recovers.
6. Review offline.html and low-bandwidth media fallbacks on a throttled connection.','Expected failures are visible, sanitized, recoverable, and recorded; fallback states never present an uncompleted business action as successful.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('launch_product_list','catalog','Catalog, product facts, and media','Choose a small opening-day product list and freeze its launch scope',60,'critical',1,0,'/admin/products/','Internal operating decision','1. Select a deliberately small group of products that can be physically counted, photographed, packaged, and fulfilled now.
2. Exclude experimental, incomplete, duplicate, content-only, or uncertain products from the launch group.
3. Record the product IDs, names, SKUs, and intended sale channels.
4. Confirm every selected item has an owner responsible for facts, media, inventory, packaging, and final review.
5. Keep other products in Draft or Archived while the site opens.
6. Revisit the launch group only through a deliberate review so the finish line does not keep moving.','A finite opening-day product list is recorded, owned, and protected from unrelated draft work.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('product_detail_gallery','catalog','Catalog, product facts, and media','Verify every launch product View link, detail page, and seven-image gallery',70,'critical',1,1,'/shop/','Public shop and /api/product-detail?slug=<slug>','1. Open the public Shop in a private browser window.
2. Select View on every launch product card.
3. Confirm the URL contains the correct slug and the detail endpoint returns HTTP 200 with ok:true.
4. Confirm name, price, description, SKU, availability, shipping information, and calls to action match the admin record.
5. For products with seven approved images, confirm seven unique thumbnails appear and each changes the main image, alternative text, caption, and image counter.
6. Confirm blocked or consent-needed images remain excluded for a documented reason.
7. Test direct loading, browser refresh, copied link, mobile view, and the public catalog fallback.
8. Record every product that returns fewer images or stale facts and correct it in Catalog Media or Products.','Every launch product opens from its card, returns current facts, and displays all approved unique storefront images without broken routes or stale fallback content.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('product_facts_preflight','catalog','Catalog, product facts, and media','Complete Product Release Preflight for every launch product',80,'critical',1,0,'/admin/release-preflight/','Devil n Dove Product Release Preflight','1. Filter Product Release Preflight to the opening-day product list.
2. Resolve required name, slug, SKU, price, category, description, quantity, dimensions, weight, shipping, tax, care, condition, and sale-channel facts.
3. Confirm quantity pricing and set components where applicable.
4. Resolve every blocking media, consent, packaging, content, or inventory warning.
5. Open the public detail page after each important correction.
6. Record any warning intentionally accepted, who accepted it, and why.
7. Do not publish a product merely because a percentage score looks high; manually review the final buyer view.','Every opening-day product is green for required preflight checks and has a final human review of the public page.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('catalog_media_rights','catalog','Catalog, product facts, and media','Finish product media, rights, roles, alt text, and R2 delivery',90,'critical',1,1,'/admin/catalog-media/','Catalog Media, R2 object delivery, and public product pages','1. Assign one featured image and up to six supporting images to each launch product.
2. Set image role, display order, concise descriptive alt text, caption where useful, and public-use status.
3. Confirm ownership or consent and keep blocked/consent-needed media out of public responses.
4. Verify full, thumbnail, WebP, and AVIF derivatives where configured.
5. Test image loading on a normal desktop connection and a throttled mobile connection.
6. Confirm image URLs do not expose private object paths or require an expired signed URL for public catalog media.
7. Replace every launch-product placeholder or broken image with approved real media.','Every launch product has an approved featured image, supporting media where available, documented rights, useful alt text, and reliable public delivery.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('pricing_quantity_sets','commerce','Pricing, inventory, and checkout','Verify base prices, quantity specials, sets, coupons, and gift-card interactions',100,'critical',1,1,'/admin/products/','Public product detail, cart, checkout, and payment total','1. For each launch product, compare the stored base price with the public detail page, cart, checkout, and payment provider.
2. Test every quantity breakpoint using the exact threshold, one below, and one above.
3. Confirm the per-unit price never increases unexpectedly at a higher advertised tier.
4. For sets, confirm component quantities and requested reserved-set quantity are correct.
5. Test coupon and gift-card combinations only if those features are publicly displayed.
6. Confirm discounts cannot reduce a price below an approved floor or create a negative total.
7. Verify the server recalculates all totals and ignores browser-edited values.
8. Record screenshots or order IDs for each scenario.','Displayed and server-calculated prices, discounts, quantity tiers, sets, and final payment totals match approved business rules.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('inventory_regular_exact_once','commerce','Pricing, inventory, and checkout','Prove exact-once inventory settlement for regular products',110,'critical',1,1,'/admin/orders/','Production checkout, Stripe webhook events, orders, and inventory movements','1. Record the starting inventory of a safe test product.
2. Complete one paid production order for one unit.
3. Confirm inventory is consumed only after the approved payment event and exactly one movement is recorded.
4. Replay or resend the same webhook event and confirm no second consumption occurs.
5. Attempt a failed and an expired checkout and confirm no permanent consumption remains.
6. Compare order quantity, inventory movement, on-hand quantity, and audit history.
7. Use a compensating correction only through the reviewed inventory workflow if the test exposes a defect.','A successful payment consumes the correct quantity once, retries are idempotent, and failed or expired payment attempts do not leave stock consumed.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('inventory_sets_concurrency','commerce','Pricing, inventory, and checkout','Prove component-set reservation, zero availability, and final-unit concurrency',120,'critical',1,1,'/admin/products/','Production set product, component products, simultaneous checkout sessions','1. Create or use a safe set with known component quantities and a small temporary stock level.
2. Confirm the set availability equals the lowest whole number of complete component sets.
3. Confirm reserved components reduce the individual component availability shown publicly.
4. Reduce one component below the required quantity and confirm the set shows zero available.
5. Restore stock through a reviewed movement, not a direct database edit.
6. Open two private browser sessions and attempt to buy the final available set or final one-of-a-kind item at nearly the same time.
7. Confirm only one checkout can settle and the other receives a clear unavailable result.
8. Confirm cancellation/refund restores both set and component availability exactly once.','Set availability is component-limited, reservations are visible, zero availability is enforced, and simultaneous final-unit attempts cannot oversell.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('purchase_lots_costs','commerce','Pricing, inventory, and checkout','Reconcile tools, supplies, purchase lots, dates, and actual costs',130,'high',1,0,'/admin/inventory-operations/','Amazon order history, supplier invoices, and physical stock count','1. Open Tools & Supplies and choose Lots for each launch material.
2. Enter each separate purchase with purchase/received date, supplier, order number, ASIN or supplier SKU, quantity, unit cost, allocated tax/shipping, storage location, and expiry where applicable.
3. Keep goat milk bases, oils, mica, coloured bases, fragrance, packaging, and other batches separate when traceability matters.
4. Compare total lot remaining with the main on-hand quantity.
5. Physically count the material before applying a lot total to main inventory.
6. Use the review and APPLY LOT TOTAL confirmation rather than editing D1 directly.
7. Record quarantine, expiry, return, or consumed status accurately.
8. Verify project and product costing uses reviewed costs rather than a stale default.','Every launch material has traceable purchase evidence, physical quantity, lot status, and a reviewed cost suitable for margin calculation.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('tax_scenarios','commerce','Pricing, inventory, and checkout','Verify Canadian tax scenarios and refund tax calculations',140,'critical',1,1,'/checkout/','Production checkout, payment provider, and accountant-reviewed tax settings','1. Confirm the business tax-registration status and effective date with the owner/accountant.
2. Test an Ontario shipping address and every other province or territory the store accepts.
3. Test local pickup if enabled.
4. Confirm tax treatment for physical goods, digital items, shipping charges, discounts, gift cards, and refunds.
5. Compare the public checkout total, payment-provider amount, stored order tax, and accounting journal.
6. Confirm unsupported destinations are rejected before payment.
7. Save scenario evidence and the business rule used; do not rely only on a browser display.','Every accepted destination and product type produces the reviewed tax result, and refunds reverse the correct tax amount.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('shipping_pickup','commerce','Pricing, inventory, and checkout','Verify shipping destinations, rates, pickup, packaging, and fulfilment promises',150,'critical',1,1,'/pickup/','Checkout, carrier or shipping-rate source, packing materials, and public policies','1. List the destinations the business can actually fulfil at launch.
2. Test Ontario, another supported province, PO box handling, and US/international only when intentionally enabled.
3. Confirm package weight and dimensions for each launch-product family.
4. Compare checkout rates with the expected carrier or flat-rate policy.
5. Test local pickup instructions, pickup timing, contact details, and tax treatment.
6. Confirm free-shipping thresholds and surcharges cannot be bypassed through quantity or discount combinations.
7. Perform one physical pack test and verify the product is protected by the materials included in its cost.
8. Ensure policy text matches actual operating practice.','Every accepted address can be fulfilled at the displayed cost and timeframe, pickup instructions are accurate, and physical packaging protects the product.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('stripe_live_webhook','payments','Payments, refunds, and financial controls','Complete Stripe live capture, signed webhook, and idempotency proof',160,'critical',1,1,'/admin/webhook-events/','Stripe Dashboard → Developers → Webhooks and production payment settings','1. Confirm live Stripe keys and the production webhook signing secret are stored in Production secrets.
2. Confirm the public webhook endpoint and subscribed event types match the application.
3. Place one low-value real order with an owner-controlled payment method.
4. Confirm the payment amount, currency, order ID, customer details, and settlement status.
5. Confirm the webhook signature is verified before any state change.
6. Resend the same event and confirm the event ID is not applied twice.
7. Test a failed payment, expired checkout, and customer cancellation.
8. Record Stripe event IDs and order IDs, never secret values or full card data.','A live payment settles once, its signed webhook is verified, duplicate delivery has no duplicate effect, and failed/cancelled sessions remain recoverable.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('refund_restore','payments','Payments, refunds, and financial controls','Prove cancellation, partial/full refund, and inventory restoration',170,'critical',1,1,'/admin/orders/','Order management, payment provider, inventory movements, and accounting records','1. Use a separate paid rehearsal order after the successful-payment test.
2. Cancel before fulfilment and confirm the order status, payment state, and inventory restoration.
3. Test a full refund and, if supported publicly, a partial refund.
4. Confirm each refund creates one provider action, one order history event, one inventory restoration where appropriate, and balanced accounting entries.
5. Replay the refund webhook and confirm no second restoration or refund record occurs.
6. Confirm non-restockable or partially fulfilled items require an explicit reviewed decision.
7. Check the customer-facing refund communication.','Cancellation and refund actions are idempotent, financially traceable, communicate clearly, and restore only the inventory that should return to sale.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('paypal_visibility','payments','Payments, refunds, and financial controls','Make PayPal fully operational or completely hide it',180,'critical',1,1,'/checkout/','PayPal developer/live account and production callback settings','1. Inspect checkout, footer, payment options, and documentation for PayPal references.
2. If live credentials, callbacks, capture, cancellation, webhook, and refund paths are not proven, remove or hide PayPal from all public surfaces.
3. If PayPal will launch, use a low-value owner-controlled transaction to test approval, capture, cancellation, webhook retry, and refund.
4. Confirm order and inventory effects match the Stripe workflow and remain idempotent.
5. Record the explicit business decision and date.','Customers either receive a completely working PayPal option or see no PayPal option or promise anywhere on the live site.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('accounting_tax_reporting','payments','Payments, refunds, and financial controls','Verify bookkeeping, payment application, HST/GST review, and export controls',190,'high',1,0,'/admin/accounting/','Accountant-reviewed chart of accounts, tax settings, and export process','1. Confirm sales, tax, shipping, discounts, payment fees, refunds, inventory, cost of goods, and gift-card liabilities map to the intended accounts.
2. Confirm paid orders can be applied to receivables and provider settlements without duplicate journals.
3. Review HST/GST reporting fields and opening balances with the accountant.
4. Test an accountant export with a safe date range and confirm lower roles cannot run it.
5. Confirm month-end lock/reopen controls or document the temporary manual procedure.
6. Record unresolved accounting limitations in the operating checklist before launch volume increases.','Opening transactions can be reconciled and exported accurately, sensitive exports are authorized, and any temporary manual accounting controls are documented.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('transactional_email','communications','Customer communication and policies','Verify every required transactional email and failure path',200,'critical',1,1,'/admin/live-ops-followthrough/','Configured email provider, Gmail, Outlook, and mobile inboxes','1. Test registration or welcome, password reset, order confirmation, payment receipt, cancellation, refund, fulfilment/shipping, pickup, and review request when enabled.
2. Send only to owner-controlled test addresses.
3. Check Gmail, Outlook, and a mobile mail application.
4. Confirm sender name, reply-to, domain authentication, links, order facts, plain-text fallback, and unsubscribe requirements for non-transactional mail.
5. Trigger a safe provider failure and confirm it is visible in logs or an admin retry queue.
6. Confirm no secret, internal note, or unrelated customer data appears in the message.
7. Save provider message IDs or screenshots as evidence.','Essential messages arrive with correct facts and links, failures are observable, and a safe resend or support path exists.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('customer_support_contact','communications','Customer communication and policies','Verify contact, custom request, order-help, and customer-service response paths',210,'high',1,1,'/contact/','Public contact/custom-request forms and owner-controlled inbox','1. Submit the public contact form and any enabled custom-request form from a private browser.
2. Confirm required consent, spam protection, validation, acknowledgement, and admin visibility.
3. Ask a product, shipping, pickup, return, and custom-order question using test data.
4. Confirm the message reaches the correct owner inbox or admin queue with a useful reference.
5. Verify a customer can find order-help instructions without entering admin areas.
6. Confirm response-time promises are realistic and consistent with policy pages.
7. Delete test personal data after verification where appropriate.','Customers can reach the business, receive acknowledgement, and obtain order/product help through monitored channels with realistic response expectations.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('policies_legal','communications','Customer communication and policies','Review privacy, terms, shipping, pickup, returns, refunds, and custom-work policies',220,'critical',1,0,'/terms/','Public footer, checkout, product pages, and owner/legal review','1. Open every public policy from the footer and checkout.
2. Confirm business name, contact method, effective date, jurisdiction, shipping destinations, pickup rules, cancellation, return, refund, damaged-item, custom/personalized, digital, and privacy wording.
3. Make sure policies describe actual operations and do not promise unsupported delivery times or return rights.
4. Confirm product pages link to the policy information customers need before payment.
5. Verify privacy/data-deletion instructions reflect the data actually collected by forms, analytics, accounts, and payment providers.
6. Review special conditions for one-of-a-kind, vintage, made-to-order, and cosmetic products.
7. Record who reviewed the final policy set and when.','All customer-facing policies are findable before payment, internally consistent, dated, and aligned with the way the business will actually operate.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('soap_formula_ingredients','packaging','Soap, packaging, and regulatory readiness','Verify each soap formula, INCI order, bilingual identity, warnings, and claims',230,'critical',1,0,'/admin/packaging/soap-labels/','Verified recipe/formula records, supplier documents, bilingual review, and applicable cosmetic requirements','1. Link the soap label project to the intended finished soap product and verified recipe or formula source.
2. Enter ingredients in reviewed INCI order rather than copying supplier marketing bullets.
3. Complete matched English and French product identity, ingredient display rows, warnings, dealer/address, consumer contact, Canadian-origin wording, and metric net quantity.
4. Review fragrance, colourant, allergen, and claim obligations that apply to the final formula.
5. Confirm every displayed claim has an internal approval note and factual support.
6. Compare the structured rows against the batch record and physical product.
7. Lock the reviewed source facts before creating the final label version.','The label content reflects the actual formula and reviewed bilingual/legal facts; no ingredient or claim is inferred from artwork or supplier advertising.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('soap_print_proof','packaging','Soap, packaging, and regulatory readiness','Generate, measure, wrap-test, approve, and archive each soap label',240,'critical',1,0,'/admin/packaging/soap-labels/','100% physical printer proof and PACKAGING_STUDIO.md','1. Use PACKAGING_STUDIO.md as the single packaging source of truth.
2. Generate the continuous ribbon from structured records and save a review version.
3. Print at 100% with browser/page scaling disabled.
4. Measure strip width, band height, front oval, rear seal, bleed, and safe-area result.
5. Test both the photo-fit and true-50-mm profile if the final physical geometry is not yet chosen.
6. Wrap the actual soap and inspect front centring, folds, overlap/glue, ingredient legibility, French text, claims, net weight, barcode/batch zones, and colour.
7. Upload or link a proof photo, record printer/paper, and mark fit, legibility, and overlap separately.
8. Approve and archive only the version that passed; supersede rather than silently overwrite an approved label.','Each launch soap has a saved, physically measured, wrapped, passed, approved, and archived label version linked to its exact structured source data.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('health_canada_notification','packaging','Soap, packaging, and regulatory readiness','Prepare Health Canada cosmetic notification and change control',250,'critical',1,1,'/admin/startup-readiness/','Health Canada Cosmetic Notification Form and official guidance','1. Determine which launch products are cosmetics and identify the responsible manufacturer or importer.
2. Prepare product identity, intended use, company/contact, first-sale date, formula ingredients, concentration ranges, and other required notification information.
3. Submit the Cosmetic Notification Form within the applicable period after first sale; current official guidance states within 10 days after first sale in Canada.
4. Save the submission confirmation or reference outside the public website and record a safe evidence pointer here.
5. Create a change-control rule for name, formula, concentration, company, contact, or other reportable changes.
6. Review the Cosmetic Ingredient Hotlist and other applicable official requirements before release.
7. Do not treat an app-generated label or notification record as legal approval.','Every applicable cosmetic has an owner, prepared/submitted notification evidence, and a documented process for later formula or business-detail changes.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('packaging_prepress_boundary','packaging','Soap, packaging, and regulatory readiness','Confirm the packaging export is suitable for the chosen printer and production method',260,'high',1,0,'/admin/packaging-studio/','Chosen printer, paper/stock, cutter, colour profile, and production proof','1. Confirm whether the printer accepts SVG, browser-generated PDF, or requires a prepress PDF with crop/bleed boxes and embedded/outlined fonts.
2. Verify the exact media size, bleed, safe area, crop marks, colour mode/profile, and no-scaling setting.
3. Confirm the rose and icon assets remain sharp and licensed/owned for production use.
4. Print a calibration ruler and compare measured output to the design dimensions.
5. Record printer, paper, driver, scaling, colour, and cutting settings.
6. Keep browser Print/Save PDF labelled as preparation until the chosen printer accepts it as final production output.
7. Archive the source SVG, delivered file, checksum, and proof result.','The chosen printer and material reproduce the approved dimensions, type, colour, bleed, and cut safely using an archived export and documented settings.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('analytics_consent','discovery','Search, analytics, accessibility, and quality','Verify analytics, consent, privacy boundaries, and commerce event accuracy',270,'high',1,1,'/admin/site-analytics/','GA4 or configured analytics property and browser developer tools','1. Confirm the production analytics identifier is loaded once on public pages and not duplicated by multiple scripts.
2. Test page_view, view_item, add_to_cart, begin_checkout, purchase, refund, contact, and custom-request events that are actually enabled.
3. Confirm transaction IDs prevent duplicate purchase events after refresh.
4. Verify no secret, password, payment detail, private admin note, or unnecessary personal data is sent.
5. Test consent or privacy controls required by the chosen analytics setup.
6. Exclude admin and preview traffic where practical.
7. Compare one test order with analytics and the stored order.','Public and commerce activity is observable once, privacy boundaries are respected, and analytics values can be reconciled to a test transaction.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('search_console_indexing','discovery','Search, analytics, accessibility, and quality','Verify sitemap, robots, canonical URLs, Search Console, and index coverage',280,'high',1,1,'/sitemap.xml','Google Search Console for devilndove.com','1. Open robots.txt and sitemap.xml on the production domain and confirm both load successfully.
2. Confirm the sitemap contains only intended canonical public URLs and excludes admin/private pages.
3. Verify the domain property in Search Console and submit the sitemap.
4. Inspect the home page, shop, one category/local page, and several product-detail URLs.
5. Confirm canonical URLs use the production domain and query-based product pages resolve consistently.
6. Review index coverage, mobile usability, structured-data reports, manual actions, and security issues.
7. Record important indexing problems as separate work items rather than repeatedly changing titles without evidence.','Search Console owns the production property, the sitemap/canonical system is correct, and representative public pages are crawlable without critical index or security errors.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('google_business_profile','discovery','Search, analytics, accessibility, and quality','Complete and verify Google Business Profile and local-business consistency',290,'high',1,1,'/contact/','Google Business Profile for Devil n Dove','1. Confirm the profile name, primary/secondary categories, phone, website, service or pickup area, hours, special hours, description, products/services, and photos are accurate.
2. Keep address visibility consistent with how customers actually visit or receive products.
3. Compare business name, phone, website, and locality wording with the website and major directory profiles.
4. Add current real photos and respond to legitimate reviews without incentives that violate platform rules.
5. Use local wording only where it truthfully reflects pickup, service, market, or delivery reach.
6. Record monthly evidence and any profile correction task.
7. Do not promise or report a guaranteed first-page position; monitor relevance, distance, and prominence over time.','The Business Profile is complete, accurate, consistent with the website, actively maintained, and supported by real local proof and customer trust.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('seo_page_quality','discovery','Search, analytics, accessibility, and quality','Run the public SEO, title, H1, structured-data, image, and internal-link audit',300,'high',1,1,'/admin/local-seo-review/','Production public pages, Google rich-result tools, and Search Console','1. Scan every indexable HTML page for one and only one H1, a distinctive title, useful meta description, canonical URL, robots directive, and meaningful visible introduction.
2. Make the main title visually unambiguous; avoid multiple headings with equal title prominence.
3. Use descriptive buyer language in titles, headings, product facts, image alt text, and internal links without stuffing locations or keywords.
4. Validate Organization/LocalBusiness, Breadcrumb, Product, Offer, image, and other applicable structured data against visible facts.
5. Confirm Product schema includes the approved gallery images, current price, currency, availability, SKU, and canonical offer URL.
6. Check crawlable internal links to important shop, category, policy, contact, story, and local relevance pages.
7. Review duplicate/thin pages and redirect or noindex where appropriate.
8. Record before/after evidence for changes rather than guessing from rankings.','All indexable pages pass the one-H1 and metadata audit, structured data matches visible facts, and important pages are discoverable through descriptive crawlable links.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('mobile_accessibility_performance','discovery','Search, analytics, accessibility, and quality','Complete real-device mobile, keyboard, accessibility, and performance testing',310,'critical',1,1,'/admin/post-deploy-smoke-tests/','Real phones/tablet/desktop, Lighthouse/PageSpeed, keyboard, and screen-reader checks','1. Test a narrow phone, large phone, tablet, laptop, and large desktop in portrait and landscape where relevant.
2. Complete navigation, product view/gallery, cart, checkout, login, password reset, contact, and critical admin workflows.
3. Confirm touch targets, sticky actions, form labels, validation, focus visibility, keyboard order, dialogs, tables, and horizontal overflow.
4. Check colour contrast and text readability in dark/light surfaces used by the site.
5. Test with images disabled or a slow connection and confirm useful fallback content.
6. Run Lighthouse/PageSpeed on home, shop, product detail, contact, and an important local/content page on mobile and desktop.
7. Fix critical accessibility errors and layout overlap before launch; document lower-priority performance work.
8. Re-run after CSS or image changes.','Critical customer journeys work on target devices and keyboard, no blocking accessibility or overlap defect remains, and performance evidence is recorded.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('social_oauth_visibility','discovery','Search, analytics, accessibility, and quality','Keep social publishing controls review-first until provider OAuth is approved',320,'medium',1,1,'/admin/social-hub/','Meta, Pinterest, YouTube, TikTok, and other configured provider developer consoles','1. List each social provider shown in the admin or public interface.
2. Confirm callback URLs, privacy/data-deletion pages, scopes, app review, tokens, and page/account identifiers are approved and current.
3. Keep automatic publishing disabled for providers that are not completely connected.
4. Test draft generation, deliberate approval, one safe publish, provider response, and analytics link tracking separately.
5. Confirm failure or token expiry leaves content in review rather than falsely marked published.
6. Hide unfinished public promises or buttons; social OAuth is not a blocker to selling when publishing remains manual.','Unapproved providers remain disabled and honestly labelled; any enabled provider publishes only after deliberate review with observable success/failure evidence.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('backup_restore_rehearsal','operations','Recovery, fulfilment, and controlled opening','Rehearse D1, R2, deployment, and configuration recovery',330,'critical',1,1,'/admin/deployment-preflight/','Cloudflare D1 backups/exports, R2, Pages deployments, and secure configuration records','1. Create a test or copied environment that can be restored without risking production customer data.
2. Restore a recent D1 backup and verify users, products, inventory, orders, packaging, and readiness records.
3. Verify R2 object inventory and restore or re-link a safe test media object.
4. Roll back to a previous Pages deployment, run smoke tests, then return to the current deployment.
5. Confirm required variable and binding names are documented outside the code without storing secret values in the repository.
6. Measure recovery time and record the operator steps that were confusing or missing.
7. Update the recovery guide after the rehearsal.','A tested operator can restore database, media, deployment, and required configuration within an acceptable time using documented steps.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('paid_order_fulfilment_rehearsal','operations','Recovery, fulfilment, and controlled opening','Complete a real paid order from product view through fulfilment',340,'critical',1,1,'/admin/orders/','Public store, payment provider, email, packaging, pickup/shipping, inventory, and accounting','1. Use a launch product and an owner-controlled customer identity/payment method.
2. Start from the public Shop, inspect the product gallery/facts, add to cart, and complete checkout.
3. Confirm payment, webhook, order, inventory, tax, shipping/pickup, email, and accounting records.
4. Pick the physical item, verify lot/batch where relevant, package it with the approved label/materials, and mark fulfilment.
5. Confirm the customer receives the correct fulfilment or pickup message.
6. Compare actual labour, packaging, shipping, provider fee, and margin with the stored assumptions.
7. Save order ID, timestamps, and issues; never store full payment credentials.','One real order completes end to end with correct product, money, stock, communication, packaging, fulfilment, and reconciliable records.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('separate_refund_rehearsal','operations','Recovery, fulfilment, and controlled opening','Complete a separate cancellation/refund rehearsal and customer recovery',350,'critical',1,1,'/admin/orders/','Production payment, order, inventory, email, and accounting systems','1. Use a different low-value owner-controlled rehearsal order so the paid-order proof remains intact.
2. Test the actual cancellation/refund workflow an operator will use.
3. Confirm provider refund, order history, customer email, inventory decision, tax reversal, fee treatment, and accounting entries.
4. Confirm the item is returned to sellable stock only after physical/operational review where required.
5. Replay the provider event and confirm the recovery action remains idempotent.
6. Document the customer-service wording and escalation path for a failed automated step.','A separate refund/cancellation can be completed safely, communicated clearly, reconciled, and repeated webhook delivery cannot duplicate its effects.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('launch_monitoring_ownership','operations','Recovery, fulfilment, and controlled opening','Assign launch-day ownership, monitoring, support, and stop conditions',360,'critical',1,0,'/admin/startup-readiness/','Internal launch operating plan','1. Name the person responsible for orders, payments, inventory, email, customer messages, site incidents, and public updates during opening.
2. Define the hours the store will be actively monitored during the first days.
3. Write stop conditions for payment mismatch, oversell, repeated 500 errors, lost email, wrong tax, broken fulfilment, or unsafe product/label concern.
4. Record how to hide checkout, archive a product, roll back a deployment, contact customers, and preserve evidence.
5. Confirm the owner can access the required dashboards and recovery instructions from a phone.
6. Prepare a short daily review of orders, incidents, inventory, refunds, and customer questions.','Each launch responsibility has an owner and the team has clear monitoring, escalation, rollback, and temporary-stop instructions.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;
INSERT INTO startup_readiness_items (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active) VALUES ('controlled_opening','operations','Recovery, fulfilment, and controlled opening','Open with controlled stock, limited products, and a reversible rollout',370,'critical',1,1,'/admin/startup-readiness/','Production store and launch operating decision','1. Confirm every critical readiness item is Complete or has a formally justified Not Applicable decision.
2. Keep the opening-day product list small and inventory conservative.
3. Open to a limited audience or quiet public release before paid promotion.
4. Monitor the first orders in real time and compare every system record.
5. Pause sales immediately if a stop condition is reached.
6. Add products and automation gradually only after the core order, inventory, email, refund, and fulfilment paths remain stable.
7. Record the opening time, product count, owner on duty, and first review time.','The store opens through a monitored, reversible, low-risk release with no unresolved critical blocker and a clear pause/rollback path.',1) ON CONFLICT(item_key) DO UPDATE SET phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP;

-- Build 227 — unified labeling/packaging BOM and immutable client documents.
CREATE TABLE IF NOT EXISTS packaging_components (
  packaging_component_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER,
  component_type TEXT NOT NULL DEFAULT 'label',
  component_name TEXT NOT NULL,
  sku_reference TEXT,
  quantity_per_finished_unit REAL NOT NULL DEFAULT 1,
  wastage_percent REAL NOT NULL DEFAULT 0,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  lot_tracking_required INTEGER NOT NULL DEFAULT 0,
  supplier_name TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_packaging_components_project ON packaging_components(packaging_project_id,is_active,packaging_component_id);
CREATE INDEX IF NOT EXISTS idx_packaging_components_inventory ON packaging_components(site_item_inventory_id,is_active);

CREATE TABLE IF NOT EXISTS customer_document_sequences (
  document_type TEXT NOT NULL,
  sequence_year INTEGER NOT NULL,
  next_number INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(document_type,sequence_year)
);

CREATE TABLE IF NOT EXISTS customer_documents (
  customer_document_id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_number TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL,
  order_id INTEGER NOT NULL,
  refund_id INTEGER,
  document_status TEXT NOT NULL DEFAULT 'issued',
  currency TEXT NOT NULL DEFAULT 'CAD',
  document_amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_adjustment_cents INTEGER NOT NULL DEFAULT 0,
  issue_reason TEXT,
  customer_email TEXT,
  business_name TEXT,
  business_registration_number TEXT,
  source_snapshot_json TEXT NOT NULL,
  issued_by_user_id INTEGER,
  issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  voided_by_user_id INTEGER,
  voided_at TEXT,
  void_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE RESTRICT,
  FOREIGN KEY(refund_id) REFERENCES payment_refunds(refund_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_customer_documents_order ON customer_documents(order_id,issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type_status ON customer_documents(document_type,document_status,issued_at DESC);

INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active)
VALUES
('product-label-rectangle-v1','General product label — rectangle','product_label','Structured bilingual general-purpose label for non-soap products. Confirm the physical dieline and category-specific legal fields before approval.',88.9,50.8,88.9,50.8,0,0,'{"sections":["identity","description","net_quantity","dealer_contact","batch_barcode"],"dimension_profile":"general_rectangle","bleed_mm":3,"safe_margin_mm":3}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1),
('candle-label-v1','Candle label — bilingual rectangle','candle_label','General candle-label working profile with review-first warnings and net quantity. Confirm vessel fit and current hazard requirements.',76.2,50.8,76.2,50.8,0,0,'{"sections":["identity","scent","net_quantity","warnings","dealer_contact","batch"],"dimension_profile":"candle_rectangle","bleed_mm":3,"safe_margin_mm":3}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1),
('jewelry-card-v1','Jewelry display card','jewelry_card','Display-card working profile with product identity, maker/contact, care and inventory references.',63.5,88.9,63.5,88.9,0,0,'{"sections":["brand","identity","care","maker_contact","sku_barcode"],"dimension_profile":"jewelry_card","bleed_mm":3,"safe_margin_mm":3}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1),
('package-insert-a6-v1','Package insert / care card — A6','package_insert','Customer-facing insert for care, thank-you, support, QR and reorder information.',105,148,105,148,0,0,'{"sections":["brand","message","care","support","qr"],"dimension_profile":"a6_insert","bleed_mm":3,"safe_margin_mm":5}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1);

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES ('build227_unified_business_operations','database_build227_unified_business_operations.sql',CURRENT_TIMESTAMP,'Adds a business-wide packaging component BOM/cost layer and immutable sequential invoices, receipts, packing slips, credit notes, and refund-confirmation snapshots.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;

-- Build 228 — master Creative Automation workflow and clear prelaunch stages.
CREATE TABLE IF NOT EXISTS creative_automation_workflows (
  creative_automation_workflow_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_key TEXT NOT NULL UNIQUE,
  creative_work_project_id INTEGER NOT NULL UNIQUE,
  workflow_status TEXT NOT NULL DEFAULT 'planning',
  current_stage_key TEXT NOT NULL DEFAULT 'process',
  owner_user_id INTEGER,
  due_date TEXT,
  blocked_reason TEXT,
  operator_notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_automation_stage_reviews (
  creative_automation_stage_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_automation_workflow_id INTEGER NOT NULL,
  stage_key TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'not_started',
  evidence_reference TEXT,
  review_notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_automation_workflow_id,stage_key),
  FOREIGN KEY(creative_automation_workflow_id) REFERENCES creative_automation_workflows(creative_automation_workflow_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_automation_events (
  creative_automation_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_automation_workflow_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  stage_key TEXT,
  previous_status TEXT,
  next_status TEXT,
  details_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_automation_workflow_id) REFERENCES creative_automation_workflows(creative_automation_workflow_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_automation_workflows_status
  ON creative_automation_workflows(workflow_status,current_stage_key,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_automation_stage_reviews_workflow
  ON creative_automation_stage_reviews(creative_automation_workflow_id,stage_key,review_status);
CREATE INDEX IF NOT EXISTS idx_creative_automation_events_workflow
  ON creative_automation_events(creative_automation_workflow_id,created_at DESC);

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build228_creative_automation_prelaunch_stages',
  'database_build228_creative_automation_prelaunch_stages.sql',
  CURRENT_TIMESTAMP,
  'Adds one orchestration layer over existing Creative Process, CAIP, Content Studio, Release Board, and social stages without duplicating their source facts. Startup gates remain authoritative and prelaunch routes remain separate.'
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,
  notes=excluded.notes;
