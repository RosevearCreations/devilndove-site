#!/usr/bin/env python3
"""Resume Build 440 Development D1 after the known partial lot-provenance apply.

This is intentionally Development-only. It reuses the guarded query transport from
build440_apply_development_d1.py, replays idempotent non-trigger migration statements,
skips the D1-ambiguous legacy trigger DROP/CREATE statements, installs the final D1-safe
trigger compatibility migration, then applies receiving migrations and all strict checks.

No Production target exists. No automatic retry exists.
"""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = ROOT / "scripts/build440_apply_development_d1.py"

BASE = "database_build440_product_inventory_lot_provenance.sql"
HARDENING = "database_build440_product_inventory_lot_provenance_hardening.sql"
COMPAT = "database_build440_product_inventory_lot_provenance_d1_trigger_compat.sql"
RECEIVING = (
    "database_build440_inventory_receiving_source_provenance.sql",
    "database_build440_inventory_receiving_reversal.sql",
)
VERIFICATIONS = (
    "BUILD440_LOT_PROVENANCE_D1_VERIFICATION.sql",
    "BUILD440_LOT_PROVENANCE_D1_STRICT_VERIFICATION.sql",
    "BUILD440_RECEIVING_D1_VERIFICATION.sql",
    "BUILD440_RECEIVING_D1_STRICT_VERIFICATION.sql",
)

TRIGGER_NAMES = {
    "trg_products_build440_inventory_commit_guard_decrease",
    "trg_order_items_build440_inventory_commit_guard_insert",
    "trg_order_items_build440_inventory_commit_guard_update",
    "trg_orders_build440_inventory_commit_guard_reactivate",
}

SMOKE_TABLE = "build440_d1_trigger_compat_smoke"
SMOKE_TRIGGER = "trg_build440_d1_trigger_compat_smoke"


