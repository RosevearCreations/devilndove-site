#!/usr/bin/env python3
"""Build 455: deterministic, offline cross-module Maker journey source acceptance.

This tests synthetic source contracts and never asserts a real owner/customer/carrier/provider event.
No network, production database, R2, supplier, order, or provider mutation is performed.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

CONTRACTS = {
    "canada_checkout": ("node", "--test", "scripts/release467_build437_storefront_safety.test.mjs"),
    "etsy_draft_boundary": ("node", "--test", "scripts/test_product_etsy_draft_438.mjs"),
    "digital_revisions": ("python", "scripts/release467_build444_design_files_sql_regression.py"),
    "material_usage": ("python", "scripts/release467_build445_bom_sql_regression.py"),
    "resumable_traveler": ("python", "scripts/release467_build446_traveler_sql_regression.py"),
    "quality_salvage": ("python", "scripts/release467_build447_quality_sql_regression.py"),
    "shared_tool_safety": ("python", "scripts/release467_build448_shared_tools_sql_regression.py"),
    "honest_costing": ("python", "scripts/release467_build449_costs_sql_regression.py"),
    "single_sale_and_kits": ("python", "scripts/release467_build450_finished_pieces_sql_regression.py"),
    "private_media_rights": ("python", "scripts/release467_build452_maker_media_sql_regression.py"),
    "commission_completion": ("python", "scripts/release467_build453_commission_completion_sql_regression.py"),
    "canadian_fulfillment": ("python", "scripts/release467_build454_fulfillment_sql_regression.py"),
}

# Every scenario points to actual executable source contracts. These are synthetic
# regression journeys, NOT live physical/operator acceptance or one single D1 transaction.
JOURNEYS = {
    "jewellery_metal": ("digital_revisions", "material_usage", "resumable_traveler", "quality_salvage", "shared_tool_safety", "honest_costing", "single_sale_and_kits"),
    "resin_clay_mixed_media": ("material_usage", "resumable_traveler", "quality_salvage", "honest_costing", "private_media_rights"),
    "digital_fabrication": ("digital_revisions", "resumable_traveler", "quality_salvage", "private_media_rights"),
    "failed_attempt_and_salvage": ("material_usage", "quality_salvage", "honest_costing", "private_media_rights"),
    "private_therapeutic_project": ("quality_salvage", "honest_costing", "private_media_rights"),
    "custom_commission": ("commission_completion", "canadian_fulfillment", "single_sale_and_kits", "honest_costing"),
    "public_checkout_safety": ("canada_checkout", "etsy_draft_boundary", "single_sale_and_kits", "canadian_fulfillment"),
}

SOURCE_OWNERS = {
    "creative_project": "functions/api/admin/creative-process.js",
    "design": "functions/api/admin/project-design-files.js",
    "inventory": "functions/api/admin/project-bom.js",
    "traveler": "functions/api/admin/guided-manufacturing.js",
    "quality": "functions/api/admin/finished-quality.js",
    "cost": "functions/api/admin/project-costs.js",
    "pieces": "functions/api/admin/finished-pieces.js",
    "media": "functions/api/admin/maker-media-stories.js",
    "commission": "functions/api/admin/commission-completion.js",
    "order": "functions/api/admin/maker-fulfillment-evidence.js",
}

OWNER_ACCEPTANCE_HOLDS = (
    "Etsy: actual connected-shop unpublished draft identity and Canada-only shipping profile require authenticated owner acceptance.",
    "Meta Marketplace: unsupported/unauthorized direct publication remains MANUAL/HOLD; no live listing claim.",
    "Shop-floor journeys: real jewellery/metal, resin/clay, fabrication, failure/salvage and private work need original operator and safety evidence.",
    "Commission: genuine customer's proof/paid amount, actual physical handoff and delivery or pickup acceptance need owner review.",
    "Regulated goods: category-specific Canadian labels/safety/legal clearance remains manual; synthetic QA is not certification.",
    "D1/Workers/R2: live request cost, latency, media permission and quota headroom require provider metrics, not fixture inference.",
)

def require(condition: bool, problem: str) -> None:
    if not condition:
        raise AssertionError(problem)

def main() -> int:
    manifest = json.loads((ROOT / "migrations/canonical/manifest.json").read_text())
    migrations = manifest.get("migrations", [])
    require(len(migrations) >= 49, "Expected Build 454's canonical migration 0049 or later forward migrations")
    require(migrations[48]["file"] == "0049_release467_fulfillment_aftercare.sql", "Canonical order evidence source drift")
    for owner, path in SOURCE_OWNERS.items():
        require((ROOT / path).is_file(), f"Missing canonical {owner} API: {path}")
    ui = (ROOT / "admin/order-fulfillment-care/index.html").read_text()
    require("makerFulfillmentEvidenceMount" in ui, "On-demand Build 454 fulfillment/help mount missing")
    acceptance = (ROOT / "docs/operations/RELEASE_467_BUILD_455_MAKER_JOURNEY_ACCEPTANCE.md").read_text()
    require("OWNER ACCEPTANCE HOLD" in acceptance and "SOURCE CONTRACT" in acceptance, "Owner/source gates must not be conflated")
    require(set(JOURNEYS) >= {"jewellery_metal", "resin_clay_mixed_media", "digital_fabrication", "failed_attempt_and_salvage", "private_therapeutic_project", "custom_commission"}, "Required journeys missing")

    results = {}
    for label, command in CONTRACTS.items():
        run = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=45, check=False)
        passed = run.returncode == 0
        results[label] = {"source": command[-1], "result": "PASS" if passed else "FAIL"}
        print(f"{label}: {'PASS' if passed else 'FAIL'} — {command[-1]}")
        if not passed:
            print((run.stdout + run.stderr)[-1500:], file=sys.stderr)

    journeys = {}
    for name, contracts in JOURNEYS.items():
        passed = all(results[key]["result"] == "PASS" for key in contracts)
        journeys[name] = {"source_contracts": list(contracts), "synthetic_source_acceptance": "PASS" if passed else "FAIL", "physical_or_provider_acceptance": "HOLD"}
        print(f"JOURNEY {name}: {'SOURCE PASS' if passed else 'FAIL'} / OWNER ACCEPTANCE HOLD")

    report = {"build": 455, "scope": "offline source-linked synthetic regression, no external writes", "canonical_migrations": len(migrations), "contracts": results, "journeys": journeys, "external_acceptance": "HOLD", "owner_holds": OWNER_ACCEPTANCE_HOLDS, "production_deployment": "REQUIRES_INDEPENDENT_EXACT_SHA_PROOF"}
    if "--json" in sys.argv:
        print(json.dumps(report, indent=2))
    if any(v["result"] != "PASS" for v in results.values()) or any(v["synthetic_source_acceptance"] != "PASS" for v in journeys.values()):
        print("BUILD455_MAKER_SOURCE_ACCEPTANCE=FAIL; no Production GREEN claim")
        return 1
    print("BUILD455_MAKER_SOURCE_ACCEPTANCE=GREEN; independent real-owner/provider acceptance remains HOLD")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (AssertionError, subprocess.TimeoutExpired) as error:
        print(f"BUILD455_MAKER_SOURCE_ACCEPTANCE=FAIL: {error}", file=sys.stderr)
        sys.exit(1)
