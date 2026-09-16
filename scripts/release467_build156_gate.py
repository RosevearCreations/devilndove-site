#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def read(path):
    file = ROOT / path
    if not file.is_file():
        FAIL.append(f'missing {path}')
        return ''
    return file.read_text(encoding='utf-8', errors='replace')


def req(value, message):
    if not value:
        FAIL.append(message)


def req_any(text, tokens, message):
    req(any(token in text for token in tokens), message)


# Build 156 inventory/process authority remains immutable.
manifest = json.loads(read('migrations/canonical/manifest.json') or '{}')
files = [x.get('file') for x in manifest.get('migrations', []) if isinstance(x, dict)]
expected = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
    '0005_release467_inventory_process_assignment.sql',
]
req(files == expected, 'Build 156 canonical migration stream must be exactly 0001-0005')

migration = read('migrations/canonical/0005_release467_inventory_process_assignment.sql')
for token in (
    'inventory_processes', 'inventory_process_assignments', 'laser-engraving',
    '3d-printing', 'FOREIGN KEY(site_item_inventory_id)', 'UNIQUE',
):
    req(token in migration, f'migration missing {token}')
req('DROP TABLE' not in migration.upper(), 'Build 156 migration must be additive')

api = read('functions/api/admin/inventory-process-assignments.js')
for token in (
    'getAdminUserFromRequest', 'site_item_inventory', 'inventory_process_assignments',
    "IN ('tool','supply')", "action!=='assign'", "action==='clear'",
    "action==='create_process'", 'auditAdminAction',
):
    req(token in api, f'process API missing {token}')
for forbidden in ('CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'):
    req(forbidden not in api.upper(), f'process API contains request-time DDL: {forbidden}')

ui = read('public/js/admin-inventory-process-assignments-v156.js')
for token in (
    'inventoryProcessAssignmentsMount', '/api/admin/inventory-process-assignments',
    'Tools + supplies', 'Tools only', 'Supplies only', 'Add a custom process',
):
    req(token in ui, f'process UI missing {token}')
page = read('admin/inventory-operations/index.html')
req('id="inventoryProcessAssignmentsMount"' in page, 'Inventory Operations missing process mount')
req('/public/js/admin-inventory-process-assignments-v156.js?v=467b156' in page,
    'Inventory Operations missing cache-busted Build 156 client')
req(page.lower().count('<h1') == 1, 'Inventory Operations must retain exactly one H1')

# Build 159 is an approved cache/runtime successor to the Build 156 Product request budget.
# The concurrency contract is unchanged; only the identity/cache generation is newer.
budget = read('public/js/admin-products-request-budget-v156.js')
req_any(
    budget,
    ("VERSION = 'R467B156_REQUEST_BUDGET_V2'", "VERSION = 'R467B159_REQUEST_BUDGET_V3'"),
    'Product request budget missing approved Build 156/159 version identity',
)
for token in (
    'MAX_CONCURRENT_GETS = 2', 'MAX_NONCORE_GETS = 1', 'reserved_core_slots: 1',
    'active_core_gets', 'active_noncore_gets', 'nextRunnableJobIndex()',
    "job.priority === 0", 'DDProductsRequestBudgetHealth', 'sharedRequests = new Map()',
    'canonical_readiness_requests', "url.pathname === '/api/admin/product-readiness'",
    "url.searchParams.set('limit', '500')", "url.searchParams.set('show_ready', '1')",
    '__ddProductsRequestBudget', "method !== 'GET'",
):
    req(token in budget, f'Product request budget missing {token}')
req('setInterval(' not in budget, 'Product request budget must not add recurring polling')
req("url.pathname.startsWith('/api/admin/')" in budget,
    'Product request budget must stay inside authenticated admin GET scope')
req(
    "path === '/api/admin/products' || path === '/api/admin/product-picker' || path === '/api/admin/product-mobile-bootstrap'" in budget,
    'Core Product bootstrap family must retain priority zero',
)

scheduler = read('scripts/build156_product_request_budget_test.mjs')
for token in ('slow-background-a', 'slow-background-b', '/api/admin/products',
              'Core Product bootstrap lane: RESERVED AND PROVEN'):
    req(token in scheduler, f'Product scheduler proof missing {token}')

auth_recovery = read('public/js/admin-products-auth-ready-recovery-v156.js')
for token in (
    "VERSION = 'R467B156_AUTH_READY_RECOVERY_V3'", 'AUTH_WAIT_TIMEOUT_MS = 8000',
    'AUTH_WAIT_STEP_MS = 250', 'DDProductsAuthReadyRecoveryHealth',
    "document.addEventListener('dd:admin-ready'", "document.addEventListener('dd:auth-verified'",
    'detail?.verified === true', 'locallyLoggedIn()', 'startBoundedAuthWait()',
    "schedule('bounded-local-auth-wait')", "document.querySelector('[data-refresh-products]')",
    "document.getElementById('refreshProductCleanup')", 'recovery_attempted',
    'skipped_already_ready', 'auth_wait_started', 'auth_wait_checks', 'auth_wait_logged_in',
    'auth_wait_exhausted',
):
    req(token in auth_recovery, f'Product authenticated recovery missing {token}')
