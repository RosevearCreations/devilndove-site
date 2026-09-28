#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build284-caip-production-acceptance-closure-outcomes-renewal.json')
prev=j('release467-build283-planned-vs-actual-inventory-operator-acceptance.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_REAL_INVENTORY_LINKAGE_ACCEPTANCE_AUTONOMOUS_BUILDS_285_289.md')
doc=t('docs/operations/RELEASE_467_BUILD_284_CAIP_PRODUCTION_ACCEPTANCE_CLOSURE_OUTCOMES_RENEWAL.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==284 and a.get('title')=='CAIP Production Acceptance Closure & Outcomes Renewal','Build 284 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 284 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='046cf0bebea75de39aaf7a42fef0e0639581615a' and pred.get('development_tree_sha')=='2e0e404c7b62a0167155f6b1d563b34250748c32','Build 283 Development predecessor mismatch')
q(pred.get('production_main_sha')=='5bc70281e8ea2cb9818b14f216bef30f2d7d1463' and pred.get('production_tree_sha')=='2e0e404c7b62a0167155f6b1d563b34250748c32' and pred.get('same_tree') is True,'Build 283 Production predecessor mismatch')
dp=pred.get('development_proofs') or {};pp=pred.get('production_proofs') or {}
q(dp.get('system_gate_run')==36365773333 and dp.get('current_application_quality_run')==36365773581 and dp.get('it_admin_runtime_proof_run')==36365773340 and dp.get('branch_hygiene_run')==36365773372 and dp.get('dedicated_gate_run')==36365774362,'Build 283 Development proof mismatch')
q(pp.get('production_pages_deploy_run')==36366107169 and pp.get('production_live_resource_integrity_run')==36366163222 and pp.get('products_browser_proof_run')==36366163229 and pp.get('products_route_proof_run')==36366163225 and pp.get('build_specific_proof_run')==36366107020,'Build 283 Production proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 283 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='046cf0bebea75de39aaf7a42fef0e0639581615a' and (prev.get('final_closure') or {}).get('tree_sha')=='2e0e404c7b62a0167155f6b1d563b34250748c32','Build 283 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='5bc70281e8ea2cb9818b14f216bef30f2d7d1463' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='2e0e404c7b62a0167155f6b1d563b34250748c32','Build 283 Production checkpoint missing')
r=a.get('review') or {};pm=r.get('caip_private_media') or {};op=r.get('operator_acceptance') or {};res=r.get('residual') or {}
q(r.get('source_builds')==list(range(276,284)) and r.get('all_source_builds_production_green') is True and r.get('exact_tree_closure_preserved') is True,'Build 284 source closure review mismatch')
q(pm.get('lane_state')=='ACCEPTED' and pm.get('required_dimensions')==3 and pm.get('fresh_dimensions_satisfied')==3,'CAIP private-media lane must remain ACCEPTED 3/3')
q(pm.get('private_bucket_non_public_exposure') is True and pm.get('authenticated_range_streaming') is True and pm.get('multipart_interruption_resume') is True,'CAIP private-media accepted dimensions missing')
q(op.get('standalone_social_real_operator_evidence') is True and op.get('content_studio_bridge_real_operator_evidence') is True,'Build 281/282 real operator evidence missing')
q(op.get('build283_fixture_required') is True and op.get('build283_fixture_cleaned_up') is True and op.get('real_creative_process_inventory_linkage_observed') is False,'Build 283 residual measurement mismatch')
q(op.get('product_owned_stock_used') is False and op.get('finance_posting_observed') is False,'Build 283 safety outcome mismatch')
q(res.get('exists') is True and res.get('classification')=='REAL_CREATIVE_PROCESS_INVENTORY_LINKAGE_ADOPTION_EVIDENCE_GAP' and res.get('accepted_caip_private_media_reopened') is False,'Build 284 residual classification mismatch')
d=a.get('decision') or {}
q(d.get('autonomous_queue_exhausted') is False and d.get('action')=='CREATE_EVIDENCE_DRIVEN_SUCCESSOR_ROADMAP','Build 284 renewal decision mismatch')
q(d.get('next_build')==285 and d.get('next_build_title')=='Real Inventory Linkage Prerequisite Inventory','Build 285 successor missing')
for n in range(285,290):q(f'Build {n} —' in road,f'Successor roadmap missing Build {n}')
for token in ('3/3 fresh current-release dimensions','bounded temporary Development Supply fixture','not treated as proof of real operational adoption','Build 285'):q(token in doc,f'Build 284 document missing {token}')
q("run_current_contract('scripts/release467_build284_gate.py','Release 467 Build 284')" in sysgate,'System Gate missing Build 284')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=284,'Current authority must retain Build 284 or successor')
if cur==284:
    q(p.get('title')=='CAIP Production Acceptance Closure & Outcomes Renewal' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 284 pointer mismatch')
    q(p.get('accepted_dev_sha')=='046cf0bebea75de39aaf7a42fef0e0639581615a' and p.get('accepted_dev_tree_sha')=='2e0e404c7b62a0167155f6b1d563b34250748c32','Current Build 284 predecessor mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='5bc70281e8ea2cb9818b14f216bef30f2d7d1463' and (p.get('production_checkpoint') or {}).get('tree_sha')=='2e0e404c7b62a0167155f6b1d563b34250748c32','Current Build 284 Production baseline mismatch')
    q(int(p.get('next_build') or 0)==285 and p.get('next_build_title')=='Real Inventory Linkage Prerequisite Inventory','Current Build 284 successor pointer mismatch')
    q(p.get('roadmap')=='docs/operations/RELEASE_467_REAL_INVENTORY_LINKAGE_ACCEPTANCE_AUTONOMOUS_BUILDS_285_289.md','Current Build 284 roadmap mismatch')
for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 284 safety drift: {k}')
print('RELEASE 467 BUILD 284 CAIP PRODUCTION ACCEPTANCE CLOSURE & OUTCOMES RENEWAL')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('CAIP private-media: ACCEPTED 3/3 current-release dimensions')
print('Residual: real Creative Process ↔ Inventory linkage/adoption evidence remains open')
print('Decision: successor roadmap authorized; queue remains OPEN')
print('Next: Build 285 — Real Inventory Linkage Prerequisite Inventory')
