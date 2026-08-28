#!/usr/bin/env python3
"""Release 448 Product lineage schema and publication-policy source gate.

Local SQLite/source only. No Cloudflare, D1 remote, R2, provider or Production access.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'database_release448_product_lineage.sql'
VERIFY = ROOT / 'RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql'
failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def base_schema(conn: sqlite3.Connection) -> None:
    conn.executescript("""
      PRAGMA foreign_keys=ON;
      CREATE TABLE users(user_id INTEGER PRIMARY KEY,email TEXT,role TEXT,is_active INTEGER DEFAULT 1);
      INSERT INTO users(user_id,email,role,is_active) VALUES(1,'owner@example.invalid','admin',1);
      CREATE TABLE products(
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        review_status TEXT DEFAULT 'pending_review',
        merchandise_origin TEXT NOT NULL DEFAULT 'handmade',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE product_resource_links(
        product_resource_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        resource_kind TEXT NOT NULL,
        source_key TEXT NOT NULL,
        quantity_used REAL DEFAULT 1,
        consumption_mode TEXT DEFAULT 'per_unit',
        lot_size_units REAL DEFAULT 1,
        usage_notes TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
      );
      CREATE TABLE site_item_inventory(
        site_item_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_type TEXT NOT NULL,
        external_key TEXT NOT NULL,
        item_name TEXT,
        is_active INTEGER DEFAULT 1,
        on_hand_quantity REAL DEFAULT 0,
        stock_unit_label TEXT DEFAULT 'unit',
        supplier_name TEXT,
        supplier_sku TEXT,
        amazon_url TEXT
      );
      INSERT INTO products(product_id,name,status,review_status,merchandise_origin) VALUES
        (1,'Historical Handmade','active','published','handmade'),
        (2,'Historical Antique','active','published','antique');
      INSERT INTO site_item_inventory(site_item_inventory_id,source_type,external_key,item_name,is_active,on_hand_quantity)
        VALUES(11,'supply','wax-1','Wax',1,5),(12,'tool','mold-1','Mold',1,1);
      INSERT INTO product_resource_links(product_resource_link_id,product_id,resource_kind,source_key,quantity_used,consumption_mode)
        VALUES(21,1,'supply','wax-1',0.25,'per_unit'),(22,1,'tool','mold-1',1,'story_only');
    """)


def execute_gate() -> None:
    sql = MIGRATION.read_text(encoding='utf-8')
    conn = sqlite3.connect(':memory:')
    try:
        base_schema(conn)
        before = conn.execute('SELECT on_hand_quantity FROM site_item_inventory WHERE site_item_inventory_id=11').fetchone()[0]
        conn.executescript(sql)
        conn.executescript(sql)

        tables = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
        for name in ('product_lineage_profiles','product_resource_lineage_reviews','inventory_vendor_reviews'):
            require(name in tables, f'missing lineage table: {name}')

        legacy = conn.execute("SELECT origin_kind,lineage_status,publication_policy,materials_required FROM product_lineage_profiles WHERE product_id=1").fetchone()
        require(legacy == ('legacy_pending','legacy_pending','legacy_nonblocking',1), f'historical handmade policy drifted: {legacy}')
        antique = conn.execute("SELECT origin_kind,lineage_status,publication_policy,materials_required FROM product_lineage_profiles WHERE product_id=2").fetchone()
        require(antique == ('antiquity','exempt','exempt',0), f'antiquity exemption drifted: {antique}')

        conn.execute("INSERT INTO products(name,status,review_status,merchandise_origin) VALUES('New Handmade','draft','pending_review','handmade')")
        new_id = conn.execute("SELECT MAX(product_id) FROM products").fetchone()[0]
        new_profile = conn.execute("SELECT origin_kind,lineage_status,publication_policy,materials_required FROM product_lineage_profiles WHERE product_id=?", (new_id,)).fetchone()
        require(new_profile == ('made_in_house','pending','required',1), f'new handmade trigger policy drifted: {new_profile}')

        conn.execute("INSERT INTO products(name,status,review_status,merchandise_origin) VALUES('New Resale','draft','pending_review','prebuilt')")
        resale_id = conn.execute("SELECT MAX(product_id) FROM products").fetchone()[0]
        resale = conn.execute("SELECT origin_kind,lineage_status,publication_policy,materials_required FROM product_lineage_profiles WHERE product_id=?", (resale_id,)).fetchone()
        require(resale == ('external_finished_good','exempt','exempt',0), f'new external finished-good exemption drifted: {resale}')

        resource_rows = conn.execute("SELECT product_resource_link_id,site_item_inventory_id,resource_role,verification_status FROM product_resource_lineage_reviews WHERE product_id=1 ORDER BY product_resource_link_id").fetchall()
        require(resource_rows == [(21,11,'material','legacy_pending'),(22,12,'tool','legacy_pending')], f'compatibility resource review rows drifted: {resource_rows}')

        after = conn.execute('SELECT on_hand_quantity FROM site_item_inventory WHERE site_item_inventory_id=11').fetchone()[0]
        require(before == after == 5, 'lineage migration changed Inventory quantity')
        require(not conn.execute('PRAGMA foreign_key_check').fetchall(), 'lineage migration introduced foreign-key violations')
    finally:
        conn.close()


require(MIGRATION.exists(), 'database_release448_product_lineage.sql is missing')
require(VERIFY.exists(), 'RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql is missing')
if MIGRATION.exists():
    sql = MIGRATION.read_text(encoding='utf-8')
    for marker in (
        'CREATE TABLE IF NOT EXISTS product_lineage_profiles',
        'CREATE TABLE IF NOT EXISTS product_resource_lineage_reviews',
        'CREATE TABLE IF NOT EXISTS inventory_vendor_reviews',
        'trg_product_lineage_profile_after_insert',
        "'legacy_nonblocking'",
        "'made_in_house'",
        "'antiquity'",
        "'external_finished_good'",
    ):
        require(marker in sql, f'lineage migration missing marker: {marker}')
    require('DROP TABLE' not in sql.upper(), 'lineage migration may not drop tables')
    require('DROP COLUMN' not in sql.upper(), 'lineage migration may not drop columns')
    require('UPDATE SITE_ITEM_INVENTORY' not in sql.upper(), 'lineage migration may not mutate Inventory quantities')

helper = (ROOT / 'functions/api/_lib/productLineage.js').read_text(encoding='utf-8')
api = (ROOT / 'functions/api/admin/product-lineage.js').read_text(encoding='utf-8')
middleware = (ROOT / 'functions/api/admin/_middleware.js').read_text(encoding='utf-8')
page = (ROOT / 'admin/product-lineage/index.html').read_text(encoding='utf-8')
client = (ROOT / 'public/js/admin-product-lineage.js').read_text(encoding='utf-8')
for marker in ('publication_policy', 'publish_blocked', 'site_item_inventory + site_inventory_movements'):
    require(marker in helper + api, f'lineage service missing authority marker: {marker}')
require('product_lineage_publication_blocked' in middleware, 'required-lineage publication guard is missing')
require("['publish', 'publish_override']" in middleware, 'publish + override lineage enforcement is missing')
require('context.next()' in middleware, 'admin middleware must pass unrelated routes through')
require(page.lower().count('<h1') == 1, 'Product Lineage admin page must contain one H1')
require('never changes stock' in page.lower(), 'Product Lineage page must explain stock ownership')
require('/api/admin/product-lineage' in client, 'Product Lineage client is not wired to its API')

if not failures:
    try:
        execute_gate()
    except Exception as exc:
        failures.append(f'lineage SQLite execution failed: {exc}')

print('PRODUCT LINEAGE CURRENT SOURCE GATE')
print('Inventory ledger duplicated: NO')
print('Historical consumption fabricated: NO')
print('Legacy publication policy: NON-BLOCKING')
print('New made-in-house publication policy: REQUIRED')
print('Production mutation capability: NONE')
if failures:
    for index, failure in enumerate(failures, 1):
        print(f'{index:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('PRODUCT LINEAGE CURRENT SOURCE GATE: PASS')
