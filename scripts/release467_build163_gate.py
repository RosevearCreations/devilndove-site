#!/usr/bin/env python3
"""Release 467 Build 163 Product Editor/Media low-read continuity gate, successor-aware through Build 172."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def executable_js(source): return re.sub(r'//[^\n]*','',source)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')

products=read('admin/products/index.html');browser_js=read('public/js/admin-products-browser-v162.js')
editor=read('admin/product-editor/index.html');media_page=read('admin/catalog-media/index.html')
editor_js=read('public/js/admin-product-editor-v163.js')
if 'admin-product-media-editor-v172.js' in media_page: media_client_path='public/js/admin-product-media-editor-v172.js'
elif 'admin-product-media-editor-v164.js' in media_page: media_client_path='public/js/admin-product-media-editor-v164.js'
else: media_client_path='public/js/admin-product-media-editor-v163.js'
media_js=read(media_client_path);editor_exec=executable_js(editor_js);media_exec=executable_js(media_js)
save_api=read('functions/api/admin/product-editor-save.js');media_api=read('functions/api/admin/product-media-editor.js');image_api=read('functions/api/admin/product-image-editor.js');sw=read('sw.js')

req(('product-browser-v162' in products) or ('product-browser-v166' in products),'Product Browser lost bounded browser authority')
req('/admin/product-editor/?product_id=' in browser_js,'Product Browser lost direct Product Editor navigation')
for token in ('admin-product-editor-v163.js','Low-read contract:','No autosave','Open Media &amp; Image Editor'):
    req(token in editor,f'Product Editor missing Build 163+ token: {token}')
for forbidden in ('admin-product-editor-v162.js','admin-products.js','admin-edit-product.js','admin-product-seo.js','admin-product-resources.js','admin-site-item-inventory.js','productEditorMediaMount'):
    req(forbidden not in editor,f'Product Editor eagerly embeds legacy subsystem: {forbidden}')
for token in ('/api/admin/product-editor-detail?product_id=','/api/admin/product-editor-save','Automatic retries are stopped'):
    req(token in editor_js,f'Product Editor client missing token: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products','/api/admin/product-readiness','/api/admin/product-lineage','/api/admin/product-editor-media'):
    req(forbidden not in editor_exec,f'Product Editor client gained eager/heavy path: {forbidden}')

req(('product-media-v163' in media_page) or ('product-media-v164' in media_page),'Product Media page missing Build 163-or-later low-read identity')
for token in ('Measure &amp; Score Selected Image','Low-read contract:'):
    req(token in media_page,f'Product Media page missing low-read continuity token: {token}')
req(('admin-product-media-editor-v163.js' in media_page) or ('admin-product-media-editor-v164.js' in media_page) or ('admin-product-media-editor-v172.js' in media_page),'Product Media page has no recognized Build 163+ client')
req('R2 is never listed automatically' in media_page or 'without scanning the Product catalog or R2 library' in media_page,'Product Media page lost the no-R2-library-scan contract')
for forbidden in ('admin-product-media-context.js','admin-product-media-convergence.js','admin-product-content-bridge.js','admin-product-images.js','admin-product-image-annotations.js','admin-r2-derivative-settings.js','admin-product-story-notes.js','admin-product-media-score.js','admin-product-listing-profiles.js','admin-product-seo.js','admin-candle-soap-specs.js','admin-route-usage.js','site-analytics.js'):
    req(forbidden not in media_page,f'Product Media still loads legacy/eager subsystem: {forbidden}')
for token in ('/api/admin/product-media-editor?product_id=','/api/admin/product-image-editor','/api/admin/product-browser?'):
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

req(any(token in media_api for token in ('product-media-workspace-v163','product-media-workspace-v165','product-media-workspace-v172')),'Product media projection is not a recognized Build 163+ successor')
for token in ('WHERE pi.product_id=?','LIMIT 20','r2_listing:false','X-DD-D1-Rows-Read'):
    req(token in media_api,f'Product media projection missing bounded contract token: {token}')
for forbidden in ('COUNT(','sqlite_master','PRAGMA'):
    req(forbidden not in media_api,f'Product media projection contains broad scan/introspection: {forbidden}')
if 'product-media-workspace-v172' in media_api:
    for token in ('recovered_references_editable:false',"source_order:['gallery','featured','media role','media asset']"):
        req(token in media_api,f'Build 172 media successor contract missing: {token}')

req(any(token in image_api for token in ('selected-product-image-v163','selected-product-image-v172')),'Image editor API is not a recognized Build 163+ successor')
for token in ("action==='score'",'PRIMARY_MIN_WIDTH=1200','PRIMARY_MIN_HEIGHT=1200','PRIMARY_MIN_ALT=12','PRIMARY_MIN_SCORE=70','ON CONFLICT(product_id,product_image_id)'):
    req(token in image_api,f'Image editor/scoring API missing token: {token}')
req(('Scoring was not run automatically' in image_api) or ('scoring_started:false' in image_api),'Image save lost explicit no-automatic-scoring contract')
for forbidden in ('FROM products p LEFT JOIN product_images','LIMIT 300','COUNT(','media_assets','sqlite_master'):
    req(forbidden not in image_api,f'Image editor/scoring API contains broad scan/introspection: {forbidden}')
if 'selected-product-image-v172' in image_api:
    for token in ('save_confirmed:true','canonical_product_image_missing','upsertAnnotation'):
        req(token in image_api,f'Build 172 selected-image successor contract missing: {token}')

req("if(shouldBypassCache(url))return;" in sw,'Service Worker no-cache bypass lost')
req("url.pathname.startsWith('/media/')" in sw,'Direct Product media must bypass Service Worker cache')
for path in ('public/js/admin-product-editor-v163.js',media_client_path,'functions/api/admin/product-editor-save.js','functions/api/admin/product-media-editor.js','functions/api/admin/product-image-editor.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 163+ PRODUCT EDITOR + MEDIA LOW-READ CONTINUITY: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 163+ PRODUCT EDITOR + MEDIA LOW-READ CONTINUITY: PASS')
print(f'Current Product Media client: {media_client_path}')
print('Product Editor: one selected Product startup / explicit one-Product save / no autosave')
print('Media workspace: one selected Product / bounded gallery and recovery / no R2 listing')
print('Image Editor: one selected canonical image / explicit metadata save and scoring')
print('Request-time DDL/background catalog-media-readiness scans: NONE')
