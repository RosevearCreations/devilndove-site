#!/usr/bin/env python3
"""Release 467 Build 150 — Orders, Fulfillment & Buyer Communication Workspace gate."""
from pathlib import Path
import json, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def req(ok, msg):
    if not ok: FAIL.append(msg)
def read(path):
    p = ROOT / path
    return p.read_text(encoding='utf-8') if p.exists() else ''
def load(path):
    try: return json.loads(read(path) or '{}')
    except Exception as exc:
        FAIL.append(f'{path} invalid JSON: {exc}')
        return {}

SHA='6ff380f581bce93a42aacb982ba4c686baa5c5c4'
TREE='c1829f6371b3d5b7cd771f9f170260f53d5a7e08'
PROOFS={
    'system_gate_run':34776427862,
    'current_application_quality_run':34776427860,
    'it_admin_runtime_proof_run':34776427885,
    'branch_hygiene_run':34776427874,
}
PAGES=34776524835
LIVE=34776571549
TITLE='Orders, Fulfillment & Buyer Communication Workspace'

closure=load('release467-build149-seller-listing-manager-fast-product-editing.json')
pointer=load('current-development-authority.json')
manifest=load('migrations/canonical/manifest.json')
page=read('admin/orders/index.html')
legacy_page=read('admin/order-fulfillment-care/index.html')
orders_api=read('functions/api/admin/orders.js')
workspace=read('public/js/admin-orders-workspace-build150.js')
css=read('css/admin-orders-workspace-build150.css')
fulfilment=read('functions/api/admin/contracts/operations-order-fulfillment-workflow-write.js')
tracking=read('functions/api/admin/contracts/operations-order-tracking-audit-write.js')
bridge=read('public/js/admin-order-fulfillment-idempotency-bridge-build150.js')
legacy_orders=read('public/js/admin-orders.js')
roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')

req(closure.get('release')==467 and closure.get('build')==149, 'Build 149 closure identity is wrong')
req(closure.get('accepted_dev_sha')==SHA and closure.get('accepted_dev_tree_sha')==TREE, 'Build 149 accepted SHA/tree drifted')
req((closure.get('acceptance') or {})==PROOFS, 'Build 149 Development proof set drifted')
final=closure.get('final_closure') or {}
req(final.get('dev_sha')==SHA and final.get('tree_sha')==TREE, 'Build 149 final closure SHA/tree drifted')
req((final.get('proofs') or {})==PROOFS, 'Build 149 final proof set drifted')
req(final.get('ingested_by_build')==150, 'Build 149 closure must be ingested by Build 150')
prod=closure.get('production_checkpoint') or {}
req(prod.get('state')=='PRODUCTION_GREEN', 'Build 149 Production closure is not GREEN')
req(prod.get('main_sha')==SHA and prod.get('tree_sha')==TREE, 'Build 149 Production SHA/tree drifted')
req(prod.get('production_pages_deploy_run')==PAGES, 'Build 149 Production Pages proof drifted')
req(prod.get('production_live_resource_integrity_run')==LIVE, 'Build 149 live-resource proof drifted')

req(pointer.get('release')==467 and pointer.get('build')==149, 'current authority must point to verified Build 149 baseline')
req(pointer.get('title')=='Seller Listing Manager & Fast Product Editing', 'Build 149 current authority title drifted')
req(pointer.get('accepted_dev_sha')==SHA and pointer.get('accepted_dev_tree_sha')==TREE, 'current authority accepted Build 149 SHA/tree drifted')
req((pointer.get('acceptance') or {})==PROOFS, 'current authority Build 149 proof set drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}
req(last.get('build')==149 and last.get('dev_sha')==SHA and last.get('tree_sha')==TREE, 'restart authority must preserve Build 149 exact checkpoint')
current_prod=pointer.get('production_checkpoint') or {}
req(current_prod.get('build')==149 and current_prod.get('main_sha')==SHA and current_prod.get('tree_sha')==TREE, 'Production baseline must be Build 149')
req(current_prod.get('production_pages_deploy_run')==PAGES and current_prod.get('production_live_resource_integrity_run')==LIVE, 'Build 149 Production proof IDs drifted')
req(pointer.get('next_build')==150 and pointer.get('next_build_title')==TITLE, 'Build 150 next-build authority missing')
req(pointer.get('next_build_state')=='AUTHORIZED_IN_PROGRESS', 'Build 150 must remain an authorized candidate before external proof')
req(pointer.get('promotion_state')=='BUILD150_CANDIDATE_NOT_YET_VERIFIED', 'Build 150 candidate must not self-claim Production')
req((pointer.get('current_release_authorities') or [None])[0]=='release467-build149-seller-listing-manager-fast-product-editing.json', 'Build 149 closure must lead the current authority chain')
for key,expected in {
    'stripe_development':'HOLD_EXTERNAL','paypal_sandbox':'HOLD_EXTERNAL','social_oauth':'HOLD_EXTERNAL',
    'caip_private_media':'EVIDENCE_DEPENDENT','cloudflare_access_service_token':'HOLD_EXTERNAL'
}.items(): req((pointer.get('external_lanes') or {}).get(key)==expected, f'external lane {key} drifted')
for key in ('automatic_production_promotion_authorized','request_time_schema_mutation','schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized'):
    req(pointer.get(key) is False, f'{key} must remain false')

expected_migrations=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
req([x.get('file') for x in manifest.get('migrations',[])]==expected_migrations, 'canonical D1 migration authority changed')

req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1, 'Orders page must contain exactly one H1')
for token in ('Release 467 Build 150','id="orderWorkspaceMount"','admin-orders-workspace-build150.css','admin-orders-workspace-build150.js','Detailed Orders &amp; Payments Table'):
    req(token in page, f'Orders page missing Build 150 token: {token}')
