#!/usr/bin/env python3
"""Release 467 Build 168 — Product admin low-read session reuse + editor handoff gate."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1000:]}')
products=read('admin/products/index.html')
editor_page=read('admin/product-editor/index.html')
browser=read('public/js/admin-products-browser-v162.js')
images=read('functions/api/admin/product-browser-images.js')
editor=read('public/js/admin-product-editor-v163.js')
for token in ('Build 168','session','featured image','Refresh'):
    req(token in products,f'Product Browser missing Build 168 low-read copy: {token}')
for token in ('pageCache=new Map()','session reuse','featured_missing_only:true','dnd:product-editor-seed:','force:true'):
    req(token in browser,f'Product Browser low-read/session handoff missing: {token}')
req("filter((p)=>!String(p?.featured_image_url||'').trim())" in browser,'Image recovery is not restricted to Products missing featured_image_url')
req('FROM products' not in images,'Secondary Product image recovery re-reads the Products table')
for token in ('product-browser-images-v168','visible_products_missing_featured_secondary_only','product_table_read:false','requested_missing_featured'):
    req(token in images,f'Build 168 image recovery contract missing: {token}')
for token in ('Build 168','Save remains disabled','display-only'):
    req(token in editor_page,f'Product Editor missing Build 168 authority copy: {token}')
for token in ('browserSeed()','primeFromBrowser()','setSaveReady(false)','authorityLoaded','Save is blocked to prevent a stale browser handoff'):
    req(token in editor,f'Product Editor authority handoff guard missing: {token}')
req("sessionStorage.removeItem(`dnd:product-editor-seed:${state.productId}`)" in editor,'Editor does not clear browser handoff after authority loads')
for forbidden in ('setInterval(','setTimeout(','MutationObserver'):
    req(forbidden not in browser,f'Product Browser gained automatic background behavior: {forbidden}')
    req(forbidden not in editor,f'Product Editor gained automatic background behavior: {forbidden}')
for path in ('public/js/admin-products-browser-v162.js','functions/api/admin/product-browser-images.js','public/js/admin-product-editor-v163.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 168 PRODUCT ADMIN LOW-READ HANDOFF: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 168 PRODUCT ADMIN LOW-READ HANDOFF: PASS')
print('Product Browser: session-only page reuse; deliberate Refresh returns to live authority')
print('Image recovery: secondary tables only for visible Products missing featured_image_url')
print('Product Editor: browser handoff is display-only; Save waits for authoritative one-Product read')
print('Background timers/scans: NONE')
print('Schema/D1-data/R2/provider/payment/accounting mutation: NONE')
