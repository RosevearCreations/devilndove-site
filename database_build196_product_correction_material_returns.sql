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
