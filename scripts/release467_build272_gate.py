#!/usr/bin/env python3
"""Release 467 Build 272 — Upload Prerequisite & Operator Readiness fail-closed gate."""
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build272-upload-prerequisite-operator-readiness.json')
p=j('current-development-authority.json')
prev=j('release467-build271-standalone-social-caip-project-workflow.json')
root=t('_lib/caipMediaIntake.js'); api=t('functions/api/_lib/caipMediaIntake.js')
control=t('functions/api/admin/caip-media-intake.js')
direct=t('functions/api/admin/caip-media-upload-direct.js')
part=t('functions/api/admin/caip-media-upload-part.js')
browser=t('public/js/admin-caip-media-intake.js')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
doc=t('docs/operations/RELEASE_467_BUILD_272_UPLOAD_PREREQUISITE_OPERATOR_READINESS.md')
wf=t('.github/workflows/release467-build272-upload-prerequisite-operator-readiness.yml')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==272 and a.get('title')=='Upload Prerequisite & Operator Readiness','Build 272 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 272 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='af45e733b673af8e8d7e9acb7e55e35f525bebec','Build 271 Development SHA mismatch')
q(pred.get('production_main_sha')=='fce84316c0b5b22781b2ee30d35b205d96b39c09','Build 271 Production SHA mismatch')
q(pred.get('tree_sha')=='f0da384a9d0be6f54d5e0b441f7aa333c158e69f' and pred.get('same_tree') is True,'Build 271 exact-tree mismatch')
q((pred.get('development_proofs') or {}).get('system_gate_run')==36208079958,'Build 271 System proof mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36208079968,'Build 271 dedicated Development proof mismatch')
q((pred.get('production_proofs') or {}).get('production_pages_deploy_run')==36208228266,'Build 271 Production Pages proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36208228296,'Build 271 dedicated Production proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 271 authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='af45e733b673af8e8d7e9acb7e55e35f525bebec','Build 271 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='fce84316c0b5b22781b2ee30d35b205d96b39c09','Build 271 final Production closure missing')
r=a.get('readiness') or {}
for k in ('build241_schema_required','selection_ready_requires_all','transfer_ready_requires_all','structured_prerequisite_list','structured_blocker_codes','structured_operator_actions','blocked_get_returns_operator_state_not_500','direct_endpoint_server_guard','multipart_endpoint_server_guard','control_plane_server_guard','resume_selection_guard','safe_replacement_guard'):
    q(r.get(k) is True,f'Build 272 readiness invariant missing: {k}')
q(r.get('private_r2_binding_required')=='CAIP_PRIVATE_MEDIA_BUCKET','Build 272 private binding mismatch')
q(r.get('prerequisite_block_http_status')==409 and r.get('transfer_started_when_blocked') is False and r.get('prerequisite_block_records_transfer_failure') is False,'Build 272 blocked-transfer semantics drift')
q(r.get('classification')=='UPLOAD_PREREQUISITES_FAIL_CLOSED_BEFORE_SELECTION_AND_TRANSFER','Build 272 classification mismatch')
q(root==api,'CAIP media helper copies must remain byte-identical')
for token in ('selection_ready:false','transfer_ready:false',"operator_state:'CHECKING'","blocker_codes:[]",'readiness_contract_build:272','BUILD241_SCHEMA_MISSING','BUILD269_COLUMNS_MISSING','PRIVATE_R2_BINDING_MISSING','export async function requireCaipMediaUploadReadiness','CAIP_UPLOAD_PREREQUISITE_BLOCKED'):
    q(token in api,f'Build 272 helper readiness contract missing: {token}')
for token in ("mode:'blocked_prerequisite_no_transfer'","transferActions=new Set(['create_session','initiate_file','complete_file','create_safe_replacement'])",'requireCaipMediaUploadReadiness',"prerequisiteBlocked?409:400",'transfer_started:false'):
    q(token in control,f'Build 272 control-plane contract missing: {token}')
for body,label,stage in ((direct,'direct','direct_binary_transfer'),(part,'multipart','multipart_binary_transfer')):
    q('requireCaipMediaUploadReadiness' in body,f'Build 272 {label} readiness guard missing')
    q(stage in body,f'Build 272 {label} stage missing')
    q("error_code:'CAIP_UPLOAD_PREREQUISITE_BLOCKED'" in body and 'transfer_started:false' in body and ',409)' in body,f'Build 272 {label} blocked response drift')
q(part.index("try { readiness=await requireCaipMediaUploadReadiness") < part.index("try{\n    if(!privateBucketAvailable"),'Multipart readiness must run before transfer-failure scope')
for token in ('readinessChecklist','selectionReady','Choose files blocked','readiness.selection_ready===false','readiness.transfer_ready===false','Resume file selection is blocked','Safe re-upload is blocked'):
    q(token in browser,f'Build 272 browser contract missing: {token}')
for token in ('Build 272 — Upload Prerequisite & Operator Readiness','Build 273 — Content Studio Standalone-Project Bridge'):
    q(token in road,f'Roadmap missing {token}')
for token in ('Build 241 CAIP private-media tables','CAIP_UPLOAD_PREREQUISITE_BLOCKED','transfer_started: false','does **not** create transfer-failure evidence','UPLOAD_PREREQUISITES_FAIL_CLOSED_BEFORE_SELECTION_AND_TRANSFER','Build 273'):
    q(token in doc,f'Build 272 document missing {token}')
q('development_sha: af45e733b673af8e8d7e9acb7e55e35f525bebec' in wf,'Build 272 workflow Development predecessor drift')
q('production_sha: fce84316c0b5b22781b2ee30d35b205d96b39c09' in wf,'Build 272 workflow Production predecessor drift')
q('Release 467 Build 271 Standalone Social CAIP Project Workflow' in wf,'Build 272 workflow predecessor proof name drift')
q("run_current_contract('scripts/release467_build272_gate.py','Release 467 Build 272')" in sysgate,'System Gate missing Build 272')
cur=int(p.get('build') or 0)
q(p.get('release')==467 and cur>=272,'Current authority must retain Build 272 or a verified successor')
proj=p.get('caip_upload_prerequisite_operator_readiness') or {}
q(proj.get('classification')=='UPLOAD_PREREQUISITES_FAIL_CLOSED_BEFORE_SELECTION_AND_TRANSFER','Current authority missing Build 272 projection')
q(proj.get('file_selection_fail_closed') is True and proj.get('missing_prerequisite_is_transfer_failure') is False and proj.get('transfer_started_when_blocked') is False,'Current authority Build 272 block semantics mismatch')
if cur==272:
    q(p.get('title')=='Upload Prerequisite & Operator Readiness','Current authority Build 272 title mismatch')
    q(p.get('state')=='DEVELOPMENT_GREEN','Build 272 pointer must retain inherited Development GREEN state')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='fce84316c0b5b22781b2ee30d35b205d96b39c09','Build 272 candidate must retain Build 271 Production baseline')
    q(int(p.get('next_build') or 0)==273 and p.get('next_build_title')=='Content Studio Standalone-Project Bridge','Build 272 successor pointer mismatch')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 273+ requires verified Build 272 closure')
    q((a.get('final_closure') or {}).get('dev_sha')=='7cf4f6858c664a444499245a6b878491dceecb5f','Build 272 final Development SHA mismatch')
    q((a.get('final_closure') or {}).get('tree_sha')=='875f5cf60dd1118036f6bf5a18c0748e6e9b8d71','Build 272 final tree mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f','Build 272 final Production SHA mismatch')
    q((a.get('production_checkpoint') or {}).get('tree_sha')=='875f5cf60dd1118036f6bf5a18c0748e6e9b8d71','Build 272 final Production tree mismatch')
    if cur==273:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f','Build 273 current Production baseline must be exact Build 272')
        q(int(p.get('next_build') or 0)>=274,'Build 273 must advance beyond Build 273 successor')
    elif cur==274:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 274 current Production baseline must be exact Build 273')
        q(int(p.get('next_build') or 0)>=275,'Build 274 must advance beyond Build 274 successor')
    elif cur==275:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='af5e99b3baa1d28f3949e7956905a0325d328d06','Build 275 current Production baseline must be exact Build 274')
        q(int(p.get('next_build') or 0)>=276,'Build 275 must advance beyond Build 275 successor')
    elif cur==276:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587','Build 276 current Production baseline must be exact Build 275')
        q(int(p.get('next_build') or 0)>=277,'Build 276 must advance beyond Build 276 successor')
    elif cur==277:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='1bfcb248a8baf8cea42467a75c0dac53884ec5c3','Build 277 current Production baseline must be exact Build 276')
        q(int(p.get('next_build') or 0)>=278,'Build 277 must advance beyond Build 277 successor')
    else:
        q((cur==278 and (p.get('production_checkpoint') or {}).get('main_sha')=='552fe0fb1b192c7fd123c9a7369eea9f352f639e') or (cur>=279 and (p.get('production_checkpoint') or {}).get('main_sha')=='5d418eb1160caa7af855a247e1ff3510e4c1c9b8'),'Build 278+ current Production baseline must track the exact immediate verified predecessor')
        q(int(p.get('next_build') or 0)>=279,'Build 278+ must advance beyond Build 278 successor')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 272 safety drift: {k}')
if F:
    print('RELEASE 467 BUILD 272 UPLOAD PREREQUISITE OPERATOR READINESS: FAIL')
    for x in F: print('-',x)
    sys.exit(1)
print('RELEASE 467 BUILD 272 UPLOAD PREREQUISITE OPERATOR READINESS')
print('PASS')
print('Build 241 + Build 269 + private R2 are required before local selection and binary transfer.')
print('Blocked prerequisites remain readiness/configuration states; no transfer failure is recorded.')
print('Next: Build 273 — Content Studio Standalone-Project Bridge')
