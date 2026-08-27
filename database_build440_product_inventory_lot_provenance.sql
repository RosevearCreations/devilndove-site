-- Devil n Dove Build 440 — Product / Inventory lot provenance and downstream commitment guards.
-- Additive/idempotent. Existing pre-cutover stock is preserved as explicit legacy opening balance;
-- historical production/sales are never falsely reconstructed.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_production_run_material_lots (
  product_production_run_material_lot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_production_run_material_id INTEGER NOT NULL,
  product_production_run_id INTEGER NOT NULL,
  inventory_purchase_lot_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER NOT NULL,
  allocation_sequence INTEGER NOT NULL DEFAULT 0,
  allocation_method TEXT NOT NULL DEFAULT 'fifo' CHECK(allocation_method IN ('manual','fifo','fefo','single_lot')),
  lot_code_snapshot TEXT NOT NULL,
  quantity_consumed REAL NOT NULL DEFAULT 0 CHECK(quantity_consumed >= 0),
  stock_unit_label TEXT NOT NULL DEFAULT 'unit',
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  landed_unit_cost_cents REAL NOT NULL DEFAULT 0,
  extended_cost_cents INTEGER NOT NULL DEFAULT 0,
  supplier_name_snapshot TEXT,
  supplier_sku_snapshot TEXT,
  source_url_snapshot TEXT,
  purchase_date_snapshot TEXT,
  received_date_snapshot TEXT,
  expiry_date_snapshot TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_production_run_material_id, inventory_purchase_lot_id),
  FOREIGN KEY(product_production_run_material_id) REFERENCES product_production_run_materials(product_production_run_material_id) ON DELETE CASCADE,
  FOREIGN KEY(product_production_run_id) REFERENCES product_production_runs(product_production_run_id) ON DELETE CASCADE,
  FOREIGN KEY(inventory_purchase_lot_id) REFERENCES inventory_purchase_lots(inventory_purchase_lot_id) ON DELETE RESTRICT,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_product_production_material_lots_run
  ON product_production_run_material_lots(product_production_run_id, product_production_run_material_id, allocation_sequence);
CREATE INDEX IF NOT EXISTS idx_product_production_material_lots_purchase
  ON product_production_run_material_lots(inventory_purchase_lot_id, created_at DESC);

