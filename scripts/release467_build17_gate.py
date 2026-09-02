#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 17 — Creator & Content Completeness."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
BASE_SHA='c05c7ff64e01672b04ec1768b696e163adeeca0f';BASE_TREE='1635f19b24df5c37358925948b51e5a43c20cf99';SYSTEM_GATE=33658864411;BUILD16_PROOF=33658864422
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

p=load('current-development-authority.json');m=load('release467-build17-creator-content-completeness.json');mig=load('migrations/canonical/manifest.json');registry=load('release467-build17-placeholder-registry.json')
b16=read('scripts/release467_build16_gate.py');placeholder_gate=read('scripts/release467_build17_placeholder_gate.py')
api=read('functions/api/admin/creator-content-completeness.js');presets=read('functions/api/admin/marketplace-presets.js');client=read('public/js/admin-creator-content-completeness.js');page=read('admin/creator-content-completeness/index.html');creative_page=read('admin/creative-process/index.html');css=read('css/creator-content-completeness.css');doc=read('docs/operations/RELEASE_467_BUILD_17_CREATOR_CONTENT_COMPLETENESS.md')

req(p.get('release')==467 and p.get('build')==17 and p.get('title')=='Creator & Content Completeness','Build 17 pointer identity drifted')
req(p.get('state')=='DEVELOPMENT_CANDIDATE' and p.get('feature_branch')=='release467-build17-creator-content-completeness','Build 17 candidate/branch drifted')
req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 17 source base drifted')
req(p.get('last_green_build')==16 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 16 predecessor SHA/tree drifted')
req(p.get('last_green_system_gate_run')==SYSTEM_GATE and p.get('last_green_build_proof_run')==BUILD16_PROOF,'Build 16 predecessor proof drifted')
req(p.get('main_source_head_last_verified')==PROD_MAIN and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'verified Production checkpoint drifted')
auth=p.get('current_release_authorities') or [];req(auth and auth[0]=='release467-build17-creator-content-completeness.json' and 'release467-build16-custom-request-made-today-journey.json' in auth,'Build 17 authority chain drifted')
req(p.get('autonomous_backlog_active_build')==17 and p.get('autonomous_backlog_active_items')==[16,17,18,19,20],'Build 17 backlog pointer drifted')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(p.get(k) is False,f'pointer safety drift: {k}')
ca=p.get('compatibility_authority') or {};req(ca.get('role')=='INHERITED_REGRESSION_COMPATIBILITY' and ca.get('runtime_release_header')==466 and ca.get('runtime_release_header_role')=='INHERITED_RUNTIME_COMPATIBILITY','compatibility classification drifted')

req(m.get('release')==467 and m.get('build')==17 and m.get('title')=='Creator & Content Completeness','Build 17 manifest identity drifted')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE and m.get('backlog_items')==[16,17,18,19,20],'Build 17 manifest base/backlog drifted')
pr=m.get('predecessor') or {};req(pr.get('build')==16 and pr.get('merged_dev_sha')==BASE_SHA and pr.get('merged_dev_tree_sha')==BASE_TREE and pr.get('system_gate_run')==SYSTEM_GATE and pr.get('build16_proof_run')==BUILD16_PROOF,'Build 17 predecessor evidence drifted')
req(pr.get('production_main_sha')==PROD_MAIN and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 17 Production provenance drifted')
req(m.get('workspace')=='/admin/creator-content-completeness/','Build 17 workspace drifted')
cp=m.get('creative_project_completeness') or {};caip=m.get('caip_story_candidates') or {};media=m.get('media_diagnostics') or {};mp=m.get('marketplace_presets') or {};ph=m.get('placeholder_policy') or {}
req(cp.get('dimensions')==['material_usage','costing','finished_output','lessons_learned','content_studio_handoff'] and cp.get('automatic_project_mutation') is False,'Creative Project completeness contract drifted')
req(caip.get('existing_facts_only') is True and caip.get('ranking_is_approval') is False and caip.get('automatic_handoff') is False and caip.get('automatic_social_publication') is False,'CAIP ranking boundary drifted')
req(media.get('unassigned_media_visible') is True and media.get('unfilled_visual_slots_visible') is True and media.get('automatic_assignment') is False and media.get('raw_r2_deletion') is False,'Media diagnostics boundary drifted')
req(mp.get('existing_rows_only') is True and mp.get('request_time_insert') is False and mp.get('request_time_schema_mutation') is False and mp.get('policy_overrides_locked') is True and mp.get('provider_execution') is False and mp.get('provider_publication') is False,'Marketplace preset boundary drifted')
req(ph.get('silent_placeholders') is False and ph.get('invented_marketing_fallback') is False and ph.get('waiver_requires')==['reason','owner','remediation'],'placeholder policy drifted')
for k in ('schema_change_authorized','request_time_schema_mutation','new_d1_mutation_authorized','d1_mutation_authorized','new_r2_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_policy_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(m.get(k) is False,f'manifest safety drift: {k}')
req(m.get('runtime_existing_operational_writes_only') is True,'existing operational preset writes must be explicitly classified')

b16c=b16.replace(' ','');req("pointer_build>=16" in b16c and "ifpointer_build==16" in b16c,'Build 16 retained gate is not forward-compatible')
hasall(b16,[BASE_SHA,BASE_TREE,str(SYSTEM_GATE),str(BUILD16_PROOF),'customer_safe_request_journey=GUARDED'],'Build 16 retained provenance')

# Read-only completeness projection.
hasall(api,['read_only_projection','creative_work_projects','creative_project_content_handoffs','creative_media_evidence_ranges','story_candidate=1','unassigned_media','unfilled_slots','automatic_assignment:false','raw_r2_deletion:false','invented_story_claims:false','request_time_schema_mutation:false'],'completeness API')
upper_api=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE CREATIVE','DELETE FROM'):req(forbidden not in upper_api,f'completeness projection must remain read-only: {forbidden}')
# Ranking must be deterministic from existing evidence fields.
hasall(api,['review_status','verification_status','confidence_score','transcript_excerpt','note_text','linked_story_evidence_id','start_seconds','end_seconds'],'story ranking facts')

# Narrow existing-row preset editor/preflight.
hasall(presets,["new Set(['etsy','facebook_marketplace','pinterest'])",'sqlite_schema','PRAGMA table_info(custom_request_marketplace_channel_presets)','UPDATE custom_request_marketplace_channel_presets','auditAdminAction','policy_overrides_preserved:true','Canada-only policy','No-automatic-posting policy','Review-before-publish policy','provider_execution:false','publication_allowed:false','request_time_schema_mutation:false'],'marketplace preset API')
upper_presets=presets.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO CUSTOM_REQUEST_MARKETPLACE_CHANNEL_PRESETS'):req(forbidden not in upper_presets,f'marketplace preset endpoint must not create schema/rows: {forbidden}')
for provider_token in ('fetch(','stripe','paypal','pinterest.com','etsy.com','facebook.com'):req(provider_token.lower() not in presets.lower(),f'marketplace preset endpoint must not call providers: {provider_token}')

# Admin UI / explicit handoffs.
one_h1(page,'Creator & Content Completeness page')
hasall(page,['Creative Project → Content Studio completeness','CAIP story-candidate ranking','Media assignment & orphan diagnostics','Marketplace preset editor & preflight','No-silent-placeholder source gate','does not publish content','assign media automatically','execute marketplace providers'],'Build 17 admin page')
hasall(client,['/api/admin/creator-content-completeness','/api/admin/marketplace-presets','Content Studio handoff','Review evidence','Open Media Studio','No publication occurred','Automatic assignment: off'],'Build 17 admin client')
req('social-post' not in client.lower() and '/api/social' not in client.lower(),'Build 17 client must not invoke social publication')
hasall(css,['creator-story-grid','creator-media-grid','creator-preset-grid','@media(max-width:760px)'],'Build 17 responsive CSS')
req('/admin/creator-content-completeness/' in creative_page,'Creative Process must link to Build 17 completeness workspace')

# Placeholder gate/registry.
req(registry.get('policy')=='NO_SILENT_PLACEHOLDERS' and registry.get('invented_marketing_fallback_allowed') is False,'placeholder registry identity/policy drifted')
entries=registry.get('entries') or [];req(len(entries)>=3,'Build 17 must govern explicit current fallback/placeholder examples')
for entry in entries:
 for field in ('path','marker','reason','owner','remediation'):req(bool(str(entry.get(field,'')).strip()),f'placeholder registry entry missing {field}')
 req(entry.get('allows_invented_content') is False,'placeholder waiver cannot allow invented content')
hasall(placeholder_gate,['unregistered critical runtime placeholder/fallback marker','stale placeholder waiver','invented_marketing_fallback=BLOCKED','reason_owner_remediation=REQUIRED','admin/creative-process/index.html'],'placeholder gate')

req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
hasall(doc,['Release 467 Build 17','Creator & Content Completeness',BASE_SHA,'Release 467 Build 16','HOLD_EXTERNAL','automatic_social_publication=false','Production remains separately verified at Build 15'],'Build 17 documentation')

allowed={
 '.github/workflows/release467-build17-proof.yml','AI_HANDOFF.md','MARKDOWN_INDEX.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','admin/creative-process/index.html','admin/creator-content-completeness/index.html','css/creator-content-completeness.css','current-development-authority.json','docs/operations/RELEASE_467_BUILD_17_CREATOR_CONTENT_COMPLETENESS.md','functions/api/admin/creator-content-completeness.js','functions/api/admin/marketplace-presets.js','public/js/admin-creator-content-completeness.js','release467-build17-creator-content-completeness.json','release467-build17-placeholder-registry.json','scripts/release467_build16_gate.py','scripts/release467_build17_gate.py','scripts/release467_build17_placeholder_gate.py'
}
ch=changed();extra=[x for x in ch if x not in allowed];req(not extra,f'files outside Build 17 scope changed: {extra}')
req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 17 must not change schema/migrations')
if FAIL:
 print('FAIL Release 467 Build 17 Creator & Content Completeness gate');[print(f'- {x}') for x in FAIL];sys.exit(1)
print('PASS Release 467 Build 17 Creator & Content Completeness gate')
print('autonomous_backlog_items=16,17,18,19,20')
print('creative_project_content_completeness=GUARDED')
print('caip_story_candidate_ranking=EVIDENCE_ONLY')
print('media_assignment_diagnostics=EXPLICIT_HANDOFF_ONLY')
print('marketplace_presets=EXISTING_ROWS_REVIEW_ONLY')
print('silent_placeholders=BLOCKED')
print('invented_marketing_fallback=BLOCKED')
print('schema_migration=NONE')
print('provider_publication=NONE')
print('main_production_mutation=NONE')
