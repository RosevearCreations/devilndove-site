#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 72 — Inventory / Reorder Economics."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL: list[str] = []
BASE_SHA = "fb6d2b952003b5516f2caba1e297e82763603697"
BASE_TREE = "eb129e4ee7b9e70869361834b528c5ad5ebd371c"


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
    req(result.returncode == 0, f"Build 72 runtime acceptance failed: {(result.stderr or result.stdout).strip()[-2200:]}")


doc = read("docs/operations/RELEASE_467_BUILD_72_INVENTORY_REORDER_ECONOMICS.md")
roadmap = read("docs/operations/RELEASE_467_NEXT_25_BUILDS_62_86.md")
engine = read("functions/api/_lib/inventoryReorderEconomics.js")
endpoint = read("functions/api/admin/inventory-replenishment.js")
client = read("public/js/admin-inventory-replenishment.js")
budget = read("functions/api/_lib/d1ReadBudget.js")
lifecycle = read("functions/api/_lib/inventoryLifecycle.js")
conversion = read("functions/api/_lib/inventoryUnitConversion.js")
current = read("scripts/current_system_gate_provenance_gate.py")
runtime = read("scripts/release467_build72_inventory_reorder_economics_runtime_test.mjs")
manifest = json.loads(read("migrations/canonical/manifest.json"))

req("Build 72 — Inventory / Reorder Economics" in roadmap, "roadmap missing Build 72")
req("Build 73 — Product Media / Photo Studio Convergence" in roadmap, "roadmap missing Build 73")
req("Release 467 Build 72" in doc and BASE_SHA in doc and BASE_TREE in doc, "Build 72 operating document identity drifted")
for token in (
    "recommendation-only economics workspace",
    "30-day and 90-day use history",
    "Landed cost uses received-lot evidence",
    "Alternative suppliers are comparison-only",
    "Resource buildability is not a finished-Product promise",
    "Every added read is bounded",
    "No new D1 migration is required",
    "Build 73 — Product Media / Photo Studio Convergence",
):
    req(token in doc, f"Build 72 operating document missing token: {token}")

expected = [
    "0001_release464_migration_authority.sql",
    "0002_release464_operational_acceptance.sql",
    "0003_release464_business_growth.sql",
    "0004_release465_storefront_quality.sql",
]
req([row.get("file") for row in manifest.get("migrations", [])] == expected, "Build 72 must not alter canonical D1 migration authority")
req(not list((ROOT / "migrations/canonical").glob("0005*")), "Build 72 must remain schema-neutral; unexpected canonical migration 0005 exists")

# Pure recommendation engine: one explainable contract and no operational side effects.
for token in (
    "INVENTORY_REORDER_ECONOMICS_BUILD = 72",
    "INVENTORY_REORDER_ECONOMICS_CONTRACT = 'recommendation-only-reorder-economics'",
    "DEFAULT_STOCK_COVERAGE_TARGET_DAYS = 30",
    "compareSupplierEconomics",
    "resourceBuildableEconomics",
    "planInventoryReorderEconomics",
    "forecastDailyUsage = roundInventoryQuantity(Math.max(daily30, daily90))",
    "projected = roundInventoryQuantity(available + incoming)",
    "policyTarget",
    "recommended_reorder_quantity: recommended",
    "comparison_only: true",
    "automatic_purchase: false",
    "baseToPurchase",
    "purchaseToBase",
    "mode === 'story_only'",
    "['reusable', 'log_only'].includes(trackingMode)",
):
    req(token in engine, f"Build 72 economics engine missing token: {token}")
for forbidden in (
    r"\bfetch\s*\(", r"\bXMLHttpRequest\b", r"\bdb\.prepare\s*\(", r"\bsetInterval\s*\(",
    r"\bsetTimeout\s*\(", r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b",
    r"stripe\.com", r"paypal\.com", r"amazon\.(?:ca|com)", r"pinterest\.com",
):
    req(not re.search(forbidden, engine, re.I), f"Build 72 pure economics engine gained forbidden runtime behavior: {forbidden}")

# Existing lifecycle and conversion authorities must remain carried forward.
for token in ("INVENTORY_LIFECYCLE_BUILD = 71", "reorder request is a planning signal".replace(" ", "_")):
    if token.startswith("INVENTORY_"):
        req(token in lifecycle, f"Build 71 lifecycle prerequisite missing: {token}")
req("planInventoryUsage" in lifecycle and "newIncoming = state.incoming_quantity" in lifecycle, "Build 71 lifecycle reorder/incoming boundary regressed")
req("baseToPurchase" in conversion and "purchaseToBase" in conversion and "planInventoryUsage" in conversion, "Build 70 conversion prerequisite missing")

