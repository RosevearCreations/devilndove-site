#!/usr/bin/env python3
"""Release 467 Build 154 — Products Worker Resource Hotfix source gate.

The immutable Build 154 renderer assertions remain active after later Products cache
revisions. Builds 155 and 159 are allowed to advance the Product asset revision while
retaining the Build 154 static-fast-path/server-resource repair.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def read(path):
    p = ROOT / path
    if not p.is_file():
        FAIL.append(f'missing required file: {path}')
        return ''
    return p.read_text(encoding='utf-8', errors='replace')

def req(ok, msg):
    if not ok:
        FAIL.append(msg)

middleware = read('functions/_middleware.js')
products = read('admin/products/index.html')
closure = read('release467-build153-layout-observer-performance-hotfix.json')

req(
    "const PRODUCTS_ASSET_REVISION = '467-b154-products-worker-fast-path';" in middleware
    or "const PRODUCTS_ASSET_REVISION = '467-b155-products-client-responsiveness';" in middleware
    or "const PRODUCTS_ASSET_REVISION = '467-b155-products-lockup-recovery-v2';" in middleware
    or "const PRODUCTS_ASSET_REVISION = '467-b159-products-returning-browser-cache-v1';" in middleware,
    'Build 154 Products cache revision or approved Build 155/159 successor revision missing'
)
req("const LAYOUT_ASSET_REVISION = '467-b153-layout-observer';" in middleware,
    'Build 153 layout observer revision must remain preserved')
req('async function withProductsFastPlatformClient(response)' in middleware,
    'Products fast platform path missing')
req("headers.set('X-DND-Products-Render-Path', 'static-fast-path');" in middleware,
    'Products fast-path proof header missing')
req("headers.set('Cache-Control', 'no-store');" in middleware,
    'Products fast path must prevent stale transformed HTML')
req('data-dd-products-static-platform="1"' in middleware,
    'Products shared-platform marker missing')
for token in (
    '/css/current-responsive.css?v=current',
    '/css/adaptive-shell.css?v=',
    '/css/admin-products-table-layout.css?v=',
    '/public/js/admin-products-cold-start-recovery.js?v=',
    '/public/js/layout-overflow-guard.js?v=',
    '/public/js/packaging-safe-area-guard.js?v=current',
    '/public/js/product-media-fallback.js?v=',
    '/public/js/pwa-platform.js?v=',
    '/public/js/adaptive-shell.js?v=',
):
    req(token in middleware, f'Products fast path missing shared asset: {token}')

products_branch = middleware.find("const isProductsPage = normalizedPath === '/admin/products/';")
fast_return = middleware.find('return withProductsFastPlatformClient(response);')
rewriter = middleware.find('new HTMLRewriter()')
req(products_branch >= 0 and fast_return > products_branch,
    'Products path must explicitly select the bounded fast renderer')
req(rewriter > fast_return >= 0,
    'Products fast return must occur before any HTMLRewriter construction')
req(".on('script[src]'" not in middleware,
    'Products must not re-enter per-script HTMLRewriter processing')
req('html = await response.text();' in middleware and 'html = html.replace(' in middleware,
    'Products fast path must use bounded text transformation')
req('(?:public\\/js|js)' in middleware and 'PRODUCTS_ASSET_REVISION' in middleware,
    'Products script cache revision pass missing')

on_request = middleware.find('export async function onRequest(context)')
module_key = middleware.find('const moduleKey = moduleKeyForPath(pathname);', on_request)
resolve_user = middleware.find('const resolvedUser = await resolveGuardUser(request, env, pathname);', module_key)
module_access = middleware.find('const access = await moduleAccessForRequest(request, env, moduleKey, { user: resolvedUser });', resolve_user)
next_response = middleware.find('return finish(await context.next(), request, { moduleKey });', module_access)
req(0 <= on_request < module_key < resolve_user < module_access < next_response,
    'Products repair must preserve session/module authorization before page rendering')
should_bypass = middleware[middleware.find('function shouldBypass'):middleware.find('async function resolveGuardUser')]
req('/admin/products/' not in should_bypass,
    'Products route must not bypass module/session guard')

req(('<body data-admin-page="products">' in products and 'Products &amp; Inventory' in products)
    or ('<body data-admin-page="product-browser-v166">' in products and '<h1>Products</h1>' in products),
    'Products source document identity drifted')
req(('/public/js/admin-products.js' in products and '/public/js/admin-create-product.js' in products)
    or '/public/js/admin-products-browser-v162.js' in products,
    'Products core client scripts or approved compact Product Browser successor missing')

for token in (
    'b8323b4e13ae08a8126da761106367de75f7cd40',
    'ba8b3c2406335391334b2a74a89e5819236c770b',
    'a3d0225c579953d5572dc99313661c2981c42510',
    '34863777573', '34863777529', '34863777559', '34863777543',
    '34864015766', '34864113781',
    '2026-09-14T15:48:10Z', '1102', '/admin/products/',
):
    req(token in closure, f'Build 153 closure/incident token missing: {token}')

for forbidden in (
    'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'PRODUCT_MEDIA_BUCKET.put', 'PRODUCT_MEDIA_BUCKET.delete',
    'CAIP_PRIVATE_MEDIA_BUCKET.put', 'CAIP_PRIVATE_MEDIA_BUCKET.delete',
):
    req(forbidden not in middleware, f'Build 154 middleware crossed mutation boundary: {forbidden}')

if FAIL:
    print('RELEASE 467 BUILD 154 GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('RELEASE 467 BUILD 154 GATE: PASS')
print('Products: module/session guard preserved before renderer')
print('Renderer: bounded text fast path; no Products HTMLRewriter')
print('Proof marker: X-DND-Products-Render-Path=static-fast-path')
print('Boundary: no schema, D1/R2 business-data, provider, payment/refund/accounting mutation')
