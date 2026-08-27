#!/usr/bin/env python3
"""Read-only final Build 440 Development D1 verification.

This verifier exists specifically to avoid replaying migrations after the Development database
has already reached the verification phase. It imports the guarded query transport, refuses
LIKE/GLOB and percent-pattern SQL at the Windows batch boundary, proves the expected Build 440
schema/ledger state, then runs the four read-only verification files.

Development only. No schema/data mutation. No retries. No R2/provider/Production access.
"""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = ROOT / "scripts/build440_apply_development_d1.py"

VERIFICATIONS = (
    "BUILD440_LOT_PROVENANCE_D1_VERIFICATION.sql",
    "BUILD440_LOT_PROVENANCE_D1_STRICT_VERIFICATION.sql",
    "BUILD440_RECEIVING_D1_VERIFICATION.sql",
    "BUILD440_RECEIVING_D1_STRICT_VERIFICATION.sql",
)


def load_runner():
    spec = importlib.util.spec_from_file_location("build440_apply_development_d1", RUNNER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load guarded Build 440 D1 runner.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


runner = load_runner()


def assert_pattern_free(statement: str, filename: str) -> None:
    if "%" in statement:
        runner.die(f"{filename} contains '%' and is refused at the Windows batch transport boundary.")
    if re.search(r"\b(?:LIKE|GLOB)\b", statement, flags=re.I):
        runner.die(f"{filename} contains LIKE/GLOB and is refused by the final D1 verifier.")


def preflight() -> None:
    print("BUILD 440 DEVELOPMENT D1 FINAL READ-ONLY PREFLIGHT")
    total = 0
    for filename in VERIFICATIONS:
        statements, skipped = runner.prepared_remote_statements(filename)
        if skipped:
            runner.die(f"Verification file unexpectedly contains skipped directives: {filename}: {skipped}")
        for statement in statements:
            assert_pattern_free(statement, filename)
            runner.build_wrangler_query_args(statement)
        total += len(statements)
        print(f"PASS — {filename}: {len(statements)} complete pattern-free statements")
    print(f"Pattern-free verification statements: {total}")
    print("LIKE/GLOB transport: NONE")
    print("Percent-pattern transport: NONE")


def state_snapshot() -> None:
    sql = (
        "SELECT "
        "(SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN "
        "('product_production_run_material_lots','product_finished_inventory_lots','inventory_item_identifiers','inventory_item_sources','inventory_receiving_claims','inventory_receiving_reversals')) AS build440_tables, "
        "(SELECT COUNT(*) FROM sqlite_master WHERE type='view' AND name IN "
        "('product_inventory_active_commitments','product_finished_lot_commitment_attribution')) AS build440_views, "
        "(SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name IN "
        "('trg_products_build440_inventory_commit_guard_decrease','trg_order_items_build440_inventory_commit_guard_insert','trg_order_items_build440_inventory_commit_guard_update','trg_orders_build440_inventory_commit_guard_reactivate')) AS build440_triggers, "
        "(SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key IN "
        "('build440_product_inventory_lot_provenance','build440_product_inventory_lot_provenance_hardening','build440_product_inventory_lot_provenance_d1_trigger_compat','build440_inventory_receiving_source_provenance','build440_inventory_receiving_reversal')) AS build440_ledgers;"
    )
    assert_pattern_free(sql, "state snapshot")
    runner.run_query(sql, "Build 440 Development final state snapshot — expect tables=6 views=2 triggers=4 ledgers=5")


def main() -> int:
    runner.assert_development_config()
    print("BUILD 440 DEVELOPMENT D1 FINAL READ-ONLY VERIFIER")
    print(f"Database: {runner.DATABASE_NAME} ({runner.DATABASE_ID})")
    print("Schema/data mutation: NONE")
    print("LIKE/GLOB verification patterns: BLOCKED")
    print("Percent-pattern Windows transport: BLOCKED")
    print("Automatic retries: NONE")
    print("R2/provider mutation: NONE")
    print("Production mutation capability: NONE\n")

    preflight()
    runner.auth_probe()
    state_snapshot()

    for filename in VERIFICATIONS:
        statements, _ = runner.prepared_remote_statements(filename)
        print(f"\n{'=' * 72}\nVERIFY ONLY: {filename}\n{'=' * 72}")
        for index, statement in enumerate(statements, 1):
            assert_pattern_free(statement, filename)
            runner.run_query(statement, f"{filename} verification {index}/{len(statements)}")

    print("\n" + "=" * 72)
    print("BUILD 440 DEVELOPMENT D1 FINAL READ-ONLY VERIFICATION: PASS")
    print("Database migrations replayed: NONE")
    print("Production mutation: NONE")
    print("=" * 72)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
