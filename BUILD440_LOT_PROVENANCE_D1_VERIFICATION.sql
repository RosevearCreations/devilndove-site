-- Devil n Dove Build 440 — Product / Inventory lot-provenance Development verification.
-- READ ONLY. Run after Build 440 lot-provenance + D1 compatibility migrations on devilndove-dev.
-- D1 transport note: schema-text checks use instr(), never LIKE/GLOB patterns.

SELECT 'tables' AS check_name,
       COUNT(*) AS actual,
       2 AS expected
FROM sqlite_master
WHERE type='table'
  AND name IN ('product_production_run_material_lots','product_finished_inventory_lots');

SELECT 'indexes' AS check_name,
       COUNT(*) AS actual,
       4 AS expected
FROM sqlite_master
WHERE type='index'
  AND name IN (
    'idx_product_production_material_lots_run',
    'idx_product_production_material_lots_purchase',
    'idx_product_finished_inventory_lots_run_unique',
    'idx_product_finished_inventory_lots_product'
  );

SELECT 'views' AS check_name,
       COUNT(*) AS actual,
       2 AS expected
FROM sqlite_master
WHERE type='view'
  AND name IN ('product_inventory_active_commitments','product_finished_lot_commitment_attribution');

SELECT 'triggers' AS check_name,
       COUNT(*) AS actual,
       4 AS expected
FROM sqlite_master
WHERE type='trigger'
  AND name IN (
    'trg_products_build440_inventory_commit_guard_decrease',
    'trg_order_items_build440_inventory_commit_guard_insert',
    'trg_order_items_build440_inventory_commit_guard_update',
    'trg_orders_build440_inventory_commit_guard_reactivate'
  );

SELECT 'migration_ledger' AS check_name,
       COUNT(*) AS actual,
       2 AS expected
FROM schema_migration_ledger
WHERE migration_key IN (
  'build440_product_inventory_lot_provenance',
  'build440_product_inventory_lot_provenance_hardening'
);

SELECT 'd1_trigger_compat_ledger' AS check_name,
       COUNT(*) AS actual,
       1 AS expected
FROM schema_migration_ledger
WHERE migration_key='build440_product_inventory_lot_provenance_d1_trigger_compat';

SELECT 'cutover_setting' AS check_name,
       COUNT(*) AS actual,
       1 AS expected
FROM app_settings
WHERE setting_key='site.product.finished_lot_provenance_cutover_at'
  AND TRIM(COALESCE(setting_value,''))<>'';

SELECT 'd1_trigger_compat_setting' AS check_name,
       COUNT(*) AS actual,
       1 AS expected
FROM app_settings
WHERE setting_key='site.product.finished_inventory_guard_d1_trigger_compat';

SELECT 'active_supply_rows' AS metric, COUNT(*) AS value
FROM site_item_inventory
WHERE COALESCE(is_active,1)=1
  AND LOWER(TRIM(COALESCE(source_type,'')))='supply';

SELECT 'reconciled_supply_lot_policies' AS metric, COUNT(*) AS value
FROM inventory_lot_policies p
JOIN site_item_inventory sii ON sii.site_item_inventory_id=p.site_item_inventory_id
WHERE COALESCE(sii.is_active,1)=1
  AND LOWER(TRIM(COALESCE(sii.source_type,'')))='supply'
  AND p.reconcile_status='reconciled';

SELECT 'blocked_supply_lot_policies' AS metric, COUNT(*) AS value
FROM inventory_lot_policies p
JOIN site_item_inventory sii ON sii.site_item_inventory_id=p.site_item_inventory_id
WHERE COALESCE(sii.is_active,1)=1
  AND LOWER(TRIM(COALESCE(sii.source_type,'')))='supply'
  AND p.reconcile_status='blocked';

SELECT 'reconciled_policy_physical_mismatches' AS metric, COUNT(*) AS value
FROM inventory_lot_policies p
JOIN site_item_inventory sii ON sii.site_item_inventory_id=p.site_item_inventory_id
WHERE p.reconcile_status='reconciled'
  AND ABS(
    COALESCE(sii.on_hand_quantity,0)
    - COALESCE((
      SELECT SUM(COALESCE(ipl.quantity_remaining,0))
      FROM inventory_purchase_lots ipl
      WHERE ipl.site_item_inventory_id=p.site_item_inventory_id
        AND ipl.lot_status<>'returned'
    ),0)
  ) >= 0.000001;

SELECT 'negative_purchase_lot_remaining' AS metric, COUNT(*) AS value
FROM inventory_purchase_lots
WHERE COALESCE(quantity_remaining,0)<0;

SELECT 'legacy_raw_opening_lots' AS metric, COUNT(*) AS value
FROM inventory_purchase_lots
WHERE lot_code='LEGACY-B440-' || site_item_inventory_id;

SELECT 'legacy_finished_opening_lots' AS metric, COUNT(*) AS value
FROM product_finished_inventory_lots
WHERE source_kind='legacy_opening'
  AND product_production_run_id IS NULL;

SELECT 'new_production_finished_lots' AS metric, COUNT(*) AS value
FROM product_finished_inventory_lots
WHERE source_kind='production_run'
  AND product_production_run_id IS NOT NULL;

SELECT 'production_material_lot_snapshots' AS metric, COUNT(*) AS value
FROM product_production_run_material_lots;

SELECT 'finished_lot_run_duplicates' AS metric, COUNT(*) AS value
FROM (
  SELECT product_production_run_id
  FROM product_finished_inventory_lots
  WHERE product_production_run_id IS NOT NULL
  GROUP BY product_production_run_id
  HAVING COUNT(*)>1
);

SELECT 'active_finished_commitment_products' AS metric, COUNT(*) AS value
FROM product_inventory_active_commitments;

SELECT 'current_finished_commitment_units' AS metric,
       COALESCE(SUM(committed_quantity),0) AS value
FROM product_inventory_active_commitments;

SELECT 'refund_fail_closed_view' AS check_name,
       CASE WHEN instr(LOWER(COALESCE(sql,'')), 'refunded') > 0 THEN 1 ELSE 0 END AS actual,
       1 AS expected
FROM sqlite_master
WHERE type='view' AND name='product_inventory_active_commitments';

SELECT 'partial_checkout_cancel_trigger' AS check_name,
       CASE WHEN instr(LOWER(COALESCE(sql,'')), 'raise(fail') > 0
                  AND instr(LOWER(COALESCE(sql,'')), 'order_status=''cancelled''') > 0
            THEN 1 ELSE 0 END AS actual,
       1 AS expected
FROM sqlite_master
WHERE type='trigger' AND name='trg_order_items_build440_inventory_commit_guard_insert';
