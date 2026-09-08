#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 76 — SEO Technical Convergence."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "93442669be79851e7c5a9316b87d5f758f7026d4"
BASE_TREE = "547662c9d179b67a41541de850d5705baa90a522"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def req(ok: bool, msg: str) -> None:
    if not ok:
        FAIL.append(msg)


def run_python(path: str, label: str) -> None:
    result = subprocess.run(
        [sys.executable, str(ROOT / path)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.stdout.strip():
        print(result.stdout.strip())
    req(result.returncode == 0, f"{label} failed: {(result.stderr or result.stdout).strip()[-4000:]}")


doc = read("docs/operations/RELEASE_467_BUILD_76_SEO_TECHNICAL_CONVERGENCE.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
crawl = read("scripts/release467_build76_seo_technical_crawl.py")
provenance = read("scripts/current_system_gate_provenance_gate.py")
robots = read("robots.txt")
sitemap = read("sitemap.xml")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 76 — SEO Technical Convergence" in roadmap, "roadmap missing Build 76")
req("Build 77 — Canada-Only Commerce Rules" in roadmap, "roadmap missing Build 77")
req("Release 467 Build 76" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 76 operating document identity drifted")
for token in (
    "all checked-in public HTML routes",
    "exactly one source H1",
    "canonical",
    "sitemap",
    "Open Graph",
    "JSON-LD",
    "internal-link",
    "Build 77 — Canada-Only Commerce Rules",
):
    req(token in doc, f"Build 76 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 76 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 76 must remain schema-neutral; unexpected canonical migration 0005 exists")

for token in (
    "PRODUCTION_ORIGIN = \"https://devilndove.com\"",
    "DYNAMIC_TEMPLATE_ROUTES = {\"/shop/product/\"}",
    "exactly one source H1 required",
    "indexable route must explicitly declare index,follow",
    "canonical must be exactly",
    "missing og:site_name",
    "missing og:type",
    "missing og:title",
    "missing og:description",
    "missing og:url",
    "missing og:image",
    "missing twitter:card",
    "indexable route missing valid JSON-LD",
    "sitemap.xml missing indexable routes",
    "sitemap.xml includes noindex routes",
    "indexable sitemap routes without an inbound link",
    "robots.txt missing canonical sitemap declaration",
):
    req(token in crawl, f"Build 76 crawler missing enforcement token: {token}")

for forbidden in (
    "wrangler d1 execute",
    "INSERT INTO",
    "UPDATE products",
    "DELETE FROM",
    "setInterval(",
    "fetch(",
    "stripe.com",
    "paypal.com",
):
    req(forbidden not in crawl, f"Build 76 crawler gained forbidden runtime/mutation behavior: {forbidden}")

req("Sitemap: https://devilndove.com/sitemap.xml" in robots, "robots.txt lost canonical sitemap declaration")
req("https://devilndove.com/shop/" in sitemap and "https://devilndove.com/collections/" in sitemap, "principal discovery routes missing from sitemap")
req("release467_build76_gate.py" in provenance and "Release 467 Build 76" in provenance, "Current System Gate does not chain Build 76")
req("release467_build75_gate.py" in provenance, "Build 75 carried-forward contract was lost")

# Build 76 deliberately converges on top of both retained release-neutral SEO gates.
run_python("scripts/public_seo_gate.py", "release-neutral public SEO structure gate")
run_python("scripts/public_seo_depth_gate.py", "release-neutral public SEO depth gate")
run_python("scripts/release467_build15_public_seo_gate.py", "Build 15 full public SEO parity gate")
run_python("scripts/release467_build76_seo_technical_crawl.py", "Build 76 technical SEO crawl")

if FAIL:
    print("RELEASE 467 BUILD 76 SEO TECHNICAL CONVERGENCE: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 76 SEO TECHNICAL CONVERGENCE: PASS")
print("Public HTML crawl: ALL CHECKED-IN PUBLIC ROUTES")
print("H1 / title / description / robots: ENFORCED")
print("Canonical / sitemap parity: ENFORCED")
print("Open Graph / Twitter card: ENFORCED")
print("JSON-LD schema context: ENFORCED")
print("Internal-link coverage: ENFORCED")
print("Dynamic Product template: EXPLICIT SITEMAP EXCEPTION")
print("D1 / R2 / payment / provider mutation added: NONE")
print("Canonical D1 migration authority: 0001-0004 / UNCHANGED")
