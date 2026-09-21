#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
B224_DEV='20afcad9a74589cd015c94a1172dc10e3e8b55a5';B224_TREE='188dc8f60480c902ac91a6f957b30c37a7166c7d';B224_MAIN='d67fe22bb0cceaf8d6ea133f688a9304c7d1f439'
B224_PROOFS={'system_gate_run':35643013344,'current_application_quality_run':35643013215,'it_admin_runtime_proof_run':35643013107,'branch_hygiene_run':35643013180}
def req(ok,msg):
 if not ok: FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file(): FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p): return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build225-storefront-launch-set-remediation-execution-ii.json');pre=load('release467-build224-manufacturing-era-closure-next-roadmap.json');m=load('migrations/canonical/manifest.json')
ui=read('public/js/admin-storefront-launch-remediation-v225.js');page=read('admin/catalog-health/index.html');system=read('scripts/current_system_gate_provenance_gate.py');doc=read('docs/operations/RELEASE_467_BUILD_225_STOREFRONT_LAUNCH_SET_REMEDIATION_EXECUTION_II.md')
req(p.get('build')==225 and p.get('title')=='Storefront Launch-Set Remediation Execution II','Build 225 current pointer identity drifted')
req(p.get('promotion_state')=='BUILD225_CANDIDATE_NOT_YET_VERIFIED','Build 225 candidate must remain fail-closed before exact-head proof')
req(b.get('build')==225 and b.get('state')=='DEVELOPMENT_CANDIDATE','Build 225 authority candidate identity drifted')
req(pre.get('state')=='PRODUCTION_GREEN','Build 224 predecessor must be Production GREEN')
final=pre.get('final_closure') or {};prod=pre.get('production_checkpoint') or {}
req(final.get('dev_sha')==B224_DEV and final.get('tree_sha')==B224_TREE and (final.get('proofs') or {})==B224_PROOFS and int(final.get('build_specific_proof_run') or 0)==35643013307,'Build 224 exact Development closure drifted')
req(prod.get('main_sha')==B224_MAIN and prod.get('tree_sha')==B224_TREE and prod.get('state')=='PRODUCTION_GREEN','Build 224 exact Production SHA/tree drifted')
req(int(prod.get('production_pages_deploy_run') or 0)==35643398483 and int(prod.get('production_live_resource_integrity_run') or 0)==35643492350,'Build 224 Production Pages/live-resource proof drifted')
req(int(prod.get('products_browser_proof_run') or 0)==35643492529 and int(prod.get('products_route_proof_run') or 0)==35643492514 and int(prod.get('build_specific_proof_run') or 0)==35643398886,'Build 224 Production proof set drifted')
req(prod.get('exact_main_sha_workflows')=='33/33' and int(prod.get('remote_d1_queries') or 0)==0 and prod.get('code_only') is True,'Build 224 Production workflow boundary drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)==21 and files[-1]=='0021_release467_project_knowledge_recipe_history.sql','Build 225 must add no migration')
base=b.get('measured_baseline') or {}
for k,v in {'products_reviewed':43,'ready_products':1,'review_required_products':42,'buyer_blocked_products':16,'media_blocked_products':40,'tracked_zero_stock_products':2,'products_with_unknown_linked_cost':2}.items(): req(int(base.get(k) or 0)==v,'Build 225 baseline drifted: '+k)
order=b.get('execution_order') or []
req([int(x.get('priority') or 0) for x in order]==[1,2,3,4,5],'Build 225 execution priorities must remain 1-5')
req([x.get('lane') for x in order]==['buyer_required_facts','approved_media_gallery_alt_role_readiness','tracked_stock_review','linked_resource_and_cost_evidence','final_buyer_readiness_review'],'Build 225 execution lane order drifted')
for token in ('Build 225','STAGES=[','Buyer-required facts','Approved media readiness','Tracked-stock review','Linked-resource & cost evidence','Final buyer-readiness review','/api/admin/storefront-launch-remediation','/api/admin/storefront-launch-set?mode=product','finalRecheck','explicit-only'):
 req(token.lower() in ui.lower(),'Build 225 UI missing '+token)
for forbidden in ('/api/admin/product-detail','/api/admin/product-media','/api/admin/inventory-operations','bucket.put(','bucket.delete(','CREATE TABLE','ALTER TABLE','DROP TABLE'):
 req(forbidden not in ui,'Build 225 UI crosses owner boundary: '+forbidden)
req('release467-build225-launch-remediation-execution.css?v=225' in page and '/public/js/admin-storefront-launch-remediation-v225.js?v=225' in page,'Catalog Health does not activate Build 225 assets')
req('/public/js/admin-storefront-launch-remediation-v206.js?v=206' in page,'Build 206 retained source contract marker missing')
req(len(re.findall(r'<h1(?:\\s|>)',page,re.I))==1,'Catalog Health one-H1 rule failed')
req("run_current_contract('scripts/release467_build225_gate.py','Release 467 Build 225')" in system,'Current System Gate must invoke Build 225')
for token in ('future queue **has not run out**','Builds **226–232** remain planned','43 / 1 / 42'):
 req(token.lower() in doc.lower(),'Build 225 doc missing '+token)
q=subprocess.run(['node','--check',str(ROOT/'public/js/admin-storefront-launch-remediation-v225.js')],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
req(q.returncode==0,'Build 225 JS syntax failed: '+(q.stderr or q.stdout)[-1200:])
if FAIL:
 print('RELEASE 467 BUILD 225 STOREFRONT LAUNCH-SET REMEDIATION EXECUTION II: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 225 STOREFRONT LAUNCH-SET REMEDIATION EXECUTION II: PASS')
print('Build 224 predecessor: EXACT DEVELOPMENT + PRODUCTION GREEN / 33 of 33 Production workflows')
print('Canonical migration: NONE / remains 0001-0021')
print('Execution: PRIORITIZED EXISTING AUTHORITIES / NO PARALLEL FACT MUTATION')
print('Future queue exhausted: NO / Builds 226-232 remain planned')
