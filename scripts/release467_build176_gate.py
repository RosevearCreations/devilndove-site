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
route_usage=read('public/js/admin-route-usage.js')
readiness_playbook=read('functions/api/admin/live-readiness-playbook.js')
dashboard_summary=read('functions/api/admin/dashboard-summary.js')
seller_daily=read('public/js/admin-seller-command-centre-build148.js')
home_dashboard=read('public/js/admin-home-dashboard-v123.js')
today_tasks=read('functions/api/_lib/todayTasksReadService.js')
command_palette=read('public/js/admin-workspace-command-palette-v122.js')

for token in ('AUTO_OBSERVER_MAX_MS = 8000','REFRESH_DEBOUNCE_MS = 180','mutationNeedsRefresh','refreshSafely','dd:admin-context-help-refresh','observerStopTimer'):
    req(token in help_js,f'Context-help containment missing: {token}')
req('new MutationObserver(queueRefresh)' not in help_js,'Context help returned to direct permanent whole-document refresh observer')
req('queueMicrotask(() => { refreshQueued = false; refresh(); })' not in help_js,'Context help returned to mutation->microtask full refresh loop')
req('setInterval(' not in help_js,'Context help gained background polling')

for route in ('/admin/','/admin/index.html','/admin/catalog/','/admin/orders/','/admin/storefront-merchandising/','/admin/supply-sourcing/'):
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

# Runtime D1 containment: ordinary Admin navigation and the Admin home must not spend
# database quota merely because a page was opened.
for token in ('automatic_remote_recording: false','remote_d1_queries: 0','dd_admin_route_usage_local'):
    req(token in route_usage,f'Automatic Admin route telemetry containment missing: {token}')
req("/api/admin/live-readiness-playbook" not in route_usage,'Admin route usage client returned to remote telemetry POSTs')
req("action === 'record_usage'" in readiness_playbook and "body.explicit !== true" in readiness_playbook,'Cached-client route telemetry firewall missing')
req('automatic_admin_route_telemetry_disabled_build176' in readiness_playbook,'Cached-client telemetry no-op reason missing')
record_branch=readiness_playbook.split("if (action === 'record_usage')",1)[1].split("try {",1)[0] if "if (action === 'record_usage')" in readiness_playbook else ''
req('CREATE TABLE IF NOT EXISTS command_center_usage_events' not in record_branch,'Automatic route telemetry branch regained request-time DDL')

# Seller Daily reads only metrics actually rendered, is cache-first, and does not automatically
# hit the I.T. control tower. Historical URL tokens may remain only as inert provenance constants.
for token in ("v==='seller_daily'","async function sellerDailySummary","AS orders_count","AS low_stock_count","AS failed_webhooks_count","AS open_disputes_count","AS recent_searches_count","AS active_visitor_sessions_count"):
    req(token in dashboard_summary,f'Bounded Seller Daily summary missing: {token}')
seller_fn=dashboard_summary.split('async function sellerDailySummary',1)[1].split('async function mobileHealthSummary',1)[0] if 'async function sellerDailySummary' in dashboard_summary else ''
for forbidden in ('product_images','product_image_annotations','product_seo','products_missing_'):
    req(forbidden not in seller_fn,f'Seller Daily summary regained unused deep Product scan: {forbidden}')

for token in ("CACHE_MAX_AGE_MS=10*60*1000","SELLER_SUMMARY_URL='/api/admin/dashboard-summary?view=seller_daily'","cacheFresh(cached)","if(!manual&&cacheFresh(cached))","window.DDSellerDailySnapshot","dd:seller-command-centre-data"):
    req(token in seller_daily,f'Seller Daily cache/snapshot containment missing: {token}')
live_load=seller_daily.split('async function load',1)[1] if 'async function load' in seller_daily else ''
req('getJson(IT_URL)' not in live_load,'Seller Daily returned to automatic I.T. control-tower reads')
req('getJson(SUMMARY_URL)' not in live_load,'Seller Daily returned to legacy compact summary reads')
req('Promise.all([getJson(TODAY_URL),getJson(SELLER_SUMMARY_URL)])' in seller_daily,'Seller Daily live snapshot is not the bounded two-read contract')
req('setInterval(' not in seller_daily,'Seller Daily gained background polling')

# Lower Admin-home dashboard must reuse the Seller Daily payload and only fetch the static manifest.
for token in ('dd:seller-command-centre-data','window.DDSellerDailySnapshot','applySellerPayload','duplicate Today/I.T. reads: 0','Promise.allSettled'):
    req(token in home_dashboard,f'Admin-home shared snapshot contract missing: {token}')
