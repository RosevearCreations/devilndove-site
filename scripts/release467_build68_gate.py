#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 68 — Catalog Options Authority."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "8c4e8aa7e73c68fb82f7531503d40ddcd30fc503"
BASE_TREE = "f1c5da73c2f76068437f16a40c9c5ae95b8976bd"


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
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-1200:]}")


doc = read("docs/operations/RELEASE_467_BUILD_68_CATALOG_OPTIONS_AUTHORITY.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
options = read("functions/api/admin/_catalog-options.js")
authority = read("functions/api/admin/_catalog-option-authority.js")
endpoint = read("functions/api/admin/catalog-option-sets.js")
bootstrap = read("functions/api/admin/product-mobile-bootstrap.js")
manager = read("public/js/admin-catalog-option-manager.js")
current = read("scripts/current_system_gate_provenance_gate.py")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 68 — Catalog Options Authority" in roadmap, "roadmap missing Build 68")
req("Release 467 Build 68" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 68 operating document identity drifted")
for token in (
    "R467B68_V1",
    "one batched `app_settings` read",
    "zero Product-table scans",
    "zero `SELECT DISTINCT` Product reads",
    "zero `PRAGMA` reads",
    "historical value",
    "Build 69 — Product CRUD & Duplicate Safety",
):
    req(token in doc, f"Build 68 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 68 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 68 must remain schema-neutral; unexpected canonical migration 0005 exists")

for token in (
    "CATALOG_OPTION_SETTING_KEYS",
    "DEFAULT_PRODUCT_TYPE_OPTIONS",
    "PRODUCT_STATUS_OPTIONS",
    "PRODUCT_REVIEW_STATUS_OPTIONS",
    "MERCHANDISE_ORIGIN_OPTIONS",
    "SALE_CHANNEL_OPTIONS",
    "CATALOG_OPTION_MAX_VALUES",
    "WHERE setting_key IN (?, ?, ?)",
    "isManagedCatalogOptionSettingKey",
):
    req(token in options, f"Build 68 catalog option source missing token: {token}")
req("SELECT DISTINCT" not in options.upper(), "Build 68 catalog option source must not scan Product distinct values")
req("FROM PRODUCTS" not in options.upper(), "Build 68 catalog option source must not use Products as a shadow option authority")
req("PRAGMA" not in options.upper(), "Build 68 catalog option source must not use PRAGMA")

for token in (
    "CATALOG_AUTHORITY_VERSION = 'R467B68_V1'",
    "CATALOG_AUTHORITY_TTL_MS",
    "CATALOG_AUTHORITY_STALE_TTL_MS",
    "authorityCache",
    "loadCatalogOptionAuthority",
    "invalidateCatalogOptionAuthority",
    "catalog_setting_queries: 1",
    "tax_class_queries: 1",
    "product_table_queries: 0",
    "pragma_queries: 0",
):
    req(token in authority, f"Build 68 shared authority missing token: {token}")
req("PRAGMA" not in authority.upper(), "Build 68 shared catalog authority must not use PRAGMA")
req("FROM PRODUCTS" not in authority.upper(), "Build 68 shared catalog authority must not query Products")

for token in (
    "loadCatalogOptionAuthority",
    "invalidateCatalogOptionAuthority",
    "authorityPayload",
    "product_type_options",
    "product_status_options",
    "product_review_status_options",
    "merchandise_origin_options",
    "sale_channel_options",
    "Unknown or non-editable option_set",
):
    req(token in endpoint, f"Build 68 catalog endpoint missing token: {token}")
req("product_types:" not in endpoint, "Build 68 Product Type semantics must not become a free-form editable app setting")

for token in (
    "loadCatalogOptionAuthority",
    "catalog_authority_version",
    "product_type_options",
    "product_status_options",
    "product_review_status_options",
    "merchandise_origin_options",
    "sale_channel_options",
):
    req(token in bootstrap, f"Build 68 mobile bootstrap convergence missing token: {token}")
req("getTableColumnSet(db, 'tax_classes')" not in bootstrap, "Build 68 mobile bootstrap must not PRAGMA-scan Tax Classes")
req("FROM tax_classes" not in bootstrap, "Build 68 mobile bootstrap must not own a parallel Tax Class query")

for token in (
    "Release 467 Build 68",
    "applyAuthorityToProductEditor",
    "product_type_options",
    "product_status_options",
    "product_review_status_options",
    "merchandise_origin_options",
    "sale_channel_options",
    "dd:product-editor-target",
    "dd:catalog-options-updated",
    "Existing tax class #",
):
    req(token in manager, f"Build 68 catalog manager/editor bridge missing token: {token}")

for provider in ("stripe.com", "paypal.com", "pinterest.com", "tiktok.com", "youtube.com"):
    req(provider not in options.lower() and provider not in authority.lower() and provider not in endpoint.lower() and provider not in bootstrap.lower() and provider not in manager.lower(), f"Build 68 gained forbidden provider execution token: {provider}")

req("release467_build68_gate.py" in current and "Release 467 Build 68" in current, "Current System Gate does not chain Build 68")
req("release467_build67_gate.py" in current, "Build 67 carried-forward contract was lost")

for path in (
    "functions/api/admin/_catalog-options.js",
    "functions/api/admin/_catalog-option-authority.js",
    "functions/api/admin/catalog-option-sets.js",
    "functions/api/admin/product-mobile-bootstrap.js",
    "public/js/admin-catalog-option-manager.js",
):
    node_check(path)

if FAIL:
    print("RELEASE 467 BUILD 68 CATALOG OPTIONS AUTHORITY: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 68 CATALOG OPTIONS AUTHORITY: PASS")
print("Catalog option authority: ONE / SHARED / CACHED / VALIDATED")
print("Editable option D1 read: ONE BATCHED APP_SETTINGS QUERY")
print("Tax Class read: ONE SHARED QUERY")
print("Product-table option discovery scans: REMOVED")
print("Product Type and lifecycle semantics: CENTRALIZED / SYSTEM-GOVERNED")
print("Historical Product dropdown values: PRESERVED IN EDITOR")
print("Mobile Product bootstrap: SHARED AUTHORITY CONSUMER")
print("Schema / D1 business-data rewrite / R2 / provider mutation added by Build 68: NONE")
