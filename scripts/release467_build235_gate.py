#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(p): return (ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p): return json.loads(read(p))
def req(ok,msg):
    if not ok: FAIL.append(msg)
client=read('public/js/admin-resume-work-v235.js')
middleware=read('functions/_middleware.js')
manifest=load('data/admin-navigation-modules.json')
authority=load('release467-build235-resume-work-cross-workspace-handoff.json')
pointer=load('current-development-authority.json')
road=read('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=read('scripts/current_system_gate_provenance_gate.py')
tokens=('Release 467 Build 235','Resume / Continue work','dd:admin-resume-work-ready','DDAdminResumeWorkV235','DDAdminUniversalSearchV161','DDAdminWorkspaceMemory','DDAdminFavorites','/data/admin-navigation-modules.json','/admin/today-tasks/','Open universal search','dd_return','nothing here executes a business action')
for token in tokens:req(token in client,f'Build 235 client missing {token}')
req("method:'POST'" not in client and 'method:"POST"' not in client and 'apiFetch(' not in client,'Build 235 must not execute business/API mutations')
req("ADMIN_RESUME_WORK_REVISION = '467b235-resume-work-v1'" in middleware,'Build 235 middleware revision missing')
req('admin-resume-work-v235.js' in middleware and 'data-dd-admin-resume-work-v235' in middleware,'Build 235 shared Admin bootstrap missing')
hrefs=[l.get('href') for m in manifest.get('modules',[]) for s in m.get('sections',[]) for l in s.get('links',[]) if isinstance(l,dict)]
req('/admin/today-tasks/' in hrefs,'Today Tasks must remain manifest-owned')
req(authority.get('build')==235,'Build 235 authority identity drift')
if int(pointer.get('build') or 0)==235:
    req(authority.get('state')=='DEVELOPMENT_CANDIDATE','Build 235 authority must be a Development candidate while current')
else:
    req(authority.get('state')=='PRODUCTION_GREEN','Retained Build 235 authority must carry the ingested Production closure')
    final=authority.get('final_closure') or {}
    prod235=authority.get('production_checkpoint') or {}
    req(final.get('dev_sha')=='b4c9d47752a146da3bfd3b8047ae5cc941c70d55' and final.get('tree_sha')=='6bceeefcab82beb5587fc05b053caf61dc587ef4','Retained Build 235 final Development closure mismatch')
    req((final.get('proofs') or {})=={'system_gate_run':35802372348,'current_application_quality_run':35802372207,'it_admin_runtime_proof_run':35802372335,'branch_hygiene_run':35802372354},'Retained Build 235 final proof set mismatch')
    req(prod235.get('main_sha')=='b2fbbcc86d1e3c4925bee7e09287ed32519d7f34' and prod235.get('tree_sha')=='6bceeefcab82beb5587fc05b053caf61dc587ef4' and int(prod235.get('production_pages_deploy_run') or 0)==35802505626,'Retained Build 235 Production closure mismatch')
for key in ('automatic_business_action','product_mutation','inventory_mutation','finance_mutation','provider_execution','provider_publication','d1_business_data_mutation','r2_mutation','schema_change'):
    req(authority.get('safety',{}).get(key) is False,f'Build 235 safety drift: {key}')
req(int(pointer.get('build') or 0)>=235 and pointer.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 235 or a verified successor')
if int(pointer.get('build') or 0)==235: req(pointer.get('accepted_dev_sha')=='b2ea3fdc6277751483d95dfc4700a85a7898b6b6' and pointer.get('accepted_dev_tree_sha')=='a5cbb736ebf496bf1be3fbcce902cd50c6d8b1de','Build 235 must ingest exact Build 234 Development closure')
req(int((pointer.get('restart_integrity') or {}).get('last_fully_verified',{}).get('build') or 0)>=234,'Build 235 retained proof lineage missing')
req(int(pointer.get('production_checkpoint',{}).get('build') or 0)>=234,'Build 235 Production predecessor lineage missing')
req('Build 236 — Save Confidence, Unsaved-Work Protection & Safe Batch Review' in road,'Build 236 successor missing')
req("run_current_contract('scripts/release467_build235_gate.py','Release 467 Build 235')" in sysgate,'System Gate must invoke Build 235')
print('RELEASE 467 BUILD 235 RESUME WORK CROSS-WORKSPACE HANDOFF')
if FAIL:
    print('FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('PASS')