CREATE TABLE IF NOT EXISTS product_finished_inventory_lots (
  product_finished_inventory_lot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_key TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL,
  product_production_run_id INTEGER,
  source_kind TEXT NOT NULL DEFAULT 'production_run' CHECK(source_kind IN ('legacy_opening','production_run','manual_adjustment')),
  quantity_created REAL NOT NULL DEFAULT 0 CHECK(quantity_created >= 0),
  unit_material_cost_cents INTEGER NOT NULL DEFAULT 0,
  lot_status TEXT NOT NULL DEFAULT 'available' CHECK(lot_status IN ('available','reversed','quarantined')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  FOREIGN KEY(product_production_run_id) REFERENCES product_production_runs(product_production_run_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_finished_inventory_lots_run_unique
  ON product_finished_inventory_lots(product_production_run_id)
  WHERE product_production_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_finished_inventory_lots_product
  ON product_finished_inventory_lots(product_id, lot_status, created_at, product_finished_inventory_lot_id);

-- Preserve the exact forward-provenance cutover. Re-running the migration must never move it.
INSERT OR IGNORE INTO app_settings(setting_key, setting_value, is_public)
VALUES ('site.product.finished_lot_provenance_cutover_at', CURRENT_TIMESTAMP, 0);

-- Raw-material lot bootstrap: preserve known purchase lots and add only the positive difference
-- needed to reconcile current active Supply on-hand quantity. No negative/history fabrication.
INSERT OR IGNORE INTO inventory_purchase_lots (
  site_item_inventory_id, lot_code, purchase_date, received_date, supplier_name, supplier_order_number,
  supplier_sku, asin, source_url, quantity_received, quantity_remaining, unit_cost_cents,
  shipping_cost_cents, tax_cost_cents, expiry_date, storage_location, lot_status, notes,
  created_by_user_id, created_at, updated_at
)
SELECT
  sii.site_item_inventory_id,
  'LEGACY-B440-' || sii.site_item_inventory_id,
  NULL,
  CURRENT_TIMESTAMP,
  'Legacy opening balance',
  NULL,
  sii.supplier_sku,
  NULL,
  sii.source_url,
  ROUND(COALESCE(sii.on_hand_quantity,0) - COALESCE((
    SELECT SUM(CASE WHEN ipl.lot_status IN ('available','consumed') THEN COALESCE(ipl.quantity_remaining,0) ELSE 0 END)
    FROM inventory_purchase_lots ipl
    WHERE ipl.site_item_inventory_id=sii.site_item_inventory_id
  ),0), 6),
  ROUND(COALESCE(sii.on_hand_quantity,0) - COALESCE((
    SELECT SUM(CASE WHEN ipl.lot_status IN ('available','consumed') THEN COALESCE(ipl.quantity_remaining,0) ELSE 0 END)
    FROM inventory_purchase_lots ipl
    WHERE ipl.site_item_inventory_id=sii.site_item_inventory_id
  ),0), 6),
  COALESCE(sii.unit_cost_cents,0),
  0,0,NULL,NULL,'available',
  'Build 440 forward-provenance opening balance. Represents only current stock not already covered by known purchase-lot remaining quantities.',
  NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM site_item_inventory sii
WHERE COALESCE(sii.is_active,1)=1
  AND LOWER(TRIM(COALESCE(sii.source_type,'')))='supply'
  AND COALESCE(sii.on_hand_quantity,0) > COALESCE((
    SELECT SUM(CASE WHEN ipl.lot_status IN ('available','consumed') THEN COALESCE(ipl.quantity_remaining,0) ELSE 0 END)
    FROM inventory_purchase_lots ipl
    WHERE ipl.site_item_inventory_id=sii.site_item_inventory_id
  ),0) + 0.000001;

-- Create missing policies only. Existing human-selected manual/FIFO/FEFO policies are preserved.
INSERT OR IGNORE INTO inventory_lot_policies (
  site_item_inventory_id, depletion_method, reconcile_status, last_reconciled_quantity,
  last_reconciled_at, updated_by_user_id, updated_at
)
SELECT
  sii.site_item_inventory_id,
  'fifo',
  CASE WHEN ABS(COALESCE(sii.on_hand_quantity,0) - COALESCE((
    SELECT SUM(COALESCE(ipl.quantity_remaining,0)) FROM inventory_purchase_lots ipl
    WHERE ipl.site_item_inventory_id=sii.site_item_inventory_id AND ipl.lot_status IN ('available','consumed')
  ),0)) < 0.000001 THEN 'reconciled' ELSE 'blocked' END,
  COALESCE(sii.on_hand_quantity,0),
  CURRENT_TIMESTAMP,
  NULL,
  CURRENT_TIMESTAMP
FROM site_item_inventory sii
WHERE COALESCE(sii.is_active,1)=1
  AND LOWER(TRIM(COALESCE(sii.source_type,'')))='supply';

-- Legacy default manual policies that were never human-reviewed become FIFO; explicit user choices stay intact.
UPDATE inventory_lot_policies
SET depletion_method='fifo', updated_at=CURRENT_TIMESTAMP
WHERE depletion_method='manual'
  AND updated_by_user_id IS NULL
  AND site_item_inventory_id IN (
    SELECT site_item_inventory_id FROM site_item_inventory
    WHERE COALESCE(is_active,1)=1 AND LOWER(TRIM(COALESCE(source_type,'')))='supply'
  );

-- Refresh reconciliation status after the opening-balance seed.
UPDATE inventory_lot_policies
SET reconcile_status = CASE
      WHEN ABS(COALESCE((SELECT on_hand_quantity FROM site_item_inventory sii WHERE sii.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id),0)
        - COALESCE((SELECT SUM(COALESCE(ipl.quantity_remaining,0)) FROM inventory_purchase_lots ipl
                    WHERE ipl.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id
                      AND ipl.lot_status IN ('available','consumed')),0)) < 0.000001
      THEN 'reconciled' ELSE 'blocked' END,
    last_reconciled_quantity = COALESCE((SELECT on_hand_quantity FROM site_item_inventory sii WHERE sii.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id),0),
    last_reconciled_at = CASE
      WHEN ABS(COALESCE((SELECT on_hand_quantity FROM site_item_inventory sii WHERE sii.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id),0)
        - COALESCE((SELECT SUM(COALESCE(ipl.quantity_remaining,0)) FROM inventory_purchase_lots ipl
                    WHERE ipl.site_item_inventory_id=inventory_lot_policies.site_item_inventory_id
                      AND ipl.lot_status IN ('available','consumed')),0)) < 0.000001
      THEN CURRENT_TIMESTAMP ELSE last_reconciled_at END,
    updated_at=CURRENT_TIMESTAMP
WHERE site_item_inventory_id IN (
  SELECT site_item_inventory_id FROM site_item_inventory
  WHERE COALESCE(is_active,1)=1 AND LOWER(TRIM(COALESCE(source_type,'')))='supply'
);

-- Existing finished stock is explicitly a legacy opening balance. We do not attach it to old runs.
INSERT OR IGNORE INTO product_finished_inventory_lots (
  lot_key, product_id, product_production_run_id, source_kind, quantity_created,
  unit_material_cost_cents, lot_status, notes, created_at, updated_at
)
SELECT
  'LEGACY-B440-PRODUCT-' || p.product_id,
  p.product_id,
  NULL,
  'legacy_opening',
  COALESCE(p.inventory_quantity,0),
  0,
  'available',
  'Build 440 forward-provenance opening balance. Historical sales/production are intentionally not reconstructed.',
  (SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),
  CURRENT_TIMESTAMP
FROM products p
WHERE COALESCE(p.inventory_tracking,0)=1
  AND COALESCE(p.inventory_quantity,0) > 0;

DROP VIEW IF EXISTS product_inventory_active_commitments;
CREATE VIEW product_inventory_active_commitments AS
SELECT
  oi.product_id,
  COALESCE(SUM(oi.quantity),0) AS committed_quantity
FROM order_items oi
INNER JOIN orders o ON o.order_id=oi.order_id
WHERE oi.product_id IS NOT NULL
  AND LOWER(COALESCE(o.order_status,'pending')) IN ('pending','paid','fulfilled')
  AND o.created_at >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')
GROUP BY oi.product_id;

DROP VIEW IF EXISTS product_finished_lot_commitment_attribution;
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

-- Final checkout guard: pending/paid/fulfilled post-cutover order lines are commitments.
-- This protects against two concurrent pending carts both consuming the same finished stock.
DROP TRIGGER IF EXISTS trg_order_items_build440_inventory_commit_guard_insert;
CREATE TRIGGER trg_order_items_build440_inventory_commit_guard_insert
BEFORE INSERT ON order_items
WHEN NEW.product_id IS NOT NULL
 AND COALESCE((SELECT inventory_tracking FROM products WHERE product_id=NEW.product_id),0)=1
 AND LOWER(COALESCE((SELECT order_status FROM orders WHERE order_id=NEW.order_id),'pending')) IN ('pending','paid','fulfilled')
 AND COALESCE((SELECT created_at FROM orders WHERE order_id=NEW.order_id),'') >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')
BEGIN
  SELECT CASE WHEN
    COALESCE((SELECT inventory_quantity FROM products WHERE product_id=NEW.product_id),0)
      - COALESCE((SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=NEW.product_id),0)
      < COALESCE(NEW.quantity,0)
    THEN RAISE(ABORT,'build440_finished_inventory_commitment_exceeds_available') END;
END;

DROP TRIGGER IF EXISTS trg_order_items_build440_inventory_commit_guard_update;
CREATE TRIGGER trg_order_items_build440_inventory_commit_guard_update
BEFORE UPDATE OF product_id, quantity ON order_items
WHEN NEW.product_id IS NOT NULL
 AND COALESCE((SELECT inventory_tracking FROM products WHERE product_id=NEW.product_id),0)=1
 AND LOWER(COALESCE((SELECT order_status FROM orders WHERE order_id=NEW.order_id),'pending')) IN ('pending','paid','fulfilled')
 AND COALESCE((SELECT created_at FROM orders WHERE order_id=NEW.order_id),'') >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')
BEGIN
  SELECT CASE WHEN
    COALESCE((SELECT inventory_quantity FROM products WHERE product_id=NEW.product_id),0)
      - COALESCE((SELECT SUM(oi.quantity) FROM order_items oi INNER JOIN orders o ON o.order_id=oi.order_id
                  WHERE oi.product_id=NEW.product_id AND oi.order_item_id<>OLD.order_item_id
                    AND LOWER(COALESCE(o.order_status,'pending')) IN ('pending','paid','fulfilled')
                    AND o.created_at >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')),0)
      < COALESCE(NEW.quantity,0)
    THEN RAISE(ABORT,'build440_finished_inventory_commitment_exceeds_available') END;
END;

DROP TRIGGER IF EXISTS trg_orders_build440_inventory_commit_guard_reactivate;
CREATE TRIGGER trg_orders_build440_inventory_commit_guard_reactivate
BEFORE UPDATE OF order_status ON orders
WHEN LOWER(COALESCE(NEW.order_status,'')) IN ('pending','paid','fulfilled')
 AND LOWER(COALESCE(OLD.order_status,'')) NOT IN ('pending','paid','fulfilled')
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
                      AND LOWER(COALESCE(o2.order_status,'pending')) IN ('pending','paid','fulfilled')
                      AND o2.created_at >= COALESCE((SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at' LIMIT 1),'9999-12-31')),0)
        < x.order_quantity
  ) THEN RAISE(ABORT,'build440_finished_inventory_commitment_exceeds_available') END;
END;

INSERT OR IGNORE INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.product.production_lot_policy','purchase_lot_fifo_fefo_provenance_v440',0);
INSERT OR IGNORE INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.product.finished_inventory_commitment_policy','forward_cutover_fifo_commitment_guard_v440',0);

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build440_product_inventory_lot_provenance',
  'database_build440_product_inventory_lot_provenance.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Adds forward-only raw purchase-lot production provenance, legacy opening balances, finished-production lots, FIFO downstream order commitment attribution, and checkout commitment guards. Historical provenance is not fabricated.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
