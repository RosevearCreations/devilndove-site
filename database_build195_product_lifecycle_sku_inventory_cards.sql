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
