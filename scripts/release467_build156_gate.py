#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess
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

budget=read('public/js/admin-products-request-budget-v156.js')
for token in (
 "VERSION = 'R467B156_REQUEST_BUDGET_V2'",
 "MAX_CONCURRENT_GETS = 2",
 "MAX_NONCORE_GETS = 1",
 'reserved_core_slots: 1',
 'active_core_gets',
 'active_noncore_gets',
 'nextRunnableJobIndex()',
 "job.priority === 0",
 'DDProductsRequestBudgetHealth',
 'sharedRequests = new Map()',
 'canonical_readiness_requests',
 "url.pathname === '/api/admin/product-readiness'",
 "url.searchParams.set('limit', '500')",
 "url.searchParams.set('show_ready', '1')",
 '__ddProductsRequestBudget',
 "method !== 'GET'",
):
 req(token in budget,f'Product request budget missing {token}')
req('setInterval(' not in budget,'Product request budget must not add recurring polling')
req("url.pathname.startsWith('/api/admin/')" in budget,'Product request budget must stay inside authenticated admin GET scope')
req("path === '/api/admin/products' || path === '/api/admin/product-picker' || path === '/api/admin/product-mobile-bootstrap'" in budget,'Core Product bootstrap family must retain priority zero')

middleware=read('functions/_middleware.js')
request_loader='/public/js/admin-products-request-budget-v156.js?v=${PRODUCTS_REQUEST_BUDGET_REVISION}'
cold_loader='/public/js/admin-products-cold-start-recovery.js?v=${PRODUCTS_ASSET_REVISION}'
req("const PRODUCTS_REQUEST_BUDGET_REVISION = '467b156-request-budget-v2';" in middleware,'Product request budget cache revision missing')
req(request_loader in middleware,'Product request budget fast-path loader missing')
req(cold_loader in middleware,'Existing Product cold-start guard must remain loaded')
req(middleware.find(request_loader) < middleware.find(cold_loader),'Product request budget must load before the older cold-start controller')
req("const PRODUCTS_ASSET_REVISION = '467-b155-products-lockup-recovery-v2';" in middleware,'Build 155 historical Product asset identity must remain preserved')

for path in ('public/js/admin-products-request-budget-v156.js','public/js/admin-inventory-process-assignments-v156.js','functions/_middleware.js'):
 result=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,capture_output=True,text=True)
 req(result.returncode==0,f'JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()}')

print('RELEASE 467 BUILD 156 — TOOL & SUPPLY PROCESS ASSIGNMENT + PRODUCT REQUEST BUDGET')
if FAIL:
 print('FAIL');[print(f'{i:03d}. {x}') for i,x in enumerate(FAIL,1)];raise SystemExit(1)
print('PASS')
print('Product Admin: max two concurrent authenticated admin GETs; duplicate startup reads are shared')
print('Product bootstrap: one request lane remains available for Product list/picker/bootstrap while non-core reads serialize')
print('Product readiness: list startup variants converge on one 500-row superset request')
print('Boundary: non-GET mutation behavior is unchanged')