def load_runner():
    spec = importlib.util.spec_from_file_location("build440_apply_development_d1", RUNNER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load guarded Build 440 D1 runner.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


runner = load_runner()


def trigger_name_from_statement(statement: str) -> str | None:
    compact = re.sub(r"\s+", " ", statement).strip()
    match = re.match(
        r"^(?:DROP\s+TRIGGER\s+IF\s+EXISTS|CREATE\s+TRIGGER)\s+([A-Za-z0-9_]+)\b",
        compact,
        flags=re.I,
    )
    return match.group(1) if match else None


def is_superseded_trigger_statement(statement: str) -> bool:
    name = trigger_name_from_statement(statement)
    return bool(name and name in TRIGGER_NAMES)


def preflight_resume() -> None:
    print("\nBUILD 440 DEVELOPMENT D1 PARTIAL-APPLY RESUME PREFLIGHT")
    total_exec = 0
    total_skip = 0
    for filename in (BASE, HARDENING, COMPAT, *RECEIVING, *VERIFICATIONS):
        statements, skipped = runner.prepared_remote_statements(filename)
        superseded = 0
        if filename in (BASE, HARDENING):
            superseded = sum(1 for statement in statements if is_superseded_trigger_statement(statement))
        executable = len(statements) - superseded
        total_exec += executable
        total_skip += len(skipped) + superseded
        print(
            f"PASS — {filename}: {executable} executable remote statements, "
            f"{len(skipped)} session skips, {superseded} superseded trigger statements"
        )

    compat_statements, _ = runner.prepared_remote_statements(COMPAT)
    compat_trigger_sql = [s for s in compat_statements if trigger_name_from_statement(s) in TRIGGER_NAMES]
    create_compat = [s for s in compat_trigger_sql if re.match(r"^CREATE\s+TRIGGER\b", s, flags=re.I)]
    if len(create_compat) != 4:
        runner.die(f"D1 trigger compatibility migration must create exactly four final triggers; found {len(create_compat)}.")
    if any(re.search(r"\bSELECT\s+CASE\b", s, flags=re.I) for s in create_compat):
        runner.die("D1 trigger compatibility migration still contains SELECT CASE inside CREATE TRIGGER.")
    if any("\n" in s or "\r" in s for s in compat_statements):
        runner.die("Compatibility migration transport is not single-line normalized.")

    print(f"Remote statements that will execute: {total_exec}")
    print(f"Deliberately skipped/superseded statements: {total_skip}")
    print("Legacy CASE/END trigger transport: BYPASSED")
    print("Final trigger authority: D1 COMPATIBILITY MIGRATION")


def trigger_compat_transport_smoke() -> None:
    """Prove D1 accepts the exact SELECT RAISE(...) WHERE form used by final triggers."""
    print("\nBUILD 440 DEVELOPMENT D1 RAISE-WHERE TRIGGER TRANSPORT SMOKE")
    cleanup_trigger = f"DROP TRIGGER IF EXISTS {SMOKE_TRIGGER};"
    cleanup_table = f"DROP TABLE IF EXISTS {SMOKE_TABLE};"
    create_table = f"CREATE TABLE {SMOKE_TABLE}(id INTEGER PRIMARY KEY);"
    create_trigger = (
        f"CREATE TRIGGER {SMOKE_TRIGGER} BEFORE INSERT ON {SMOKE_TABLE} "
        "BEGIN SELECT RAISE(ABORT,'build440_trigger_compat_smoke_block') WHERE NEW.id < 0; END;"
    )
    insert_row = f"INSERT INTO {SMOKE_TABLE}(id) VALUES(1);"
    verify = (
        f"SELECT CASE WHEN (SELECT COUNT(*) FROM {SMOKE_TABLE})=1 "
        "THEN 'PASS' ELSE 'FAIL' END AS build440_trigger_compat_transport_smoke;"
    )
    runner.run_query(cleanup_trigger, "trigger compat smoke cleanup trigger")
    runner.run_query(cleanup_table, "trigger compat smoke cleanup table")
    runner.run_query(create_table, "trigger compat smoke CREATE TABLE")
    runner.run_query(create_trigger, "trigger compat smoke CREATE RAISE-WHERE TRIGGER")
    runner.run_query(insert_row, "trigger compat smoke safe insert")
    runner.run_query(verify, "trigger compat smoke verification")
    runner.run_query(cleanup_trigger, "trigger compat smoke final trigger cleanup")
    runner.run_query(cleanup_table, "trigger compat smoke final table cleanup")
    print("BUILD 440 DEVELOPMENT D1 RAISE-WHERE TRIGGER TRANSPORT: PASS")


def apply_file(filename: str, *, skip_superseded_triggers: bool = False, read_only: bool = False) -> None:
    statements, skipped = runner.prepared_remote_statements(filename)
    executable = []
    superseded = []
    for statement in statements:
        if skip_superseded_triggers and is_superseded_trigger_statement(statement):
            superseded.append(trigger_name_from_statement(statement) or "unknown")
        else:
            executable.append(statement)

    mode = "VERIFY" if read_only else "RESUME APPLY"
    print(
        f"\n{'=' * 72}\n{mode}: {filename} "
        f"({len(executable)} execute; {len(skipped)} session skips; {len(superseded)} superseded trigger skips)\n{'=' * 72}"
    )
    for index, statement in enumerate(executable, 1):
        runner.run_query(statement, f"{filename} resume statement {index}/{len(executable)}")


def main() -> int:
    runner.assert_development_config()
    print("BUILD 440 DEVELOPMENT D1 PARTIAL-APPLY RESUME")
    print(f"Database: {runner.DATABASE_NAME} ({runner.DATABASE_ID})")
    print("Known prior state: lot-provenance statements 1-17 completed; first legacy trigger CREATE failed")
    print("OAuth/query path: MUST PASS READ-ONLY PROBE")
    print("Legacy CASE/END trigger CREATE statements: NOT EXECUTED")
    print("Final trigger compatibility migration: REQUIRED")
    print("Automatic retries: NONE")
    print("R2/provider mutation: NONE")
    print("Production mutation capability: NONE")

    preflight_resume()
    runner.auth_probe()
    runner.transport_smoke_probe()
    trigger_compat_transport_smoke()

    # Replay idempotent migration work but never send the D1-ambiguous legacy trigger forms.
    apply_file(BASE, skip_superseded_triggers=True)
    apply_file(HARDENING, skip_superseded_triggers=True)

    # Install all four final commitment guards in one dedicated D1-compatible authority.
    apply_file(COMPAT)

    for filename in RECEIVING:
        apply_file(filename)

    for filename in VERIFICATIONS:
        apply_file(filename, read_only=True)

    print("\n" + "=" * 72)
    print("BUILD 440 DEVELOPMENT D1 PARTIAL-APPLY RESUME + VERIFY: PASS")
    print("OAuth/query transport: PASS")
    print("Lot provenance: FINAL")
    print("D1-safe commitment triggers: FINAL")
    print("Receiving/source provenance: FINAL")
    print("Production mutation: NONE")
    print("=" * 72)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
