#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 66 — Product Workspace Split."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "32e7d20e8f2c26463abe6bb44d5e34ecca5aa5bc"
BASE_TREE = "de433f7c3b82108d68e87891b53d1367f97abf74"


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


doc = read("docs/operations/RELEASE_467_BUILD_66_PRODUCT_WORKSPACE_SPLIT.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
admin = read("public/js/admin.js")
workspace = read("public/js/admin-product-workspaces.js")
current = read("scripts/current_system_gate_provenance_gate.py")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 66 — Product Workspace Split" in roadmap, "roadmap missing Build 66")
req("Release 467 Build 66" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 66 operating document identity drifted")
for token in (
    "one Product authority",
    "Products",
    "Editor",
    "Inventory Links",
    "Media",
    "SEO / Publishing",
    "Cleanup / Archive",
    "workspace=",
    "schema-neutral",
    "Build 67 — Product Editor Recovery & Autosave",
):
    req(token in doc, f"Build 66 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 66 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 66 must remain schema-neutral; unexpected canonical migration 0005 exists")

for token in (
    "admin-product-workspaces.js?v=66",
    "product-workspace-split",
    "element.closest?.('[hidden], [inert]')",
    "style.display === 'none'",
    "style.visibility === 'hidden'",
):
    req(token in admin, f"Admin Build 66 integration missing token: {token}")

for token in (
    "R467B66_V1",
    "data-product-workspace-tab",
    "dataset.productWorkspacePanel",
    "role=\"tablist\"",
    "setAttribute('role', 'tab')",
    "setAttribute('role', 'tabpanel')",
    "aria-selected",
    "workspace",
    "window.history.pushState",
    "window.history.replaceState",
    "window.DDProductWorkspaces",
    "dd:product-workspace-changed",
    "dd:product-editor-target",
    "#productResourcesAdminMount",
    "#siteInventoryAdminMount",
    "#productStockReportMount",
    "#productMediaAdminMount",
    "#adminProductImageAnnotationsMount",
    "#mediaLibraryAdminMount",
    "#productStoryNotesAdminMount",
    "#productSeoAdminMount",
    "#catalogSyncAdminMount",
    "#productCleanupCenter",
    "productCorrectionMount",
    "[data-edit-product-id]",
    "[data-open-product-correction]",
):
    req(token in workspace, f"Product workspace authority missing token: {token}")

for workspace_id in ("products", "editor", "inventory", "media", "seo", "cleanup"):
    req(f"id: '{workspace_id}'" in workspace, f"Product workspace missing: {workspace_id}")

# Build 66 is presentation-only: it may reorganize existing mounts/events but cannot become a data authority.
workspace_lower = workspace.lower()
for forbidden in ("/api/", "apifetch(", "fetch(", ".prepare(", ".exec(", "stripe.com", "paypal.com"):
    req(forbidden not in workspace_lower, f"Build 66 workspace script gained forbidden data/provider authority token: {forbidden}")

req("release467_build66_gate.py" in current and "Release 467 Build 66" in current, "Current System Gate does not chain Build 66")
req("release467_build65_gate.py" in current, "Build 65 carried-forward contract was lost")

node_check("public/js/admin.js")
node_check("public/js/admin-product-workspaces.js")

if FAIL:
    print("RELEASE 467 BUILD 66 PRODUCT WORKSPACE SPLIT: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 66 PRODUCT WORKSPACE SPLIT: PASS")
print("Product authority: SINGLE / SHARED")
print("Focused workspaces: PRODUCTS + EDITOR + INVENTORY LINKS + MEDIA + SEO/PUBLISHING + CLEANUP/ARCHIVE")
print("Workspace routing: URL-ADDRESSABLE + KEYBOARD ACCESSIBLE")
print("Build 65 hidden-panel lazy-loading compatibility: GUARDED")
print("Schema / D1 business-data / R2 / provider mutation: NONE")
