#!/usr/bin/env python3
"""Release 467 Build 186 — read-only live public Product/Search proof."""
from __future__ import annotations

import argparse
import re
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urljoin

MARKER = "Release 467 Build 186 successor"
UA = "DevilDove-Release467-Build186/1.0"

def fetch(url: str, timeout: int = 25) -> tuple[int, str, str]:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/javascript,*/*;q=0.5"}, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read(2_000_000).decode("utf-8", errors="replace")
            return int(response.status), body, response.geturl()
    except urllib.error.HTTPError as exc:
        return int(exc.code), exc.read(500_000).decode("utf-8", errors="replace"), exc.geturl()

def require(ok: bool, message: str, failures: list[str]) -> None:
    if not ok:
        failures.append(message)

def h1_count(html: str) -> int:
    return len(re.findall(r"<h1\b", html, flags=re.I))

def meta_robots(html: str) -> str:
    match = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']+)["\']', html, flags=re.I)
    if not match:
        match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']robots["\']', html, flags=re.I)
    return (match.group(1) if match else "").lower().replace(" ", "")

def canonical(html: str) -> str:
    match = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', html, flags=re.I)
    if not match:
        match = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', html, flags=re.I)
    return match.group(1) if match else ""

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="https://devilndove.com/")
    parser.add_argument("--attempts", type=int, default=36)
    parser.add_argument("--delay-seconds", type=float, default=10.0)
    args = parser.parse_args()

    base = args.base_url.rstrip("/") + "/"
    failures: list[str] = []

    renderer_url = urljoin(base, "public/js/product-detail-v166.js?v=186")
    renderer = ""
    renderer_status = 0
    for attempt in range(max(1, args.attempts)):
        renderer_status, renderer, _ = fetch(renderer_url)
        if renderer_status == 200 and MARKER in renderer:
            break
        if attempt + 1 < max(1, args.attempts):
            time.sleep(max(0.0, args.delay_seconds))

    require(renderer_status == 200, f"Product renderer HTTP status is {renderer_status}", failures)
    require(MARKER in renderer, "Production Product renderer has not reached Build 186", failures)
    for token in (
        "productionOrigin='https://devilndove.com'",
        "canonicalForProduct(product)",
        "setMeta('property','og:url',canonical)",
        "setMeta('name','twitter:card','summary_large_image')",
        "fetchpriority=\"${fetchPriority}\"",
        "imageTag(images[0],'',true)",
        "/api/product-detail-core?slug=",
        "DDProductDetailSnapshot",
    ):
        require(token in renderer, f"Production Product renderer missing: {token}", failures)
    require("/api/product-detail?slug=" not in renderer, "Retired duplicate Product-detail read returned", failures)
    require("setInterval(" not in renderer and "MutationObserver" not in renderer, "Lean Product renderer gained polling/observer behavior", failures)

    audit_status, audit, _ = fetch(urljoin(base, "public/js/storefront-evidence-conversion-audit.js?v=467b186"))
    require(audit_status == 200, f"Product SEO audit asset HTTP status is {audit_status}", failures)
    for token in (
        "Release 467 Build 186 successor",
        "productCanonical",
        "DDProductDetailSnapshot",
        "bootProductAudit",
        "productStructuredData",
        "else bootProductAudit()",
    ):
        require(token in audit, f"Production Product SEO audit missing: {token}", failures)
    require("fetch(" not in audit, "Product SEO audit must not add a network read", failures)

    crumb_status, crumb, _ = fetch(urljoin(base, "public/js/product-breadcrumb-seo.js?v=186"))
    require(crumb_status == 200, f"Breadcrumb SEO asset HTTP status is {crumb_status}", failures)
    require("storefront-evidence-conversion-audit.js?v=467b186" in crumb, "Breadcrumb SEO asset does not load Build 186 audit", failures)

    pages = {
        "/shop/": ("index,follow", "https://devilndove.com/shop/"),
        "/collections/": ("index,follow", "https://devilndove.com/collections/"),
        "/search/": ("noindex,follow", "https://devilndove.com/search/"),
        "/shop/product/": ("index,follow", "https://devilndove.com/shop/product/"),
    }
    for path, (robots_expected, canonical_expected) in pages.items():
        status, html, _ = fetch(urljoin(base, path.lstrip("/")))
        require(status == 200, f"{path} HTTP status is {status}", failures)
        require(h1_count(html) == 1, f"{path} expected one H1, got {h1_count(html)}", failures)
        require(robots_expected in meta_robots(html), f"{path} robots mismatch: {meta_robots(html)!r}", failures)
        require(canonical(html) == canonical_expected, f"{path} canonical mismatch: {canonical(html)!r}", failures)
        require('name="viewport"' in html or "name='viewport'" in html, f"{path} missing viewport meta", failures)

    if failures:
        print("RELEASE 467 BUILD 186 LIVE PUBLIC PROOF: FAIL")
        for failure in failures:
            print("-", failure)
        return 1

    print("RELEASE 467 BUILD 186 LIVE PUBLIC PROOF: PASS")
    print("Production surfaces: SHOP + COLLECTIONS + SEARCH + PRODUCT DETAIL")
    print("Product metadata: PRODUCTION CANONICAL + OG/TWITTER + PRODUCT JSON-LD BOOTSTRAP")
    print("Product primary image: EAGER / HIGH PRIORITY; GALLERY: LAZY")
    print("D1 requests added by this proof: 0")
    print("Production mutation: 0")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
