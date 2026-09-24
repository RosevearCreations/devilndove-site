#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build255-production-reliability-release-efficiency-review.json')
prev=j('release467-build254-operator-journey-friction-review.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_REFINEMENT_OUTCOMES_AUTONOMOUS_BUILDS_249_256.md')
review=t('docs/operations/RELEASE_467_BUILD_255_PRODUCTION_RELIABILITY_RELEASE_EFFICIENCY_REVIEW.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
rel=t('functions/api/_lib/currentReliability.js')
it=t('functions/api/admin/it-operations-control-tower.js')
preflight=t('functions/api/admin/current-deployment-preflight.js')
itpage=t('admin/it/index.html')
relpage=t('admin/reliability/index.html')
prepage=t('admin/deployment-preflight/index.html')
guide=t('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')

q(a.get('build')==255 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 255 authority identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='95ad971789a7f207c1bc64103e68cd28204a3e50','Build 254 exact Development SHA missing')
q(pred.get('development_tree_sha')=='7da896d6d154460950844b44bc179a8354b836f2','Build 254 exact Development tree missing')
q(pred.get('production_main_sha')=='46224bcfebbf12bec95383a03e188e00674d3326','Build 254 exact Production main missing')
q(pred.get('production_tree_sha')=='7da896d6d154460950844b44bc179a8354b836f2' and pred.get('same_tree') is True,'Build 254 exact-tree continuity missing')
q(prev.get('state')=='PRODUCTION_GREEN','Build 254 successor-ingested Production closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='95ad971789a7f207c1bc64103e68cd28204a3e50','Build 254 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='46224bcfebbf12bec95383a03e188e00674d3326','Build 254 Production checkpoint missing')

m=a.get('measurement') or {}
q(m.get('builds_reviewed')==13 and m.get('accepted_heads_reviewed')==26,'Build 255 review span mismatch')
q(m.get('total_workflow_runs')==1551,'Build 255 total workflow-run measurement mismatch')
q(m.get('successful_runs')==1519 and m.get('failed_runs')==19 and m.get('skipped_runs')==13,'Build 255 conclusion counts mismatch')
q(m.get('retried_run_attempts')==0,'Build 255 accepted-head rerun count mismatch')
q(m.get('accepted_dev_runs')==749 and m.get('accepted_main_runs')==802,'Build 255 lane run totals mismatch')
q((m.get('build254') or {}).get('dev_success')==70 and (m.get('build254') or {}).get('main_success')==64,'Build 254 clean closure measurement missing')
q((a.get('findings') or {}).get('exact_sha_promotion')=='PRESERVE','Build 255 must preserve exact-SHA promotion')
q((a.get('operator_diagnostics') or {}).get('new_parallel_dashboard') is False,'Build 255 must reuse existing diagnostics surfaces')

q(int(p.get('build') or 0)>=255 and int(p.get('next_build') or 0)>=256 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 255 or a verified successor')
q(int(p.get('build') or 0)>255 or (p.get('accepted_dev_sha')=='95ad971789a7f207c1bc64103e68cd28204a3e50' and p.get('accepted_dev_tree_sha')=='7da896d6d154460950844b44bc179a8354b836f2'),'Build 255 baseline must remain valid or be superseded by Build 256+')
q(int(p.get('build') or 0)>255 or (p.get('production_checkpoint') or {}).get('main_sha')=='46224bcfebbf12bec95383a03e188e00674d3326','Build 255 Production baseline must remain valid or be superseded by Build 256+')
q("run_current_contract('scripts/release467_build255_gate.py','Release 467 Build 255')" in sysgate,'System Gate must invoke Build 255')
q('Build 256 — Refinement Outcomes Renewal II' in road,'Build 256 successor missing from roadmap')
for token in ('1,551','1,519','19','13','70/70','64/64','exact-SHA'):
    q(token in review,f'Build 255 evidence document missing {token}')
for source,label in ((rel,'Reliability'),(it,'I.T. tower'),(preflight,'Preflight'),(itpage,'I.T. page'),(relpage,'Reliability page'),(prepage,'Preflight page'),(guide,'I.T. guide')):
    q(('255' in source and 'Production Reliability' in source) or ('256' in source and 'Refinement Outcomes Renewal II' in source),f'{label} must identify Build 255 or verified Build 256 successor')
for k,v in (a.get('safety') or {}).items():
    q(v is False,f'Build 255 safety drift: {k}')

print('RELEASE 467 BUILD 255 PRODUCTION RELIABILITY & RELEASE EFFICIENCY REVIEW')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Accepted-head run evidence: 1551 total / 1519 success / 19 failure / 13 skipped / 0 rerun attempts')
print('Promotion policy: exact-SHA and identical-tree requirements PRESERVED')
print('Future queue: OPEN; next Build 256')
