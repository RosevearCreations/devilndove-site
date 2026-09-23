#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(p): return (ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p): return json.loads(read(p))
def req(ok,msg):
    if not ok: FAIL.append(msg)
css=read('css/admin-ergonomics-v237.css');client=read('public/js/admin-ergonomics-v237.js');middleware=read('functions/_middleware.js')
authority=load('release467-build237-mobile-touch-keyboard-dense-workspace-ergonomics.json');pointer=load('current-development-authority.json')
road=read('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md');sysgate=read('scripts/current_system_gate_provenance_gate.py')
for token in ('focus-visible','min-height:46px','dd-v237-sticky-actions','dd-v237-card-mode','data-dd-column','max-width:720px'): req(token in css,f'Build 237 CSS missing {token}')
for token in ('Release 467 Build 237','DDAdminErgonomicsV237','dd:admin-ergonomics-ready','Card view','Table view','keydown','Escape','MutationObserver'): req(token in client,f'Build 237 client missing {token}')
req('fetch(' not in client and 'apiFetch(' not in client and 'requestSubmit(' not in client,'Build 237 must remain presentation-only')
req("ADMIN_ERGONOMICS_REVISION = '467b237-ergonomics-v1'" in middleware,'Build 237 middleware revision missing')
req('admin-ergonomics-v237.css' in middleware and 'admin-ergonomics-v237.js' in middleware,'Build 237 shared Admin bootstrap missing')
req(authority.get('build')==237,'Build 237 authority identity drift')
if int(pointer.get('build') or 0)==237:
 req(authority.get('state')=='DEVELOPMENT_CANDIDATE','Build 237 authority must be Development candidate while current')
else:
 req(authority.get('state')=='PRODUCTION_GREEN','Retained Build 237 authority must carry Production closure')
 final=authority.get('final_closure') or {}; prod=authority.get('production_checkpoint') or {}
 req(final.get('dev_sha')=='06cb191758b204fbbc3912ae533bec6c6fd227ad' and final.get('tree_sha')=='51fc6b9a4c0910f42bbbee9bf7d7a8aa756220b5','Retained Build 237 Development closure mismatch')
 req((final.get('proofs') or {})=={'system_gate_run':35858747170,'current_application_quality_run':35858747245,'it_admin_runtime_proof_run':35858747280,'branch_hygiene_run':35858746503},'Retained Build 237 proof set mismatch')
 req(prod.get('main_sha')=='53c0d8e4ed7cb9ea1691198e25a51f556a2ce0b3' and prod.get('tree_sha')=='51fc6b9a4c0910f42bbbee9bf7d7a8aa756220b5' and int(prod.get('production_pages_deploy_run') or 0)==35858981317,'Retained Build 237 Production closure mismatch')
for key in ('automatic_business_action','api_mutation','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','schema_change'): req(authority.get('safety',{}).get(key) is False,f'Build 237 safety drift: {key}')
req(int(pointer.get('build') or 0)>=237 and pointer.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 237 or a verified successor')
if int(pointer.get('build') or 0)==237: req(pointer.get('accepted_dev_sha')=='6385d67a726c82a049569d20537a55a9e727a19a' and pointer.get('accepted_dev_tree_sha')=='616274b2701b2b071eb033a785371607aa13b97d','Build 237 must ingest exact Build 236 Development closure')
req(int((pointer.get('restart_integrity') or {}).get('last_fully_verified',{}).get('build') or 0)>=236,'Build 237 retained proof lineage missing')
req(int(pointer.get('production_checkpoint',{}).get('build') or 0)>=236,'Build 237 Production predecessor lineage missing')
req('Build 238 — Attention, Notifications & Operator Signal Cleanup' in road,'Build 238 successor missing')
req("run_current_contract('scripts/release467_build237_gate.py','Release 467 Build 237')" in sysgate,'System Gate must invoke Build 237')
print('RELEASE 467 BUILD 237 MOBILE TOUCH KEYBOARD DENSE-WORKSPACE ERGONOMICS')
if FAIL:
 print('FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('PASS')
