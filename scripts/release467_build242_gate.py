#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build242-release-diagnostics-evidence-streamlining.json')
p=j('current-development-authority.json')
prev=j('release467-build241-cross-authority-handoff-simplification.json')
js=t('public/js/admin-release-evidence-v242.js')
mw=t('functions/_middleware.js')
it=t('admin/it/index.html');pre=t('admin/deployment-preflight/index.html');rel=t('admin/reliability/index.html')
road=t('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==242 and a.get('state')=='DEVELOPMENT_CANDIDATE','Build 242 authority identity/state mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 241 predecessor must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='82688fbe6a74e235b85b56bc21f82380131bb3bc','Build 241 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='87778556ac99c1e82217c4d2d45ead5bf1ef1b88','Build 241 production checkpoint missing')
q(p.get('build')==242 and p.get('next_build')==243 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 242 candidate and Build 243 successor')
for token in ('DDReleaseEvidenceV242','Verified evidence — immutable','Current action','82688fbe6a74e235b85b56bc21f82380131bb3bc','b9d600e5eed18fe6697f42cf1588717437d4f725','87778556ac99c1e82217c4d2d45ead5bf1ef1b88','35880685343','35881116063'):
    q(token in js,f'Build 242 shared evidence client missing {token}')
q("ADMIN_RELEASE_EVIDENCE_REVISION = '467b242-release-evidence-streamlining-v1'" in mw and 'admin-release-evidence-v242.js' in mw,'Build 242 shared bootstrap missing')
for name,src in [('I.T.',it),('Deployment Preflight',pre),('Reliability',rel)]:
    q('data-dd-release-evidence-v242' in src,f'{name} must use shared Build 242 evidence mount')
q('Build 243 — Session Architecture Hardening' in road,'Build 243 successor missing')
q("run_current_contract('scripts/release467_build242_gate.py','Release 467 Build 242')" in sysgate,'System Gate must invoke Build 242')
for k in ('automatic_business_action','new_api_authority','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','schema_change','historical_proof_rewrite'):
    q(a.get('safety',{}).get(k) is False,f'Build 242 safety drift: {k}')
print('RELEASE 467 BUILD 242 RELEASE DIAGNOSTICS EVIDENCE STREAMLINING')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
