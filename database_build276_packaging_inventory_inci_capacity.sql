-- Build 276 — Packaging ingredient Inventory traceability + long INCI label capacity
-- Apply once after Build 274/275 and existing Packaging Studio migrations.
-- This migration does NOT create Inventory movements and does NOT change on-hand quantities.

PRAGMA foreign_keys = ON;

ALTER TABLE packaging_project_ingredients
  ADD COLUMN site_item_inventory_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_packaging_project_ingredients_inventory
  ON packaging_project_ingredients(site_item_inventory_id, packaging_project_id, sort_order);

INSERT INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  updated_at
)
VALUES (
  'build276_packaging_inventory_inci_capacity',
  'database_build276_packaging_inventory_inci_capacity.sql',
  'applied',
  0,
  CURRENT_TIMESTAMP,
  'Adds reference-only Inventory identity to structured Packaging Studio ingredient rows. Packaging Studio does not consume/reserve stock. Build 276 also moves long soap labels to a single ordered INCI declaration across both ribbon ingredient panels in application code.',
  CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,
  status='applied',
  destructive=0,
  notes=excluded.notes,
  updated_at=CURRENT_TIMESTAMP;
