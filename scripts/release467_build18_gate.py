#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 18 — Order Fulfillment & Customer Care Command Center."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
BASE_SHA='7f3363954434801e9226b29d83899ea795713525';BASE_TREE='0df69c0b24484536e6f50e21a523c915d101923a';SYSTEM_GATE=33665275366;BUILD17_PROOF=33665275406
PROD_MAIN='296e53b079bba53126c80902be36a9271d82cea4';PROD_DEPLOY=33655223149
MIGRATIONS=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):
 p=ROOT/path
 if not p.is_file():FAIL.append(f'missing required file: {path}');return ''
 return p.read_text(encoding='utf-8',errors='replace')
def load(path):
 try:v=json.loads(read(path));return v if isinstance(v,dict) else {}
 except Exception as e:FAIL.append(f'invalid JSON {path}: {e}');return {}
def changed():
 try:
  base=subprocess.check_output(['git','merge-base','HEAD','origin/dev'],cwd=ROOT,text=True).strip();out=subprocess.check_output(['git','diff','--name-only',f'{base}...HEAD'],cwd=ROOT,text=True);return [x for x in out.splitlines() if x]
 except Exception as e:FAIL.append(f'could not calculate changed files: {e}');return []
def hasall(body,tokens,label):
 for token in tokens:req(token in body,f'{label} marker missing: {token}')
def one_h1(body,label):req(len(re.findall(r'<h1(?:\s|>)',body,re.I))==1,f'{label} must contain exactly one H1')

p=load('current-development-authority.json');m=load('release467-build18-order-fulfillment-customer-care.json');mig=load('migrations/canonical/manifest.json')
b17=read('scripts/release467_build17_gate.py');api=read('functions/api/admin/order-fulfillment-care.js');client=read('public/js/admin-order-fulfillment-care.js');page=read('admin/order-fulfillment-care/index.html');orders_page=read('admin/orders/index.html');css=read('css/admin-order-fulfillment-care.css');doc=read('docs/operations/RELEASE_467_BUILD_18_ORDER_FULFILLMENT_CUSTOMER_CARE.md')

