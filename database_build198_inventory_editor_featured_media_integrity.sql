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
