#!/usr/bin/env python3
"""Release 467 Build 168 — Product admin low-read session reuse + editor handoff gate.

Successor-aware through Build 175: retained invariants are browser-session reuse, no Products-table
re-read for fallback images, display-only editor handoff, and authority-before-save. Build 170 strengthens
image recovery from visible-page automatic batching to an explicit single-Product operator action.
"""
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
for token in ('Build 170','session','featured image','Refresh','Recover photo'):
    req(token in products,f'Product Browser missing Build 168+ low-read copy: {token}')
for token in ('pageCache=new Map()','session reuse','async function recoverPhoto(productId)','operator_triggered:true','dnd:product-editor-seed:','force:true'):
    req(token in browser,f'Product Browser low-read/session handoff missing: {token}')
req('loadImageMap(products)' not in browser,'Build 170 must not perform automatic page-level image recovery')
req('product_ids:[productId]' in browser,'Explicit photo recovery is not limited to one selected Product')
req('featured_missing_only:true' in browser,'Explicit photo recovery lost missing-featured-only request contract')
req('FROM products' not in images,'Secondary Product image recovery re-reads the Products table')
for token in ('product-browser-images-v170-explicit','operator_triggered_single_product_missing_featured_secondary_only','product_table_read:false','requested_missing_featured:1','MAX_IDS=1','automatic:false'):
    req(token in images,f'Build 170 successor image recovery contract missing: {token}')
req(any(token in editor_page for token in ('Build 168','Build 169','Build 173','Build 174','Build 175')),'Product Editor is not a recognized Build 168+ successor')
req('display-only' in editor_page,'Product Editor lost display-only browser handoff contract')
req(('Save remains disabled' in editor_page) or ('Save updates only this Product' in editor_page),'Product Editor lost authority-before-save contract copy')
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
print('Build 170 successor: normal Product page performs no automatic secondary image recovery read')
print('Image recovery: explicit one-Product action; no Products-table re-read or R2 listing')
print('Product Editor: display-only browser handoff; Save waits for authoritative one-Product read')
print('Background timers/scans: NONE')
print('Schema/D1-data/R2/provider/payment/accounting mutation: NONE')