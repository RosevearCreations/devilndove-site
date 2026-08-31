#!/usr/bin/env python3
"""Static acceptance for Release 465 Build 1 — Storefront & SEO Quality."""
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="replace")
def req(ok,msg):
    if not ok: FAIL.append(msg)
def has(body,*tokens,label="file"):
    for token in tokens: req(token in body,f"{label} missing required contract: {token}")

a=json.loads(read('release465-build1-storefront-quality.json') or '{}')
req(int(a.get('release') or 0)==465 and int(a.get('build') or 0)==1,'Release 465 Build 1 identity drifted')
req([x.get('id') for x in a.get('items',[])]==list(range(1,8)),'Build 1 authority must contain items 1-7')
for key in ('production_mutation','provider_execution','provider_publication','automatic_product_publication','automatic_internal_link_rewrite','raw_r2_delete','request_time_schema_ddl'):
    req(a.get('safety',{}).get(key) is False,f'Build 1 safety boundary must remain false: {key}')
req(a.get('safety',{}).get('preview_access_must_remain_enforced') is True,'Preview Access must remain enforced')
req(a.get('safety',{}).get('hard_publication_readiness_non_overrideable') is True,'hard publication readiness must be non-overrideable')

m=read('migrations/canonical/0004_release465_storefront_quality.sql')
has(m,'release465_products_block_unready_insert','release465_products_block_unready_activation','release465_product_seo_block_active_degrade','release465_product_seo_block_active_delete','release465_product_not_ready_for_storefront','release465_active_product_requires_seo',label='migration 0004')
req('ALTER TABLE' not in m.upper(),'migration 0004 must not ALTER legacy tables')
req('DROP TABLE' not in m.upper() and 'DROP TRIGGER' not in m.upper(),'migration 0004 must remain forward-only/non-destructive')

manifest=json.loads(read('migrations/canonical/manifest.json') or '{}')
files=[x.get('file') for x in manifest.get('migrations',[])]
req(files==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'canonical manifest must append exact 0004 after immutable 0001-0003')

helper=read('functions/api/_lib/storefrontMerchandising.js')
public_merch=read('functions/api/storefront-merchandising.js')
simulator=read('functions/api/admin/storefront-merchandising-simulator.js')
has(helper,'projectStorefrontMerchandising','activeRuleAt','membershipMap','/shop/product/?slug=${encodeURIComponent(slug)}',label='shared merchandising evaluator')
has(public_merch,"from './_lib/storefrontMerchandising.js'",'projectStorefrontMerchandising','product_link_authority',label='public merchandising')
has(simulator,"from '../_lib/storefrontMerchandising.js'",'simulate_at',"mutation_capability:'none'",'product_rows_rewritten:false',label='merchandising simulator')
for token in ('INSERT INTO','UPDATE products','DELETE FROM','.delete('): req(token not in simulator,f'merchandising simulator must be read-only: {token}')

quality_page=read('admin/storefront-quality/index.html')
quality_js=read('public/js/admin-storefront-quality.js')
req(quality_page.lower().count('<h1')==1,'Storefront Quality page must have exactly one H1')
has(quality_page,'noindex,nofollow','Product readiness','SEO &amp; structured data','Internal-link intelligence','Merchandising simulator','Search quality',label='Storefront Quality page')
has(quality_js,'/api/admin/products','/api/admin/structured-data-health','/api/admin/storefront-merchandising-simulator','scoreRelation','runSearchScan',label='Storefront Quality client')
for token in ("method:'POST'",'method:"POST"',"method:'PUT'", "method:'DELETE'",'INSERT INTO','UPDATE products'):
    req(token not in quality_js,f'Storefront Quality cockpit must remain read-only: {token}')

search=read('public/js/storefront-search-quality.js')
seo_runtime=read('public/js/seo-page-overrides.js')
has(search,"fetch('/api/products'",'distance(a,b)','similarity(query,p)','/shop/product/?slug=',label='search quality recovery')
for token in ("method:'POST'",'method:"POST"',"method:'DELETE'",'.delete('): req(token not in search,f'search recovery must not mutate: {token}')
has(seo_runtime,"script.src='/public/js/storefront-search-quality.js?v=465'","'@type':'Product'","'@type':'Offer'","'@type':'BreadcrumbList'",label='SEO/search runtime')

products=read('functions/api/admin/products.js')
has(products,'publish_readiness_score','image_quality_score','readiness_checks','effective_gallery_merchandising_score',label='existing Product readiness authority')
review=read('functions/api/admin/product-review-actions.js')
has(review,'requireAdminStepUp','publish_override','Override Publish requires an explicit note',label='existing Product publication workflow')

for path in ('docs/operations/RELEASE_465_THREE_BUILD_ROADMAP.md','scripts/repository_forward_sanity.py','.github/workflows/system-gate.yml'):
    req((ROOT/path).is_file(),f'Build 1 control file missing: {path}')

print('RELEASE 465 BUILD 1 — STOREFRONT & SEO QUALITY')
print('Items: 1-7')
print('Publication hard readiness: FAIL CLOSED')
print('Merchandising simulation: READ ONLY')
print('Internal-link/search intelligence: SUGGESTION ONLY')
print('Provider execution/publication: CLOSED')
print('Production mutation: CLOSED')
if FAIL:
    print('RELEASE 465 BUILD 1 GATE: FAIL')
    for i,item in enumerate(FAIL,1): print(f'{i:03d}. {item}')
    raise SystemExit(1)
print('RELEASE 465 BUILD 1 GATE: PASS')
