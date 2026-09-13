#!/usr/bin/env python3
"""Release 467 Build 148 — Seller Daily Command Centre source gate."""
from pathlib import Path
import json,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(p): return (ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p): return json.loads(read(p))
closure=load('docs/operations/release467-build147-external-closure.json')
pointer=load('current-development-authority.json')
page=read('admin/index.html')
client=read('public/js/admin-seller-command-centre-build148.js')
today=read('functions/api/_lib/todayTasksReadService.js')
summary=read('functions/api/admin/dashboard-summary.js')
legacy=read('functions/api/admin/command-center.js')
prov=read('scripts/current_system_gate_provenance_gate.py')
manifest=load('migrations/canonical/manifest.json')
req(closure.get('state')=='PRODUCTION_GREEN','Build147 external closure must be Production GREEN')
req(closure.get('dev_sha')=='3fadc908df56ba194e2cd2f9e5480f6bfbedb796','Build147 SHA drifted')
req(closure.get('tree_sha')=='aeee53fdd3e01aee6b01a75e83f92f57b859960f','Build147 tree drifted')
for n in (34769839872,34769839865,34769839876,34769839871,34769929784,34769969149): req(str(n) in read('docs/operations/release467-build147-external-closure.json'),f'missing Build147 proof {n}')
req(pointer.get('build')==147 and pointer.get('next_build')==148,'current pointer must be converged to Build147 with Build148 next')
req(pointer.get('production_checkpoint',{}).get('state')=='PRODUCTION_GREEN','pointer Production baseline must be GREEN')
for token in ('sellerDailyCommandCentreMount','admin-seller-command-centre-build148.js?v=467b148','Release 467 Build 148','What needs attention'):
    req(token in page,f'Admin page missing Build148 token: {token}')
for token in ("BUILD=148","CACHE_KEY='dd:admin:seller-command-centre:b148:v1'","TODAY_URL='/api/admin/contracts/operations-today-tasks-read?min_count=1'","SUMMARY_URL='/api/admin/dashboard-summary?view=compact'","IT_URL='/api/admin/it-operations-control-tower'",'Cached / stale','Last successful refresh','Current inventory, order, financial and destructive actions require reconnection','This cockpit does not complete, snooze, ignore, post, publish or mutate work'):
    req(token in client,f'Build148 command centre missing {token}')
req("method:'POST'" not in client and 'method:"POST"' not in client,'Build148 command centre must remain read-only')
req('/api/admin/command-center' not in client,'Build148 must not use legacy Command Center endpoint')
req('request_time_schema_mutation' not in client,'Build148 client must not create schema authority')
req('request_time_schema_mutation: false' in read('functions/api/admin/today-tasks.js'),'Today Tasks read endpoint must remain non-mutating')
req('CREATE TABLE IF NOT EXISTS' in legacy,'legacy Command Center DDL provenance should remain detectable and intentionally unused')
req('compactSummary' in summary and 'onRequestGet' in summary,'scoped dashboard summary read authority missing')
files=[str(x.get('file')or'') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
req(files==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'canonical D1 migrations must remain 0001-0004')
req("run_current_contract('scripts/release467_build148_gate.py','Release 467 Build 148')" in prov,'active provenance must call Build148')
node=subprocess.run(['node','--check',str(ROOT/'public/js/admin-seller-command-centre-build148.js')],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
req(node.returncode==0,f'Build148 JavaScript syntax failed: {(node.stderr or node.stdout).strip()[-1200:]}')
if FAIL:
    print('RELEASE 467 BUILD 148 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 148 GATE: PASS')
print('Build 147 six-proof closure: INGESTED EXTERNALLY')
print('Seller Daily Command Centre: READ-ONLY / EXISTING AUTHORITIES / CACHE-STAMPED STALE FALLBACK')
print('Legacy Command Center request-time DDL: NOT USED')
print('Canonical D1: 0001-0004 / UNCHANGED')
