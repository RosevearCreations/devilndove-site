#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build276-caip-acceptance-evidence-freshness-baseline.json')
prev=j('release467-build275-caip-production-acceptance-outcomes-renewal.json')
p=j('current-development-authority.json')
doc=t('docs/operations/RELEASE_467_BUILD_276_CAIP_ACCEPTANCE_EVIDENCE_FRESHNESS_BASELINE.md')
road=t('docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md')
wf=t('.github/workflows/release467-build276-caip-acceptance-evidence-freshness-baseline.yml')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==276 and a.get('title')=='CAIP Acceptance Evidence Freshness Baseline','Build 276 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 276 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='2453c99e4c459d7d31b16bd2004fa4afca081054' and pred.get('development_tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Build 275 Development predecessor mismatch')
q(pred.get('production_main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587' and pred.get('production_tree_sha')=='521888446fa549701da7109d266e0b73f7b40816' and pred.get('same_tree') is True,'Build 275 Production predecessor mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36213517078,'Build 275 Development dedicated proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36213629171,'Build 275 Production dedicated proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 275 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='2453c99e4c459d7d31b16bd2004fa4afca081054' and (prev.get('final_closure') or {}).get('tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Build 275 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Build 275 Production checkpoint missing')
b=a.get('baseline') or {};dims=b.get('evidence_dimensions') or []
q(b.get('lane')=='caip_private_media' and b.get('current_lane_state')=='EVIDENCE_DEPENDENT','Build 276 CAIP lane state mismatch')
q(b.get('freshness_rule')=='FRESH_CURRENT_RELEASE_AUTHENTICATED_EVIDENCE_REQUIRED','Build 276 freshness rule mismatch')
q(len(dims)==3 and b.get('current_release_required_dimensions')==3 and b.get('current_release_fresh_dimensions_satisfied')==0,'Build 276 dimension count mismatch')
by={x.get('key'):x for x in dims}
q((by.get('authenticated_private_review_range_streaming') or {}).get('status')=='REFRESH_REQUIRED','Fresh range evidence must remain required')
q((by.get('authenticated_private_review_range_streaming') or {}).get('timestamp_state')=='NOT_RECORDED_IN_CARRY_FORWARD_AUTHORITY','Historical timestamp gap must remain explicit')
q((by.get('deployed_private_bucket_binding_non_public_exposure') or {}).get('status')=='DEPLOYED_OPERATOR_EVIDENCE_REQUIRED','Private bucket deployed evidence must remain required')
q((by.get('multipart_interruption_reconnect_reselection_resume') or {}).get('status')=='LIVE_DRILL_EVIDENCE_REQUIRED','Interruption/resume live drill must remain required')
q(b.get('current_release_acceptance_complete') is False and b.get('synthetic_acceptance') is False,'Synthetic/current acceptance must remain false')
q((a.get('decision') or {}).get('next_build')==277 and (a.get('decision') or {}).get('future_queue_exhausted') is False,'Build 277 successor missing')
for token in ('Build 276 — CAIP Acceptance Evidence Freshness Baseline','Build 277 — Private Bucket Binding & Non-Public Exposure Evidence'): q(token in road,f'Roadmap missing {token}')
for token in ('0/3','REFRESH_REQUIRED','DEPLOYED_OPERATOR_EVIDENCE_REQUIRED','LIVE_DRILL_EVIDENCE_REQUIRED','bucket presence alone is not acceptance','Build 277'): q(token in doc,f'Build 276 document missing {token}')
q('development_sha: 2453c99e4c459d7d31b16bd2004fa4afca081054' in wf and 'production_sha: 86112270a5b0eb4bdbae4ffd418e34ecfd7b7587' in wf,'Build 276 workflow predecessor drift')
q("run_current_contract('scripts/release467_build276_gate.py','Release 467 Build 276')" in sysgate,'System Gate missing Build 276')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=276,'Current authority must retain Build 276 or successor')
if cur==276:
    q(p.get('title')=='CAIP Acceptance Evidence Freshness Baseline' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 276 pointer mismatch')
    q(p.get('accepted_dev_sha')=='2453c99e4c459d7d31b16bd2004fa4afca081054' and p.get('accepted_dev_tree_sha')=='521888446fa549701da7109d266e0b73f7b40816','Current Build 276 accepted predecessor mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587','Current Build 276 Production predecessor mismatch')
    q(int(p.get('next_build') or 0)==277 and p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md','Current Build 276 roadmap pointer mismatch')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 276 successor-ingested authority must be Production GREEN')
    q((a.get('final_closure') or {}).get('dev_sha')=='073ee3cacb7e7b7cac70e0e23db9ebebf386099f' and (a.get('final_closure') or {}).get('tree_sha')=='baed3242d5757a83832ab8526f940c971983bd73','Build 276 final Development closure mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='1bfcb248a8baf8cea42467a75c0dac53884ec5c3' and (a.get('production_checkpoint') or {}).get('tree_sha')=='baed3242d5757a83832ab8526f940c971983bd73','Build 276 final Production closure mismatch')
    if cur==277:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='1bfcb248a8baf8cea42467a75c0dac53884ec5c3','Build 277 current Production baseline must be exact Build 276')
        q(int(p.get('next_build') or 0)>=278,'Build 277 must advance beyond Build 277 successor')
    else:
        q((cur==278 and (p.get('production_checkpoint') or {}).get('main_sha')=='552fe0fb1b192c7fd123c9a7369eea9f352f639e') or (cur>=279 and (p.get('production_checkpoint') or {}).get('main_sha')=='5d418eb1160caa7af855a247e1ff3510e4c1c9b8'),'Build 278+ current Production baseline must track the exact immediate verified predecessor')
        q(int(p.get('next_build') or 0)>=279,'Build 278+ must advance beyond Build 278 successor')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 276 safety drift: {k}')
print('RELEASE 467 BUILD 276 CAIP ACCEPTANCE EVIDENCE FRESHNESS BASELINE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Current Release 467 fresh CAIP acceptance dimensions: 0/3')
print('CAIP private-media: EVIDENCE_DEPENDENT / historical and source proof remain non-current')
print('Next: Build 277 — Private Bucket Binding & Non-Public Exposure Evidence')
