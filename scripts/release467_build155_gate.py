#!/usr/bin/env python3
"""Release 467 Build 155 — Products Client Responsiveness Hotfix source gate.

Build 155's behavioral protections remain historical regression requirements. Later
approved cache generations may replace the exact asset revision while preserving the
same responsiveness, observer, authorization, and non-mutation contracts.
"""
from pathlib import Path
import json
import subprocess
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


marketplace = read('public/js/admin-products-marketplace-readiness.js')
loader = read('public/js/admin-product-image-role-prompts.js')
media_fallback = read('public/js/product-media-fallback.js')
admin = read('public/js/admin.js')
middleware = read('functions/_middleware.js')
probe = read('scripts/products_browser_runtime_probe.mjs')
closure = read('release467-build154-products-worker-resource-hotfix.json')
manifest_text = read('migrations/canonical/manifest.json')

# Exact prior closure: Build 154 repaired Worker/server routing, but did not prove UI usability.
for token in (
    'fc74ea680c0eee221722ce1ede6cb7990b92551f',
    'cc50c65c7d4ecbb75e9744a57a14be7da4aba873',
    '36e466d2d971ac7c80f183c3b9b42a0ff56597d9',
    '34867834161', '34867834181', '34867834020', '34867834038',
    '34868084233', '34868183267', '34868183338',
    '"client_ui_usability_proven": false',
    '"products": 40', '"image_candidates": 216',
    'Build 155 addresses a browser-side self-triggering MutationObserver/render loop',
):
    req(token in closure, f'Build 154 closure token missing: {token}')

# Build 155 introduced cache separation. Build 159 is the approved successor generation
# for returning-browser coherence and must continue to preserve the Build 155 behavior.
req(
    "const PRODUCTS_ASSET_REVISION = '467-b155-products-lockup-recovery-v2';" in middleware
    or "const PRODUCTS_ASSET_REVISION = '467-b159-products-returning-browser-cache-v1';" in middleware,
    'Build 155 Product asset revision or approved successor revision missing'
)
req("const LAYOUT_ASSET_REVISION = '467-b153-layout-observer';" in middleware,
    'Build 153 layout-observer revision must remain preserved')
req("import('/public/js/admin-products-marketplace-readiness.js?v=467b155')" in loader,
    'Build 155 Marketplace Listing Readiness dynamic import cache revision missing')
req('467-b155-products-client-responsiveness' in marketplace,
    'Build 155 marketplace client revision marker missing')
req(
    "const PRODUCTS_MEDIA_FALLBACK_REVISION = '467-b155-products-media-admin-bound-v1';" in middleware
    or "const PRODUCTS_MEDIA_FALLBACK_REVISION = '467-b159-products-media-admin-cache-v1';" in middleware,
    'Build 155 Products media-fallback revision or approved successor revision missing'
)
req('v=${PRODUCTS_MEDIA_FALLBACK_REVISION}' in middleware,
    'Products fast path must use the current Product media-fallback cache revision')

# Emergency recovery boundary: Product Admin does not need the cross-admin section-position/context-dock helper.
# Keeping that helper out of Products prevents any stale cached copy of the historical dock observer from
# blocking the Product editor before its dropdown/table data can render.
req("document.body?.dataset?.adminPage !== 'products'" in admin,
    'Build 155 Product Admin navigation-context exclusion missing')
req("import('/public/js/admin-section-position-v130.js?v=467b130')" in admin,
    'Build 130 section-position import must remain available for non-Product admin routes')
req(admin.find("document.body?.dataset?.adminPage !== 'products'") < admin.find("import('/public/js/admin-section-position-v130.js?v=467b130')"),
    'Product Admin exclusion must guard the section-position/context-dock import')

# The public-media fallback must retain error recovery in Admin while excluding
# its document-wide mutation observer from the highly dynamic Admin runtime.
for token in (
    'const IS_ADMIN_RUNTIME=',
    "observer_mode:IS_ADMIN_RUNTIME?'error-only-admin':'public-mutation-and-error'",
    'if(!IS_ADMIN_RUNTIME){',
    "document.addEventListener('error'",
):
    req(token in media_fallback, f'Build 155 Admin media-observer boundary missing: {token}')
req(media_fallback.find('if(!IS_ADMIN_RUNTIME){') < media_fallback.find('new MutationObserver'),
    'Build 155 must create the public-media MutationObserver only inside the non-Admin boundary')

