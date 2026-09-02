#!/usr/bin/env python3
"""Fail-closed retained source contract for Release 467 Build 19 — Inventory Replenishment & Procurement Readiness."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
SOURCE_BASE='ce01014e201df9a8a8496945bd71212bd688c6f6';SOURCE_TREE='131948dc58cc455ab4e7a6f5e883edf47adfb00f';SOURCE_SYSTEM=33669162936;SOURCE_PROOF=33669163159
MERGED_SHA='9c814314dea5ddc664e73b9d822c8a41423c3aca';MERGED_TREE='9be57e9c0e090f8edf210ce62fcf8b093e703506';MERGED_SYSTEM_GATE=33673793408;MERGED_BUILD19_PROOF=33673793538
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
api=read('functions/api/admin/inventory-replenishment.js');client=read('public/js/admin-inventory-replenishment.js');page=read('admin/inventory-replenishment/index.html');creator=read('admin/creator/index.html');css=read('css/admin-inventory-replenishment.css');doc=read('docs/operations/RELEASE_467_BUILD_19_INVENTORY_REPLENISHMENT_PROCUREMENT_READINESS.md')
pointer_build=int(p.get('build') or 0)
req(p.get('release')==467 and pointer_build>=19,'current pointer must be Release 467 Build 19 or newer')
req(m.get('release')==467 and m.get('build')==19 and m.get('title')=='Inventory Replenishment & Procurement Readiness Command Center','Build 19 manifest identity drifted')
req(m.get('source_base_sha')==SOURCE_BASE and m.get('source_base_tree_sha')==SOURCE_TREE,'Build 19 manifest source base drifted')
pr=m.get('predecessor') or {};req(pr.get('build')==18 and pr.get('merged_dev_sha')==SOURCE_BASE and pr.get('merged_dev_tree_sha')==SOURCE_TREE and pr.get('system_gate_run')==SOURCE_SYSTEM and pr.get('build18_proof_run')==SOURCE_PROOF,'Build 19 predecessor evidence drifted')
req(pr.get('production_main_sha')==PROD_MAIN and pr.get('production_pages_deploy_run')==PROD_DEPLOY,'Build 19 Production provenance drifted')
req(m.get('workspace')=='/admin/inventory-replenishment/' and m.get('projection_endpoint')=='/api/admin/inventory-replenishment' and m.get('role')=='READ_ONLY_OPERATIONS_PROJECTION','Build 19 workspace/role drifted')
req(m.get('attention_lanes')==['replenishment','supplier','procurement','receiving','inventory_accuracy'],'Build 19 attention lanes drifted')
for k in ('schema_change_authorized','request_time_schema_mutation','new_d1_mutation_authorized','d1_mutation_authorized','new_r2_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_policy_mutation_authorized','main_mutation_authorized','production_mutation_authorized','secret_values_emitted'):req(m.get(k) is False,f'Build 19 manifest safety drift: {k}')
req(m.get('runtime_existing_operational_writes_only') is False,'Build 19 runtime must remain write-free')
if pointer_build==19:
 req(p.get('title')=='Inventory Replenishment & Procurement Readiness Command Center' and p.get('feature_branch')=='release467-build19-inventory-replenishment-procurement-readiness','Build 19 pointer identity/branch drifted')
 req(p.get('source_base_sha')==SOURCE_BASE and p.get('source_base_tree_sha')==SOURCE_TREE,'Build 19 pointer source base drifted')
 req(p.get('last_green_build')==18 and p.get('last_green_dev_sha')==SOURCE_BASE and p.get('last_green_dev_tree_sha')==SOURCE_TREE,'Build 19 predecessor pointer drifted')
 req(p.get('last_green_system_gate_run')==SOURCE_SYSTEM and p.get('last_green_build_proof_run')==SOURCE_PROOF,'Build 19 predecessor proof pointer drifted')
else:
 auth=p.get('current_release_authorities') or [];req('release467-build19-inventory-replenishment-procurement-readiness.json' in auth,'newer authority must retain Build 19 manifest')
 b20=load('release467-build20-workshop-tool-equipment-readiness.json')
 req(b20.get('source_base_sha')==MERGED_SHA and b20.get('source_base_tree_sha')==MERGED_TREE,'Build 19 merged SHA/tree must be retained through Build 20 source base')
 b20p=b20.get('predecessor') or {};req(b20p.get('build')==19 and b20p.get('merged_dev_sha')==MERGED_SHA and b20p.get('merged_dev_tree_sha')==MERGED_TREE and b20p.get('system_gate_run')==MERGED_SYSTEM_GATE and b20p.get('build19_proof_run')==MERGED_BUILD19_PROOF,'Build 19 merged proof must be retained through Build 20 predecessor evidence')
hasall(api,['read-only','site_item_inventory','supplier_purchase_orders','supplier_purchase_order_items','inventory_receiving_claims','automatic_purchase_order_creation:false','automatic_purchase_order_submission:false','automatic_inventory_adjustment:false','automatic_receiving_action:false','automatic_supplier_message:false','provider_execution:false'],'Build 19 API')
upper=api.upper()
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM'):req(forbidden not in upper,f'Build 19 API must contain no DDL/DML: {forbidden}')
req('onRequestPost' not in api,'Build 19 endpoint must expose no POST handler')
one_h1(page,'Build 19 command center page');hasall(client,['/api/admin/inventory-replenishment','No purchase order, stock level, receipt, or supplier contact is changed here.','Open Inventory / Purchase Order owner','Open Receiving owner','Supplier context'],'Build 19 client');hasall(css,['rp-stats','rp-attention','rp-table','@media(max-width:700px)'],'Build 19 responsive CSS');req('/admin/inventory-replenishment/' in creator and 'Build 19 replenishment command center' in creator,'Creator owner must retain Build 19 handoff')
req([x.get('file') for x in mig.get('migrations',[])]==MIGRATIONS,'canonical migrations drifted');hasall(doc,['Release 467 Build 19','Inventory Replenishment & Procurement Readiness Command Center',SOURCE_BASE,'Release 467 Build 18','HOLD_EXTERNAL'],'Build 19 documentation')
if pointer_build==19:
 allowed={'.github/workflows/release467-build19-proof.yml','AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','admin/creator/index.html','admin/inventory-replenishment/index.html','css/admin-inventory-replenishment.css','current-development-authority.json','docs/operations/RELEASE_467_BUILD_19_INVENTORY_REPLENISHMENT_PROCUREMENT_READINESS.md','functions/api/admin/inventory-replenishment.js','public/js/admin-inventory-replenishment.js','release467-build19-inventory-replenishment-procurement-readiness.json','scripts/release467_build18_gate.py','scripts/release467_build19_gate.py'}
 extra=[x for x in changed() if x not in allowed];req(not extra,f'files outside Build 19 scope changed: {extra}')
if FAIL:
 print('FAIL Release 467 Build 19 retained gate');[print(f'- {x}') for x in FAIL];sys.exit(1)
print('PASS Release 467 Build 19 retained gate')
print(f'pointer_build={pointer_build}')
print('Build19_provenance=TRANSITIVE_VIA_BUILD20' if pointer_build>19 else 'Build19_candidate=EXACT')
print('inventory_replenishment_projection=READ_ONLY')
print('schema_migration=NONE')
print('main_production_mutation=NONE')
