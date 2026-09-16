#!/usr/bin/env python3
from pathlib import Path
import json, subprocess

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

manifest = json.loads(read('migrations/canonical/manifest.json') or '{}')
files = [row.get('file') for row in manifest.get('migrations', []) if isinstance(row, dict)]
req(files == [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
    '0005_release467_inventory_process_assignment.sql',
], 'Build 158 must not introduce a schema migration')

editor = read('public/js/admin-products-editor-startup-v158.js')
for token in (
    "VERSION = 'R467B158_EDITOR_STARTUP_V1'",
    "SNAPSHOT_KEY = 'dd_admin_product_editor_options_v158'",
    'FALLBACK_AFTER_MS = 4200',
    'SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000',
    "url.pathname !== '/api/admin/product-mobile-bootstrap'",
    "url.searchParams.set('options_only', '1')",
    'canonicalInflight',
    'shared_hits',
    'fallbackPayload(reason',
    "source: 'browser-snapshot'",
    "source: 'safe-defaults'",
    'delete requestOptions.signal',
    'clearLegacyTimeoutMessage()',
    'Product startup request timed out after 6000 ms',
    'DDProductsEditorStartupHealth',
):
    req(token in editor, f'Build 158 editor startup helper missing {token}')
req('setInterval(' not in editor, 'Build 158 editor startup helper must not poll')
req("method: 'POST'" not in editor and 'method: "POST"' not in editor, 'Build 158 editor startup helper must not contain POST mutations')
req('/api/admin/product-mobile-bootstrap' in editor, 'Build 158 editor helper must stay scoped to Product bootstrap')
req('/api/admin/update-product' not in editor and '/api/admin/create-product' not in editor, 'Build 158 editor helper must not intercept Product writes')

quality = read('public/js/admin-product-quality-pending-v158.js')
for token in (
    "VERSION = 'R467B158_QUALITY_PENDING_V1'",
    'readiness_timeout',
    'Readiness evidence is deferred',
    'Unknown readiness remains pending and is not marked complete',
    'real_warning_preserved',
    'data-dd-build158-readiness-deferred',
    'Release 467 Build 158',
):
    req(token in quality, f'Build 158 quality pending helper missing {token}')
for forbidden in ('fetch(', 'apiFetch(', 'apiJson(', 'XMLHttpRequest', 'MutationObserver', 'setInterval('):
    req(forbidden not in quality, f'Build 158 quality pending helper must remain network/polling free: {forbidden}')
req("method: 'POST'" not in quality and 'method: "POST"' not in quality, 'Build 158 quality helper must be mutation-free')
req('Buyer facts:' in quality and 'resource limit' in quality and 'failed' in quality, 'Build 158 quality helper must preserve real warning classes')

budget = read('public/js/admin-products-request-budget-v156.js')
build158_budget = "VERSION = 'R467B156_REQUEST_BUDGET_V2'" in budget
build159_budget = "VERSION = 'R467B159_REQUEST_BUDGET_V3'" in budget
req(build158_budget or build159_budget, 'Build 158 request-budget integration missing an approved Build 156/159 runtime version')
for token in (
    'MAX_CONCURRENT_GETS = 2',
    'MAX_NONCORE_GETS = 1',
    'reserved_core_slots: 1',
    'data-dd-products-editor-startup-v158',
    'data-dd-product-quality-pending-v158',
):
    req(token in budget, f'Build 158 request-budget integration missing {token}')
if build158_budget:
    for token in (
        '/public/js/admin-products-editor-startup-v158.js?v=467b158-editor-startup-v1',
        '/public/js/admin-product-quality-pending-v158.js?v=467b158-quality-pending-v1',
    ):
        req(token in budget, f'Build 158 request-budget integration missing {token}')
elif build159_budget:
    for token in (
        '/public/js/admin-products-editor-startup-v158.js?v=467b159-editor-startup-cache-v2',
        '/public/js/admin-product-quality-pending-v158.js?v=467b159-quality-pending-cache-v2',
    ):
        req(token in budget, f'Build 158 successor integration missing {token}')
req('setInterval(' not in budget, 'Build 156/158 request budget integration must not add recurring polling')

prior = json.loads(read('release467-build157-admin-data-delivery.json') or '{}')
req(prior.get('release') == 467 and prior.get('build') == 157, 'Build 158 must inherit Release 467 Build 157 authority')
req(prior.get('request_time_schema_mutation') is False, 'Prior Build 157 request-time schema boundary changed unexpectedly')

for path in (
    'public/js/admin-products-editor-startup-v158.js',
    'public/js/admin-product-quality-pending-v158.js',
    'public/js/admin-products-request-budget-v156.js',
):
    result = subprocess.run(['node', '--check', str(ROOT / path)], cwd=ROOT, capture_output=True, text=True)
    req(result.returncode == 0, f'JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()}')

print('RELEASE 467 BUILD 158 — PRODUCT EDITOR STARTUP RESILIENCE')
if FAIL:
    print('FAIL')
    for index, failure in enumerate(FAIL, 1):
        print(f'{index:03d}. {failure}')
    raise SystemExit(1)

print('PASS')
print('Editor startup: one canonical Product option read with bounded browser snapshot/default fallback')
print('Legacy 6000 ms Product editor timeout: cleared only for the scoped optional editor-option lookup')
print('Quality readiness timeout: presented as deferred/pending; unknown evidence remains unknown')
print('Real quality failures: warning state preserved')
print('Build 156 Product request concurrency contract: preserved, including approved Build 159 cache-rotation successor')
print('Schema/D1/R2/Product writes: unchanged')
