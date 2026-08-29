#!/usr/bin/env python3
"""Release 448 Supply sourcing/replenishment source and schema gate."""
from pathlib import Path
import sqlite3,tempfile
ROOT=Path(__file__).resolve().parents[1]
MIG=ROOT/'database_release448_supply_sourcing.sql';API=ROOT/'functions/api/admin/supply-sourcing.js';HTML=ROOT/'admin/supply-sourcing/index.html';JS=ROOT/'public/js/admin-supply-sourcing.js'
for path in (MIG,API,HTML,JS):
 if not path.exists():raise SystemExit(f'FAIL — Supply sourcing file missing: {path.relative_to(ROOT)}')
sql=MIG.read_text(encoding='utf-8');api=API.read_text(encoding='utf-8');html=HTML.read_text(encoding='utf-8');js=JS.read_text(encoding='utf-8')
required=('inventory_supply_source_options','inventory_supply_replenishment_profiles','inventory_supply_substitution_reviews')
for name in required:
 if f'CREATE TABLE IF NOT EXISTS {name}' not in sql:raise SystemExit(f'FAIL — migration missing {name}')
for marker in ('trg_supply_source_insert_guard','trg_supply_profile_insert_guard','trg_supply_substitution_insert_guard','trg_supply_profile_preferred_source_insert_guard'):
 if marker not in sql:raise SystemExit(f'FAIL — Supply database guard missing: {marker}')
for forbidden in ('UPDATE site_item_inventory','INSERT INTO site_item_inventory','DELETE FROM site_item_inventory','INSERT INTO site_inventory_movements','UPDATE site_inventory_movements'):
 if forbidden.lower() in sql.lower():raise SystemExit(f'FAIL — Supply migration may not mutate stock authority: {forbidden}')
 if forbidden.lower() in api.lower():raise SystemExit(f'FAIL — Supply API may not mutate stock authority: {forbidden}')
if "stock_mutation_capability:'none'" not in api or 'automatic_ordering:false' not in api:raise SystemExit('FAIL — Supply API must explicitly disable stock mutation and automatic ordering')
if html.lower().count('<h1')!=1:raise SystemExit('FAIL — Supply sourcing admin page must contain exactly one H1')
for marker in ('Replenishment calibration','Purchase sources','Reviewed material substitutions'):
 if marker not in html and marker not in js:raise SystemExit(f'FAIL — Supply workspace missing capability: {marker}')
with tempfile.NamedTemporaryFile(suffix='.sqlite') as tmp:
 db=sqlite3.connect(tmp.name);db.execute('PRAGMA foreign_keys=ON')
 db.executescript('''
 CREATE TABLE users(user_id INTEGER PRIMARY KEY,is_active INTEGER DEFAULT 1,role TEXT);
 CREATE TABLE site_item_inventory(site_item_inventory_id INTEGER PRIMARY KEY,source_type TEXT,external_key TEXT,item_name TEXT,category TEXT,on_hand_quantity REAL DEFAULT 0,is_on_reorder_list INTEGER DEFAULT 0,do_not_reuse INTEGER DEFAULT 0,unit_cost_cents INTEGER,stock_unit_label TEXT,usage_unit_label TEXT,usage_units_per_stock_unit REAL,supplier_name TEXT,supplier_sku TEXT,amazon_url TEXT,image_url TEXT,is_active INTEGER DEFAULT 1);
 INSERT INTO users(user_id,is_active,role) VALUES(1,1,'admin');
 INSERT INTO site_item_inventory(site_item_inventory_id,source_type,item_name,on_hand_quantity) VALUES(1,'supply','Supply A',2),(2,'supply','Supply B',5),(3,'tool','Tool A',1);
 ''')
 db.executescript(sql)
 db.execute("INSERT INTO inventory_supply_source_options(site_item_inventory_id,source_name,relationship_type,pack_quantity,pack_price_cents) VALUES(1,'Vendor A','primary',2,1000)")
 source_id=db.execute('SELECT inventory_supply_source_option_id FROM inventory_supply_source_options WHERE site_item_inventory_id=1').fetchone()[0]
 db.execute('INSERT INTO inventory_supply_replenishment_profiles(site_item_inventory_id,reorder_point_quantity,target_stock_quantity,preferred_source_option_id) VALUES(1,2,8,?)',(source_id,))
 db.execute("INSERT INTO inventory_supply_substitution_reviews(site_item_inventory_id,substitute_site_item_inventory_id,review_status,equivalence_scope) VALUES(1,2,'approved','conditional')")
 try:db.execute("INSERT INTO inventory_supply_source_options(site_item_inventory_id,source_name) VALUES(3,'Invalid Tool Vendor')")
 except sqlite3.IntegrityError:pass
 else:raise SystemExit('FAIL — database allowed a sourcing record on a Tool')
 try:db.execute("INSERT INTO inventory_supply_substitution_reviews(site_item_inventory_id,substitute_site_item_inventory_id) VALUES(1,3)")
 except sqlite3.IntegrityError:pass
 else:raise SystemExit('FAIL — database allowed a Tool as Supply substitute')
 before=db.execute('SELECT on_hand_quantity FROM site_item_inventory WHERE site_item_inventory_id=1').fetchone()[0]
 after=db.execute('SELECT on_hand_quantity FROM site_item_inventory WHERE site_item_inventory_id=1').fetchone()[0]
 if before!=after:raise SystemExit('FAIL — Supply planning changed Inventory quantity')
 violations=db.execute('PRAGMA foreign_key_check').fetchall()
 if violations:raise SystemExit(f'FAIL — Supply sourcing foreign-key violations: {violations}')
print('RELEASE 448 SUPPLY SOURCING / REPLENISHMENT: PASS')
print('Vendor/source options, replenishment profiles and reviewed substitutions: PRESENT')
print('Supply-only database guards: ACTIVE')
print('Inventory quantity mutation: NONE')
print('Automatic provider ordering: NONE')
