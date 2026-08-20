-- Build 276 read-only D1 verification
SELECT name, type, "notnull", dflt_value, pk
FROM pragma_table_info('packaging_project_ingredients')
WHERE name IN ('packaging_project_ingredient_id','packaging_project_id','site_item_inventory_id','inci_name','required_on_label')
ORDER BY cid;

SELECT name, tbl_name, sql
FROM sqlite_master
WHERE type='index'
  AND name='idx_packaging_project_ingredients_inventory';

SELECT migration_key, file_name, status, destructive, applied_at
FROM schema_migration_ledger
WHERE migration_key='build276_packaging_inventory_inci_capacity';

-- Existing rows remain valid and are simply unlinked until edited/reapplied.
SELECT
  COUNT(*) AS ingredient_rows,
  SUM(CASE WHEN site_item_inventory_id IS NOT NULL THEN 1 ELSE 0 END) AS inventory_linked_rows,
  SUM(CASE WHEN required_on_label<>0 AND TRIM(COALESCE(inci_name,''))='' THEN 1 ELSE 0 END) AS required_rows_missing_inci
FROM packaging_project_ingredients;

-- Any non-null link should point to an active or retained Inventory row.
SELECT
  ppi.packaging_project_ingredient_id,
  ppi.packaging_project_id,
  ppi.site_item_inventory_id,
  ppi.inci_name
FROM packaging_project_ingredients ppi
LEFT JOIN site_item_inventory sii
  ON sii.site_item_inventory_id=ppi.site_item_inventory_id
WHERE ppi.site_item_inventory_id IS NOT NULL
  AND sii.site_item_inventory_id IS NULL
ORDER BY ppi.packaging_project_id, ppi.sort_order;
