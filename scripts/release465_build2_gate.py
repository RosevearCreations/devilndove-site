#!/usr/bin/env python3
"""Release 465 Build 2 historical acceptance, append-safe for later releases."""
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing required file: {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
 if not ok:FAIL.append(msg)
def has(body,*tokens,label='file'):
 for token in tokens:req(token in body,f'{label} missing required contract: {token}')
a=json.loads(read('release465-build2-inventory-creator-intelligence.json') or '{}');req(int(a.get('release') or 0)==465 and int(a.get('build') or 0)==2,'Build 2 identity drifted');req(a.get('state')=='complete_development_green','Build 2 authority must remain Development green');req([x.get('id') for x in a.get('items',[])]==[8,9,10,11,12,13] and all(x.get('status')=='complete_development_green' for x in a.get('items',[])),'Build 2 items must remain green');req(a.get('schema_change_required') is False and a.get('migration') is None,'Build 2 must remain schema-neutral')
for key in ('production_mutation','provider_execution','provider_publication','inventory_consumption','production_posting','accounting_posting','automatic_relationship_write','automatic_next_action_execution','historical_genealogy_reconstruction','raw_r2_delete','request_time_schema_ddl'):req((a.get('safety') or {}).get(key) is False,f'Build 2 safety drifted: {key}')
manifest=json.loads(read('migrations/canonical/manifest.json') or '{}');req([x.get('file') for x in manifest.get('migrations',[])]==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'Build 2 must preserve canonical 0001-0004')
helper=read('functions/api/_lib/inventoryCreatorIntelligence.js');lot=read('functions/api/_lib/productLotProvenance.js');endpoint=read('functions/api/admin/inventory-creator-intelligence.js');page=read('admin/inventory-creator-intelligence/index.html');client=read('public/js/admin-inventory-creator-intelligence.js')
has(helper,'loadMaterialLotPlan','loadProductAvailabilityIntelligence','loadRelatedProductIntelligence','loadGenealogyExceptions','loadCreativeReadinessIntelligence','chooseNextSafeAction','actual_planned_quantity_claimed:false','historical_reconstruction_claimed:false','automatic_relationship_write:false','inventory_mutation_active:false','accounting_posting_active:false',label='Build 2 helper');has(helper+'\n'+lot,'product_resource_links','site_item_inventory','inventory_purchase_lots','product_production_runs','creative_projects','creative_media_evidence_ranges','creative_business_pipelines',label='Build 2 reused authority');req('onRequestPost' not in endpoint and 'onRequestPut' not in endpoint and 'onRequestDelete' not in endpoint,'Build 2 API must remain GET-only');req(page.lower().count('<h1')==1,'Build 2 cockpit must retain one H1');has(client,'/api/admin/inventory-creator-intelligence','renderAvailability','renderRelated','renderGenealogy','renderCreative','renderNext',label='Build 2 client')
release=json.loads(read('development-release.json') or '{}');req(int(release.get('release') or 0)>=465,'current release must not regress below 465');req(all(x.get('status')=='complete_development_green' for x in release.get('release465_build2',[])),'current authority must preserve Release 465 Build 2 completion');req(int((release.get('current_release_database_state') or {}).get('development_native_migration_rows') or 0)==4 and int((release.get('current_release_database_state') or {}).get('development_migration_proof_rows') or 0)==4,'Build 2 must preserve 4/4 migration proof')
print('RELEASE 465 BUILD 2 — INVENTORY & CREATOR INTELLIGENCE — HISTORICAL APPEND SAFE')
if FAIL:
 print('FAIL');[print(f'{i:03d}. {x}') for i,x in enumerate(FAIL,1)];raise SystemExit(1)
print('PASS')
