#!/usr/bin/env python3
"""Release 467 Build 151 — Gifting, Custom Work, Local Pickup & Event Selling gate."""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path):
    p=ROOT/path
    return p.read_text(encoding='utf-8') if p.exists() else ''
def load(path):
    try: return json.loads(read(path) or '{}')
    except Exception as exc: FAIL.append(f'{path} invalid JSON: {exc}'); return {}

DEV_SHA='33d46f701adb839525561114a31abcd29943d28f'
MAIN_SHA='531e303d32d426d2db6986ec5c3d466455612ee3'
TREE='2f7add90d513a2e9548865f04d97e69b0ae3630e'
PROOFS={'system_gate_run':34802545653,'current_application_quality_run':34802545673,'it_admin_runtime_proof_run':34802545668,'branch_hygiene_run':34802545660}
PAGES=34802707901; LIVE=34802759988
TITLE='Gifting, Custom Work, Local Pickup & Event Selling'

closure=load('release467-build150-orders-fulfillment-buyer-communication-workspace.json')
pointer=load('current-development-authority.json')
manifest=load('migrations/canonical/manifest.json')
checkout=read('checkout/index.html'); checkout_api=read('functions/api/checkout-create-order.js'); checkout_gift=read('public/js/checkout-gifting-build151.js')
custom_page=read('custom-request/index.html'); custom_client=read('public/js/custom-request-intake.js'); custom_api=read('functions/api/custom-request.js')
admin_page=read('admin/custom-request/index.html'); custom_read=read('functions/api/admin/contracts/operations-custom-work-build151-read.js'); custom_ui=read('public/js/admin-custom-work-build151.js'); custom_css=read('css/admin-custom-work-build151.css')
gift=read('public/js/gift-card-storefront.js'); events=read('events/index.html'); roadmap=read('PROJECT_STATUS_AND_ROADMAP.md')

req(closure.get('release')==467 and closure.get('build')==150,'Build 150 closure identity is wrong')
req(closure.get('accepted_dev_sha')==DEV_SHA and closure.get('accepted_dev_tree_sha')==TREE,'Build 150 accepted Development SHA/tree drifted')
req((closure.get('acceptance') or {})==PROOFS,'Build 150 Development proof set drifted')
final=closure.get('final_closure') or {}; prod=closure.get('production_checkpoint') or {}
req(final.get('state')=='EXACT_BRANCH_HEAD_FOUR_PROOF_GREEN' and final.get('dev_sha')==DEV_SHA and final.get('tree_sha')==TREE,'Build 150 final Development closure drifted')
req((final.get('proofs') or {})==PROOFS and final.get('ingested_by_build')==151,'Build 150 closure is not correctly ingested by Build 151')
req(prod.get('state')=='PRODUCTION_GREEN' and prod.get('main_sha')==MAIN_SHA and prod.get('tree_sha')==TREE,'Build 150 Production closure drifted')
req(prod.get('production_pages_deploy_run')==PAGES and prod.get('production_live_resource_integrity_run')==LIVE,'Build 150 Production proof IDs drifted')

