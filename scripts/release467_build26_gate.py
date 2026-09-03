#!/usr/bin/env python3
"""Fail-closed source/authority contract for Release 467 Build 26."""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD_DEPLOY=33688892602
TITLE='Order ↔ Inventory Fulfillment Readiness Reconciliation'; MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
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
p=load('current-development-authority.json'); m=load('release467-build26-order-inventory-fulfillment-readiness.json'); mig=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/order-inventory-fulfillment-readiness.js'); client=read('public/js/admin-order-inventory-fulfillment-readiness.js'); page=read('admin/order-inventory-fulfillment-readiness/index.html'); owner=read('admin/order-fulfillment-care/index.html'); oldwf=read('.github/workflows/release467-build25-proof.yml')
req(p.get('release')==467 and int(p.get('build') or 0)>=25,'current pointer must be Release 467 Build 25 or newer')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 proof drifted')
req(m.get('release')==467 and m.get('build')==26 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_ORDER_INVENTORY_FULFILLMENT_READINESS_RECONCILIATION','Build 26 manifest identity drifted')
req(m.get('state') in ('FEATURE_IMPLEMENTED','DEVELOPMENT_GREEN'),'Build 26 manifest state invalid')
for k in ('finished_stock_buildability_additive_promise','inventory_reservation_authorized','inventory_deduction_authorized','automatic_build_authorized','order_mutation_authorized','shipment_mutation_authorized','customer_contact_authorized','schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'): req(m.get(k) is False,f'Build 26 safety drift: {k}')
req(m.get('unclassified_open_demand_fails_closed') is True,'Build 26 unclassified demand must fail closed')
if m.get('state')=='DEVELOPMENT_GREEN':
    req(bool(m.get('accepted_dev_sha')) and bool(m.get('accepted_dev_tree_sha')),'green Build 26 manifest must freeze accepted SHA/tree')
    a=m.get('acceptance') or {}; req(all(a.get(k) for k in ('merged_system_gate_run','merged_build26_proof_run','merged_branch_hygiene_run')),'green Build 26 manifest must freeze accepted run evidence')
    req(int(p.get('build') or 0)>=26 and int(p.get('last_green_build') or 0)>=26,'green Build 26 must advance current pointer')
hasall(api,['onRequestGet as loadSellability','read_only_order_inventory_fulfillment_readiness_reconciliation','finished_stock_supported','buildability_review','demand_unverified','inventory_reservation: false','inventory_deduction: false','automatic_build: false','request_time_schema_mutation: false'], 'Build 26 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'): req(forbidden not in upper,f'Build 26 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 26 endpoint must expose no POST handler')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 26 page must contain exactly one H1')
hasall(page,['Release 467 Build 26','Order ↔ Inventory Fulfillment Readiness','never reserves, deducts, builds, fulfills, ships, or contacts a customer','does not add the two figures into a promised capacity total'],'Build 26 page')
hasall(client,['/api/admin/order-inventory-fulfillment-readiness','no stock reservation/deduction','buildability_review','demand_unverified'],'Build 26 client')
req("method:'POST'" not in client.replace(' ',''),'Build 26 client must not POST')
req('/admin/order-inventory-fulfillment-readiness/' in owner,'Build 18 owner workspace must link to Build 26 readiness')
req('push:' not in oldwf and 'pull_request:' not in oldwf and 'workflow_dispatch:' in oldwf,'Build 25 proof must be retired to manual-only after Build 26')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 26 gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 26 gate'); print('reservation_allocation_mutation=NONE'); print('unclassified_open_demand=FAIL_CLOSED_REVIEW'); print('schema_d1_r2_provider_main_production_mutation=NONE')
