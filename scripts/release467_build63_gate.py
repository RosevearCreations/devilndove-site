#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 63 — D1 Read-Budget Protection."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "ce44ea5cdeb51430b5fea4145910d8ebb36abfac"
BASE_TREE = "da1a0dabc9e8c82c8fc4e63c1efd40afcda8649e"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def req(ok: bool, msg: str) -> None:
    if not ok:
        FAIL.append(msg)


def node_check(path: str) -> None:
    result = subprocess.run(
        ["node", "--check", str(ROOT / path)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-900:]}")


doc = read("docs/operations/RELEASE_467_BUILD_63_D1_READ_BUDGET_PROTECTION.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
budget = read("functions/api/_lib/d1ReadBudget.js")
picker = read("functions/api/admin/product-picker.js")
operator = read("functions/api/admin/d1-read-budget.js")
cold = read("public/js/admin-products-cold-start-recovery.js")
readiness = read("functions/api/admin/product-readiness.js")
replenishment = read("functions/api/admin/inventory-replenishment.js")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 63 — D1 Read-Budget Protection" in roadmap, "roadmap missing Build 63")
req("Release 467 Build 63" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 63 operating document identity drifted")
req("Cloudflare provider metering remains the authority" in doc, "Build 63 doc must distinguish app guardrails from provider metering")

# Canonical schema authority remains unchanged in this reliability build.
expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 63 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 63 must remain schema-neutral; unexpected canonical migration 0005 exists")

# Central read-budget source authority.
for token in (
    "D1_READ_BUDGET_VERSION = 'R467B63_V1'",
    "admin_products",
    "browser_cache_ms: 45000",
    "admin_product_picker",
    "default_limit: 100",
    "max_limit: 150",
    "min_search_length: 3",
    "search_mode: 'prefix_only'",
    "admin_product_readiness",
    "server_max_limit: 300",
    "admin_inventory_replenishment",
    "inventory: 500",
    "purchase_orders: 120",
    "recent_receipts: 40",
    "provider_metering_note",
):
    req(token in budget, f"D1 read-budget authority missing token: {token}")

# Lightweight picker must be bounded, keyset-based, and refuse blank/short supplied searches.
for token in (
    "resolveProductPickerBudget",
    "budget.searchBlocked",
    "product_id < ?",
    "ORDER BY product_id DESC",
    "LIMIT ?",
    "const fetchLimit = budget.limit + 1",
    "exact_total_count_avoided: true",
    "name LIKE ? COLLATE NOCASE",
    "slug LIKE ? COLLATE NOCASE",
    "sku LIKE ? COLLATE NOCASE",
):
    req(token in picker, f"Product picker budget contract missing token: {token}")
req("COUNT(*)" not in picker, "Product picker must not add an exact total-count read")
req("%${budget.q}%" not in picker, "Product picker must not use contains-everything wildcard search")

# Product page read reuse must preserve Build 62 coalescing and add short-lived response caching.
for token in (
    "const inflight = new Map()",
    "const responseCache = new Map()",
    "const cacheTtlByPath = new Map([",
    "['/api/admin/products', 45000]",
    "['/api/admin/product-picker', 60000]",
    "response.clone()",
    "cachedResponse(key)",
    "rememberResponse(key, path, response)",
    "window.DDProductsReadBudget",
    "responseCache.clear()",
    "pickerFallbackAttempted",
    "recoverProductPickerOnce",
    "'/api/admin/product-resource-bootstrap'",
    "'/api/admin/product-picker'",
    "readJson('/api/admin/product-picker?limit=120'",
):
    req(token in cold, f"Product read-budget browser guard missing token: {token}")
req("product-resource-bootstrap?product_id=0" not in cold, "degraded Product picker still invokes heavy Product resource bootstrap")

# Existing bounded projections remain explicit.
req("Math.min(300" in readiness, "Product readiness server maximum 300 is no longer explicit")
for token in ("LIMIT 500", "LIMIT 120", "LIMIT 40"):
    req(token in replenishment, f"Inventory replenishment existing hard cap missing: {token}")

# Operator surface must remain read-only and honest about provider metering.
for token in (
    "publicReadBudgetSnapshot",
    "provider_usage_metering_available_here: false",
    "automatic_query_shutdown: false",
    "automatic_d1_mutation: false",
    "Cloudflare provider-side D1 usage remains the authority",
):
    req(token in operator, f"D1 read-budget operator projection missing token: {token}")

for path in (
    "functions/api/_lib/d1ReadBudget.js",
    "functions/api/admin/product-picker.js",
    "functions/api/admin/d1-read-budget.js",
    "public/js/admin-products-cold-start-recovery.js",
):
    node_check(path)

if FAIL:
    print("RELEASE 467 BUILD 63 D1 READ-BUDGET PROTECTION: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 63 D1 READ-BUDGET PROTECTION: PASS")
print("Product startup identical GETs: COALESCED + SHORT-LIVED RESPONSE REUSE")
print("Degraded Product picker: LIGHTWEIGHT KEYSET ROUTE")
print("Blank/short picker search: BLOCKED")
print("Exact Product picker total-count read: AVOIDED")
print("Existing Product readiness / Inventory replenishment caps: VERIFIED")
print("Provider D1 rows-read usage: EXPLICITLY LEFT TO CLOUDFLARE METERING")
print("Schema / business-data / R2 / provider mutation: NONE")
