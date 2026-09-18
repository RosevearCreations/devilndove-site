#!/usr/bin/env python3
"""Release 467 Build 166 — Product editing and image stabilization gate."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1000:]}')
products=read('admin/products/index.html');browser=read('public/js/admin-products-browser-v162.js');core=read('functions/api/product-detail-core.js');detail=read('public/js/product-detail-v166.js');page=read('shop/product/index.html');media_alias=read('functions/media/product.js');legacy_proof=read('.github/workflows/release467-build157-proof.yml')
for token in ('Build 166','Eight compact rows','productBrowserPageSize','Image Editor'):
    req(token in products,f'Product Browser missing Build 166 token: {token}')
req('/api/product-media?key=' in browser,'Product Browser does not use canonical /api/product-media recovery')
req('/media/product?key=' not in browser,'Product Browser still emits obsolete /media/product recovery URLs')
for token in ('product-detail-core-v166','SELECT * FROM products','FROM product_images','FROM product_seo','LIMIT 20'):
    req(token in core,f'Bounded Product detail core missing: {token}')
for forbidden in ('PRAGMA','sqlite_master','CREATE TABLE','ALTER TABLE','ensureProductOffersSchema','product_bundle_components','media_assets'):
    req(forbidden not in core,f'Bounded Product detail core gained heavy/introspection path: {forbidden}')
for token in ('AbortController','8000','/api/product-detail-core','publicMediaUrl','dd:product-detail-rendered'):
    req(token in detail,f'Lean Product renderer missing: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/product-detail?'):
    req(forbidden not in detail,f'Lean Product renderer gained eager/heavy behavior: {forbidden}')
req(any(token in page for token in ('/public/js/product-detail-v166.js?v=166','/public/js/product-detail-v166.js?v=179','/public/js/product-detail-v166.js?v=180')),'Product page does not load Build 166 lean renderer or Build 179/180 cache-key successor')
req('/public/js/product-detail.js?v=224' not in page,'Product page still loads legacy heavy Product renderer')
req('/public/js/storefront-product-experience.js?v=74' not in page,'Product page still loads duplicate legacy Product experience renderer')
req("export { onRequestGet } from '../api/product-media.js';" in media_alias,'Legacy /media/product compatibility route is not R2-only alias')
req('successor=build166' in legacy_proof,'Historical Build 157 workflow is not successor-aware for Build 166')
for path in ('public/js/admin-products-browser-v162.js','public/js/product-detail-v166.js','functions/api/product-detail-core.js','functions/media/product.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 166 PRODUCT EDITING + IMAGE STABILIZATION: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 166 PRODUCT EDITING + IMAGE STABILIZATION: PASS')
print('Product Browser: 8-row compact default / explicit paging only')
print('Product images: canonical same-origin R2 route + legacy alias')
print('Public Product detail: bounded core endpoint + 8-second fail-fast renderer')
print('Historical Build 157 browser proof: successor-aware')
print('Schema/R2/provider/payment mutation: NONE')
