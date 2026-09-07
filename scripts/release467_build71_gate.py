#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 71 — Inventory Lifecycle."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "ead7dcbf565ab57a02c9982eabbbd9e759d3d1d1"
BASE_TREE = "445d640fcc5b51b80e425082eaf9962e1a0dabd0"


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
    req(result.returncode == 0, f"Build 71 runtime acceptance failed: {(result.stderr or result.stdout).strip()[-2200:]}")


doc = read("docs/operations/RELEASE_467_BUILD_71_INVENTORY_LIFECYCLE.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
lifecycle = read("functions/api/_lib/inventoryLifecycle.js")
wrapper = read("functions/api/admin/site-item-inventory.js")
legacy = read("functions/api/admin/_siteItemInventoryLegacy.js")
conversion = read("functions/api/_lib/inventoryUnitConversion.js")
receiving = read("functions/api/_lib/inventoryReceiving.js")
current = read("scripts/current_system_gate_provenance_gate.py")
runtime = read("scripts/release467_build71_inventory_lifecycle_runtime_test.mjs")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 71 — Inventory Lifecycle" in roadmap, "roadmap missing Build 71")
req("Build 72 — Inventory / Reorder Economics" in roadmap, "roadmap missing Build 72")
req("Release 467 Build 71" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 71 operating document identity drifted")
for token in (
    "receiving → storage → reservation → Product/project use → release/return → write-off → reorder request",
    "Reservation release is fail-closed",
    "Reserved stock cannot be consumed or written off",
    "Product resource reservations are atomic",
    "Reorder request is a planning signal, not incoming stock",
    "journal_posted` is always false",
    "No new D1 migration is required",
    "Build 72 — Inventory / Reorder Economics",
):
    req(token in doc, f"Build 71 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 71 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 71 must remain schema-neutral; unexpected canonical migration 0005 exists")

# Shared lifecycle service owns generic quantity transitions and reuses Build 70 use arithmetic.
for token in (
    "INVENTORY_LIFECYCLE_BUILD = 71",
    "INVENTORY_LIFECYCLE_CONTRACT = 'inventory-lifecycle'",
    "ITEM_LIFECYCLE_ACTIONS",
    "'receive'",
    "'reserve'",
    "'release'",
    "'consume_usage'",
    "'return_stock'",
    "'write_off'",
    "'reorder_request'",
    "planInventoryUsage({ ...row, ...state }, qty)",
    "inventory_lifecycle_insufficient_available_for_reservation",
    "inventory_lifecycle_release_exceeds_reserved",
    "inventory_lifecycle_writeoff_exceeds_available",
    "inventory_lifecycle_reason_required",
    "inventory_lifecycle_do_not_reorder",
    "journal_posted: false",
    "requested_reorder_quantity",
    "newIncoming = state.incoming_quantity",
    "newIncoming = roundInventoryQuantity(state.incoming_quantity - appliedAgainstIncoming)",
    "await db.batch(statements)",
    "inventory_lifecycle_atomic_commit_failed",
    "inventory_lifecycle_product_reservation_atomic_failed",
):
    req(token in lifecycle, f"Build 71 lifecycle authority missing token: {token}")

# Reorder request must not mutate incoming quantity anywhere in its planning branch.
reorder_block = lifecycle[lifecycle.find("case 'reorder_request':"):lifecycle.find("default:", lifecycle.find("case 'reorder_request':"))]
req("newIncoming =" not in reorder_block, "Build 71 reorder request must not create incoming stock")
req("is_on_reorder_list=CASE WHEN ?='reorder_request' THEN 1" in lifecycle, "Build 71 reorder request must still mark planning state")

# Generic write-off/return need explicit reason and accounting context, never hidden journal posting.
for token in (
    "['return_stock', 'write_off'].includes(action) && reason.length < 8",
    "finance_review_required: ['receive', 'return_stock', 'write_off'].includes(action) ? 1 : 0",
    "Accounting context ${plan.accounting.accounting_direction}",
    "movementType = 'correction'",
):
    req(token in lifecycle, f"Build 71 return/write-off accounting safety missing token: {token}")

# Product reservations must preflight all links and batch mutations after validation.
for token in (
    "applyProductResourceReservationLifecycle",
    "product_resource_links",
    "inventory_lifecycle_product_resource_missing_inventory",
    "inventory_lifecycle_product_reservation_insufficient",
    "inventory_lifecycle_product_release_exceeds_reserved",
    "const statements = []",
    "plans.filter((row) => !row.skipped_reservation)",
):
    req(token in lifecycle, f"Build 71 Product reservation convergence missing token: {token}")

# Current endpoint must intercept lifecycle mutations before delegating to the legacy compatibility implementation.
for token in (
    "from '../_lib/inventoryLifecycle.js'",
    "const LIFECYCLE_ACTIONS = new Set(ITEM_LIFECYCLE_ACTIONS)",
    "if (LIFECYCLE_ACTIONS.has(action))",
    "applyInventoryLifecycleAction",
    "applyProductResourceReservationLifecycle",
    "action === 'reserve_product_resources' || action === 'release_product_resources'",
    "inventory_lifecycle_authority: INVENTORY_LIFECYCLE_CONTRACT",
    "syncInventoryBaseBalance",
    "syncInventoryBaseBalances",
):
    req(token in wrapper, f"Build 71 endpoint interception missing token: {token}")
first_lifecycle = wrapper.find("if (LIFECYCLE_ACTIONS.has(action))")
legacy_post = wrapper.find("legacy.onRequestPost(context)")
req(first_lifecycle >= 0 and legacy_post > first_lifecycle, "Build 71 lifecycle interception must occur before legacy POST delegation")

# Build 70 remains the conversion authority and specialist receiving remains intact.
for token in ("planInventoryUsage", "availableQuantity = Math.max(0, previousOnHand - reservedQuantity)"):
    req(token in conversion, f"Build 70 conversion prerequisite missing: {token}")
for token in ("inventory_receiving_claims", "inventory_purchase_lots", "receive_key", "quantity_received"):
    req(token in receiving, f"Build 71 regressed specialist receiving prerequisite: {token}")
req("case 'reorder_request':" in legacy, "legacy compatibility implementation unexpectedly removed; Build 71 should intercept rather than erase history")

# Runtime acceptance must cover lifecycle invariants.
for token in (
    "planInventoryLifecycleAction(supply, 'reserve', 3",
    "inventory_lifecycle_insufficient_available_for_reservation",
    "inventory_lifecycle_release_exceeds_reserved",
    "planInventoryLifecycleAction(supply, 'consume_usage', 500",
    "inventory_usage_increment_misaligned",
    "planInventoryLifecycleAction(supply, 'return_stock'",
    "planInventoryLifecycleAction(supply, 'write_off'",
    "reorder.new_incoming_quantity, 4",
    "inventory_lifecycle_do_not_reorder",
    "source_type: 'product'",
):
    req(token in runtime, f"Build 71 runtime acceptance missing token: {token}")

# No new provider, network, polling or runtime DDL behavior belongs in this lifecycle service.
for forbidden in (
    r"\bfetch\s*\(",
    r"\bXMLHttpRequest\b",
    r"\bsetInterval\s*\(",
    r"\bsetTimeout\s*\(",
    r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b",
    r"stripe\.com",
    r"paypal\.com",
    r"pinterest\.com",
    r"tiktok\.com",
    r"youtube\.com",
):
    req(not re.search(forbidden, lifecycle, re.I), f"Build 71 lifecycle authority gained forbidden runtime behavior: {forbidden}")

req("release467_build71_gate.py" in current and "Release 467 Build 71" in current, "Current System Gate does not chain Build 71")
req("release467_build70_gate.py" in current, "Build 70 carried-forward contract was lost")

for path in (
    "functions/api/_lib/inventoryLifecycle.js",
    "functions/api/admin/site-item-inventory.js",
    "scripts/release467_build71_inventory_lifecycle_runtime_test.mjs",
):
    node_check(path)
node_runtime("scripts/release467_build71_inventory_lifecycle_runtime_test.mjs")

if FAIL:
    print("RELEASE 467 BUILD 71 INVENTORY LIFECYCLE: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 71 INVENTORY LIFECYCLE: PASS")
print("Generic lifecycle authority: CONVERGED")
print("Reservations / releases: AVAILABLE-ONLY + FAIL-CLOSED")
print("Product resource reservation set: PREVALIDATED + ATOMIC")
print("Usage: BUILD 70 PACKAGE/BASE AUTHORITY REUSED")
print("Return / write-off: EXPLICIT + AUDITED + FINANCE CONTEXT")
print("Reorder request: PLANNING SIGNAL / INCOMING UNCHANGED")
print("Accounting journals posted by Build 71: NONE")
print("Runtime DDL / provider / R2 / polling behavior added: NONE")
print("Canonical D1 migration authority: 0001-0004 / UNCHANGED")
