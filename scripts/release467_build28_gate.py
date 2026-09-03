#!/usr/bin/env python3
"""Fail-closed source/authority contract for Release 467 Build 28."""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE_SHA='ac525c4cc9442c7ba5efb2fd752ee79c14f834df'; BASE_TREE='8b00e6baff55c769aff0a47caaf4e5dfca10bad1'
PREV_ACCEPTED_SHA='e900e8388cae83b610a36af58df77ee91c3d3bbd'; PREV_ACCEPTED_TREE='516115b53161e80eecbaee5ded95305f5d16b5a9'
ACCEPTED_SHA='d9717bb81a52584abe1a45c83fc67889a5770f35'; ACCEPTED_TREE='88f17be8a85cce4e588ef5171004ad28c875332e'
SYSTEM_RUN=33770297641; BUILD_RUN=33770297583; HYGIENE_RUN=33770297625
PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD_DEPLOY=33688892602
TITLE='Inventory ↔ Finance Valuation Readiness Reconciliation'
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
p=load('current-development-authority.json'); prev=load('release467-build27-order-finance-settlement-readiness.json'); m=load('release467-build28-inventory-finance-valuation-readiness.json'); mig=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/inventory-finance-valuation-readiness.js'); client=read('public/js/admin-inventory-finance-valuation-readiness.js'); page=read('admin/inventory-finance-valuation-readiness/index.html'); finance=read('admin/accounting/index.html'); inventory=read('admin/inventory-intelligence/index.html'); oldwf=read('.github/workflows/release467-build27-proof.yml')
req(p.get('release')==467 and int(p.get('build') or 0)>=27,'current pointer must be Release 467 Build 27 or newer')
req(int(p.get('last_green_build') or 0)>=27,'current pointer must retain Build 27 green provenance')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 proof drifted')
req(prev.get('state')=='DEVELOPMENT_GREEN' and prev.get('accepted_dev_sha')==PREV_ACCEPTED_SHA and prev.get('accepted_dev_tree_sha')==PREV_ACCEPTED_TREE,'Build 27 accepted runtime drifted')
a=prev.get('acceptance') or {}
req(a.get('merged_system_gate_run')==33767567434 and a.get('merged_build27_proof_run')==33767567460 and a.get('merged_branch_hygiene_run')==33767567492,'Build 27 accepted run evidence drifted')
req(m.get('release')==467 and m.get('build')==28 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_INVENTORY_FINANCE_VALUATION_READINESS_RECONCILIATION','Build 28 manifest identity drifted')
req(m.get('state') in ('FEATURE_IMPLEMENTED','DEVELOPMENT_GREEN'),'Build 28 manifest state invalid')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE,'Build 28 source base drifted')
for k in ('inventory_cost_owner_preserved','missing_on_hand_cost_fails_closed','missing_cost_provenance_fails_closed'):
    req(m.get(k) is True,f'Build 28 fail-closed/ownership drift: {k}')
for k in ('operational_inventory_value_is_book_value','operational_inventory_value_is_tax_value','finance_review_is_accounting_posting_authorization','fixed_asset_classification_authorized','inventory_cost_mutation_authorized','inventory_quantity_mutation_authorized','accounting_posting_authorized','schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(m.get(k) is False,f'Build 28 safety drift: {k}')
if m.get('state')=='DEVELOPMENT_GREEN':
    req(m.get('accepted_dev_sha')==ACCEPTED_SHA and m.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'green Build 28 accepted SHA/tree drifted')
    ma=m.get('acceptance') or {}
    req(ma.get('merged_system_gate_run')==SYSTEM_RUN and ma.get('merged_build28_proof_run')==BUILD_RUN and ma.get('merged_branch_hygiene_run')==HYGIENE_RUN,'green Build 28 accepted run evidence drifted')
    req(int(p.get('build') or 0)>=28 and int(p.get('last_green_build') or 0)>=28,'green Build 28 must advance current pointer')
    req(p.get('accepted_dev_sha')==ACCEPTED_SHA and p.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'current authority must point to accepted Build 28 runtime')
hasall(api,['onRequestGet as loadInventoryCost','read_only_inventory_finance_valuation_readiness_reconciliation','unvalued_on_hand','provenance_missing','current_cost_unreconciled','source_evidence_missing','tool_asset_review','operational_inventory_value_is_book_value: false','finance_review_is_accounting_posting_authorization: false','request_time_schema_mutation: false'],'Build 28 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'):
    req(forbidden not in upper,f'Build 28 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 28 endpoint must expose no POST handler')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 28 page must contain exactly one H1')
hasall(page,['Release 467 Build 28','Inventory ↔ Finance Valuation Readiness','Operational inventory value is not book value','missing cost or provenance fails closed'],'Build 28 page')
hasall(client,['/api/admin/inventory-finance-valuation-readiness','Read-only; no Inventory cost/quantity mutation','unvalued_on_hand','current_cost_unreconciled'],'Build 28 client')
req("method:'POST'" not in client.replace(' ',''),'Build 28 client must not POST')
req('/admin/inventory-finance-valuation-readiness/' in finance,'Accounting owner workspace must link to Build 28 valuation readiness')
req('/admin/inventory-finance-valuation-readiness/' in inventory,'Inventory owner workspace must link to Build 28 valuation readiness')
req('push:' not in oldwf and 'pull_request:' not in oldwf and 'workflow_dispatch:' in oldwf,'Build 27 proof must be manual-only after Build 28')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 28 gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 28 gate')
print('inventory_current_cost_owner=INVENTORY')
print('positive_on_hand_missing_cost_or_provenance=FAIL_CLOSED_REVIEW')
print('book_tax_value_or_accounting_posting_claim=NONE')
print('inventory_schema_d1_r2_provider_main_production_mutation=NONE')
