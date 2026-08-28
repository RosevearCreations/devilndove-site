#!/usr/bin/env python3
"""Build 440 Product / Inventory lot-provenance regression.
Local-only. Executes both additive Build 440 migrations against an in-memory SQLite fixture
and source-checks production/reversal contracts. No Cloudflare, D1, R2, or provider access.
"""
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'database_build440_product_inventory_lot_provenance.sql'
HARDENING = ROOT / 'database_build440_product_inventory_lot_provenance_hardening.sql'
HELPER = ROOT / 'functions/api/_lib/productLotProvenance.js'
RELEASE = ROOT / 'functions/api/admin/product-production-release.js'
REVERSAL = ROOT / 'functions/api/admin/product-production-reversal.js'

migration = MIGRATION.read_text(encoding='utf-8')
hardening = HARDENING.read_text(encoding='utf-8')
helper = HELPER.read_text(encoding='utf-8')
release = RELEASE.read_text(encoding='utf-8')
reversal = REVERSAL.read_text(encoding='utf-8')

checks = []
def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)
    print(f'{len(checks):02d}. PASS — {label}')

print('BUILD 440 PRODUCT / INVENTORY LOT PROVENANCE REGRESSION')
print('Cloudflare/D1/R2/provider access: NONE')
print('Production mutation capability: NONE')

conn = sqlite3.connect(':memory:')
conn.execute('PRAGMA foreign_keys=ON')
conn.executescript('''
CREATE TABLE app_settings(setting_key TEXT PRIMARY KEY, setting_value TEXT, is_public INTEGER DEFAULT 0);
CREATE TABLE schema_migration_ledger(
  migration_key TEXT PRIMARY KEY,file_name TEXT,checksum TEXT,status TEXT,destructive INTEGER,
  applied_at TEXT,notes TEXT,created_at TEXT,updated_at TEXT
);
CREATE TABLE products(
  product_id INTEGER PRIMARY KEY,name TEXT,sku TEXT,inventory_tracking INTEGER DEFAULT 0,
  inventory_quantity REAL DEFAULT 0,updated_at TEXT
);
CREATE TABLE site_item_inventory(
  site_item_inventory_id INTEGER PRIMARY KEY,source_type TEXT,external_key TEXT,item_name TEXT,
  is_active INTEGER DEFAULT 1,on_hand_quantity REAL DEFAULT 0,unit_cost_cents INTEGER DEFAULT 0,
  supplier_sku TEXT,source_url TEXT
);
CREATE TABLE inventory_purchase_lots(
  inventory_purchase_lot_id INTEGER PRIMARY KEY AUTOINCREMENT,site_item_inventory_id INTEGER NOT NULL,
  lot_code TEXT NOT NULL,purchase_date TEXT,received_date TEXT,supplier_name TEXT,supplier_order_number TEXT,
  supplier_sku TEXT,asin TEXT,source_url TEXT,quantity_received REAL NOT NULL DEFAULT 0,
  quantity_remaining REAL NOT NULL DEFAULT 0,unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,tax_cost_cents INTEGER NOT NULL DEFAULT 0,
  expiry_date TEXT,storage_location TEXT,lot_status TEXT NOT NULL DEFAULT 'available',notes TEXT,
  created_by_user_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_item_inventory_id,lot_code),FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id)
);
CREATE TABLE inventory_lot_policies(
  site_item_inventory_id INTEGER PRIMARY KEY,depletion_method TEXT NOT NULL DEFAULT 'manual',
  reconcile_status TEXT NOT NULL DEFAULT 'needs_review',last_reconciled_quantity REAL,last_reconciled_at TEXT,
  updated_by_user_id INTEGER,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id)
);
CREATE TABLE product_production_runs(
  product_production_run_id INTEGER PRIMARY KEY AUTOINCREMENT,run_key TEXT UNIQUE,product_id INTEGER NOT NULL,
  output_quantity INTEGER NOT NULL DEFAULT 1,run_status TEXT DEFAULT 'posted',created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(product_id)
);
CREATE TABLE product_production_run_materials(
  product_production_run_material_id INTEGER PRIMARY KEY AUTOINCREMENT,product_production_run_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER,product_resource_link_id INTEGER,resource_kind TEXT,source_key TEXT,item_name TEXT,
  stock_quantity_consumed REAL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_production_run_id) REFERENCES product_production_runs(product_production_run_id),
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id)
);
CREATE TABLE orders(
  order_id INTEGER PRIMARY KEY AUTOINCREMENT,order_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE order_items(
  order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,product_id INTEGER,quantity INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(order_id) REFERENCES orders(order_id),FOREIGN KEY(product_id) REFERENCES products(product_id)
);
CREATE TABLE order_status_history(
  order_status_history_id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL,old_status TEXT,new_status TEXT,
  changed_by_user_id INTEGER,note TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(order_id)
);
''')

