#!/usr/bin/env python3
"""Fail-closed source contract for Release 466 Build 3 — Revenue & Business Intelligence."""
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):
 p=ROOT/path
 if not p.is_file():FAIL.append(f'missing required file: {path}');return''
 return p.read_text(encoding='utf-8',errors='replace')
def has(body,*tokens,label='file'):
 for token in tokens:req(token in body,f'{label} missing required contract: {token}')
a=json.loads(read('release466-build3-revenue-business-intelligence.json') or '{}');req(a.get('release')==466 and a.get('build')==3,'authority must identify Release 466 Build 3');req(a.get('state') in {'implementation_in_progress','development_green'},'unexpected Build 3 state');req(a.get('schema_change_required') is False and a.get('migration') is None,'Build 3 must remain schema-neutral');items={int(x.get('id') or 0):x for x in a.get('items',[]) if isinstance(x,dict)};req(set(items)=={11,12,13,14,15},'Build 3 must own exactly items 11-15');req(all(items[i].get('status') in {'implementation_in_progress','development_green','complete_development_green'} for i in items),'Build 3 item lifecycle drifted')
for key in ('production_business_mutation','production_schema_mutation','provider_execution','provider_publication','payment_execution','inventory_mutation','accounting_posting','automatic_price_change','automatic_reorder','automatic_project_start','raw_r2_delete','request_time_schema_ddl'):req((a.get('safety') or {}).get(key) is False,f'safety flag must remain false: {key}')
req((a.get('safety') or {}).get('preview_access_must_remain_enforced') is True,'Preview Access must remain enforced');req((a.get('safety') or {}).get('main_must_remain_release465_until_deliberate_promotion') is True,'main must remain Release 465')
api=read('functions/api/admin/release466-revenue-business-intelligence.js');alias=read('functions/api/admin/release-revenue-business-intelligence.js');page=read('admin/release-control/revenue-business-intelligence/index.html');client=read('public/js/admin-release466-revenue-business-intelligence.js')
has(api,'loadFunnel','loadSearchIntelligence','loadProductOpportunity','loadReorderEconomics','loadCreativePriority','loadProfitabilityIntelligence','site_search_events','inventory_supply_replenishment_profiles','inventory_supply_source_options','creative_project_profitability','recommendation only','automatic_reorder:false','automatic_project_start:false',label='Build 3 API');req('export async function onRequestGet' in api,'Build 3 API must expose GET');req(not re.search(r'\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE)\b',api,re.I),'Build 3 API must remain SQL read-only');req('onRequestPost' not in api and 'onRequestPut' not in api and 'onRequestDelete' not in api,'Build 3 API must remain GET-only');req("export { onRequestGet }" in alias,'release-route alias must export GET only')
req(page.lower().count('<h1')==1,'Build 3 cockpit must have exactly one H1');has(page,'Revenue &amp; Business Intelligence','recommendation-only','/admin/business-health/','/admin/inventory-creator-intelligence/',label='Build 3 cockpit');has(client,'/api/admin/release-revenue-business-intelligence','Storefront conversion funnel','Search demand and abandonment','Explainable Product opportunity','Inventory reorder economics','Creative project priority',label='Build 3 client')
manifest=json.loads(read('migrations/canonical/manifest.json') or '{}');req([x.get('file') for x in manifest.get('migrations',[])]==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'Build 3 must preserve exact canonical migrations 0001-0004');req(not list((ROOT/'migrations/canonical').glob('*466*build3*')),'Build 3 declared schema-neutral but a Build 3 migration exists')
release=json.loads(read('development-release.json') or '{}');req(release.get('convergence_state')=='release466_build2_development_green_external_ruleset_pending','Build 3 must start from closed Build 2 Development authority');req((release.get('current_release_database_state') or {}).get('build3_schema_change_required') is False,'development-release must keep Build 3 schema-neutral')
print('RELEASE 466 BUILD 3 SOURCE CONTRACT');print('Items: 11 funnel; 12 search abandonment; 13 Product opportunity; 14 reorder economics; 15 Creative priority');print('Schema change: NONE');print('Automatic business action: ZERO');print('Production mutation/provider/payment execution: ZERO')
if FAIL:
 print('RELEASE 466 BUILD 3 SOURCE CONTRACT: FAIL');[print(f'{i:03d}. {m}') for i,m in enumerate(FAIL,1)];raise SystemExit(1)
print('RELEASE 466 BUILD 3 SOURCE CONTRACT: PASS')
