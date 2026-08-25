#!/usr/bin/env python3
"""Build 384 Development D1 parity migration fallback.

Why this exists:
- Wrangler remote --file imports can fail with {"D1_RESET_DO": true} while polling
  the D1 import endpoint.
- This tool avoids the remote file-import path entirely. It reads the authoritative
  database_gift_card_runtime_parity.sql file, splits it into bounded statement
  batches, and sends those batches through `wrangler d1 execute --command`.

Safety:
- Refuses to run unless the current Git branch is `dev`.
- Refuses to run unless wrangler.toml names the Development Pages project and D1 DB.
- Uses only the Build 384 migration file already committed to the repository.
- Verifies all eight Gift Card-owned tables and the two migration-owned templates.
- Does not touch the shared notification_outbox schema.
- Decodes Wrangler/Node subprocess output explicitly as UTF-8 with replacement so
  Windows console encoding cannot abort the release helper before D1 diagnostics
  are printed.
- Removes SQL line comments before passing statements to Wrangler `--command` so
  a leading `-- ...` migration comment cannot be misparsed as a CLI option.
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
MAX_BATCH_CHARS = 4200

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


def fail(message: str, code: int = 1) -> "NoReturn":
    print(f"\nSTOP: {message}", file=sys.stderr)
    raise SystemExit(code)


def run_capture(args: list[str]) -> subprocess.CompletedProcess[str]:
    # Wrangler/Node can emit bytes that Windows' default CP1252 decoder cannot
    # represent (for example while rendering CLI progress output). Pin decoding to
    # UTF-8 and replace any malformed byte rather than losing the actual D1 result
    # to a UnicodeDecodeError in this helper.
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
    """Remove full-line SQL comments before building Wrangler --command values.

    Wrangler/yargs can interpret a command value beginning with `-- comment` as a
    new CLI option. The Build 384 migration uses ordinary full-line comments only,
    so remove those lines while preserving all executable SQL and quoted strings.
    """
    return "\n".join(
        line for line in text.splitlines() if not line.lstrip().startswith("--")
    )


def split_sql(text: str) -> list[str]:
    """Split SQL on semicolons outside quoted strings.

    The Build 384 migration contains ordinary DDL/DML statements only; this parser
    intentionally remains small and deterministic instead of trying to be a full
    SQL grammar.
    """
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


def make_batches(statements: list[str]) -> list[str]:
    batches: list[str] = []
    current: list[str] = []
    current_size = 0

    for statement in statements:
        if statement.lstrip().startswith("--"):
            fail("A SQL batch still begins with a line comment after sanitization.")
        size = len(statement) + 1
        if size > MAX_BATCH_CHARS:
            fail(
                f"One SQL statement is {size} characters, above the direct-query "
                f"batch limit of {MAX_BATCH_CHARS}."
            )
        if current and current_size + size > MAX_BATCH_CHARS:
            batches.append("\n".join(current))
            current = []
            current_size = 0
        current.append(statement)
        current_size += size

    if current:
        batches.append("\n".join(current))

    return batches


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
        sql,
    ]


def execute_direct(npx: str, sql: str, label: str) -> None:
    print(f"\n=== {label} ===")
    result = run_capture(wrangler_command(npx, sql))
    print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
    if result.returncode != 0:
        fail(
            f"{label} failed with exit code {result.returncode}. "
            "Do not switch back to --file; preserve this output for diagnosis."
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

    if "CREATE TABLE IF NOT EXISTS notification_outbox" in migration_text:
        fail("Build 384 migration unexpectedly attempts to own notification_outbox.")

    statements = split_sql(migration_text)
    batches = make_batches(statements)
    print(
        f"Target: {PROJECT} / {DATABASE}\n"
        f"Migration: {MIGRATION.name}\n"
        f"Statements: {len(statements)}\n"
        f"Direct-query batches: {len(batches)}"
    )

    npx = resolve_npx()

    # Read-only preflight: this also proves the direct --command route works before
    # any DDL is attempted.
    table_list = ",".join(f"'{name}'" for name in EXPECTED_TABLES)
    preflight_sql = (
        "SELECT name FROM sqlite_schema "
        "WHERE type='table' AND name IN ("
        + table_list
        + ") ORDER BY name;"
    )
    execute_direct(npx, preflight_sql, "READ-ONLY PREFLIGHT")

    for index, batch in enumerate(batches, start=1):
        execute_direct(npx, batch, f"DIRECT SQL BATCH {index}/{len(batches)}")

    verify_sql = (
        "SELECT name FROM sqlite_schema "
        "WHERE type='table' AND name IN ("
        + table_list
        + ") ORDER BY name;"
    )
    execute_direct(npx, verify_sql, "VERIFY 8 GIFT CARD TABLES")

    template_sql = (
        "SELECT template_key FROM gift_card_delivery_templates "
        "WHERE template_key IN ('activation','reissue') ORDER BY template_key;"
    )
    execute_direct(npx, template_sql, "VERIFY MIGRATION-OWNED TEMPLATES")

    print("\nBUILD 384 DIRECT DEVELOPMENT D1 PARITY FALLBACK: COMPLETE")
    print("Next gate: read-only Firefox proof on /admin/gift-cards/.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
