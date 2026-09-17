#!/usr/bin/env python3
"""Release 467 Build 164 Product Media continuity gate, successor-aware through Build 172."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')
page=read('admin/catalog-media/index.html');client_path='public/js/admin-product-media-editor-v172.js' if 'admin-product-media-editor-v172.js' in page else 'public/js/admin-product-media-editor-v164.js';client=read(client_path)
image_api=read('functions/api/admin/product-image-editor.js');file_api=read('functions/api/admin/product-image-file.js');media_api=read('functions/api/admin/product-media-editor.js');helper=read('functions/api/admin/_productImageAnnotationsV172.js') if (ROOT/'functions/api/admin/_productImageAnnotationsV172.js').is_file() else ''
for token in ('Add image','Replace selected','Remove selected','Move earlier','Crop / sizing'):
    req(token in page,f'Product Media page missing continuity token: {token}')
req(('Build 164' in page) or ('Build 172' in page),'Product Media page lost Build 164+ identity')
for token in ('/api/admin/product-image-file',"action:'remove'","action:'reorder'",'square_1200','landscape_1600','window.confirm'):
    req(token in client,f'Product Media client missing continuity token: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products','/api/admin/media-assets','/api/admin/product-images'):
    req(forbidden not in client,f'Product Media client gained eager/heavy path: {forbidden}')
for token in ("action==='remove'","action==='reorder'",'r2_source_preserved:true','ordered_ids','PRIMARY_MIN_WIDTH=1200','PRIMARY_MIN_SCORE=70'):
    req(token in image_api,f'Image action API missing continuity token: {token}')
for token in ('bucket.put','INSERT INTO product_images','UPDATE product_images SET image_url','r2_listing:false','automatic_scoring:false'):
    req(token in file_api,f'Image file API missing continuity token: {token}')
for source,label in ((image_api,'image action API'),(file_api,'image file API'),(media_api,'media workspace API')):
    for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):
        req(forbidden not in source.upper(),f'{label} contains request-time schema mutation token: {forbidden}')
    req('getAdminUserFromRequest' not in source,f'{label} re-reads D1 authentication instead of route-guard context')
req('.list(' not in file_api.lower() and 'bucket.list' not in file_api.lower(),'one-file path must not list R2')
if client_path.endswith('v172.js'):
    for token in ('Saved ✓','fetchProduct(state.productId)','fetchImage(targetId)','Save failed — image was not confirmed','row.editable===false'):
        req(token in client,f'Build 172 save/refresh repair missing: {token}')
    for token in ('product-image-file-v172','persistence:\'product_images_committed\'','save_confirmed:true'):
        req(token in file_api,f'Build 172 file persistence contract missing: {token}')
    for token in ('selected-product-image-v172','save_confirmed:true','upsertAnnotation'):
        req(token in image_api,f'Build 172 metadata persistence contract missing: {token}')
    for token in ('product-media-workspace-v172','recovered_references_editable:false','canonical_gallery:canonical'):
        req(token in media_api,f'Build 172 canonical-gallery contract missing: {token}')
    req('PRAGMA table_info(product_image_annotations)' in helper,'Build 172 helper missing bounded read-only schema compatibility check')
    for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):
        req(forbidden not in helper.upper(),f'Build 172 helper contains request-time schema mutation token: {forbidden}')
for path in (client_path,'functions/api/admin/product-image-editor.js','functions/api/admin/product-image-file.js','functions/api/admin/product-media-editor.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 164+ PRODUCT MEDIA CRUD CONTINUITY: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 164+ PRODUCT MEDIA CRUD CONTINUITY: PASS')
print(f'Current client: {client_path}')
print('Gallery: bounded selected Product only; recovered references are not canonical edit targets')
print('Image operations: explicit add / replace / remove / reorder with save confirmation')
print('R2 listing/background scan/request-time DDL: NONE')