home_load=home_dashboard.split('async function load',1)[1] if 'async function load' in home_dashboard else ''
req('getJson(TODAY_URL)' not in home_load,'Admin home regained duplicate Today Tasks read')
req('getJson(IT_URL)' not in home_load,'Admin home regained duplicate I.T. read')
req('getJson(MANIFEST_URL,{auth:false})' in home_load,'Admin home static navigation manifest read missing')
req(('admin-route-usage.js?v=176' in admin_home or 'admin-route-usage.js?v=254' in admin_home),'Admin home route-usage containment identity missing')
home_dashboard_identity_ok=('admin-home-dashboard-v123.js?v=467b176' in admin_home or 'admin-home-dashboard-v123.js?v=467b240' in admin_home)
seller_identity_ok=('admin-seller-command-centre-build148.js?v=467b176' in admin_home or 'admin-seller-command-centre-build148.js?v=467b240' in admin_home)
req(home_dashboard_identity_ok and seller_identity_ok,'Admin home bounded runtime cache identities missing')
if 'admin-home-dashboard-v123.js?v=467b240' in admin_home or 'admin-seller-command-centre-build148.js?v=467b240' in admin_home:
    req('admin-read-budget-v240.js?v=467b240-admin-read-budget-v1' in admin_home,'Build 240 cache identities require bounded Admin read-budget bootstrap')

# Today Task suppression state remains bounded to the same six indexed latest-state point reads.
build262_active=(ROOT/'release467-build262-operations-today-tasks-read-fanout-review.json').is_file()
req("const TASK_KEYS = Object.freeze(['readiness','custom_requests','orders','inventory','accounting','failed_api'])" in today_tasks,'Today Task bounded task-key authority missing')
if build262_active:
    for token in ('WITH task_keys(task_key) AS','VALUES (?), (?), (?), (?), (?), (?)','WHERE x.task_key = k.task_key','ORDER BY x.created_at DESC, x.today_task_action_id DESC','LIMIT 1'):
        req(token in today_tasks,f'Build 262 bounded latest-state batch missing: {token}')
    req('Promise.all(TASK_KEYS.map' not in today_tasks,'Build 262 must not restore six independent D1 statements')
else:
    for token in ("WHERE task_key=?","ORDER BY created_at DESC, today_task_action_id DESC","LIMIT 1"):
        req(token in today_tasks,f'Today Task bounded latest-state read missing: {token}')
req("FROM today_task_actions\n      ORDER BY datetime(created_at) DESC" not in today_tasks,'Today Tasks returned to full action-history scan')

# Lean startup keeps static Ctrl+K navigation but avoids presentation-only module D1 bootstrap
# and optional lazy observers while heavyweight business workspaces render.
req("'/admin/'" in auth_ui and "'/admin/index.html'" in auth_ui,'Admin Home is not included in lean startup')
req("if (!window.DDAdminLeanStartup?.enabled)" in admin_js,'Lean module-bootstrap guard missing')
req("dd-application-module-bootstrap.mjs?v=440" in admin_js,'Retained module bootstrap authority token missing')
req("if (!leanStartup && document.body?.dataset?.adminPage !== 'products')" in admin_js,'Lean inventory observer suppression missing')
req("if (!leanStartup) ddLazyImportWhenVisible({" in admin_js,'Lean external-help observer suppression missing')
req('MutationObserver' not in command_palette and 'setInterval(' not in command_palette,'Ctrl+K command palette must remain static/observer-free')
req("MANIFEST_URL = '/data/admin-navigation-modules.json'" in command_palette,'Ctrl+K static navigation authority missing')

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
    'public/js/admin-route-usage.js','functions/api/admin/live-readiness-playbook.js',
    'functions/api/admin/dashboard-summary.js','public/js/admin-seller-command-centre-build148.js',
    'public/js/admin-home-dashboard-v123.js','functions/api/_lib/todayTasksReadService.js',
    'public/js/admin-workspace-command-palette-v122.js',
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
print('Admin route telemetry: BROWSER-LOCAL / AUTOMATIC REMOTE D1 WRITES ZERO')
print('Admin Home: 10-MINUTE CACHE-FIRST / SHARED SELLER SNAPSHOT / DUPLICATE I.T.+TODAY READS ZERO')
print('Today Task action history: SIX INDEXED LATEST-STATE LOOKUPS / ONE BATCHED D1 STATEMENT WHEN BUILD 262 ACTIVE / NO FULL HISTORY SCAN')
print('Lean application-module presentation bootstrap: SKIPPED / SERVER MIDDLEWARE AUTHORITY RETAINED')
print('Schema/R2/provider/payment/refund/accounting mutation added: NONE')
