#!/usr/bin/env python3
"""Build 440 Tool/Supply receiving + source-provenance regression.

Local-only. Executes the two additive receiving migrations against an in-memory SQLite fixture,
then validates authority, identity normalization, barcode uniqueness, reversal schema, and source
contracts. It never contacts Cloudflare, D1, R2, providers, or the network.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'database_build440_inventory_receiving_source_provenance.sql'
REVERSAL_MIGRATION = ROOT / 'database_build440_inventory_receiving_reversal.sql'
SERVICE = ROOT / 'functions/api/_lib/inventoryReceiving.js'
REVERSAL_SERVICE = ROOT / 'functions/api/_lib/inventoryReceivingReversal.js'
API = ROOT / 'functions/api/admin/inventory-receiving.js'
PO_API = ROOT / 'functions/api/admin/purchase-orders.js'
UI = ROOT / 'public/js/admin-inventory-receiving.js'
REVERSAL_UI = ROOT / 'public/js/admin-inventory-receiving-reversal.js'
PAGE = ROOT / 'admin/inventory-operations/index.html'
CSS = ROOT / 'css/inventory-receiving.css'


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8') if path.exists() else ''


def fixture() -> sqlite3.Connection:
    db = sqlite3.connect(':memory:')
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript('''
      CREATE TABLE users(user_id INTEGER PRIMARY KEY, email TEXT);
      INSERT INTO users(user_id,email) VALUES(1,'dev@example.test');

      CREATE TABLE app_settings(
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT,
        is_public INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE schema_migration_ledger(
        migration_key TEXT PRIMARY KEY,
        file_name TEXT,
        checksum TEXT,
        status TEXT,
        destructive INTEGER,
        applied_at TEXT,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE site_item_inventory(
        site_item_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_type TEXT NOT NULL,
        external_key TEXT,
        item_name TEXT,
        category TEXT,
        on_hand_quantity REAL NOT NULL DEFAULT 0,
        reserved_quantity REAL NOT NULL DEFAULT 0,
        incoming_quantity REAL NOT NULL DEFAULT 0,
        reorder_level REAL NOT NULL DEFAULT 0,
        unit_cost_cents INTEGER NOT NULL DEFAULT 0,
        stock_unit_label TEXT NOT NULL DEFAULT 'unit',
        usage_unit_label TEXT NOT NULL DEFAULT 'unit',
        supplier_name TEXT,
        supplier_sku TEXT,
        supplier_contact TEXT,
        source_url TEXT,
        amazon_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        do_not_reorder INTEGER NOT NULL DEFAULT 0,
        is_on_reorder_list INTEGER NOT NULL DEFAULT 0,
        last_counted_at TEXT,
        last_seen_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE site_inventory_movements(
        site_inventory_movement_id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_item_inventory_id INTEGER,
        source_type TEXT,
        external_key TEXT,
        item_name TEXT,
        movement_type TEXT,
        quantity_delta REAL,
        previous_on_hand_quantity REAL,
        new_on_hand_quantity REAL,
        previous_reserved_quantity REAL,
        new_reserved_quantity REAL,
        previous_incoming_quantity REAL,
        new_incoming_quantity REAL,
        note TEXT,
        actor_user_id INTEGER,
        created_at TEXT
      );
      CREATE TABLE inventory_purchase_lots(
        inventory_purchase_lot_id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_item_inventory_id INTEGER NOT NULL,
        lot_code TEXT NOT NULL,
        purchase_date TEXT,
        received_date TEXT,
        supplier_name TEXT,
        supplier_order_number TEXT,
        supplier_sku TEXT,
        asin TEXT,
        source_url TEXT,
        quantity_received REAL NOT NULL DEFAULT 0,
        quantity_remaining REAL NOT NULL DEFAULT 0,
        unit_cost_cents INTEGER NOT NULL DEFAULT 0,
        shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
        tax_cost_cents INTEGER NOT NULL DEFAULT 0,
        expiry_date TEXT,
        storage_location TEXT,
        lot_status TEXT NOT NULL DEFAULT 'available',
        notes TEXT,
        created_by_user_id INTEGER,
        created_at TEXT,
        updated_at TEXT,
        UNIQUE(site_item_inventory_id,lot_code),
        FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id)
      );
      CREATE TABLE inventory_lot_policies(
        site_item_inventory_id INTEGER PRIMARY KEY,
        depletion_method TEXT NOT NULL DEFAULT 'manual',
        reconcile_status TEXT NOT NULL DEFAULT 'needs_review',
        last_reconciled_quantity REAL,
        last_reconciled_at TEXT,
        updated_by_user_id INTEGER,
        updated_at TEXT
      );
      CREATE TABLE supplier_purchase_orders(
        supplier_purchase_order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_name TEXT,
        supplier_contact TEXT,
        status TEXT,
        notes TEXT,
        total_estimated_cents INTEGER,
        created_by_user_id INTEGER,
        ordered_applied_at TEXT,
        received_completed_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE supplier_purchase_order_items(
        supplier_purchase_order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_purchase_order_id INTEGER NOT NULL,
        site_item_inventory_id INTEGER,
        item_name TEXT,
        source_type TEXT,
        external_key TEXT,
        quantity_ordered REAL NOT NULL DEFAULT 0,
        quantity_received REAL NOT NULL DEFAULT 0,
        unit_cost_cents INTEGER NOT NULL DEFAULT 0,
        line_total_cents INTEGER NOT NULL DEFAULT 0,
        incoming_applied_at TEXT,
        received_at TEXT,
        created_at TEXT
      );

      INSERT INTO site_item_inventory(
        site_item_inventory_id,source_type,external_key,item_name,on_hand_quantity,incoming_quantity,
        unit_cost_cents,supplier_name,supplier_sku,source_url,amazon_url,is_active
      ) VALUES
        (1,'supply','supply-oil','Test Oil',5,2,450,'Supplier A',' SKU- 001 ','https://supplier.example/oil','',1),
        (2,'tool','tool-hammer','Test Hammer',1,0,1200,'Supplier B','TOOL-1','','https://amazon.example/tool',1),
        (3,'product','product-x','Finished Product',3,0,2500,'','','','',1);
    ''')
    return db


def check(name: str, ok: bool, failures: list[str]) -> None:
    print(f'{"PASS" if ok else "FAIL"} — {name}')
    if not ok:
        failures.append(name)


def main() -> int:
    migration = read(MIGRATION)
    reversal_migration = read(REVERSAL_MIGRATION)
    service = read(SERVICE)
    reversal_service = read(REVERSAL_SERVICE)
    api = read(API)
    po_api = read(PO_API)
    ui = read(UI)
    reversal_ui = read(REVERSAL_UI)
    page = read(PAGE)
    css = read(CSS)
    failures: list[str] = []

    print('BUILD 440 INVENTORY RECEIVING / SOURCE PROVENANCE REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE\n')

    db = fixture()
    try:
        db.executescript(migration)
        db.executescript(reversal_migration)
        # Idempotency: both additive migrations must be safe to execute again.
        db.executescript(migration)
        db.executescript(reversal_migration)
        migrated = True
    except Exception as exc:
        migrated = False
        print(f'MIGRATION ERROR: {exc}')

    check('both receiving migrations execute twice against SQLite fixture', migrated, failures)
    if migrated:
        tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        for table in ('inventory_item_identifiers','inventory_item_sources','inventory_receiving_claims','inventory_receiving_reversals'):
            check(f'{table} exists', table in tables, failures)

        ext = db.execute("SELECT COUNT(*) FROM inventory_item_identifiers WHERE identifier_type='external_key'").fetchone()[0]
        sku = db.execute("SELECT COUNT(*) FROM inventory_item_identifiers WHERE identifier_type='supplier_sku'").fetchone()[0]
        check('existing external keys are backfilled as identifiers', ext == 3, failures)
        check('existing supplier SKUs are backfilled without inventing barcodes', sku == 2, failures)
        invented = db.execute("SELECT COUNT(*) FROM inventory_item_identifiers WHERE identifier_type IN ('barcode','upc','ean','gtin')").fetchone()[0]
        check('migration invents zero historical barcode values', invented == 0, failures)

        sources = db.execute('SELECT COUNT(*) FROM inventory_item_sources').fetchone()[0]
        check('existing supplier/source fields are normalized into source provenance', sources == 2, failures)

        db.execute("INSERT INTO inventory_item_identifiers(site_item_inventory_id,identifier_type,identifier_value,normalized_value,source_name,verification_status) VALUES (1,'upc','012345678905','012345678905','','verified')")
        barcode_conflict_blocked = False
        try:
            db.execute("INSERT INTO inventory_item_identifiers(site_item_inventory_id,identifier_type,identifier_value,normalized_value,source_name,verification_status) VALUES (2,'barcode','012345678905','012345678905','','verified')")
        except sqlite3.IntegrityError:
            barcode_conflict_blocked = True
        check('verified barcode identity cannot silently point at two Inventory items', barcode_conflict_blocked, failures)

        db.execute("INSERT INTO inventory_receiving_claims(receive_key,site_item_inventory_id,lot_code,quantity_received,claim_status,previous_on_hand_quantity,new_on_hand_quantity,previous_incoming_quantity,new_incoming_quantity) VALUES ('fixture-receive-1',1,'FIX-LOT',1,'completed',5,6,2,1)")
        claim_id = db.execute("SELECT inventory_receiving_claim_id FROM inventory_receiving_claims WHERE receive_key='fixture-receive-1'").fetchone()[0]
        db.execute("INSERT INTO inventory_purchase_lots(site_item_inventory_id,lot_code,quantity_received,quantity_remaining,created_at,updated_at) VALUES (1,'FIX-LOT',1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)")
        lot_id = db.execute("SELECT inventory_purchase_lot_id FROM inventory_purchase_lots WHERE site_item_inventory_id=1 AND lot_code='FIX-LOT'").fetchone()[0]
        db.execute("UPDATE inventory_receiving_claims SET inventory_purchase_lot_id=? WHERE inventory_receiving_claim_id=?", (lot_id, claim_id))
        db.execute("INSERT INTO inventory_receiving_reversals(inventory_receiving_claim_id,reversal_key,site_item_inventory_id,inventory_purchase_lot_id,quantity_reversed,reversal_reason) VALUES (?,?,?,?,?,?)", (claim_id,'fixture-reverse-1',1,lot_id,1,'Fixture reversal'))
        second_reversal_blocked = False
        try:
            db.execute("INSERT INTO inventory_receiving_reversals(inventory_receiving_claim_id,reversal_key,site_item_inventory_id,inventory_purchase_lot_id,quantity_reversed,reversal_reason) VALUES (?,?,?,?,?,?)", (claim_id,'fixture-reverse-2',1,lot_id,1,'Second reversal'))
        except sqlite3.IntegrityError:
            second_reversal_blocked = True
        check('one receiving claim can have only one compensating reversal', second_reversal_blocked, failures)

        ledger = db.execute("SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key IN ('build440_inventory_receiving_source_provenance','build440_inventory_receiving_reversal')").fetchone()[0]
        check('both receiving migrations are recorded once in migration ledger', ledger == 2, failures)

    check('shared receiving service performs no request-time DDL', not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b|PRAGMA', service, re.I), failures)
    check('receiving service restricts ownership to Tool/Supply', "['tool','supply'].includes(sourceType)" in service and 'Finished Product stock must use its owning production/commerce workflow' in service, failures)
    check('receiving service uses idempotent receiving claims', 'receive_key' in service and 'inventory_receiving_claims' in service and 'idempotent' in service, failures)
    check('receiving service posts aggregate Inventory and purchase lot in one verified batch', 'site_item_inventory' in service and 'inventory_purchase_lots' in service and 'db.batch(statements)' in service and 'inventoryChanged' in service and 'lotChanged' in service and 'completed' in service, failures)
    check('receiving service records site_inventory_movements', 'INSERT INTO site_inventory_movements' in service and "'incoming'" in service, failures)
    check('receiving service fails barcode conflicts before stock mutation', 'inventory_receiving_barcode_conflict' in service and 'verifyIdentifierCanBind' in service, failures)
    check('receiving service refuses Product cross-mutation', 'inventory_receiving_wrong_owner' in service, failures)
    check('shared receiving reversal performs no request-time DDL', not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b|PRAGMA', reversal_service, re.I), failures)
    check('receipt reversal requires unconsumed lot quantity and blocks double reversal', 'lotRemaining + EPSILON < quantity' in reversal_service and 'already been reversed' in reversal_service, failures)
    check('receipt reversal writes a compensating Inventory movement', "'correction'" in reversal_service and 'Reversal of receiving claim' in reversal_service, failures)
    check('purchase-order receiving delegates to the shared service', "import { receiveInventoryItem }" in po_api and 'await receiveInventoryItem' in po_api, failures)
    check('partial PO receipt remains ordered until every line is complete', "finalStatus = remaining <= 0.000001 ? 'received' : 'ordered'" in po_api, failures)
    check('PO cancellation releases remaining incoming quantity', 'releaseCancelledIncoming' in po_api and 'cancelled; ${clearQty} incoming unit(s) released' in po_api, failures)
    check('receiving API is Admin-authenticated and exposes explicit receive/reverse only', 'getAdminUserFromRequest' in api and "['receive','reverse'].includes(action)" in api, failures)
    check('receiving API reports no request-time schema/R2/provider mutation', 'request_time_schema_mutation: false' in api and 'r2_mutation: false' in api and 'provider_execution: false' in api, failures)
    check('receiving UI is mounted on Inventory Operations page', 'inventoryReceivingMount' in page and 'admin-inventory-receiving.js?v=440.1' in page and 'inventory-receiving.css?v=440.1' in page, failures)
    check('receipt reversal UI is mounted beside receiving', 'inventoryReceivingReversalMount' in page and 'admin-inventory-receiving-reversal.js?v=440.1' in page, failures)
    check('receiving UI has no polling or automatic write retry', 'setInterval' not in ui and 'retries:' not in ui and "method: 'POST'" in ui, failures)
    check('camera scan is explicit, bounded, and stops its media tracks', 'BarcodeDetector' in ui and 'Date.now() + 12000' in ui and 'getTracks().forEach((track) => track.stop())' in ui, failures)
    check('receipt reversal UI requires review/reason/confirmation', 'reversal_claim_id' in reversal_ui and 'at least 8 characters' in reversal_ui and 'window.confirm' in reversal_ui, failures)
    check('receiving CSS includes mobile breakpoints', '@media(max-width:800px)' in css and '@media(max-width:520px)' in css, failures)

    print()
    if failures:
        print(f'BUILD 440 INVENTORY RECEIVING / SOURCE PROVENANCE REGRESSION: FAIL ({len(failures)} failed)')
        for failure in failures:
            print(' -', failure)
        return 1
    print('BUILD 440 INVENTORY RECEIVING / SOURCE PROVENANCE REGRESSION: PASS')
    print('Stock authority: site_item_inventory + site_inventory_movements')
    print('Purchase-lot authority: inventory_purchase_lots')
    print('Receiving idempotency/evidence: inventory_receiving_claims')
    print('Receipt reversal: ONE AUDITED COMPENSATING REVERSAL / UNCONSUMED LOT REQUIRED')
    print('Barcode identity: NORMALIZED / NO HISTORICAL VALUES INVENTED')
    print('Supplier/source provenance: NORMALIZED MULTI-SOURCE')
    print('Finished Product cross-mutation: BLOCKED')
    print('Cloudflare/D1/R2/provider mutation: NONE')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
