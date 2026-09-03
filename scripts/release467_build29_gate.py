#!/usr/bin/env python3
"""Fail-closed source/authority contract for Release 467 Build 29."""
from __future__ import annotations
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
BASE_SHA='1c97c63b3e7dbf81a4861fa77f3f93cc448e275a'; BASE_TREE='ffac7ef6367414d4e9a8e090ff9c63d4b2df42ed'
BUILD28_ACCEPTED_SHA='d9717bb81a52584abe1a45c83fc67889a5770f35'; BUILD28_ACCEPTED_TREE='88f17be8a85cce4e588ef5171004ad28c875332e'
PROD='055cbc973c667b35a209c7ea207779089f6fed3a'; PROD_TREE='550272841e764d77fc21297abede3d4cae1aaea0'; PROD_DEPLOY=33688892602
TITLE='Order ↔ Production Release Readiness Reconciliation'
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
p=load('current-development-authority.json'); prev=load('release467-build28-inventory-finance-valuation-readiness.json'); m=load('release467-build29-order-production-release-readiness.json'); mig=load('migrations/canonical/manifest.json')
api=read('functions/api/admin/order-production-release-readiness.js'); client=read('public/js/admin-order-production-release-readiness.js'); page=read('admin/order-production-release-readiness/index.html'); orders=read('admin/order-fulfillment-care/index.html'); oldwf=read('.github/workflows/release467-build28-proof.yml')
req(p.get('release')==467 and int(p.get('build') or 0)>=28,'current pointer must be Release 467 Build 28 or newer')
req(int(p.get('last_green_build') or 0)>=28,'current pointer must retain Build 28 green provenance')
req(p.get('main_source_head_last_verified')==PROD and p.get('production_tree_last_verified')==PROD_TREE and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production Build 20 proof drifted')
req(prev.get('state')=='DEVELOPMENT_GREEN' and prev.get('accepted_dev_sha')==BUILD28_ACCEPTED_SHA and prev.get('accepted_dev_tree_sha')==BUILD28_ACCEPTED_TREE,'Build 28 accepted runtime drifted')
a=prev.get('acceptance') or {}
req(a.get('merged_system_gate_run')==33770297641 and a.get('merged_build28_proof_run')==33770297583 and a.get('merged_branch_hygiene_run')==33770297625,'Build 28 accepted run evidence drifted')
req(m.get('release')==467 and m.get('build')==29 and m.get('title')==TITLE and m.get('role')=='READ_ONLY_ORDER_PRODUCTION_RELEASE_READINESS_RECONCILIATION','Build 29 manifest identity drifted')
req(m.get('state') in ('FEATURE_IMPLEMENTED','DEVELOPMENT_GREEN'),'Build 29 manifest state invalid')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE,'Build 29 source base drifted')
for k in ('exact_gap_preview_only','operator_requested_preview_only','unclassified_demand_fails_closed'):
    req(m.get(k) is True,f'Build 29 fail-closed/ownership drift: {k}')
for k in ('production_preview_is_post_authorization','automatic_production_authorized','production_post_authorized','inventory_reservation_authorized','inventory_deduction_authorized','order_mutation_authorized','shipment_mutation_authorized','customer_contact_authorized','schema_change_authorized','request_time_schema_mutation','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):
    req(m.get(k) is False,f'Build 29 safety drift: {k}')
hasall(api,['onRequestGet as loadFulfillmentReadiness','onRequestGet as loadProductionPreview','read_only_order_production_release_readiness_reconciliation','production_preview_required','production_preview_ready_for_review','production_blocked','demand_unverified','exact_gap_preview_only: true','production_post_authorized: false','inventory_reservation: false','inventory_deduction: false','request_time_schema_mutation: false'],'Build 29 API')
req("onRequestPost as" not in api and 'export async function onRequestPost' not in api,'Build 29 endpoint must expose/import no POST handler')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'):
    req(forbidden not in upper,f'Build 29 API must contain no DDL/DML: {forbidden}')
req('finished_stock_gap_units' in api and "url.searchParams.set('output_quantity', String(outputQuantity))" in api,'Build 29 must preview the exact recognized finished-stock gap')
req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,'Build 29 page must contain exactly one H1')
hasall(page,['Release 467 Build 29','Order ↔ Production Release Readiness','A clear preview is not permission to post production'],'Build 29 page')
hasall(client,['/api/admin/order-production-release-readiness','Check exact production preview','no production post, inventory reservation/deduction'],'Build 29 client')
req("method:'POST'" not in client.replace(' ',''),'Build 29 client must not POST')
req('/admin/order-production-release-readiness/' in orders,'Order Fulfillment owner workspace must link to Build 29 readiness')
req('push:' not in oldwf and 'pull_request:' not in oldwf and 'workflow_dispatch:' in oldwf,'Build 28 proof must be manual-only after Build 29')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
if FAIL:
    print('FAIL Release 467 Build 29 gate'); [print(f'- {x}') for x in FAIL]; sys.exit(1)
print('PASS Release 467 Build 29 gate')
print('open_order_gap_owner=BUILD_26_ORDER_INVENTORY')
print('production_preview_owner=EXISTING_PRODUCT_PRODUCTION_RELEASE')
print('operator_requested_exact_gap_preview=READ_ONLY')
print('production_inventory_order_shipment_customer_provider_schema_mutation=NONE')
