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
req(authority.get('build')==236 and authority.get('state')=='DEVELOPMENT_CANDIDATE','Build 236 authority must be a Development candidate')
for key in ('automatic_business_action','automatic_retry','automatic_batch_mutation','product_publication','inventory_movement','finance_posting','provider_execution','provider_publication','d1_business_data_mutation','r2_mutation','schema_change'):
    req(authority.get('safety',{}).get(key) is False,f'Build 236 safety drift: {key}')
req(pointer.get('build')==236 and pointer.get('state')=='DEVELOPMENT_GREEN' and pointer.get('next_build')==237,'Current authority must expose Build 236 over verified Build 235')
req(pointer.get('accepted_dev_sha')=='b4c9d47752a146da3bfd3b8047ae5cc941c70d55' and pointer.get('accepted_dev_tree_sha')=='6bceeefcab82beb5587fc05b053caf61dc587ef4','Build 236 must ingest exact Build 235 Development closure')
req((pointer.get('restart_integrity') or {}).get('last_fully_verified',{}).get('build')==235,'Build 236 must retain Build 235 as last verified predecessor')
req(pointer.get('production_checkpoint',{}).get('main_sha')=='b2fbbcc86d1e3c4925bee7e09287ed32519d7f34' and int(pointer.get('production_checkpoint',{}).get('production_pages_deploy_run') or 0)==35802505626,'Build 235 Production predecessor mismatch')
req('Build 237 — Mobile, Touch, Keyboard & Dense-Workspace Ergonomics' in road,'Build 237 successor missing')
req("run_current_contract('scripts/release467_build236_gate.py','Release 467 Build 236')" in sysgate,'System Gate must invoke Build 236')
print('RELEASE 467 BUILD 236 SAVE CONFIDENCE UNSAVED-WORK SAFE BATCH REVIEW')
if FAIL:
    print('FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('PASS')
