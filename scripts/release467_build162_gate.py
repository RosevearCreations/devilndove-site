#!/usr/bin/env python3
"""Release 467 Build 162 — Product Admin & D1 Read Architecture Reset source gate."""
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')

products=read('admin/products/index.html')
editor=read('admin/product-editor/index.html')
browser_js=read('public/js/admin-products-browser-v162.js')
editor_js=read('public/js/admin-product-editor-v162.js')
browser_api=read('functions/api/admin/product-browser.js')
detail_api=read('functions/api/admin/product-editor-detail.js')
media_api=read('functions/api/admin/product-editor-media.js')
direct_media=read('functions/media/product.js')
legacy_media=read('functions/api/product-media.js')
module_routes=read('functions/api/_lib/appModuleRoutes.js')
sw=read('sw.js')
production_deploy=read('.github/workflows/production-pages-deploy-current.yml')
production_live=read('.github/workflows/production-live-resource-integrity-proof.yml')

for token in ('dd-product-admin-architecture','product-browser-v162','admin-products-browser-v162.js','/admin/product-editor/','Low-read mode'):
    req(token in products,f'Product Browser missing {token}')
for forbidden in ('admin-products.js','admin-edit-product.js','admin-product-seo.js','admin-product-resources.js','admin-product-stock-report.js','admin-site-item-inventory.js','productQualityCommandCenterMount','createProductForm','admin-product-workspaces.js'):
    req(forbidden not in products,f'Product Browser still eagerly loads legacy Product system: {forbidden}')

# Build 163+ succeeds the Build 162 editor client while preserving the dedicated editor
# architecture. Accept the current successor asset as proof that the Build 162 boundary remains.
req('admin-product-editor-v162.js' in editor or 'admin-product-editor-v163.js' in editor,'dedicated Product Editor missing Build 162-or-later editor asset')
for token in ('productEditorForm','data-editor-tab="media"','No autosave','Back to Products'):
    req(token in editor,f'dedicated Product Editor missing {token}')
for forbidden in ('admin-edit-product.js','admin-products.js','admin-product-workspaces.js','admin-product-seo.js','admin-product-resources.js','admin-site-item-inventory.js'):
    req(forbidden not in editor,f'dedicated Product Editor embeds legacy subsystem: {forbidden}')

for token in ('/api/admin/product-browser','/admin/product-editor/?product_id=','/media/product?key=','Automatic retries are stopped','d1_rows_read'):
    req(token in browser_js,f'Product Browser client missing {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/product-readiness','/api/admin/products?','/api/admin/product-lineage'):
    req(forbidden not in browser_js,f'Product Browser client gained background/heavy path: {forbidden}')

for token in ('/api/admin/product-editor-detail?product_id=','/api/admin/product-editor-media?product_id=','/media/product?key=','No catalog refresh or readiness scan','d1_rows_read'):
    req(token in editor_js,f'Product Editor client missing {token}')
for forbidden in ('setInterval(','MutationObserver','/api/admin/products','/api/admin/product-readiness','/api/admin/product-lineage'):
    req(forbidden not in editor_js,f'Product Editor client gained background/heavy path: {forbidden}')

for token in ('MAX_LIMIT=50','FROM products','ORDER BY product_id DESC','LIMIT ?','X-DD-D1-Read-Contract','X-DD-D1-Rows-Read','measuredRows','d1_rows_read'):
    req(token in browser_api,f'Product Browser API missing {token}')
for forbidden in (' JOIN ','COUNT(','PRAGMA','product_images','product_resource_links','media_assets'):
    req(forbidden not in browser_api,f'Product Browser API contains expensive startup construct: {forbidden}')

for token in ('WHERE p.product_id=?','LEFT JOIN product_seo','LIMIT 1','lazy_sections','X-DD-D1-Rows-Read','measuredRows','d1_rows_read'):
    req(token in detail_api,f'Editor detail API missing {token}')
for forbidden in ('product_images','media_assets','product_resource_links','product_media_role_assignments','product_image_annotations','COUNT(','PRAGMA'):
    req(forbidden not in detail_api,f'Editor startup reads unrelated authority: {forbidden}')

for token in ('FROM product_images','WHERE product_id=?','LIMIT 12','r2_listing:false','X-DD-D1-Rows-Read','measuredRows','d1_rows_read'):
    req(token in media_api,f'on-demand Editor media API missing {token}')
req("export { onRequestGet } from '../api/product-media.js';" in direct_media,'D1-free media route must reuse R2-only media authority')
req('getDb' not in legacy_media and 'DB.' not in legacy_media,'R2 media authority must remain D1-free')
req("'/api/product-media'" in module_routes,'Product media route must be core-exempt before module/session D1 resolution')
req('if (matchesAny(path, CORE_EXEMPT)) return null;' in module_routes,'Core-exempt media route must short-circuit module ownership')

req("if(shouldBypassCache(url))return;" in sw,'service worker must not intercept Admin/API/media direct-network routes')
req("url.pathname.startsWith('/media/')" in sw,'service worker must bypass direct media transport')
req("const NO_CACHE_PATH_PREFIXES = ['/admin/', '/members/', '/login/', '/register/', '/account-help/', '/api/'];" in sw,'historical no-cache boundary must remain intact')

for token in ('Classify whether this promotion needs Production D1 migration work','code_only_no_canonical_schema_change','code_only_zero_d1','remote_d1_reads\':0',"if: steps.d1-classification.outputs.requires_d1 == 'true'","if: steps.d1-classification.outputs.requires_d1 != 'true'"):
    req(token in production_deploy,f'Production deploy missing D1 read-amplification guard: {token}')
for token in ('control_plane_zero_d1',"'remote_d1_queries':0","'runtime_business_table_reads':0",'ZERO-D1 POST-DEPLOY BOUNDARY: PASS'):
    req(token in production_live,f'Production live proof missing zero-D1 boundary: {token}')
# Ignore comments and the workflow's own forbidden-token audit literal; inspect only executable commands.
executable='\n'.join(line for line in production_live.splitlines() if not line.lstrip().startswith('#') and 'forbidden=(' not in line.replace(' ',''))
for forbidden in ('wrangler@4 d1 execute','wrangler d1 execute','/api/products','/api/auth/login?diagnostic=full','/api/storefront-merchandising'):
    req(forbidden not in executable,f'Post-deploy resource proof still executes D1/runtime-heavy path: {forbidden}')

if FAIL:
    print('RELEASE 467 BUILD 162 SOURCE GATE: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 162 SOURCE GATE: PASS')
print('Products: BOUNDED BROWSER / NO EAGER EDITOR SUBSYSTEMS / MEASURED ROW READS')
print('Editor: ONE PRODUCT STARTUP READ / MEDIA ON DEMAND / NO AUTOSAVE LOOP / MEASURED ROW READS')
print('Media: SAME-ORIGIN R2 TRANSPORT / ZERO D1 AUTHORITY READS / MODULE GUARD BYPASS')
print('Service worker: ADMIN + API + MEDIA DIRECT NETWORK')
print('Production code-only promotion: ZERO REMOTE D1 READS')
print('Post-deploy resource proof: CLOUDFLARE CONTROL PLANE / ZERO D1 RUNTIME READS')
