#!/usr/bin/env python3
"""Fail-closed retained contract for Release 467 Build 25."""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE_SHA='a08502e615aa5fdeb29deddec031223215ae1fa3'; BASE_TREE='4e6bc235382a9125f64ed15ecebf488fbfe0fbdd'
ACCEPTED_SHA='a57f632898bebfd4bf3f6be39c99857a8a9da701'; ACCEPTED_TREE='33ff551739099ced69c12e826b5b4fbe477623ab'; ACCEPTED_SYSTEM=33758969424; ACCEPTED_PROOF=33758969830; ACCEPTED_HYGIENE=33758969440
PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD_DEPLOY=33688892602
TITLE='Finance ↔ Product/Inventory Unit-Economics Readiness'; MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
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
p=load('current-development-authority.json'); m=load('release467-build25-finance-product-inventory-unit-economics.json'); mig=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/finance-product-inventory-unit-economics.js'); client=read('public/js/admin-finance-product-inventory-unit-economics.js'); page=read('admin/finance-product-inventory-unit-economics/index.html'); sellability=read('admin/storefront-inventory-sellability/index.html')
pointer_build=int(p.get('build') or 0)
req(p.get('release')==467 and pointer_build>=25,'current pointer must be Release 467 Build 25 or newer')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 proof drifted')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(p.get(k) is False,f'current pointer safety drift: {k}')
req(m.get('release')==467 and m.get('build')==25 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_CROSS_MODULE_UNIT_ECONOMICS_READINESS','Build 25 manifest identity drifted')
req(m.get('state')=='DEVELOPMENT_GREEN' and m.get('accepted_dev_sha')==ACCEPTED_SHA and m.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'Build 25 accepted runtime evidence drifted')
a=m.get('acceptance') or {}; req(a.get('merged_system_gate_run')==ACCEPTED_SYSTEM and a.get('merged_build25_proof_run')==ACCEPTED_PROOF and a.get('merged_branch_hygiene_run')==ACCEPTED_HYGIENE,'Build 25 accepted run evidence drifted')
for k in ('accounting_profit_claimed','target_margin_defined','economics_review_is_authorization','automatic_price_mutation','automatic_product_mutation','automatic_inventory_mutation','accounting_posting_authorized','public_offer_rule_changed','schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(m.get(k) is False,f'Build 25 manifest safety drift: {k}')
if pointer_build==25:
    req(p.get('title')==TITLE and p.get('state')=='DEVELOPMENT_GREEN','direct Build 25 pointer identity/state drifted')
    req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 25 source base drifted')
    req(p.get('accepted_dev_sha')==ACCEPTED_SHA and p.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'Build 25 pointer accepted runtime drifted')
    req(p.get('last_green_build')==25 and p.get('last_green_dev_sha')==ACCEPTED_SHA and p.get('last_green_dev_tree_sha')==ACCEPTED_TREE,'Build 25 pointer latest green SHA/tree drifted')
    req(p.get('last_green_system_gate_run')==ACCEPTED_SYSTEM and p.get('last_green_build_proof_run')==ACCEPTED_PROOF and p.get('last_green_branch_hygiene_run')==ACCEPTED_HYGIENE,'Build 25 pointer accepted run evidence drifted')
else:
    req('release467-build25-finance-product-inventory-unit-economics.json' in (p.get('current_release_authorities') or []),'newer pointer lost Build 25 authority')
    req(int(p.get('last_green_build') or 0)>=25,'newer pointer lost Build 25 green provenance')
hasall(api,['readAccountingItemCosting','onRequestGet as loadSellability','read_only_cross_module_unit_economics_readiness','accounting_profit_claimed: false','target_margin_defined: false','economics_review_is_authorization: false','accounting_posting: false','request_time_schema_mutation: false','estimated_price_headroom_cents','costing_unverified'],'Build 25 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'): req(forbidden not in upper,f'Build 25 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 25 endpoint must expose no POST handler')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 25 page must contain exactly one H1')
hasall(page,['Release 467 Build 25','Finance ↔ Product/Inventory Unit-Economics Readiness','It is not accounting profit','does not change prices'],'Build 25 page')
hasall(client,['/api/admin/finance-product-inventory-unit-economics?month=','Read-only; no price, Product, Inventory, public offer or accounting mutation occurred.','nonpositive_estimated_headroom','costing_unverified'],'Build 25 client')
req("method:'POST'" not in client.replace(' ',''),'Build 25 client must not POST')
req('/admin/finance-product-inventory-unit-economics/' in sellability,'Build 24 sellability workspace must retain Build 25 economics readiness link')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 25 retained gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 25 retained gate'); print('accepted_runtime='+ACCEPTED_SHA); print('accounting_profit_claimed=FALSE'); print('target_margin_defined=FALSE'); print('schema_d1_r2_provider_main_production_mutation=NONE')
