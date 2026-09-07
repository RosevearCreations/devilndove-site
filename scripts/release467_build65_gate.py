#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 65 — Admin Page Lazy Loading."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "636402494045db3acb178041a71d4f4ce4182639"
BASE_TREE = "9c60862d8ec87dd191085a787bfd615adf275a98"


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


doc = read("docs/operations/RELEASE_467_BUILD_65_ADMIN_PAGE_LAZY_LOADING.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
admin = read("public/js/admin.js")
current = read("scripts/current_system_gate_provenance_gate.py")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 65 — Admin Page Lazy Loading" in roadmap, "roadmap missing Build 65")
req("Release 467 Build 65" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 65 operating document identity drifted")
for token in (
    "selector- and viewport-gated",
    "permanent unrelated MutationObservers",
    "core module authority remains eager",
    "schema-neutral",
    "Build 66 — Product Workspace Split",
):
    req(token in doc, f"Build 65 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 65 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 65 must remain schema-neutral; unexpected canonical migration 0005 exists")

for token in (
    "DD_ADMIN_LAZY_VERSION = 'R467B65_V1'",
    "ddImportOnce",
    "ddLazyImportWhenVisible",
    "IntersectionObserver",
    "rootMargin = '420px 0px'",
    "observeForMs = 20000",
    "window.DDAdminLazyLoading",
    "snapshot: ddAdminLazySnapshot",
    "selector: '.product-production-release'",
    "selector: '#createProductForm'",
    "selector: '#siteInventoryAdminMount'",
    "key: 'external-field-help'",
    "observeForMs: 30000",
    "admin-product-production-reversal.js?v=440",
    "admin-product-image-quality-editor-bridge-v56.js?v=56",
    "admin-inventory-base-unit-usability.js?v=461",
    "admin-external-help.js?v=461",
):
    req(token in admin, f"Admin lazy-loading authority missing token: {token}")

# Heavy optional modules must no longer be top-level unconditional imports.
for eager in (
    "\nvoid import('/public/js/admin-external-help.js?v=461')",
    "\nvoid import('/public/js/admin-inventory-base-unit-usability.js?v=461')",
    "\n    void import('/public/js/admin-product-production-reversal.js?v=440')",
    "\n    void import('/public/js/admin-product-image-quality-editor-bridge-v56.js?v=56')",
):
    req(eager not in admin, f"Optional admin module remains eagerly imported: {eager.strip()}")

products_block = admin.split("if (adminPage === 'products')", 1)[-1]
req("adminPage !== 'products'" in products_block, "Products inventory-usability exclusion was lost")

core_import = "void import('/public/js/core/dd-application-module-bootstrap.mjs?v=440')"
req(core_import in admin, "Core application-module bootstrap is missing")
req(admin.rfind(core_import) > admin.rfind("document.addEventListener('DOMContentLoaded'"), "Core authority placement changed unexpectedly")
req("permissions must be known before optional" in admin, "Core eager-authority rationale is missing")

req("window.setTimeout(() => cleanup()" in admin, "Lazy presence observer is not time-bounded")
req("presenceObserver?.disconnect()" in admin and "visibilityObserver?.disconnect()" in admin, "Lazy observers do not disconnect")
req("document.removeEventListener('focusin'" in admin and "document.removeEventListener('pointerdown'" in admin, "Lazy interaction listeners do not clean up")

req("release467_build65_gate.py" in current and "Release 467 Build 65" in current, "Current System Gate does not chain Build 65")
node_check("public/js/admin.js")

if FAIL:
    print("RELEASE 467 BUILD 65 ADMIN PAGE LAZY LOADING: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 65 ADMIN PAGE LAZY LOADING: PASS")
print("Optional admin systems: SELECTOR + VIEWPORT GATED")
print("Duplicate optional imports: COALESCED")
print("Unrelated persistent observers: AVOIDED UNTIL RELEVANT")
print("Core permission/module authority: EAGER BY DESIGN")
print("Schema / D1 business-data / R2 / provider mutation: NONE")
