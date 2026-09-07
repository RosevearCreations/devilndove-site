#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 75 — Storefront Search & Collections."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "87628f0599a1af0bea331a69dfb5056bb166ebfd"
BASE_TREE = "99e45d9a34ceed5b2a5ef40d40fcc1c5ed67d912"


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
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-1800:]}")


def node_runtime(path: str) -> None:
    result = subprocess.run(
        ["node", str(ROOT / path)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"Build 75 runtime acceptance failed: {(result.stderr or result.stdout).strip()[-2200:]}")


doc = read("docs/operations/RELEASE_467_BUILD_75_STOREFRONT_SEARCH_COLLECTIONS.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
page = read("shop/index.html")
shop = read("public/js/shop.js")
client = read("public/js/storefront-search-collections.js")
merch = read("public/js/storefront-merchandising.js")
provenance = read("scripts/current_system_gate_provenance_gate.py")
runtime = read("scripts/release467_build75_storefront_search_collections_runtime_test.mjs")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 75 — Storefront Search & Collections" in roadmap, "roadmap missing Build 75")
req("Build 76 — SEO Technical Convergence" in roadmap, "roadmap missing Build 76")
req("Release 467 Build 75" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 75 operating document identity drifted")
for token in (
    "existing Product endpoint remains authoritative",
    "Availability filtering is fail-closed",
    "Zero-result assistance is explicit and bounded",
    "Derived merchandising highlights remain advisory",
    "performs no network request itself",
    "No D1 schema change is required",
    "Build 76 — SEO Technical Convergence",
):
    req(token in doc, f"Build 75 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 75 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 75 must remain schema-neutral; unexpected canonical migration 0005 exists")

# Shop template: one H1, explicit facets, one existing Product loader plus the Build 75 presentation layer.
req(len(re.findall(r"<h1\b", page, flags=re.I)) == 1, "Build 75 Shop template must keep exactly one H1")
for token in (
    'id="shopCategoryFilter"',
    'id="shopAvailabilityFilter"',
    'id="shopSortFilter"',
    'id="shopDiscoveryIntelligence"',
    'id="shopActiveFilters"',
    'id="shopZeroAssist"',
    '/public/js/shop.js?v=467b75',
    '/public/js/storefront-search-collections.js?v=75',
):
    req(token in page, f"Build 75 Shop template missing token: {token}")
req(page.index('/public/js/shop.js?v=467b75') < page.index('/public/js/storefront-search-collections.js?v=75'), "Build 75 presentation layer must load after the established Shop runtime")

# Existing Product request remains singular and exposes only a bounded in-memory presentation bridge.
for token in (
    "const BUILD75_LOCAL_PARAMS = ['category', 'availability', 'sort']",
    "function presentProducts",
    "dd:shop:data",
    "window.DDShopRuntime = Object.freeze",
    "present: (products, options = {}) => presentProducts(products, options)",
    "reload: () => loadProducts()",
    "data-build75-collection-filter=\"category\"",
    "data-build75-collection-filter=\"color\"",
    "shopMaterialFilter",
    "shopProcessFilter",
    "shopLocalityFilter",
    "shopSocialReadyFilter",
    "shopProofImageFilter",
):
    req(token in shop, f"Build 75 Shop runtime missing token: {token}")
req(shop.count("fetch(url, { method: 'GET' })") == 1, "Build 75 must preserve one explicit Shop Product fetch authority")
req("new MutationObserver" not in shop, "Build 75 must not add a persistent Shop mutation observer")

# New buyer-discovery layer is deterministic and performs no network/provider/polling/storage mutation work.
for token in (
    "const BUILD = 75",
    "const CONTRACT = 'storefront-search-collections'",
    "availabilityOfProduct",
    "filterAndSortProducts",
    "buildMerchandisingSummary",
    "buildRelaxationPlan",
    "DDStorefrontSearchCollections",
    "shopCategoryFilter",
    "shopAvailabilityFilter",
    "shopSortFilter",
    "No exact matches yet.",
    "Browse Collections",
    "additional_product_request: false",
    "automatic_merchandising_action: false",
):
    req(token in client, f"Build 75 discovery layer missing token: {token}")

for forbidden in (
    r"\bfetch\s*\(",
    r"\bXMLHttpRequest\b",
    r"\bsetInterval\s*\(",
    r"\bsetTimeout\s*\(",
    r"\bnavigator\.sendBeacon\b",
    r"stripe\.com",
    r"paypal\.com",
    r"pinterest\.com",
    r"instagram\.com",
    r"\b(?:INSERT|UPDATE|DELETE|REPLACE)\s+(?:INTO|FROM|products|product_)\b",
    r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b",
):
    req(not re.search(forbidden, client, re.I), f"Build 75 discovery layer gained forbidden behavior: {forbidden}")

# Published Collections/Collages remain on their existing authority.
req("/api/storefront-merchandising" in merch, "Build 75 lost the existing Collection/Collage API authority")
req("DDStorefrontMerchandising" in merch, "Build 75 lost the existing Collection/Collage browser authority")
req("/api/storefront-merchandising" not in client, "Build 75 must not duplicate the Collection/Collage fetch authority")
req("already-loaded /api/products payload" in client, "Build 75 must document that Product discovery consumes the existing payload")

# Runtime acceptance covers buyer-facing availability, filters, sorting, merchandising summary and zero-result help.
for token in (
    "digital Product is available without pretending physical inventory",
    "zero tracked inventory is out of stock",
    "untracked physical inventory stays fail-closed",
    "category filter is exact and case-insensitive",
    "price ascending sort is deterministic",
    "merchandising summary is derived only",
    "zero-result assistance proposes bounded filter relaxation",
):
    req(token in runtime, f"Build 75 runtime acceptance missing token: {token}")

req("release467_build75_gate.py" in provenance and "Release 467 Build 75" in provenance, "Current System Gate does not chain Build 75")
req("release467_build74_gate.py" in provenance, "Build 74 carried-forward contract was lost")

for path in (
    "public/js/shop.js",
    "public/js/storefront-search-collections.js",
    "scripts/release467_build75_storefront_search_collections_runtime_test.mjs",
):
    node_check(path)
node_runtime("scripts/release467_build75_storefront_search_collections_runtime_test.mjs")

if FAIL:
    print("RELEASE 467 BUILD 75 STOREFRONT SEARCH & COLLECTIONS: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 75 STOREFRONT SEARCH & COLLECTIONS: PASS")
print("Product authority: EXISTING /api/products REQUEST ONLY")
print("Category + availability + sort: IN-MEMORY PRESENTATION FACETS")
print("Colour / price / origin / proof filters: EXISTING PRODUCT FILTER AUTHORITY")
print("Zero-result help: EXPLICIT + BOUNDED / NO SILENT BROADENING")
print("Collections / Collages: EXISTING STOREFRONT MERCHANDISING AUTHORITY")
print("Merchandising signals: DERIVED / ADVISORY / NO AUTO-WRITE")
print("Additional Product browser request added: NONE")
print("Runtime timer/polling behavior added: NONE")
print("D1 / R2 / provider mutation added: NONE")
print("Canonical D1 migration authority: 0001-0004 / UNCHANGED")
