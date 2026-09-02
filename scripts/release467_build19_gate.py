#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 19 — Inventory Replenishment & Procurement Readiness Command Center."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
BASE_SHA='ce01014e201df9a8a8496945bd71212bd688c6f6';BASE_TREE='131948dc58cc455ab4e7a6f5e883edf47adfb00f';SYSTEM_GATE=33669162936;BUILD18_PROOF=33669163159
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

p=load('current-development-authority.json');m=load('release467-build19-inventory-replenishment-procurement-readiness.json');mig=load('migrations/canonical/manifest.json')
b18=read('scripts/release467_build18_gate.py');api=read('functions/api/admin/inventory-replenishment.js');client=read('public/js/admin-inventory-replenishment.js');page=read('admin/inventory-replenishment/index.html');creator=read('admin/creator/index.html');css=read('css/admin-inventory-replenishment.css');doc=read('docs/operations/RELEASE_467_BUILD_19_INVENTORY_REPLENISHMENT_PROCUREMENT_READINESS.md');handoff=read('AI_HANDOFF.md');roadmap=read('PROJECT_STATUS_AND_ROADMAP.md');sanity=read('SANITY_HEALTH_CHECK.md')

req(p.get('release')==467 and p.get('build')==19 and p.get('title')=='Inventory Replenishment & Procurement Readiness Command Center','Build 19 pointer identity drifted')
req(p.get('state')=='DEVELOPMENT_CANDIDATE' and p.get('feature_branch')=='release467-build19-inventory-replenishment-procurement-readiness','Build 19 candidate/branch drifted')
req(p.get('source_base_sha')==BASE_SHA and p.get('source_base_tree_sha')==BASE_TREE,'Build 19 source base drifted')
req(p.get('last_green_build')==18 and p.get('last_green_dev_sha')==BASE_SHA and p.get('last_green_dev_tree_sha')==BASE_TREE,'Build 18 predecessor SHA/tree drifted')
req(p.get('last_green_system_gate_run')==SYSTEM_GATE and p.get('last_green_build_proof_run')==BUILD18_PROOF,'Build 18 predecessor proof drifted')
req(p.get('main_source_head_last_verified')==PROD_MAIN and p.get('production_pages_deploy_last_verified')==PROD_DEPLOY,'Production checkpoint drifted')
auth=p.get('current_release_authorities') or [];req(auth and auth[0]=='release467-build19-inventory-replenishment-procurement-readiness.json' and 'release467-build18-order-fulfillment-customer-care.json' in auth,'Build 19 authority chain drifted')
req(p.get('post_autonomous_sequence')=='INVENTORY_REPLENISHMENT_PROCUREMENT_READINESS','post-autonomous sequence drifted')
req(p.get('promotion_state')=='NO_AUTOMATIC_PROMOTION','automatic Production promotion forbidden')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(p.get(k) is False,f'pointer safety drift: {k}')

