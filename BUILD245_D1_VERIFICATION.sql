-- Devil n Dove Build 245 read-only production verification.
-- Run AFTER database_build245_admin_media_resilience.sql.
-- This file contains SELECT/PRAGMA only and does not modify production data.

SELECT migration_key, file_name, status, destructive, applied_at
FROM schema_migration_ledger
WHERE migration_key IN (
  'build244_inventory_authority_fractional_usage',
  'build245_admin_media_resilience'
)
ORDER BY migration_key;

SELECT setting_key, setting_value
FROM app_settings
WHERE setting_key IN (
  'site.inventory.catalog_authority',
  'site.inventory.fractional_usage_policy',
  'site.admin.auth_degraded_policy',
  'site.product.media_integrity_policy',
  'site.inventory.bootstrap_policy'
)
ORDER BY setting_key;

SELECT
  (SELECT COUNT(*) FROM catalog_items WHERE item_kind IN ('tool','supply')) AS d1_catalog_tools_supplies,
  (SELECT COUNT(*) FROM site_item_inventory WHERE COALESCE(is_active,1)=1 AND source_type IN ('tool','supply')) AS active_inventory_tools_supplies,
  (SELECT COUNT(*) FROM site_inventory_usage_profiles) AS usage_profiles,
  (SELECT COUNT(*) FROM product_media_integrity_snapshots) AS media_integrity_snapshots;

-- Any rows here need classification/case review.
SELECT LOWER(TRIM(source_type)) AS source_type,
       external_key,
       COUNT(*) AS active_duplicate_count
FROM site_item_inventory
WHERE COALESCE(is_active,1)=1
  AND source_type IN ('tool','supply')
GROUP BY LOWER(TRIM(source_type)), external_key
HAVING COUNT(*) > 1
ORDER BY active_duplicate_count DESC, source_type, external_key;

-- Controlled values that are not lower-case should be reviewed. Display names/URLs/ASINs/SKUs are intentionally excluded.
SELECT site_item_inventory_id, source_type, category, stock_unit_label, usage_unit_label
FROM site_item_inventory
WHERE COALESCE(source_type,'') <> LOWER(COALESCE(source_type,''))
   OR COALESCE(category,'') <> LOWER(COALESCE(category,''))
   OR COALESCE(stock_unit_label,'') <> LOWER(COALESCE(stock_unit_label,''))
   OR COALESCE(usage_unit_label,'') <> LOWER(COALESCE(usage_unit_label,''))
ORDER BY site_item_inventory_id
LIMIT 100;

SELECT usage_tracking_mode, COUNT(*) AS profile_count
FROM site_inventory_usage_profiles
GROUP BY usage_tracking_mode
ORDER BY usage_tracking_mode;

-- Products where linked/history sources contain more unique recoverable URLs than the canonical editor gallery.
SELECT p.product_id,
       p.name,
       s.product_image_count,
       s.media_asset_count,
       s.role_assignment_image_count,
       s.annotation_image_count,
       s.recoverable_unique_image_count,
       s.featured_image_url
FROM product_media_integrity_snapshots s
JOIN products p ON p.product_id=s.product_id
WHERE s.product_media_integrity_snapshot_id = (
  SELECT s2.product_media_integrity_snapshot_id
  FROM product_media_integrity_snapshots s2
  WHERE s2.product_id=s.product_id
  ORDER BY s2.created_at DESC, s2.product_media_integrity_snapshot_id DESC
  LIMIT 1
)
  AND s.recoverable_unique_image_count > s.product_image_count
ORDER BY (s.recoverable_unique_image_count-s.product_image_count) DESC, p.product_id
LIMIT 100;

-- Products with more than seven gallery rows are reported for review; Build 245 does not delete them.
SELECT product_id, COUNT(*) AS gallery_rows
FROM product_images
WHERE TRIM(COALESCE(image_url,''))<>''
GROUP BY product_id
HAVING COUNT(*) > 7
ORDER BY gallery_rows DESC, product_id;

-- Duplicate image URLs inside one product gallery should ideally return zero rows.
SELECT product_id, LOWER(TRIM(image_url)) AS normalized_image_url, COUNT(*) AS duplicate_count
FROM product_images
WHERE TRIM(COALESCE(image_url,''))<>''
GROUP BY product_id, LOWER(TRIM(image_url))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, product_id;

-- Blank featured image even though gallery exists should ideally return zero rows after Build 245 recovery.
SELECT p.product_id, p.name, COUNT(pi.product_image_id) AS gallery_rows
FROM products p
JOIN product_images pi ON pi.product_id=p.product_id AND TRIM(COALESCE(pi.image_url,''))<>''
WHERE TRIM(COALESCE(p.featured_image_url,''))=''
GROUP BY p.product_id, p.name
ORDER BY p.product_id;

SELECT name, type
FROM sqlite_schema
WHERE name IN (
  'product_media_integrity_snapshots',
  'admin_api_health_observations',
  'idx_product_media_integrity_snapshots_product_created',
  'idx_admin_api_health_observations_path_created',
  'idx_admin_api_health_observations_status_created',
  'idx_product_images_product_sort_v245',
  'idx_product_image_annotations_product_updated_v245',
  'idx_product_media_role_assignments_product_updated_v245'
)
ORDER BY type, name;
