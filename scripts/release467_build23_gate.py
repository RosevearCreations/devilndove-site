#!/usr/bin/env python3
"""Fail-closed retained contract for Release 467 Build 23."""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE_SHA='ff1bc04ebdf51b1a2cf868269310a29c79588dfb'; BASE_TREE='ef6100c2bfceb024bd64b531a86af1e2df54d411'
ACCEPTED_SHA='51074b89293057ac3021fca70997a4281cd02dbc'; ACCEPTED_TREE='ad78fc93e7ec8c2a18785425bf15b5a09eca9213'; ACCEPTED_SYSTEM=33701463045; ACCEPTED_PROOF=33701462979; ACCEPTED_HYGIENE=33701462891
FINAL_SHA='9e61f20635b963d77c0b5c0c7bf7fb37d8a00d4d'; FINAL_TREE='323f9af57b905ea3e762e01cdbad2976197ea930'; FINAL_SYSTEM=33701882478; FINAL_PROOF=33701882382; FINAL_HYGIENE=33701882340
PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD_DEPLOY=33688892602
TITLE='Creator ↔ Finance Profitability Reconciliation'; MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
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
def hasall(body,tokens,label):
    for token in tokens: req(token in body,f'{label} marker missing: {token}')
p=load('current-development-authority.json'); m=load('release467-build23-creator-finance-profitability-reconciliation.json'); mig=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/project-profitability-reconciliation.js'); client=read('public/js/admin-project-profitability-reconciliation.js'); page=read('admin/project-profitability-reconciliation/index.html')
pointer_build=int(p.get('build') or 0); state=p.get('state')
req(p.get('release')==467 and pointer_build>=23,'current pointer must be Release 467 Build 23 or newer')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 proof drifted')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(p.get(k) is False,f'current pointer safety drift: {k}')
req(m.get('release')==467 and m.get('build')==23 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_CROSS_MODULE_PROFITABILITY_RECONCILIATION','Build 23 manifest identity drifted')
req(m.get('state')=='DEVELOPMENT_GREEN' and m.get('accepted_dev_sha')==ACCEPTED_SHA and m.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'Build 23 accepted runtime evidence drifted')
a=m.get('acceptance') or {}; req(a.get('merged_system_gate_run')==ACCEPTED_SYSTEM and a.get('merged_build23_proof_run')==ACCEPTED_PROOF and a.get('merged_branch_hygiene_run')==ACCEPTED_HYGIENE,'Build 23 accepted run evidence drifted')
if pointer_build==23:
    req(p.get('title')==TITLE and state=='DEVELOPMENT_GREEN','direct Build 23 pointer identity/state drifted')
    req(p.get('last_green_build')==23 and p.get('last_green_dev_sha')==ACCEPTED_SHA and p.get('last_green_dev_tree_sha')==ACCEPTED_TREE,'direct Build 23 green pointer drifted')
else:
    req('release467-build23-creator-finance-profitability-reconciliation.json' in (p.get('current_release_authorities') or []),'newer pointer lost Build 23 authority')
    req(int(p.get('last_green_build') or 0)>=23,'newer pointer lost Build 23 green provenance')
    if pointer_build==24 and state=='DEVELOPMENT_CANDIDATE':
        req(p.get('last_green_build')==23 and p.get('last_green_dev_sha')==FINAL_SHA and p.get('last_green_dev_tree_sha')==FINAL_TREE,'Build 24 candidate must start from final Build 23 closure SHA/tree')
        req(p.get('last_green_system_gate_run')==FINAL_SYSTEM and p.get('last_green_build_proof_run')==FINAL_PROOF and p.get('last_green_branch_hygiene_run')==FINAL_HYGIENE,'Build 24 candidate must retain final Build 23 closure runs')
for k in ('variance_is_automatic_error','creator_rough_result_is_accounting_truth','accounting_posting_authorized','automatic_project_mutation','automatic_finance_mutation','schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(m.get(k) is False,f'Build 23 manifest safety drift: {k}')
hasall(api,['loadProfitabilityIntelligence','read_only_cross_module_reconciliation','accounting_posting:false','automatic_project_mutation:false','automatic_finance_mutation:false'],'Build 23 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'): req(forbidden not in upper,f'Build 23 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 23 endpoint must expose no POST handler')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 23 page must contain exactly one H1')
hasall(client,['/api/admin/project-profitability-reconciliation','Read-only; no posting occurred.'],'Build 23 client')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 23 retained gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 23 retained gate'); print('accepted_runtime='+ACCEPTED_SHA); print('final_closure='+FINAL_SHA); print('schema_d1_r2_provider_main_production_mutation=NONE')
