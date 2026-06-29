-- Devil n Dove Build 197 — admin resilience, non-destructive media saves, and category governance.
-- Run after database_build196_product_correction_material_returns.sql.
-- This migration is additive and safe to rerun.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Records media changes without relying on a media file remaining attached forever.
-- This supports safe, explainable editor behaviour: saves preserve existing files unless
-- an administrator explicitly selects an image for deletion.
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

-- Fast read paths for the product-detail, catalog, and media editors.
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