# Read-only projection upgrades the existing workspace; all added datasets are bounded.
for token in (
    "const BUILD = 72",
    "planInventoryReorderEconomics",
    "usageEconomicsFacts",
    "supplierLandedCostFacts",
    "productResourceEconomicsFacts",
    "LIMIT 500",
    "LIMIT 120",
    "LIMIT 40",
    "LIMIT 300",
    "LIMIT 800",
    "recommendation_only:true",
    "automatic_purchase:false",
    "automatic_purchase_order_creation:false",
    "automatic_purchase_order_submission:false",
    "automatic_inventory_adjustment:false",
    "provider_execution:false",
    "landed_cost_basis",
    "buildable_scope",
):
    req(token in endpoint, f"Build 72 read-only economics endpoint missing token: {token}")
req("export async function onRequestPost" not in endpoint, "Build 72 replenishment economics endpoint must remain GET/read-only")
req(not re.search(r"\b(?:INSERT|UPDATE|DELETE|REPLACE)\b", endpoint, re.I), "Build 72 replenishment projection must not gain D1 mutation SQL")
req(not re.search(r"\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER|VIEW)\b", endpoint, re.I), "Build 72 replenishment projection must not add runtime DDL")

# UI must expose the economics without implying automation.
for token in (
    "Inventory / Reorder Economics",
    "Reorder economics",
    "Supplier comparison:",
    "advisory only",
    "Build 72 is recommendation-only",
    "Estimated landed",
    "projected_coverage_days",
    "recommended_reorder_quantity",
    "current_lowest_resource_buildable_units",
    "projected_lowest_resource_buildable_units",
):
    req(token in client, f"Build 72 operator UI missing token: {token}")
req("/api/admin/inventory-replenishment" in client, "Build 72 UI lost replenishment endpoint")
req("method: 'POST'" not in client and 'method:"POST"' not in client, "Build 72 economics UI must not submit purchases/mutations")

# D1 budget declaration must match every new bounded dataset.
for token in (
    "D1_READ_BUDGET_VERSION = 'R467B72_V1'",
    "bounded_operator_projection",
    "usage_aggregate_items: 500",
    "supplier_landed_cost_groups: 300",
    "product_resource_links: 800",
    "operator-opened workspace",
):
    req(token in budget, f"Build 72 D1 read-budget authority missing token: {token}")

# Pure runtime acceptance covers the high-value economic rules.
for token in (
    "coverage demand can trigger reorder",
    "preferred reorder quantity acts as a minimum advisory order quantity",
    "supplier comparison surfaces a lower observed alternative without selecting it",
    "linked Product buildability uses Build 70 package/base conversion",
    "do-not-reorder blocks the advisory quantity",
    "reusable Tool usage does not constrain buildability",
    "end-of-lot links amortize required base quantity by lot size",
):
    req(token in runtime, f"Build 72 runtime acceptance missing token: {token}")

req("release467_build72_gate.py" in current and "Release 467 Build 72" in current, "Current System Gate does not chain Build 72")
req("release467_build71_gate.py" in current, "Build 71 carried-forward contract was lost")

for path in (
    "functions/api/_lib/inventoryReorderEconomics.js",
    "functions/api/admin/inventory-replenishment.js",
    "public/js/admin-inventory-replenishment.js",
    "functions/api/_lib/d1ReadBudget.js",
    "scripts/release467_build72_inventory_reorder_economics_runtime_test.mjs",
):
    node_check(path)
node_runtime("scripts/release467_build72_inventory_reorder_economics_runtime_test.mjs")

if FAIL:
    print("RELEASE 467 BUILD 72 INVENTORY / REORDER ECONOMICS: FAIL")
    for item in FAIL:
        print("-", item)
    raise SystemExit(1)

print("RELEASE 467 BUILD 72 INVENTORY / REORDER ECONOMICS: PASS")
print("Reorder quantity: RECOMMENDATION ONLY / EXPLAINABLE")
print("Stock coverage: 30D + 90D CONSUMPTION / RESERVED STOCK EXCLUDED")
print("Landed cost: RECEIVED LOT + SHIPPING + TAX / WEIGHTED")
print("Supplier alternatives: COMPARISON ONLY / NO AUTO-SELECTION")
print("Product economics: RESOURCE-LIMITED BUILDABILITY / BUILD 70 CONVERSION")
print("Automatic purchase / PO submission / supplier contact: NONE")
print("D1 mutation / runtime DDL / provider / R2 behavior added: NONE")
print("Canonical D1 migration authority: 0001-0004 / UNCHANGED")
