#!/usr/bin/env python3
"""Retained fail-closed authority for Release 467 Build 21, forward-compatible through Build 22."""
from __future__ import annotations
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
B21_SHA='d411d4a21b2172de20722776b7ba3514310aeca1'; B21_TREE='eaf8e58ec3c985a8909df324b18e1ab0f8dfd089'; B21_SYSTEM=33697923893; B21_PROOF=33697923897; B21_HYGIENE=33697923895
B20_SHA='7b38af543400a81593a8dc1b7caa4ad9a43033ea'; B20_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_DEPLOY=33688892602

def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try: v=json.loads(read(path)); return v if isinstance(v,dict) else {}
    except Exception as e: FAIL.append(f'invalid JSON {path}: {e}'); return {}
p=load('current-development-authority.json'); b21=load('release467-build21-release-state-branch-ci-hygiene.json'); pointer=int(p.get('build') or 0)
req(p.get('release')==467 and pointer>=21,'current pointer must be Release 467 Build 21 or newer')
req(b21.get('release')==467 and b21.get('build')==21 and b21.get('state')=='DEVELOPMENT_GREEN','Build 21 manifest authority drifted')
req(p.get('application_runtime_authority_build')==20 and p.get('application_runtime_tree_sha')==B20_TREE,'Build 20 runtime authority drifted')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==B20_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Build 20 Production authority drifted')
for build in range(1,21):
    body=read(f'.github/workflows/release467-build{build}-proof.yml'); req('workflow_dispatch:' in body and '\n  push:' not in body and '\n  pull_request:' not in body,f'Build {build} historical proof must remain manual-only')
if pointer==21:
    req(p.get('state')=='DEVELOPMENT_GREEN','Build 21 direct pointer must be DEVELOPMENT_GREEN')
else:
    b22=load('release467-build22-it-release-deployment-truth.json'); pred=b22.get('predecessor') or {}
    req(b22.get('release')==467 and b22.get('build')==22,'Build 22 transitive authority missing')
    req(pred.get('build')==21 and pred.get('merged_dev_sha')==B21_SHA and pred.get('merged_dev_tree_sha')==B21_TREE,'Build 22 must retain exact Build 21 closure predecessor')
    req(pred.get('system_gate_run')==B21_SYSTEM and pred.get('build21_proof_run')==B21_PROOF and pred.get('branch_hygiene_run')==B21_HYGIENE,'Build 22 must retain Build 21 proof chain')
    req(p.get('last_green_build')==21 and p.get('last_green_dev_sha')==B21_SHA and p.get('last_green_dev_tree_sha')==B21_TREE,'current pointer must retain exact Build 21 last-green predecessor')
    req(p.get('last_green_system_gate_run')==B21_SYSTEM and p.get('last_green_build_proof_run')==B21_PROOF,'current pointer Build 21 proof drifted')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(p.get(k) is False,f'current pointer safety drift: {k}')
if FAIL:
    print('FAIL Release 467 Build 21 retained gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 21 retained gate')
print('Build21_provenance=TRANSITIVE_VIA_BUILD22' if pointer>=22 else 'Build21_provenance=DIRECT_BUILD21_POINTER')
print('build21_green_sha='+B21_SHA); print('build21_green_tree='+B21_TREE); print('build20_runtime_authority=RETAINED'); print('production_build20=RETAINED')
