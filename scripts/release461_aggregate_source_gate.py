#!/usr/bin/env python3
"""Aggregate source-only authority for every Release 461 runtime-schema slice.

This gate deliberately performs no D1, provider, R2, Pages, or Production mutation.
Each focused gate remains authoritative for its own slice; this wrapper only makes
sure a Release 461 checkpoint cannot bypass a later focused source contract.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FOCUSED_GATES = (
    "release461_public_runtime_schema_gate.py",
    "release461_product_offer_schema_gate.py",
    "release461_member_runtime_schema_gate.py",
    "release461_public_telemetry_schema_gate.py",
    "release461_public_community_schema_gate.py",
    "release461_public_auth_schema_gate.py",
    "release461_custom_request_commerce_schema_gate.py",
    "release461_payment_webhook_schema_contract_gate.py",
    "release461_notification_runtime_schema_gate.py",
    "release461_content_automation_schema_gate.py",
    "release461_accounting_support_schema_gate.py",
    "release461_accounting_journal_schema_gate.py",
    "release461_accounting_close_workflow_schema_gate.py",
    "release461_accounting_overhead_provider_schema_gate.py",
)

missing = [name for name in FOCUSED_GATES if not (ROOT / "scripts" / name).is_file()]
if missing:
    raise SystemExit(f"Missing Release 461 focused source gate(s): {', '.join(missing)}")

for name in FOCUSED_GATES:
    print(f"\n=== RELEASE 461 FOCUSED GATE: {name} ===")
    subprocess.run(
        [sys.executable, str(ROOT / "scripts" / name)],
        cwd=ROOT,
        check=True,
    )

print("\nRELEASE 461 AGGREGATE SOURCE GATE: PASS")
print("D1 mutation: NONE")
print("Provider execution/authorization/publication: CLOSED")
print("Separate live Production mutation: NONE")
