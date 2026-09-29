#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build288-real-planned-vs-actual-inventory-acceptance.json')
prev=j('release467-build287-real-existing-resource-link-evidence-capture.json')
p=j('current-development-authority.json')
road=t('docs/operations/RELEASE_467_REAL_INVENTORY_LINKAGE_ACCEPTANCE_AUTONOMOUS_BUILDS_285_289.md')
doc=t('docs/operations/RELEASE_467_BUILD_288_REAL_PLANNED_VS_ACTUAL_INVENTORY_ACCEPTANCE.md')
wf=t('.github/workflows/release467-build288-real-planned-vs-actual-inventory-acceptance.yml')
runtime=t('scripts/release467_build288_operator_acceptance.py')
css=t('css/styles.css');ui=t('public/js/admin-site-item-inventory.js');sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('release')==467 and a.get('build')==288 and a.get('title')=='Real Planned-vs-Actual Inventory Acceptance','Build 288 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 288 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='f3e84a0c5623eb0a74bccb537049d780944e2892' and pred.get('development_tree_sha')=='981b7a5e7b851684821af087a428fe66ad8348f0','Build 287 Development predecessor mismatch')
q(pred.get('production_main_sha')=='27a48e505b42c399fac0801cbd4e6394490957a4' and pred.get('production_tree_sha')=='981b7a5e7b851684821af087a428fe66ad8348f0' and pred.get('same_tree') is True,'Build 287 Production predecessor mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 287 successor-ingested authority must be Production GREEN')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='f3e84a0c5623eb0a74bccb537049d780944e2892' and fc.get('tree_sha')=='981b7a5e7b851684821af087a428fe66ad8348f0','Build 287 final Development closure missing')
q((fc.get('proofs') or {}).get('system_gate_run')==36432943282 and int(fc.get('dedicated_gate_run') or 0)==36432943286,'Build 287 final Development proofs mismatch')
q(pc.get('main_sha')=='27a48e505b42c399fac0801cbd4e6394490957a4' and pc.get('tree_sha')=='981b7a5e7b851684821af087a428fe66ad8348f0' and pc.get('state')=='PRODUCTION_GREEN','Build 287 Production checkpoint missing')
q(int(pc.get('production_pages_deploy_run') or 0)==36433269795 and int(pc.get('production_live_resource_integrity_run') or 0)==36433368187 and int(pc.get('build_specific_proof_run') or 0)==36433269797,'Build 287 Production proof mismatch')
e=a.get('evidence_contract') or {}
for key in ('real_existing_link_required','planned_estimate_required','reviewed_unposted_required','explicit_post_required','compensating_reversal_required','inventory_returns_to_baseline','finance_unchanged','interrupted_run_recovery_preserves_current_review_state','pre_interruption_review_value_must_not_be_guessed','tracking_mode_respected','log_only_or_reusable_usage_may_post_zero_stock_delta'):
    q(e.get(key) is True,'Build 288 evidence contract missing '+key)
q(e.get('review_state_after_reversal')=='approved_unconsumed','Build 288 post-reversal review state contract drift')
q(e.get('fixture_creation_allowed') is False and e.get('product_owned_inventory_allowed') is False,'Build 288 fixture/Product boundary drift')
q(e.get('creative_work_project_id')==7 and e.get('creative_work_event_id')==2 and e.get('creative_process_resource_link_id')==1 and e.get('site_item_inventory_id')==2801,'Build 288 real identity binding mismatch')
q(int(e.get('direct_d1_rows_read_ceiling') or 0)==20000,'Build 288 D1 read ceiling mismatch')
if a.get('state') in ('DEVELOPMENT_GREEN','PRODUCTION_GREEN'):
    q(e.get('state')=='REAL_PLANNED_ACTUAL_INVENTORY_ACCEPTANCE_GREEN','Build 288 accepted evidence state missing')
    q(e.get('fixture_used') is False and e.get('inventory_returned_to_baseline') is True and e.get('finance_unchanged') is True,'Build 288 accepted evidence safety mismatch')
for token in ('Build 288 — Real Planned-vs-Actual Inventory Acceptance','Build 289 — Real Inventory Adoption Outcomes Renewal'):q(token in road,'Roadmap missing '+token)
for token in ('Under the Sea','project 7','resource link 1','Inventory item 2801','1820px','Build 289'):q(token in doc,'Build 288 document missing '+token)
for token in ('review_material','post_material_inventory','reverse_material_inventory','fixture_used','direct_d1_rows_read','creative_process_resource_link_id=1','interrupted_prior_run_recovered','usage_tracking_mode','stock_depletion_expected','pre_interruption_review_value_claimed'):q(token in runtime,'Build 288 runtime missing '+token)
post_service=t('functions/api/_lib/inventoryPostService.js');reverse_service=t('functions/api/_lib/inventoryReversalService.js')
q('accounting_journal' not in post_service and 'accounting_journal' not in reverse_service,'Build 288 Inventory post/reversal source must remain Finance-neutral')
q('D1_ONE_SHOT_EVIDENCE_CAPTURE' in wf or 'workflow_dispatch:' in wf,'Build 288 workflow lacks bounded/manual proof mode')
q('Build 288 — Inventory Operations desktop table legibility' in css and any(token in css for token in ('min-width: 1820px !important','min-width: 1950px !important')) and 'width: 360px; min-width: 360px' in css and 'width: 280px; min-width: 280px' in css,'Build 288 Inventory table CSS repair missing')
q('scroll the table sideways' in ui,'Build 288 Inventory table operator guidance missing')
q("run_current_contract('scripts/release467_build288_gate.py','Release 467 Build 288')" in sysgate,'System Gate missing Build 288')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=288,'Current authority must retain Build 288 or successor')
if cur==288:
    q(p.get('title')=='Real Planned-vs-Actual Inventory Acceptance' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 288 pointer mismatch')
    q(p.get('accepted_dev_sha')=='f3e84a0c5623eb0a74bccb537049d780944e2892' and p.get('accepted_dev_tree_sha')=='981b7a5e7b851684821af087a428fe66ad8348f0','Current Build 288 predecessor acceptance mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='27a48e505b42c399fac0801cbd4e6394490957a4','Current Build 288 Production predecessor mismatch')
    q(int(p.get('next_build') or 0)==289 and p.get('next_build_title')=='Real Inventory Adoption Outcomes Renewal','Current Build 288 successor pointer mismatch')
s=a.get('safety') or {}
for k in ('schema_change','request_time_schema_mutation','fixture_creation','project_creation','event_creation','inventory_item_creation','product_owned_inventory','automatic_inventory_movement','finance_posting','provider_execution','provider_publication','payment_or_refund','production_business_data_mutation','r2_mutation','secret_capture'):
    q(s.get(k) is False,'Build 288 safety drift: '+k)
q(s.get('development_material_review') is True and s.get('development_explicit_inventory_post_and_reversal') is True,'Build 288 bounded Development operator mutation missing')
for path in ('public/js/admin-site-item-inventory.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout))
print('RELEASE 467 BUILD 288 REAL PLANNED-VS-ACTUAL INVENTORY ACCEPTANCE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Real linkage only / no fixture / explicit post + compensating reversal / Inventory baseline restored / Finance unchanged')
print('Next: Build 289 — Real Inventory Adoption Outcomes Renewal')
