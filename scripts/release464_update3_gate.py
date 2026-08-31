#!/usr/bin/env python3
"""Release 464 Update 3 historical acceptance, append-safe for later Release 465 extensions."""
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
a=json.loads(read('release464-update3-business-growth.json') or '{}');req(int(a.get('release') or 0)==464 and int(a.get('update') or 0)==3,'Update 3 identity drifted');req([x.get('id') for x in a.get('items',[])]==[14,15,16,17,18,19,20],'Update 3 items drifted')
for key in ('production_mutation','provider_execution','provider_publication','inventory_stock_mutation_from_update3_pipeline','accounting_posting_from_update3_pipeline','request_time_schema_ddl'):req((a.get('safety') or {}).get(key) is False,f'Update 3 safety drifted: {key}')
req((a.get('safety') or {}).get('preview_access_must_remain_enforced') is True,'Update 3 must preserve Cloudflare Access')
m=read('migrations/canonical/0003_release464_business_growth.sql');has(m,'CREATE TABLE IF NOT EXISTS storefront_merchandising_rules','CREATE TABLE IF NOT EXISTS creative_business_pipelines','CREATE TABLE IF NOT EXISTS creative_business_pipeline_events',label='migration 0003');req('ALTER TABLE' not in m.upper(),'Update 3 migration must remain additive')
shared=read('functions/api/_lib/storefrontMerchandising.js');public=read('functions/api/storefront-merchandising.js');has(shared,'projectStorefrontMerchandising','activeRuleAt','membershipMap','/shop/product/?slug=${encodeURIComponent(slug)}',label='Storefront evaluator');has(public,'projectStorefrontMerchandising','product_link_authority',label='public merchandising')
seo=read('public/js/seo-page-overrides.js');has(seo,"'@type':'Product'","'@type':'Offer'","'@type':'BreadcrumbList'",'/api/storefront-merchandising',label='Product SEO');product=read('shop/product/index.html');req(product.lower().count('<h1')==1,'Product page must retain one H1')
g=read('functions/api/admin/product-genealogy-trace.js');has(g,"mutation_capability:'none'",'inventory_purchase_lots','product_production_run_material_lots','product_finished_inventory_lots','order_items','historical_reconstruction_claimed:false',label='genealogy');req('onRequestPost' not in g and 'onRequestDelete' not in g,'genealogy must remain GET-only')
p=read('functions/api/admin/business-growth-pipeline.js');has(p,'provider_execution_active:false','publication_active:false','inventory_mutation_active:false','accounting_posting_active:false','creative_business_pipelines',label='business pipeline')
month=read('public/js/admin-month-end-cockpit.js');req('/api/admin/accounting-close-workflow?period_month=' in month or '/api/admin/release465-business-health?period_month=' in month,'Month-End must read existing accounting authority directly or through later read-only wrapper');req('method:\'POST\'' not in month and 'method:"POST"' not in month,'Month-End cockpit must remain non-posting')
it=read('functions/api/admin/it-operations-dashboard.js');has(it,'provider_execution_invoked:false','production_mutation_invoked:false','raw_r2_delete_invoked:false','creative_business_pipelines','storefront_merchandising_rules',label='I.T. dashboard');req('expected:3' in it or 'RELEASE465_EXPECTED_MIGRATIONS' in it,'I.T. dashboard must retain migration-readiness authority')
print('RELEASE 464 UPDATE 3 BUSINESS APPLICATION GROWTH — APPEND SAFE')
if FAIL:
 print('FAIL');[print(f'{i:03d}. {x}') for i,x in enumerate(FAIL,1)];raise SystemExit(1)
print('PASS')
