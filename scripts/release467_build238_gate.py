#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(p): return (ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p): return json.loads(read(p))
def req(ok,msg):
 if not ok: FAIL.append(msg)
client=read('public/js/admin-attention-signals-v238.js');style=read('css/admin-attention-signals-v238.css');middleware=read('functions/_middleware.js')
notifications=read('public/js/admin-notifications.js');incidents=read('public/js/admin-runtime-incidents.js');today=read('public/js/admin-today-tasks.js')
authority=load('release467-build238-attention-notifications-operator-signal-cleanup.json');pointer=load('current-development-authority.json')
road=read('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md');sysgate=read('scripts/current_system_gate_provenance_gate.py')
for token in ('severityWeight','ageHours','ownerFor','score','quiet','rank','DDAttentionSignalsV238','dd:attention-signal-authority-ready'): req(token in client,f'Build 238 client missing {token}')
for token in ('dd-signal','data-signal-priority','data-signal-quiet','dd-signal-owner','dd-signal-section-note'): req(token in style,f'Build 238 style missing {token}')
req('fetch(' not in client and 'apiFetch(' not in client and 'requestSubmit(' not in client,'Build 238 shared signal layer must not create API or business mutations')
req("ADMIN_ATTENTION_SIGNALS_REVISION = '467b238-attention-signals-v1'" in middleware,'Build 238 middleware revision missing')
req('admin-attention-signals-v238.css' in middleware and 'admin-attention-signals-v238.js' in middleware,'Build 238 shared bootstrap missing')
req('DDAttentionSignalsV238' in notifications and 'data-signal-quiet' in notifications,'Notification Queue must use shared ranking/quiet contract')
req('DDAttentionSignalsV238' in incidents and 'Owner:' in incidents,'Runtime Incidents must use shared ranking/owner contract')
req('DDAttentionSignalsV238' in today and 'Incident evidence and resolution remain owned by Runtime Incidents' in today,'Today Tasks must route health attention to incident authority without duplicating resolution')
req(authority.get('build')==238,'Build 238 authority identity drift')
if int(pointer.get('build') or 0)==238:
 req(authority.get('state')=='DEVELOPMENT_CANDIDATE','Build 238 authority must be Development candidate while current')
else:
 req(authority.get('state')=='PRODUCTION_GREEN','Retained Build 238 authority must carry Production closure')
 final=authority.get('final_closure') or {}; prod238=authority.get('production_checkpoint') or {}
 req(final.get('dev_sha')=='26bd3f755bd486e41335431136f6fed36cabde9f' and final.get('tree_sha')=='a29c7d6fe3e7fbfae120000020303dc32ef55419','Retained Build 238 Development closure mismatch')
 req((final.get('proofs') or {})=={'system_gate_run':35859876994,'current_application_quality_run':35859877349,'it_admin_runtime_proof_run':35859876896,'branch_hygiene_run':35859877139},'Retained Build 238 proof set mismatch')
 req(prod238.get('main_sha')=='44e52cfc905b7864c31c2921ea5e34146a02361a' and prod238.get('tree_sha')=='a29c7d6fe3e7fbfae120000020303dc32ef55419' and int(prod238.get('production_pages_deploy_run') or 0)==35860073843,'Retained Build 238 Production closure mismatch')
for key in ('automatic_business_action','new_business_mutation','new_api_authority','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','schema_change'): req(authority.get('safety',{}).get(key) is False,f'Build 238 safety drift: {key}')
req(int(pointer.get('build') or 0)>=238 and pointer.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 238 or a verified successor')
if int(pointer.get('build') or 0)==238: req(pointer.get('accepted_dev_sha')=='06cb191758b204fbbc3912ae533bec6c6fd227ad' and pointer.get('accepted_dev_tree_sha')=='51fc6b9a4c0910f42bbbee9bf7d7a8aa756220b5','Build 238 must ingest exact Build 237 Development closure')
req(int((pointer.get('restart_integrity') or {}).get('last_fully_verified',{}).get('build') or 0)>=237,'Build 238 retained proof lineage missing')
req(int(pointer.get('production_checkpoint',{}).get('build') or 237)>=237,'Build 238 Production predecessor lineage missing')
req('Build 239 — Admin Surface & Navigation Consolidation' in road,'Build 239 successor missing')
req("run_current_contract('scripts/release467_build238_gate.py','Release 467 Build 238')" in sysgate,'System Gate must invoke Build 238')
print('RELEASE 467 BUILD 238 ATTENTION NOTIFICATIONS OPERATOR SIGNAL CLEANUP')
if FAIL:
 print('FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('PASS')
