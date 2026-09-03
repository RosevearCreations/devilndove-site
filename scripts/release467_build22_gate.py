#!/usr/bin/env python3
"""Fail-closed source/closure contract for Release 467 Build 22."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
B21_SHA='d411d4a21b2172de20722776b7ba3514310aeca1'; B21_TREE='eaf8e58ec3c985a8909df324b18e1ab0f8dfd089'; B21_SYSTEM=33697923893
ACCEPTED_SHA='73c852a71dc900a3a70cc84d0b622dfdc0c174fd'; ACCEPTED_TREE='05d25c8455c0bfe42955fc67fb1ee3a518ce272a'; SYSTEM=33698425301; PROOF=33698425317; HYGIENE=33698425312
B20_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_DEPLOY=33688892602
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
p=load('current-development-authority.json'); m=load('release467-build22-it-release-deployment-truth.json'); api=read('functions/api/admin/it-operations-control-tower.js'); client=read('public/js/admin-it-control-tower.js'); page=read('admin/it/index.html')
req(p.get('release')==467 and p.get('build')==22 and p.get('title')==TITLE,'Build 22 pointer identity drifted')
req(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN'),'Build 22 pointer state invalid')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==B20_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 pointer drifted')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(p.get(k) is False,f'Build 22 pointer safety drift: {k}')
req(m.get('release')==467 and m.get('build')==22 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_IT_RELEASE_TRUTH','Build 22 manifest identity drifted')
pred=m.get('predecessor') or {}; req(pred.get('merged_dev_sha')==B21_SHA and pred.get('merged_dev_tree_sha')==B21_TREE and pred.get('system_gate_run')==B21_SYSTEM,'Build 21 predecessor drifted')
if p.get('state')=='DEVELOPMENT_GREEN':
    req(p.get('last_green_build')==22 and p.get('last_green_dev_sha')==ACCEPTED_SHA and p.get('last_green_dev_tree_sha')==ACCEPTED_TREE,'Build 22 green evidence pointer drifted')
    req(p.get('last_green_system_gate_run')==SYSTEM and p.get('last_green_build_proof_run')==PROOF and p.get('last_green_branch_hygiene_run')==HYGIENE,'Build 22 green run evidence drifted')
    req(m.get('state')=='DEVELOPMENT_GREEN' and m.get('accepted_dev_sha')==ACCEPTED_SHA and m.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'Build 22 manifest green evidence drifted')
    a=m.get('acceptance') or {}; req(a.get('merged_system_gate_run')==SYSTEM and a.get('merged_build22_proof_run')==PROOF and a.get('merged_branch_hygiene_run')==HYGIENE,'Build 22 manifest acceptance runs drifted')
else:
    req(m.get('state')=='DEVELOPMENT_CANDIDATE','Build 22 candidate manifest state drifted')
hasall(api,['const BUILD = 22',ACCEPTED_SHA,ACCEPTED_TREE,PROD,str(PROD_DEPLOY),"state: 'DEVELOPMENT_GREEN'",'business_application_baseline','read_only_projection: true','automatic_repair: false','provider_execution: false'],'Build 22 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'): req(forbidden not in upper,f'Build 22 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 22 endpoint must expose no POST handler')
hasall(client,['Release 467 Build 22','/api/admin/it-operations-control-tower','Accepted Development evidence','Retained business baseline','Production authority','External acceptance policy','Truth boundaries'],'Build 22 client')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'I.T. page must contain exactly one H1')
allowed={'functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','current-development-authority.json','release467-build22-it-release-deployment-truth.json','scripts/release467_build21_gate.py','scripts/release467_build22_gate.py','AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/RELEASE_467_BUILD_22_IT_RELEASE_DEPLOYMENT_TRUTH.md'}
ch=changed(); extra=[x for x in ch if x not in allowed]; req(not extra,f'files outside Build 22 closure scope changed: {extra}'); req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 22 must not change schema/migrations')
if FAIL:
    print('FAIL Release 467 Build 22 gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 22 gate'); print('build22_state='+p.get('state','')); print('accepted_development_sha='+ACCEPTED_SHA); print('business_baseline=Build20'); print('production_authority=Build20'); print('schema_d1_r2_provider_main_production_mutation=NONE')
