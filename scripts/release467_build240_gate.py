#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build240-api-read-budget-cache-batch-streamlining.json')
p=j('current-development-authority.json')
admin=t('admin/index.html')
budget=t('public/js/admin-read-budget-v240.js')
save=t('public/js/admin-save-confidence-v236.js')
surface=t('public/js/admin-surface-consolidation-v239.js')
road=t('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==240 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 240 authority identity/state mismatch')
if a.get('state')=='PRODUCTION_GREEN':
    q((a.get('final_closure') or {}).get('dev_sha')=='3fb60a9f3be8c40ca415ecd3cdcf7a44bff081d8','Build 240 successor closure must retain exact final dev SHA')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='a9efe9826c6ad7e400fa174f7cd6a8e6d980c452','Build 240 successor closure must retain exact Production main')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='f3594106fd74956e0aae524df7f75e53c84b9916','Build 240 must ingest exact Build 239 Development head')
q(pred.get('production_main_sha')=='ca2f822ac5811f55abb8385d7e548b61097f24e8','Build 240 must start from promoted Build 239 main')
proofs=pred.get('development_proofs') or {}
q(proofs.get('system_gate_run')==35862488377 and proofs.get('dedicated_gate_run')==35862488370,'Build 239 proof bundle missing')
for token in ('DDAdminReadBudgetV240','TTL_MS=60_000','TIMEOUT_MS=8_000','coalesced_reads','cache_hits','timed_out_reads'):
    q(token in budget,f'Build 240 read budget missing {token}')
for endpoint in ('/api/admin/contracts/operations-today-tasks-read?min_count=1','/api/admin/dashboard-summary?view=seller_daily'):
    q(endpoint in budget,f'Build 240 targeted startup endpoint missing {endpoint}')
q("method!=='GET'" in budget and 'new Response' in budget,'Build 240 cache must remain GET/read-only')
q('admin-read-budget-v240.js?v=467b240-admin-read-budget-v1' in admin,'Admin home must load Build 240 read budget')
q(admin.index('admin-read-budget-v240.js') < admin.index('admin-home-dashboard-v123.js') < admin.index('admin-seller-command-centre-build148.js'),'Build 240 read budget must load before dashboard/Seller clients')
q('const formObserver=new MutationObserver' in save and 'addedNodes' in save and "id==='ddSaveConfidenceV236'" in save,'Save Confidence added-node observer containment missing')
q('new MutationObserver(scan)' not in save,'Unbounded Build 236 scan/render observer must be removed')
q("window.addEventListener('dd:admin-module-hub-ready',run,{once:true})" in surface,'Build 239 dynamic consolidation hook must be one-shot')
q("a.hidden!==true" in surface and "ddRedundantEntry!=='1'" in surface,'Build 239 consolidation must avoid redundant DOM writes')
q('Build 241 — Cross-Authority Handoff Simplification' in road,'Build 241 successor missing')
q("run_current_contract('scripts/release467_build240_gate.py','Release 467 Build 240')" in sysgate,'System Gate must invoke Build 240')
q(int(p.get('build') or 0)>=239,'current authority regressed before Build 239')
for k in ('automatic_business_action','new_api_authority','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','schema_change'):
    q(a.get('safety',{}).get(k) is False,f'Build 240 safety drift: {k}')
print('RELEASE 467 BUILD 240 API READ BUDGET CACHE BATCH STREAMLINING')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
