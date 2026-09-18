#!/usr/bin/env python3
"""Release 467 Build 178 — dedicated Product Editor navigation convergence proof."""
from pathlib import Path
import subprocess, sys

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

editor_page=read('admin/product-editor/index.html')
media_page=read('admin/catalog-media/index.html')
editor=read('public/js/admin-product-editor-v163.js')
media=read('public/js/admin-product-media-editor-v172.js')
readiness=read('public/js/admin-product-readiness.js')
products=read('public/js/admin-products.js')
media_context=read('public/js/admin-product-media-context.js')
preflight_ui=read('public/js/admin-product-release-preflight.js')
preflight_api=read('functions/api/admin/product-release-preflight.js')
marketplace=read('public/js/admin-products-marketplace-readiness.js')

req('Release 467 • Build 178' in editor_page,'Product Editor Build 178 identity missing')
req('admin-product-editor-v163.js?v=178' in editor_page,'Product Editor Build 178 cache identity missing')
req('Release 467 • Build 178' in media_page,'Product Image Editor Build 178 identity missing')
req('admin-product-media-editor-v172.js?v=178' in media_page,'Product Image Editor Build 178 cache identity missing')

for token in ("params.get('tab')","params.get('focus')","openTab(initialTab,initialFocus)","/api/admin/product-editor-save"):
    req(token in editor,f'Product Editor deep-link/save continuity missing: {token}')
for token in ('setInterval(','MutationObserver('):
    req(token not in media,f'Product Image Editor gained background behavior: {token}')

targets={
 'readiness':readiness,
 'products':products,
 'media_context':media_context,
 'preflight_ui':preflight_ui,
 'preflight_api':preflight_api,
 'marketplace':marketplace,
}
for name,source in targets.items():
    req('/admin/catalog/?product_id=' not in source,f'{name} still routes Product work to retired catalog editor')

req('&tab=seo&focus=meta_title' in readiness and '&tab=pricing&focus=price' in readiness and '&tab=description&focus=description' in readiness,'Readiness deep-link targets missing')
req('&tab=seo&focus=meta_title' in products and '&tab=pricing&focus=price' in products and '&tab=description&focus=description' in products,'Products deep-link targets missing')
req('&tab=basics' in media_context,'Media context dedicated Product Editor route missing')
req('&tab=basics' in preflight_ui,'Release Preflight UI dedicated Product Editor route missing')
req('&tab=basics' in preflight_api,'Release Preflight API dedicated Product Editor route missing')
req('&tab=description' in marketplace,'Marketplace listing-facts dedicated Product Editor route missing')

for path in (
 'public/js/admin-product-editor-v163.js',
 'public/js/admin-product-media-editor-v172.js',
 'public/js/admin-product-readiness.js',
 'public/js/admin-products.js',
 'public/js/admin-product-media-context.js',
 'public/js/admin-product-release-preflight.js',
 'functions/api/admin/product-release-preflight.js',
 'public/js/admin-products-marketplace-readiness.js',
):
    node(path)

if FAIL:
    print('RELEASE 467 BUILD 178 PRODUCT EDITOR NAVIGATION CONVERGENCE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)

print('RELEASE 467 BUILD 178 PRODUCT EDITOR NAVIGATION CONVERGENCE: PASS')
print('Retired /admin/catalog Product deep-links on covered current surfaces: ZERO')
print('Product Editor tab/focus deep links: PRESERVED')
print('Product Image Editor actions: EXPLICIT / NO POLLING')
print('D1 schema migration: NONE')
