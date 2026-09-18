#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 74 — Storefront Product Experience.

Build 166 is an accepted successor for the Product detail delivery layer. The historical buyer-first
helper remains tested as provenance, while the live Product page may use the bounded Build 166 renderer.
"""
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
    result = subprocess.run(["node", "--check", str(ROOT / path)], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-1800:]}")


def node_runtime(path: str) -> None:
    result = subprocess.run(["node", str(ROOT / path)], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.stdout.strip(): print(result.stdout.strip())
    req(result.returncode == 0, f"Build 74 runtime acceptance failed: {(result.stderr or result.stdout).strip()[-2200:]}")


doc = read("docs/operations/RELEASE_467_BUILD_74_STOREFRONT_PRODUCT_EXPERIENCE.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
page = read("shop/product/index.html")
client = read("public/js/storefront-product-experience.js")
legacy_product_detail = read("public/js/product-detail.js")
product_detail_v166 = read("public/js/product-detail-v166.js") if (ROOT / "public/js/product-detail-v166.js").is_file() else ""
provenance = read("scripts/current_system_gate_provenance_gate.py")
runtime = read("scripts/release467_build74_storefront_product_experience_runtime_test.mjs")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 74 — Storefront Product Experience" in roadmap, "roadmap missing Build 74")
req("Build 75 — Storefront Search & Collections" in roadmap, "roadmap missing Build 75")
req("Release 467 Build 74" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 74 operating document identity drifted")
for token in ("buyer essentials","No extra browser network request is introduced","Availability remains fail-closed","Main Product photography receives buyer-priority loading","Related products remain proof-overlap recommendations","one-H1 compliant","bounded and one-shot","No new D1 migration is required","Build 75 — Storefront Search & Collections"):
    req(token in doc, f"Build 74 operating document missing token: {token}")

expected = ["0001_release464_migration_authority.sql","0002_release464_operational_acceptance.sql","0003_release464_business_growth.sql","0004_release465_storefront_quality.sql"]
req([row.get("file") for row in manifest.get("migrations", [])][:len(expected)] == expected, "Build 74 must preserve historical canonical D1 migration baseline")

req(len(re.findall(r"<h1\b", page, flags=re.I)) == 1, "Build 74 Product detail template must keep exactly one H1")
successor_v166 = any(token in page for token in ('/public/js/product-detail-v166.js?v=166','/public/js/product-detail-v166.js?v=179','/public/js/product-detail-v166.js?v=180'))
if successor_v166:
    req('/public/js/product-detail.js?v=224' not in page, "Build 166 successor must not double-load the legacy Product renderer")
    req('/public/js/storefront-product-experience.js?v=74' not in page, "Build 166 successor must not double-enhance the bounded Product renderer")
    for token in ('AbortController','/api/product-detail-core','8000','publicMediaUrl'):
        req(token in product_detail_v166, f"Build 166 Product detail successor missing: {token}")
else:
    req('/public/js/product-detail.js?v=224' in page, "Build 74 must preserve the established Product-detail renderer")
    req('/public/js/storefront-product-experience.js?v=74' in page, "Build 74 buyer-first enhancement is not loaded by the Product template")
    req(page.index('/public/js/product-detail.js?v=224') < page.index('/public/js/storefront-product-experience.js?v=74'), "Build 74 enhancement must load after the established Product-detail renderer")
req('id="productPurchaseCard"' in page, "Build 74 Product purchase anchor is missing")
req('Availability and checkout rules are confirmed again before the order is completed.' in page, "Build 74 purchase copy must avoid stale checkout-coming-next language")
req('Checkout and payment options will be connected next.' not in page, "stale checkout-coming-next copy remains on Product detail")

# Historical buyer-first helper remains deterministic provenance and adds no provider/polling behavior.
for token in ("const BUILD = 74","const CONTRACT = 'buyer-first-product-detail'","availabilityFromFields","shippingFromFields","buildBuyerEssentialsSnapshot","DDStorefrontProductExperience","Buyer essentials","At a glance","Check availability","fetchpriority","loading","decoding","sizes","build74-readable-description","build74-related-products","You may also like","observer.disconnect()","grid-template-columns:1fr","no_extra_network_request: true","automatic_purchase: false","automatic_publication: false"):
    req(token in client, f"Build 74 client missing token: {token}")
for forbidden in (r"\bfetch\s*\(",r"\bXMLHttpRequest\b",r"\bsetInterval\s*\(",r"\bsetTimeout\s*\(",r"\bnavigator\.sendBeacon\b",r"stripe\.com",r"paypal\.com",r"pinterest\.com",r"instagram\.com",r"\bINSERT\s+INTO\b",r"\bUPDATE\s+[A-Za-z_][A-Za-z0-9_]*\s+SET\b",r"\bDELETE\s+FROM\b",r"\bREPLACE\s+INTO\b",r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b"):
    req(not re.search(forbidden, client, re.I), f"Build 74 buyer experience gained forbidden behavior: {forbidden}")
req(client.count('new MutationObserver') == 1, "Build 74 historical helper must use at most one bounded Product-render observer")
req("observer.observe(detail" in client and "observer.disconnect()" in client, "Build 74 historical Product observer must be scoped and disconnect")

if successor_v166:
    req('/api/product-detail-core' in product_detail_v166, "Build 166 bounded Product detail API authority is missing")
    req('setInterval(' not in product_detail_v166 and 'MutationObserver' not in product_detail_v166, "Build 166 Product renderer must remain non-polling and observer-free")
else:
    req('/api/product-detail?slug=' in legacy_product_detail, "existing Product detail API authority is missing")
req(client.count('/api/') == 0, "Build 74 helper must not add another Product/browser API route")

for token in ("positive listed inventory becomes buyer-facing availability","zero listed inventory fails closed to out-of-stock","explicit sold-out text fails closed to out-of-stock","digital items do not pretend physical shipping or stock is required","unknown inventory does not invent a stock promise","buyer essentials caps attributes and trust points for scannability","performs no automatic commerce or publication action"):
    req(token in runtime, f"Build 74 runtime acceptance missing token: {token}")
req("release467_build74_gate.py" in provenance and "Release 467 Build 74" in provenance, "Current System Gate does not chain Build 74")
req("release467_build73_gate.py" in provenance, "Build 73 carried-forward contract was lost")

node_check("public/js/storefront-product-experience.js")
node_check("scripts/release467_build74_storefront_product_experience_runtime_test.mjs")
if successor_v166: node_check("public/js/product-detail-v166.js")
node_runtime("scripts/release467_build74_storefront_product_experience_runtime_test.mjs")

if FAIL:
    print("RELEASE 467 BUILD 74 STOREFRONT PRODUCT EXPERIENCE: FAIL")
    for item in FAIL: print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 74 STOREFRONT PRODUCT EXPERIENCE: PASS")
print("Product detail delivery:", "BUILD166_BOUNDED_SUCCESSOR" if successor_v166 else "HISTORICAL_BUILD74")
print("Buyer essentials historical helper: PRESERVED + TESTED")
print("Automatic cart/order/payment/publication/provider action: NONE")
print("Historical canonical D1 baseline: 0001-0004 / PRESERVED; later forward migrations permitted")
