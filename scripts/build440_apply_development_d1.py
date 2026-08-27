#!/usr/bin/env python3
"""Build 440 guarded Development D1 migration + verification runner.

The runner avoids Wrangler bulk import, preflights every statement, proves the normal D1
/query path, then proves remote DDL + uppercase-trigger transport on a disposable Build 440
table before any real migration statement can run.

Remote execution is D1-aware:
- leading SQL comments are removed before transport;
- PRAGMA foreign_keys = ON is skipped because D1 already enforces foreign keys;
- explicit transaction-control statements are rejected;
- trigger statements must use uppercase BEGIN for the current D1 remote splitter;
- command length is bounded for Windows;
- there are no automatic retries.

Production is not a supported target.
"""
from __future__ import annotations

import argparse
import re
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "wrangler.toml"
DATABASE_NAME = "devilndove-dev"
DATABASE_ID = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"
WRANGLER_VERSION = "4.126.0"
WINDOWS_SAFE_COMMAND_LIMIT = 24000
SMOKE_TABLE = "build440_d1_query_transport_smoke"
SMOKE_TRIGGER = "trg_build440_d1_query_transport_smoke"

MIGRATIONS = (
    "database_build440_product_inventory_lot_provenance.sql",
    "database_build440_product_inventory_lot_provenance_hardening.sql",
    "database_build440_inventory_receiving_source_provenance.sql",
    "database_build440_inventory_receiving_reversal.sql",
)

VERIFICATIONS = (
    "BUILD440_LOT_PROVENANCE_D1_VERIFICATION.sql",
    "BUILD440_LOT_PROVENANCE_D1_STRICT_VERIFICATION.sql",
    "BUILD440_RECEIVING_D1_VERIFICATION.sql",
    "BUILD440_RECEIVING_D1_STRICT_VERIFICATION.sql",
)


def die(message: str, code: int = 2) -> NoReturn:
    print(f"STOP: {message}", file=sys.stderr)
    raise SystemExit(code)


def assert_development_config() -> None:
    text = CONFIG.read_text(encoding="utf-8")
    if f'database_name = "{DATABASE_NAME}"' not in text:
        die(f"wrangler.toml is not bound to {DATABASE_NAME}.")
    if f'database_id = "{DATABASE_ID}"' not in text:
        die("wrangler.toml Development D1 id does not match the Build 440 guarded target.")
    lowered = DATABASE_NAME.lower()
    if "prod" in lowered or "production" in lowered:
        die("Production target detected. This runner is Development-only.")


def strip_comment_only_tail(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"--[^\n]*(?:\n|$)", "", text)
    return text.strip()


def split_complete_statements(path: Path) -> list[str]:
    """Split SQL with SQLite's completeness parser so trigger bodies remain intact."""
    raw = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    statements: list[str] = []
    buffer: list[str] = []
    for line in raw.splitlines(keepends=True):
        buffer.append(line)
        candidate = "".join(buffer).strip()
        if candidate and sqlite3.complete_statement(candidate):
            statements.append(candidate)
            buffer.clear()
    tail = "".join(buffer)
    if strip_comment_only_tail(tail):
        die(f"{path.name} ends with an incomplete SQL statement.")
    return statements


def strip_leading_sql_comments(sql: str) -> str:
    """Remove only comments that occur before the statement itself."""
    text = sql.replace("\r\n", "\n").replace("\r", "\n").lstrip()
    while text:
        if text.startswith("--"):
            newline = text.find("\n")
            if newline < 0:
                return ""
            text = text[newline + 1 :].lstrip()
            continue
        if text.startswith("/*"):
            close = text.find("*/", 2)
            if close < 0:
                die("Remote SQL contains an unterminated leading block comment.")
            text = text[close + 2 :].lstrip()
            continue
        break
    return text.strip()


