#!/usr/bin/env python3
"""Fail-closed source/authority contract for Release 467 Build 27."""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE_SHA='7c2509513b20892fd28f97dc3459a240a8019f32'; BASE_TREE='5f0c9a1893301fd040b35da8d03984e8841dc406'
ACCEPTED_SHA='e900e8388cae83b610a36af58df77ee91c3d3bbd'; ACCEPTED_TREE='516115b53161e80eecbaee5ded95305f5d16b5a9'
SYSTEM_RUN=33767567434; BUILD_RUN=33767567460; HYGIENE_RUN=33767567492
PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD_DEPLOY=33688892602
TITLE='Order ↔ Finance Settlement Readiness Reconciliation'
MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
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
p=load('current-development-authority.json'); prev=load('release467-build26-order-inventory-fulfillment-readiness.json'); m=load('release467-build27-order-finance-settlement-readiness.json'); mig=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/order-finance-settlement-readiness.js'); client=read('public/js/admin-order-finance-settlement-readiness.js'); page=read('admin/order-finance-settlement-readiness/index.html'); owner=read('admin/order-fulfillment-care/index.html'); oldwf=read('.github/workflows/release467-build26-proof.yml')
req(p.get('release')==467 and int(p.get('build') or 0)>=26,'current pointer must be Release 467 Build 26 or newer')
req(p.get('last_green_build') and int(p.get('last_green_build'))>=26,'current pointer must retain Build 26 green provenance')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 proof drifted')
req(prev.get('state')=='DEVELOPMENT_GREEN' and prev.get('accepted_dev_sha')==BASE_SHA and prev.get('accepted_dev_tree_sha')==BASE_TREE,'Build 26 accepted runtime drifted')
a=prev.get('acceptance') or {}
req(a.get('merged_system_gate_run')==33763972878 and a.get('merged_build26_proof_run')==33763973014 and a.get('merged_branch_hygiene_run')==33763972802,'Build 26 accepted run evidence drifted')
req(m.get('release')==467 and m.get('build')==27 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_ORDER_FINANCE_SETTLEMENT_READINESS_RECONCILIATION','Build 27 manifest identity drifted')
req(m.get('state') in ('FEATURE_IMPLEMENTED','DEVELOPMENT_GREEN'),'Build 27 manifest state invalid')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE,'Build 27 source base drifted')
req(m.get('missing_accounting_fails_closed') is True,'Build 27 missing Accounting evidence must fail closed')
for k in ('settlement_readiness_is_posting_authorization','payment_execution_authorized','refund_execution_authorized','accounting_posting_authorized','order_mutation_authorized','inventory_mutation_authorized','schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(m.get(k) is False,f'Build 27 safety drift: {k}')
if m.get('state')=='DEVELOPMENT_GREEN':
    req(m.get('accepted_dev_sha')==ACCEPTED_SHA and m.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'green Build 27 accepted SHA/tree drifted')
    ma=m.get('acceptance') or {}
    req(ma.get('merged_system_gate_run')==SYSTEM_RUN and ma.get('merged_build27_proof_run')==BUILD_RUN and ma.get('merged_branch_hygiene_run')==HYGIENE_RUN,'green Build 27 accepted run evidence drifted')
    req(int(p.get('build') or 0)>=27 and int(p.get('last_green_build') or 0)>=27,'green Build 27 must advance current pointer')
    if int(p.get('build') or 0)==27:
        req(p.get('accepted_dev_sha')==ACCEPTED_SHA and p.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'Build 27 current authority must point to accepted Build 27 runtime')
hasall(api,['onRequestGet as loadAccounting','read_only_order_finance_settlement_readiness_reconciliation','accounting_record_missing','refund_review','paid_amount_mismatch','outstanding_amount_mismatch','settlement_readiness_is_posting_authorization:false','request_time_schema_mutation:false'],'Build 27 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'):
    req(forbidden not in upper,f'Build 27 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 27 endpoint must expose no POST handler')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 27 page must contain exactly one H1')
hasall(page,['Release 467 Build 27','Order ↔ Finance Settlement Readiness','Missing Accounting evidence fails closed to review'],'Build 27 page')
hasall(client,['/api/admin/order-finance-settlement-readiness','Read-only; no payment/refund execution','accounting_record_missing','refund_review'],'Build 27 client')
req("method:'POST'" not in client.replace(' ',''),'Build 27 client must not POST')
req('/admin/order-finance-settlement-readiness/' in owner,'Build 18 owner workspace must link to Build 27 settlement readiness')
req('push:' not in oldwf and 'pull_request:' not in oldwf and 'workflow_dispatch:' in oldwf,'Build 26 proof must be manual-only after Build 27')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 27 gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 27 gate')
print('missing_accounting=FAIL_CLOSED_REVIEW')
print('payment_refund_accounting_order_inventory_mutation=NONE')
print('schema_d1_r2_provider_main_production_mutation=NONE')
