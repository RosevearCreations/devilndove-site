#!/usr/bin/env python3
"""Build 440 guarded Development D1 migration + verification runner.

This runner deliberately avoids Wrangler's bulk-import transport. It first proves the
normal D1 query path with a read-only SELECT, then applies each complete SQLite statement
from the four Build 440 migrations to devilndove-dev only. There are no automatic retries.

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

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "wrangler.toml"
DATABASE_NAME = "devilndove-dev"
DATABASE_ID = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"
WRANGLER_VERSION = "4.126.0"

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


def die(message: str, code: int = 2) -> "NoReturn":
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
    """Split SQL with SQLite's own completeness parser so trigger bodies stay intact."""
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


def npx_executable() -> str:
    executable = shutil.which("npx.cmd") or shutil.which("npx")
    if not executable:
        die("npx is not available on PATH.")
    return executable


def run_query(sql: str, label: str) -> None:
    args = [
        npx_executable(),
        "--yes",
        f"wrangler@{WRANGLER_VERSION}",
        "d1",
        "execute",
        DATABASE_NAME,
        "--remote",
        "--command",
        sql,
        "--config",
        str(CONFIG),
        "--yes",
    ]
    print(f"\n--- {label} ---", flush=True)
    result = subprocess.run(args, cwd=ROOT, check=False)
    if result.returncode:
        print(
            "\nThe D1 query path failed. No automatic retry was attempted.\n"
            "If Cloudflare reports authentication code 10000 here as well, refresh the local\n"
            "Wrangler login or use a Cloudflare API token with D1 Edit permission, then rerun.\n"
            "Do not paste any token into chat.",
            file=sys.stderr,
        )
        raise SystemExit(result.returncode)


def auth_probe() -> None:
    run_query("SELECT 1 AS build440_development_query_auth_probe;", "Development D1 query authentication probe")


def execute_sql_file(filename: str, *, read_only: bool) -> None:
    path = ROOT / filename
    if not path.exists():
        die(f"Required file is missing: {filename}")
    statements = split_complete_statements(path)
    if not statements:
        die(f"No executable SQL found in {filename}")
    mode = "VERIFY" if read_only else "APPLY"
    print(f"\n{'=' * 72}\n{mode}: {filename} ({len(statements)} complete statements)\n{'=' * 72}")
    for index, statement in enumerate(statements, 1):
        run_query(statement, f"{filename} statement {index}/{len(statements)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build 440 Development D1 guarded query runner")
    parser.add_argument("--auth-only", action="store_true", help="Run only the read-only D1 query auth probe.")
    parser.add_argument("--verify-only", action="store_true", help="Run the auth probe and read-only verification files only.")
    args = parser.parse_args()

    assert_development_config()
    print("BUILD 440 DEVELOPMENT D1 GUARDED QUERY RUNNER")
    print(f"Database: {DATABASE_NAME} ({DATABASE_ID})")
    print("Transport: Wrangler d1 execute --command / D1 query API")
    print("Bulk import transport: NOT USED")
    print("Automatic retries: NONE")
    print("R2/provider mutation: NONE")
    print("Production mutation capability: NONE")

    auth_probe()
    if args.auth_only:
        print("\nBUILD 440 DEVELOPMENT D1 QUERY AUTH: PASS")
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
