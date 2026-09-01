#!/usr/bin/env python3
"""Historical acceptance for Release 465 Build 1, append-safe for later releases."""
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
a=json.loads(read('release465-build1-storefront-quality.json') or '{}')
req(int(a.get('release') or 0)==465 and int(a.get('build') or 0)==1,'Release 465 Build 1 identity drifted')
req(a.get('state')=='complete_development_green','Build 1 authority must remain Development green')
req([x.get('id') for x in a.get('items',[])]==list(range(1,8)) and all(x.get('status')=='complete_development_green' for x in a.get('items',[])),'Build 1 items must remain green')
for key in ('production_mutation','provider_execution','provider_publication','automatic_product_publication','automatic_internal_link_rewrite','raw_r2_delete','request_time_schema_ddl'):req((a.get('safety') or {}).get(key) is False,f'Build 1 safety drifted: {key}')
req((a.get('safety') or {}).get('preview_access_must_remain_enforced') is True,'Preview Access must remain enforced')
e=a.get('development_evidence') or {};req(int(e.get('native_migration_rows') or 0)==4 and int(e.get('proof_rows') or 0)==4 and int(e.get('foreign_key_violations',-1))==0,'Build 1 migration/FK evidence drifted');req(int(e.get('release465_publication_triggers') or 0)==4,'Build 1 publication-trigger evidence drifted');req(e.get('preview_smoke_mode')=='CLOUDFLARE_ACCESS_PROTECTED' and int(e.get('preview_smoke_auth_headers_used') or 0)==0 and e.get('preview_access_weakened') is False,'Build 1 Access-safe evidence drifted')
manifest=json.loads(read('migrations/canonical/manifest.json') or '{}');req([x.get('file') for x in manifest.get('migrations',[])]==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'Build 1 canonical migration stream drifted')
m=read('migrations/canonical/0004_release465_storefront_quality.sql');has(m,'release465_products_block_unready_insert','release465_products_block_unready_activation','release465_product_seo_block_active_degrade','release465_product_seo_block_active_delete',label='migration 0004');req('ALTER TABLE' not in m.upper() and 'DROP TABLE' not in m.upper(),'migration 0004 must remain forward-only')
helper=read('functions/api/_lib/storefrontMerchandising.js');sim=read('functions/api/admin/storefront-merchandising-simulator.js');has(helper,'projectStorefrontMerchandising','activeRuleAt','membershipMap',label='merchandising evaluator');has(sim,'simulate_at',"mutation_capability:'none'",label='merchandising simulator')
page=read('admin/storefront-quality/index.html');client=read('public/js/admin-storefront-quality.js');req(page.lower().count('<h1')==1,'Storefront Quality must retain one H1');has(client,'/api/admin/products','/api/admin/structured-data-health','/api/admin/storefront-merchandising-simulator',label='Storefront Quality client')
release_runtime=read('functions/api/_lib/releaseAuthority.js');req(('CURRENT_RELEASE = 465' in release_runtime and 'Business Intelligence and Release Hardening' in release_runtime) or ('CURRENT_RELEASE = 466' in release_runtime and 'Operational Resilience and Commercial Readiness' in release_runtime),'current runtime release must be Release 465 or an append-safe later Release 466 authority')
release=json.loads(read('development-release.json') or '{}');req(int(release.get('release') or 0)>=465,'current release must not regress below 465');req(all(x.get('status')=='complete_development_green' for x in release.get('release465_build1',[])),'current authority must preserve Release 465 Build 1 completion')
print('RELEASE 465 BUILD 1 — HISTORICAL STOREFRONT & SEO QUALITY — APPEND SAFE')
if FAIL:
 print('FAIL');[print(f'{i:03d}. {x}') for i,x in enumerate(FAIL,1)];raise SystemExit(1)
print('PASS')
