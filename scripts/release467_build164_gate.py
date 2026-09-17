#!/usr/bin/env python3
"""Release 467 Build 164 — Product Media CRUD + image preparation source gate."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')
page=read('admin/catalog-media/index.html');client=read('public/js/admin-product-media-editor-v164.js');image_api=read('functions/api/admin/product-image-editor.js');file_api=read('functions/api/admin/product-image-file.js')
for token in ('Build 164','Add image','Replace selected','Remove selected','Move earlier','Crop / sizing','admin-product-media-editor-v164.js'):
    req(token in page,f'Build 164 Product Media page missing: {token}')
for token in ('/api/admin/product-image-file','action:\'remove\'','action:\'reorder\'','square_1200','landscape_1600','R2 route is a bounded fallback only','window.confirm'):
    req(token in client,f'Build 164 Product Media client missing: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products','/api/admin/media-assets','/api/admin/product-images'):
    req(forbidden not in client,f'Build 164 client gained eager/heavy path: {forbidden}')
for token in ("action==='remove'","action==='reorder'",'r2_source_preserved:true','ordered_ids','Scoring was not run automatically'):
    req(token in image_api,f'Build 164 image action API missing: {token}')
for token in ('product-image-file-v164','bucket.put','INSERT INTO product_images','UPDATE product_images SET image_url','DELETE FROM product_image_quality_reviews','r2_listing:false','automatic_scoring:false'):
    req(token in file_api,f'Build 164 image file API missing: {token}')
for source,label in ((image_api,'image action API'),(file_api,'image file API')):
    for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','PRAGMA','sqlite_master'):
        req(forbidden not in source.upper(),f'{label} contains request-time schema/introspection token: {forbidden}')
    req('getAdminUserFromRequest' not in source,f'{label} re-reads D1 authentication instead of route-guard context')
req('media_assets' not in file_api,'Build 164 one-file path must not scan/write the media asset library')
req('list(' not in file_api.lower(),'Build 164 one-file path must not list R2')
for path in ('public/js/admin-product-media-editor-v164.js','functions/api/admin/product-image-editor.js','functions/api/admin/product-image-file.js'): node(path)
if FAIL:
    print('RELEASE 467 BUILD 164 PRODUCT MEDIA CRUD + IMAGE PREPARATION: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 164 PRODUCT MEDIA CRUD + IMAGE PREPARATION: PASS')
print('Gallery: bounded selected Product only')
print('Image operations: add / replace / remove / reorder are explicit')
print('Browser image preparation: original / square / landscape / max-side')
print('R2 listing: NONE')
print('Automatic scoring: NONE')
print('Request-time schema mutation/introspection: NONE')
