-- Devil n Dove Build 243 — inventory resilience, lower-case classification authority, and case-duplicate cleanup.
-- Apply once after Build 241. Back up D1 first.
-- This migration changes controlled classification values only. Human-facing names, URLs, ASINs, SKUs,
-- order numbers, currencies, and other case-sensitive/external identifiers intentionally preserve their case.

-- 1) Combine active inventory identities that differ only by source_type capitalization.
-- Keep the oldest row as the canonical active record, aggregate stock quantities into it, and retain
-- later rows as inactive audit/history records instead of deleting referenced inventory IDs.
DROP TABLE IF EXISTS _build243_inventory_case_merge;
CREATE TABLE _build243_inventory_case_merge AS
SELECT
  duplicate.site_item_inventory_id AS duplicate_id,
  canonical.canonical_id
FROM site_item_inventory duplicate
JOIN (
  SELECT
    LOWER(TRIM(source_type)) AS normalized_source_type,
    external_key,
    MIN(site_item_inventory_id) AS canonical_id,
    COUNT(*) AS row_count
  FROM site_item_inventory
  WHERE COALESCE(is_active, 1) = 1
  GROUP BY LOWER(TRIM(source_type)), external_key
  HAVING COUNT(*) > 1
) canonical
  ON LOWER(TRIM(duplicate.source_type)) = canonical.normalized_source_type
 AND duplicate.external_key = canonical.external_key
WHERE duplicate.site_item_inventory_id <> canonical.canonical_id
  AND COALESCE(duplicate.is_active, 1) = 1;

UPDATE site_item_inventory AS canonical
SET
  on_hand_quantity = COALESCE((
    SELECT SUM(COALESCE(member.on_hand_quantity, 0))
    FROM site_item_inventory member
    WHERE LOWER(TRIM(member.source_type)) = LOWER(TRIM(canonical.source_type))
      AND member.external_key = canonical.external_key
      AND COALESCE(member.is_active, 1) = 1
  ), canonical.on_hand_quantity),
  reserved_quantity = COALESCE((
    SELECT SUM(COALESCE(member.reserved_quantity, 0))
    FROM site_item_inventory member
    WHERE LOWER(TRIM(member.source_type)) = LOWER(TRIM(canonical.source_type))
      AND member.external_key = canonical.external_key
      AND COALESCE(member.is_active, 1) = 1
  ), canonical.reserved_quantity),
  incoming_quantity = COALESCE((
    SELECT SUM(COALESCE(member.incoming_quantity, 0))
    FROM site_item_inventory member
    WHERE LOWER(TRIM(member.source_type)) = LOWER(TRIM(canonical.source_type))
      AND member.external_key = canonical.external_key
      AND COALESCE(member.is_active, 1) = 1
  ), canonical.incoming_quantity),
  reorder_level = COALESCE((
    SELECT MAX(COALESCE(member.reorder_level, 0))
    FROM site_item_inventory member
    WHERE LOWER(TRIM(member.source_type)) = LOWER(TRIM(canonical.source_type))
      AND member.external_key = canonical.external_key
      AND COALESCE(member.is_active, 1) = 1
  ), canonical.reorder_level),
  preferred_reorder_quantity = COALESCE((
    SELECT MAX(COALESCE(member.preferred_reorder_quantity, 0))
    FROM site_item_inventory member
    WHERE LOWER(TRIM(member.source_type)) = LOWER(TRIM(canonical.source_type))
      AND member.external_key = canonical.external_key
      AND COALESCE(member.is_active, 1) = 1
  ), canonical.preferred_reorder_quantity),
  unit_cost_cents = COALESCE((
    SELECT MAX(COALESCE(member.unit_cost_cents, 0))
    FROM site_item_inventory member
    WHERE LOWER(TRIM(member.source_type)) = LOWER(TRIM(canonical.source_type))
      AND member.external_key = canonical.external_key
      AND COALESCE(member.is_active, 1) = 1
  ), canonical.unit_cost_cents),
  updated_at = CURRENT_TIMESTAMP
WHERE canonical.site_item_inventory_id IN (
  SELECT DISTINCT canonical_id FROM _build243_inventory_case_merge
);

UPDATE site_item_inventory
SET
  is_active = 0,
  source_type = 'merged_duplicate_' || site_item_inventory_id,
  reuse_status = 'merged_case_duplicate',
  reorder_notes = TRIM(COALESCE(reorder_notes, '') ||
    CASE WHEN COALESCE(reorder_notes, '') = '' THEN '' ELSE ' | ' END ||
    'build243 merged into inventory #' || (
      SELECT canonical_id FROM _build243_inventory_case_merge map
      WHERE map.duplicate_id = site_item_inventory.site_item_inventory_id
      LIMIT 1
    )),
  updated_at = CURRENT_TIMESTAMP
WHERE site_item_inventory_id IN (SELECT duplicate_id FROM _build243_inventory_case_merge);

