#!/usr/bin/env python3
"""Release 467 Build 174 — Product Editor Media read-collapse proof, successor-aware through Build 178."""
from pathlib import Path
import subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        FAIL.append(f'missing {path}')
        return ''
    return p.read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1200:]}')

endpoint=read('functions/api/admin/product-editor-media.js')
client=read('public/js/admin-product-editor-v163.js')
page=read('admin/product-editor/index.html')
full_media=read('functions/api/admin/product-media-editor.js')

for token in ('product-editor-media-v174','authority_prerequisite','product-editor-detail-v162','MAX_GALLERY_ROWS=12','product_table_read:false','secondary_recovery_read:false','quality_read:false','annotation_read:false','r2_listing:false','background_retry:false'):
    req(token in endpoint,f'Build 174 canonical media endpoint missing: {token}')
req('FROM product_images' in endpoint,'Build 174 media endpoint must read canonical product_images')
for forbidden in ('FROM products','product_media_role_assignments','media_assets','product_image_quality_reviews','product_image_annotations','CREATE TABLE','ALTER TABLE','DROP TABLE','.list(','bucket.list'):
    req(forbidden not in endpoint,f'Build 174 media endpoint contains forbidden read/mutation path: {forbidden}')

for token in ('/api/admin/product-editor-media','function editorMediaRows()','featured_reference_from_product_authority:true','Featured-only reference reused from already-loaded Product authority with zero additional D1 rows','No Product-table, media-role, media-asset, quality, annotation or R2 recovery read was performed'):
    req(token in client,f'Build 174 Product Editor client missing: {token}')
req('/api/admin/product-media-editor?product_id=' not in client,'Product Editor still calls the full Product Media recovery workspace')
for forbidden in ('setInterval(','setTimeout(','MutationObserver('):
    req(forbidden not in client,f'Build 174 Product Editor gained background behavior: {forbidden}')

req(any(token in page for token in ('Release 467 • Build 174','Release 467 • Build 175','Release 467 • Build 178')),'Build 174+ Product Editor identity missing')
req(any(token in page for token in ('admin-product-editor-v163.js?v=174','admin-product-editor-v163.js?v=175','admin-product-editor-v163.js?v=178')),'Build 174+ Product Editor client cache identity missing')
for token in ("reads only this Product's canonical gallery rows",'does not re-read the Product table','Open the full Image Editor only when you need recovery'):
    req(token in page,f'Build 174 Product Editor page missing: {token}')

# Full Image Editor must retain the deeper recovery authority that Build 174 intentionally removes
# from normal Product Editor Media-tab reads.
for token in ('FROM product_media_role_assignments','FROM media_assets','product-media-workspace-v172','r2_listing:false'):
    req(token in full_media,f'Full Image Editor recovery authority drifted: {token}')

for path in ('functions/api/admin/product-editor-media.js','public/js/admin-product-editor-v163.js'):
    node(path)

if FAIL:
    print('RELEASE 467 BUILD 174 PRODUCT EDITOR MEDIA READ COLLAPSE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 174 PRODUCT EDITOR MEDIA READ COLLAPSE: PASS')
print('Editor Media read: CANONICAL PRODUCT_IMAGES ONLY / LIMIT 12')
print('Duplicate products read: NONE')
print('Media-role/media-asset/quality/annotation reads: NONE')
print('Featured-only display: REUSED FROM ALREADY-LOADED PRODUCT AUTHORITY')
print('Full Image Editor deep recovery: PRESERVED / EXPLICIT')
print('R2 listing/background polling/schema mutation: NONE')