req('apiFetch(' not in auth_recovery, 'Product auth recovery must not create its own API lane')
req('setInterval(' not in auth_recovery, 'Product auth recovery must remain bounded and must not use recurring polling')
req("method: 'POST'" not in auth_recovery and 'method: "POST"' not in auth_recovery,
    'Product auth recovery must not contain mutation requests')
req('getStoredUser' not in auth_recovery,
    'Product bounded auth wait must not depend on a client-side role object')

auth_test = read('scripts/build156_products_auth_ready_recovery_test.mjs')
for token in ('R467B156_AUTH_READY_RECOVERY_V3', 'verified: false', 'verified: true',
              'one Product refresh + one cleanup refresh', 'Duplicate verified event: no second recovery'):
    req(token in auth_test, f'Product auth-ready behavior proof missing {token}')
fallback_test = read('scripts/build156_products_auth_ready_fallback_test.mjs')
for token in (
    'R467B156_AUTH_READY_RECOVERY_V3', 'let loggedIn = false', 'setTimeout(resolve, 600)',
    'loggedIn = true', 'auth_wait_started', 'auth_wait_checks', 'auth_wait_logged_in',
    'auth_wait_exhausted', 'bounded-local-auth-wait', 'Product refresh: exactly one',
    'Cleanup refresh: exactly one',
):
    req(token in fallback_test, f'Product bounded local-auth behavior proof missing {token}')

cold = read('public/js/admin-products-cold-start-recovery.js')
for token in (
    "VERSION = 'R467B156_CORE_PRODUCT_RECOVERY_V1'", 'DDProductsColdStartRecoveryHealth',
    'locallyAuthenticated()', 'recoverCoreProductList()', 'renderCoreProductTable(products)',
    "readJson('/api/admin/products', 8000)", 'data-dd-core-recovery="1"',
    'data-edit-product-id=', 'data-open-product-correction=',
    "document.dispatchEvent(new CustomEvent('dd:products-core-recovered'",
    "document.getElementById('refreshProductCleanup')", "document.addEventListener('dd:auth-verified'",
    'pickerFallbackAttempted = false',
):
    req(token in cold, f'Core Product recovery missing {token}')
req('setInterval(' not in cold, 'Core Product recovery must not add recurring polling')
req("method: 'POST'" not in cold and 'method: "POST"' not in cold,
    'Core Product recovery must remain read-only')
req('Server-side admin' in cold,
    'Core Product GET recovery must retain server-side authorization boundary note')

quality_fallback = read('public/js/admin-product-quality-fallback-v156.js')
for token in (
    "VERSION = 'R467B156_QUALITY_FALLBACK_V1'", 'DDProductQualityFallbackHealth',
    "document.addEventListener('dd:products-core-recovered'",
    'Product Release Quality Command Center', 'Core Product authority is ready.',
    'Detailed readiness, buyer-fact, SEO, image, and marketplace checks are resolving independently',
    'Essential Product work is available.', 'No quality result is invented or marked complete here.',
    'data.ddQualityFallback',
):
    req(token in quality_fallback, f'Product quality fail-soft recovery missing {token}')
req('apiFetch(' not in quality_fallback and 'fetch(' not in quality_fallback,
    'Product quality fallback must not create a network lane')
req('setInterval(' not in quality_fallback,
    'Product quality fallback must not add recurring polling')
req("method: 'POST'" not in quality_fallback and 'method: "POST"' not in quality_fallback,
    'Product quality fallback must remain mutation-free')
quality_test = read('scripts/build156_product_quality_fallback_test.mjs')
for token in ('R467B156_QUALITY_FALLBACK_V1', 'Loading Product Release Quality Command Center',
              'Essential Product work is available.', 'Network/mutation work: NONE'):
    req(token in quality_test, f'Product quality fallback behavior proof missing {token}')

layout = read('public/js/layout-overflow-guard.js')
req('/public/js/admin-products-auth-ready-recovery-v156.js?v=467b156-auth-ready-v3' in layout,
    'Layout fallback must cache-bust the Product auth recovery asset at v3')
req('data-dd-products-auth-ready-recovery' in layout,
    'Layout fallback missing Product auth recovery identity')