DROP TABLE IF EXISTS _build243_inventory_case_merge;

-- 2) Lower-case controlled classification values to eliminate display/options duplicates.
UPDATE products
SET
  product_category = CASE WHEN TRIM(COALESCE(product_category, '')) = '' THEN product_category ELSE LOWER(TRIM(product_category)) END,
  color_name = CASE WHEN TRIM(COALESCE(color_name, '')) = '' THEN color_name ELSE LOWER(TRIM(color_name)) END,
  shipping_code = CASE WHEN TRIM(COALESCE(shipping_code, '')) = '' THEN shipping_code ELSE LOWER(TRIM(shipping_code)) END,
  color_names_json = CASE
    WHEN json_valid(color_names_json) AND json_type(color_names_json) = 'array' THEN (
      SELECT json_group_array(value)
      FROM (
        SELECT DISTINCT LOWER(TRIM(value)) AS value
        FROM json_each(products.color_names_json)
        WHERE TRIM(COALESCE(value, '')) <> ''
        ORDER BY value
      )
    )
    ELSE color_names_json
  END,
  updated_at = CURRENT_TIMESTAMP;

UPDATE catalog_items
SET
  item_kind = LOWER(TRIM(item_kind)),
  category = CASE WHEN TRIM(COALESCE(category, '')) = '' THEN category ELSE LOWER(TRIM(category)) END,
  subcategory = CASE WHEN TRIM(COALESCE(subcategory, '')) = '' THEN subcategory ELSE LOWER(TRIM(subcategory)) END,
  item_type = CASE WHEN TRIM(COALESCE(item_type, '')) = '' THEN item_type ELSE LOWER(TRIM(item_type)) END,
  updated_at = CURRENT_TIMESTAMP;

UPDATE site_item_inventory
SET
  source_type = LOWER(TRIM(source_type)),
  category = CASE WHEN TRIM(COALESCE(category, '')) = '' THEN category ELSE LOWER(TRIM(category)) END,
  stock_unit_label = LOWER(TRIM(COALESCE(NULLIF(stock_unit_label, ''), 'unit'))),
  usage_unit_label = LOWER(TRIM(COALESCE(NULLIF(usage_unit_label, ''), 'unit'))),
  reuse_status = CASE WHEN TRIM(COALESCE(reuse_status, '')) = '' THEN reuse_status ELSE LOWER(TRIM(reuse_status)) END,
  updated_at = CURRENT_TIMESTAMP;

UPDATE site_inventory_movements
SET source_type = CASE WHEN TRIM(COALESCE(source_type, '')) = '' THEN source_type ELSE LOWER(TRIM(source_type)) END;

UPDATE product_resource_links
SET resource_kind = LOWER(TRIM(resource_kind)), updated_at = CURRENT_TIMESTAMP;

-- 3) Normalize persisted catalog option arrays to one lower-case value per semantic option.
UPDATE app_settings
SET setting_value = COALESCE((
  SELECT json_group_array(value)
  FROM (
    SELECT DISTINCT LOWER(TRIM(value)) AS value
    FROM json_each(app_settings.setting_value)
    WHERE TRIM(COALESCE(value, '')) <> ''
    ORDER BY value
  )
), '[]'),
updated_at = CURRENT_TIMESTAMP
WHERE setting_key IN (
  'site.catalog.product_category_options',
  'site.catalog.color_options',
  'site.catalog.shipping_code_options'
)
AND json_valid(setting_value)
AND json_type(setting_value) = 'array';

-- 4) Keep classification writes/searches efficient and block future active source-type case duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_item_inventory_identity_lower_active
ON site_item_inventory(LOWER(TRIM(source_type)), external_key)
WHERE COALESCE(is_active, 1) = 1;

CREATE INDEX IF NOT EXISTS idx_site_item_inventory_active_search_v243
ON site_item_inventory(is_active, LOWER(source_type), LOWER(category), LOWER(item_name));

CREATE INDEX IF NOT EXISTS idx_catalog_items_active_search_v243
ON catalog_items(item_kind, status, LOWER(name), LOWER(category));

CREATE INDEX IF NOT EXISTS idx_products_status_name_v243
ON products(status, LOWER(name));

INSERT INTO app_settings(setting_key, setting_value, is_public, updated_at)
VALUES('site.inventory.classification_case_policy', 'lowercase_v243', 0, CURRENT_TIMESTAMP)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, is_public=0, updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger(migration_key,file_name,applied_at,notes)
VALUES(
  'build243_inventory_resilience_case_normalization',
  'database_build243_inventory_resilience_case_normalization.sql',
  CURRENT_TIMESTAMP,
  'Normalizes controlled product/catalog/inventory classifications to lower case, combines active inventory identities that differ only by source-type capitalization without deleting historical IDs, normalizes catalog option arrays, and adds bounded search/identity indexes for the Build 243 request-pressure repair.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;
