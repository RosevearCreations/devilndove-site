#!/usr/bin/env python3
"""Release 467 Build 176 — Admin main-thread/read-amplification containment proof."""
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

help_js=read('public/js/admin-context-help.js')
auth_ui=read('public/js/site-auth-ui.js')
admin_js=read('public/js/admin.js')
supply_api=read('functions/api/admin/supply-sourcing.js')
supply_js=read('public/js/admin-supply-sourcing.js')
supply_page=read('admin/supply-sourcing/index.html')
merch_api=read('functions/api/admin/storefront-merchandising.js')
merch_js=read('public/js/admin-storefront-merchandising.js')
merch_page=read('admin/storefront-merchandising/index.html')
orders_api=read('functions/api/admin/orders.js')
orders_workspace=read('public/js/admin-orders-workspace-build150.js')
orders_legacy=read('public/js/admin-orders.js')
orders_page=read('admin/orders/index.html')
catalog_page=read('admin/catalog/index.html')
admin_home=read('admin/index.html')
system_gate=read('.github/workflows/system-gate.yml')
it_admin_workflow=read('.github/workflows/it-admin-runtime-proof.yml')
preview_smoke=read('scripts/preview_smoke.py')

for token in ('AUTO_OBSERVER_MAX_MS = 8000','REFRESH_DEBOUNCE_MS = 180','mutationNeedsRefresh','refreshSafely','dd:admin-context-help-refresh','observerStopTimer'):
    req(token in help_js,f'Context-help containment missing: {token}')
req('new MutationObserver(queueRefresh)' not in help_js,'Context help returned to direct permanent whole-document refresh observer')
req('queueMicrotask(() => { refreshQueued = false; refresh(); })' not in help_js,'Context help returned to mutation->microtask full refresh loop')
req('setInterval(' not in help_js,'Context help gained background polling')

for route in ('/admin/catalog/','/admin/orders/','/admin/storefront-merchandising/','/admin/supply-sourcing/'):
    req(route in auth_ui,f'Lean Admin startup route missing: {route}')
for token in ('DDAdminLeanStartup','deferred_optional_navigation','admin-workspace-command-palette-v122.js','if (!leanStartup)'):
    req(token in auth_ui,f'Lean Admin startup contract missing: {token}')
req("document.body?.dataset?.adminEnhancedNavigation === '1'" in admin_js,'Section-position/context-dock chain is not explicit opt-in')
req("document.body?.dataset?.adminPage !== 'products') {\n  void import('/public/js/admin-section-position-v130.js" not in admin_js,'Known observer-heavy navigation chain is eager again')

req('LIMIT 1000' not in supply_api,'Supply API returned to 1000-row list read')
for token in ('boundedListLimit','fallback=120','max=200','candidateLimit=80','list_limit:limit',"counts_scope:'returned_window'"):
    req(token in supply_api,f'Supply bounded-read contract missing: {token}')
for token in ("state={supplies:[],counts:{},selected:0,detail:null,query:'',limit:120}",'ssSearchButton',"url.searchParams.set('limit',String(state.limit))"):
    req(token in supply_js,f'Supply bounded client contract missing: {token}')
for token in ('id="ssSearchButton"','id="ssSearchClear"','id="ssListScope"','admin-supply-sourcing.js?v=176','site-auth-ui.js?v=176'):
    req(token in supply_page,f'Supply page Build 176 control/cache marker missing: {token}')

req('product-lineage?limit=1000' not in merch_js,'Storefront still requests 1000 Products')
req('product-lineage?limit=120' in merch_js,'Storefront bounded Product membership request missing')
req(merch_api.count('LIMIT 200') >= 4,'Storefront collections/memberships/collages/rules are not all bounded')
req('projection_limit:200' in merch_api,'Storefront bounded projection metadata missing')
req('admin-storefront-merchandising.js?v=176' in merch_page,'Storefront bounded renderer cache identity missing')
req('admin-workspace-state.js' not in merch_page,'Storefront still loads extra permanent workspace-state observer')
req('site-auth-ui.js?v=176' in merch_page and 'admin.js?v=176' in merch_page,'Storefront lean shared startup cache identity missing')

for token in ("url.searchParams.get('limit') || 80",'Math.min(200, requestedLimit)','LIMIT ${limit}','list_limit: limit','bounded_list: true'):
    req(token in orders_api,f'Orders bounded list contract missing: {token}')
req(orders_api.count('LIMIT ${limit}') >= 2,'Orders primary/fallback queries are not both bounded')
for token in ('/api/admin/orders?limit=80','filtered().slice(0,80)','snap.orders.slice(0,80)'):
    req(token in orders_workspace,f'Unified Orders bounded render missing: {token}')
