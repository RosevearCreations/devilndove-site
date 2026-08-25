#!/usr/bin/env python3
"""Build 384 Development D1 parity migration fallback.

Avoids Wrangler remote --file import failures by executing the authoritative
Build 384 migration through one compact `wrangler d1 execute --command` statement
at a time. The helper also aligns the known legacy gift_card_lookup_attempts shape
before current indexes are created.
"""

from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "database_gift_card_runtime_parity.sql"
CONFIG = ROOT / "wrangler.toml"
DATABASE = "devilndove-dev"
PROJECT = "devilndove-site-dev"
MAX_COMMAND_CHARS = 6000

EXPECTED_TABLES = (
    "gift_card_admin_events",
    "gift_card_delivery_queue",
    "gift_card_delivery_templates",
    "gift_card_lookup_attempts",
    "gift_card_lookup_lockouts",
    "gift_card_provider_send_logs",
    "gift_card_redemptions",
    "gift_cards",
)

# Existing Development databases may contain the older anti-abuse shape with
# code_hint/email_hash/client_key/was_success but not the newer lookup fields.
# Execute these after the table CREATE statement and tolerate duplicate columns.
LOOKUP_ATTEMPT_COMPAT_COLUMNS = (
    ("code_hint", "TEXT"),
    ("email_hash", "TEXT"),
    ("client_key", "TEXT"),
    ("lookup_email", "TEXT"),
    ("code_suffix", "TEXT"),
    ("ip_hash", "TEXT"),
    ("user_agent", "TEXT"),
    ("result_status", "TEXT"),
    ("was_success", "INTEGER NOT NULL DEFAULT 0"),
)


def fail(message: str, code: int = 1) -> "NoReturn":
    print(f"\nSTOP: {message}", file=sys.stderr)
    raise SystemExit(code)


def run_capture(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**os.environ, "NO_COLOR": "1", "FORCE_COLOR": "0"},
        check=False,
    )


def current_branch() -> str:
    result = run_capture(["git", "branch", "--show-current"])
    if result.returncode != 0:
        fail(f"Unable to determine current Git branch.\n{result.stdout}")
    return result.stdout.strip()


def resolve_npx() -> str:
    return shutil.which("npx.cmd") or shutil.which("npx") or fail("npx was not found on PATH.")


def strip_sql_line_comments(text: str) -> str:
    return "\n".join(
        line for line in text.splitlines() if not line.lstrip().startswith("--")
    )


def split_sql(text: str) -> list[str]:
    """Split SQL on semicolons outside single/double quoted strings."""
    text = strip_sql_line_comments(text)
    statements: list[str] = []
    current: list[str] = []
    in_single = False
    in_double = False
    i = 0

    while i < len(text):
        ch = text[i]

        if ch == "'" and not in_double:
            if in_single and i + 1 < len(text) and text[i + 1] == "'":
                current.extend(("'", "'"))
                i += 2
                continue
            in_single = not in_single
            current.append(ch)
            i += 1
            continue

        if ch == '"' and not in_single:
            if in_double and i + 1 < len(text) and text[i + 1] == '"':
                current.extend(('"', '"'))
                i += 2
                continue
            in_double = not in_double
            current.append(ch)
            i += 1
            continue

        if ch == ";" and not in_single and not in_double:
            statement = "".join(current).strip()
            if statement:
                statements.append(statement + ";")
            current = []
            i += 1
            continue

        current.append(ch)
        i += 1

    trailing = "".join(current).strip()
    if trailing:
        statements.append(trailing)

    if in_single or in_double:
        fail("Migration contains an unterminated quoted string.")

    return statements


def compact_sql(sql: str) -> str:
    """Collapse whitespace outside quoted strings so Windows npx.cmd sees one arg."""
    out: list[str] = []
    in_single = False
    in_double = False
    pending_space = False
    i = 0

    while i < len(sql):
        ch = sql[i]

        if ch == "'" and not in_double:
            if pending_space and out and out[-1] != " ":
                out.append(" ")
            pending_space = False
            out.append(ch)
            if in_single and i + 1 < len(sql) and sql[i + 1] == "'":
                out.append("'")
                i += 2
                continue
            in_single = not in_single
            i += 1
            continue

        if ch == '"' and not in_single:
            if pending_space and out and out[-1] != " ":
                out.append(" ")
            pending_space = False
            out.append(ch)
            if in_double and i + 1 < len(sql) and sql[i + 1] == '"':
                out.append('"')
                i += 2
                continue
            in_double = not in_double
            i += 1
            continue

        if not in_single and not in_double and ch.isspace():
            pending_space = True
            i += 1
            continue

        if pending_space and out and out[-1] != " ":
            out.append(" ")
        pending_space = False
        out.append(ch)
        i += 1

    compact = "".join(out).strip()
    if "\n" in compact or "\r" in compact:
        fail("SQL compaction left a physical newline in a Wrangler command value.")
    return compact


def validate_statements(statements: list[str]) -> None:
    for index, statement in enumerate(statements, start=1):
        if statement.lstrip().startswith("--"):
            fail(f"SQL statement {index} still begins with a comment after sanitization.")
        compact = compact_sql(statement)
        if len(compact) > MAX_COMMAND_CHARS:
            fail(
                f"SQL statement {index} is {len(compact)} characters, above the "
                f"direct-command limit of {MAX_COMMAND_CHARS}."
            )


