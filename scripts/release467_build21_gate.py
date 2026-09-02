#!/usr/bin/env python3
"""Fail-closed closure/source contract for Release 467 Build 21."""
from __future__ import annotations
import json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
GREEN_SHA='63c6e90b9637e7953020aa856017bfde3579b47e'
GREEN_TREE='8b8ca34e0909d684de6e473007bd976e7948e52b'
GREEN_SYSTEM=33696534720
GREEN_PROOF=33696534777
HYGIENE=33696535136
RUNTIME_TREE='550272841e764d77fc21297abede3d4cae1aaea0'
PROD_MAIN='055cbc973c667b35a209c7ea207779089f6fed3a'
PROD_DEPLOY=33688892602
RETIRED=list(range(1,21))

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try: v=json.loads(read(path)); return v if isinstance(v,dict) else {}
    except Exception as e: FAIL.append(f'invalid JSON {path}: {e}'); return {}
def changed():
    try:
        base=subprocess.check_output(['git','merge-base','HEAD','origin/dev'],cwd=ROOT,text=True).strip()
        out=subprocess.check_output(['git','diff','--name-only',f'{base}...HEAD'],cwd=ROOT,text=True)
        return [x for x in out.splitlines() if x]
    except Exception as e: FAIL.append(f'could not calculate changed files: {e}'); return []
def hasall(body,tokens,label):
    for token in tokens: req(token in body,f'{label} marker missing: {token}')
p=load('current-development-authority.json'); m=load('release467-build21-release-state-branch-ci-hygiene.json')
req(p.get('release')==467 and p.get('build')==21 and p.get('state')=='DEVELOPMENT_GREEN','Build 21 pointer identity/state drifted')
req(p.get('last_green_build')==21 and p.get('last_green_dev_sha')==GREEN_SHA and p.get('last_green_dev_tree_sha')==GREEN_TREE,'Build 21 green SHA/tree drifted')
req(p.get('last_green_system_gate_run')==GREEN_SYSTEM and p.get('last_green_build_proof_run')==GREEN_PROOF and p.get('branch_hygiene_run')==HYGIENE,'Build 21 proof/run drifted')
req(p.get('application_runtime_authority_build')==20 and p.get('application_runtime_tree_sha')==RUNTIME_TREE,'Build 20 runtime authority drifted')
req(p.get('main_source_head_last_verified')==PROD_MAIN and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY and p.get('production_tree_last_verified')==RUNTIME_TREE,'Production Build 20 checkpoint drifted')
rg=p.get('repository_governance') or {}
req(rg.get('persistent_branches')==['main','dev'],'persistent branch policy drifted')
req(rg.get('retired_automatic_proof_builds')==RETIRED,'retired historical proof range drifted')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
for k in ('runtime_application_change_authorized','schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(p.get(k) is False,f'Build 21 pointer safety drift: {k}')
req(m.get('state')=='DEVELOPMENT_GREEN' and m.get('merged_dev_sha')==GREEN_SHA and m.get('merged_dev_tree_sha')==GREEN_TREE,'Build 21 manifest green evidence drifted')
a=m.get('acceptance') or {}
req(a.get('merged_build21_proof_run')==GREEN_PROOF and a.get('merged_system_gate_run')==GREEN_SYSTEM and a.get('branch_hygiene_run')==HYGIENE,'Build 21 manifest acceptance drifted')
wh=m.get('workflow_hygiene') or {}
req(wh.get('retained_proofs_dispatch_only_builds')==RETIRED,'Build 21 manifest historical workflow range drifted')
for build in RETIRED:
    body=read(f'.github/workflows/release467-build{build}-proof.yml')
    req('workflow_dispatch:' in body,f'Build {build} historical proof must remain manually dispatchable')
    req('\n  push:' not in body and '\n  pull_request:' not in body,f'Build {build} historical proof must be manual-only')
for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/RELEASE_467_BUILD_21_RELEASE_STATE_BRANCH_CI_HYGIENE.md'):
    body=read(path); hasall(body,['Release 467 Build 21',GREEN_SHA,GREEN_TREE,str(GREEN_SYSTEM),str(GREEN_PROOF),str(HYGIENE),PROD_MAIN,'Build 20'],path)
ch=changed()
allowed={f'.github/workflows/release467-build{x}-proof.yml' for x in range(1,16)} | {'current-development-authority.json','release467-build21-release-state-branch-ci-hygiene.json','scripts/release467_build21_gate.py','AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/RELEASE_467_BUILD_21_RELEASE_STATE_BRANCH_CI_HYGIENE.md'}
extra=[x for x in ch if x not in allowed]
req(not extra,f'files outside Build 21 closure scope changed: {extra}')
req(not [x for x in ch if x.startswith(('functions/','public/','admin/','css/','assets/','migrations/')) or x.lower().endswith('.sql')],'Build 21 closure must not change runtime/schema surfaces')
if FAIL:
    print('FAIL Release 467 Build 21 green closure gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 21 green closure gate')
print(f'development_green_sha={GREEN_SHA}')
print(f'development_green_tree={GREEN_TREE}')
print(f'system_gate={GREEN_SYSTEM}')
print(f'build21_proof={GREEN_PROOF}')
print(f'branch_hygiene={HYGIENE}')
print('historical_build1_20_auto_fanout=RETIRED')
print('persistent_branches=main,dev')
print('runtime_application_authority=Build20')
print('production_authority=Build20')
print('runtime_schema_d1_r2_provider_main_production_mutation=NONE')
