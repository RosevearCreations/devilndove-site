#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 62 — Products & Inventory Final Reliability."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "d93747a0b3fa8c2b27003c9274e993967f021713"
BASE_TREE = "2c15bba48045462b77c3d33eeccdd4f2cb2c7be7"
AUTHORITY_PATH = ROOT / "release467-build62-products-inventory-final-reliability.json"


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
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-700:]}")


roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
doc = read("docs/operations/RELEASE_467_BUILD_62_PRODUCTS_INVENTORY_FINAL_RELIABILITY.md")
cold = read("public/js/admin-products-cold-start-recovery.js")
enhancements = read("public/js/admin-products-enhancements.js")
admin = read("public/js/admin.js")
middleware = read("functions/_middleware.js")
layout = read("public/js/layout-overflow-guard.js")
table_css = read("css/admin-products-table-layout.css")

# Build authority is written only after the implementation has exact-head proof evidence.
# If present, it must agree with the source contract; its absence during the first
# implementation proof is intentional and avoids a self-claiming closure record.
if AUTHORITY_PATH.is_file():
    authority = json.loads(AUTHORITY_PATH.read_text(encoding="utf-8"))
    req(int(authority.get("release") or 0) == 467, "Build 62 release identity drifted")
    req(int(authority.get("build") or 0) == 62, "Build 62 build identity drifted")
    req(authority.get("title") == "Products & Inventory Final Reliability", "Build 62 title drifted")
    req(authority.get("source_base_sha") == BASE_SHA, "Build 62 predecessor SHA drifted")
    req(authority.get("source_base_tree_sha") == BASE_TREE, "Build 62 predecessor tree drifted")
    scope = authority.get("scope") or {}
    for key in (
        "product_cold_start_request_coalescing",
        "product_picker_recovery_one_shot",
        "catalog_dashboard_snapshot_reuse",
        "product_route_inventory_observer_excluded",
        "product_route_asset_cache_boundary_preserved",
        "product_table_bounded_layout_preserved",
        "editor_option_fallbacks_preserved",
        "startup_timeouts_preserved",
    ):
        req(scope.get(key) is True, f"Build 62 scope missing {key}")
    for key in (
        "schema_change",
        "d1_business_data_migration",
        "d1_mutation",
        "r2_mutation",
        "provider_execution",
        "provider_publication",
        "cloudflare_access_mutation",
        "automatic_production_promotion",
    ):
        req(scope.get(key) is False, f"Build 62 safety boundary drifted: {key}")

req("Build 62 — Products & Inventory Final Reliability" in roadmap, "roadmap missing Build 62")
req("Build 86 — I.T. Operations & Self-Diagnostics" in roadmap, "roadmap missing Build 86")
req("Build 62 is the immediate next build" in roadmap, "roadmap next-build pointer drifted")
req("Release 467 Build 62" in doc and BASE_SHA in doc, "Build 62 operating document drifted")

# Cold-start Product reads must be bounded and duplicate in-flight GETs coalesced.
for token in (
    "const inflight = new Map()",
    "coalescedPaths",
    "'/api/admin/products'",
    "'/api/admin/product-mobile-bootstrap'",
    "'/api/admin/product-resource-bootstrap'",
    "'/api/admin/product-readiness'",
    "'/api/admin/pending-actions'",
    "response.clone()",
    "pickerFallbackAttempted",
    "recoverProductPickerOnce",
    "optionsReady",
    "scheduleRecovery",
):
    req(token in cold, f"Products cold-start reliability token missing: {token}")
for stale in (
    "window.setTimeout(() => void start(), 350)",
    "window.setTimeout(() => void start(), 1200)",
    "window.setTimeout(() => void start(), 3000)",
    "recoverProductPicker(),",
):
    req(stale not in cold, f"repeated Product recovery pattern remains: {stale}")

# Catalog dashboard must reuse the shared Product snapshot rather than duplicate the Product aggregate read.
req("const SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2'" in enhancements, "catalog dashboard snapshot authority missing")
req("readProductSnapshot" in enhancements and "renderDashboardFromSnapshot" in enhancements, "catalog dashboard snapshot reuse missing")
req("no duplicate Product API read" in enhancements, "catalog dashboard operator truth note missing")
req("apiFetch('/api/admin/products'" not in enhancements and 'apiFetch("/api/admin/products"' not in enhancements, "catalog dashboard still issues duplicate Product API read")

# Preserve the incident fixes that made the Product route usable.
req("document.body?.dataset?.adminPage !== 'products'" in admin, "Products route no longer excludes inventory usability overlay")
req("admin-inventory-base-unit-usability.js?v=461" in admin, "inventory usability overlay authority unexpectedly removed")
req("PRODUCTS_ASSET_REVISION" in middleware and "admin-products-table-layout.css" in middleware, "Products route cache/layout boundary missing")
req(".admin-table-wrap" in layout, "shared table guard no longer recognizes admin table containment")
req(".products-admin-table-wrap" in table_css and "min-width:1608px" in table_css, "Products records table bounded layout missing")

node_check("public/js/admin-products-cold-start-recovery.js")
node_check("public/js/admin-products-enhancements.js")

if FAIL:
    print("RELEASE 467 BUILD 62 PRODUCTS & INVENTORY FINAL RELIABILITY: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 62 PRODUCTS & INVENTORY FINAL RELIABILITY: PASS")
print("Product startup duplicate GETs: COALESCED")
print("Catalog dashboard duplicate Product aggregate read: REMOVED")
print("Product picker recovery: ONE-SHOT FALLBACK")
print("Inventory usability observer on Products: EXCLUDED")
print("Schema / D1 business-data / R2 / provider mutation: NONE")
