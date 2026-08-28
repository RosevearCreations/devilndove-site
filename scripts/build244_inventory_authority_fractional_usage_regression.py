#!/usr/bin/env python3
from pathlib import Path
import json, re, sqlite3, sys

ROOT = Path(__file__).resolve().parents[1]
MIG = ROOT / 'database_build244_inventory_authority_fractional_usage.sql'
UPG = ROOT / 'database_upgrade_current_pass.sql'

failures=[]
def check(ok,msg):
    if not ok: failures.append(msg)

sql=MIG.read_text(encoding='utf-8')
current_sql=UPG.read_text(encoding='utf-8')
current_build_match=re.search(r'\bBuild\s+(\d+)\b',current_sql[:1000],re.I)
current_build=int(current_build_match.group(1)) if current_build_match else 0
check(current_build>=244 or sql in current_sql,'current upgrade SQL must retain/advance beyond the complete Build 244 migration segment')
check('CREATE TEMP' not in sql.upper(),'migration must not use TEMP tables')
check('DROP TABLE' not in sql.upper(),'migration must not DROP tables')
check("'site.inventory.catalog_authority','d1_build244'" in sql,'D1 catalog authority setting missing')
check("'site.inventory.legacy_usage_default','log_only_review_required'" in sql,'legacy safe usage default missing')
check('site_inventory_usage_profiles' in sql and 'site_inventory_usage_movements' in sql,'fractional usage sidecars missing')

# Build 310 moved Creative posting mutation behind the Inventory-owned inventory-post contract.
# Build 440 further split public Tool/Supply authority: catalog_items is publication eligibility,
# while active site_item_inventory is live operational identity/metadata when a normalized match exists.
for rel, needles in {
    'functions/api/admin/site-item-inventory.js':['consume_usage','usage_tracking_mode','syncCatalogItemsIntoInventory','classification_merge'],
    'public/js/admin-site-item-inventory.js':['Smallest usage increment','500 g mica jar','data-field="source_type"','loadSeedOptions({ query'],
    'functions/api/admin/creative-process.js':['usage_quantity_consumed','postCreativeInventoryThroughContract','inventory-post'],
    'functions/api/_lib/creativeInventoryPostConsumer.js':['postCreativeInventoryUsage','usageQuantity','inventory-post'],
    'functions/api/_lib/inventoryPostService.js':['creative_project_inventory_usage_details','site_inventory_usage_movements','usage_quantity_consumed','stock_quantity_consumed'],
    'public/js/admin-creative-process.js':['Amount actually used','data-usage-quantity'],
    'functions/api/tools.js':['catalog_items is the public publication registry','site_item_inventory is the operational identity/metadata authority','inventory+catalog_publication'],
    'functions/api/supplies.js':['catalog_items is the public publication registry','site_item_inventory is the operational identity/metadata authority','inventory+catalog_publication'],
    'functions/api/admin/catalog-sync.js':['Runtime JSON re-import is disabled'],
}.items():
    source_text=(ROOT/rel).read_text(encoding='utf-8')
    for needle in needles: check(needle in source_text,f'{rel} missing {needle}')

# Validate source master counts are represented by provenance INSERTs.
tools=json.loads((ROOT/'data/toolshed/toolshed_items_master.json').read_text(encoding='utf-8'))
supplies=json.loads((ROOT/'data/supplies/supplies_items_master.json').read_text(encoding='utf-8'))
check(len(tools)==399,f'expected 399 tool master rows, found {len(tools)}')
check(len(supplies)==498,f'expected 498 supply master rows, found {len(supplies)}')

