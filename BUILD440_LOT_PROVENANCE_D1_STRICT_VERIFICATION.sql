-- Devil n Dove Build 440 — strict Product / Inventory lot-provenance verification.
-- READ ONLY. Any invariant failure intentionally raises integer overflow.
-- D1 transport note: schema-text checks use instr(), never LIKE/GLOB patterns.
SELECT CASE WHEN
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('product_production_run_material_lots','product_finished_inventory_lots'))=2
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name IN (
    'idx_product_production_material_lots_run','idx_product_production_material_lots_purchase',
    'idx_product_finished_inventory_lots_run_unique','idx_product_finished_inventory_lots_product'))=4
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='view' AND name IN ('product_inventory_active_commitments','product_finished_lot_commitment_attribution'))=2
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name IN (
    'trg_products_build440_inventory_commit_guard_decrease',
    'trg_order_items_build440_inventory_commit_guard_insert',
    'trg_order_items_build440_inventory_commit_guard_update',
    'trg_orders_build440_inventory_commit_guard_reactivate'))=4
  AND (SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key IN (
    'build440_product_inventory_lot_provenance','build440_product_inventory_lot_provenance_hardening'))=2
  AND (SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build440_product_inventory_lot_provenance_d1_trigger_compat')=1
  AND (SELECT COUNT(*) FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' AND TRIM(COALESCE(setting_value,''))<>'')=1
  AND (SELECT COUNT(*) FROM app_settings WHERE setting_key='site.product.finished_inventory_guard_d1_trigger_compat')=1
  AND (SELECT COUNT(*) FROM inventory_purchase_lots WHERE COALESCE(quantity_remaining,0)<0)=0
  AND (SELECT COUNT(*)
       FROM inventory_lot_policies p
       JOIN site_item_inventory sii ON sii.site_item_inventory_id=p.site_item_inventory_id
       WHERE p.reconcile_status='reconciled'
         AND ABS(COALESCE(sii.on_hand_quantity,0)-COALESCE((
           SELECT SUM(COALESCE(ipl.quantity_remaining,0))
           FROM inventory_purchase_lots ipl
           WHERE ipl.site_item_inventory_id=p.site_item_inventory_id
             AND ipl.lot_status<>'returned'),0))>=0.000001)=0
  AND (SELECT COUNT(*) FROM (
       SELECT product_production_run_id
       FROM product_finished_inventory_lots
       WHERE product_production_run_id IS NOT NULL
       GROUP BY product_production_run_id
       HAVING COUNT(*)>1))=0
  AND (SELECT COUNT(*)
       FROM product_finished_inventory_lots l
       JOIN product_production_runs r ON r.product_production_run_id=l.product_production_run_id
       WHERE l.product_production_run_id IS NOT NULL AND l.product_id<>r.product_id)=0
  AND (SELECT COUNT(*)
       FROM product_production_run_material_lots pml
       JOIN product_production_run_materials prm ON prm.product_production_run_material_id=pml.product_production_run_material_id
       WHERE pml.product_production_run_id<>prm.product_production_run_id
          OR pml.site_item_inventory_id<>prm.site_item_inventory_id)=0
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='view' AND name='product_inventory_active_commitments'
       AND instr(LOWER(COALESCE(sql,'')), 'refunded') > 0)=1
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name='trg_order_items_build440_inventory_commit_guard_insert'
       AND instr(LOWER(COALESCE(sql,'')), 'raise(fail') > 0
       AND instr(LOWER(COALESCE(sql,'')), 'order_status=''cancelled''') > 0)=1
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name='trg_products_build440_inventory_commit_guard_decrease'
       AND instr(LOWER(COALESCE(sql,'')), 'build440_finished_inventory_below_active_commitments') > 0)=1
THEN 1 ELSE abs(-9223372036854775808) END AS verification_pass;
