#!/usr/bin/env python3
"""Release 452 repository hygiene, route, accessibility, and SEO-depth guardrails."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
FAILURES: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        FAILURES.append(message)


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8", errors="replace")


def public_route_exists(route: str) -> bool:
    parsed = urlparse(route)
    path = parsed.path
    if not path.startswith("/"):
        return True
    if path.startswith(("/api/", "/cdn-cgi/")):
        return True
    clean = path.lstrip("/")
    if not clean:
        return (ROOT / "index.html").exists()
    candidate = ROOT / clean
    if path.endswith("/"):
        return (candidate / "index.html").exists()
    return candidate.exists() or (ROOT / f"{clean}.html").exists() or (candidate / "index.html").exists()


# 1) Current-tree cleanup: Git history is the archive; one-off build verification SQL does not ship at root.
legacy_root = []
for path in ROOT.glob("BUILD*"):
    if not path.is_file():
        continue
    name = path.name
    if re.match(r"^BUILD\d+.*(?:D1|VERIFICATION).*\.sql$", name, re.I) or name.lower().endswith((".bak", ".old", ".tmp")):
        legacy_root.append(name)
require(not legacy_root, f"obsolete root Build verification artifacts remain: {legacy_root}")

# 2) Temporary/backup artifacts must not return outside intentionally ignored dependency metadata.
bad_suffixes = (".bak", ".old", ".tmp", ".orig", ".rej")
bad_files: list[str] = []
for path in ROOT.rglob("*"):
    if not path.is_file():
        continue
    rel = path.relative_to(ROOT)
    if any(part in {".git", "node_modules", ".wrangler", ".pytest_cache", "__pycache__"} for part in rel.parts):
        continue
    low = path.name.lower()
    if low.endswith(bad_suffixes) or path.name.endswith("~"):
        bad_files.append(str(rel))
require(not bad_files, f"backup/temp artifacts must not ship: {bad_files[:20]}")
require(not (ROOT / "tmp").exists(), "repository tmp/ directory must not ship")
require(not (ROOT / "docs" / "archive").exists(), "docs/archive must not ship; Git history is the archive")
require(not (ROOT / "docs" / "releases").exists(), "docs/releases must not ship; current release authority is development-release.json")

# 3) Current authority must agree everywhere.
release = json.loads(read("development-release.json"))
require(release.get("release") == 452, "repository hygiene gate requires current Release 452")
require(release.get("label") == "Application Streamlining & UX/SEO Depth", "Release 452 label drifted")
require(release.get("current_release_migrations") == [], "Release 452 must not invent a D1 migration")
require(release.get("development_infrastructure", {}).get("d1", {}).get("schema_current_through_release") == 450, "D1 schema authority must remain verified through Release 450")
for authority in ("AI_HANDOFF.md", "PROJECT_STATUS_AND_ROADMAP.md", "docs/operations/RELEASE_452_APPLICATION_STREAMLINING.md"):
    value = read(authority)
    require("Release 452" in value, f"{authority} must identify current Release 452")

# 4) Public Storefront routes: one H1, canonical/social metadata, structured data, image alt text.
public_pages = ("shop/index.html", "shop/product/index.html", "collections/index.html", "collages/index.html")
for page in public_pages:
    html = read(page)
    require(len(re.findall(r"<h1(?:\s|>)", html, re.I)) == 1, f"{page} must contain exactly one H1")
    require('rel="canonical"' in html or "rel='canonical'" in html, f"{page} missing canonical URL")
    require("og:title" in html and "og:description" in html and "og:url" in html, f"{page} missing Open Graph depth")
    require("twitter:card" in html, f"{page} missing Twitter card metadata")
    require("application/ld+json" in html, f"{page} missing JSON-LD")
    for tag in re.findall(r"<img\b[^>]*>", html, re.I):
        require(re.search(r"\balt\s*=", tag, re.I) is not None, f"{page} has image without alt text: {tag[:120]}")

shop = read("shop/index.html")
collections = read("collections/index.html")
collages = read("collages/index.html")
require('"@type":"CollectionPage"' in shop, "Shop must retain CollectionPage structured data")
require('"@type":"CollectionPage"' in collections, "Collections must retain CollectionPage structured data")
require('"@type":"CollectionPage"' in collages, "Collages must retain CollectionPage structured data")

product = read("shop/product/index.html")
require('aria-label="Breadcrumb"' in product, "Product page requires a visible accessible breadcrumb")
require('id="productBreadcrumbLabel"' in product and 'aria-current="page"' in product, "Product breadcrumb current-page label missing")
require('/public/js/product-breadcrumb-seo.js?v=452' in product, "Product breadcrumb JSON-LD authority is not loaded")
product_js = read("public/js/product-detail.js")
require(bool(re.search(r"['\"]@type['\"]\s*:\s*['\"]Product['\"]", product_js)), "existing dynamic Product JSON-LD authority missing")
require("offers" in product_js and "Offer" in product_js, "Product Offer structured-data authority missing")
breadcrumb_js = read("public/js/product-breadcrumb-seo.js")
for marker in ("BreadcrumbList", "ListItem", "productBreadcrumbLabel", "link[rel=\"canonical\"]", "MutationObserver"):
    require(marker in breadcrumb_js, f"Product breadcrumb authority missing {marker!r}")
require("fetch(" not in breadcrumb_js, "Product breadcrumb authority must remain local/read-only")

# 5) Sitemap must expose principal public discovery routes and never admin/API routes.
sitemap = read("sitemap.xml")
for route in ("/shop/", "/shop/product/", "/collections/", "/collages/"):
    require(f"https://devilndove.com{route}" in sitemap, f"sitemap missing {route}")
require("/admin/" not in sitemap and "/api/" not in sitemap, "sitemap must never expose admin/API routes")

# 6) Conservative dead-route check for local navigation on the four principal Storefront pages.
for page in public_pages:
    html = read(page)
    for href in re.findall(r"\bhref=[\"']([^\"']+)[\"']", html, re.I):
        if href.startswith(("#", "mailto:", "tel:", "javascript:", "http://", "https://")):
            continue
        require(public_route_exists(href), f"{page} references missing local route {href!r}")

# 7) Representative module workspaces must be private, responsive, and announce dynamic status.
admin_requirements = {
    "admin/inventory-intelligence/index.html": ("noindex,nofollow", "@media(max-width:720px)", "aria-live=\"polite\""),
    "admin/tool-lifecycle/index.html": ("noindex,nofollow", "@media(max-width:800px)", "aria-live=\"polite\""),
    "admin/caip-content-handoff/index.html": ("noindex,nofollow", "@media(max-width:800px)", "aria-live=\"polite\""),
    "admin/accounting/index.html": ("noindex,nofollow", "aria-live=\"polite\""),
    "admin/marketplace-calibration/index.html": ("noindex,nofollow",),
}
for page, markers in admin_requirements.items():
    html = read(page)
    require(len(re.findall(r"<h1(?:\s|>)", html, re.I)) == 1, f"{page} must contain exactly one H1")
    for marker in markers:
        require(marker in html, f"{page} missing usability/privacy marker {marker!r}")

# 8) Wrangler stays account-agnostic and Production promotion remains closed.
wrangler = read("wrangler.toml")
require("account_id =" not in wrangler, "wrangler.toml must never pin account_id")
require(release.get("release_policy", {}).get("production_promotion") == "closed", "Production promotion must remain closed")
require(release.get("release_policy", {}).get("provider_publication") == "closed", "provider publication must remain closed")

print("REPOSITORY HYGIENE / UX / SEO GATE")
print("Obsolete root Build verification artifacts: NONE")
print("Backup/temp artifacts: NONE")
print("Storefront one-H1/canonical/social/JSON-LD: GUARDED")
print("Product BreadcrumbList + existing Product schema: GUARDED")
print("Sitemap principal discovery routes: GUARDED")
print("Representative Inventory/Tools/Financials/CAIP admin privacy + status UX: GUARDED")
print("Release 452 D1 migration: NONE REQUIRED")
print("Production/provider publication: CLOSED")
if FAILURES:
    for i, failure in enumerate(FAILURES, 1):
        print(f"{i:03d}. FAIL — {failure}")
    raise SystemExit(1)
print("REPOSITORY HYGIENE / UX / SEO GATE: PASS")