req(pointer.get('release')==467 and pointer.get('build')==150,'current authority must point to Build 150 baseline')
req(pointer.get('title')=='Orders, Fulfillment & Buyer Communication Workspace','Build 150 authority title drifted')
req(pointer.get('accepted_dev_sha')==DEV_SHA and pointer.get('accepted_dev_tree_sha')==TREE,'current authority Build 150 SHA/tree drifted')
req((pointer.get('acceptance') or {})==PROOFS,'current authority Build 150 proofs drifted')
last=(pointer.get('restart_integrity') or {}).get('last_fully_verified') or {}; current_prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==150 and last.get('dev_sha')==DEV_SHA and last.get('tree_sha')==TREE,'restart authority must preserve Build 150 exact checkpoint')
req(current_prod.get('build')==150 and current_prod.get('main_sha')==MAIN_SHA and current_prod.get('tree_sha')==TREE,'Production authority must preserve Build 150 exact checkpoint')
req(current_prod.get('production_pages_deploy_run')==PAGES and current_prod.get('production_live_resource_integrity_run')==LIVE,'Build 150 Production authority proof IDs drifted')
req(pointer.get('next_build')==151 and pointer.get('next_build_title')==TITLE,'Build 151 next-build authority missing')
req(pointer.get('next_build_state')=='AUTHORIZED_IN_PROGRESS','Build 151 must remain an authorized candidate before external proof')
req(pointer.get('promotion_state')=='BUILD151_CANDIDATE_NOT_YET_VERIFIED','Build 151 candidate must not self-claim Production')
req((pointer.get('current_release_authorities') or [None])[0]=='release467-build150-orders-fulfillment-buyer-communication-workspace.json','Build 150 closure must lead current authority chain')
for key,expected in {'stripe_development':'HOLD_EXTERNAL','paypal_sandbox':'HOLD_EXTERNAL','social_oauth':'HOLD_EXTERNAL','caip_private_media':'EVIDENCE_DEPENDENT','cloudflare_access_service_token':'HOLD_EXTERNAL'}.items(): req((pointer.get('external_lanes') or {}).get(key)==expected,f'external lane {key} drifted')
for key in ('automatic_production_promotion_authorized','request_time_schema_mutation','schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized'): req(pointer.get(key) is False,f'{key} must remain false')

expected_migrations=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
req([x.get('file') for x in manifest.get('migrations',[])]==expected_migrations,'canonical D1 migration authority changed')

req(len(re.findall(r'<h1(?:\s|>)',checkout,re.I))==1,'Checkout page must contain exactly one H1')
for token in ('Release 467 Build 151','id="fulfillment_method"','value="pickup"','checkout-gifting-build151.js?v=467b151','Event/market safety'):
    req(token in checkout,f'Checkout missing Build 151 token: {token}')
for token in ('normalizeFulfillmentType(items, requested)','=== "pickup"','authoritativeShippingCents','inventory_revalidated: true','pricing_revalidated: true','request_time_schema_mutation: false'):
    req(token in checkout_api,f'Deployed checkout authority missing pickup/live-safety token: {token}')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE'):
    req(ddl not in checkout_api.upper(),f'Deployed checkout gained request-time DDL token: {ddl}')
for token in ('dd_checkout_gift_context_v151','[Build 151 gift/pickup/event context]','b151RecipientName','b151Occasion','b151WrapPreference','b151RequestedByDate','b151EventContext','fulfillment_method','unique stock is revalidated live','addEventListener(\'submit\',applyToNotes,true)'):
    req(token in checkout_gift,f'Checkout gift/handoff overlay missing token: {token}')
req('fetch(' not in checkout_gift and 'setInterval(' not in checkout_gift,'Checkout gift overlay must not perform network/background execution')

req(len(re.findall(r'<h1(?:\s|>)',custom_page,re.I))==1,'Custom request page must contain exactly one H1')
for token in ('name="gift_intent"','name="recipient_name"','name="occasion"','name="gift_message"','name="wrap_preference"','name="fulfillment_preference"','name="event_context"','Availability rule'):
    req(token in custom_page,f'Custom request intake missing token: {token}')
for token in ('gift_intent','fulfillment_preference','event_context','build151_context = true'):
    req(token in custom_client,f'Custom request client missing Build 151 token: {token}')
for token in ('function build151Context','[Build 151 gift/pickup/event context]','Gift intent=','Fulfillment=','context_preserved_in_existing_message_authority','request_time_schema_mutation: false','automatic_order_created: false','stock_reserved: false','provider_action_executed: false'):
    req(token in custom_api,f'Custom request API missing Build 151 safety/context token: {token}')
for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE'):
    req(ddl not in custom_api.upper(),f'Custom request intake gained request-time DDL token: {ddl}')

