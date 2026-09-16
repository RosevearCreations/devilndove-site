#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def read(path):
    file = ROOT / path
    if not file.is_file():
        FAIL.append(f"missing required file: {path}")
        return ""
    return file.read_text(encoding="utf-8", errors="replace")


def load(path):
    try:
        value = json.loads(read(path))
    except Exception as error:
        FAIL.append(f"invalid JSON {path}: {error}")
        return {}
    return value if isinstance(value, dict) else {}


def req(condition, message):
    if not condition:
        FAIL.append(message)


canonical = load("migrations/canonical/manifest.json")
expected_migrations = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
    "0005_release467_inventory_process_assignment.sql",
]
req([row.get("file") for row in canonical.get("migrations", []) if isinstance(row, dict)] == expected_migrations,
    "Build 157 must not add or remove canonical migrations")

manifest = load("release467-build157-admin-data-delivery.json")
req(manifest.get("release") == 467 and manifest.get("build") == 157,
    "Build 157 authority identity is missing")
req(manifest.get("title") == "Product Admin + Admin Data Delivery",
    "Build 157 authority title drifted")
runtime = manifest.get("runtime") or {}
req(runtime.get("guard_version") == "R467B157_ADMIN_DATA_DELIVERY_V2",
    "Build 157 authority must bind Admin delivery V2")
req(runtime.get("product_core_snapshot_startup_budget") == 2,
    "Build 157 authority must allow exactly two startup Product snapshot consumers")
req(runtime.get("product_quality_duplicate_product_read") is False,
    "Build 157 Product Quality must not start a duplicate Product read")
req(runtime.get("product_readiness_actual_limit") == 80,
    "Build 157 authority must cap Product readiness at 80")
req(runtime.get("product_resource_bootstrap_default_limit") == 80,
    "Build 157 Product resource bootstrap default must be 80")
req(runtime.get("product_resource_bootstrap_max_limit") == 120,
    "Build 157 Product resource bootstrap hard max must be 120")
req(runtime.get("inventory_reconciliation_actual_limit") == 80,
    "Build 157 Inventory reconciliation actual limit must be 80")
req(runtime.get("admin_product_media_same_origin_retry") is False,
    "Build 157 Admin Product media must not retry missing keys through same-origin media API")
req(runtime.get("public_media_recovery_behavior_changed") is False,
    "Build 157 must preserve public media recovery")
req(runtime.get("mutations_rewritten") is False and runtime.get("static_json_business_authority_added") is False,
    "Build 157 authority must preserve mutation and business-authority boundaries")
for key in (
    "request_time_schema_mutation",
    "schema_change_authorized",
    "d1_mutation_authorized",
    "r2_mutation_authorized",
    "provider_execution_authorized",
    "provider_publication_authorized",
    "payment_mutation_authorized",
    "refund_mutation_authorized",
    "accounting_posting_authorized",
    "production_business_data_overwrite",
):
    req(manifest.get(key) is False, f"Build 157 safety boundary drift: {key}")

route = read("public/js/admin-route-usage.js")
for token in (
    "R467B157_ADMIN_DATA_DELIVERY_V2",
    "'/admin/products/'",
    "'/admin/inventory-operations/'",
    "DD_PRODUCT_SNAPSHOT_KEY",
    "readFreshProductSnapshot",
    "productSnapshotBudget = pagePath === '/admin/products/' ? 2 : 0",
    "Date.now() - installedAt <= 15_000",
    "url.pathname === '/api/admin/products'",
    "delivery: 'build157-core-product-snapshot'",
    "read_only_snapshot: true",
    "url.pathname === '/api/admin/product-readiness'",
    "url.searchParams.set('limit', '80')",
    "url.searchParams.set('force_deep', '1')",
    "url.searchParams.set('delivery', 'build157')",
    "waitForProductCore(1200)",
    "url.pathname === '/api/admin/product-resource-bootstrap'",
    "Math.min(120, requested, 80)",
    "url.pathname === '/api/admin/inventory-material-usage-reconciliation'",
    "Math.min(80, requested)",
    "method !== 'GET'",
    "productSnapshotBudget = 0",
    "DD_PRODUCT_QUALITY_RECOVERY_SRC",
    "MutationObserver",
    "DDAdminDataDeliveryHealth",
):
    req(token in route, f"Build 157 Admin delivery guard missing marker: {token}")