def normalize_remote_statement(sql: str) -> tuple[str | None, str | None]:
    """Return D1-safe SQL or a deliberate skip reason for a local/session directive."""
    statement = strip_leading_sql_comments(sql)
    if not statement:
        return None, "comment-only"

    compact = re.sub(r"\s+", " ", statement).strip()
    if re.fullmatch(r"PRAGMA\s+foreign_keys\s*=\s*(?:ON|1)\s*;?", compact, flags=re.I):
        return None, "D1 already enforces foreign keys"
    if re.match(r"^PRAGMA\s+foreign_keys\s*=", compact, flags=re.I):
        die(f"Refusing unsupported remote foreign-key mode change: {compact}")

    if re.match(r"^(BEGIN(?:\s+TRANSACTION)?|COMMIT|ROLLBACK)\b", compact, flags=re.I):
        die(f"Refusing explicit transaction-control statement on per-statement D1 runner: {compact[:120]}")

    if re.match(r"^CREATE\s+TRIGGER\b", compact, flags=re.I):
        if not re.search(r"\bBEGIN\b", statement):
            die("Remote CREATE TRIGGER must use uppercase BEGIN for the current D1 splitter.")
        if not re.search(r"\bEND\s*;\s*$", statement):
            die("Remote CREATE TRIGGER is missing an uppercase END terminator.")

    if len(statement) > WINDOWS_SAFE_COMMAND_LIMIT:
        die(
            f"Remote SQL statement is {len(statement)} characters, exceeding the guarded "
            f"Windows command transport limit of {WINDOWS_SAFE_COMMAND_LIMIT}."
        )

    return statement, None


def prepared_remote_statements(filename: str) -> tuple[list[str], list[str]]:
    path = ROOT / filename
    if not path.exists():
        die(f"Required file is missing: {filename}")
    raw_statements = split_complete_statements(path)
    if not raw_statements:
        die(f"No executable SQL found in {filename}")

    prepared: list[str] = []
    skipped: list[str] = []
    for index, raw in enumerate(raw_statements, 1):
        statement, reason = normalize_remote_statement(raw)
        if statement is None:
            skipped.append(f"statement {index}: {reason or 'skipped'}")
        else:
            prepared.append(statement)
    if not prepared:
        die(f"No remote-executable SQL remains after normalization: {filename}")
    return prepared, skipped


def preflight_all_files() -> None:
    print("\nBUILD 440 DEVELOPMENT D1 REMOTE STATEMENT PREFLIGHT")
    total = 0
    skipped_total = 0
    for filename in (*MIGRATIONS, *VERIFICATIONS):
        statements, skipped = prepared_remote_statements(filename)
        total += len(statements)
        skipped_total += len(skipped)
        print(f"PASS — {filename}: {len(statements)} remote statements, {len(skipped)} deliberate skips")
        for detail in skipped:
            print(f"       {detail}")
    print(f"Remote statements preflighted: {total}")
    print(f"Local/session directives deliberately skipped: {skipped_total}")


def npx_executable() -> str:
    executable = shutil.which("npx.cmd") or shutil.which("npx")
    if not executable:
        die("npx is not available on PATH.")
    return executable


def build_wrangler_query_args(sql: str) -> list[str]:
    if not sql.strip():
        die("Refusing to execute an empty SQL statement.")
    return [
        npx_executable(),
        "--yes",
        f"wrangler@{WRANGLER_VERSION}",
        "d1",
        "execute",
        DATABASE_NAME,
        "--remote",
        f"--command={sql}",
        "--config",
        str(CONFIG),
        "--yes",
    ]


def run_query(sql: str, label: str) -> None:
    print(f"\n--- {label} ---", flush=True)
    result = subprocess.run(build_wrangler_query_args(sql), cwd=ROOT, check=False)
    if result.returncode:
        print(
            "\nThe D1 query command failed. No automatic retry was attempted.\n"
            "The runner stopped before the next statement. Review the Wrangler error above;\n"
            "the statement label identifies the exact operation.\n"
            "Do not paste Cloudflare tokens or credentials into chat.",
            file=sys.stderr,
        )
        raise SystemExit(result.returncode)


def auth_probe() -> None:
    run_query("SELECT 1 AS build440_development_query_auth_probe;", "Development D1 query authentication probe")


