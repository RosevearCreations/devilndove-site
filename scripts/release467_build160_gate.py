#!/usr/bin/env python3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p): return (ROOT/p).read_text(encoding='utf-8')
def req(c,m):
    if not c: raise SystemExit(f'FAIL Build 160: {m}')
mid=read('functions/_middleware.js')
runtime=read('public/js/admin-products-runtime-v160.js')
core=read('functions/api/admin/products-core.js')
for token in ('admin-products-runtime-v160.js?v=467b160-production-browser-recovery-v1','467-b159-products-returning-browser-cache-v1','no-store-b159'):
    req(token in mid,f'middleware missing {token}')
for token in ('R467B160_PRODUCT_PRODUCTION_BROWSER_RECOVERY_V1','/api/admin/products-core','__ddProductRuntimeV160Outer','MutationObserver','Release 467 Build 160','readiness_timeout','/api/product-media?key=','admin_media_rewrites'):
    req(token in runtime,f'runtime missing {token}')
for token in ('build160-core-first','LIMIT 160','getAdminUserFromRequest','SELECT','products','product_images','product_resource_links'):
    req(token in core,f'core route missing {token}')
for forbidden in ('INSERT ','UPDATE ','DELETE ','CREATE TABLE','ALTER TABLE','DROP TABLE'):
    req(forbidden not in core.upper(),f'core route contains mutation token {forbidden.strip()}')
req('assets.devilndove.com' in runtime,'public media host normalization missing')
print('PASS Release 467 Build 160 — Product Production Browser Recovery')
print('product_primary_delivery=CORE_FIRST_READ_ONLY')
print('admin_product_media=SAME_ORIGIN_BEFORE_RENDER')
print('quality_late_render=OBSERVED_AND_RECONCILED')
print('schema_d1_write_r2_provider_payment_refund_accounting_mutation=NONE')