for token in ('admin-order-fulfillment-idempotency-bridge-build150.js','Build 150 compatibility boundary','data-order-fulfillment-workflow-build="82"'):
    req(token in legacy_page, f'Retained fulfilment page missing Build 150 compatibility token: {token}')

req('export async function onRequestGet' in orders_api and 'onRequestPost' not in orders_api, 'Build 150 Orders projection must remain GET-only')
for token in ('product_search_text','item_count','GROUP_CONCAT','FROM order_items','product_search_projection'):
    req(token in orders_api, f'Orders Product/SKU search projection missing token: {token}')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE'):
    req(ddl not in orders_api.upper(), f'Orders read projection contains DDL token: {ddl}')

for token in (
    'dd_admin_orders_b150_snapshot_v1','dd_admin_orders_b150_drafts_v1','dd_admin_orders_b150_pending_actions_v1',
    '/api/admin/orders','/api/admin/order-detail?order_id=','/api/admin/order-fulfillment-workflow?limit=120',
    '/api/admin/contracts/operations-order-fulfillment-workflow-write','/api/admin/contracts/operations-order-tracking-audit-write',
    'client_action_id','product_search_text','navigator.onLine','window.print()','Copy message','Not sent to buyer',
    'Retry pending confirmation','confirm(`Confirm live fulfilment change','expected_order_status',
): req(token in workspace, f'Build 150 workspace missing token: {token}')
req('setInterval(' not in workspace, 'Build 150 workspace must not add background polling')
req("window.addEventListener('online'" in workspace and "window.addEventListener('offline'" in workspace, 'Build 150 connectivity state handling missing')
req('@media print' in css and '@media(max-width:620px)' in css, 'Build 150 packing-slip/responsive CSS missing')

for token in ('SAFETY_EXTENSION_BUILD = 150','client_action_id','idempotent_replay','order_status_history','actionMarker','shippingProviderExecution: false','customerMessageSend: false','requestTimeSchemaMutation: false'):
    req(token in fulfilment, f'Fulfilment response-loss guard missing token: {token}')
for forbidden in ('fetch("https://','fetch(\'https://','CREATE TABLE','ALTER TABLE'):
    req(forbidden not in fulfilment, f'Fulfilment contract gained forbidden provider/schema behavior: {forbidden}')

for token in ('BUILD = 150','operations-order-tracking-audit-write','client_action_id','idempotent_replay','expected_order_status','order_status_history','provider_action_executed: false','buyer_message_sent: false','order_status_changed: false','request_time_schema_mutation: false'):
    req(token in tracking, f'Tracking audit contract missing token: {token}')
for forbidden in ('fetch("https://','fetch(\'https://','CREATE TABLE','ALTER TABLE','UPDATE orders SET'):
    req(forbidden not in tracking, f'Tracking audit contract gained forbidden provider/schema/order-status behavior: {forbidden}')

for token in ('dd_admin_ofw_b150_action_ids_v1','operations-order-fulfillment-workflow-write','client_action_id','Preserve the stable ID'):
    req(token in bridge, f'Legacy fulfilment idempotency bridge missing token: {token}')
req('setInterval(' not in bridge, 'Legacy fulfilment bridge must not add polling')

for token in ('product_search_text','dd:order-updated'):
    req(token in legacy_orders, f'Legacy Orders fallback missing Build 150 compatibility token: {token}')

for token in ('# Build 150 — Orders, Fulfillment & Buyer Communication Workspace — ACTIVE','client_action_id','order_status_history','no new D1 migration'):
    req(token in roadmap, f'Build 150 roadmap truth missing token: {token}')

# Syntax-check every Build 150 JavaScript endpoint/client touched by this candidate.
for rel in (
    'functions/api/admin/orders.js',
    'functions/api/admin/contracts/operations-order-fulfillment-workflow-write.js',
    'functions/api/admin/contracts/operations-order-tracking-audit-write.js',
    'public/js/admin-orders-workspace-build150.js',
    'public/js/admin-order-fulfillment-idempotency-bridge-build150.js',
    'public/js/admin-orders.js',
):
    target=ROOT/rel
    if not target.is_file():
        FAIL.append(f'Build 150 syntax target missing: {rel}')
        continue
    result=subprocess.run(['node','--check',str(target)],cwd=ROOT,text=True,capture_output=True)
    req(result.returncode==0, f'JavaScript syntax failed for {rel}: {(result.stderr or result.stdout).strip()}')

if FAIL:
    print('RELEASE 467 BUILD 150 GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 150 GATE: PASS')
print('Build 149 six-proof Production closure: INGESTED BY BUILD 150')
print('Orders workspace: PRODUCT-AWARE SEARCH + SELLER DETAIL + LOCAL DRAFTS + PRINTABLE PACKING SLIP + TIMELINE')
print('Fulfilment/tracking: EXPLICIT LIVE CONFIRMATION + CLIENT_ACTION_ID RESPONSE-LOSS RECOVERY')
print('Buyer messaging: COPY-ONLY / NO AUTOMATIC SEND')
print('Build 150 JavaScript syntax: CHECKED')
print('Canonical D1: 0001-0004 / UNCHANGED')
print('Provider / R2 / accounting / payment / refund execution added: NONE')
