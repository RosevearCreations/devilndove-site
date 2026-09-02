#!/usr/bin/env python3
"""Fail-closed retained contract for Release 467 Build 17 — Creator & Content Completeness."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
BASE_SHA='c05c7ff64e01672b04ec1768b696e163adeeca0f';BASE_TREE='1635f19b24df5c37358925948b51e5a43c20cf99';PREV_SYSTEM_GATE=33658864411;PREV_BUILD16_PROOF=33658864422
MERGED_SHA='7f3363954434801e9226b29d83899ea795713525';MERGED_TREE='0df69c0b24484536e6f50e21a523c915d101923a';MERGED_SYSTEM_GATE=33665275366;MERGED_BUILD17_PROOF=33665275406
PROD_MAIN='296e53b079bba53126c80902be36a9271d82cea4';PROD_DEPLOY=33655223149
MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):
 p=ROOT/path
 if not p.is_file():FAIL.append(f'missing required file: {path}');return ''
 return p.read_text(encoding='utf-8',errors='replace')
def load(path):
 try:v=json.loads(read(path));return v if isinstance(v,dict) else {}
 except Exception as e:FAIL.append(f'invalid JSON {path}: {e}');return {}
def changed():
 try:
  base=subprocess.check_output(['git','merge-base','HEAD','origin/dev'],cwd=ROOT,text=True).strip();out=subprocess.check_output(['git','diff','--name-only',f'{base}...HEAD'],cwd=ROOT,text=True);return [x for x in out.splitlines() if x]
 except Exception as e:FAIL.append(f'could not calculate changed files: {e}');return []
def hasall(body,tokens,label):
 for token in tokens:req(token in body,f'{label} marker missing: {token}')
def one_h1(body,label):req(len(re.findall(r'<h1(?:\s|>)',body,re.I))==1,f'{label} must contain exactly one H1')

p=load('current-development-authority.json');m=load('release467-build17-creator-content-completeness.json');mig=load('migrations/canonical/manifest.json');registry=load('release467-build17-placeholder-registry.json');compat=load('development-release.json')
pointer_build=int(p.get('build') or 0)
req(p.get('release')==467 and pointer_build>=17,'current authority must identify Release 467 Build 17 or newer')
if pointer_build==17:
 req(p.get('title')=='Creator & Content Completeness','Build 17 title drifted')
 req(p.get('feature_branch')=='release467-build17-creator-content-completeness','Build 17 feature branch drifted')
 req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 17 source base drifted')
 req(p.get('last_green_build')==16 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 16 predecessor drifted')
 req(p.get('last_green_system_gate_run')==PREV_SYSTEM_GATE and p.get('last_green_build_proof_run')==PREV_BUILD16_PROOF,'Build 16 proof drifted')
else:
 req(int(p.get('last_green_build') or 0)>=17,'newer authority must retain Build 17 as a green predecessor')
 req(p.get('last_green_dev_sha')==MERGED_SHA and p.get('last_green_dev_tree_sha')==MERGED_TREE,'newer authority must retain exact merged Build 17 SHA/tree')
 req(p.get('last_green_system_gate_run')==MERGED_SYSTEM_GATE and p.get('last_green_build_proof_run')==MERGED_BUILD17_PROOF,'newer authority must retain exact Build 17 proof evidence')
 req('release467-build17-creator-content-completeness.json' in (p.get('current_release_authorities') or []),'Build 17 provenance missing from newer pointer')
req(p.get('main_source_head_last_verified')==PROD_MAIN and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'verified Production checkpoint drifted')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(p.get(k) is False,f'pointer safety drift: {k}')
ca=p.get('compatibility_authority') or {};req(ca.get('role')=='INHERITED_REGRESSION_COMPATIBILITY' and ca.get('runtime_release_header')==466 and compat.get('release')==466,'Release 466 compatibility classification drifted')

req(m.get('release')==467 and m.get('build')==17 and m.get('title')=='Creator & Content Completeness','Build 17 manifest identity drifted')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE and m.get('backlog_items')==[16,17,18,19,20],'Build 17 manifest base/backlog drifted')
pr=m.get('predecessor') or {};req(pr.get('build')==16 and pr.get('merged_dev_sha')==BASE_SHA and pr.get('merged_dev_tree_sha')==BASE_TREE and pr.get('system_gate_run')==PREV_SYSTEM_GATE and pr.get('build16_proof_run')==PREV_BUILD16_PROOF,'Build 17 predecessor evidence drifted')
req(pr.get('production_main_sha')==PROD_MAIN and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 17 Production provenance drifted')
cp=m.get('creative_project_completeness') or {};caip=m.get('caip_story_candidates') or {};media=m.get('media_diagnostics') or {};mp=m.get('marketplace_presets') or {};ph=m.get('placeholder_policy') or {}
req(cp.get('dimensions')==['material_usage','costing','finished_output','lessons_learned','content_studio_handoff'] and cp.get('automatic_project_mutation') is False,'Build 17 Creative completeness drifted')
req(caip.get('existing_facts_only') is True and caip.get('ranking_is_approval') is False and caip.get('automatic_handoff') is False and caip.get('automatic_social_publication') is False,'Build 17 CAIP ranking boundary drifted')
req(media.get('automatic_assignment') is False and media.get('raw_r2_deletion') is False,'Build 17 Media boundary drifted')
req(mp.get('existing_rows_only') is True and mp.get('request_time_insert') is False and mp.get('request_time_schema_mutation') is False and mp.get('provider_execution') is False and mp.get('provider_publication') is False,'Build 17 marketplace boundary drifted')
req(ph.get('silent_placeholders') is False and ph.get('invented_marketing_fallback') is False and ph.get('waiver_requires')==['reason','owner','remediation'],'Build 17 placeholder policy drifted')

api=read('functions/api/admin/creator-content-completeness.js');presets=read('functions/api/admin/marketplace-presets.js');client=read('public/js/admin-creator-content-completeness.js');page=read('admin/creator-content-completeness/index.html');creative=read('admin/creative-process/index.html');placeholder_gate=read('scripts/release467_build17_placeholder_gate.py')
hasall(api,['read_only_projection','story_candidate=1','automatic_assignment:false','raw_r2_deletion:false','invented_story_claims:false','request_time_schema_mutation:false'],'Build 17 read projection')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE CREATIVE','DELETE FROM'):req(forbidden not in api.upper(),f'Build 17 projection regained write/DDL token: {forbidden}')
hasall(presets,['UPDATE custom_request_marketplace_channel_presets','policy_overrides_preserved:true','provider_execution:false','publication_allowed:false','request_time_schema_mutation:false'],'Build 17 preset boundary')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO CUSTOM_REQUEST_MARKETPLACE_CHANNEL_PRESETS'):req(forbidden not in presets.upper(),f'Build 17 preset endpoint regained schema/row creation: {forbidden}')
one_h1(page,'Build 17 admin page');hasall(client,['/api/admin/creator-content-completeness','/api/admin/marketplace-presets','No publication occurred','Automatic assignment: off'],'Build 17 client');req('/admin/creator-content-completeness/' in creative,'Creative Process lost Build 17 handoff')
req(registry.get('policy')=='NO_SILENT_PLACEHOLDERS' and registry.get('invented_marketing_fallback_allowed') is False,'Build 17 placeholder registry drifted');hasall(placeholder_gate,['invented_marketing_fallback=BLOCKED','reason_owner_remediation=REQUIRED'],'Build 17 placeholder gate')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')

if pointer_build==17:
 allowed={'.github/workflows/release467-build17-proof.yml','AI_HANDOFF.md','MARKDOWN_INDEX.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','admin/creative-process/index.html','admin/creator-content-completeness/index.html','css/creator-content-completeness.css','current-development-authority.json','docs/operations/RELEASE_467_BUILD_17_CREATOR_CONTENT_COMPLETENESS.md','functions/api/admin/creator-content-completeness.js','functions/api/admin/marketplace-presets.js','public/js/admin-creator-content-completeness.js','release467-build17-creator-content-completeness.json','release467-build17-placeholder-registry.json','scripts/release467_build16_gate.py','scripts/release467_build17_gate.py','scripts/release467_build17_placeholder_gate.py'}
 ch=changed();req(not [x for x in ch if x not in allowed],f'files outside Build 17 scope changed: {[x for x in ch if x not in allowed]}');req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 17 must not change schema/migrations')
if FAIL:
 print('FAIL Release 467 Build 17 retained gate');[print(f'- {x}') for x in FAIL];sys.exit(1)
print('PASS Release 467 Build 17 retained gate')
print(f'pointer_build={pointer_build}')
print('creative_project_content_completeness=GUARDED')
print('caip_story_candidate_ranking=EVIDENCE_ONLY')
print('media_assignment_diagnostics=EXPLICIT_HANDOFF_ONLY')
print('marketplace_presets=EXISTING_ROWS_REVIEW_ONLY')
print('silent_placeholders=BLOCKED')
print('invented_marketing_fallback=BLOCKED')
print('schema_migration=NONE')
print('provider_publication=NONE')
print('main_production_mutation=NONE')
