#!/usr/bin/env python3
"""Release 467 Build 163 — Product Editor + Media/Image low-read rewrite source gate."""
# Exact-SHA revalidation marker: Build 163 low-read Product admin contract.
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def executable_js(source):
    return re.sub(r'//[^\n]*','',source)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')
products=read('admin/products/index.html')
browser_js=read('public/js/admin-products-browser-v162.js')
editor=read('admin/product-editor/index.html')
media_page=read('admin/catalog-media/index.html')
editor_js=read('public/js/admin-product-editor-v163.js')
media_js=read('public/js/admin-product-media-editor-v163.js')
editor_exec=executable_js(editor_js);media_exec=executable_js(media_js)
save_api=read('functions/api/admin/product-editor-save.js')
media_api=read('functions/api/admin/product-media-editor.js')
image_api=read('functions/api/admin/product-image-editor.js')
sw=read('sw.js')

req('product-browser-v162' in products,'Product Browser lost Build 162 bounded browser authority')
req('/admin/product-editor/?product_id=' in browser_js,'Product Browser lost direct Product Editor navigation')
for token in ('product-editor-v163','admin-product-editor-v163.js','Low-read contract:','No autosave','Open Media &amp; Image Editor'):
    req(token in editor,f'Product Editor missing Build 163 token: {token}')
for forbidden in ('admin-product-editor-v162.js','admin-products.js','admin-edit-product.js','admin-product-seo.js','admin-product-resources.js','admin-site-item-inventory.js','productEditorMediaMount'):
    req(forbidden not in editor,f'Product Editor eagerly embeds legacy subsystem: {forbidden}')
for token in ('/api/admin/product-editor-detail?product_id=','/api/admin/product-editor-save','No catalog refresh, media scan, scoring or readiness scan','Automatic retries are stopped'):
    req(token in editor_js,f'Product Editor client missing token: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products','/api/admin/product-readiness','/api/admin/product-lineage','/api/admin/product-editor-media'):
    req(forbidden not in editor_exec,f'Product Editor client gained eager/heavy path: {forbidden}')

for token in ('product-media-v163','admin-product-media-editor-v163.js','Measure &amp; Score Selected Image','Low-read contract:','Nothing scans the R2 library'):
    req(token in media_page,f'Product Media page missing Build 163 token: {token}')
for forbidden in ('admin-product-media-context.js','admin-product-media-convergence.js','admin-product-content-bridge.js','admin-product-images.js','admin-product-image-annotations.js','admin-r2-derivative-settings.js','admin-product-story-notes.js','admin-product-media-score.js','admin-product-listing-profiles.js','admin-product-seo.js','admin-candle-soap-specs.js','admin-route-usage.js','site-analytics.js'):
    req(forbidden not in media_page,f'Product Media still loads legacy/eager subsystem: {forbidden}')
for token in ('/api/admin/product-media-editor?product_id=','/api/admin/product-image-editor','/api/admin/product-browser?','No other Product images were read or rescored'):
    req(token in media_js,f'Product Media client missing token: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products','/api/admin/product-media-score','/api/admin/product-detail','/api/admin/media-content-studio'):
    req(forbidden not in media_exec,f'Product Media client gained automatic/heavy path: {forbidden}')

for source,label in ((save_api,'Product save API'),(media_api,'Product media API'),(image_api,'Image editor API')):
    for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):
        req(forbidden not in source.upper(),f'{label} contains request-time DDL: {forbidden}')
    req('getAdminUserFromRequest' not in source,f'{label} re-reads D1 authentication instead of using route-guard context')

for token in ('single-product-save-v163','UPDATE products SET','product_seo','background_work_started:false','media_sync_started:false','readiness_scan_started:false','X-DD-D1-Rows-Read'):
    req(token in save_api,f'Product save API missing token: {token}')
for forbidden in ('product_images','product_resource_links','content_projects','creative_projects','maybeQueueApprovedProductSocialPost','createOrRefreshContentProjectForProduct'):
    req(forbidden not in save_api,f'Low-read Product save touches unrelated authority: {forbidden}')

for token in ('product-media-workspace-v163','WHERE product_id=?','LIMIT 20','r2_listing:false','lazy:{image_detail:true,scoring:true,annotations:true,roles:true}','X-DD-D1-Rows-Read'):
    req(token in media_api,f'Product media projection missing token: {token}')
for forbidden in ('media_assets','product_resource_links','COUNT(','sqlite_master','PRAGMA'):
    req(forbidden not in media_api,f'Product media projection contains scan/introspection: {forbidden}')

for token in ('selected-product-image-v163','WHERE pi.product_image_id=? LIMIT 1','action===\'score\'','PRIMARY_MIN_WIDTH=1200','PRIMARY_MIN_HEIGHT=1200','PRIMARY_MIN_ALT=12','PRIMARY_MIN_SCORE=70','Scoring was not run automatically','ON CONFLICT(product_id,product_image_id)'):
    req(token in image_api,f'Image editor/scoring API missing token: {token}')
for forbidden in ('FROM products p LEFT JOIN product_images','LIMIT 300','COUNT(','media_assets','sqlite_master','PRAGMA'):
    req(forbidden not in image_api,f'Image editor/scoring API contains broad scan/introspection: {forbidden}')

req("if(shouldBypassCache(url))return;" in sw,'Service Worker no-cache bypass lost')
req("url.pathname.startsWith('/media/')" in sw,'Direct Product media must bypass Service Worker cache')
for path in ('public/js/admin-product-editor-v163.js','public/js/admin-product-media-editor-v163.js','functions/api/admin/product-editor-save.js','functions/api/admin/product-media-editor.js','functions/api/admin/product-image-editor.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 163 PRODUCT EDITOR + MEDIA LOW-READ REWRITE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 163 PRODUCT EDITOR + MEDIA LOW-READ REWRITE: PASS')
print('Product Browser: bounded catalog page / direct editor links')
print('Product Editor: one selected Product startup / explicit one-Product save / no autosave')
print('Media workspace: one selected Product gallery / max 20 / no R2 listing')
print('Image Editor: one selected image / metadata save and scoring are explicit actions')
print('Primary image score thresholds: 1200x1200 / alt 12 / score 70')
print('Automatic catalog/media/readiness/inventory/quality scans: NONE')
print('Request-time DDL: NONE')
