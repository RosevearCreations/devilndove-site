-- Devil n Dove Build 440 — D1-safe finished inventory trigger compatibility.
-- Supersedes trigger bodies that used SELECT CASE ... END inside CREATE TRIGGER.
-- Cloudflare D1's remote statement splitter can misread the inner END as the trigger terminator.
PRAGMA foreign_keys = ON;

DROP TRIGGER IF EXISTS trg_products_build440_inventory_commit_guard_decrease;
CREATE TRIGGER trg_products_build440_inventory_commit_guard_decrease
BEFORE UPDATE OF inventory_quantity ON products
WHEN COALESCE(NEW.inventory_tracking,0)=1
 AND COALESCE(NEW.inventory_quantity,0) < COALESCE((
   SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=NEW.product_id
 ),0)
BEGIN
  SELECT RAISE(ABORT,'build440_finished_inventory_below_active_commitments');
END;

DROP TRIGGER IF EXISTS trg_order_items_build440_inventory_commit_guard_insert;
CREATE TRIGGER trg_order_items_build440_inventory_commit_guard_insert
BEFORE INSERT ON order_items
WHEN NEW.product_id IS NOT NULL
 AND COALESCE((SELECT inventory_tracking FROM products WHERE product_id=NEW.product_id),0)=1
 AND LOWER(COALESCE((SELECT order_status FROM orders WHERE order_id=NEW.order_id),'pending')) IN ('pending','paid','fulfilled','refunded')
 AND COALESCE((SELECT created_at FROM orders WHERE order_id=NEW.order_id),'') >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')
BEGIN
  UPDATE orders
  SET order_status='cancelled',updated_at=CURRENT_TIMESTAMP
  WHERE order_id=NEW.order_id
    AND COALESCE((SELECT inventory_quantity FROM products WHERE product_id=NEW.product_id),0)
      - COALESCE((SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=NEW.product_id),0)
      < COALESCE(NEW.quantity,0);

  INSERT INTO order_status_history(order_id,old_status,new_status,changed_by_user_id,note,created_at)
  SELECT NEW.order_id,NULL,'cancelled',NULL,
         'Build 440 automatically cancelled this incomplete checkout because finished inventory was already committed.',
         CURRENT_TIMESTAMP
  WHERE changes()=1;

  SELECT RAISE(FAIL,'build440_finished_inventory_commitment_exceeds_available')
  WHERE changes()=1;
END;

DROP TRIGGER IF EXISTS trg_order_items_build440_inventory_commit_guard_update;
CREATE TRIGGER trg_order_items_build440_inventory_commit_guard_update
BEFORE UPDATE OF product_id, quantity ON order_items
WHEN NEW.product_id IS NOT NULL
 AND COALESCE((SELECT inventory_tracking FROM products WHERE product_id=NEW.product_id),0)=1
 AND LOWER(COALESCE((SELECT order_status FROM orders WHERE order_id=NEW.order_id),'pending')) IN ('pending','paid','fulfilled','refunded')
 AND COALESCE((SELECT created_at FROM orders WHERE order_id=NEW.order_id),'') >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')
BEGIN
  UPDATE orders
  SET order_status='cancelled',updated_at=CURRENT_TIMESTAMP
  WHERE order_id=NEW.order_id
    AND COALESCE((SELECT inventory_quantity FROM products WHERE product_id=NEW.product_id),0)
      - COALESCE((SELECT SUM(oi.quantity) FROM order_items oi INNER JOIN orders o ON o.order_id=oi.order_id
                  WHERE oi.product_id=NEW.product_id AND oi.order_item_id<>OLD.order_item_id
                    AND LOWER(COALESCE(o.order_status,'pending')) IN ('pending','paid','fulfilled','refunded')
                    AND o.created_at >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')),0)
      < COALESCE(NEW.quantity,0);

  INSERT INTO order_status_history(order_id,old_status,new_status,changed_by_user_id,note,created_at)
  SELECT NEW.order_id,NULL,'cancelled',NULL,
         'Build 440 automatically cancelled this order because an item quantity update exceeded finished inventory commitments.',
         CURRENT_TIMESTAMP
  WHERE changes()=1;

  SELECT RAISE(FAIL,'build440_finished_inventory_commitment_exceeds_available')
  WHERE changes()=1;
END;

DROP TRIGGER IF EXISTS trg_orders_build440_inventory_commit_guard_reactivate;
CREATE TRIGGER trg_orders_build440_inventory_commit_guard_reactivate
BEFORE UPDATE OF order_status ON orders
WHEN LOWER(COALESCE(NEW.order_status,'')) IN ('pending','paid','fulfilled','refunded')
 AND LOWER(COALESCE(OLD.order_status,'')) NOT IN ('pending','paid','fulfilled','refunded')
 AND NEW.created_at >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')
BEGIN
  SELECT RAISE(ABORT,'build440_finished_inventory_commitment_exceeds_available')
  WHERE EXISTS (
    SELECT 1
    FROM (
      SELECT oi.product_id, SUM(oi.quantity) AS order_quantity
      FROM order_items oi
      WHERE oi.order_id=NEW.order_id AND oi.product_id IS NOT NULL
      GROUP BY oi.product_id
    ) x
    INNER JOIN products p ON p.product_id=x.product_id
    WHERE COALESCE(p.inventory_tracking,0)=1
      AND COALESCE(p.inventory_quantity,0)
        - COALESCE((SELECT SUM(oi2.quantity) FROM order_items oi2 INNER JOIN orders o2 ON o2.order_id=oi2.order_id
                    WHERE oi2.product_id=x.product_id AND o2.order_id<>NEW.order_id
                      AND LOWER(COALESCE(o2.order_status,'pending')) IN ('pending','paid','fulfilled','refunded')
                      AND o2.created_at >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')),0)
        < x.order_quantity
  );
END;

INSERT OR IGNORE INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.product.finished_inventory_guard_d1_trigger_compat','no_case_end_trigger_split_v440',0);

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build440_product_inventory_lot_provenance_d1_trigger_compat',
  'database_build440_product_inventory_lot_provenance_d1_trigger_compat.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Recreates Build 440 finished-inventory commitment triggers without inner CASE/END expressions so Cloudflare D1 remote query transport cannot mis-split trigger bodies.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
