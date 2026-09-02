#!/usr/bin/env python3
"""Fail-closed retained source contract for Release 467 Build 18 — Order Fulfillment & Customer Care Command Center."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SOURCE_BASE='7f3363954434801e9226b29d83899ea795713525';SOURCE_TREE='0df69c0b24484536e6f50e21a523c915d101923a';SOURCE_SYSTEM=33665275366;SOURCE_PROOF=33665275406
MERGED_SHA='ce01014e201df9a8a8496945bd71212bd688c6f6';MERGED_TREE='131948dc58cc455ab4e7a6f5e883edf47adfb00f';MERGED_SYSTEM_GATE=33669162936;MERGED_BUILD18_PROOF=33669163159
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
b16=read('scripts/release467_build16_gate.py');b17=read('scripts/release467_build17_gate.py');api=read('functions/api/admin/order-fulfillment-care.js');client=read('public/js/admin-order-fulfillment-care.js');page=read('admin/order-fulfillment-care/index.html');orders_page=read('admin/orders/index.html');css=read('css/admin-order-fulfillment-care.css');doc=read('docs/operations/RELEASE_467_BUILD_18_ORDER_FULFILLMENT_CUSTOMER_CARE.md')
pointer_build=int(p.get('build') or 0)
req(p.get('release')==467 and pointer_build>=18,'current pointer must be Release 467 Build 18 or newer')
req(m.get('release')==467 and m.get('build')==18 and m.get('title')=='Order Fulfillment & Customer Care Command Center','Build 18 manifest identity drifted')
req(m.get('source_base_sha')==SOURCE_BASE and m.get('source_base_tree_sha')==SOURCE_TREE,'Build 18 manifest source base drifted')
pr=m.get('predecessor') or {};req(pr.get('build')==17 and pr.get('merged_dev_sha')==SOURCE_BASE and pr.get('merged_dev_tree_sha')==SOURCE_TREE and pr.get('system_gate_run')==SOURCE_SYSTEM and pr.get('build17_proof_run')==SOURCE_PROOF,'Build 18 predecessor evidence drifted')
req(pr.get('production_main_sha')==PROD_MAIN and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 18 Production provenance drifted')
req(m.get('workspace')=='/admin/order-fulfillment-care/' and m.get('projection_endpoint')=='/api/admin/order-fulfillment-care' and m.get('role')=='READ_ONLY_OPERATIONS_PROJECTION','Build 18 workspace/role drifted')
req(m.get('attention_lanes')==['policy','payment','fulfillment','refund','custom_order','customer_care','after_sale'],'Build 18 attention lanes drifted')
f=m.get('fulfillment_policy') or {};req(f.get('allowed_shipping_countries')==['CA'] and f.get('us_sales_shipping_suspended') is True,'Build 18 shipping policy drifted')
for k in ('schema_change_authorized','request_time_schema_mutation','new_d1_mutation_authorized','d1_mutation_authorized','new_r2_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_policy_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(m.get(k) is False,f'Build 18 manifest safety drift: {k}')
req(m.get('runtime_existing_operational_writes_only') is False,'Build 18 runtime must remain write-free')

if pointer_build==18:
 req(p.get('title')=='Order Fulfillment & Customer Care Command Center' and p.get('feature_branch')=='release467-build18-order-fulfillment-customer-care','Build 18 pointer identity/branch drifted')
 req(p.get('source_base_sha')==SOURCE_BASE and p.get('source_base_tree_sha')==SOURCE_TREE,'Build 18 pointer source base drifted')
 req(p.get('last_green_build')==17 and p.get('last_green_dev_sha')==SOURCE_BASE and p.get('last_green_dev_tree_sha')==SOURCE_TREE,'Build 18 predecessor pointer drifted')
 req(p.get('last_green_system_gate_run')==SOURCE_SYSTEM and p.get('last_green_build_proof_run')==SOURCE_PROOF,'Build 18 predecessor proof pointer drifted')
else:
 auth=p.get('current_release_authorities') or [];req('release467-build18-order-fulfillment-customer-care.json' in auth,'newer authority must retain Build 18 manifest')
 b19=load('release467-build19-inventory-replenishment-procurement-readiness.json')
 req(b19.get('source_base_sha')==MERGED_SHA and b19.get('source_base_tree_sha')==MERGED_TREE,'Build 18 merged SHA/tree must be retained through Build 19 source base')
 b19p=b19.get('predecessor') or {};req(b19p.get('build')==18 and b19p.get('merged_dev_sha')==MERGED_SHA and b19p.get('merged_dev_tree_sha')==MERGED_TREE and b19p.get('system_gate_run')==MERGED_SYSTEM_GATE and b19p.get('build18_proof_run')==MERGED_BUILD18_PROOF,'Build 18 merged proof must be retained through Build 19 predecessor evidence')

b16c=b16.replace(' ','');req('Build16_provenance=TRANSITIVE_VIA_BUILD17' in b16,'Build 16 transitive provenance marker missing');req('pointer_build>=17' in b17c,'Build 17 gate lost forward compatibility')
hasall(api,['read-only','orders','payments','payment_refunds','custom_requests','shipping policy mismatch','automatic_order_mutation:false','automatic_customer_message:false','refund_provider_execution:false','shipping_provider_execution:false','canada_only_shipping_policy_preserved:true','us_sales_shipping_suspension_preserved:true'],'Build 18 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'):req(forbidden not in upper,f'Build 18 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 18 endpoint must expose no POST handler')
one_h1(page,'Build 18 command center page');hasall(client,['/api/admin/order-fulfillment-care','Open Orders','Open Custom Requests','Open Accounting','Nothing below is changed automatically'],'Build 18 client');hasall(css,['fc-stats','fc-attention','fc-table','@media(max-width:700px)'],'Build 18 responsive CSS');req('/admin/order-fulfillment-care/' in orders_page and 'Build 18 fulfillment handoff' in orders_page,'Orders owner must retain Build 18 handoff')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted');hasall(doc,['Release 467 Build 18','Order Fulfillment & Customer Care Command Center',SOURCE_BASE,'Release 467 Build 17','HOLD_EXTERNAL','Canada-only','U.S. sales/shipping suspension','read-only'],'Build 18 documentation')
if pointer_build==18:
 allowed={'.github/workflows/release467-build18-proof.yml','AI_HANDOFF.md','MARKDOWN_INDEX.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','admin/order-fulfillment-care/index.html','admin/orders/index.html','css/admin-order-fulfillment-care.css','current-development-authority.json','docs/operations/RELEASE_467_BUILD_18_ORDER_FULFILLMENT_CUSTOMER_CARE.md','functions/api/admin/order-fulfillment-care.js','public/js/admin-order-fulfillment-care.js','release467-build18-order-fulfillment-customer-care.json','scripts/release467_build16_gate.py','scripts/release467_build17_gate.py','scripts/release467_build18_gate.py'}
 extra=[x for x in changed() if x not in allowed];req(not extra,f'files outside Build 18 scope changed: {extra}')
if FAIL:
 print('FAIL Release 467 Build 18 retained gate');[print(f'- {x}') for x in FAIL];sys.exit(1)
print('PASS Release 467 Build 18 retained gate')
print(f'pointer_build={pointer_build}')
print('Build18_provenance=TRANSITIVE_VIA_BUILD19' if pointer_build>18 else 'Build18_candidate=EXACT')
print('order_fulfillment_projection=READ_ONLY')
print('schema_migration=NONE')
print('main_production_mutation=NONE')