def transport_smoke_probe() -> None:
    """Prove remote CREATE TABLE + uppercase CREATE TRIGGER before real migrations."""
    print("\nBUILD 440 DEVELOPMENT D1 REMOTE DDL/TRIGGER TRANSPORT SMOKE")
    cleanup_trigger = f"DROP TRIGGER IF EXISTS {SMOKE_TRIGGER};"
    cleanup_table = f"DROP TABLE IF EXISTS {SMOKE_TABLE};"
    create_table = (
        f"CREATE TABLE {SMOKE_TABLE} ("
        "id INTEGER PRIMARY KEY, touched INTEGER NOT NULL DEFAULT 0);"
    )
    create_trigger = (
        f"CREATE TRIGGER {SMOKE_TRIGGER} AFTER INSERT ON {SMOKE_TABLE} "
        f"BEGIN UPDATE {SMOKE_TABLE} SET touched=1 WHERE id=NEW.id; END;"
    )
    insert_row = f"INSERT INTO {SMOKE_TABLE}(id,touched) VALUES(1,0);"
    verify_row = (
        f"SELECT CASE WHEN (SELECT touched FROM {SMOKE_TABLE} WHERE id=1)=1 "
        "THEN 'PASS' ELSE 'FAIL' END AS build440_query_transport_smoke;"
    )

    # Idempotent cleanup handles any interrupted prior smoke attempt.
    run_query(cleanup_trigger, "transport smoke cleanup trigger")
    run_query(cleanup_table, "transport smoke cleanup table")
    run_query(create_table, "transport smoke CREATE TABLE")
    run_query(create_trigger, "transport smoke CREATE TRIGGER")
    run_query(insert_row, "transport smoke trigger execution")
    run_query(verify_row, "transport smoke verification")
    run_query(cleanup_trigger, "transport smoke final trigger cleanup")
    run_query(cleanup_table, "transport smoke final table cleanup")
    print("BUILD 440 DEVELOPMENT D1 REMOTE DDL/TRIGGER TRANSPORT: PASS")


def execute_sql_file(filename: str, *, read_only: bool) -> None:
    statements, skipped = prepared_remote_statements(filename)
    mode = "VERIFY" if read_only else "APPLY"
    print(
        f"\n{'=' * 72}\n{mode}: {filename} "
        f"({len(statements)} remote statements; {len(skipped)} local/session directives skipped)\n{'=' * 72}"
    )
    for index, statement in enumerate(statements, 1):
        run_query(statement, f"{filename} remote statement {index}/{len(statements)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build 440 Development D1 guarded query runner")
    parser.add_argument("--auth-only", action="store_true", help="Run only the read-only D1 query auth probe.")
    parser.add_argument("--verify-only", action="store_true", help="Run preflight, auth probe and read-only verification files only.")
    parser.add_argument("--transport-smoke-only", action="store_true", help="Run preflight, auth and disposable remote DDL/trigger transport smoke only.")
    args = parser.parse_args()

    if sum(bool(value) for value in (args.auth_only, args.verify_only, args.transport_smoke_only)) > 1:
        die("Choose only one of --auth-only, --verify-only, or --transport-smoke-only.")

    assert_development_config()
    print("BUILD 440 DEVELOPMENT D1 GUARDED QUERY RUNNER")
    print(f"Database: {DATABASE_NAME} ({DATABASE_ID})")
    print("Transport: Wrangler d1 execute --command=<SQL> / D1 query API")
    print("Leading SQL comments: STRIPPED BEFORE REMOTE TRANSPORT")
    print("PRAGMA foreign_keys = ON: SKIPPED / D1 ENFORCES FOREIGN KEYS")
    print("Explicit transaction control: BLOCKED")
    print("Remote DDL/trigger smoke: REQUIRED BEFORE REAL MIGRATIONS")
    print("Bulk import transport: NOT USED")
    print("Automatic retries: NONE")
    print("R2/provider mutation: NONE")
    print("Production mutation capability: NONE")

    if not args.auth_only:
        preflight_all_files()

    auth_probe()
    if args.auth_only:
        print("\nBUILD 440 DEVELOPMENT D1 QUERY AUTH: PASS")
        return 0

    if not args.verify_only:
        transport_smoke_probe()
    if args.transport_smoke_only:
        print("\nBUILD 440 DEVELOPMENT D1 TRANSPORT SMOKE: PASS")
        return 0

    if not args.verify_only:
        for filename in MIGRATIONS:
            execute_sql_file(filename, read_only=False)

    for filename in VERIFICATIONS:
        execute_sql_file(filename, read_only=True)

    print("\n" + "=" * 72)
    print("BUILD 440 DEVELOPMENT D1 LOT + RECEIVING APPLY/VERIFY: PASS")
    print("Production mutation: NONE")
    print("=" * 72)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
