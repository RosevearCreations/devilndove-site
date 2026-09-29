#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build289-real-inventory-adoption-outcomes-renewal.json')
prev=j('release467-build288-real-planned-vs-actual-inventory-acceptance.json')
cur=j('current-development-authority.json')
manifest=j('migrations/canonical/manifest.json')
mig=t('migrations/canonical/0025_release467_inventory_workstation_roles.sql')
mig26=t('migrations/canonical/0026_release467_inventory_workstation_memberships.sql')
multistation=t('public/js/admin-site-item-inventory-multistation.js')
api=t('functions/api/admin/_siteItemInventoryLegacy.js')
bootstrap=t('functions/api/admin/inventory-bootstrap.js')
amazon=t('functions/api/admin/amazon-link-preview.js')
ui=t('public/js/admin-site-item-inventory.js')
page=t('admin/inventory-operations/index.html')
doc=t('docs/operations/RELEASE_467_BUILD_289_REAL_INVENTORY_ADOPTION_OUTCOMES_RENEWAL.md')
road=t('docs/operations/RELEASE_467_REAL_INVENTORY_LINKAGE_ACCEPTANCE_AUTONOMOUS_BUILDS_285_289.md')
runtime=t('scripts/release467_build289_operator_acceptance.py')
wf=t('.github/workflows/release467-build289-real-inventory-adoption-outcomes-renewal.yml')
q(a.get('release')==467 and a.get('build')==289 and a.get('title')=='Real Inventory Adoption Outcomes Renewal','Build 289 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 289 state mismatch')
p=a.get('predecessor') or {}
q(p.get('development_sha')=='49531694be53b4c8749817c95a4b3b0b28814b90' and p.get('development_tree_sha')=='8e34e42a970c1aa8aab2325db5f2fab466703400','Build 288 Development predecessor mismatch')
q(p.get('production_main_sha')=='10ca103d83a2f0517eb1bbf3aac26cebd5e0e451' and p.get('production_tree_sha')=='8e34e42a970c1aa8aab2325db5f2fab466703400' and p.get('same_tree') is True,'Build 288 Production predecessor mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 288 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='49531694be53b4c8749817c95a4b3b0b28814b90','Build 288 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='10ca103d83a2f0517eb1bbf3aac26cebd5e0e451','Build 288 Production checkpoint missing')
migs=manifest.get('migrations') or []
q(len(migs)>=26 and migs[24].get('file')=='0025_release467_inventory_workstation_roles.sql' and migs[25].get('file')=='0026_release467_inventory_workstation_memberships.sql','Canonical migrations 0025-0026 missing')
for token in ('CREATE TABLE IF NOT EXISTS inventory_workstation_roles',"CHECK(workstation_role IN ('station','associated'))",'workstation_site_item_inventory_id INTEGER','FOREIGN KEY(site_item_inventory_id)','FOREIGN KEY(workstation_site_item_inventory_id)'):
    q(token in mig,'Build 289 migration missing '+token)
for token in ('CREATE TABLE IF NOT EXISTS inventory_workstation_memberships','PRIMARY KEY(site_item_inventory_id, workstation_site_item_inventory_id)','Backfilled from migration 0025 single-station relationship'):
    q(token in mig26,'Build 289 workstation membership migration missing '+token)
for token in ('processes:','station_tools:','inventory_processes','inventory_workstation_roles',"unit_presets: ['unit'"):
    q(token in bootstrap,'Build 289 Inventory bootstrap missing '+token)
for token in ('saveWorkstationAssignment','inventory_process_id','workstation_role','workstation_site_item_inventory_id','do_not_reorder','activeInventoryProcess','inventory_process_assignments'):
    q(token in api,'Build 289 Inventory API missing '+token)
for token in ('Workstation / Category','This tool is the workstation','Associated tool / supply','Specific station tool','N/A — do not reorder','Fill missing from Amazon','unitOptionsMarkup','siteInventoryStockUnitLabel','siteInventoryUsageUnitLabel'):
    q(token in ui,'Build 289 Inventory UI missing '+token)
for token in ('current_price_cents','package_units','package_units_source','Amazon did not expose a reliable current CAD price'):
    q(token in amazon,'Build 289 Amazon missing '+token)
q(any(v in page for v in ('/public/js/admin-site-item-inventory.js?v=289.1','/public/js/admin-site-item-inventory.js?v=289.2')),'Build 289 Inventory asset version missing')
q(any(v in page for v in ('/public/js/admin-site-item-inventory-multistation.js?v=289.3','/public/js/admin-site-item-inventory-multistation.js?v=289.4')),'Build 289 multi-station Inventory asset missing')
for token in ('workstation_site_item_inventory_ids','dd-multistation-checklist','No workstation tools have been marked in this category yet','window.fetch','observer.disconnect()','observer.takeRecords()','transforming = true'):
    q(token in multistation,'Build 289 multi-station UI missing '+token)
q("loadSeedOptions()" in ui and ".then(() => loadList({ force: true }))" in ui,'Build 289 Inventory dropdown bootstrap must complete before first list render')
q("inventory-bootstrap-v289.2" in ui,'Build 289 Inventory bootstrap cache key must refresh workstation/unit choices')
for token in ('AUTONOMOUS_QUEUE_EXHAUSTED','build287_real_link_rows','build288_reversed_post_rows','direct_d1_rows_read','successor_justified'):
    q(token in runtime,'Build 289 runtime missing '+token)
q('D1_ONE_SHOT_EVIDENCE_CAPTURE' in wf and "D1_PROVIDER_ROWS_READ_CEILING: '20000'" in wf and 'workflow_dispatch:' in wf and 'branches: [dev]' not in wf,'Build 289 accepted evidence workflow must be manual-only')
for token in ('Build 289 — Real Inventory Adoption Outcomes Renewal','AUTONOMOUS_QUEUE_EXHAUSTED','36503337920','29 / 20,000'):
    q(token in doc,'Build 289 document missing '+token)
q('Build 289 — Real Inventory Adoption Outcomes Renewal' in road,'Roadmap lost Build 289')
if a.get('state') in ('DEVELOPMENT_GREEN','PRODUCTION_GREEN'):
    out=a.get('outcome_contract') or {}
    q(out.get('state')=='REAL_INVENTORY_ADOPTION_OUTCOMES_RENEWAL_GREEN','Build 289 accepted outcome state missing')
    q(out.get('measured_software_residual')=='NONE' and out.get('successor_justified') is False and out.get('queue_state')=='AUTONOMOUS_QUEUE_EXHAUSTED','Build 289 terminal renewal outcome mismatch')
    q((a.get('contract') or {}).get('future_queue_exhausted') is True,'Build 289 queue must be exhausted after acceptance')
if int(cur.get('build') or 0)==289:
    q(cur.get('title')=='Real Inventory Adoption Outcomes Renewal','Current Build 289 title mismatch')
for path in ('public/js/admin-site-item-inventory.js','functions/api/admin/_siteItemInventoryLegacy.js','functions/api/admin/inventory-bootstrap.js','functions/api/admin/amazon-link-preview.js','functions/api/admin/dashboard-summary.js','functions/api/admin/product-mobile-bootstrap.js','functions/api/admin/purchase-orders.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout))
print('RELEASE 467 BUILD 289 REAL INVENTORY ADOPTION OUTCOMES RENEWAL')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Canonical workstation categories / station roles / unit dropdowns / reorder N/A / missing-only Amazon enrichment')
