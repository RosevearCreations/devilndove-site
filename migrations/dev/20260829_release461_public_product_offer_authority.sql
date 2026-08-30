-- Devil n Dove Release 461 — Development-only public product-offer schema authority.
-- Runtime requests must never create/alter this schema. No historical replay.
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
CREATE INDEX IF NOT EXISTS idx_product_quantity_price_tiers_product ON product_quantity_price_tiers(product_id, is_active, min_quantity);

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
CREATE INDEX IF NOT EXISTS idx_product_bundle_components_bundle ON product_bundle_components(bundle_product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_bundle_components_component ON product_bundle_components(component_product_id, bundle_product_id);

SELECT COUNT(*) AS release461_offer_tier_columns FROM pragma_table_info('product_quantity_price_tiers') WHERE name IN ('product_quantity_price_tier_id','product_id','min_quantity','unit_price_cents','label','is_active','sort_order','created_by_user_id','created_at','updated_at');
SELECT COUNT(*) AS release461_bundle_settings_columns FROM pragma_table_info('product_bundle_settings') WHERE name IN ('bundle_product_id','requested_bundle_quantity','reserved_bundle_quantity','reservation_status','shortage_notes','updated_by_user_id','created_at','updated_at');
SELECT COUNT(*) AS release461_bundle_component_columns FROM pragma_table_info('product_bundle_components') WHERE name IN ('product_bundle_component_id','bundle_product_id','component_product_id','quantity_per_bundle','reserved_component_quantity','sort_order','notes','created_at','updated_at');
SELECT COUNT(*) AS release461_offer_indexes FROM sqlite_master WHERE type='index' AND name IN ('idx_product_quantity_price_tiers_product','idx_product_bundle_components_bundle','idx_product_bundle_components_component');
PRAGMA foreign_key_check;
