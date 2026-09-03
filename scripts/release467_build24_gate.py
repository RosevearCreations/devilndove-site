#!/usr/bin/env python3
"""Fail-closed retained contract for Release 467 Build 24."""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
ACCEPTED_SHA='b04aeb89d4d22b1b158244c86256ad39f31da70b'; ACCEPTED_TREE='f70c733f9544764bd7d68af3d85383e133ee77db'; ACCEPTED_SYSTEM=33703326878; ACCEPTED_PROOF=33703326916; ACCEPTED_HYGIENE=33703326867
FINAL_SHA='a08502e615aa5fdeb29deddec031223215ae1fa3'; FINAL_TREE='4e6bc235382a9125f64ed15ecebf488fbfe0fbdd'; FINAL_SYSTEM=33703653554; FINAL_PROOF=33703653563; FINAL_HYGIENE=33703653564
PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD_DEPLOY=33688892602
TITLE='Storefront ↔ Inventory Sellability Reconciliation'; MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
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
p=load('current-development-authority.json'); m=load('release467-build24-storefront-inventory-sellability-reconciliation.json'); mig=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/storefront-inventory-sellability.js'); client=read('public/js/admin-storefront-inventory-sellability.js'); page=read('admin/storefront-inventory-sellability/index.html')
pointer_build=int(p.get('build') or 0)
req(p.get('release')==467 and pointer_build>=24,'current pointer must be Release 467 Build 24 or newer')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 proof drifted')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(p.get(k) is False,f'current pointer safety drift: {k}')
req(m.get('release')==467 and m.get('build')==24 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_CROSS_MODULE_SELLABILITY_RECONCILIATION','Build 24 manifest identity drifted')
req(m.get('state')=='DEVELOPMENT_GREEN' and m.get('accepted_dev_sha')==ACCEPTED_SHA and m.get('accepted_dev_tree_sha')==ACCEPTED_TREE,'Build 24 accepted runtime evidence drifted')
a=m.get('acceptance') or {}; req(a.get('merged_system_gate_run')==ACCEPTED_SYSTEM and a.get('merged_build24_proof_run')==ACCEPTED_PROOF and a.get('merged_branch_hygiene_run')==ACCEPTED_HYGIENE,'Build 24 accepted run evidence drifted')
if pointer_build==24:
    req(p.get('title')==TITLE and p.get('state')=='DEVELOPMENT_GREEN','direct Build 24 pointer identity/state drifted')
else:
    req('release467-build24-storefront-inventory-sellability-reconciliation.json' in (p.get('current_release_authorities') or []),'newer pointer lost Build 24 authority')
    req(int(p.get('last_green_build') or 0)>=24,'newer pointer lost Build 24 green provenance')
    if pointer_build==25 and p.get('state')=='DEVELOPMENT_CANDIDATE':
        req(p.get('source_base_sha')==FINAL_SHA and p.get('source_base_tree_sha')==FINAL_TREE,'Build 25 candidate must start from final Build 24 closure SHA/tree')
        req(p.get('last_green_dev_sha')==FINAL_SHA and p.get('last_green_dev_tree_sha')==FINAL_TREE,'Build 25 candidate must retain final Build 24 closure SHA/tree')
        req(p.get('last_green_system_gate_run')==FINAL_SYSTEM and p.get('last_green_build_proof_run')==FINAL_PROOF and p.get('last_green_branch_hygiene_run')==FINAL_HYGIENE,'Build 25 candidate must retain final Build 24 closure runs')
for k in ('sellability_supported_is_authorization','fulfillment_unverified_is_automatic_error','automatic_unpublish','automatic_product_mutation','automatic_inventory_mutation','automatic_resource_link_mutation','public_offer_rule_changed','schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(m.get(k) is False,f'Build 24 manifest safety drift: {k}')
hasall(api,["onRequestGet as loadAdminProducts","read_only_cross_module_sellability_reconciliation","automatic_unpublish: false","automatic_product_mutation: false","automatic_inventory_mutation: false","public_offer_rule_changed: false","request_time_schema_mutation: false","fulfillment_unverified","sellability_supported"],'Build 24 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'): req(forbidden not in upper,f'Build 24 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 24 endpoint must expose no POST handler')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 24 page must contain exactly one H1')
hasall(client,['/api/admin/storefront-inventory-sellability','Read-only; no Product, Inventory or public offer mutation occurred.','fulfillment_unverified','sellability_supported'],'Build 24 client')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 24 retained gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 24 retained gate'); print('accepted_runtime='+ACCEPTED_SHA); print('final_closure='+FINAL_SHA); print('schema_d1_r2_provider_main_production_mutation=NONE')