conn=sqlite3.connect(':memory:')
conn.executescript('''
PRAGMA foreign_keys=ON;
CREATE TABLE users(user_id INTEGER PRIMARY KEY);
CREATE TABLE site_item_inventory(
  site_item_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT, source_type TEXT NOT NULL, external_key TEXT NOT NULL,
  item_name TEXT NOT NULL, category TEXT, source_url TEXT, amazon_url TEXT, image_url TEXT,
  on_hand_quantity REAL NOT NULL DEFAULT 1, reserved_quantity REAL NOT NULL DEFAULT 0, incoming_quantity REAL NOT NULL DEFAULT 0,
  reorder_level REAL NOT NULL DEFAULT 0, unit_cost_cents INTEGER NOT NULL DEFAULT 0, stock_unit_label TEXT NOT NULL DEFAULT 'unit',
  usage_unit_label TEXT NOT NULL DEFAULT 'unit', usage_units_per_stock_unit REAL NOT NULL DEFAULT 1,
  supplier_name TEXT, supplier_sku TEXT, supplier_contact TEXT, reorder_notes TEXT,
  preferred_reorder_quantity REAL NOT NULL DEFAULT 0, is_on_reorder_list INTEGER NOT NULL DEFAULT 0,
  do_not_reorder INTEGER NOT NULL DEFAULT 0, do_not_reuse INTEGER NOT NULL DEFAULT 0, reuse_status TEXT, reservation_notes TEXT,
  last_reorder_requested_at TEXT, last_counted_at TEXT, is_active INTEGER NOT NULL DEFAULT 1,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(source_type, external_key)
);
CREATE TABLE site_inventory_movements(site_inventory_movement_id INTEGER PRIMARY KEY AUTOINCREMENT, site_item_inventory_id INTEGER);
CREATE TABLE creative_project_inventory_posts(creative_project_inventory_post_id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE TABLE app_settings(setting_key TEXT PRIMARY KEY, setting_value TEXT, is_public INTEGER NOT NULL DEFAULT 0);
CREATE TABLE schema_migration_ledger(migration_key TEXT PRIMARY KEY,file_name TEXT,checksum TEXT,status TEXT,destructive INTEGER DEFAULT 0,applied_at TEXT,notes TEXT,created_at TEXT,updated_at TEXT);
''')
try:
    conn.executescript(sql)
    check(conn.execute('select count(*) from catalog_items').fetchone()[0]==897,'first migration should copy all 897 legacy master rows into D1 catalog')
    check(conn.execute('select count(*) from site_item_inventory').fetchone()[0]==897,'first migration should populate all 897 catalog rows into working inventory in clean schema')
    modes=dict(conn.execute('select usage_tracking_mode,count(*) from site_inventory_usage_profiles group by usage_tracking_mode'))
    check(modes.get('reusable')==399,'tool defaults should be reusable')
    check(modes.get('log_only')==498,'legacy supply defaults should be log_only until unit conversion review')
    conn.executescript(sql)
    check(conn.execute('select count(*) from catalog_items').fetchone()[0]==897,'rerun created catalog duplicates')
    check(conn.execute('select count(*) from site_item_inventory').fetchone()[0]==897,'rerun created inventory duplicates')
    inactive=conn.execute("select site_item_inventory_id,source_type,external_key from site_item_inventory limit 1").fetchone()
    if inactive:
        conn.execute("update site_item_inventory set is_active=0 where site_item_inventory_id=?",(inactive[0],))
        conn.commit(); conn.executescript(sql)
        state=conn.execute("select count(*),sum(case when is_active=1 then 1 else 0 end) from site_item_inventory where lower(source_type)=? and external_key=?",(inactive[1].lower(),inactive[2])).fetchone()
        check(state==(1,0),f'migration rerun resurrected inactive inventory identity: {state}')
    row=conn.execute("select source_key from catalog_items where item_kind='tool' and source_key not in (select source_key from catalog_items where item_kind='supply') limit 1").fetchone()
    if row:
        key=row[0]
        conn.execute("update catalog_items set item_kind='supply' where item_kind='tool' and source_key=?",(key,))
        conn.execute("update site_item_inventory set source_type='supply' where source_type='tool' and external_key=?",(key,))
        conn.commit(); conn.executescript(sql)
        check(conn.execute("select count(*) from catalog_items where source_key=? and item_kind='tool'",(key,)).fetchone()[0]==0,'migration rerun recreated stale pre-review tool classification')
        check(conn.execute("select count(*) from site_item_inventory where external_key=? and source_type='tool'",(key,)).fetchone()[0]==0,'migration rerun recreated stale pre-review inventory classification')
except Exception as exc:
    failures.append(f'SQLite migration execution failed: {exc}')

if failures:
    print('Build 244 inventory authority/fractional usage regression: FAIL')
    for item in failures: print(' -',item)
    sys.exit(1)
print('Build 244 inventory authority/fractional usage regression: PASS')
print('Current-pass build detected:',current_build or 'embedded Build 244 segment')
print('Creative posting authority: inventory-post / Inventory-owned')
print('Public Tool/Supply authority: catalog publication registry + live Inventory metadata')
print('Legacy master rows:',len(tools)+len(supplies),f'({len(tools)} tools + {len(supplies)} supplies)')
print('D1 catalog and clean-schema inventory rows:',conn.execute('select count(*) from catalog_items').fetchone()[0])
print('TEMP/DROP migration operations: 0')
