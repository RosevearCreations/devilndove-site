-- File: /database_full_schema.sql
-- Brief description: Full current database schema for the Devil n Dove platform.
-- Apply on a fresh database to create the complete current auth, commerce, payment,
-- media, analytics, notifications, profiles, and access-tier structure.

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
  description TEXT,
  tax_rate REAL NOT NULL DEFAULT 0.13,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  product_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
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
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tax_class_id) REFERENCES tax_classes(tax_class_id)
);

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
  deleted_at TEXT,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON payments(provider_order_id);
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
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_id ON payment_refunds(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_order_id ON payment_disputes(order_id, dispute_status);


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
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_item_inventory (
  site_item_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  external_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  source_url TEXT,
  amazon_url TEXT,
  on_hand_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  incoming_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  supplier_name TEXT,
  supplier_sku TEXT,
  reorder_notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_type, external_key)
);


CREATE TABLE IF NOT EXISTS site_inventory_movements (
  site_inventory_movement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER,
  source_type TEXT,
  external_key TEXT,
  item_name TEXT,
  movement_type TEXT NOT NULL DEFAULT 'adjustment' CHECK (movement_type IN ('create','adjustment','reserve','release','incoming','delete','correction')),
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


INSERT OR IGNORE INTO app_settings (setting_key, setting_value, is_public)
VALUES
  ('site.seo.business_name', 'Devil n Dove', 1),
  ('site.seo.default_title_suffix', 'Devil n Dove', 1),
  ('site.seo.default_description', 'Devil n Dove is a Southern Ontario creative workshop and online store focused on handcrafted jewelry, custom artisan goods, tools, supplies, and maker projects.', 1),
  ('site.seo.default_keywords', 'Devil n Dove, handmade jewelry Ontario, artisan workshop, creative supplies, workshop tools, polymer clay jewelry, maker shop Southern Ontario', 1),
  ('site.seo.primary_h1_pattern', 'Devil n Dove | Handmade Jewelry, Creative Supplies, and Workshop Tools in Southern Ontario', 1),
  ('site.business.primary_location', 'Tillsonburg, Ontario, Canada', 1),
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
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auth_recovery_requests_status_created_at ON auth_recovery_requests(status, created_at DESC);
