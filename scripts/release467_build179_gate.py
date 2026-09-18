#!/usr/bin/env python3
"""Release 467 Build 179 — Runtime responsiveness and Inventory layout recovery gate."""
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): FAIL.append(f'missing required file: {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
product=read('public/js/product-detail-v166.js')
trust=read('public/js/product-detail-build145.js')
parity=read('public/js/product-detail-parity.js')
seo=read('public/js/seo-page-overrides.js')
recent=read('public/js/recently-viewed-products.js')
page=read('shop/product/index.html')
overlay=read('public/js/site-image-quality-overlay-v152.js')
media_runtime=read('public/js/media-content-runtime.js')
authui=read('public/js/site-auth-ui.js')
studio=read('admin/media-content-studio/index.html')
inventory=read('admin/inventory-operations/index.html')
inventory_ui=read('public/js/admin-inventory-integrity-review.js')
options=read('public/js/admin-catalog-option-manager.js')
css=read('css/release467-build179-runtime-recovery.css')
doc=read('docs/operations/RELEASE_467_BUILD_179_RUNTIME_RESPONSIVENESS_INVENTORY_LAYOUT_RECOVERY.md')
req('new MutationObserver' not in trust,'Build 145 Product trust helper still uses a DOM MutationObserver')
req("dd:product-detail-rendered" in trust,'Build 145 must be event-driven from the Product renderer')
for token in ('AbortController','8000','/api/product-detail-core','DDProductDetailSnapshot','dd:product-detail-rendered'): req(token in product,f'Lean Product renderer missing Build 179 token: {token}')
req('MutationObserver' not in product and 'setInterval(' not in product,'Lean Product renderer gained polling/observer behavior')
req('/api/product-detail?slug=' not in parity,'Product parity still performs the retired duplicate Product detail read')
req('DDProductDetailSnapshot' in parity and 'dd:product-detail-rendered' in parity,'Product parity must consume the shared Product snapshot/event')
req('/api/product-detail?slug=' not in seo,'Product SEO still performs the retired duplicate Product detail read')
req('DDProductDetailSnapshot' in seo and 'dd:product-detail-rendered' in seo,'Product SEO must consume the shared Product snapshot/event')
req("pagePath === '/shop/'" in recent and "pagePath === '/shop/product/'" in recent,'Recently viewed optional helpers are not route-gated')
req(any(token in page for token in ('/public/js/product-detail-v166.js?v=179','/public/js/product-detail-v166.js?v=180')) and '/public/js/seo-page-overrides.js?v=179' in page,'Product page Build 179/180 cache keys missing')
req('observe(document.documentElement' not in overlay,'Image-quality overlay still observes the full documentElement')
req("attributeFilter:['src','class']" not in overlay,'Image-quality overlay still watches global class churn')
for token in ('IntersectionObserver','MAX_CONCURRENT_SCORES=1','#mediaSlotBoard img,#mediaLibraryGrid img,#mediaSelectedPreview','img[data-media-slot]','Placeholder / SVG','Image score unavailable','same Release 448 product-photo rubric'): req(token in overlay,f'Image-quality recovery missing retained token: {token}')
req("site-image-quality-overlay-v152.js?v=179" in media_runtime and "site-image-quality-overlay-v152.js?v=179" in studio,'Repaired image overlay cache key missing')
for route in ('/admin/media-content-studio/','/admin/inventory-operations/'): req(route in authui,f'Lean Admin startup missing route: {route}')
req(('Release 467 Build 179' in studio) or ('Release 467 Build 180' in studio),'Media Studio Build 179/180 identity missing')
req(any(token in inventory for token in ('release467-build179-runtime-recovery.css?v=179','release467-build179-runtime-recovery.css?v=180')) and (('Release 467 Build 179' in inventory) or ('Release 467 Build 180' in inventory)),'Inventory Build 179/180 page recovery not loaded')
for token in ('overflow-x:clip','overflow-wrap:anywhere','min-width:0','@media(max-width:1180px)','@media(max-width:760px)'): req(token in css,f'Inventory responsive CSS missing token: {token}')
req(any(token in inventory_ui for token in ('Release 467 Build 179 · Inventory truth &amp; usage','Release 467 Build 180 · staged Inventory truth &amp; usage')),'Inventory integrity current operator label missing')
req('operator UI refreshed in Build 179' in options,'Catalog option current operator label missing')
for token in ('code-only runtime/presentation build','no migration','R2 mutation','payment/refund'): req(token.lower() in doc.lower(),f'Build 179 safety document missing: {token}')
if FAIL:
    print('RELEASE 467 BUILD 179 RUNTIME RESPONSIVENESS: FAIL')
    [print('-',x) for x in FAIL]
    sys.exit(1)
print('RELEASE 467 BUILD 179 RUNTIME RESPONSIVENESS: PASS')
print('Product detail: ONE bounded core Product read / shared snapshot / observer-free enhancer')
print('Media Studio: scoped observer roots / visible-first / single-concurrency scoring')
print('Inventory Operations: viewport-contained responsive operator layout')
print('Schema/D1/R2/provider/payment/accounting mutation: NONE')
