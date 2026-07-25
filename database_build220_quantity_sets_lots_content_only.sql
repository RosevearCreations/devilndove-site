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
