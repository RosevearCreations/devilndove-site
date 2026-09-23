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
req(authority.get('build')==238 and authority.get('state')=='DEVELOPMENT_CANDIDATE','Build 238 authority must be Development candidate')
for key in ('automatic_business_action','new_business_mutation','new_api_authority','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','schema_change'): req(authority.get('safety',{}).get(key) is False,f'Build 238 safety drift: {key}')
req(pointer.get('build')==238 and pointer.get('state')=='DEVELOPMENT_GREEN' and pointer.get('next_build')==239,'Current authority must expose Build 238 over verified Build 237')
req(pointer.get('accepted_dev_sha')=='06cb191758b204fbbc3912ae533bec6c6fd227ad' and pointer.get('accepted_dev_tree_sha')=='51fc6b9a4c0910f42bbbee9bf7d7a8aa756220b5','Build 238 must ingest exact Build 237 Development closure')
req((pointer.get('restart_integrity') or {}).get('last_fully_verified',{}).get('build')==237,'Build 238 must retain Build 237 as last verified predecessor')
req(pointer.get('production_checkpoint',{}).get('main_sha')=='53c0d8e4ed7cb9ea1691198e25a51f556a2ce0b3' and int(pointer.get('production_checkpoint',{}).get('production_pages_deploy_run') or 0)==35858981317,'Build 237 Production predecessor mismatch')
req('Build 239 — Admin Surface & Navigation Consolidation' in road,'Build 239 successor missing')
req("run_current_contract('scripts/release467_build238_gate.py','Release 467 Build 238')" in sysgate,'System Gate must invoke Build 238')
print('RELEASE 467 BUILD 238 ATTENTION NOTIFICATIONS OPERATOR SIGNAL CLEANUP')
if FAIL:
 print('FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('PASS')
