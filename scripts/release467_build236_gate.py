#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(p): return (ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p): return json.loads(read(p))
def req(ok,msg):
    if not ok: FAIL.append(msg)
client=read('public/js/admin-save-confidence-v236.js')
middleware=read('functions/_middleware.js')
authority=load('release467-build236-save-confidence-unsaved-work-safe-batch-review.json')
pointer=load('current-development-authority.json')
road=read('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=read('scripts/current_system_gate_provenance_gate.py')
for token in ('Release 467 Build 236','Saved','Unsaved changes','Saving…','Save failed','Stale data','beforeunload','dd:save-succeeded','dd:save-failed','dd:save-stale','data-dd-safe-batch-review','Review changes','Build 236 does not execute a batch mutation','DDAdminSaveConfidenceV236'):
    req(token in client,f'Build 236 client missing {token}')
req('requestSubmit(' not in client and "method:'POST'" not in client and 'method:"POST"' not in client and 'fetch(' not in client,'Build 236 shared layer must not execute retries or API/business mutations')
req("ADMIN_SAVE_CONFIDENCE_REVISION = '467b236-save-confidence-v1'" in middleware,'Build 236 middleware revision missing')
req('admin-save-confidence-v236.js' in middleware and 'data-dd-admin-save-confidence-v236' in middleware,'Build 236 shared Admin bootstrap missing')
req(authority.get('build')==236,'Build 236 authority identity drift')
if int(pointer.get('build') or 0)==236:
    req(authority.get('state')=='DEVELOPMENT_CANDIDATE','Build 236 authority must be a Development candidate while current')
else:
    req(authority.get('state')=='PRODUCTION_GREEN','Retained Build 236 authority must carry the ingested Production closure')
    final=authority.get('final_closure') or {}
    prod236=authority.get('production_checkpoint') or {}
    req(final.get('dev_sha')=='6385d67a726c82a049569d20537a55a9e727a19a' and final.get('tree_sha')=='616274b2701b2b071eb033a785371607aa13b97d','Retained Build 236 final Development closure mismatch')
    req((final.get('proofs') or {})=={'system_gate_run':35857576835,'current_application_quality_run':35857576801,'it_admin_runtime_proof_run':35857576924,'branch_hygiene_run':35857576861},'Retained Build 236 final proof set mismatch')
    req(prod236.get('main_sha')=='07a1b3b115dbff380e6645837a610879c4f8eda7' and prod236.get('tree_sha')=='616274b2701b2b071eb033a785371607aa13b97d' and int(prod236.get('production_pages_deploy_run') or 0)==35857748748,'Retained Build 236 Production closure mismatch')
for key in ('automatic_business_action','automatic_retry','automatic_batch_mutation','product_publication','inventory_movement','finance_posting','provider_execution','provider_publication','d1_business_data_mutation','r2_mutation','schema_change'):
    req(authority.get('safety',{}).get(key) is False,f'Build 236 safety drift: {key}')
req(int(pointer.get('build') or 0)>=236 and pointer.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 236 or a verified successor')
if int(pointer.get('build') or 0)==236: req(pointer.get('accepted_dev_sha')=='b4c9d47752a146da3bfd3b8047ae5cc941c70d55' and pointer.get('accepted_dev_tree_sha')=='6bceeefcab82beb5587fc05b053caf61dc587ef4','Build 236 must ingest exact Build 235 Development closure')
req(int((pointer.get('restart_integrity') or {}).get('last_fully_verified',{}).get('build') or 0)>=235,'Build 236 retained proof lineage missing')
req(int(pointer.get('production_checkpoint',{}).get('build') or 0)>=235,'Build 236 Production predecessor lineage missing')
req('Build 237 — Mobile, Touch, Keyboard & Dense-Workspace Ergonomics' in road,'Build 237 successor missing')
req("run_current_contract('scripts/release467_build236_gate.py','Release 467 Build 236')" in sysgate,'System Gate must invoke Build 236')
print('RELEASE 467 BUILD 236 SAVE CONFIDENCE UNSAVED-WORK SAFE BATCH REVIEW')
if FAIL:
    print('FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('PASS')
