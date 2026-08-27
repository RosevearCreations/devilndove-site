-- Devil n Dove Build 440 — lot-provenance hardening.
-- Apply immediately after database_build440_product_inventory_lot_provenance.sql.
-- This corrects physical-lot opening-balance treatment and makes oversell failures
-- leave the parent order safely cancelled instead of active/partially committed.
PRAGMA foreign_keys = ON;

-- Physical stock can still exist in quarantined/expired lots even though those lots are
-- unavailable to production. They must count toward physical reconciliation so the legacy
-- opening balance never duplicates known quarantined/expired stock.
UPDATE inventory_purchase_lots
SET
  quantity_received = MAX(0, ROUND(
    COALESCE((SELECT sii.on_hand_quantity FROM site_item_inventory sii
              WHERE sii.site_item_inventory_id=inventory_purchase_lots.site_item_inventory_id),0)
    - COALESCE((SELECT SUM(COALESCE(other.quantity_remaining,0))
                FROM inventory_purchase_lots other
                WHERE other.site_item_inventory_id=inventory_purchase_lots.site_item_inventory_id
                  AND other.inventory_purchase_lot_id<>inventory_purchase_lots.inventory_purchase_lot_id
                  AND other.lot_status<>'returned'),0), 6)),
  quantity_remaining = MAX(0, ROUND(
    COALESCE((SELECT sii.on_hand_quantity FROM site_item_inventory sii
              WHERE sii.site_item_inventory_id=inventory_purchase_lots.site_item_inventory_id),0)
    - COALESCE((SELECT SUM(COALESCE(other.quantity_remaining,0))
                FROM inventory_purchase_lots other
                WHERE other.site_item_inventory_id=inventory_purchase_lots.site_item_inventory_id
                  AND other.inventory_purchase_lot_id<>inventory_purchase_lots.inventory_purchase_lot_id
                  AND other.lot_status<>'returned'),0), 6)),
  lot_status = CASE
    WHEN COALESCE((SELECT sii.on_hand_quantity FROM site_item_inventory sii
                   WHERE sii.site_item_inventory_id=inventory_purchase_lots.site_item_inventory_id),0)
       - COALESCE((SELECT SUM(COALESCE(other.quantity_remaining,0))
                   FROM inventory_purchase_lots other
                   WHERE other.site_item_inventory_id=inventory_purchase_lots.site_item_inventory_id
                     AND other.inventory_purchase_lot_id<>inventory_purchase_lots.inventory_purchase_lot_id
                     AND other.lot_status<>'returned'),0) > 0.000001
    THEN 'available' ELSE 'consumed' END,
  notes = 'Build 440 forward-provenance opening balance. Represents only current physical stock not already covered by known non-returned purchase-lot quantities. Quarantined/expired lots remain unavailable to production but are not duplicated.',
  updated_at = CURRENT_TIMESTAMP
WHERE lot_code='LEGACY-B440-' || site_item_inventory_id;

-- Reconciliation is physical: all non-returned remaining lot stock counts. Production
-- allocation remains stricter and uses only available, non-expired lots.
UPDATE inventory_lot_policies
SET
  reconcile_status = CASE
    WHEN ABS(
      COALESCE((SELECT sii.on_hand_quantity FROM site_item_inventory sii
                WHERE sii.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id),0)
      - COALESCE((SELECT SUM(COALESCE(ipl.quantity_remaining,0))
                  FROM inventory_purchase_lots ipl
                  WHERE ipl.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id
                    AND ipl.lot_status<>'returned'),0)
    ) < 0.000001 THEN 'reconciled' ELSE 'blocked' END,
  last_reconciled_quantity = COALESCE((SELECT sii.on_hand_quantity FROM site_item_inventory sii
                                       WHERE sii.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id),0),
  last_reconciled_at = CASE
    WHEN ABS(
      COALESCE((SELECT sii.on_hand_quantity FROM site_item_inventory sii
                WHERE sii.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id),0)
      - COALESCE((SELECT SUM(COALESCE(ipl.quantity_remaining,0))
                  FROM inventory_purchase_lots ipl
                  WHERE ipl.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id
                    AND ipl.lot_status<>'returned'),0)
    ) < 0.000001 THEN CURRENT_TIMESTAMP ELSE last_reconciled_at END,
  updated_at=CURRENT_TIMESTAMP
WHERE site_item_inventory_id IN (
  SELECT site_item_inventory_id FROM site_item_inventory
  WHERE COALESCE(is_active,1)=1 AND LOWER(TRIM(COALESCE(source_type,'')))='supply'
);