def sql_preview(sql: str, limit: int = 140) -> str:
    compact = compact_sql(sql)
    return compact if len(compact) <= limit else compact[: limit - 3] + "..."


def wrangler_command(npx: str, sql: str) -> list[str]:
    return [
        npx,
        "wrangler",
        "d1",
        "execute",
        DATABASE,
        "--remote",
        "--config",
        str(CONFIG),
        "--yes",
        "--command",
        compact_sql(sql),
    ]


def execute_direct(
    npx: str,
    sql: str,
    label: str,
    *,
    show_sql: bool = False,
    allow_duplicate_column: bool = False,
) -> None:
    print(f"\n=== {label} ===")
    if show_sql:
        print(f"SQL: {sql_preview(sql)}")
    result = run_capture(wrangler_command(npx, sql))
    print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")

    if result.returncode == 0:
        return

    lower = result.stdout.lower()
    if allow_duplicate_column and "duplicate column name" in lower:
        print("Compatibility column already exists; continuing.")
        return

    fail(
        f"{label} failed with exit code {result.returncode}. "
        "Do not switch back to --file; preserve this output for diagnosis."
    )


def align_lookup_attempt_columns(npx: str) -> None:
    print("\n=== LEGACY LOOKUP-ATTEMPT COLUMN ALIGNMENT ===")
    for column, definition in LOOKUP_ATTEMPT_COMPAT_COLUMNS:
        execute_direct(
            npx,
            f"ALTER TABLE gift_card_lookup_attempts ADD COLUMN {column} {definition};",
            f"ALIGN gift_card_lookup_attempts.{column}",
            show_sql=True,
            allow_duplicate_column=True,
        )


def main() -> int:
    print("=== BUILD 384 DIRECT DEVELOPMENT D1 PARITY FALLBACK ===")

    if current_branch() != "dev":
        fail("Current Git branch is not dev.")

    if not CONFIG.exists():
        fail("wrangler.toml is missing.")
    config_text = CONFIG.read_text(encoding="utf-8")
    if f'name = "{PROJECT}"' not in config_text:
        fail(f"wrangler.toml does not identify Development project {PROJECT!r}.")
    if f'database_name = "{DATABASE}"' not in config_text:
        fail(f"wrangler.toml does not bind Development D1 database {DATABASE!r}.")

    if not MIGRATION.exists():
        fail(f"Migration file is missing: {MIGRATION.name}")
    migration_text = MIGRATION.read_text(encoding="utf-8")

    for table in EXPECTED_TABLES:
        if f"CREATE TABLE IF NOT EXISTS {table}" not in migration_text:
            fail(f"Authoritative migration no longer defines expected table {table}.")

    for column, _definition in LOOKUP_ATTEMPT_COMPAT_COLUMNS:
        if column not in migration_text:
            fail(f"Authoritative migration is missing current lookup-attempt column {column}.")

    if "CREATE TABLE IF NOT EXISTS notification_outbox" in migration_text:
        fail("Build 384 migration unexpectedly attempts to own notification_outbox.")

    statements = split_sql(migration_text)
    validate_statements(statements)
    print(
        f"Target: {PROJECT} / {DATABASE}\n"
        f"Migration: {MIGRATION.name}\n"
        f"Statements: {len(statements)}\n"
        f"Direct-query statements: {len(statements)}"
    )

    npx = resolve_npx()
    table_list = ",".join(f"'{name}'" for name in EXPECTED_TABLES)

    execute_direct(
        npx,
        "SELECT name FROM sqlite_schema WHERE type='table' AND name IN ("
        + table_list
        + ") ORDER BY name;",
        "READ-ONLY PREFLIGHT",
    )

    aligned_lookup_attempts = False
    for index, statement in enumerate(statements, start=1):
        execute_direct(
            npx,
            statement,
            f"DIRECT SQL STATEMENT {index}/{len(statements)}",
            show_sql=True,
        )

        if (
            not aligned_lookup_attempts
            and compact_sql(statement).upper().startswith(
                "CREATE TABLE IF NOT EXISTS GIFT_CARD_LOOKUP_ATTEMPTS"
            )
        ):
            align_lookup_attempt_columns(npx)
            aligned_lookup_attempts = True

    execute_direct(
        npx,
        "SELECT name FROM sqlite_schema WHERE type='table' AND name IN ("
        + table_list
        + ") ORDER BY name;",
        "VERIFY 8 GIFT CARD TABLES",
    )

    execute_direct(
        npx,
        "SELECT template_key FROM gift_card_delivery_templates "
        "WHERE template_key IN ('activation','reissue') ORDER BY template_key;",
        "VERIFY MIGRATION-OWNED TEMPLATES",
    )

    execute_direct(
        npx,
        "SELECT name FROM pragma_table_info('gift_card_lookup_attempts') "
        "WHERE name IN ('code_hint','email_hash','client_key','lookup_email','code_suffix',"
        "'ip_hash','user_agent','result_status','was_success','created_at') ORDER BY name;",
        "VERIFY LOOKUP-ATTEMPT CURRENT COLUMNS",
    )

    print("\nBUILD 384 DIRECT DEVELOPMENT D1 PARITY FALLBACK: COMPLETE")
    print("Next gate: read-only Firefox proof on /admin/gift-cards/.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