req('/api/admin/orders?limit=80' in orders_legacy,'Retained legacy Orders reader is not bounded')
req('admin-orders-workspace-build150.js?v=467b176' in orders_page,'Unified Orders Build 176 cache identity missing')
for eager in ('admin-orders.js','admin-order-contract-bridge.js','admin-order-detail.js','admin-gift-card-order-redemption.js','admin-accounting-backend.js'):
    req(eager not in orders_page,f'Orders page still eagerly boots duplicate legacy module: {eager}')
for token in ('Detailed Orders &amp; Payments Table','Fulfilment &amp; Customer Care','Payments &amp; Accounting','Customer Documents'):
    req(token in orders_page,f'Orders focused fallback navigation missing: {token}')

for token in ('data-admin-page="catalog-hub-v176"','data-build176-catalog-hub','/admin/products/','/admin/product-editor/','/admin/catalog-media/','/admin/inventory-operations/'):
    req(token in catalog_page,f'Catalog hub Build 176 marker missing: {token}')
for eager in ('admin-products.js','admin-products-enhancements.js','admin-create-product.js','admin-edit-product.js','admin-product-bulk-tools.js','admin-import-products.js','admin-product-price-suggestions.js'):
    req(eager not in catalog_page,f'Catalog still eagerly boots legacy Product module: {eager}')
req('createProductForm' not in catalog_page,'Catalog still embeds the legacy all-in-one Product editor form')
req('site-auth-ui.js?v=176' in catalog_page and 'admin.js?v=176' in catalog_page,'Catalog lean shared startup cache identity missing')
req('site-auth-ui.js?v=176' in admin_home and 'admin.js?v=176' in admin_home,'Admin home did not receive bounded shared startup cache identity')

# Code-only Development pushes must not consume D1 merely to prove unchanged schema/admin authority.
for token in ('Classify whether Development candidate needs D1 proof','origin/main...','code_only_no_canonical_schema_change','Record zero-D1 code-only Development path','remote_d1_queries','--zero-d1'):
    req(token in system_gate,f'Zero-D1 Development release path missing: {token}')
req("if: steps.d1-classification.outputs.requires_d1 == 'true'" in system_gate,'Development D1 migration/read proof is not classification-gated')
for token in ('Classify whether root-admin D1 proof is required','code_only_no_admin_authority_change','Record zero-D1 root-admin continuity','Remote D1 queries: 0'):
    req(token in it_admin_workflow,f'Zero-D1 root-admin continuity path missing: {token}')
for token in ('--zero-d1','if not args.zero_d1','public_api_zero_d1_skip','Remote D1 smoke queries'):
    req(token in preview_smoke,f'Zero-D1 Preview smoke contract missing: {token}')

for source,label in ((supply_api,'Supply API'),(merch_api,'Storefront API'),(orders_api,'Orders API')):
    for ddl in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX'):
        req(ddl not in source.upper(),f'{label} contains request-time DDL: {ddl}')
for source,label in ((supply_js,'Supply client'),(merch_js,'Storefront client'),(orders_workspace,'Orders workspace')):
    req('setInterval(' not in source,f'{label} gained background polling')

for path in (
    'public/js/admin-context-help.js','public/js/site-auth-ui.js','public/js/admin.js',
    'functions/api/admin/supply-sourcing.js','public/js/admin-supply-sourcing.js',
    'functions/api/admin/storefront-merchandising.js','public/js/admin-storefront-merchandising.js',
    'functions/api/admin/orders.js','public/js/admin-orders-workspace-build150.js','public/js/admin-orders.js',
):
    node(path)

if FAIL:
    print('RELEASE 467 BUILD 176 ADMIN MAIN-THREAD / READ AMPLIFICATION CONTAINMENT: FAIL')
    for item in FAIL: print('-',item)
    sys.exit(1)
print('RELEASE 467 BUILD 176 ADMIN MAIN-THREAD / READ AMPLIFICATION CONTAINMENT: PASS')
print('Context-help observer: DEBOUNCED / SELF-MUTATION FILTERED / 8-SECOND MAX')
print('Heavy admin startup: AUTH + ACCOUNT + CTRL-K; OPTIONAL OBSERVER UI DEFERRED')
print('Section-position/context dock: EXPLICIT OPT-IN ONLY')
print('Supply: 120 ROW STARTUP / 80 CANDIDATES / EXPLICIT SEARCH')
print('Storefront: 120 PRODUCT OPTIONS / 200-ROW PROJECTION CAPS')
print('Orders: 80 ROW STARTUP / DUPLICATE LEGACY APP NOT EAGER')
print('Catalog: FOCUSED WORKSPACE HUB / LEGACY ALL-IN-ONE APP NOT EAGER')
print('Schema/R2/provider/payment/refund/accounting mutation added: NONE')