-- A refund does not prove the physical item was returned. Pending, paid, fulfilled and
-- refunded post-cutover order lines remain downstream commitments. Only cancellation (or a
-- future explicit return/restock workflow) releases the finished-lot attribution.
DROP VIEW IF EXISTS product_finished_lot_commitment_attribution;
DROP VIEW IF EXISTS product_inventory_active_commitments;
CREATE VIEW product_inventory_active_commitments AS
SELECT
  oi.product_id,
  COALESCE(SUM(oi.quantity),0) AS committed_quantity
FROM order_items oi
INNER JOIN orders o ON o.order_id=oi.order_id
WHERE oi.product_id IS NOT NULL
  AND LOWER(COALESCE(o.order_status,'pending')) IN ('pending','paid','fulfilled','refunded')
  AND o.created_at >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')
GROUP BY oi.product_id;

CREATE VIEW product_finished_lot_commitment_attribution AS
WITH ordered_lots AS (
  SELECT
    l.*,
    COALESCE(SUM(CASE WHEN l.lot_status='available' THEN l.quantity_created ELSE 0 END) OVER (
      PARTITION BY l.product_id
      ORDER BY l.created_at, l.product_finished_inventory_lot_id
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ),0) AS prior_available_quantity
  FROM product_finished_inventory_lots l
), commitments AS (
  SELECT product_id, committed_quantity FROM product_inventory_active_commitments
)
SELECT
  ol.product_finished_inventory_lot_id,
  ol.lot_key,
  ol.product_id,
  ol.product_production_run_id,
  ol.source_kind,
  ol.quantity_created,
  ol.unit_material_cost_cents,
  ol.lot_status,
  ol.created_at,
  COALESCE(c.committed_quantity,0) AS product_committed_quantity,
  ol.prior_available_quantity,
  CASE WHEN ol.lot_status<>'available' THEN 0
       ELSE MAX(0, MIN(ol.quantity_created, COALESCE(c.committed_quantity,0) - ol.prior_available_quantity)) END AS attributed_committed_quantity,
  CASE WHEN ol.lot_status<>'available' THEN 0
       ELSE MAX(0, ol.quantity_created - MAX(0, MIN(ol.quantity_created, COALESCE(c.committed_quantity,0) - ol.prior_available_quantity))) END AS attributed_uncommitted_quantity
FROM ordered_lots ol
LEFT JOIN commitments c ON c.product_id=ol.product_id;

-- Never allow any path (Admin bulk edit, correction, reversal, etc.) to lower a tracked
-- finished Product below already-active post-cutover commitments.
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

-- Checkout creates the parent order before its line items. If a line would oversubscribe
-- stock, cancel the parent order first and use RAISE(FAIL), which preserves that safe
-- cancellation while rejecting the offending line. Earlier lines remain attached only to
-- a cancelled (therefore non-committing) order. Reactivation is separately guarded.
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

  SELECT CASE WHEN changes()=1
    THEN RAISE(FAIL,'build440_finished_inventory_commitment_exceeds_available') END;
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

  SELECT CASE WHEN changes()=1
    THEN RAISE(FAIL,'build440_finished_inventory_commitment_exceeds_available') END;
END;

DROP TRIGGER IF EXISTS trg_orders_build440_inventory_commit_guard_reactivate;
CREATE TRIGGER trg_orders_build440_inventory_commit_guard_reactivate
BEFORE UPDATE OF order_status ON orders
WHEN LOWER(COALESCE(NEW.order_status,'')) IN ('pending','paid','fulfilled','refunded')
 AND LOWER(COALESCE(OLD.order_status,'')) NOT IN ('pending','paid','fulfilled','refunded')
 AND NEW.created_at >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')
BEGIN
  SELECT CASE WHEN EXISTS (
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
  ) THEN RAISE(ABORT,'build440_finished_inventory_commitment_exceeds_available') END;
END;

INSERT OR IGNORE INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.product.finished_inventory_guard_hardening','cancel_partial_checkout_count_physical_lots_refund_stays_committed_v440',0);

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build440_product_inventory_lot_provenance_hardening',
  'database_build440_product_inventory_lot_provenance_hardening.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Counts quarantined/expired physical purchase-lot remainder without making it production-available; safely cancels incomplete checkout on commitment conflict; keeps refunded physical orders committed until explicit return/restock; prevents finished inventory from being reduced below active commitments.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
