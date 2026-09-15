#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return ''
 return f.read_text(encoding='utf-8',errors='replace')
def req(v,m):
 if not v:FAIL.append(m)
manifest=json.loads(read('migrations/canonical/manifest.json') or '{}')
files=[x.get('file') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
expected=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql']
req(files==expected,'Build 156 canonical migration stream must be exactly 0001-0005')
m=read('migrations/canonical/0005_release467_inventory_process_assignment.sql')
for token in ('inventory_processes','inventory_process_assignments','laser-engraving','3d-printing','FOREIGN KEY(site_item_inventory_id)','UNIQUE'):
 req(token in m,f'migration missing {token}')
req('DROP TABLE' not in m.upper(),'Build 156 migration must be additive')
api=read('functions/api/admin/inventory-process-assignments.js')
for token in ('getAdminUserFromRequest','site_item_inventory','inventory_process_assignments',"IN ('tool','supply')","action!=='assign'","action==='clear'","action==='create_process'",'auditAdminAction'):
 req(token in api,f'process API missing {token}')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE'):
 req(forbidden not in api.upper(),f'process API contains request-time DDL: {forbidden}')
ui=read('public/js/admin-inventory-process-assignments-v156.js')
for token in ('inventoryProcessAssignmentsMount','/api/admin/inventory-process-assignments','Tools + supplies','Tools only','Supplies only','Add a custom process'):
 req(token in ui,f'process UI missing {token}')
page=read('admin/inventory-operations/index.html')
req('id="inventoryProcessAssignmentsMount"' in page,'Inventory Operations missing process mount')
req('/public/js/admin-inventory-process-assignments-v156.js?v=467b156' in page,'Inventory Operations missing cache-busted Build 156 client')
req(page.lower().count('<h1')==1,'Inventory Operations must retain exactly one H1')
print('RELEASE 467 BUILD 156 — TOOL & SUPPLY PROCESS ASSIGNMENT')
if FAIL:
 print('FAIL');[print(f'{i:03d}. {x}') for i,x in enumerate(FAIL,1)];raise SystemExit(1)
print('PASS')