# Root-cause repair: renderer must be idempotent and observer must not react to its own DOM writes.
for token in (
    'let observer = null',
    'observer?.disconnect()',
    'observeTable();',
    'const renderKey = JSON.stringify(',
    'panel.dataset.ddMarketplaceRenderKey === renderKey',
    'panel.dataset.ddMarketplaceRenderKey = renderKey',
    'function mutationNeedsRender(records)',
    "target?.closest?.('.marketplace-readiness-inline')",
    'if (!mutationNeedsRender(records)) return;',
    'window.DDProductsMarketplaceReadinessHealth = Object.freeze({',
    'observed_mutation_batches',
    'ignored_self_mutation_batches',
):
    req(token in marketplace, f'Build 155 self-mutation/runtime-health contract missing: {token}')
req('new MutationObserver((records)' in marketplace,
    'Build 155 observer must inspect mutation records instead of blindly re-rendering')
req(marketplace.count('new MutationObserver') == 1,
    'Marketplace Listing Readiness must retain exactly one bounded observer')
req('panel.innerHTML = markup;' in marketplace,
    'Marketplace row renderer must retain its bounded authored markup write')
req(marketplace.find('panel.dataset.ddMarketplaceRenderKey === renderKey') < marketplace.find('panel.innerHTML = markup;'),
    'Marketplace row markup must be guarded by the render fingerprint before DOM replacement')

# Marketplace readiness remains browser-local and advisory; this hotfix adds no backend calls or write authority.
for forbidden in ('apiFetch(', "fetch('/api", 'fetch("/api', 'XMLHttpRequest', 'method: \'POST\'', 'method: "POST"', 'method: \'PUT\'', 'method: \'DELETE\''):
    req(forbidden not in marketplace, f'Build 155 marketplace client gained forbidden backend/write behavior: {forbidden}')

# Real browser probe must verify event-loop responsiveness and populated Product data, not merely HTTP 200.
for token in (
    "const expectedRevision = '467-b155-products-client-responsiveness'",
    "document.getElementById('existingProductSelect')",
    "document.querySelectorAll('#productsTableBody [data-edit-product-id]').length",
    'DDProductsMarketplaceReadinessHealth',
    'marketplace_render_delta',
    'heartbeat_elapsed_ms',
    'cleanup_still_loading',
    'quality_still_loading',
    "if (Number(result?.option_count || 0) < 2)",
    "if (Number(result?.rendered_product_rows || 0) < 1)",
    "Number(result.marketplace_render_delta) > 2",
    'Browser event loop: RESPONSIVE',
    'Product data population: PROVEN',
):
    req(token in probe, f'Build 155 real-browser acceptance contract missing: {token}')
req('Page.navigate' in probe and 'Runtime.evaluate' in probe and 'Network.setCookie' in probe,
    'Build 155 browser probe must execute the authenticated live page through Chromium/CDP')
req("method: 'POST'" not in probe and 'method: "POST"' not in probe,
    'Build 155 browser probe must remain GET-only and non-mutating')

try:
    manifest = json.loads(manifest_text)
    files = [row.get('file') for row in manifest.get('migrations', [])]
    build155_baseline = [
        '0001_release464_migration_authority.sql',
        '0002_release464_operational_acceptance.sql',
        '0003_release464_business_growth.sql',
        '0004_release465_storefront_quality.sql',
    ]
    req(files[:4] == build155_baseline, f'Build 155 canonical migration baseline drifted: {files[:4]}')
except Exception as exc:
    FAIL.append(f'canonical migration manifest could not be parsed: {exc}')

for path in (
    'public/js/admin-products-marketplace-readiness.js',
    'public/js/admin-product-image-role-prompts.js',
    'public/js/product-media-fallback.js',
    'public/js/admin.js',
    'functions/_middleware.js',
    'scripts/products_browser_runtime_probe.mjs',
):
    result = subprocess.run(['node', '--check', str(ROOT / path)], cwd=ROOT, capture_output=True, text=True)
    req(result.returncode == 0, f'JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()}')

if FAIL:
    print('RELEASE 467 BUILD 155 GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)

print('RELEASE 467 BUILD 155 GATE: PASS')
print('Products client: Marketplace Listing Readiness self-mutation loop isolated')
print('Products recovery: nonessential navigation context chain excluded from Product Admin')
print('Cache: Build 155 responsiveness behavior preserved under the approved current Product generation')
print('Migration history: Build 155 preserves canonical 0001-0004 and permits later forward-only migrations')
print('Acceptance: real Chromium/CDP probe requires responsive event loop + populated Product picker/table')
print('Boundary: no schema, D1/R2 business-data, provider, payment/refund/accounting mutation')
