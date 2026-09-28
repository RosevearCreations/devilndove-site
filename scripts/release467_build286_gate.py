#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build286-creative-process-resource-link-operator-workflow.json');prev=j('release467-build285-real-inventory-linkage-prerequisite-inventory.json');p=j('current-development-authority.json');manifest=j('migrations/canonical/manifest.json')
mig=t('migrations/canonical/0024_release467_creative_process_resource_link_operator_workflow.sql');api=t('functions/api/admin/creative-process-resource-links.js');ui=t('public/js/admin-creative-process-resource-links-build286.js');page=t('admin/creative-process/index.html');doc=t('docs/operations/RELEASE_467_BUILD_286_CREATIVE_PROCESS_RESOURCE_LINK_OPERATOR_WORKFLOW.md');wf=t('.github/workflows/release467-build286-creative-process-resource-link-operator-workflow.yml');sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==286 and a.get('title')=='Creative Process Resource-Link Operator Workflow','Build 286 identity mismatch')
pred=a.get('predecessor') or {};q(pred.get('development_sha')=='d1c70746fd937b05708306ea299ddb64559ff79c' and pred.get('development_tree_sha')=='cea56547d734e8c4db51d49d145edebeb806d762','Build 285 Development predecessor mismatch');q(pred.get('production_main_sha')=='2056cc46ebb5589dddc0b5172d90ffbd0e3c4241' and pred.get('production_tree_sha')=='cea56547d734e8c4db51d49d145edebeb806d762' and pred.get('same_tree') is True,'Build 285 Production predecessor mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 285 successor-ingested authority must be Production GREEN');q((prev.get('final_closure') or {}).get('dev_sha')=='d1c70746fd937b05708306ea299ddb64559ff79c','Build 285 final Development closure missing');q((prev.get('production_checkpoint') or {}).get('main_sha')=='2056cc46ebb5589dddc0b5172d90ffbd0e3c4241','Build 285 Production checkpoint missing')
files=[str(x.get('file') or '') for x in (manifest.get('migrations') or []) if isinstance(x,dict)];q(len(files)>=24 and files[23]=='0024_release467_creative_process_resource_link_operator_workflow.sql','Build 286 canonical migration 0024 missing')
for token in ('CREATE TABLE IF NOT EXISTS creative_process_resource_links','creative_work_event_id INTEGER NOT NULL','site_item_inventory_id INTEGER NOT NULL','creative_project_operation_id INTEGER','UNIQUE(creative_work_event_id, site_item_inventory_id, resource_role)','PRAGMA foreign_key_check'):q(token in mig,'Build 286 migration missing '+token)
for forbidden in ('INSERT INTO site_item_inventory','UPDATE site_item_inventory','DELETE FROM site_item_inventory','INSERT INTO site_inventory_movements','UPDATE site_inventory_movements','INSERT INTO creative_project_inventory_posts'):q(forbidden not in api,'Build 286 endpoint must not move Inventory: '+forbidden)
for token in ("action==='save_resource_link'","action==='remove_resource_link'","IN ('supply','tool')",'Product-owned Inventory is not allowed','inventory_reference_only:true','automatic_inventory_movement:false'):q(token in api,'Build 286 API contract missing '+token)
for token in ('creativeProcessResourceLinks286Mount','Link existing Supply/Tool Inventory','Reference only','Find existing Inventory','No operation / material event only'):q(token in page+ui,'Build 286 operator UI missing '+token)
q('0024_release467_creative_process_resource_link_operator_workflow.sql' in doc and 'Build 287' in doc,'Build 286 doc incomplete');
css=t('css/styles.css');ergjs=t('public/js/admin-ergonomics-v237.js');inventory_ui=t('public/js/admin-site-item-inventory.js');tools_page=t('tools/index.html');supplies_page=t('supplies/index.html');login_page=t('login/index.html');shop_page=t('shop/index.html');sw=t('sw.js');mainjs=t('js/main.js')
for token in ("devilndove-shell-r450","AUTH_CRITICAL_ASSETS","/public/js/auth.js"):q(token in sw,'Build 286 auth-cache repair missing '+token)
q("467b286-cookie-session" in login_page and "467b286-cookie-session" in shop_page,'Build 286 login/shop auth cache-busting missing')
q("new URL(node.src, window.location.href).pathname === wanted" in mainjs,'Build 286 duplicate auth script guard missing')
q("inventoryCardDefault" in ergjs and "site-inventory-admin-table" in ergjs,'Build 286 Inventory desktop-card default missing')
q("source_type: value('source_type') || original.source_type" in inventory_ui,'Build 286 inline Tool/Supply type save missing')
for token in ("grid-template-columns:repeat(3,minmax(0,1fr))","content:attr(data-label)",".shop-collection-card{color:#1f2937}"):q(token in css,'Build 286 operator CSS repair missing '+token)
for page,name in ((tools_page,'Tools'),(supplies_page,'Supplies')):
    q("minmax(220px, 1fr)" in page and "prefers-reduced-motion:reduce" in page,f'Build 286 compact {name} cards missing')
q('Release 467 Build 286 Creative Process Resource-Link Operator Workflow' in wf and 'Release 467 Build 285 Real Inventory Linkage Prerequisite Inventory' in wf,'Build 286 workflow predecessor proof missing');q("run_current_contract('scripts/release467_build286_gate.py','Release 467 Build 286')" in sysgate,'System Gate missing Build 286')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=286,'Current authority must retain Build 286 or successor')
if cur==286:
    q(p.get('title')=='Creative Process Resource-Link Operator Workflow' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 286 pointer mismatch')
    q(p.get('accepted_dev_sha')=='d1c70746fd937b05708306ea299ddb64559ff79c' and p.get('accepted_dev_tree_sha')=='cea56547d734e8c4db51d49d145edebeb806d762','Current Build 286 predecessor mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='2056cc46ebb5589dddc0b5172d90ffbd0e3c4241','Current Build 286 Production baseline mismatch')
    q(int(p.get('next_build') or 0)==287 and p.get('next_build_title')=='Real Existing Resource-Link Evidence Capture','Current Build 286 successor pointer mismatch')
for path in ('functions/api/admin/creative-process-resource-links.js','public/js/admin-creative-process-resource-links-build286.js'):
    r=subprocess.run(['node','--check',str(R/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+r.stderr)
s=a.get('safety') or {};q(s.get('canonical_schema_addition') is True and s.get('operator_resource_link_mutation') is True,'Build 286 bounded authorization missing')
for k in ('request_time_schema_mutation','inventory_quantity_mutation','inventory_movement','inventory_direct_stock_rewrite','product_owned_inventory_substitution','product_mutation','creative_material_event_creation','finance_posting','payment_or_refund','provider_execution','provider_publication','r2_mutation','production_business_data_copy','automatic_production_promotion','secret_capture'):q(s.get(k) is False,'Build 286 safety drift: '+k)
print('RELEASE 467 BUILD 286 CREATIVE PROCESS RESOURCE-LINK OPERATOR WORKFLOW');[print('-',x) for x in F] if F else None;sys.exit(1 if F else 0)