req("product quality view unavailable" in route.lower(),
    "Build 157 Admin delivery guard must detect the legacy Product Quality unavailable state")
req("boundedApiFetch.__ddAdminDataDeliveryV157 = true" in route,
    "Build 157 delivery guard wrapper identity missing")
req("window.DDAuth.apiFetch = boundedApiFetch" in route,
    "Build 157 delivery guard is not installed")

bootstrap = read("functions/api/admin/product-resource-bootstrap.js")
for token in (
    "DEFAULT_PRODUCT_LIMIT = 80",
    "MAX_PRODUCT_LIMIT = 120",
    "boundedProductLimit(url)",
    "loadProducts(db, env, productLimit)",
    "resource_catalog_preloaded: false",
    "product_row_limit_max: MAX_PRODUCT_LIMIT",
):
    req(token in bootstrap, f"Build 157 Product resource bootstrap missing marker: {token}")
req("loadProducts(db, env, 600)" not in bootstrap,
    "Build 157 must remove the historical 600-row Product resource bootstrap")
for forbidden in ("CREATE TABLE", "ALTER TABLE", "DROP TABLE"):
    req(forbidden not in bootstrap.upper(), f"Product resource bootstrap contains request-time DDL: {forbidden}")

resource_search = read("functions/api/admin/product-resource-search.js")
for token in (
    "if (!q)",
    "resources: []",
    "search_required: true",
    "Math.min(120, requestedLimit)",
):
    req(token in resource_search, f"Product resource search lost bounded search behavior: {token}")

inventory_client = read("public/js/admin-inventory-material-usage-reconciliation-v112.js")
req("/api/admin/inventory-material-usage-reconciliation?limit=500" in inventory_client,
    "Build 112 historical Inventory reconciliation client contract drifted")
req("method:'POST'" not in inventory_client and "setInterval(" not in inventory_client,
    "Inventory reconciliation client must remain read-only and non-polling")

budget = read("public/js/admin-products-request-budget-v156.js")
for token in (
    "MAX_CONCURRENT_GETS = 2",
    "MAX_NONCORE_GETS = 1",
    "reserved_core_slots: 1",
    "url.searchParams.set('limit', '500')",
):
    req(token in budget, f"Build 156 Product request scheduler compatibility drifted: {token}")

quality = read("public/js/admin-product-quality-command-center.js")
req("/api/admin/product-readiness?limit=300&show_ready=1" in quality,
    "Build 14 Product Quality authority marker drifted")
req("nothing is published automatically" in quality.lower(),
    "Product Quality automatic-publication boundary drifted")

quality_recovery = read("public/js/admin-product-quality-command-center-v157.js")
for token in (
    "R467B157_PRODUCT_QUALITY_RECOVERY_V1",
    "dd_admin_products_snapshot_v2",
    "dd:products-core-recovered",
    "/api/admin/product-readiness?limit=80&show_ready=1",
    "Promise.allSettled",
    "Secondary quality evidence",
    "nothing is published automatically",
    "duplicate_product_read: false",
):
    req(token in quality_recovery, f"Build 157 Product Quality recovery missing marker: {token}")
for forbidden_call in (
    "apiFetch('/api/admin/products'",
    'apiFetch("/api/admin/products"',
    "fetch('/api/admin/products'",
    'fetch("/api/admin/products"',
):
    req(forbidden_call not in quality_recovery,
        f"Build 157 Product Quality recovery must not execute duplicate Product API read: {forbidden_call}")
for forbidden in ("method: 'POST'", 'method:"POST"', "setInterval("):
    req(forbidden not in quality_recovery, f"Build 157 Product Quality recovery gained forbidden behavior: {forbidden}")

media_fallback = read("public/js/product-media-fallback.js")
req(
    "const VERSION=62" in media_fallback or "const VERSION=63" in media_fallback,
    "Build 157 media recovery version or approved successor version missing"
)
if "const VERSION=63" in media_fallback:
    req("const BUILD159_ADMIN_CACHE_PATCH=159" in media_fallback and "build159_admin_cache_patch" in media_fallback,
        "Build 159 media successor must carry explicit Admin cache-patch identity")
for token in (
    "const BUILD157_ADMIN_PATCH=157",
    "IS_ADMIN_RUNTIME&&info.isProduct",
    "admin_same_origin_retry_suppressed",
    "showProductPlaceholder(img)",
    "/api/product-media?key=",
    "public storefront",
):
    req(token.lower() in media_fallback.lower(), f"Build 157 media recovery missing marker: {token}")