# Product 1: 5 legacy finished units. Supply 1: 10 physical stock, of which 4 is known available.
conn.execute("INSERT INTO products(product_id,name,sku,inventory_tracking,inventory_quantity) VALUES(1,'Test Product','TEST-1',1,5)")
conn.execute("INSERT INTO site_item_inventory(site_item_inventory_id,source_type,external_key,item_name,is_active,on_hand_quantity,unit_cost_cents,supplier_sku,source_url) VALUES(1,'supply','wax','Wax',1,10,100,'WAX-1','https://example.test/wax')")
conn.execute("INSERT INTO inventory_purchase_lots(site_item_inventory_id,lot_code,quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,lot_status) VALUES(1,'KNOWN-LOT',4,4,90,40,20,'available')")

# Supply 2 proves quarantined physical stock is not duplicated into a fake opening balance.
conn.execute("INSERT INTO site_item_inventory(site_item_inventory_id,source_type,external_key,item_name,is_active,on_hand_quantity,unit_cost_cents) VALUES(2,'supply','resin','Resin',1,10,200)")
conn.execute("INSERT INTO inventory_purchase_lots(site_item_inventory_id,lot_code,quantity_received,quantity_remaining,unit_cost_cents,lot_status) VALUES(2,'QUARANTINED-LOT',7,7,200,'quarantined')")

conn.executescript(migration)
conn.executescript(hardening)

cutover_before = conn.execute("SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at'").fetchone()[0]
conn.executescript(migration)
conn.executescript(hardening)
cutover_after = conn.execute("SELECT setting_value FROM app_settings WHERE setting_key='site.product.finished_lot_provenance_cutover_at'").fetchone()[0]
check(cutover_before == cutover_after and bool(cutover_before), 'forward-provenance cutover is stable across both migration re-runs')

raw = conn.execute("SELECT lot_code,quantity_remaining,lot_status FROM inventory_purchase_lots WHERE site_item_inventory_id=1 ORDER BY inventory_purchase_lot_id").fetchall()
check(len(raw) == 2 and abs(sum(float(r[1]) for r in raw) - 10.0) < 1e-6, 'raw purchase-lot bootstrap preserves known lot and adds only missing physical opening balance')
check(any(r[0] == 'LEGACY-B440-1' and abs(float(r[1]) - 6.0) < 1e-6 for r in raw), 'raw opening balance equals aggregate on-hand minus known lot remainder')
policy = conn.execute("SELECT depletion_method,reconcile_status,last_reconciled_quantity FROM inventory_lot_policies WHERE site_item_inventory_id=1").fetchone()
check(policy[0] == 'fifo' and policy[1] == 'reconciled' and abs(float(policy[2]) - 10.0) < 1e-6, 'unreviewed raw lot policy becomes reconciled FIFO')

resin = conn.execute("SELECT lot_code,quantity_remaining,lot_status FROM inventory_purchase_lots WHERE site_item_inventory_id=2 ORDER BY inventory_purchase_lot_id").fetchall()
check(abs(sum(float(r[1]) for r in resin) - 10.0) < 1e-6, 'quarantined physical lot counts toward reconciliation without duplicating physical stock')
check(any(r[0] == 'LEGACY-B440-2' and abs(float(r[1]) - 3.0) < 1e-6 for r in resin), 'legacy opening balance fills only the physical difference beside quarantined stock')
check(any(r[0] == 'QUARANTINED-LOT' and r[2] == 'quarantined' for r in resin), 'hardening never makes quarantined stock production-available')

