#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build281-standalone-social-project-operator-acceptance.json');prev=j('release467-build280-private-media-reconciliation-recovery-outcome-review.json')
b271=j('release467-build271-standalone-social-caip-project-workflow.json');p=j('current-development-authority.json')
doc=t('docs/operations/RELEASE_467_BUILD_281_STANDALONE_SOCIAL_PROJECT_OPERATOR_ACCEPTANCE.md');road=t('docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md')
wf=t('.github/workflows/release467-build281-standalone-social-project-operator-acceptance.yml');runtime=t('scripts/release467_build281_operator_acceptance.py')
api=t('functions/api/admin/creative-assets.js');helper=t('functions/api/_lib/creativeAssetIntelligence.js');browser=t('public/js/admin-creative-assets.js');sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==281 and a.get('title')=='Standalone / Social Project Operator Acceptance','Build 281 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 281 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='c8033413b5ff85865caecee2f3b2a88558b80b03' and pred.get('development_tree_sha')=='c0f690478f6fdbd3748f8ecadc365abb2e0d1c06','Build 280 Development predecessor mismatch')
q(pred.get('production_main_sha')=='94e46cae035769ba61de379add1f7c1a6a1c21f0' and pred.get('production_tree_sha')=='c0f690478f6fdbd3748f8ecadc365abb2e0d1c06' and pred.get('same_tree') is True,'Build 280 Production predecessor mismatch')
dp=pred.get('development_proofs') or {};pp=pred.get('production_proofs') or {}
q(dp.get('system_gate_run')==36353058900 and dp.get('current_application_quality_run')==36353058904 and dp.get('it_admin_runtime_proof_run')==36353058892 and dp.get('branch_hygiene_run')==36353058965 and dp.get('dedicated_gate_run')==36353058905,'Build 280 Development proof mismatch')
q(pp.get('production_pages_deploy_run')==36353256814 and pp.get('production_live_resource_integrity_run')==36353294130 and pp.get('products_browser_proof_run')==36353294143 and pp.get('products_route_proof_run')==36353294081 and pp.get('build_specific_proof_run')==36353256919,'Build 280 Production proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 280 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='c8033413b5ff85865caecee2f3b2a88558b80b03' and (prev.get('final_closure') or {}).get('tree_sha')=='c0f690478f6fdbd3748f8ecadc365abb2e0d1c06','Build 280 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='94e46cae035769ba61de379add1f7c1a6a1c21f0' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='c0f690478f6fdbd3748f8ecadc365abb2e0d1c06','Build 280 Production checkpoint missing')
q(b271.get('state')=='PRODUCTION_GREEN' and (b271.get('workflow') or {}).get('direct_caip_workspace_open') is True,'Build 271 standalone/social source authority drift')
e=a.get('evidence_contract') or {}
q(e.get('environment')=='DEVELOPMENT_EXACT_SHA_LIVE_OPERATOR_ACCEPTANCE' and e.get('live_runtime_required') is True and e.get('static_source_is_live_acceptance') is False,'Build 281 runtime evidence contract drift')
q(e.get('existing_non_archived_creative_process_project_required') is True and e.get('productless_source_required') is True and e.get('synthetic_project_forbidden') is True,'Build 281 real source requirement drift')
q(e.get('action')=='open_creative_work_project' and e.get('idempotent_single_caip_mapping_required') is True and e.get('existing_content_studio_link_preserved') is True,'Build 281 operator identity contract drift')
q(e.get('provider_publication_invoked') is False and e.get('public_promotion_invoked') is False and e.get('production_runtime_mutation') is False,'Build 281 publication/Production separation drift')
start=helper.find('export async function ensureCreativeProjectFromCreativeWorkProject');end=helper.find('export async function syncCreativeProjectFromContentProject',start);chunk=helper[start:end]
for token in ("source_type='creative_work_project'","ON CONFLICT(source_type, source_id) DO UPDATE SET","product_created: false","content_project_created: false","private_media_unchanged: true","no_auto_publish: true","publication_requires_explicit_release_approval: true"):q(token in chunk,f'Build 271/281 helper invariant missing: {token}')
q('INSERT INTO products' not in chunk and 'INSERT INTO content_projects' not in chunk,'Standalone/social helper must not fabricate Product or Content Studio records')
q("action === 'open_creative_work_project'" in api and 'ensureCreativeProjectFromCreativeWorkProject' in api,'CAIP operator API action missing')
q('open_creative_work_project' in browser and 'Open / create CAIP workspace' in browser,'CAIP operator UI path missing')
for token in ('Wait for exact Development System Gate','current-development-deploy-proof','BUILD281_EXACT_DEV_BASE_URL','release467_build281_operator_acceptance.py','build281-standalone-social-project-operator-acceptance-evidence','Production branch remains runtime-read-only for Build 281'):q(token in wf,f'Build 281 workflow missing {token}')
for token in ('productless Development Creative Process project','open_creative_work_project','idempotent_mapping_count','product_created','existing_content_studio_link_preserved','private_media_unchanged','provider_publication_invoked','OPERATOR_ACCEPTED'):q(token in runtime,f'Build 281 runtime proof missing {token}')
for token in ('Build 281 — Standalone / Social Project Operator Acceptance','Build 282 — Content Studio Bridge Operator Acceptance'):q(token in road,f'Roadmap missing {token}')
for token in ('existing','productless','exact development','open_creative_work_project','no provider execution/publication','build 282'):q(token in doc.lower(),f'Build 281 document missing {token}')
q("run_current_contract('scripts/release467_build281_gate.py','Release 467 Build 281')" in sysgate,'System Gate missing Build 281')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=281,'Current authority must retain Build 281 or successor')
if cur==281:
    q(p.get('title')=='Standalone / Social Project Operator Acceptance' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 281 pointer mismatch')
    q(p.get('accepted_dev_sha')=='c8033413b5ff85865caecee2f3b2a88558b80b03' and p.get('accepted_dev_tree_sha')=='c0f690478f6fdbd3748f8ecadc365abb2e0d1c06','Current Build 281 accepted predecessor mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='94e46cae035769ba61de379add1f7c1a6a1c21f0','Current Build 281 Production predecessor mismatch')
    q(int(p.get('next_build') or 0)==282,'Current Build 281 successor pointer mismatch')
proj=p.get('caip_standalone_social_project_operator_acceptance') or {}
q(proj.get('operator_action')=='open_creative_work_project' and proj.get('productless_source_required') is True and proj.get('provider_publication') is False and proj.get('public_promotion') is False,'Current Build 281 projection mismatch')
s=a.get('safety') or {}
for k in ('schema_change','request_time_schema_mutation','production_d1_business_data_mutation','production_r2_mutation','product_creation','fake_product_creation','content_project_creation','private_media_upload','private_media_delete','uncertain_r2_delete','public_media_copy','provider_execution','provider_publication','public_promotion','product_publication','inventory_movement','finance_posting','payment_or_refund','production_business_data_copy','secret_capture','raw_operator_identity_capture','synthetic_acceptance','exact_sha_requirement_relaxed','named_proof_requirement_relaxed'):q(s.get(k) is False,f'Build 281 safety drift: {k}')
q(s.get('development_operator_caip_identity_mapping') is True,'Build 281 bounded Development operator mapping must be explicit')
print('RELEASE 467 BUILD 281 STANDALONE / SOCIAL PROJECT OPERATOR ACCEPTANCE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Runtime GREEN target: one real productless Creative Process identity opens/refreshes exactly one CAIP workspace with Product/provider/public promotion separation intact.')
print('Next: Build 282 — Content Studio Bridge Operator Acceptance')
