#!/usr/bin/env python3
from pathlib import Path
import sqlite3, tempfile, re
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def ok(name, cond):
    checks.append((name,bool(cond)))
    print(('PASS' if cond else 'FAIL')+': '+name)

mig=(ROOT/'database_build249_inventory_kits_components_provenance.sql').read_text()
ui=(ROOT/'public/js/admin-inventory-kits.js').read_text()
api=(ROOT/'functions/api/admin/inventory-kits.js').read_text()
inv=(ROOT/'public/js/admin-site-item-inventory.js').read_text()
html=(ROOT/'admin/inventory-operations/index.html').read_text()
pack=(ROOT/'public/js/admin-packaging-studio.js').read_text()

for table in ['inventory_item_profiles','inventory_kit_templates','inventory_kit_template_components','inventory_kit_open_events','inventory_kit_open_components','inventory_source_material_links']:
    ok('migration creates '+table, f'CREATE TABLE IF NOT EXISTS {table}' in mig)
ok('kit open event has unique provenance key', 'open_key TEXT NOT NULL UNIQUE' in mig)
ok('kit UI is mounted', 'admin-inventory-kits.js?v=249' in html)
ok('kit UI exposes breakdown action', 'Open / Break Down Kit' in ui)
ok('kit UI supports equal or percentage allocation help', 'equal split' in ui and 'totaling 100%' in ui)
ok('kit API supports template save', "action==='save_template'" in api)
ok('kit API supports opening kits', "action==='open_kit'" in api)
ok('kit API decrements parent kit', 'on_hand_quantity=on_hand_quantity-?' in api)
ok('kit API increments child inventory', 'newQty=oldQty+addQty' in api)
ok('kit API weighted-average costs existing child stock', '((oldQty*oldCost)+allocated)/newQty' in api)
ok('kit API preserves reusable tracking', "'reusable'" in api and 'site_inventory_usage_profiles' in api)
ok('main inventory exposes inventory class', 'siteInventoryClass' in inv)
ok('main inventory exposes lifecycle', 'siteInventoryLifecycleMode' in inv)
ok('main inventory exposes lot/expiry/source-material flags', all(x in inv for x in ['siteInventoryLotRecommended','siteInventoryExpiryRecommended','siteInventorySourceMaterialRecommended']))
ok('essential oil wording explains premixed blend', 'premixed essential-oil blend' in pack)
ok('delete audit no longer references undefined merged variable in delete block', 'target_key: `${merged.source_type}:${existing.external_key}`' not in api)
ok('current migration matches standalone', (ROOT/'database_upgrade_current_pass.sql').read_bytes()==(ROOT/'database_build249_inventory_kits_components_provenance.sql').read_bytes())

with tempfile.NamedTemporaryFile(suffix='.db') as tmp:
    db=sqlite3.connect(tmp.name)
    db.executescript((ROOT/'database_full_schema.sql').read_text())
    db.executescript(mig)
    db.executescript(mig)
    ok('migration is idempotent after aggregate schema', True)
    ok('foreign key check clean', db.execute('PRAGMA foreign_key_check').fetchall()==[])
    cnt=db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name LIKE 'inventory_kit_%'").fetchone()[0]
    ok('kit schema table count present', cnt>=4)

fails=[n for n,v in checks if not v]
print(f'\nBuild 249 inventory-kit regression: {len(checks)-len(fails)}/{len(checks)} passed')
if fails:
    print('Failures:')
    for f in fails: print(' - '+f)
    raise SystemExit(1)