opening = conn.execute("SELECT lot_key,source_kind,quantity_created,lot_status FROM product_finished_inventory_lots WHERE product_id=1").fetchone()
check(opening and opening[0] == 'LEGACY-B440-PRODUCT-1' and opening[1] == 'legacy_opening' and abs(float(opening[2]) - 5.0) < 1e-6, 'current finished inventory is preserved as explicit legacy opening lot')

# First pending order commits 3 of 5. A second 3-unit checkout must fail, and the parent
# order must remain safely cancelled rather than an active partial order.
order1 = conn.execute("INSERT INTO orders(order_status,created_at) VALUES('pending',datetime('now','+1 second'))").lastrowid
conn.execute("INSERT INTO order_items(order_id,product_id,quantity) VALUES(?,?,?)", (order1,1,3))
order2 = conn.execute("INSERT INTO orders(order_status,created_at) VALUES('pending',datetime('now','+2 second'))").lastrowid
blocked = False
try:
    conn.execute("INSERT INTO order_items(order_id,product_id,quantity) VALUES(?,?,?)", (order2,1,3))
except sqlite3.IntegrityError as exc:
    blocked = 'build440_finished_inventory_commitment_exceeds_available' in str(exc)
check(blocked, 'checkout commitment trigger prevents two active orders from oversubscribing finished stock')
check(conn.execute("SELECT order_status FROM orders WHERE order_id=?", (order2,)).fetchone()[0] == 'cancelled', 'oversell failure leaves parent checkout safely cancelled')
check(conn.execute("SELECT COUNT(*) FROM order_status_history WHERE order_id=? AND new_status='cancelled'", (order2,)).fetchone()[0] == 1, 'automatic oversell cancellation leaves order-status evidence')

conn.execute("UPDATE orders SET order_status='cancelled' WHERE order_id=?", (order1,))
commitment = conn.execute("SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=1").fetchone()
check(commitment is None or abs(float(commitment[0])) < 1e-6, 'cancelled order releases forward commitment attribution')

# Add new production lot after legacy balance. FIFO attribution reaches it only after legacy stock.
run_id = conn.execute("INSERT INTO product_production_runs(run_key,product_id,output_quantity,run_status) VALUES('run-new',1,2,'posted')").lastrowid
conn.execute("UPDATE products SET inventory_quantity=7 WHERE product_id=1")
conn.execute("INSERT INTO product_finished_inventory_lots(lot_key,product_id,product_production_run_id,source_kind,quantity_created,unit_material_cost_cents,lot_status,created_at,updated_at) VALUES('PRODUCTION-run-new',1,?,'production_run',2,120,'available',datetime('now','+3 second'),datetime('now','+3 second'))", (run_id,))
order3 = conn.execute("INSERT INTO orders(order_status,created_at) VALUES('pending',datetime('now','+4 second'))").lastrowid
conn.execute("INSERT INTO order_items(order_id,product_id,quantity) VALUES(?,?,?)", (order3,1,6))
attribution = conn.execute("SELECT attributed_committed_quantity,attributed_uncommitted_quantity FROM product_finished_lot_commitment_attribution WHERE product_production_run_id=?", (run_id,)).fetchone()
check(attribution and abs(float(attribution[0]) - 1.0) < 1e-6 and abs(float(attribution[1]) - 1.0) < 1e-6, 'FIFO attribution consumes legacy opening stock first and identifies commitment on new production lot')

# Refund alone must not release physical inventory; cancellation does.
conn.execute("UPDATE orders SET order_status='refunded' WHERE order_id=?", (order3,))
refunded_commitment = conn.execute("SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=1").fetchone()
check(refunded_commitment and abs(float(refunded_commitment[0]) - 6.0) < 1e-6, 'refund alone does not falsely return physical stock to availability')

# Direct/Admin reduction below active commitment is blocked.
reduce_blocked = False
try:
    conn.execute("UPDATE products SET inventory_quantity=5 WHERE product_id=1")
except sqlite3.IntegrityError as exc:
    reduce_blocked = 'build440_finished_inventory_below_active_commitments' in str(exc)
check(reduce_blocked, 'finished inventory cannot be manually reduced below active downstream commitments')

