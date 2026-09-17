#!/usr/bin/env python3
"""Release 467 Build 172 — Product Media save reliability and canonical-reference gate, successor-aware through Build 173."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')
page=read('admin/catalog-media/index.html');client=read('public/js/admin-product-media-editor-v172.js');media=read('functions/api/admin/product-media-editor.js');image=read('functions/api/admin/product-image-editor.js');file_api=read('functions/api/admin/product-image-file.js');helper=read('functions/api/admin/_productImageAnnotationsV172.js')
req(('Release 467 • Build 172' in page) or ('Release 467 • Build 173' in page),'Build 172+ Product Media page identity missing')
for token in ('productMediaV172SaveReceipt','Saved ✓','Recovered media references are display-only'):
    req(token in page,f'Build 172 page missing: {token}')
req(('admin-product-media-editor-v172.js?v=172' in page) or ('admin-product-media-editor-v172.js?v=173' in page),'Build 172+ Product Media client cache identity missing')
for token in ('fetchProduct(state.productId)','fetchImage(targetId)','Save failed — image was not confirmed','Saved ✓','row.editable===false','data-reference="1"'):
    req(token in client,f'Build 172 client repair missing: {token}')
req('await loadProduct(state.productId)' not in client,'Build 172 reintroduced in-flight loadProduct refresh deadlock')
for token in ('product-media-workspace-v172','canonical=source===\'gallery\'','recovered_references_editable:false',"source_order:['gallery','featured','media role','media asset']"):
    req(token in media,f'Build 172 media authority missing: {token}')
for token in ('selected-product-image-v172','save_confirmed:true','upsertAnnotation','canonical_product_image_missing'):
    req(token in image,f'Build 172 image editor persistence missing: {token}')
for token in ('product-image-file-v172','persistence:\'product_images_committed\'','save_confirmed:true','cleanupR2','upsertAnnotation'):
    req(token in file_api,f'Build 172 file persistence missing: {token}')
for token in ('PRAGMA table_info(product_image_annotations)','cachedColumns','upsertAnnotation','readAnnotation'):
    req(token in helper,f'Build 172 schema-safe helper missing: {token}')
for source,label in ((media,'media API'),(image,'image API'),(file_api,'file API'),(helper,'annotation helper')):
    for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):
        req(forbidden not in source.upper(),f'{label} contains request-time DDL: {forbidden}')
req('.list(' not in file_api.lower() and 'bucket.list' not in file_api.lower(),'Build 172 file path lists R2')
for forbidden in ('setInterval(','MutationObserver'):
    req(forbidden not in client,f'Build 172 client gained background behavior: {forbidden}')
for path in ('public/js/admin-product-media-editor-v172.js','functions/api/admin/product-media-editor.js','functions/api/admin/product-image-editor.js','functions/api/admin/product-image-file.js','functions/api/admin/_productImageAnnotationsV172.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 172 PRODUCT MEDIA SAVE RELIABILITY: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 172 PRODUCT MEDIA SAVE RELIABILITY: PASS')
print('Add/replace/remove refresh: internal authoritative fetch, not blocked by in-flight guard')
print('Save confirmation: local Saved receipt with image id/time')
print('Recovered references: display-only unless backed by canonical product_images row')
print('Annotation compatibility: bounded read-only schema discovery; no request-time DDL')
print('R2 listing/background retry/autosave: NONE')
