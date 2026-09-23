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
req(authority.get('build')==237 and authority.get('state')=='DEVELOPMENT_CANDIDATE','Build 237 authority must be Development candidate')
for key in ('automatic_business_action','api_mutation','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','schema_change'): req(authority.get('safety',{}).get(key) is False,f'Build 237 safety drift: {key}')
req(pointer.get('build')==237 and pointer.get('state')=='DEVELOPMENT_GREEN' and pointer.get('next_build')==238,'Current authority must expose Build 237 over verified Build 236')
req(pointer.get('accepted_dev_sha')=='6385d67a726c82a049569d20537a55a9e727a19a' and pointer.get('accepted_dev_tree_sha')=='616274b2701b2b071eb033a785371607aa13b97d','Build 237 must ingest exact Build 236 Development closure')
req((pointer.get('restart_integrity') or {}).get('last_fully_verified',{}).get('build')==236,'Build 237 must retain Build 236 as last verified predecessor')
req(pointer.get('production_checkpoint',{}).get('main_sha')=='07a1b3b115dbff380e6645837a610879c4f8eda7' and int(pointer.get('production_checkpoint',{}).get('production_pages_deploy_run') or 0)==35857748748,'Build 236 Production predecessor mismatch')
req('Build 238 — Attention, Notifications & Operator Signal Cleanup' in road,'Build 238 successor missing')
req("run_current_contract('scripts/release467_build237_gate.py','Release 467 Build 237')" in sysgate,'System Gate must invoke Build 237')
print('RELEASE 467 BUILD 237 MOBILE TOUCH KEYBOARD DENSE-WORKSPACE ERGONOMICS')
if FAIL:
 print('FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('PASS')
