#!/usr/bin/env python3
"""Fail-closed contract for Release 467 Build 23 — Creator ↔ Finance Profitability Reconciliation."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
BASE_SHA='ff1bc04ebdf51b1a2cf868269310a29c79588dfb';BASE_TREE='ef6100c2bfceb024bd64b531a86af1e2df54d411';B22_SYSTEM=33698947509;B22_PROOF=33698947534;B22_HYGIENE=33698947647
ACCEPTED_SHA='51074b89293057ac3021fca70997a4281cd02dbc';ACCEPTED_TREE='ad78fc93e7ec8c2a18785425bf15b5a09eca9213';ACCEPTED_SYSTEM=33701463045;ACCEPTED_PROOF=33701462979;ACCEPTED_HYGIENE=33701462891
PROD='055cbc973c667b35a209c7ea207779089f6fed3a';PROD_TREE='550272841e764d77fc21297abede3d4cae1aaea0';PROD_DEPLOY=33688892602
TITLE='Creator ↔ Finance Profitability Reconciliation';MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(path):
    try:
        v=json.loads(read(path)); return v if isinstance(v,dict) else {}
    except Exception as e: FAIL.append(f'invalid JSON {path}: {e}'); return {}
def changed():
    try:
        base=subprocess.check_output(['git','merge-base','HEAD','origin/dev'],cwd=ROOT,text=True).strip(); out=subprocess.check_output(['git','diff','--name-only',f'{base}...HEAD'],cwd=ROOT,text=True); return [x for x in out.splitlines() if x]
    except Exception as e: FAIL.append(f'could not calculate changed files: {e}'); return []
def hasall(body,tokens,label):
    for token in tokens: req(token in body,f'{label} marker missing: {token}')
p=load('current-development-authority.json');m=load('release467-build23-creator-finance-profitability-reconciliation.json');mig=load('migrations/canonical/manifest.json');api=read('functions/api/admin/project-profitability-reconciliation.js');client=read('public/js/admin-project-profitability-reconciliation.js');page=read('admin/project-profitability-reconciliation/index.html');finance=read('admin/finance/index.html');creator=read('admin/creator-content-completeness/index.html');state=p.get('state')
req(p.get('release')==467 and p.get('build')==23 and p.get('title')==TITLE,'Build 23 pointer identity drifted')
req(state in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN'),'Build 23 pointer state invalid')
req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 23 source base drifted')
if state=='DEVELOPMENT_CANDIDATE':
    req(p.get('last_green_build')==22 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 22 final closure predecessor drifted')
    req(p.get('last_green_system_gate_run')==B22_SYSTEM and p.get('last_green_build_proof_run')==B22_PROOF and p.get('last_green_branch_hygiene_run')==B22_HYGIENE,'Build 22 final run evidence drifted')
else:
    req(p.get('accepted_dev_sha')==ACCEPTED_SHA and p.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'Build 23 accepted Dev evidence drifted')
    req(p.get('last_green_build')==23 and p.get('last_green_dev_sha')==ACCEPTED_SHA and p.get('last_green_dev_tree_sha')==ACCEPTED_TREE,'Build 23 green pointer drifted')
    req(p.get('last_green_system_gate_run')==ACCEPTED_SYSTEM and p.get('last_green_build_proof_run')==ACCEPTED_PROOF and p.get('last_green_branch_hygiene_run')==ACCEPTED_HYGIENE,'Build 23 accepted run evidence drifted')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 proof drifted')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(p.get(k) is False,f'Build 23 pointer safety drift: {k}')
req(m.get('release')==467 and m.get('build')==23 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_CROSS_MODULE_PROFITABILITY_RECONCILIATION','Build 23 manifest identity drifted')
pr=m.get('predecessor') or {}; req(pr.get('merged_dev_sha')==BASE_SHA and pr.get('merged_dev_tree_sha')==BASE_TREE and pr.get('system_gate_run')==B22_SYSTEM and pr.get('build22_proof_run')==B22_PROOF and pr.get('branch_hygiene_run')==B22_HYGIENE,'Build 23 predecessor evidence drifted')
req(pr.get('production_main_sha')==PROD and pr.get('production_tree_sha')==PROD_TREE and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 23 Production provenance drifted')
if state=='DEVELOPMENT_GREEN':
    req(m.get('state')=='DEVELOPMENT_GREEN' and m.get('accepted_dev_sha')==ACCEPTED_SHA and m.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'Build 23 manifest accepted evidence drifted')
    a=m.get('acceptance') or {}; req(a.get('merged_system_gate_run')==ACCEPTED_SYSTEM and a.get('merged_build23_proof_run')==ACCEPTED_PROOF and a.get('merged_branch_hygiene_run')==ACCEPTED_HYGIENE,'Build 23 manifest accepted runs drifted')
for k in ('variance_is_automatic_error','creator_rough_result_is_accounting_truth','accounting_posting_authorized','automatic_project_mutation','automatic_finance_mutation','schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(m.get(k) is False,f'Build 23 manifest safety drift: {k}')
hasall(api,['loadProfitabilityIntelligence','read_only_cross_module_reconciliation','accounting_posting:false','automatic_project_mutation:false','automatic_finance_mutation:false','provider_execution:false','request_time_schema_mutation:false',"creator:'/admin/creative-process/'","accounting:'/admin/accounting/'"],'Build 23 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'): req(forbidden not in upper,f'Build 23 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 23 endpoint must expose no POST handler')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 23 page must contain exactly one H1')
hasall(page,['Release 467 Build 23','Creator ↔ Finance Profitability Reconciliation','does not post accounting entries'],'Build 23 page')
hasall(client,['/api/admin/project-profitability-reconciliation','Read-only; no posting occurred.','A non-zero variance means review the evidence owners.'],'Build 23 client')
req("method:'POST'" not in client.replace(' ',''),'Build 23 client must not POST')
req('/admin/project-profitability-reconciliation/' in finance,'Finance must link Build 23 reconciliation')
req('/admin/project-profitability-reconciliation/' in creator,'Creator completeness must link Build 23 reconciliation')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
ch=changed()
if state=='DEVELOPMENT_CANDIDATE':
    allowed={'.github/workflows/release467-build22-proof.yml','.github/workflows/release467-build23-proof.yml','AI_HANDOFF.md','MARKDOWN_INDEX.md','PROJECT_STATUS_AND_ROADMAP.md','admin/creator-content-completeness/index.html','admin/finance/index.html','admin/project-profitability-reconciliation/index.html','css/admin-project-profitability-reconciliation.css','current-development-authority.json','docs/operations/RELEASE_467_BUILD_23_CREATOR_FINANCE_PROFITABILITY_RECONCILIATION.md','functions/api/admin/project-profitability-reconciliation.js','public/js/admin-project-profitability-reconciliation.js','release467-build23-creator-finance-profitability-reconciliation.json','scripts/release467_build21_gate.py','scripts/release467_build22_gate.py','scripts/release467_build23_gate.py'}
else:
    allowed={'AI_HANDOFF.md','MARKDOWN_INDEX.md','PROJECT_STATUS_AND_ROADMAP.md','current-development-authority.json','docs/operations/RELEASE_467_BUILD_23_CREATOR_FINANCE_PROFITABILITY_RECONCILIATION.md','release467-build23-creator-finance-profitability-reconciliation.json','scripts/release467_build22_gate.py','scripts/release467_build23_gate.py'}
req(not [x for x in ch if x not in allowed],f'files outside Build 23 state scope changed: {[x for x in ch if x not in allowed]}')
req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 23 must not change schema/migrations')
if FAIL:
    print('FAIL Release 467 Build 23 Creator Finance Profitability Reconciliation gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 23 Creator Finance Profitability Reconciliation gate'); print('state='+state); print('accepted_dev='+ACCEPTED_SHA if state=='DEVELOPMENT_GREEN' else 'accepted_dev=PENDING'); print('creator_finance_reconciliation=READ_ONLY'); print('creator_rough_result_accounting_truth=FALSE'); print('variance_automatic_error=FALSE'); print('accounting_posting=NONE'); print('schema_d1_r2_provider_main_production_mutation=NONE')
