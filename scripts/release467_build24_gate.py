#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 24 — Storefront ↔ Inventory Sellability Reconciliation."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE_SHA='9e61f20635b963d77c0b5c0c7bf7fb37d8a00d4d'; BASE_TREE='323f9af57b905ea3e762e01cdbad2976197ea930'; B23_SYSTEM=33701882478; B23_PROOF=33701882382; B23_HYGIENE=33701882340
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
def changed():
    try:
        base=subprocess.check_output(['git','merge-base','HEAD','origin/dev'],cwd=ROOT,text=True).strip(); out=subprocess.check_output(['git','diff','--name-only',f'{base}...HEAD'],cwd=ROOT,text=True); return [x for x in out.splitlines() if x]
    except Exception as e: FAIL.append(f'could not calculate changed files: {e}'); return []
def hasall(body,tokens,label):
    for token in tokens: req(token in body,f'{label} marker missing: {token}')
p=load('current-development-authority.json'); m=load('release467-build24-storefront-inventory-sellability-reconciliation.json'); mig=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/storefront-inventory-sellability.js'); client=read('public/js/admin-storefront-inventory-sellability.js'); page=read('admin/storefront-inventory-sellability/index.html'); quality=read('admin/storefront-quality/index.html'); inventory=read('admin/inventory-intelligence/index.html')
req(p.get('release')==467 and p.get('build')==24 and p.get('title')==TITLE,'Build 24 pointer identity drifted')
req(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN'),'Build 24 pointer state invalid')
req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 24 source base drifted')
if p.get('state')=='DEVELOPMENT_CANDIDATE':
    req(p.get('last_green_build')==23 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 24 must start from final Build 23 closure')
    req(p.get('last_green_system_gate_run')==B23_SYSTEM and p.get('last_green_build_proof_run')==B23_PROOF and p.get('last_green_branch_hygiene_run')==B23_HYGIENE,'Build 23 final closure run evidence drifted')
else:
    req(p.get('last_green_build')==24,'Build 24 green pointer must identify Build 24 as latest green build')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 proof drifted')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(p.get(k) is False,f'Build 24 pointer safety drift: {k}')
req(m.get('release')==467 and m.get('build')==24 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_CROSS_MODULE_SELLABILITY_RECONCILIATION','Build 24 manifest identity drifted')
pr=m.get('predecessor') or {}; req(pr.get('merged_dev_sha')==BASE_SHA and pr.get('merged_dev_tree_sha')==BASE_TREE and pr.get('system_gate_run')==B23_SYSTEM and pr.get('build23_proof_run')==B23_PROOF and pr.get('branch_hygiene_run')==B23_HYGIENE,'Build 24 predecessor evidence drifted')
req(pr.get('production_main_sha')==PROD and pr.get('production_tree_sha')==PROD_TREE and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 24 Production provenance drifted')
for k in ('sellability_supported_is_authorization','fulfillment_unverified_is_automatic_error','automatic_unpublish','automatic_product_mutation','automatic_inventory_mutation','automatic_resource_link_mutation','public_offer_rule_changed','schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(m.get(k) is False,f'Build 24 manifest safety drift: {k}')
hasall(api,["onRequestGet as loadAdminProducts","read_only_cross_module_sellability_reconciliation","automatic_unpublish: false","automatic_product_mutation: false","automatic_inventory_mutation: false","public_offer_rule_changed: false","request_time_schema_mutation: false","fulfillment_unverified","sellability_supported"],'Build 24 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'): req(forbidden not in upper,f'Build 24 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 24 endpoint must expose no POST handler')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 24 page must contain exactly one H1')
hasall(page,['Release 467 Build 24','Storefront ↔ Inventory Sellability Reconciliation','does not unpublish Products','Sellability supported'],'Build 24 page')
hasall(client,['/api/admin/storefront-inventory-sellability','Read-only; no Product, Inventory or public offer mutation occurred.','fulfillment_unverified','sellability_supported'],'Build 24 client')
req("method:'POST'" not in client.replace(' ',''),'Build 24 client must not POST')
req('/admin/storefront-inventory-sellability/' in quality,'Storefront Quality must link Build 24 reconciliation')
req('/admin/storefront-inventory-sellability/' in inventory,'Inventory Intelligence must link Build 24 reconciliation')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if p.get('state')=='DEVELOPMENT_CANDIDATE':
    allowed={'.github/workflows/release467-build23-proof.yml','.github/workflows/release467-build24-proof.yml','AI_HANDOFF.md','MARKDOWN_INDEX.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','admin/inventory-intelligence/index.html','admin/storefront-inventory-sellability/index.html','admin/storefront-quality/index.html','css/admin-storefront-inventory-sellability.css','current-development-authority.json','docs/operations/RELEASE_467_BUILD_24_STOREFRONT_INVENTORY_SELLABILITY_RECONCILIATION.md','functions/api/admin/storefront-inventory-sellability.js','public/js/admin-storefront-inventory-sellability.js','release467-build24-storefront-inventory-sellability-reconciliation.json','scripts/release467_build23_gate.py','scripts/release467_build24_gate.py'}
    ch=changed(); req(not [x for x in ch if x not in allowed],f'files outside Build 24 scope changed: {[x for x in ch if x not in allowed]}'); req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 24 must not change schema/migrations')
if FAIL:
    print('FAIL Release 467 Build 24 Storefront Inventory Sellability Reconciliation gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 24 Storefront Inventory Sellability Reconciliation gate'); print('storefront_inventory_sellability=READ_ONLY'); print('sellability_supported_authorization=FALSE'); print('automatic_unpublish=FALSE'); print('public_offer_rule_changed=FALSE'); print('schema_d1_r2_provider_main_production_mutation=NONE')
