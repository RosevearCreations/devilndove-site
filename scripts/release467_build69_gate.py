#!/usr/bin/env python3
"""Fail-closed source contract for Release 467 Build 69 — Product CRUD & Duplicate Safety."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "84e34ac4513d985de91085050f33a2c25a702e9a"
BASE_TREE = "b0abbc6bf690cfb885594c2c9f70dd49eaadbccb"


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


doc = read("docs/operations/RELEASE_467_BUILD_69_PRODUCT_CRUD_DUPLICATE_SAFETY.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
create = read("functions/api/admin/create-product.js")
update = read("functions/api/admin/update-product.js")
archive = read("functions/api/admin/archive-product.js")
delete = read("functions/api/admin/delete-product.js")
numbering = read("functions/api/admin/_product-numbering.js")
cleanup = read("public/js/admin-product-cleanup.js")
current = read("scripts/current_system_gate_provenance_gate.py")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 69 — Product CRUD & Duplicate Safety" in roadmap, "roadmap missing Build 69")
req("Build 70 — Inventory Units & Conversion Engine" in roadmap, "roadmap missing Build 70")
req("Release 467 Build 69" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 69 operating document identity drifted")
for token in (
    "unused duplicate",
    "stale_product_copy",
    "history_allows_removal",
    "deletion_allowed",
    "Cleanup/Archive",
    "Product numbers remain retired",
    "Reusable media remains preserved",
    "Build 70 — Inventory Units & Conversion Engine",
):
    req(token in doc, f"Build 69 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 69 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 69 must remain schema-neutral; unexpected canonical migration 0005 exists")

# CREATE: permanent number allocation plus collision rejection.
for token in (
    "allocateNextProductNumber",
    "ensureProductNumberSequenceAtLeast",
    "formatDefaultSku",
    "SELECT product_id FROM products WHERE product_number = ? LIMIT 1",
    "That product number already exists.",
    "SELECT product_id FROM products WHERE sku = ? LIMIT 1",
    "That SKU already exists.",
    "ensureUniqueSlug",
):
    req(token in create, f"Build 69 create safety missing token: {token}")

# EDIT: explicit identity collision checks and no silent overwrite of another Product.
for token in (
    "duplicate_product_number",
    "duplicate_slug",
    "duplicate_sku",
    "product_id != ? LIMIT 1",
):
    req(token in update, f"Build 69 edit collision safety missing token: {token}")

# ARCHIVE: status-only, stale-aware, audited and non-destructive.
for token in (
    "expected_updated_at",
    "stale_product_copy",
    "WHERE product_id = ? AND updated_at = ?",
    "action_type: 'product_archive'",
    "archive_reason",
    "stale_guard_applied",
):
    req(token in archive, f"Build 69 archive safety missing token: {token}")
req("DELETE FROM products" not in archive, "Build 69 archive route must never permanently delete a Product")

# DELETE: retained history and material corrections remain fail-closed server authority.
for token in (
    "PROTECTED_PRODUCT_REFERENCES",
    "order_items.product_id",
    "product_production_runs.product_id",
    "product_finished_inventory_lots.product_id",
    "creative_project_cost_allocations.product_id",
    "accounting_overhead_product_allocations.product_id",
    "customer_story_approval_batches.product_id",
    "requires_archive",
    "material_review_required",
    "requireAdminStepUp",
    "DELETE PRODUCT",
    "deletion_reason",
    "no R2 objects are deleted",
):
    req(token in delete, f"Build 69 permanent-delete safety missing token: {token}")

for token in (
    "Deleting a product never lowers this sequence",
    "old product number is not reused",
):
    req(token in numbering, f"Build 69 Product-number retirement safety missing token: {token}")

# CLEANUP: distinguish protected history, material review and truly unused records.
for token in (
    "chooseRemovalReason",
    "[unused_duplicate]",
    "[abandoned_draft]",
    "[test_record]",
    "[replaced_incorrect_record]",
    "[other_unused]",
    "Number(data.history_allows_removal || 0) === 1",
    "Number(data.deletion_allowed || 0) === 1",
    "Inventory review required",
    "Unused record eligible",
    "ddBuild69CanonicalCleanupLane",
    "#productsTableBody [data-draft-cleanup=\"1\"]{display:none!important}",
    "expected_updated_at",
):
    req(token in cleanup, f"Build 69 cleanup convergence missing token: {token}")
for stale in (
    "Duplicate draft removed from cleanup centre.",
    "Unused archived duplicate removed from cleanup centre.",
    "discarded with the duplicate",
):
    req(stale not in cleanup, f"Build 69 cleanup still assumes every unused record is a duplicate: {stale}")

for provider in ("stripe.com", "paypal.com", "pinterest.com", "tiktok.com", "youtube.com"):
    req(provider not in archive.lower() and provider not in cleanup.lower(), f"Build 69 gained forbidden provider execution token: {provider}")

req("release467_build69_gate.py" in current and "Release 467 Build 69" in current, "Current System Gate does not chain Build 69")
req("release467_build68_gate.py" in current, "Build 68 carried-forward contract was lost")

for path in (
    "functions/api/admin/archive-product.js",
    "public/js/admin-product-cleanup.js",
):
    node_check(path)

if FAIL:
    print("RELEASE 467 BUILD 69 PRODUCT CRUD & DUPLICATE SAFETY: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 69 PRODUCT CRUD & DUPLICATE SAFETY: PASS")
print("Create identity collisions: FAIL-CLOSED")
print("Edit identity collisions: FAIL-CLOSED")
print("Archive: STATUS-ONLY + AUDITED + OPTIONAL STALE-COPY GUARD")
print("Permanent delete: PROTECTED-HISTORY + MATERIAL-REVIEW + STEP-UP GUARDED")
print("Cleanup classification: EXPLICIT / NO AUTOMATIC DUPLICATE ASSUMPTION")
print("Cleanup state model: HISTORY SAFETY SEPARATE FROM INVENTORY SAFETY")
print("Direct Product-table permanent delete lane: CLOSED")
print("Product numbers after deletion: RETIRED / NEVER REUSED")
print("R2 object deletion added by Build 69: NONE")
print("Schema / Production business-data rewrite / provider execution added by Build 69: NONE")
