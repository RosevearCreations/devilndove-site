#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 74 — Storefront Product Experience."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "98a4f37ece3e75b29f331bcf1198cb926bc29b69"
BASE_TREE = "caa6ad626182982cc431d18cc974ee6a9b00698d"


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
    req(result.returncode == 0, f"Build 74 runtime acceptance failed: {(result.stderr or result.stdout).strip()[-2200:]}")


doc = read("docs/operations/RELEASE_467_BUILD_74_STOREFRONT_PRODUCT_EXPERIENCE.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
page = read("shop/product/index.html")
client = read("public/js/storefront-product-experience.js")
product_detail = read("public/js/product-detail.js")
provenance = read("scripts/current_system_gate_provenance_gate.py")
runtime = read("scripts/release467_build74_storefront_product_experience_runtime_test.mjs")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 74 — Storefront Product Experience" in roadmap, "roadmap missing Build 74")
req("Build 75 — Storefront Search & Collections" in roadmap, "roadmap missing Build 75")
req("Release 467 Build 74" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 74 operating document identity drifted")
for token in (
    "buyer essentials",
    "No extra browser network request is introduced",
    "Availability remains fail-closed",
    "Main Product photography receives buyer-priority loading",
    "Related products remain proof-overlap recommendations",
    "one-H1 compliant",
    "bounded and one-shot",
    "No new D1 migration is required",
    "Build 75 — Storefront Search & Collections",
):
    req(token in doc, f"Build 74 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 74 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 74 must remain schema-neutral; unexpected canonical migration 0005 exists")

# Product template: one H1, existing Product-detail authority, Build 74 enhancement loaded after it.
req(len(re.findall(r"<h1\b", page, flags=re.I)) == 1, "Build 74 Product detail template must keep exactly one H1")
req('/public/js/product-detail.js?v=224' in page, "Build 74 must preserve the established Product-detail renderer")
req('/public/js/storefront-product-experience.js?v=74' in page, "Build 74 buyer-first enhancement is not loaded by the Product template")
req(page.index('/public/js/product-detail.js?v=224') < page.index('/public/js/storefront-product-experience.js?v=74'), "Build 74 enhancement must load after the established Product-detail renderer")
req('id="productPurchaseCard"' in page, "Build 74 Product purchase anchor is missing")
req('Availability and checkout rules are confirmed again before the order is completed.' in page, "Build 74 purchase copy must avoid stale checkout-coming-next language")
req('Checkout and payment options will be connected next.' not in page, "stale checkout-coming-next copy remains on Product detail")

# Browser authority is deterministic and adds no new network/provider/polling behavior.
for token in (
    "const BUILD = 74",
    "const CONTRACT = 'buyer-first-product-detail'",
    "availabilityFromFields",
    "shippingFromFields",
    "buildBuyerEssentialsSnapshot",
    "DDStorefrontProductExperience",
    "Buyer essentials",
    "At a glance",
    "Check availability",
    "fetchpriority",
    "loading",
    "decoding",
    "sizes",
    "build74-readable-description",
    "build74-related-products",
    "You may also like",
    "observer.disconnect()",
    "grid-template-columns:1fr",
    "no_extra_network_request: true",
    "automatic_purchase: false",
    "automatic_publication: false",
):
    req(token in client, f"Build 74 client missing token: {token}")

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
    r"\bINSERT\s+INTO\b",
    r"\bUPDATE\s+[A-Za-z_][A-Za-z0-9_]*\s+SET\b",
    r"\bDELETE\s+FROM\b",
    r"\bREPLACE\s+INTO\b",
    r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b",
):
    req(not re.search(forbidden, client, re.I), f"Build 74 buyer experience gained forbidden behavior: {forbidden}")

req(client.count('new MutationObserver') == 1, "Build 74 must use at most one bounded Product-render observer")
req("observer.observe(detail" in client and "observer.disconnect()" in client, "Build 74 Product observer must be scoped and disconnect")
req("document.getElementById('productDetail')" in client, "Build 74 observer/enhancer must remain Product-detail scoped")

# Existing Product detail remains the only data-fetch authority on the page.
req('/api/product-detail?slug=' in product_detail, "existing Product detail API authority is missing")
req(client.count('/api/') == 0, "Build 74 enhancement must not add another Product/browser API route")

# Runtime acceptance covers the buyer-facing fail-closed states and caps.
for token in (
    "positive listed inventory becomes buyer-facing availability",
    "zero listed inventory fails closed to out-of-stock",
    "explicit sold-out text fails closed to out-of-stock",
    "digital items do not pretend physical shipping or stock is required",
    "unknown inventory does not invent a stock promise",
    "buyer essentials caps attributes and trust points for scannability",
    "performs no automatic commerce or publication action",
):
    req(token in runtime, f"Build 74 runtime acceptance missing token: {token}")

req("release467_build74_gate.py" in provenance and "Release 467 Build 74" in provenance, "Current System Gate does not chain Build 74")
req("release467_build73_gate.py" in provenance, "Build 73 carried-forward contract was lost")

for path in (
    "public/js/storefront-product-experience.js",
    "scripts/release467_build74_storefront_product_experience_runtime_test.mjs",
):
    node_check(path)
node_runtime("scripts/release467_build74_storefront_product_experience_runtime_test.mjs")

if FAIL:
    print("RELEASE 467 BUILD 74 STOREFRONT PRODUCT EXPERIENCE: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 74 STOREFRONT PRODUCT EXPERIENCE: PASS")
print("Buyer essentials: AVAILABILITY + DELIVERY + PHOTOGRAPHY + RELATED CONTEXT")
print("Main Product photography: EAGER + HIGH PRIORITY + RESPONSIVE SIZES")
print("Gallery thumbnails: LAZY + LOW PRIORITY + RESPONSIVE RAIL")
print("Description / attributes / trust: SCANNABLE + BOUNDED")
print("Related Product query added: NONE")
print("Additional Product browser API request: NONE")
print("Automatic cart/order/payment/publication/provider action: NONE")
print("Runtime timer/polling behavior added: NONE")
print("Canonical D1 migration authority: 0001-0004 / UNCHANGED")
