#!/usr/bin/env python3
"""Release 467 Build 165 — Product Browser Compactness & Existing-Image Recovery gate."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')
products=read('admin/products/index.html');browser=read('public/js/admin-products-browser-v162.js');thumb_api=read('functions/api/admin/product-browser-images.js')
editor=read('admin/product-editor/index.html');editor_js=read('public/js/admin-product-editor-v163.js');media_api=read('functions/api/admin/product-media-editor.js')
css=read('css/admin-product-v162.css');crud_page=read('admin/catalog-media/index.html');crud_js=read('public/js/admin-product-media-editor-v164.js');image_api=read('functions/api/admin/product-image-editor.js');file_api=read('functions/api/admin/product-image-file.js')
for token in ('Build 165','Eight compact rows','productBrowserPageSize','Low-read / image-recovery details','Image Editor'):
    req(token in products,f'Build 165 Product Browser missing: {token}')
for token in ('const limit=()=>','source=recovered.source','admin_recovery=1','recovered_count','pageSize?.addEventListener'):
    req(token in browser,f'Build 165 Product Browser client missing: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products','/api/admin/product-readiness','/api/admin/product-lineage'):
    req(forbidden not in browser,f'Build 165 Product Browser gained eager/heavy path: {forbidden}')
for token in ('product-browser-images-v165','featured_image_url','FROM product_images','FROM product_media_role_assignments','FROM media_assets','visible_product_ids_multi_source_only','r2_listing:false'):
    req(token in thumb_api,f'Build 165 thumbnail recovery API missing: {token}')
for token in ('Build 165','product-editor-v165','Opening Media','Open Image Editor'):
    req(token in editor,f'Build 165 Product Editor missing: {token}')
for token in ('recovered existing reference','data-use-featured-url','admin_recovery=1','recovered_reference_count'):
    req(token in editor_js,f'Build 165 Product Editor client missing: {token}')
for token in ('product-media-workspace-v165','source_order','FROM product_images','FROM product_media_role_assignments','FROM media_assets','r2_listing:false'):
    req(token in media_api,f'Build 165 Product media recovery missing: {token}')
for source,label in ((thumb_api,'thumbnail recovery API'),(media_api,'Product media recovery API')):
    for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','PRAGMA','sqlite_master'):
        req(forbidden not in source.upper(),f'{label} contains request-time schema/introspection token: {forbidden}')
    req('.list(' not in source and 'bucket.list' not in source,f'{label} must not list R2')
    req('getAdminUserFromRequest' not in source,f'{label} must use route-guard admin context')
for token in ('.dd-product-table-v165','height:64px','width:48px','dd-product-rows-label'):
    req(token in css,f'Build 165 compact Product CSS missing: {token}')
for token in ('product-media-v164','Add image','Replace selected','Remove selected','Move earlier','Crop / sizing'):
    req(token in crud_page,f'Build 164 image editing continuity missing: {token}')
for token in ('/api/admin/product-image-file',"action:'remove'","action:'reorder'",'square_1200','landscape_1600'):
    req(token in crud_js,f'Build 164 image editing client continuity missing: {token}')
for token in ("action==='remove'","action==='reorder'",'PRIMARY_MIN_WIDTH=1200','PRIMARY_MIN_SCORE=70'):
    req(token in image_api,f'Build 164 image metadata/scoring continuity missing: {token}')
for token in ('bucket.put','INSERT INTO product_images','UPDATE product_images SET image_url','r2_listing:false','automatic_scoring:false'):
    req(token in file_api,f'Build 164 image file continuity missing: {token}')
for path in ('public/js/admin-products-browser-v162.js','public/js/admin-product-editor-v163.js','functions/api/admin/product-browser-images.js','functions/api/admin/product-media-editor.js','public/js/admin-product-media-editor-v164.js','functions/api/admin/product-image-editor.js','functions/api/admin/product-image-file.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 165 PRODUCT BROWSER + IMAGE RECOVERY: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 165 PRODUCT BROWSER + IMAGE RECOVERY: PASS')
print('Product Browser: 8-row compact default / 8-16-24 operator paging')
print('Visible thumbnails: featured -> gallery -> media role -> media asset')
print('Product Editor Media: lazy multi-source existing-reference recovery')
print('Build 164 image CRUD/crop/reorder/score continuity: PRESERVED')
print('R2 listing/background retry/schema introspection: NONE')
