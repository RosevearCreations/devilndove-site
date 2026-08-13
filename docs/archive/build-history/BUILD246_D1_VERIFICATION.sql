-- Devil n Dove Build 246 — read-only D1 verification.
-- Run after database_build246_product_project_production_packaging.sql.
-- This file intentionally contains SELECT/PRAGMA diagnostics only.

SELECT migration_key, file_name, status, destructive, applied_at
FROM schema_migration_ledger
WHERE migration_key = 'build246_product_project_production_packaging';

SELECT name AS required_build246_table
FROM sqlite_schema
WHERE type = 'table'
  AND name IN (
    'creative_project_deletion_audit',
    'product_resource_ingredient_profiles',
    'product_production_runs',
    'product_production_run_materials',
    'packaging_translation_reviews'
  )
ORDER BY name;

SELECT setting_key, setting_value
FROM app_settings
WHERE setting_key IN (
  'site.product.generated_project_shell_delete_policy',
  'site.creative_project.delete_inventory_policy',
  'site.product.production_release_policy',
  'site.packaging.soap_design_policy',
  'site.packaging.french_generation_policy'
)
ORDER BY setting_key;

-- A result here identifies label ingredients that still need a reviewed INCI value
-- before a finished-product/soap-label release can be considered complete.
SELECT prl.product_id,
       pir.product_resource_link_id,
       COALESCE(NULLIF(TRIM(pir.ingredient_name_en),''), '[unnamed ingredient]') AS ingredient_name,
       pir.translation_review_status
FROM product_resource_ingredient_profiles pir
JOIN product_resource_links prl
  ON prl.product_resource_link_id = pir.product_resource_link_id
WHERE COALESCE(pir.is_label_ingredient,0) = 1
  AND TRIM(COALESCE(pir.inci_name,'')) = ''
ORDER BY prl.product_id, pir.label_sort_order, pir.product_resource_link_id;

-- Posted production runs should have a unique run_key. Zero rows is expected.
SELECT run_key, COUNT(*) AS duplicate_count
FROM product_production_runs
GROUP BY run_key
HAVING COUNT(*) > 1;

SELECT run_status, COUNT(*) AS production_run_count
FROM product_production_runs
GROUP BY run_status
ORDER BY run_status;

SELECT COUNT(*) AS project_deletion_audit_count
FROM creative_project_deletion_audit;

SELECT review_status, COUNT(*) AS translation_review_count
FROM packaging_translation_reviews
GROUP BY review_status
ORDER BY review_status;

-- Build 243/244 identity guard retained: zero rows is expected for active
-- inventory records that differ only by source-type case.
SELECT LOWER(TRIM(source_type)) AS source_type_lower,
       external_key,
       COUNT(*) AS duplicate_count
FROM site_item_inventory
WHERE COALESCE(is_active,1) = 1
GROUP BY LOWER(TRIM(source_type)), external_key
HAVING COUNT(*) > 1;

-- Controlled inventory classifications should be lower-case. Zero rows is expected.
SELECT site_item_inventory_id, source_type, category, reuse_status
FROM site_item_inventory
WHERE (source_type IS NOT NULL AND source_type <> LOWER(source_type))
   OR (category IS NOT NULL AND category <> LOWER(category))
   OR (reuse_status IS NOT NULL AND reuse_status <> LOWER(reuse_status))
ORDER BY site_item_inventory_id
LIMIT 100;

PRAGMA foreign_key_check;

-- Retained Build 245 product-media integrity checks. These are read-only and
-- help verify that supporting gallery rows survived historical recovery.
SELECT
  (SELECT COUNT(*) FROM product_media_integrity_snapshots) AS media_integrity_snapshots,
  (SELECT COUNT(*) FROM product_images WHERE TRIM(COALESCE(image_url,'')) <> '') AS product_gallery_rows,
  (SELECT COUNT(*) FROM product_seo WHERE TRIM(COALESCE(og_image_url,'')) <> '') AS products_with_seo_social_image;

-- Products where linked/history sources still contain more unique recoverable
-- URLs than the canonical Product Editor gallery should be reviewed.
SELECT p.product_id,
       p.name,
       s.product_image_count,
       s.media_asset_count,
       s.role_assignment_image_count,
       s.annotation_image_count,
       s.recoverable_unique_image_count,
       s.featured_image_url
FROM product_media_integrity_snapshots s
JOIN products p ON p.product_id = s.product_id
WHERE s.product_media_integrity_snapshot_id = (
  SELECT s2.product_media_integrity_snapshot_id
  FROM product_media_integrity_snapshots s2
  WHERE s2.product_id = s.product_id
  ORDER BY s2.created_at DESC, s2.product_media_integrity_snapshot_id DESC
  LIMIT 1
)
  AND s.recoverable_unique_image_count > s.product_image_count
ORDER BY (s.recoverable_unique_image_count - s.product_image_count) DESC, p.product_id
LIMIT 100;

-- Duplicate gallery URLs inside one product should ideally return zero rows.
SELECT product_id,
       LOWER(TRIM(image_url)) AS normalized_image_url,
       COUNT(*) AS duplicate_count
FROM product_images
WHERE TRIM(COALESCE(image_url,'')) <> ''
GROUP BY product_id, LOWER(TRIM(image_url))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, product_id;

-- Products with gallery evidence but no featured image should ideally return zero rows.
SELECT p.product_id, p.name, COUNT(pi.product_image_id) AS gallery_rows
FROM products p
JOIN product_images pi
  ON pi.product_id = p.product_id
 AND TRIM(COALESCE(pi.image_url,'')) <> ''
WHERE TRIM(COALESCE(p.featured_image_url,'')) = ''
GROUP BY p.product_id, p.name
ORDER BY p.product_id;

-- SEO/social image persistence review: these products have a featured image but
-- no stored OG image. Build 246 preserves an existing OG choice on normal edits.
SELECT p.product_id, p.name, p.featured_image_url
FROM products p
LEFT JOIN product_seo ps ON ps.product_id = p.product_id
WHERE TRIM(COALESCE(p.featured_image_url,'')) <> ''
  AND TRIM(COALESCE(ps.og_image_url,'')) = ''
ORDER BY p.product_id
LIMIT 100;
