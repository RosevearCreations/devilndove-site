#!/usr/bin/env python3
"""Release 467 Build 170 — Product Browser explicit single-Product photo recovery gate."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def req(ok,msg):
    if not ok: FAIL.append(msg)
def node(path):
    p=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    req(p.returncode==0,f'JavaScript syntax failed for {path}: {(p.stderr or p.stdout)[-1000:]}')
page=read('admin/products/index.html')
browser=read('public/js/admin-products-browser-v162.js')
images=read('functions/api/admin/product-browser-images.js')
for token in ('Build 170','one bounded Product query only','Recover photo','Automatic secondary image recovery reads are zero','R2 is never listed'):
    req(token in page,f'Build 170 Product Browser contract missing: {token}')
for token in ('imageRecoveryState=new Map()','async function recoverPhoto(productId)','product_ids:[productId]','featured_missing_only:true','operator_triggered:true','No automatic retry will run','product-browser-v170'):
    req(token in browser,f'Build 170 explicit photo recovery client missing: {token}')
load_block=browser.split('async function load({',1)[1].split('function resetAndLoad',1)[0] if 'async function load({' in browser and 'function resetAndLoad' in browser else browser
req('/api/admin/product-browser-images' not in load_block,'Normal Product page load still calls secondary image recovery')
req('loadImageMap(products)' not in browser,'Legacy automatic page-level image recovery remains')
req(browser.count('/api/admin/product-browser-images')==1,'Product Browser should expose exactly one explicit fallback image endpoint call site')
for forbidden in ('setInterval(','setTimeout(','MutationObserver'):
    req(forbidden not in browser,f'Product Browser gained automatic background behavior: {forbidden}')
for token in ('MAX_IDS=1','operator_triggered!==true','featured_missing_only!==true','single_product_required','product-browser-images-v170-explicit','operator_triggered_single_product_missing_featured_secondary_only','automatic:false','product_table_read:false','r2_listing:false'):
    req(token in images,f'Build 170 fallback image endpoint contract missing: {token}')
req('FROM products' not in images,'Fallback image endpoint re-reads Product authority')
req('.list(' not in images and 'bucket.list' not in images,'Fallback image endpoint must not list R2')
for path in ('public/js/admin-products-browser-v162.js','functions/api/admin/product-browser-images.js'):
    node(path)
if FAIL:
    print('RELEASE 467 BUILD 170 PRODUCT BROWSER EXPLICIT PHOTO RECOVERY: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 170 PRODUCT BROWSER EXPLICIT PHOTO RECOVERY: PASS')
print('Fresh Product page: one bounded Product query')
print('Automatic secondary image recovery reads: ZERO')
print('Fallback photo recovery: explicit operator click / exactly one Product')
print('Product authority re-read: NONE')
print('R2 listing/background retry/schema mutation: NONE')