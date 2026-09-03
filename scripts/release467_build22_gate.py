#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 22 — I.T. Release & Deployment Truth Convergence."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE_SHA='d411d4a21b2172de20722776b7ba3514310aeca1'; BASE_TREE='eaf8e58ec3c985a8909df324b18e1ab0f8dfd089'; BASE_SYSTEM=33697923893; BASE_PROOF=33697923897; BASE_HYGIENE=33697923895
RUNTIME_SHA='7b38af543400a81593a8dc1b7caa4ad9a43033ea'; RUNTIME_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_DEPLOY=33688892602
TITLE='I.T. Release & Deployment Truth Convergence'
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
        base=subprocess.check_output(['git','merge-base','HEAD','origin/dev'],cwd=ROOT,text=True).strip(); out=subprocess.check_output(['git','diff','--name-only',f'{base}...HEAD'],cwd=ROOT,text=True); return [x for x in out.splitlines() if x]
    except Exception as e: FAIL.append(f'could not calculate changed files: {e}'); return []
def hasall(body,tokens,label):
    for token in tokens: req(token in body,f'{label} marker missing: {token}')
p=load('current-development-authority.json'); m=load('release467-build22-it-release-deployment-truth.json'); api=read('functions/api/admin/it-operations-control-tower.js'); client=read('public/js/admin-it-control-tower.js'); page=read('admin/it/index.html'); oldwf=read('.github/workflows/release467-build21-proof.yml'); newwf=read('.github/workflows/release467-build22-proof.yml'); doc=read('docs/operations/RELEASE_467_BUILD_22_IT_RELEASE_DEPLOYMENT_TRUTH.md')
req(p.get('release')==467 and p.get('build')==22 and p.get('title')==TITLE and p.get('state')=='DEVELOPMENT_CANDIDATE','Build 22 pointer identity/state drifted')
req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 22 source base drifted')
req(p.get('last_green_build')==21 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 21 predecessor pointer drifted')
req(p.get('last_green_system_gate_run')==BASE_SYSTEM and p.get('last_green_build_proof_run')==BASE_PROOF and p.get('last_green_branch_hygiene_run')==BASE_HYGIENE,'Build 21 predecessor proof drifted')
req(p.get('application_runtime_authority_build')==20 and p.get('application_runtime_dev_sha')==RUNTIME_SHA and p.get('application_runtime_tree_sha')==RUNTIME_TREE,'Build 20 runtime pointer drifted')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==RUNTIME_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 pointer drifted')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(p.get(k) is False,f'Build 22 pointer safety drift: {k}')
req(p.get('runtime_application_change_authorized') is True,'Build 22 must explicitly identify its bounded runtime UI/API change')
req(m.get('release')==467 and m.get('build')==22 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_IT_RELEASE_TRUTH','Build 22 manifest identity drifted')
pred=m.get('predecessor') or {}; req(pred.get('merged_dev_sha')==BASE_SHA and pred.get('merged_dev_tree_sha')==BASE_TREE and pred.get('system_gate_run')==BASE_SYSTEM and pred.get('build21_proof_run')==BASE_PROOF and pred.get('branch_hygiene_run')==BASE_HYGIENE,'Build 22 manifest predecessor drifted')
ra=m.get('application_runtime_authority') or {}; req(ra.get('build')==20 and ra.get('merged_dev_sha')==RUNTIME_SHA and ra.get('tree_sha')==RUNTIME_TREE,'Build 22 manifest runtime authority drifted')
pa=m.get('production_authority') or {}; req(pa.get('main_sha')==PROD and pa.get('tree_sha')==RUNTIME_TREE and pa.get('pages_deploy_run')==PROD_DEPLOY,'Build 22 manifest Production authority drifted')
for k in ('schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_policy_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(m.get(k) is False,f'Build 22 manifest safety drift: {k}')
req(m.get('runtime_application_change_authorized') is True,'Build 22 manifest must disclose runtime application change')
hasall(api,['const BUILD = 22',BASE_SHA,BASE_TREE,RUNTIME_SHA,RUNTIME_TREE,PROD,str(PROD_DEPLOY),'current_operator','last_green_development','application_runtime','production','current_automatic_guards','read_only_projection: true','automatic_repair: false','provider_execution: false'],'Build 22 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'): req(forbidden not in upper,f'Build 22 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 22 endpoint must expose no POST handler')
hasall(client,['Release 467 Build 22','/api/admin/it-operations-control-tower','Current operator authority','Last-green Development','Application/runtime authority','Production authority','External acceptance policy','Truth boundaries'],'Build 22 client')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'I.T. page must contain exactly one H1')
hasall(page,['Release 467 Build 22','admin-it-control-tower.js?v=467b22','never upgrades an external HOLD by inference'],'Build 22 I.T. page')
req('workflow_dispatch:' in oldwf and '\n  push:' not in oldwf and '\n  pull_request:' not in oldwf,'Build 21 proof must be retired to manual historical execution')
hasall(newwf,['Release 467 Build 22 I.T. Release Deployment Truth Proof','release467_build21_gate.py','release467_build22_gate.py','release467_build15_public_seo_gate.py'],'Build 22 workflow')
hasall(doc,['Release 467 Build 22',BASE_SHA,BASE_TREE,str(BASE_SYSTEM),RUNTIME_TREE,PROD,'read-only','HOLD_EXTERNAL'],'Build 22 documentation')
allowed={'functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','admin/it/index.html','release467-build22-it-release-deployment-truth.json','current-development-authority.json','scripts/release467_build21_gate.py','.github/workflows/release467-build21-proof.yml','scripts/release467_build22_gate.py','.github/workflows/release467-build22-proof.yml','docs/operations/RELEASE_467_BUILD_22_IT_RELEASE_DEPLOYMENT_TRUTH.md','AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md'}
ch=changed(); extra=[x for x in ch if x not in allowed]; req(not extra,f'files outside Build 22 scope changed: {extra}'); req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 22 must not change schema/migrations')
if FAIL:
    print('FAIL Release 467 Build 22 I.T. Release & Deployment Truth gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 22 I.T. Release & Deployment Truth gate'); print('it_release_truth=READ_ONLY'); print('build21_predecessor=EXACT_GREEN'); print('build20_runtime_authority=RETAINED'); print('production_build20=RETAINED'); print('schema_d1_r2_provider_main_production_mutation=NONE')
