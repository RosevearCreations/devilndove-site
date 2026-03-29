-- Current pass note: movie shelf layout and risk-documentation sweep completed; no schema structure changes were required in this pass.
-- Current pass note: no brand-new required tables were added in this pass; the main work was endpoint hardening against partially migrated or lightly seeded D1 data so admin and storefront JSON routes fail gracefully instead of returning HTML errors.
-- File: /database_upgrade_current_pass.sql
-- Brief description: One-time upgrade SQL for existing Devil n Dove databases that were created
-- before the latest payment, media, SEO/search, and inventory-movement pass.
--
-- Run carefully on an existing database that is missing these newer objects/columns.
-- D1 / SQLite does not support ADD COLUMN IF NOT EXISTS, so duplicate-column errors such as
-- "duplicate column name: payment_status" mean that specific column is already present and can be skipped.
-- Continue running the remaining statements that apply.

PRAGMA foreign_keys = ON;

ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE products ADD COLUMN tax_class_code TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

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
  deleted_at TEXT,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_status ON webhook_events(provider, process_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_product_id ON media_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);


ALTER TABLE webhook_events ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE webhook_events ADD COLUMN last_attempt_at TEXT;
ALTER TABLE webhook_events ADD COLUMN next_retry_at TEXT;
ALTER TABLE webhook_events ADD COLUMN replay_requested_at TEXT;
ALTER TABLE webhook_events ADD COLUMN replay_requested_by_user_id INTEGER;
ALTER TABLE webhook_events ADD COLUMN dispatch_notes TEXT;
ALTER TABLE media_assets ADD COLUMN variant_role TEXT;
ALTER TABLE media_assets ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE media_assets ADD COLUMN annotation_notes TEXT;
ALTER TABLE site_item_inventory ADD COLUMN reserved_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE site_item_inventory ADD COLUMN incoming_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE site_item_inventory ADD COLUMN unit_cost_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE site_item_inventory ADD COLUMN supplier_name TEXT;
ALTER TABLE site_item_inventory ADD COLUMN supplier_sku TEXT;

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
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_id ON payment_refunds(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_order_id ON payment_disputes(order_id, dispute_status);


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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_inventory_movements_item_id ON site_inventory_movements(site_item_inventory_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_inventory_movements_created_at ON site_inventory_movements(created_at DESC);


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


-- Staged migration table for tools, supplies, and featured creations.

CREATE TABLE IF NOT EXISTS catalog_items (
  catalog_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_kind TEXT NOT NULL CHECK (item_kind IN ('tool','supply','creation','other')),
  source_key TEXT NOT NULL,
  slug TEXT,
  name TEXT NOT NULL,
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

-- Note for SQLite/D1 upgrades: duplicate column errors can be harmless when a prior pass already added a field.

-- Movies catalog migration foundation for richer title/actor/director/year data.


CREATE TABLE IF NOT EXISTS movie_catalog (
  movie_catalog_id INTEGER PRIMARY KEY AUTOINCREMENT,
  upc TEXT NOT NULL UNIQUE,
  slug TEXT,
  title TEXT,
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
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  UNIQUE(product_id, resource_kind, source_key)
);
CREATE INDEX IF NOT EXISTS idx_product_resource_links_product ON product_resource_links(product_id, sort_order);


ALTER TABLE site_item_inventory ADD COLUMN image_url TEXT;
ALTER TABLE site_item_inventory ADD COLUMN preferred_reorder_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE site_item_inventory ADD COLUMN is_on_reorder_list INTEGER NOT NULL DEFAULT 0;
ALTER TABLE site_item_inventory ADD COLUMN do_not_reorder INTEGER NOT NULL DEFAULT 0;
ALTER TABLE site_item_inventory ADD COLUMN do_not_reuse INTEGER NOT NULL DEFAULT 0;
ALTER TABLE site_item_inventory ADD COLUMN reuse_status TEXT;

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
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  UNIQUE(product_id, resource_kind, source_key)
);
CREATE INDEX IF NOT EXISTS idx_product_resource_links_product ON product_resource_links(product_id, sort_order);


-- Movie enrichment additions for trailer support
ALTER TABLE movie_catalog ADD COLUMN trailer_url TEXT;

-- Product resource story linkage already exists in base schema; keep using product_resource_links.


-- Current pass note: the public movies page uses front_image_url/back_image_url from data/movies/movie_catalog_enriched.json and can derive a trailer search URL at runtime when trailer_url is blank.


-- Current pass: mobile finished-product capture support.
ALTER TABLE products ADD COLUMN product_number INTEGER;
ALTER TABLE products ADD COLUMN product_category TEXT;
ALTER TABLE products ADD COLUMN color_name TEXT;
ALTER TABLE products ADD COLUMN shipping_code TEXT;
ALTER TABLE products ADD COLUMN review_status TEXT NOT NULL DEFAULT 'pending_review';
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_number ON products(product_number);
UPDATE products
SET review_status = CASE WHEN COALESCE(status, 'draft') = 'active' THEN 'published' ELSE 'pending_review' END
WHERE review_status IS NULL OR review_status = '';

ALTER TABLE auth_recovery_requests ADD COLUMN ip_address TEXT;
ALTER TABLE auth_recovery_requests ADD COLUMN user_agent TEXT;

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

-- Note: duplicate-column warnings are expected in D1/SQLite when these columns already exist.
