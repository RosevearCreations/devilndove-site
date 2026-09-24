#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build256-refinement-outcomes-renewal-ii.json')
prev=j('release467-build255-production-reliability-release-efficiency-review.json')
p=j('current-development-authority.json')
oldroad=t('docs/operations/RELEASE_467_REFINEMENT_OUTCOMES_AUTONOMOUS_BUILDS_249_256.md')
road=t('docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md')
review=t('docs/operations/RELEASE_467_BUILD_256_REFINEMENT_OUTCOMES_RENEWAL_II.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
rel=t('functions/api/_lib/currentReliability.js')
it=t('functions/api/admin/it-operations-control-tower.js')
preflight=t('functions/api/admin/current-deployment-preflight.js')
itpage=t('admin/it/index.html')
relpage=t('admin/reliability/index.html')
prepage=t('admin/deployment-preflight/index.html')
guide=t('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')

q(a.get('build')==256 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 256 authority identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='6d8d006cad521f2ca9fb83b2d7a1ec62ad9347fb','Build 255 exact Development SHA missing')
q(pred.get('development_tree_sha')=='7a6eaaeecdbc7b2bf5f8b015d8186f9ac8d8d398','Build 255 exact Development tree missing')
q(pred.get('production_main_sha')=='c5ef57106fe84b386230d686b46d11ea30c35576','Build 255 exact Production main missing')
q(pred.get('production_tree_sha')=='7a6eaaeecdbc7b2bf5f8b015d8186f9ac8d8d398' and pred.get('same_tree') is True,'Build 255 exact-tree continuity missing')
q(prev.get('state')=='PRODUCTION_GREEN','Build 255 successor-ingested Production closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='6d8d006cad521f2ca9fb83b2d7a1ec62ad9347fb','Build 255 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='c5ef57106fe84b386230d686b46d11ea30c35576','Build 255 Production checkpoint missing')

m=a.get('remeasurement') or {}
q(m.get('source_builds')==[249,250,251,252,253,254,255],'Build 256 source build span mismatch')
q(m.get('all_source_builds_production_green') is True and m.get('exact_tree_closure_preserved') is True,'Build 256 closure continuity result missing')
q(m.get('accepted_heads_reviewed')==14 and m.get('accepted_head_workflow_runs')==870,'Build 256 accepted-head measurement mismatch')
q(m.get('successful_runs')==863 and m.get('failed_runs')==7 and m.get('skipped_runs')==0 and m.get('rerun_attempts')==0,'Build 256 workflow conclusion measurement mismatch')
b250=(m.get('outcomes') or {}).get('build250') or {}
q(b250.get('aggregate_rows_read')==2178 and b250.get('ceiling')==25000 and b250.get('select_statement_fanout')==13,'Build 250 read residual missing')
b254=(m.get('outcomes') or {}).get('build254') or {}
q(b254.get('route_specific_remediation')=='NOT_JUSTIFIED_WITHOUT_REAL_SESSION_EVIDENCE','Build 254 no-synthetic-friction result missing')
b255=(m.get('outcomes') or {}).get('build255') or {}
q(b255.get('proof_fanout')=='HIGH' and b255.get('exact_sha_promotion')=='PRESERVE','Build 255 measured residual missing')

d=a.get('decision') or {}
q(d.get('autonomous_queue_exhausted') is False and d.get('action')=='CREATE_EVIDENCE_DRIVEN_SUCCESSOR_ROADMAP','Build 256 renewal decision mismatch')
q(d.get('next_build')==257 and d.get('next_build_title')=='Workflow Trigger Inventory & Ownership Map','Build 257 successor decision missing')
q('Build 256 — Refinement Outcomes Renewal II' in oldroad,'Build 256 authorization missing from predecessor roadmap')
for n in range(257,265): q(f'Build {n} —' in road,f'Successor roadmap missing Build {n}')
for token in ('870','863','7 failed','2,178','25,000','13 SELECT','Build 257'):
    q(token in review,f'Build 256 renewal document missing {token}')

q(int(p.get('build') or 0)==256 and int(p.get('next_build') or 0)==257 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 256 and successor 257')
q(p.get('accepted_dev_sha')=='6d8d006cad521f2ca9fb83b2d7a1ec62ad9347fb' and p.get('accepted_dev_tree_sha')=='7a6eaaeecdbc7b2bf5f8b015d8186f9ac8d8d398','Build 256 must start from exact Build 255 Development')
q((p.get('production_checkpoint') or {}).get('main_sha')=='c5ef57106fe84b386230d686b46d11ea30c35576','Build 256 Production baseline must be Build 255')
q("run_current_contract('scripts/release467_build256_gate.py','Release 467 Build 256')" in sysgate,'System Gate must invoke Build 256')
for source,label in ((rel,'Reliability'),(it,'I.T. tower'),(preflight,'Preflight'),(itpage,'I.T. page'),(relpage,'Reliability page'),(prepage,'Preflight page'),(guide,'I.T. guide')):
    q('256' in source and 'Refinement Outcomes Renewal II' in source,f'{label} must identify Build 256 renewal')
for k,v in (a.get('safety') or {}).items():
    q(v is False,f'Build 256 safety drift: {k}')

print('RELEASE 467 BUILD 256 REFINEMENT OUTCOMES RENEWAL II')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Builds 249-255: Production GREEN / exact-tree continuity retained')
print('Accepted-head remeasurement: 870 total / 863 success / 7 failure / 0 skipped / 0 rerun attempts')
print('Decision: successor roadmap authorized; queue remains OPEN')
print('Next: Build 257 — Workflow Trigger Inventory & Ownership Map')