req("bucket.put(" not in media_fallback and "bucket.delete(" not in media_fallback,
    "Build 157 media fallback must remain mutation-free")

catalog = read("functions/api/admin/_catalog-option-authority.js")
for token in (
    "CATALOG_AUTHORITY_TTL_MS = 5 * 60 * 1000",
    "CATALOG_AUTHORITY_STALE_TTL_MS = 60 * 60 * 1000",
    "invalidateCatalogOptionAuthority",
):
    req(token in catalog, f"Catalog option cached authority drifted: {token}")

browser_probe = read("scripts/products_build157_browser_probe.mjs")
for token in (
    "BUILD 157 PRODUCTS BROWSER PROBE: PASS",
    "Product quality view unavailable",
    "Product startup request timed out",
    "url.pathname === '/api/product-media'",
    "row.status === 404",
    "same_origin_product_media_404_count",
    "quality_unavailable",
    "quality_still_loading",
    "Admin Product media recovery 404s: ZERO",
):
    req(token in browser_probe, f"Build 157 focused browser probe missing marker: {token}")
for forbidden in ("method: 'POST'", 'method:"POST"', "method:'PUT'", "method:'DELETE'"):
    req(forbidden not in browser_probe, f"Build 157 focused browser probe gained mutation behavior: {forbidden}")

dev_browser_workflow = read(".github/workflows/release467-build155-products-development-browser.yml")
prod_browser_workflow = read(".github/workflows/release467-build155-products-production-browser.yml")
for workflow, label in (
    (dev_browser_workflow, "Development"),
    (prod_browser_workflow, "Production"),
):
    req("scripts/products_build157_browser_probe.mjs" in workflow,
        f"Build 157 {label} browser workflow must invoke the focused Product Quality/media probe")
    req("Build 157 Product Quality" in workflow,
        f"Build 157 {label} browser workflow must expose Product Quality acceptance boundary")
    req("/api/product-media 404 responses must be ZERO" in workflow,
        f"Build 157 {label} browser workflow must expose Admin media 404 acceptance boundary")

doc = read("docs/operations/RELEASE_467_BUILD_157_ADMIN_DATA_DELIVERY.md")
for token in (
    "small core read → interactive workspace → bounded secondary evidence",
    "80 Products maximum",
    "80 default / 120 hard max",
    "Mobile Product bootstrap",
    "5-minute",
    "1-hour",
    "Do not turn Products, Inventory, Orders, Finance, pricing, or stock into static JSON",
):
    req(token in doc, f"Build 157 operator documentation missing: {token}")

for path in (
    "public/js/admin-route-usage.js",
    "public/js/admin-product-quality-command-center-v157.js",
    "public/js/product-media-fallback.js",
    "functions/api/admin/product-resource-bootstrap.js",
    "scripts/products_build157_browser_probe.mjs",
):
    result = subprocess.run(["node", "--check", str(ROOT / path)], cwd=ROOT, capture_output=True, text=True)
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()}")

if FAIL:
    print("FAIL Release 467 Build 157 — Product Admin + Admin Data Delivery")
    for index, item in enumerate(FAIL, 1):
        print(f"{index:03d}. {item}")
    sys.exit(1)

print("PASS Release 467 Build 157 — Product Admin + Admin Data Delivery")
print("product_core_delivery=FIRST")
print("product_startup_snapshot_consumers=2_MAX")
print("product_quality_duplicate_product_read=NONE")
print("product_quality_failure_mode=FAIL_SOFT")
print("product_readiness_actual_limit=80")
print("product_resource_bootstrap=80_DEFAULT_120_MAX")
print("inventory_reconciliation_actual_limit=80")
print("admin_missing_product_media_retry=SUPPRESSED")
print("build157_browser_quality_timeout=FAIL_CLOSED")
print("build157_browser_admin_product_media_404=FAIL_CLOSED")
print("public_media_recovery=UNCHANGED")
print("catalog_option_authority=CACHED_D1_NOT_STATIC_JSON")
print("media_cache_generation=BUILD157_OR_APPROVED_BUILD159_SUCCESSOR")
print("schema_d1_write_r2_provider_payment_refund_accounting_mutation=NONE")