req(p.get('release')==467 and p.get('build')==18 and p.get('title')=='Order Fulfillment & Customer Care Command Center','Build 18 pointer identity drifted')
req(p.get('state')=='DEVELOPMENT_CANDIDATE' and p.get('feature_branch')=='release467-build18-order-fulfillment-customer-care','Build 18 candidate/branch drifted')
req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 18 source base drifted')
req(p.get('last_green_build')==17 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 17 predecessor SHA/tree drifted')
req(p.get('last_green_system_gate_run')==SYSTEM_GATE and p.get('last_green_build_proof_run')==BUILD17_PROOF,'Build 17 predecessor proof drifted')
req(p.get('main_source_head_last_verified')==PROD_MAIN and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production checkpoint drifted')
auth=p.get('current_release_authorities') or [];req(auth and auth[0]=='release467-build18-order-fulfillment-customer-care.json' and 'release467-build17-creator-content-completeness.json' in auth,'Build 18 authority chain drifted')
req(p.get('autonomous_backlog_state')=='COMPLETE_THROUGH_BUILD_17' and p.get('autonomous_backlog_active_build') is None and p.get('autonomous_backlog_active_items')==[],'completed autonomous backlog state drifted')
req(p.get('post_autonomous_sequence')=='ORDER_FULFILLMENT_CUSTOMER_CARE','post-autonomous sequence drifted')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(p.get(k) is False,f'pointer safety drift: {k}')
ca=p.get('compatibility_authority') or {};req(ca.get('role')=='INHERITED_REGRESSION_COMPATIBILITY' and ca.get('runtime_release_header')==466 and ca.get('runtime_release_header_role')=='INHERITED_RUNTIME_COMPATIBILITY','compatibility classification drifted')

req(m.get('release')==467 and m.get('build')==18 and m.get('title')=='Order Fulfillment & Customer Care Command Center','Build 18 manifest identity drifted')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE,'Build 18 manifest source base drifted')
pr=m.get('predecessor') or {};req(pr.get('build')==17 and pr.get('merged_dev_sha')==BASE_SHA and pr.get('merged_dev_tree_sha')==BASE_TREE and pr.get('system_gate_run')==SYSTEM_GATE and pr.get('build17_proof_run')==BUILD17_PROOF,'Build 18 predecessor evidence drifted')
req(pr.get('production_main_sha')==PROD_MAIN and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 18 Production provenance drifted')
req(m.get('workspace')=='/admin/order-fulfillment-care/' and m.get('projection_endpoint')=='/api/admin/order-fulfillment-care' and m.get('role')=='READ_ONLY_OPERATIONS_PROJECTION','Build 18 workspace/role drifted')
sources=m.get('source_authorities') or {};req(sources.get('standard_orders')==['orders','payments','payment_refunds','order_status_history'],'standard order source authority drifted');req(sources.get('custom_orders')==['custom_requests','custom_request_order_drafts','custom_request_order_stage_events','custom_request_fulfillment_prompts','custom_request_order_status_links'],'custom order source authority drifted')
req(m.get('attention_lanes')==['policy','payment','fulfillment','refund','custom_order','customer_care','after_sale'],'attention lanes drifted')
f=m.get('fulfillment_policy') or {};req(f.get('allowed_shipping_countries')==['CA'] and f.get('us_sales_shipping_suspended') is True and f.get('shipping_policy_mismatch_is_critical') is True,'Canada-only/U.S. suspension policy drifted')
op=m.get('operator_boundary') or {}
for k in ('automatic_order_status_mutation','automatic_payment_mutation','automatic_refund_execution','automatic_customer_message','automatic_custom_stage_advance','automatic_fulfillment_action','shipping_provider_execution','payment_provider_execution'):req(op.get(k) is False,f'operator boundary drift: {k}')
for k in ('schema_change_authorized','request_time_schema_mutation','new_d1_mutation_authorized','d1_mutation_authorized','new_r2_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_policy_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(m.get(k) is False,f'manifest safety drift: {k}')
req(m.get('runtime_existing_operational_writes_only') is False,'Build 18 runtime must remain write-free')

# Build 17 must explicitly support newer pointers and retain exact merged Build 17 proof.
b17c=b17.replace(' ','');req('pointer_build>=17' in b17c and 'ifpointer_build==17' in b17c,'Build 17 gate lost forward compatibility')
hasall(b17,[BASE_SHA,BASE_TREE,str(SYSTEM_GATE),str(BUILD17_PROOF),'PASS Release 467 Build 17 retained gate'],'Build 17 merged provenance')

# Runtime endpoint must be read-only and derived from canonical authorities.
hasall(api,['READ-ONLY','orders','payments','payment_refunds','order_status_history','custom_requests','custom_request_order_drafts','custom_request_order_stage_events','custom_request_fulfillment_prompts','custom_request_order_status_links','shipping policy mismatch','automatic_order_mutation:false','automatic_customer_message:false','refund_provider_execution:false','shipping_provider_execution:false','canada_only_shipping_policy_preserved:true','us_sales_shipping_suspension_preserved:true'],'Build 18 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'):req(forbidden not in upper,f'Build 18 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 18 endpoint must expose no POST handler')
for provider in ('api.stripe.com','api-m.paypal.com','etsy.com','facebook.com','pinterest.com'):req(provider not in api.lower(),f'Build 18 endpoint must not call provider: {provider}')
hasall(api,["lane:'policy'","lane:'payment'","lane:'fulfillment'","lane:'refund'","lane:'custom_order'","lane:'customer_care'","lane:'after_sale'"],'Build 18 queue lanes')

one_h1(page,'Build 18 command center page')
hasall(page,['Release 467 Build 18','Order Fulfillment &amp; Customer Care Command Center','never changes an order','sends a message','executes a refund','Canada-only shipping','U.S. sales/shipping suspension','admin-order-fulfillment-care.js?v=467b18'],'Build 18 page')
hasall(client,['/api/admin/order-fulfillment-care','Open Orders','Open Custom Requests','Open Accounting','Nothing below is changed automatically','Customer care','Refund'],'Build 18 client')
req("method:'POST'" not in client.replace(' ','' ) and 'method:"POST"' not in client.replace(' ',''),'Build 18 client must not POST')
hasall(css,['fc-stats','fc-attention','fc-table','@media(max-width:700px)'],'Build 18 responsive CSS')
req('/admin/order-fulfillment-care/' in orders_page and 'Build 18 fulfillment handoff' in orders_page,'Orders owner must link to Build 18 command center')

req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
hasall(doc,['Release 467 Build 18','Order Fulfillment & Customer Care Command Center',BASE_SHA,'Release 467 Build 17','HOLD_EXTERNAL','Canada-only','U.S. sales/shipping suspension','read-only'],'Build 18 documentation')

allowed={
 '.github/workflows/release467-build18-proof.yml','AI_HANDOFF.md','MARKDOWN_INDEX.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','admin/order-fulfillment-care/index.html','admin/orders/index.html','css/admin-order-fulfillment-care.css','current-development-authority.json','docs/operations/RELEASE_467_BUILD_18_ORDER_FULFILLMENT_CUSTOMER_CARE.md','functions/api/admin/order-fulfillment-care.js','public/js/admin-order-fulfillment-care.js','release467-build18-order-fulfillment-customer-care.json','scripts/release467_build17_gate.py','scripts/release467_build18_gate.py'
}
ch=changed();extra=[x for x in ch if x not in allowed];req(not extra,f'files outside Build 18 scope changed: {extra}')
req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 18 must not change schema/migrations')
if FAIL:
 print('FAIL Release 467 Build 18 Order Fulfillment & Customer Care gate');[print(f'- {x}') for x in FAIL];sys.exit(1)
print('PASS Release 467 Build 18 Order Fulfillment & Customer Care gate')
print('build17_predecessor=EXACT_GREEN')
print('order_fulfillment_projection=READ_ONLY')
print('refund_execution=NONE')
print('customer_message_execution=NONE')
print('custom_stage_auto_advance=NONE')
print('shipping_provider_execution=NONE')
print('payment_provider_execution=NONE')
print('canada_only_shipping_policy=PRESERVED')
print('us_sales_shipping_suspension=PRESERVED')
print('schema_migration=NONE')
print('main_production_mutation=NONE')
