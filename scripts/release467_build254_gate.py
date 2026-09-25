#!/usr/bin/env python3
from pathlib import Path
import json,sys,subprocess
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build254-operator-journey-friction-review.json')
prev=j('release467-build253-session-abuse-control-runtime-evidence.json')
p=j('current-development-authority.json')
runtime=t('public/js/admin-route-usage.js');review=t('public/js/admin-journey-friction-v254.js')
admin=t('admin/index.html');consolidation=t('public/js/admin-surface-consolidation-v239.js')
road=t('docs/operations/RELEASE_467_REFINEMENT_OUTCOMES_AUTONOMOUS_BUILDS_249_256.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
rel=t('functions/api/_lib/currentReliability.js');it=t('functions/api/admin/it-operations-control-tower.js')
preflight=t('functions/api/admin/current-deployment-preflight.js');guide=t('docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md')

q(a.get('build')==254 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 254 authority identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='42ad585550cbf76b39ab28d30ed345e177b8fb86','Build 253 exact Development SHA missing')
q(pred.get('development_tree_sha')=='deeca5e877175af1c7c804b09bfbb14a9daa7df8','Build 253 exact Development tree missing')
q(pred.get('production_main_sha')=='ec4e665c34af6e6fbc1dc440411b8b7795deaeb5','Build 253 exact Production main missing')
q(pred.get('production_tree_sha')=='deeca5e877175af1c7c804b09bfbb14a9daa7df8' and pred.get('same_tree') is True,'Build 253 tree continuity missing')
q(prev.get('build')==253,'Build 253 predecessor authority missing')

for token in ('routeEvidence','route_visits','transitions','sessionStorage','remote_recording:false','query_value_capture:false'):
    q(token in runtime,f'Build 249 retained local evidence contract missing {token}')
for token in ('REPEATED_TRANSITION_THRESHOLD=2','REPEATED_ROUTE_THRESHOLD=3','INSUFFICIENT_ROUTE_EVIDENCE',
              'NO_EVIDENCE_BACKED_FRICTION','EVIDENCE_BACKED_REVIEW_CANDIDATE','dead_end_claimed:false',
              'recovery_friction_claimed:false','automatic_navigation_change:false','remote_recording:false',
              'DDRefinementRuntimeV249?.routeEvidence'):
    q(token in review,f'Build 254 reviewer missing {token}')
q('build254JourneyReviewState' in admin and 'build254JourneyCandidate' in admin,'Build 254 must render inside existing runtime card')
q('/public/js/admin-journey-friction-v254.js?v=254' in admin,'Build 254 reviewer script missing from Admin home')
q('dedupeExactLinks' in consolidation and 'canonicalOwners' in consolidation,'Build 239 consolidation must remain active')
q('Build 255 — Production Reliability & Release Efficiency Review' in road,'Build 255 successor missing')
q("run_current_contract('scripts/release467_build254_gate.py','Release 467 Build 254')" in sysgate,'System Gate must invoke Build 254')
q(int(p.get('build') or 0)>=254 and int(p.get('next_build') or 0)>=255 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 254 or a verified successor')
q(int(p.get('build') or 0)>254 or (p.get('accepted_dev_sha')=='42ad585550cbf76b39ab28d30ed345e177b8fb86' and p.get('accepted_dev_tree_sha')=='deeca5e877175af1c7c804b09bfbb14a9daa7df8'),'Build 254 baseline must remain valid or be superseded by Build 255+')
q(int(p.get('build') or 0)>254 or (p.get('production_checkpoint') or {}).get('main_sha')=='ec4e665c34af6e6fbc1dc440411b8b7795deaeb5','Build 254 Production baseline must remain valid or be superseded by Build 255+')
for source,label in ((rel,'Reliability'),(it,'I.T. tower'),(preflight,'Preflight'),(guide,'I.T. guide')):
    q(('254' in source and 'Operator Journey Friction Review' in source) or ('255' in source and 'Production Reliability' in source) or ('256' in source and 'Refinement Outcomes Renewal II' in source) or ('257' in source and 'Workflow Trigger Inventory' in source) or ('258' in source and 'Historical Workflow Trigger Scope Tightening' in source),f'{label} must identify Build 254 or verified Build 255-258 successor')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 254 safety drift: {k}')

for path in ('public/js/admin-route-usage.js','public/js/admin-journey-friction-v254.js'):
    run=subprocess.run(['node','--check',path],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    q(run.returncode==0,f'JavaScript syntax failed {path}: {(run.stderr or run.stdout)[-1000:]}')

print('RELEASE 467 BUILD 254 OPERATOR JOURNEY FRICTION REVIEW')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Evidence policy: browser-local, pathname-only, thresholded, non-synthetic')
print('Navigation action: OBSERVE ONLY unless real local evidence identifies a review candidate')
print('Future queue: OPEN; next Build 255')
