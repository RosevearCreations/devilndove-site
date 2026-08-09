-- Build 244 post-migration verification only. Read-only SELECT statements.
SELECT migration_key, file_name, status, applied_at
FROM schema_migration_ledger
WHERE migration_key='build244_inventory_authority_fractional_usage';

SELECT setting_key, setting_value
FROM app_settings
WHERE setting_key IN (
  'site.inventory.catalog_authority',
  'site.inventory.fractional_usage_policy',
  'site.inventory.legacy_usage_default'
)
ORDER BY setting_key;

SELECT item_kind, COUNT(*) AS catalog_rows
FROM catalog_items
WHERE item_kind IN ('tool','supply') AND COALESCE(status,'active')<>'archived'
GROUP BY item_kind ORDER BY item_kind;

SELECT LOWER(TRIM(source_type)) AS source_type, COUNT(*) AS active_inventory_rows
FROM site_item_inventory
WHERE COALESCE(is_active,1)=1 AND LOWER(TRIM(source_type)) IN ('tool','supply')
GROUP BY LOWER(TRIM(source_type)) ORDER BY source_type;

SELECT usage_tracking_mode, COUNT(*) AS profile_rows
FROM site_inventory_usage_profiles
GROUP BY usage_tracking_mode ORDER BY usage_tracking_mode;

-- Should return zero rows: exact active identity duplicates.
SELECT LOWER(TRIM(source_type)) AS source_type, external_key, COUNT(*) AS duplicate_count
FROM site_item_inventory
WHERE COALESCE(is_active,1)=1 AND LOWER(TRIM(source_type)) IN ('tool','supply')
GROUP BY LOWER(TRIM(source_type)), external_key
HAVING COUNT(*)>1;

-- Review queue candidate: legacy supplies intentionally protected from false depletion
-- until stock/usage conversion is reviewed.
SELECT site_item_inventory_id, item_name, stock_unit_label, usage_unit_label,
       usage_units_per_stock_unit, usage_tracking_mode
FROM site_item_inventory sii
JOIN site_inventory_usage_profiles siup USING(site_item_inventory_id)
WHERE COALESCE(sii.is_active,1)=1
  AND LOWER(TRIM(sii.source_type))='supply'
  AND siup.usage_tracking_mode='log_only'
ORDER BY LOWER(sii.item_name)
LIMIT 100;
