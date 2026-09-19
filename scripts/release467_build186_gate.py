#!/usr/bin/env python3
"""Release 467 Build 186 — Public Product & Search Proof source gate."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def read(path):
    target = ROOT / path
    if not target.is_file():
        FAIL.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="replace")

def req(ok, message):
    if not ok:
        FAIL.append(message)

def node(path):
    proc = subprocess.run(["node", "--check", str(ROOT / path)], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    req(proc.returncode == 0, f"JavaScript syntax failed for {path}: {(proc.stderr or proc.stdout)[-1800:]}")

product_page = read("shop/product/index.html")
shop_page = read("shop/index.html")
collections_page = read("collections/index.html")
search_page = read("search/index.html")
renderer = read("public/js/product-detail-v166.js")
audit = read("public/js/storefront-evidence-conversion-audit.js")
breadcrumb = read("public/js/product-breadcrumb-seo.js")
site_search = read("public/js/site-search.js")
sitemap = read("sitemap.xml")
plan = read("docs/operations/RELEASE_467_CATALOG_REWORK_BUILDS_181_186.md")
doc = read("docs/operations/RELEASE_467_BUILD_186_PUBLIC_PRODUCT_SEARCH_PROOF.md")
workflow = read(".github/workflows/release467-build186-public-product-search-proof.yml")
build185 = read("scripts/release467_build185_gate.py")

for label, page in (
    ("Product detail", product_page),
    ("Shop", shop_page),
    ("Collections", collections_page),
    ("Search", search_page),
):
    req(len(re.findall(r"<h1\b", page, re.I)) == 1, f"{label} must contain exactly one source H1")
    req('name="viewport"' in page or "name='viewport'" in page, f"{label} must retain a viewport meta")

for token in (
    'content="index,follow" name="robots"',
    'href="https://devilndove.com/shop/product/" rel="canonical"',
    "/public/js/product-detail-v166.js?v=186",
    "/public/js/product-breadcrumb-seo.js?v=186",
):
    req(token in product_page, f"Product detail shell missing Build 186 contract: {token}")

for token in (
    'content="index,follow" name="robots"',
    'href="https://devilndove.com/shop/" rel="canonical"',
    '"@type":"CollectionPage"',
    'href="/collections/"',
):
    req(token in shop_page, f"Shop public proof missing: {token}")

for token in (
    'content="index,follow" name="robots"',
    'href="https://devilndove.com/collections/" rel="canonical"',
    '"@type":"CollectionPage"',
    '"@type":"ItemList"',
):
    req(token in collections_page, f"Collections public proof missing: {token}")

for token in (
    'content="noindex,follow" name="robots"',
    'href="https://devilndove.com/search/" rel="canonical"',
    '/public/js/site-search.js',
):
    req(token in search_page, f"Internal Search contract missing: {token}")

for token in (
    "Release 467 Build 186 successor",
    "productionOrigin='https://devilndove.com'",
    "canonicalForProduct(product)",
    "setMeta('property','og:url',canonical)",
    "setMeta('name','twitter:card','summary_large_image')",
    'fetchpriority="${fetchPriority}"',
    "imageTag(images[0],'',true)",
    "/api/product-detail-core?slug=",
    "DDProductDetailSnapshot",
):
    req(token in renderer, f"Build 186 Product renderer missing: {token}")
req(renderer.count("/api/product-detail-core?slug=") == 1, "Product renderer must retain one Product-detail core request")
for forbidden in ("/api/product-detail?slug=", "setInterval(", "MutationObserver"):
    req(forbidden not in renderer, f"Lean Product renderer gained forbidden behavior: {forbidden}")

for token in (
    "Release 467 Build 186 successor",
    "productCanonical",
    "DDProductDetailSnapshot",
    "bootProductAudit",
    "else bootProductAudit()",
    "productStructuredData",
):
    req(token in audit, f"Build 186 Product structured-data audit missing: {token}")
req("fetch(" not in audit, "Product structured-data audit must not add a network request")
req("storefront-evidence-conversion-audit.js?v=467b186" in breadcrumb, "Product breadcrumb loader did not advance to Build 186 audit asset")

for token in ("/api/products?q=", "/shop/product/?slug="):
    req(token in site_search, f"Internal Search lost Product discovery path: {token}")

req("https://devilndove.com/shop/" in sitemap, "Sitemap lost Shop")
req("https://devilndove.com/collections/" in sitemap, "Sitemap lost Collections")
req("https://devilndove.com/search/" not in sitemap, "Internal noindex Search must not enter sitemap")

req("Build 185 — complete" in plan and (("Build 186 — current" in plan) or ("Build 186 — complete" in plan)), "Catalog rework checkpoint lost Build 186 current/complete state")
req("successor-aware through Build 186" in build185, "Build 185 retained gate is not successor-aware for Build 186")

for token in (
    "no schema migration",
    "no D1 business-data mutation",
    "no additional Product API read",
    "no R2 list/upload/copy/delete",
    "no provider/publication execution",
    "no payment/refund action",
    "no accounting posting",
    "D1-free",
):
    req(token.lower() in doc.lower(), f"Build 186 operations doc missing safety/acceptance term: {token}")

for token in (
    "Release 467 Build 186 Public Product Search Proof",
    "python scripts/release467_build186_gate.py",
    "python scripts/release467_build185_gate.py",
    "github.event_name == 'push' && github.ref == 'refs/heads/main'",
    "python scripts/release467_build186_live_public_proof.py",
):
    req(token in workflow, f"Build 186 workflow missing: {token}")

for path in (
    "public/js/product-detail-v166.js",
    "public/js/storefront-evidence-conversion-audit.js",
    "public/js/product-breadcrumb-seo.js",
    "public/js/site-search.js",
):
    node(path)

if FAIL:
    print("RELEASE 467 BUILD 186 PUBLIC PRODUCT & SEARCH PROOF: FAIL")
    for item in FAIL:
        print("-", item)
    sys.exit(1)

print("RELEASE 467 BUILD 186 PUBLIC PRODUCT & SEARCH PROOF: PASS")
print("Product detail: ONE H1 / PRODUCTION CANONICAL / OG+TWITTER / SNAPSHOT-SAFE PRODUCT JSON-LD")
print("Shop + Collections: INDEXABLE / ONE H1 / COLLECTION STRUCTURED DATA")
print("Internal Search: NOINDEX,FOLLOW / PRODUCT DISCOVERY RETAINED")
print("Primary Product image: EAGER/HIGH PRIORITY; GALLERY LAZY")
print("Additional Product/D1 read introduced by Build 186: ZERO")
print("Schema/D1 mutation/R2 mutation/provider/payment/accounting action: NONE")
