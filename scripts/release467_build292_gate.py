#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build292-client-runtime-observer-memory-churn-hardening.json');p=j('current-development-authority.json')
q(a.get('release')==467 and a.get('build')==292 and a.get('title')=='Client Runtime Observer & Memory-Churn Hardening','Build 292 identity mismatch')
q((a.get('safety') or {}).get('schema_change') is False and (a.get('safety') or {}).get('d1_mutation') is False,'Build 292 must remain schema/D1 mutation neutral')
budget=subprocess.run([sys.executable,str(R/'scripts/release467_build292_observer_budget.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(budget.stdout,end='');print(budget.stderr,end='',file=sys.stderr);q(budget.returncode==0,'Build 292 observer budget failed')
middleware=t('functions/_middleware.js')
for token in ("LAYOUT_ASSET_REVISION = '467b292-observer-budget-v1'","ADMIN_ERGONOMICS_REVISION = '467b292-observer-budget-v1'","STOREFRONT_DISCOVERY_REVISION = '467b292-observer-budget-v1'","public-heading-guard.js?v=467b292-observer-budget-v1"):
    q(token in middleware,'Build 292 middleware cache identity missing '+token)
compat=t('public/js/admin-packaging-compatibility-v301.js')
for token in ('admin-packaging-material-intelligence-v42.js?v=467b292','admin-packaging-label-composition-v43.js?v=467b292','admin-packaging-release-workflow-v83.js?v=467b292'):
    q(token in compat,'Build 292 Packaging cache identity missing '+token)
q('/public/js/admin-site-item-inventory-multistation.js?v=292.1' in t('admin/inventory-operations/index.html'),'Inventory Build 292 helper cache identity missing')
products=t('public/js/admin-products-browser-v162.js')
for forbidden in ('setInterval(','setTimeout(','MutationObserver'):
    q(forbidden not in products,'Current lean Product Browser gained automatic background behavior: '+forbidden)
q('no Packaging editor MutationObserver runs continuously' in t('admin/packaging-studio/index.html'),'Packaging bounded-startup contract drifted')
q('Build 293 — CSS Design-System & Responsive Consolidation' in t('docs/operations/RELEASE_467_UX_SEARCH_DATABASE_EFFICIENCY_BUILDS_290_300.md'),'Build 292 successor roadmap drift')
q("run_current_contract('scripts/release467_build292_gate.py','Release 467 Build 292')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 292')
q(int(p.get('build') or 0)>=292,'Current authority must retain Build 292 or successor')
if int(p.get('build') or 0)==292:
    q(p.get('title')=='Client Runtime Observer & Memory-Churn Hardening' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 292 pointer mismatch')
    q(int(p.get('next_build') or 0)==293 and p.get('next_build_title')=='CSS Design-System & Responsive Consolidation','Build 292 successor pointer mismatch')
for path in ('public/js/public-heading-guard.js','public/js/layout-overflow-guard.js','public/js/storefront-discovery-runtime.js','public/js/admin-ergonomics-v237.js','public/js/admin-workspace-state.js','public/js/admin-products-enhancements.js','public/js/admin-packaging-label-composition-v43.js','public/js/admin-packaging-material-intelligence-v42.js','public/js/admin-packaging-print-source-v299.js','public/js/admin-packaging-release-workflow-v83.js','public/js/admin-site-item-inventory-multistation.js','public/js/admin-packaging-compatibility-v301.js','functions/_middleware.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout))
print('RELEASE 467 BUILD 292 CLIENT RUNTIME OBSERVER & MEMORY-CHURN HARDENING')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Hot-path observer work: BOUNDED / FILTERED / LIFECYCLE-CLEAN');print('Schema/D1/R2/provider mutation: NONE');print('Next: Build 293 — CSS Design-System & Responsive Consolidation')