middleware = read('functions/_middleware.js')
request_loader = '/public/js/admin-products-request-budget-v156.js?v=${PRODUCTS_REQUEST_BUDGET_REVISION}'
auth_loader = '/public/js/admin-products-auth-ready-recovery-v156.js?v=${PRODUCTS_AUTH_READY_REVISION}'
cold_loader = '/public/js/admin-products-cold-start-recovery.js?v=${PRODUCTS_COLD_START_REVISION}'
quality_loader = '/public/js/admin-product-quality-fallback-v156.js?v=${PRODUCTS_QUALITY_FALLBACK_REVISION}'
req_any(
    middleware,
    (
        "const PRODUCTS_REQUEST_BUDGET_REVISION = '467b156-request-budget-v2';",
        "const PRODUCTS_REQUEST_BUDGET_REVISION = '467b159-request-budget-loader-v1';",
    ),
    'Product request budget cache revision missing approved Build 156/159 identity',
)
req("const PRODUCTS_AUTH_READY_REVISION = '467b156-auth-ready-v3';" in middleware,
    'Product auth recovery cache revision v3 missing')
req("const PRODUCTS_COLD_START_REVISION = '467b156-core-product-recovery-v1';" in middleware,
    'Core Product recovery cache revision missing')
req("const PRODUCTS_QUALITY_FALLBACK_REVISION = '467b156-quality-fallback-v1';" in middleware,
    'Product quality fallback cache revision missing')
req(request_loader in middleware, 'Product request budget fast-path loader missing')
req(auth_loader in middleware, 'Product auth recovery fast-path loader missing')
req(cold_loader in middleware, 'Core Product cold-start recovery loader missing')
req(quality_loader in middleware, 'Product quality fail-soft loader missing')
req(middleware.find(request_loader) < middleware.find(auth_loader) < middleware.find(cold_loader) < middleware.find(quality_loader),
    'Product fast path must load budget, auth recovery, core recovery, then quality fail-soft recovery')
req('data-dd-products-auth-ready-recovery="1"' in middleware,
    'Product auth recovery fast-path identity missing')
req('data-dd-products-cold-start="1"' in middleware,
    'Core Product recovery fast-path identity missing')
req('data-dd-products-quality-fallback="1"' in middleware,
    'Product quality fail-soft fast-path identity missing')
req_any(
    middleware,
    (
        "const PRODUCTS_ASSET_REVISION = '467-b155-products-lockup-recovery-v2';",
        "const PRODUCTS_ASSET_REVISION = '467-b159-products-returning-browser-cache-v1';",
    ),
    'Product asset identity missing approved Build 155/159 generation',
)
req("const LAYOUT_ASSET_REVISION = '467-b153-layout-observer';" in middleware,
    'Build 153 historical layout identity must remain preserved')

syntax_paths = (
    'public/js/admin-products-request-budget-v156.js',
    'public/js/admin-products-auth-ready-recovery-v156.js',
    'public/js/admin-products-cold-start-recovery.js',
    'public/js/admin-product-quality-fallback-v156.js',
    'public/js/admin-inventory-process-assignments-v156.js',
    'public/js/layout-overflow-guard.js',
    'functions/_middleware.js',
    'scripts/build156_product_request_budget_test.mjs',
    'scripts/build156_products_auth_ready_recovery_test.mjs',
    'scripts/build156_products_auth_ready_fallback_test.mjs',
    'scripts/build156_product_quality_fallback_test.mjs',
)
for path in syntax_paths:
    result = subprocess.run(['node', '--check', str(ROOT / path)], cwd=ROOT, capture_output=True, text=True)
    req(result.returncode == 0,
        f'JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()}')

for path, label in (
    ('scripts/build156_product_request_budget_test.mjs', 'Product request scheduler behavior proof'),
    ('scripts/build156_products_auth_ready_recovery_test.mjs', 'Product verified-auth recovery behavior proof'),
    ('scripts/build156_products_auth_ready_fallback_test.mjs', 'Product bounded local-auth wait proof'),
    ('scripts/build156_product_quality_fallback_test.mjs', 'Product quality fail-soft behavior proof'),
):
    result = subprocess.run(['node', path], cwd=ROOT, capture_output=True, text=True)
    req(result.returncode == 0, f'{label} failed: {(result.stderr or result.stdout).strip()}')

print('RELEASE 467 BUILD 156 — TOOL & SUPPLY PROCESS ASSIGNMENT + PRODUCT REQUEST BUDGET')
if FAIL:
    print('FAIL')
    [print(f'{i:03d}. {item}') for i, item in enumerate(FAIL, 1)]
    raise SystemExit(1)
print('PASS')
print('Product Admin: max two concurrent authenticated admin GETs; duplicate startup reads are shared')
print('Product bootstrap: one request lane remains available for Product list/picker/bootstrap while non-core reads serialize')
print('Product scheduler proof: deterministic reserved-lane starvation test GREEN')
print('Product auth recovery: verified auth performs one bounded Product/cleanup refresh after late authentication')
print('Product core recovery: /api/admin/products can render picker + editable table independently of secondary readiness')
print('Product cleanup recovery: recovered core Product data triggers one reuse of the cleanup read lane')
print('Product quality recovery: core Product authority renders a truthful fail-soft quality summary while secondary evidence resolves')
print('Product readiness: list startup variants converge on one 500-row superset request')
print('Boundary: non-GET mutation behavior is unchanged')
