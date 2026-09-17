#!/usr/bin/env python3
"""Release 467 Build 165 Product Browser/Image Recovery continuity gate, successor-aware through Build 174."""
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
css=read('css/admin-product-v162.css');crud_page=read('admin/catalog-media/index.html');crud_client_path='public/js/admin-product-media-editor-v172.js' if 'admin-product-media-editor-v172.js' in crud_page else 'public/js/admin-product-media-editor-v164.js';crud_js=read(crud_client_path);image_api=read('functions/api/admin/product-image-editor.js');file_api=read('functions/api/admin/product-image-file.js')
for token in ('productBrowserPageSize','Image Editor'):
    req(token in products,f'Product Browser missing compact-browser continuity token: {token}')
req(('Build 165' in products) or ('Build 166' in products) or ('Build 170' in products),'Product Browser lost Build 165+ identity')
for token in ('const limit=()=>','pageSize?.addEventListener'):
    req(token in browser,f'Product Browser client missing explicit paging token: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products','/api/admin/product-readiness','/api/admin/product-lineage'):
    req(forbidden not in browser,f'Product Browser gained eager/heavy path: {forbidden}')
req(('product-browser-images-v165' in thumb_api) or ('product-browser-images-v170-explicit' in thumb_api),'thumbnail recovery API is not a recognized Build 165+ successor')
for token in ('FROM product_images','FROM product_media_role_assignments','FROM media_assets','r2_listing:false'):
    req(token in thumb_api,f'thumbnail recovery API missing: {token}')
req(any(token in editor for token in ('Build 165','Build 168','Build 169','Build 173','Build 174')),'Product Editor lost recognized Build 165+ identity')
for token in ('data-use-featured-url','admin_recovery=1'):
    req(token in editor_js,f'Product Editor media recovery continuity missing: {token}')
req(('recovered_reference_count' in editor_js) or ('featured_reference_from_product_authority' in editor_js and '/api/admin/product-editor-media' in editor_js),'Product Editor media recovery/authority continuity missing')
req(('product-media-workspace-v165' in media_api) or ('product-media-workspace-v172' in media_api),'Product media recovery is not a recognized Build 165+ successor')
for token in ('FROM product_images','FROM product_media_role_assignments','FROM media_assets','r2_listing:false'):
    req(token in media_api,f'Product media recovery missing: {token}')
for source,label in ((thumb_api,'thumbnail recovery API'),(media_api,'Product media recovery API')):
    for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):
        req(forbidden not in source.upper(),f'{label} contains request-time schema mutation token: {forbidden}')
    req('.list(' not in source and 'bucket.list' not in source,f'{label} must not list R2')
    req('getAdminUserFromRequest' not in source,f'{label} must use route-guard admin context')
for token in ('.dd-product-table-v165','height:64px','width:48px','dd-product-rows-label'):
    req(token in css,f'compact Product CSS missing: {token}')
for token in ('product-media-v164','Add image','Replace selected','Remove selected','Move earlier','Crop / sizing'):
    req(token in crud_page,f'Product media CRUD continuity missing: {token}')
for token in ('/api/admin/product-image-file',"action:'remove'","action:'reorder'",'square_1200','landscape_1600'):
    req(token in crud_js,f'Product media editing client continuity missing: {token}')
for token in ("action==='remove'","action==='reorder'",'PRIMARY_MIN_WIDTH=1200','PRIMARY_MIN_SCORE=70'):
    req(token in image_api,f'image metadata/scoring continuity missing: {token}')
for token in ('bucket.put','INSERT INTO product_images','UPDATE product_images SET image_url','r2_listing:false','automatic_scoring:false'):
    req(token in file_api,f'image file continuity missing: {token}')
if crud_client_path.endswith('v172.js'):
    for token in ('Saved ✓','fetchProduct(state.productId)','fetchImage(targetId)','row.editable===false'):
        req(token in crud_js,f'Build 172 media reliability missing: {token}')
    req('recovered_references_editable:false' in media_api,'Build 172 recovered-reference guard missing')
for path in ('public/js/admin-products-browser-v162.js','public/js/admin-product-editor-v163.js','functions/api/admin/product-browser-images.js','functions/api/admin/product-media-editor.js',crud_client_path,'functions/api/admin/product-image-editor.js','functions/api/admin/product-image-file.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 165+ PRODUCT BROWSER + IMAGE RECOVERY: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 165+ PRODUCT BROWSER + IMAGE RECOVERY: PASS')
print('Product Browser: compact explicit paging only')
print('Product media: canonical gallery first; recovered references display-only in Build 172')
print('Image CRUD/crop/reorder/save confirmation: PRESERVED')
print('R2 listing/background retry/request-time DDL: NONE')
