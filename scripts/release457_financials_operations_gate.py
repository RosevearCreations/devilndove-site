#!/usr/bin/env python3
"""Release 457 carried-forward gate for read-only Financials reconciliation, commerce-cost and reporting depth."""
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
for marker in ('Financial operations queue','/api/admin/accounting-reconciliation?type=','/api/admin/accounting-reconciliation-exceptions?period_month=','/api/admin/accounting-statement-imports?period_month=','/api/admin/accounting-profit-loss?month=','/api/admin/accounting-item-costing?month=','/api/admin/accounting-period-locks?limit=18','/api/admin/accounting-gifi-summary?year=','Promise.allSettled','uncosted_product_count','missing_cost_link_count','negative_margin_count','Write authority duplicated'):
 req(marker in js,f'Financial Operations runtime missing {marker}')
req("method:" not in js and "method :" not in js,'Release 457 Financial Operations must remain GET/read-only')
req('fetch(' not in js,'Financial Operations must use authenticated DDAuth read authority, not direct fetch')
req('<h1' not in js.lower(),'Financial Operations runtime must never create an H1')
for marker in ('@media(max-width:900px)','@media(max-width:640px)','min-height:44px','.accounting-ops-queue'):req(marker in css,f'Financial Operations responsive CSS missing {marker}')
req('/public/js/admin-accounting-operations.js?v=457' in html and '/css/admin-accounting-operations.css?v=457' in html,'Accounting page must retain Release 457 Financial Operations assets')
req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1 and 'noindex,nofollow' in html and 'data-admin-module="financials"' in html,'Accounting private/H1/module boundary drifted')
for path,marker in (('functions/api/_lib/accountingReconciliationReadService.js','read-only-accounting-reconciliation'),('functions/api/_lib/accountingProfitLossReadService.js','read-only-accounting-profit-loss'),('functions/api/_lib/accountingItemCostingReadService.js','read-only-accounting-item-costing')):req(marker in read(path),f'existing Accounting read authority drifted: {path}')
release=json.loads(read('development-release.json'));current=int(release.get('release') or 0);history={x.get('release'):x for x in release.get('release_history',[])}
req(current>=457,'current release cannot predate 457')
if current==457:req(release.get('label')=='Financials Reconciliation, Commerce Cost & Reporting Depth','Release 457 label drifted')
else:
 r=history.get(457,{});req(r.get('state')=='complete_source_proven_no_new_d1_migration','Release 457 completed history missing');req(r.get('focused_source_gate_run')==33264872362 and r.get('system_gate_run')==33264872366 and r.get('exact_head_sha')=='33f939c8b6daa733e8a54fa8ded15cde626978a0','Release 457 exact-head closure proof missing')
d1=release.get('development_infrastructure',{}).get('d1',{});req(d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa' and int(d1.get('schema_current_through_release') or 0)>=453,'Development D1 authority drifted')
req(release.get('release_policy',{}).get('production_promotion')=='closed','Production promotion must remain closed')
req(not list((ROOT/'migrations/dev').glob('*release457*')),'Release 457 migration file must not exist')
req(len(release.get('release457_batch',[]))==12 and all(x.get('status')=='implemented' for x in release.get('release457_batch',[])),'Release 457 batch history must remain complete')
workflow=read('.github/workflows/system-gate.yml');req('python scripts/release457_financials_operations_gate.py' in workflow,'System Gate must carry Release 457')
run('scripts/release448_financials_depth_gate.py')
print('RELEASE 457 FINANCIALS OPERATIONS: CARRIED FORWARD PASS')
print('Financial Operations projection: READ ONLY')
print('Exact-head closure proof: 33264872362 / 33264872366 / 33f939c8...')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
