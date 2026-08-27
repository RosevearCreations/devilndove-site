#!/usr/bin/env python3
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
TOOLS = (ROOT / 'functions/api/tools.js').read_text(encoding='utf-8')
SUPPLIES = (ROOT / 'functions/api/supplies.js').read_text(encoding='utf-8')
SYNC = (ROOT / 'functions/api/admin/catalog-sync.js').read_text(encoding='utf-8')
SCHEMA = (ROOT / 'database_full_schema.sql').read_text(encoding='utf-8')

checks = []
def check(label, condition):
    ok = bool(condition)
    checks.append(ok)
    print(('PASS' if ok else 'FAIL') + ' — ' + label)

print('BUILD 440 PUBLIC TOOL / SUPPLY INVENTORY AUTHORITY REGRESSION')
print('Remote access: NONE\n')

for label, source, kind in [('Tool', TOOLS, 'tool'), ('Supply', SUPPLIES, 'supply')]:
    check(f'{label} API uses catalog_items only as publication registry', 'FROM catalog_items ci' in source and 'LEFT JOIN site_item_inventory sii' in source)
    check(f'{label} API joins Inventory with normalized kind/key identity', "LOWER(TRIM(COALESCE(sii2.external_key,'')))=LOWER(TRIM(COALESCE(ci.source_key,'')))" in source and f"LOWER(TRIM(COALESCE(sii2.source_type,'')))='{kind}'" in source)
    check(f'{label} API lets live Inventory name/category/image override catalog metadata', "COALESCE(NULLIF(TRIM(sii.item_name),''),ci.name) AS name" in source and "COALESCE(NULLIF(TRIM(sii.category),''),ci.category) AS category" in source and "COALESCE(NULLIF(TRIM(sii.image_url),''),ci.image_url) AS image_url" in source)
    check(f'{label} API keeps publication visibility controlled by catalog row', 'COALESCE(ci.visible_public, 1) = 1' in source and "COALESCE(ci.status, 'active') = 'active'" in source)
    check(f'{label} JSON is emergency fallback only after failed D1 read', 'if (!d1ReadSucceeded)' in source and "authority = items.length ? 'json_fallback'" in source)

check('runtime Tool/Supply JSON re-import remains disabled', "tools: { target_table: 'catalog_items', item_kind: 'tool', migration_managed: true }" in SYNC and "supplies: { target_table: 'catalog_items', item_kind: 'supply', migration_managed: true }" in SYNC)

con = sqlite3.connect(':memory:')
con.executescript(SCHEMA)
con.execute("INSERT INTO catalog_items(item_kind,source_key,name,category,image_url,visible_public,status,sort_order) VALUES ('tool','TOOL-Key','Legacy Tool Name','legacy-tool','legacy-tool.png',1,'active',1)")
con.execute("INSERT INTO catalog_items(item_kind,source_key,name,category,image_url,visible_public,status,sort_order) VALUES ('supply','SUPPLY-Key','Legacy Supply Name','legacy-supply','legacy-supply.png',1,'active',1)")
con.execute("INSERT INTO catalog_items(item_kind,source_key,name,category,visible_public,status,sort_order) VALUES ('tool','catalog-only','Published Catalog Tool','publication',1,'active',2)")
con.execute("INSERT INTO site_item_inventory(source_type,external_key,item_name,category,image_url,on_hand_quantity,is_active) VALUES ('tool',' tool-key ','Live Tool Name','live-tool','live-tool.png',1,1)")
con.execute("INSERT INTO site_item_inventory(source_type,external_key,item_name,category,image_url,on_hand_quantity,is_active) VALUES ('supply',' supply-key ','Live Supply Name','live-supply','live-supply.png',1,1)")
con.execute("INSERT INTO site_item_inventory(source_type,external_key,item_name,category,on_hand_quantity,is_active) VALUES ('tool','inventory-only','Internal Inventory Tool','internal',1,1)")
con.commit()

PARAMS = ('', '%%', '%%', '%%', '%%', '%%', '%%', 100)
def extract_query(source):
    match = re.search(r"const result = await db\.prepare\(`(.*?)`\)\.bind\(query, like, like, like, like, like, like, limit\)\.all\(\);", source, re.S)
    return match.group(1) if match else ''

tool_sql = extract_query(TOOLS)
supply_sql = extract_query(SUPPLIES)
check('Tool public query is extractable for aggregate-schema execution', bool(tool_sql))
check('Supply public query is extractable for aggregate-schema execution', bool(supply_sql))

if tool_sql:
    cur = con.execute(tool_sql, PARAMS)
    cols = [d[0] for d in cur.description]
    tool_rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    by_key = {row['source_key']: row for row in tool_rows}
    check('case/whitespace variant Tool publication resolves to live Inventory metadata', by_key.get('TOOL-Key', {}).get('name') == 'Live Tool Name' and by_key.get('TOOL-Key', {}).get('category') == 'live-tool' and by_key.get('TOOL-Key', {}).get('image_url') == 'live-tool.png')
    check('catalog-only published Tool remains available as publication metadata', by_key.get('catalog-only', {}).get('name') == 'Published Catalog Tool')
    check('Inventory-only Tool is not accidentally exposed publicly', all(row.get('source_key') != 'inventory-only' for row in tool_rows))

if supply_sql:
    cur = con.execute(supply_sql, PARAMS)
    cols = [d[0] for d in cur.description]
    supply_rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    by_key = {row['source_key']: row for row in supply_rows}
    check('case/whitespace variant Supply publication resolves to live Inventory metadata', by_key.get('SUPPLY-Key', {}).get('name') == 'Live Supply Name' and by_key.get('SUPPLY-Key', {}).get('category') == 'live-supply' and by_key.get('SUPPLY-Key', {}).get('image_url') == 'live-supply.png')

check('aggregate schema foreign keys remain clean', con.execute('PRAGMA foreign_key_check').fetchall() == [])

passed = sum(checks)
print(f'\nBUILD 440 PUBLIC TOOL / SUPPLY INVENTORY AUTHORITY REGRESSION: {passed}/{len(checks)} passed')
raise SystemExit(0 if passed == len(checks) else 1)
