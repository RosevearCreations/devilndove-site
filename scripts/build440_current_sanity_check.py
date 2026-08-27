#!/usr/bin/env python3
"""Current local sanity authority for the Build 440 Development release.

This is source-only. It never contacts Cloudflare, D1, R2, payment, email or
other providers and it never mutates business data. Historical preflight
artifacts remain historical; this runner uses the current release contracts.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable


COMMAND_CHECKS = [
    ("release_alignment", [PYTHON, "scripts/build440_development_release_alignment_test.py"]),
    ("release_contract", [PYTHON, "scripts/build440_release_contract_integrity_test.py"]),
    ("cross_mutation_responsive", [PYTHON, "scripts/build440_cross_mutation_responsive_acceptance_test.py"]),
    ("predeploy_static", [PYTHON, "scripts/predeploy_sanity_check.py"]),
    ("asset_references", [PYTHON, "scripts/build246_asset_reference_audit.py"]),
    ("build439_source", [PYTHON, "scripts/build439_source_gate.py"]),
]

FULL_COMMAND_CHECKS = [
    ("build440_source_gate", [PYTHON, "scripts/build440_product_inventory_tools_source_gate.py"]),
]

SCHEMA_TOKENS = [
    "CREATE TABLE IF NOT EXISTS product_production_run_material_lots",
    "CREATE TABLE IF NOT EXISTS product_finished_inventory_lots",
    "CREATE TABLE IF NOT EXISTS inventory_item_identifiers",
    "CREATE TABLE IF NOT EXISTS inventory_item_sources",
    "CREATE TABLE IF NOT EXISTS inventory_receiving_claims",
    "CREATE TABLE IF NOT EXISTS inventory_receiving_reversals",
    "CREATE TABLE IF NOT EXISTS site_tool_lifecycle_profiles",
    "CREATE TABLE IF NOT EXISTS site_tool_lifecycle_events",
    "build440_product_inventory_lot_provenance",
    "build440_product_inventory_lot_provenance_hardening",
    "build440_inventory_receiving_source_provenance",
    "build440_inventory_receiving_reversal",
    "build440_tool_lifecycle_history",
]


def run(name: str, command: list[str]) -> dict:
    completed = subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    lines = completed.stdout.strip().splitlines()
    return {
        "name": name,
        "ok": completed.returncode == 0,
        "returncode": completed.returncode,
        "tail": lines[-12:],
    }


def source_checks() -> list[dict]:
    release = json.loads((ROOT / "development-release.json").read_text(encoding="utf-8"))
    schema = (ROOT / "database_full_schema.sql").read_text(encoding="utf-8")
    handoff = (ROOT / "AI_HANDOFF.md").read_text(encoding="utf-8")
    roadmap = (ROOT / "PROJECT_STATUS_AND_ROADMAP.md").read_text(encoding="utf-8")
    legacy_preflight = json.loads((ROOT / "data/site/deployment-preflight.json").read_text(encoding="utf-8"))

    missing_schema = [token for token in SCHEMA_TOKENS if token not in schema]
    return [
        {
            "name": "canonical_release_440",
            "ok": int(release.get("release", 0)) == 440,
            "detail": f"development-release.json release={release.get('release')}",
        },
        {
            "name": "aggregate_schema_build440",
            "ok": not missing_schema,
            "detail": "complete" if not missing_schema else "missing: " + ", ".join(missing_schema),
        },
        {
            "name": "canonical_document_pair",
            "ok": (
                "Development Build 440" in handoff
                and "Development Build 440" in roadmap
                and "Dev-project Production" in handoff
                and "Dev-project Production" in roadmap
            ),
            "detail": "AI_HANDOFF.md + PROJECT_STATUS_AND_ROADMAP.md",
        },
        {
            "name": "legacy_build246_preflight_classified",
            "ok": legacy_preflight.get("build_label") == "Build 246",
            "detail": "historical artifact only; not current release evidence",
        },
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--quick", action="store_true", help="Skip the full Build 440 source gate.")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    results = source_checks()
    commands = COMMAND_CHECKS + ([] if args.quick else FULL_COMMAND_CHECKS)
    results.extend(run(name, command) for name, command in commands)
    failed = [row for row in results if not row["ok"]]

    report = {
        "release": 440,
        "ok": not failed,
        "mode": "quick" if args.quick else "full",
        "cloudflare_d1_r2_provider_access": "none",
        "production_mutation_capability": "none",
        "checks": results,
    }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print("BUILD 440 CURRENT SANITY CHECK")
        print("Cloudflare/D1/R2/provider access: NONE")
        print("Production mutation capability: NONE")
        for row in results:
            detail = row.get("detail") or (" | ".join(row.get("tail", [])[-2:]))
            print(f"{'PASS' if row['ok'] else 'FAIL'} — {row['name']} — {detail}")
        print()
        print(
            f"BUILD 440 CURRENT SANITY CHECK: "
            f"{'PASS' if not failed else 'FAIL'} ({len(results) - len(failed)}/{len(results)})"
        )
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