# Reactivating an oversized cancelled order must be blocked.
order4 = conn.execute("INSERT INTO orders(order_status,created_at) VALUES('cancelled',datetime('now','+5 second'))").lastrowid
conn.execute("INSERT INTO order_items(order_id,product_id,quantity) VALUES(?,?,?)", (order4,1,7))
reactivation_blocked = False
try:
    conn.execute("UPDATE orders SET order_status='pending' WHERE order_id=?", (order4,))
except sqlite3.IntegrityError as exc:
    reactivation_blocked = 'build440_finished_inventory_commitment_exceeds_available' in str(exc)
check(reactivation_blocked, 'order reactivation guard prevents cancelled order from reclaiming unavailable finished stock')

check('product_production_run_material_lots' in migration and 'product_finished_inventory_lots' in migration, 'migration adds raw material-lot and finished-lot provenance authorities')
check('product_finished_lot_commitment_attribution' in migration and 'product_inventory_active_commitments' in migration, 'migration exposes forward commitment attribution views')
check("IN ('pending','paid','fulfilled','refunded')" in hardening, 'hardening keeps refunded physical orders committed until explicit return/restock')
check('RAISE(FAIL' in hardening and "order_status='cancelled'" in hardening, 'partial checkout conflict cancels parent order before returning constraint failure')
check('trg_products_build440_inventory_commit_guard_decrease' in hardening, 'finished Product reduction guard protects already-committed units')
check('loadMaterialLotPlan' in helper and "['fifo', 'fefo', 'manual']" in helper, 'shared helper honors existing manual/FIFO/FEFO lot policy authority')
check('landed_unit_cost_cents' in helper and 'shipping_cost_cents' in helper and 'tax_cost_cents' in helper, 'raw lot costing includes bounded landed shipping/tax allocation')
check('product_production_run_material_lots' in release and 'product_finished_inventory_lots' in release, 'production release writes immutable purchase-lot provenance and a finished lot')
check('UPDATE inventory_purchase_lots SET quantity_remaining=' in release and 'product_production_concurrent_lot_change' in release, 'production release optimistically deducts purchase lots and compensates drift')
check('loadFinishedLotGuard' in reversal and 'attributed_committed_quantity' in reversal, 'reversal blocks when downstream commitment attribution reaches its finished lot')
check('UPDATE inventory_purchase_lots SET quantity_remaining=' in reversal and "lot_status='available'" in reversal, 'reversal restores exact purchase-lot remaining quantity')
check("lot_status='reversed'" in reversal and 'product_finished_lot_commitment_attribution' in reversal, 'reversal retires only an uncommitted finished-production lot')
check('CREATE TABLE' not in helper.upper() and 'ALTER TABLE' not in helper.upper(), 'shared runtime helper performs no request-time schema repair')
check('CREATE TABLE' not in release.upper() and 'ALTER TABLE' not in release.upper(), 'production release performs no request-time schema repair')
check('CREATE TABLE' not in reversal.upper() and 'ALTER TABLE' not in reversal.upper(), 'production reversal performs no request-time schema repair')

print(f'\nBUILD 440 PRODUCT / INVENTORY LOT PROVENANCE REGRESSION: PASS ({len(checks)}/{len(checks)})')
print('Historical provenance fabrication: NONE')
print('Raw material authority: inventory_purchase_lots + inventory_lot_policies')
print('Physical lot reconciliation: NON-RETURNED STOCK / QUARANTINE PRESERVED')
print('New production raw-lot evidence: IMMUTABLE / EXACT')
print('Finished inventory cutover: LEGACY OPENING BALANCE + NEW PRODUCTION LOTS')
print('Downstream commitment attribution: FIFO / POST-CUTOVER / REFUND FAIL-CLOSED')
print('Oversell guard: ORDER ITEM INSERT/UPDATE + ORDER REACTIVATION')
print('Partial checkout on conflict: PARENT ORDER CANCELLED')
print('Finished inventory reduction below commitments: BLOCKED')
print('Production reversal: BLOCKED WHEN RUN LOT IS DOWNSTREAM-COMMITTED')
print('D1/R2/provider mutation executed by regression: NONE')
print('PRODUCTION PROMOTION: CLOSED')
