#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 20 — Workshop Tool & Equipment Readiness Command Center."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
BASE_SHA='9c814314dea5ddc664e73b9d822c8a41423c3aca';BASE_TREE='9be57e9c0e090f8edf210ce62fcf8b093e703506';SYSTEM_GATE=33673793408;BUILD19_PROOF=33673793538
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

p=load('current-development-authority.json');m=load('release467-build20-workshop-tool-equipment-readiness.json');mig=load('migrations/canonical/manifest.json')
b19=read('scripts/release467_build19_gate.py');api=read('functions/api/admin/workshop-readiness.js');client=read('public/js/admin-workshop-readiness.js');page=read('admin/workshop-readiness/index.html');creator=read('admin/creator/index.html');css=read('css/admin-workshop-readiness.css');doc=read('docs/operations/RELEASE_467_BUILD_20_WORKSHOP_TOOL_EQUIPMENT_READINESS.md')
req(p.get('release')==467 and p.get('build')==20 and p.get('title')=='Workshop Tool & Equipment Readiness Command Center','Build 20 pointer identity drifted')
req(p.get('state')=='DEVELOPMENT_CANDIDATE' and p.get('feature_branch')=='release-467-build-20-workshop-tool-equipment-readiness','Build 20 candidate/branch drifted')
req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 20 source base drifted')
req(p.get('last_green_build')==19 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 19 predecessor SHA/tree drifted')
req(p.get('last_green_system_gate_run')==SYSTEM_GATE and p.get('last_green_build_proof_run')==BUILD19_PROOF,'Build 19 predecessor proof drifted')
req(p.get('main_source_head_last_verified')==PROD_MAIN and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production checkpoint drifted')
auth=p.get('current_release_authorities') or [];req(auth and auth[0]=='release467-build20-workshop-tool-equipment-readiness.json' and 'release467-build19-inventory-replenishment-procurement-readiness.json' in auth,'Build 20 authority chain drifted')
req(p.get('post_autonomous_sequence')=='WORKSHOP_TOOL_EQUIPMENT_READINESS','post-autonomous sequence drifted')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(p.get(k) is False,f'pointer safety drift: {k}')
req(m.get('release')==467 and m.get('build')==20 and m.get('title')=='Workshop Tool & Equipment Readiness Command Center','Build 20 manifest identity drifted')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE,'Build 20 manifest source base drifted')
pr=m.get('predecessor') or {};req(pr.get('build')==19 and pr.get('merged_dev_sha')==BASE_SHA and pr.get('merged_dev_tree_sha')==BASE_TREE and pr.get('system_gate_run')==SYSTEM_GATE and pr.get('build19_proof_run')==BUILD19_PROOF,'Build 20 predecessor evidence drifted')
req(pr.get('production_main_sha')==PROD_MAIN and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 20 Production provenance drifted')
req(m.get('workspace')=='/admin/workshop-readiness/' and m.get('projection_endpoint')=='/api/admin/workshop-readiness' and m.get('role')=='READ_ONLY_OPERATIONS_PROJECTION','Build 20 workspace/role drifted')
req(m.get('attention_lanes')==['safety','service','alignment','replacement','evidence','warranty'],'Build 20 attention lanes drifted')
schedule=m.get('schedule_truth') or {};req(schedule.get('service_schedule_authority')=='inventory_tool_lifecycle_profiles.next_service_at','Build 20 service schedule authority drifted');req(schedule.get('inspection_due_schedule_authorized') is False and schedule.get('calibration_due_schedule_authorized') is False,'Build 20 must not invent inspection/calibration due schedules')
for k in ('schema_change_authorized','request_time_schema_mutation','new_d1_mutation_authorized','d1_mutation_authorized','new_r2_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_policy_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(m.get(k) is False,f'Build 20 manifest safety drift: {k}')
req(m.get('runtime_existing_operational_writes_only') is False,'Build 20 runtime must remain write-free')
b19c=b19.replace(' ','');req('pointer_build>=19' in b19c and 'Build19_provenance=TRANSITIVE_VIA_BUILD20' in b19,'Build 19 gate must remain forward-compatible/transitive');hasall(b19,[BASE_SHA,BASE_TREE,str(SYSTEM_GATE),str(BUILD19_PROOF)],'Build 19 merged provenance')
hasall(api,['read-only','site_item_inventory','inventory_tool_lifecycle_profiles','inventory_tool_lifecycle_events','automatic_tool_status_change:false','automatic_inventory_change:false','automatic_lifecycle_event_recording:false','automatic_replacement_procurement:false','provider_execution:false','calibration_history_only:true','calibration_due_schedule:false'],'Build 20 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'):req(forbidden not in upper,f'Build 20 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 20 endpoint must expose no POST handler')
for provider in ('api.stripe.com','api-m.paypal.com','etsy.com','facebook.com','pinterest.com'):req(provider not in api.lower(),f'Build 20 endpoint must not call provider: {provider}')
hasall(api,["lane:'safety'","lane:'service'","lane:'alignment'","lane:'replacement'","lane:'evidence'","lane:'warranty'",'No inspection interval is inferred.'],'Build 20 queue lanes/claim safety')
one_h1(page,'Build 20 command center page');hasall(page,['Release 467 Build 20','Workshop Tool &amp; Equipment Readiness Command Center','never invents an inspection or calibration due schedule','admin-workshop-readiness.js?v=467b20'],'Build 20 page')
hasall(client,['/api/admin/workshop-readiness','Nothing here changes Tool status, Inventory reuse, lifecycle history, service records, or replacement procurement.','Calibration rule:','Open Tool Lifecycle','Open Inventory'],'Build 20 client');flat=client.replace(' ','');req("method:'POST'" not in flat and 'method:"POST"' not in flat,'Build 20 client must not POST')
hasall(css,['wr-stats','wr-attention','wr-table','@media(max-width:700px)'],'Build 20 responsive CSS');req('/admin/workshop-readiness/' in creator and 'Build 20 workshop readiness command center' in creator,'Creator owner must link to Build 20 command center')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted');hasall(doc,['Release 467 Build 20','Workshop Tool & Equipment Readiness Command Center',BASE_SHA,'Release 467 Build 19','HOLD_EXTERNAL','calibration','read-only'],'Build 20 documentation')
allowed={'.github/workflows/release467-build20-proof.yml','admin/creator/index.html','admin/workshop-readiness/index.html','css/admin-workshop-readiness.css','current-development-authority.json','docs/operations/RELEASE_467_BUILD_20_WORKSHOP_TOOL_EQUIPMENT_READINESS.md','functions/api/admin/workshop-readiness.js','public/js/admin-workshop-readiness.js','release467-build20-workshop-tool-equipment-readiness.json','scripts/release467_build19_gate.py','scripts/release467_build20_gate.py'}
ch=changed();extra=[x for x in ch if x not in allowed];req(not extra,f'files outside Build 20 scope changed: {extra}');req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 20 must not change schema/migrations')
if FAIL:
 print('FAIL Release 467 Build 20 Workshop Tool & Equipment Readiness gate');[print(f'- {x}') for x in FAIL];sys.exit(1)
print('PASS Release 467 Build 20 Workshop Tool & Equipment Readiness gate')
print('build19_predecessor=EXACT_GREEN')
print('workshop_tool_readiness_projection=READ_ONLY')
print('tool_lifecycle_mutation=NONE')
print('inventory_mutation=NONE')
print('calibration_due_schedule=NONE')
print('replacement_procurement=NONE')
print('provider_execution=NONE')
print('schema_migration=NONE')
print('main_production_mutation=NONE')