req(len(re.findall(r'<h1(?:\s|>)',admin_page,re.I))==1,'Admin Custom Work page must contain exactly one H1')
for token in ('Release 467 Build 151','id="customWorkBuild151Mount"','admin-custom-work-build151.css?v=467b151','admin-custom-work-build151.js?v=467b151','Event and market selling is live-authority-only'):
    req(token in admin_page,f'Admin Custom Work page missing token: {token}')
for token in ("BUILD = 151","operations-custom-work-build151-read","request_time_schema_mutation: false","event_offline_stock_authority: false","event_unique_stock_requires_live_revalidation: true","provider_execution: false","provider_publication: false","pickup_orders","gift_cards"):
    req(token in custom_read,f'Build 151 read contract missing token: {token}')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','DELETE FROM','UPDATE ORDERS','UPDATE CUSTOM_'):
    req(forbidden not in custom_read.upper(),f'Build 151 read contract contains mutation token: {forbidden}')
for token in ('operations-custom-work-build151-read','Event or market conversations never reserve unique stock offline','navigator.onLine','Refresh live view','pickup_orders','gift_cards','window.addEventListener(\'online\'','window.addEventListener(\'offline\''):
    req(token in custom_ui,f'Build 151 Custom Work UI missing token: {token}')
req('setInterval(' not in custom_ui,'Build 151 Custom Work UI must not add background polling')
for forbidden in ('method:\'POST\'','method: "POST"','method:\'PUT\'','method:\'DELETE\''):
    req(forbidden not in custom_ui,f'Build 151 Custom Work UI gained mutation request: {forbidden}')
req('@media(max-width:620px)' in custom_css,'Build 151 Custom Work mobile CSS missing')

for token in ('Release 467 Build 151','storeGiftCardOccasion','storeGiftCardDeliveryDate','requested_delivery_date','pending activation','no automatic provider send'):
    req(token in gift,f'Gift-card Build 151 expansion missing token: {token}')
req('setInterval(' not in gift,'Gift-card storefront must not add background polling')

req(len(re.findall(r'<h1(?:\s|>)',events,re.I))==1,'Events page must contain exactly one H1')
for token in ('Release 467 Build 151 event handoff','Event availability stays live-authoritative','does <strong>not</strong> reserve a one-of-a-kind item','fulfillment_preference=event','Check live shop availability'):
    req(token in events,f'Events page missing Build 151 live-stock token: {token}')

for token in ('# Build 151 — Gifting, Custom Work, Local Pickup & Event Selling — ACTIVE','Build 150 — Orders, Fulfillment & Buyer Communication Workspace** is fully Development + Production GREEN','unique/event stock must be revalidated live','no new D1 migration'):
    req(token in roadmap,f'Build 151 roadmap truth missing token: {token}')

for rel in ('public/js/checkout-gifting-build151.js','public/js/custom-request-intake.js','functions/api/custom-request.js','functions/api/admin/contracts/operations-custom-work-build151-read.js','public/js/admin-custom-work-build151.js','public/js/gift-card-storefront.js'):
    target=ROOT/rel
    if not target.is_file(): FAIL.append(f'Build 151 syntax target missing: {rel}'); continue
    result=subprocess.run(['node','--check',str(target)],cwd=ROOT,text=True,capture_output=True)
    req(result.returncode==0,f'JavaScript syntax failed for {rel}: {(result.stderr or result.stdout).strip()}')

if FAIL:
    print('RELEASE 467 BUILD 151 GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 151 GATE: PASS')
print('Build 150 six-proof Production closure: INGESTED BY BUILD 151')
print('Gifting: RECIPIENT + OCCASION + MESSAGE + WRAP + REQUESTED-BY CONTEXT')
print('Custom Work: READ-ONLY SELLER COMMAND VIEW OVER EXISTING AUTHORITIES')
print('Pickup: SERVER-AUTHORITATIVE FULFILLMENT / ZERO SHIPPING WHEN PICKUP')
print('Event selling: NO OFFLINE STOCK AUTHORITY / LIVE REVALIDATION REQUIRED')
print('Canonical D1: 0001-0004 / UNCHANGED')
print('Provider publication / automatic send / R2 / schema execution added: NONE')
