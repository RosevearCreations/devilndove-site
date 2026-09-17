#!/usr/bin/env python3
"""Release 467 Build 165 — Product editing stabilization and thumbnail recovery source gate."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')
products=read('admin/products/index.html');browser=read('public/js/admin-products-browser-v162.js');image_api=read('functions/api/admin/product-browser-images.js');editor=read('admin/product-editor/index.html');editor_js=read('public/js/admin-product-editor-v163.js');browser_api=read('functions/api/admin/product-browser.js')
for token in ('Build 165','12 Products per page','bounded visible-thumbnail query','admin-products-browser-v162.js?v=165'):
    req(token in products,f'Build 165 Products page missing: {token}')
for token in ('const PAGE_SIZE=12','/api/admin/product-browser-images','/admin/catalog-media/?product_id=','Thumbnail recovery checked only these visible Product IDs','imageCandidates('):
    req(token in browser,f'Build 165 Product Browser client missing: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products?','/api/admin/media-assets'):
    req(forbidden not in browser,f'Build 165 Product Browser gained background/heavy path: {forbidden}')
for token in ('MAX_IDS=16','FROM product_images','WHERE product_id IN','LIMIT ?','r2_listing:false','visible_product_ids_only','X-DD-D1-Rows-Read'):
    req(token in image_api,f'Build 165 thumbnail API missing: {token}')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','PRAGMA','sqlite_master','bucket.list','media_assets'):
    req(forbidden.lower() not in image_api.lower(),f'Build 165 thumbnail API contains forbidden scan/schema token: {forbidden}')
for token in ('Build 165','productEditorMediaStrip','Gallery not loaded yet','Open Media &amp; Image Editor','No autosave'):
    req(token in editor,f'Build 165 Product Editor page missing: {token}')
for token in ('/api/admin/product-media-editor?product_id=','state.mediaLoaded','if(id===\'media\')loadMedia();','setFeaturedDraft','Press Save Product to commit it','No catalog refresh, media scan, scoring or readiness scan'):
    req(token in editor_js,f'Build 165 Product Editor client missing: {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products','/api/admin/product-readiness','/api/admin/product-lineage'):
    req(forbidden not in editor_js,f'Build 165 Product Editor gained background/heavy path: {forbidden}')
req('MAX_LIMIT=50' in browser_api and 'FROM products' in browser_api,'Build 162 bounded Product browser authority changed unexpectedly')
for path in ('public/js/admin-products-browser-v162.js','public/js/admin-product-editor-v163.js','functions/api/admin/product-browser-images.js'): node(path)
if FAIL:
    print('RELEASE 467 BUILD 165 PRODUCT EDITING STABILIZATION: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 165 PRODUCT EDITING STABILIZATION: PASS')
print('Products page: 12-row compact browser')
print('Thumbnail recovery: visible Product IDs only / no R2 listing')
print('Product Editor: one-Product startup / gallery lazy on Media tab')
print('Featured image: draft-only until explicit Save Product')
print('Automatic retries/timers/observers: NONE')
print('Request-time schema mutation/introspection: NONE')
