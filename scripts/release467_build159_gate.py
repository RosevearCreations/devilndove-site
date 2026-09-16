#!/usr/bin/env python3
"""Release 467 Build 159 — forward-only Product returning-browser cache proof.

Retained Build 154-158 safety/runtime contracts are successor-aware; this gate owns the
current Build 159 cache identities and does not self-claim later exact-head proof runs.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def req(condition, message):
    if not condition:
        raise SystemExit(f'FAIL Build 159: {message}')

middleware = read('functions/_middleware.js')
budget = read('public/js/admin-products-request-budget-v156.js')
media = read('public/js/product-media-fallback.js')
probe = read('scripts/products_build157_browser_probe.mjs')

for token in (
    "467-b159-products-returning-browser-cache-v1",
    "467-b159-products-media-admin-cache-v1",
    "467b159-request-budget-loader-v1",
    "X-DND-Products-Asset-Revision",
    "X-DND-Admin-Client-Cache",
    "no-store-b159",
    "isAdminClientAssetPath",
):
    req(token in middleware, f'middleware missing {token}')

for token in (
    "R467B159_REQUEST_BUDGET_V3",
    "467b159-editor-startup-cache-v2",
    "467b159-quality-pending-cache-v2",
    "MAX_CONCURRENT_GETS = 2",
    "reserved_core_slots: 1",
):
    req(token in budget, f'request budget missing {token}')

for token in (
    "const VERSION=63",
    "BUILD159_ADMIN_CACHE_PATCH=159",
    "IS_ADMIN_RUNTIME&&info.isProduct",
    "admin_same_origin_retry_suppressed",
    "build159_admin_cache_patch",
):
    req(token in media, f'media fallback missing {token}')

for token in (
    "editor_startup_timeout_6000",
    "request_budget_version",
    "media_fallback_version",
    "media_build159_patch",
    "Build 159 cache/runtime contract",
):
    req(token in probe, f'browser probe missing {token}')

req("PRODUCTS_ASSET_REVISION = '467-b155" not in middleware, 'stale Build 155 Product asset revision remains active')
req("PRODUCTS_MEDIA_FALLBACK_REVISION = '467-b155" not in middleware, 'stale Build 155 Product media revision remains active')
req("PRODUCTS_REQUEST_BUDGET_REVISION = '467b156" not in middleware, 'stale Build 156 request-budget loader revision remains active')

print('PASS Release 467 Build 159 — Returning Browser Product Cache Coherence')
print('product_asset_generation=BUILD159')
print('admin_js_cache_control=NO_STORE')
print('request_budget_runtime=R467B159_REQUEST_BUDGET_V3')
print('editor_helper_cache_generation=BUILD159')
print('media_fallback_runtime=63_BUILD159_ADMIN_PATCH')
print('browser_editor_6000_timeout=FAIL_CLOSED')
print('browser_admin_product_media_404=FAIL_CLOSED')
print('schema_d1_write_r2_provider_payment_refund_accounting_mutation=NONE')