req(m.get('release')==467 and m.get('build')==19 and m.get('title')=='Inventory Replenishment & Procurement Readiness Command Center','Build 19 manifest identity drifted')
req(m.get('source_base_sha')==BASE_SHA and m.get('source_base_tree_sha')==BASE_TREE,'Build 19 manifest source base drifted')
pr=m.get('predecessor') or {};req(pr.get('build')==18 and pr.get('merged_dev_sha')==BASE_SHA and pr.get('merged_dev_tree_sha')==BASE_TREE and pr.get('system_gate_run')==SYSTEM_GATE and pr.get('build18_proof_run')==BUILD18_PROOF,'Build 19 predecessor evidence drifted')
req(pr.get('production_main_sha')==PROD_MAIN and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 19 Production provenance drifted')
req(m.get('workspace')=='/admin/inventory-replenishment/' and m.get('projection_endpoint')=='/api/admin/inventory-replenishment' and m.get('role')=='READ_ONLY_OPERATIONS_PROJECTION','Build 19 workspace/role drifted')
req(m.get('attention_lanes')==['replenishment','supplier','procurement','receiving','inventory_accuracy'],'Build 19 attention lanes drifted')
for k in ('schema_change_authorized','request_time_schema_mutation','new_d1_mutation_authorized','d1_mutation_authorized','new_r2_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_policy_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(m.get(k) is False,f'Build 19 manifest safety drift: {k}')
req(m.get('runtime_existing_operational_writes_only') is False,'Build 19 runtime must remain write-free')

b18c=b18.replace(' ','');req('pointer_build>=18' in b18c and 'Build18_provenance=TRANSITIVE_VIA_BUILD19' in b18,'Build 18 gate must remain forward-compatible/transitive')
hasall(b18,[BASE_SHA,BASE_TREE,str(SYSTEM_GATE),str(BUILD18_PROOF)],'Build 18 merged provenance')

hasall(api,['read-only','site_item_inventory','supplier_purchase_orders','supplier_purchase_order_items','inventory_receiving_claims','automatic_purchase_order_creation:false','automatic_purchase_order_submission:false','automatic_inventory_adjustment:false','automatic_receiving_action:false','automatic_supplier_message:false','provider_execution:false'],'Build 19 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'):req(forbidden not in upper,f'Build 19 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 19 endpoint must expose no POST handler')
for provider in ('api.stripe.com','api-m.paypal.com','etsy.com','facebook.com','pinterest.com'):req(provider not in api.lower(),f'Build 19 endpoint must not call provider: {provider}')
hasall(api,["lane:'replenishment'","lane:'supplier'","lane:'procurement'","lane:'receiving'","lane:'inventory_accuracy'",'stale-record review, not a supplier due-date claim'],'Build 19 queue lanes/claim safety')

one_h1(page,'Build 19 command center page');hasall(page,['Release 467 Build 19','Inventory Replenishment &amp; Procurement Readiness Command Center','never creates or submits a purchase order','adjusts stock','contacts a supplier','admin-inventory-replenishment.js?v=467b19'],'Build 19 page')
hasall(client,['/api/admin/inventory-replenishment','No purchase order, stock level, receipt, or supplier contact is changed here.','Open Inventory / Purchase Order owner','Open Receiving owner','Supplier context'],'Build 19 client')
flat=client.replace(' ','');req("method:'POST'" not in flat and 'method:"POST"' not in flat,'Build 19 client must not POST')
hasall(css,['rp-stats','rp-attention','rp-table','@media(max-width:700px)'],'Build 19 responsive CSS')
req('/admin/inventory-replenishment/' in creator and 'Build 19 replenishment command center' in creator,'Creator owner must link to Build 19 command center')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted')
for body,label in ((doc,'Build 19 documentation'),(handoff,'AI handoff'),(roadmap,'roadmap'),(sanity,'sanity')):hasall(body,['Release 467 Build 19','Inventory Replenishment & Procurement Readiness Command Center',BASE_SHA,'Release 467 Build 18','HOLD_EXTERNAL'],'Build 19 '+label)

allowed={'.github/workflows/release467-build19-proof.yml','AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','admin/creator/index.html','admin/inventory-replenishment/index.html','css/admin-inventory-replenishment.css','current-development-authority.json','docs/operations/RELEASE_467_BUILD_19_INVENTORY_REPLENISHMENT_PROCUREMENT_READINESS.md','functions/api/admin/inventory-replenishment.js','public/js/admin-inventory-replenishment.js','release467-build19-inventory-replenishment-procurement-readiness.json','scripts/release467_build18_gate.py','scripts/release467_build19_gate.py'}
ch=changed();extra=[x for x in ch if x not in allowed];req(not extra,f'files outside Build 19 scope changed: {extra}');req(not [x for x in ch if x.startswith('migrations/') or x.lower().endswith('.sql')],'Build 19 must not change schema/migrations')
if FAIL:
 print('FAIL Release 467 Build 19 Inventory Replenishment & Procurement Readiness gate');[print(f'- {x}') for x in FAIL];sys.exit(1)
print('PASS Release 467 Build 19 Inventory Replenishment & Procurement Readiness gate')
print('build18_predecessor=EXACT_GREEN')
print('inventory_replenishment_projection=READ_ONLY')
print('purchase_order_creation_submission=NONE')
print('inventory_adjustment=NONE')
print('receiving_action=NONE')
print('supplier_message_execution=NONE')
print('provider_execution=NONE')
print('schema_migration=NONE')
print('main_production_mutation=NONE')
