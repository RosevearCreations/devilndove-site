#!/usr/bin/env python3
"""Static acceptance gate for Release 464 Update 3 — Business Application Growth (append-safe)."""
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f"missing required file: {path}");return ""
    return p.read_text(encoding='utf-8',errors='replace')
def req(ok,message):
    if not ok: FAIL.append(message)
def contains_all(body,tokens,label):
    for token in tokens:req(token in body,f"{label} missing required contract: {token}")
authority=json.loads(read('release464-update3-business-growth.json') or '{}')
req(int(authority.get('release') or 0)==464 and int(authority.get('update') or 0)==3,'Update 3 release/update identity drifted')
req([x.get('id') for x in authority.get('items',[])]==[14,15,16,17,18,19,20],'Update 3 authority must contain items 14-20')
safety=authority.get('safety',{})
for key in ('production_mutation','provider_execution','provider_publication','inventory_stock_mutation_from_update3_pipeline','accounting_posting_from_update3_pipeline','request_time_schema_ddl'):req(safety.get(key) is False,f'Update 3 safety boundary must remain false: {key}')
req(safety.get('preview_access_must_remain_enforced') is True,'Update 3 must preserve Cloudflare Access')
migration=read('migrations/canonical/0003_release464_business_growth.sql')
contains_all(migration,('CREATE TABLE IF NOT EXISTS storefront_merchandising_rules','CREATE TABLE IF NOT EXISTS creative_business_pipelines','CREATE TABLE IF NOT EXISTS creative_business_pipeline_events','FOREIGN KEY (storefront_collection_id)','FOREIGN KEY (creative_business_pipeline_id)'),'migration 0003')
req('ALTER TABLE' not in migration.upper(),'Update 3 migration must remain additive and must not ALTER legacy business tables')
public_merch=read('functions/api/storefront-merchandising.js')
shared_merch=read('functions/api/_lib/storefrontMerchandising.js')
contains_all(public_merch,('storefront_merchandising_rules','projectStorefrontMerchandising','product_link_authority'),'public Storefront merchandising')
contains_all(shared_merch,('/shop/product/?slug=${encodeURIComponent(slug)}','activeRuleAt','membershipMap','projectStorefrontMerchandising'),'shared Storefront merchandising semantics')
admin_merch=read('functions/api/admin/storefront-merchandising.js');admin_merch_ui=read('admin/storefront-merchandising/index.html');admin_merch_js=read('public/js/admin-storefront-merchandising.js')
contains_all(admin_merch,('save_rule','remove_rule','storefront_merchandising_rules','update3_schema_not_ready'),'Storefront rule API')
contains_all(admin_merch_ui,('Scheduled merchandising rules','merchRuleFrom','merchRuleUntil','merchRuleEffect','merchRulePriority'),'Storefront rule UI')
contains_all(admin_merch_js,('save_rule','remove_rule','merchRuleFrom','merchRuleUntil','state.rules'),'Storefront rule client')
seo=read('public/js/seo-page-overrides.js')
contains_all(seo,('https://devilndove.com/shop/product/?slug=',"'@type':'Product'","'@type':'Offer'","'@type':'BreadcrumbList'",'aggregateRating','/api/storefront-merchandising'),'Product SEO runtime')
product_page=read('shop/product/index.html');req(product_page.lower().count('<h1')==1,'Product page must retain exactly one source H1');req('/public/js/seo-page-overrides.js' in product_page,'Product page must load dynamic SEO runtime')
genealogy=read('functions/api/admin/product-genealogy-trace.js')
contains_all(genealogy,("mutation_capability:'none'",'inventory_purchase_lots','product_production_run_material_lots','product_finished_inventory_lots','order_items','historical_reconstruction_claimed:false'),'material genealogy route')
req('export async function onRequestPost' not in genealogy and 'export async function onRequestDelete' not in genealogy,'material genealogy route must remain GET-only')
for token in ('UPDATE site_item_inventory','DELETE FROM inventory_purchase_lots','INSERT INTO site_inventory_movements','.delete('):req(token not in genealogy,f'material genealogy route contains forbidden mutation token: {token}')
month_page=read('admin/month-end/index.html');month_js=read('public/js/admin-month-end-cockpit.js')
contains_all(month_page,('Month-End Cockpit','monthEndCockpit','/admin/accounting/'),'Month-End page');contains_all(month_js,('/api/admin/accounting-close-workflow?period_month=','close_readiness','evidence_bundle_summary','mutation capability is not present'),'Month-End client')
for token in ("method:'POST'",'method:"POST"',"method:'PUT'","method:'DELETE'",'INSERT INTO','UPDATE accounting_'):req(token not in month_js,f'Month-End cockpit must remain read-only; found {token}')
pipeline=read('functions/api/admin/business-growth-pipeline.js')
contains_all(pipeline,('provider_execution_active:false','publication_active:false','inventory_mutation_active:false','accounting_posting_active:false','creative_business_pipelines','creative_business_pipeline_events','No Inventory, accounting or provider execution was performed.'),'business pipeline')
for token in ('UPDATE site_item_inventory','INSERT INTO site_inventory_movements','INSERT INTO accounting_','UPDATE accounting_','PRODUCT_MEDIA_BUCKET.delete','CAIP_PRIVATE_MEDIA_BUCKET.delete'):req(token not in pipeline,f'business pipeline contains forbidden cross-domain mutation: {token}')
pipeline_page=read('admin/business-pipeline/index.html');pipeline_js=read('public/js/admin-business-pipeline.js')
contains_all(pipeline_page,('Creative Business Pipeline','Material genealogy','/admin/accounting/','/admin/storefront-merchandising/'),'business pipeline page');contains_all(pipeline_js,('/api/admin/business-growth-pipeline','/api/admin/product-genealogy-trace','sync_from_product'),'business pipeline client')
it_api=read('functions/api/admin/it-operations-dashboard.js');it_page=read('admin/it-platform/index.html')
contains_all(it_api,('expected:3','provider_execution_invoked:false','production_mutation_invoked:false','raw_r2_delete_invoked:false','creative_business_pipelines','storefront_merchandising_rules'),'I.T. dashboard API');contains_all(it_page,('Release 464','Update 3','I.T. Operations Dashboard','/admin/business-pipeline/','/admin/accounting/'),'I.T. dashboard page')
print('RELEASE 464 UPDATE 3 BUSINESS APPLICATION GROWTH')
print('Items: 14-20')
print('Migration: canonical 0003 additive only')
print('Storefront merchandising semantics: CARRIED FORWARD / SHARED EVALUATOR ALLOWED')
print('Inventory genealogy: EXISTING BUILD 440 AUTHORITY / READ ONLY')
print('Month-end: EXISTING ACCOUNTING CLOSE AUTHORITY / READ ONLY')
print('Provider execution/publication: CLOSED')
print('Production mutation: CLOSED')
if FAIL:
    print('RELEASE 464 UPDATE 3 GATE: FAIL')
    for i,item in enumerate(FAIL,1):print(f'{i:03d}. {item}')
    raise SystemExit(1)
print('RELEASE 464 UPDATE 3 GATE: PASS')
