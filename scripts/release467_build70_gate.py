#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 70 — Inventory Units & Conversion Engine."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "2b5eaa8b668b678796e7fc36aa3ead28a56a5aad"
BASE_TREE = "a784bf7b8a762df2aac3be3eca30fcd24410921e"


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
    req(result.returncode == 0, f"JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()[-1600:]}")


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
    req(result.returncode == 0, f"Build 70 runtime acceptance failed: {(result.stderr or result.stdout).strip()[-2000:]}")


doc = read("docs/operations/RELEASE_467_BUILD_70_INVENTORY_UNITS_CONVERSION_ENGINE.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
engine = read("functions/api/_lib/inventoryUnitConversion.js")
post = read("functions/api/_lib/inventoryPostService.js")
kit = read("functions/api/_lib/inventoryKitService.js")
base = read("functions/api/admin/_inventoryBaseAuthority.js")
usability = read("public/js/admin-inventory-base-unit-usability.js")
current = read("scripts/current_system_gate_provenance_gate.py")
runtime = read("scripts/release467_build70_inventory_unit_runtime_test.mjs")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 70 — Inventory Units & Conversion Engine" in roadmap, "roadmap missing Build 70")
req("Build 71 — Inventory Lifecycle" in roadmap, "roadmap missing Build 71")
req("Release 467 Build 70" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 70 operating document identity drifted")
for token in (
    "Reserved stock is not consumable stock",
    "minimum usage increment",
    "Reusable Tools never disappear",
    "Kit template `quantity_per_kit` remains a purchase/stock quantity",
    "No new D1 migration is required",
    "Build 71 — Inventory Lifecycle",
):
    req(token in doc, f"Build 70 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 70 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 70 must remain schema-neutral; unexpected canonical migration 0005 exists")

# Shared pure engine is the one arithmetic contract.
for token in (
    "INVENTORY_QUANTITY_EPSILON",
    "InventoryUnitError",
    "normalizeInventoryUnitLabel",
    "normalizeInventoryTrackingMode",
    "normalizeUsageIncrement",
    "normalizeUnitsPerPurchase",
    "purchaseToBase",
    "baseToPurchase",
    "isUsageIncrementAligned",
    "planInventoryUsage",
    "inventory_usage_increment_misaligned",
    "inventory_usage_insufficient_available",
    "inventory_usage_tool_do_not_reuse",
    "availableQuantity = Math.max(0, previousOnHand - reservedQuantity)",
    "['log_only', 'reusable'].includes(trackingMode)",
):
    req(token in engine, f"Build 70 shared conversion engine missing token: {token}")

for alias in ("['kg', 'kilogram']", "['g', 'gram']", "['ml', 'millilitre']", "['lb', 'pound']"):
    req(alias in engine, f"Build 70 unit alias normalization missing token: {alias}")

for forbidden in (
    r"\bfetch\s*\(",
    r"\bXMLHttpRequest\b",
    r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b",
    r"\bdb\.prepare\s*\(",
    r"\bsetInterval\s*\(",
):
    req(not re.search(forbidden, engine, re.I), f"Build 70 pure conversion engine gained forbidden runtime behavior: {forbidden}")

# Creative posting uses shared arithmetic and protects reservations at plan and commit time.
for token in (
    "from './inventoryUnitConversion.js'",
    "planInventoryUsage(item, usageQuantity)",
    "COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment",
    "inventory_post_increment_misaligned",
    "inventory_post_insufficient_available",
    "ABS(COALESCE(i.reserved_quantity,0)-?)<?",
    "COALESCE(i.on_hand_quantity,0)-COALESCE(i.reserved_quantity,0) >= ?-?",
    "availableStockQuantity: plan.available_quantity",
    "allocatedCostCents: plan.allocated_cost_cents",
):
    req(token in post, f"Build 70 Creative Inventory posting hardening missing token: {token}")
req("usageQuantity / perStock" not in post, "Build 70 Inventory posting still owns ad-hoc package/base depletion arithmetic")

# Purchased kits use the same planner while preserving their older API safety contract.
for token in (
    "from './inventoryUnitConversion.js'",
    "planInventoryUsage({...row,usage_tracking_mode:mode},quantity)",
    "inventory_kit_component_increment_misaligned",
    "inventory_kit_component_insufficient_available",
    "inventory_kit_component_do_not_reuse",
    "quantity_per_kit is deliberately a purchase/stock quantity",
    "await db.batch(statements)",
    "loadMaterialLotPlan",
):
    req(token in kit, f"Build 70 Kit conversion convergence missing token: {token}")

# Release 461 read authority now shares unit/factor normalization without changing schema ownership.
for token in (
    "from '../_lib/inventoryUnitConversion.js'",
    "normalizeInventoryUnitLabel",
    "normalizeUnitsPerPurchase",
    "purchaseToBase",
    "site_inventory_base_balances",
    "quantity_authority: 'base'",
):
    req(token in base, f"Build 70 base-balance convergence missing token: {token}")
req(not re.search(r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b", base, re.I), "Build 70 base authority must not add runtime DDL")

# Existing desktop usability remains intact; Build 70 must not regress the established labels.
for token in (
    "On hand (purchase units)",
    "Purchase / package unit",
    "Usable / base unit",
    "Usable units per purchase unit",
    "Usable available",
    "Prevent this presentation overlay from observing its own DOM writes.",
):
    req(token in usability, f"Build 70 regressed Release 461 Inventory usability token: {token}")

# Runtime acceptance must cover the high-value conversion cases.
for token in (
    "planInventoryUsage(grams, 250)",
    "inventory_usage_increment_misaligned",
    "inventory_usage_insufficient_available",
    "tracking_mode, 'reusable'",
    "stock_quantity, 0",
    "source_type: 'product'",
    "do_not_reuse: 1",
):
    req(token in runtime, f"Build 70 runtime acceptance missing token: {token}")

req("release467_build70_gate.py" in current and "Release 467 Build 70" in current, "Current System Gate does not chain Build 70")
req("release467_build69_gate.py" in current, "Build 69 carried-forward contract was lost")

for path in (
    "functions/api/_lib/inventoryUnitConversion.js",
    "functions/api/_lib/inventoryPostService.js",
    "functions/api/_lib/inventoryKitService.js",
    "functions/api/admin/_inventoryBaseAuthority.js",
    "scripts/release467_build70_inventory_unit_runtime_test.mjs",
):
    node_check(path)
node_runtime("scripts/release467_build70_inventory_unit_runtime_test.mjs")

if FAIL:
    print("RELEASE 467 BUILD 70 INVENTORY UNITS & CONVERSION ENGINE: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 70 INVENTORY UNITS & CONVERSION ENGINE: PASS")
print("Package/base conversion: SHARED PURE ENGINE")
print("Partial consumption: MINIMUM + INCREMENT-ALIGNED")
print("Reserved stock: EXCLUDED + COMMIT-RACE GUARDED")
print("Reusable Tools / log-only materials: USAGE LOGGED / STOCK UNCHANGED")
print("Exact / estimated consumables: BASE USE -> PACKAGE DEPLETION")
print("Purchased-kit component use: SHARED CONVERSION AUTHORITY")
print("Release 461 base balance: NORMALIZATION CONVERGED")
print("Runtime DDL / provider / R2 / polling behavior added: NONE")
print("Canonical D1 migration authority: 0001-0004 / UNCHANGED")
