#!/usr/bin/env python3
"""Release 457 source gate for read-only Financials reconciliation, commerce-cost and reporting depth."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def run(path):
 p=subprocess.run([sys.executable,str(ROOT/path)],capture_output=True,text=True)
 req(p.returncode==0,f'carried-forward gate failed: {path}\n{p.stdout}\n{p.stderr}')

JS='public/js/admin-accounting-operations.js';CSS='css/admin-accounting-operations.css';HTML='admin/accounting/index.html'
for p in (JS,CSS,HTML):req((ROOT/p).exists(),f'Release 457 Financials asset missing: {p}')
js,css,html=map(read,(JS,CSS,HTML))
for marker in (
 'Financial operations queue',
 '/api/admin/accounting-reconciliation?type=',
 '/api/admin/accounting-reconciliation-exceptions?period_month=',
 '/api/admin/accounting-statement-imports?period_month=',
 '/api/admin/accounting-profit-loss?month=',
 '/api/admin/accounting-item-costing?month=',
 '/api/admin/accounting-period-locks?limit=18',
 '/api/admin/accounting-gifi-summary?year=',
 'Promise.allSettled',
 'uncosted_product_count',
 'missing_cost_link_count',
 'negative_margin_count',
 'Write authority duplicated',
):
 req(marker in js,f'Financial Operations runtime missing {marker}')
req("method:" not in js and "method :" not in js,'Release 457 Financial Operations must remain GET/read-only')
req('fetch(' not in js,'Financial Operations must use authenticated DDAuth read authority, not direct fetch')
req('<h1' not in js.lower(),'Financial Operations runtime must never create an H1')
for marker in ('@media(max-width:900px)','@media(max-width:640px)','min-height:44px','.accounting-ops-queue'):
 req(marker in css,f'Financial Operations responsive CSS missing {marker}')
req('/public/js/admin-accounting-operations.js?v=457' in html,'Accounting page must load Release 457 Financial Operations runtime')
req('/css/admin-accounting-operations.css?v=457' in html,'Accounting page must load Release 457 Financial Operations CSS')
req('id="accountingOperationsMount"' in html and 'href="#financial-operations"' in html,'Accounting page must expose Financial Operations workspace and direct action')
req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,'Accounting admin page must retain exactly one H1')
req('noindex,nofollow' in html,'Accounting admin page must remain private/noindex')
req('data-admin-module="financials"' in html,'Accounting page must remain Financials-module owned')
req('data-admin-workspace-status' in html,'Accounting page must preserve shared workspace status surface')

for path,marker in (
 ('functions/api/_lib/accountingReconciliationReadService.js','read-only-accounting-reconciliation'),
 ('functions/api/_lib/accountingProfitLossReadService.js','read-only-accounting-profit-loss'),
 ('functions/api/_lib/accountingItemCostingReadService.js','read-only-accounting-item-costing'),
):
 req(marker in read(path),f'existing Accounting read authority drifted: {path}')
req('accounting_reconciliation_reviews' in read('functions/api/admin/accounting-reconciliation.js'),'existing reconciliation review authority must remain canonical')
req('accounting_reconciliation_exceptions' in read('functions/api/admin/accounting-reconciliation-exceptions.js'),'existing reconciliation exception authority must remain canonical')

release=json.loads(read('development-release.json'))
req(release.get('environment')=='development' and release.get('branch')=='dev' and release.get('pages_project')=='devilndove-site-dev','Release 457 must remain Development/dev')
req(release.get('release')==457 and release.get('label')=='Financials Reconciliation, Commerce Cost & Reporting Depth','current release metadata must be 457')
req(release.get('current_release_migrations')==[],'Release 457 must not introduce a D1 migration')
d1=release.get('development_infrastructure',{}).get('d1',{})
req(d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','Development D1 identity drifted')
req(d1.get('schema_current_through_release')==453,'Release 457 must carry verified D1 schema Release 453 forward unchanged')
db=release.get('current_release_database_state',{})
req(db.get('new_migration_required') is False and db.get('last_verified_schema_release')==453 and db.get('historical_migration_replay') is False,'Release 457 D1 state must remain source-only / verified through 453')
history={x.get('release'):x for x in release.get('release_history',[])}
r456=history.get(456,{})
req(r456.get('state')=='complete_source_proven_no_new_d1_migration' and r456.get('focused_source_gate_run')==33263530207 and r456.get('system_gate_run')==33263530221,'Release 456 exact-head proof must be carried forward')
r453=history.get(453,{})
req(r453.get('mutation_workflow_run')==33258377328 and r453.get('verification_workflow_run')==33258415391,'Release 453 D1 evidence drifted')
policy=release.get('release_policy',{})
req(policy.get('production_promotion')=='closed' and policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','Production/provider boundaries must remain closed')
req(policy.get('current_release_d1_migration_required') is False,'Release 457 source-only policy drifted')
req(not list((ROOT/'migrations/dev').glob('*release457*')),'Release 457 migration file must not exist')
batch=release.get('release457_batch',[])
req(len(batch)==12 and all(x.get('status')=='implemented' for x in batch),'Release 457 batch must be complete in metadata')
authority=read('functions/api/_lib/releaseAuthority.js')
req('CURRENT_RELEASE = 457' in authority and 'Financials Reconciliation, Commerce Cost & Reporting Depth' in authority,'shared runtime release authority must be 457')
workflow=read('.github/workflows/system-gate.yml')
req('python scripts/release457_financials_operations_gate.py' in workflow,'System Gate must validate Release 457')
req('python scripts/release456_inventory_tool_workflow_gate.py' in workflow and 'python scripts/release455_storefront_discovery_gate.py' in workflow and 'python scripts/release454_admin_convergence_gate.py' in workflow and 'python scripts/release453_it_provider_readiness_gate.py' in workflow,'System Gate must carry Release 456/455/454/453 forward')
req('node --check public/js/admin-accounting-operations.js' in workflow,'System Gate must syntax-check Release 457 runtime')

run('scripts/release456_inventory_tool_workflow_gate.py')
run('scripts/release448_financials_depth_gate.py')
print('RELEASE 457 FINANCIALS OPERATIONS GATE')
print('Financial Operations projection: READ ONLY')
print('Reconciliation/import/costing/close write authorities duplicated: NO')
print('Development D1 migration: NONE')
print('Development D1 schema: CARRIED FORWARD / VERIFIED THROUGH RELEASE 453')
print('Release 456 exact-head proof: 33263530207 / 33263530221')
print('Separate live Production/provider execution: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('RELEASE 457 FINANCIALS OPERATIONS GATE: PASS')
