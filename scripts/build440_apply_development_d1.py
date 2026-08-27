#!/usr/bin/env python3
"""Build 440 guarded Development D1 migration + verification runner.

The runner avoids Wrangler bulk import, preflights every final transport statement, proves
the normal D1 /query path, then proves remote DDL + uppercase-trigger transport on a
disposable Build 440 table before any real migration statement can run.

Remote execution is deliberately D1/Windows-aware:
- SQL comments are removed outside quoted literals before transport;
- transport SQL is flattened to one physical command line;
- the flattened statement is re-checked with sqlite3.complete_statement();
- PRAGMA foreign_keys = ON is skipped because D1 already enforces foreign keys;
- explicit transaction-control statements are rejected;
- trigger statements must use uppercase BEGIN/END for the current D1 remote splitter;
- the complete Windows batch-wrapper command line is bounded below cmd.exe's limit;
- there are no automatic retries.

Production is not a supported target.
"""
from __future__ import annotations

import argparse
import hashlib
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
# npx.cmd is a Windows batch wrapper. Keep the *entire* command line comfortably below
# cmd.exe's ~8191-character ceiling rather than relying on CreateProcess' larger limit.
WINDOWS_SAFE_COMMAND_LINE_LIMIT = 7600
SMOKE_TABLE = "build440_d1_query_transport_smoke"
SMOKE_PARENT_TABLE = "build440_d1_query_transport_parent"
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
    """Split source SQL with SQLite's completeness parser so trigger bodies stay intact."""
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


def flatten_sql_for_windows_cli(sql: str) -> str:
    """Return one-line SQL, removing comments only outside quoted SQL literals.

    The Windows npm/npx entrypoint is a .cmd wrapper. Multiline values passed through that
    wrapper are not a reliable CLI transport. This scanner removes SQL comments and collapses
    whitespace outside quoted strings/identifiers while preserving quoted contents exactly.
    Multiline quoted literals are rejected because preserving their embedded newline through a
    batch-wrapper argument would reintroduce the same transport ambiguity.
    """
    text = sql.replace("\r\n", "\n").replace("\r", "\n")
    out: list[str] = []
    state = "normal"
    pending_space = False
    i = 0

    def emit_pending_space() -> None:
        nonlocal pending_space
        if pending_space and out and out[-1] != " ":
            out.append(" ")
        pending_space = False

    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""

        if state == "line_comment":
            if ch == "\n":
                state = "normal"
                pending_space = bool(out)
            i += 1
            continue

        if state == "block_comment":
            if ch == "*" and nxt == "/":
                state = "normal"
                pending_space = bool(out)
                i += 2
                continue
            i += 1
            continue

        if state in {"single", "double", "backtick"}:
            if ch == "\n":
                die("Remote SQL contains a multiline quoted literal/identifier; batch transport is refused.")
            out.append(ch)
            quote = {"single": "'", "double": '"', "backtick": "`"}[state]
            if ch == quote:
                if nxt == quote:  # SQLite doubled-quote escape.
                    out.append(nxt)
                    i += 2
                    continue
                state = "normal"
            i += 1
            continue

        if state == "bracket":
            if ch == "\n":
                die("Remote SQL contains a multiline bracketed identifier; batch transport is refused.")
            out.append(ch)
            if ch == "]":
                state = "normal"
            i += 1
            continue

        # Normal SQL text.
        if ch == "-" and nxt == "-":
            state = "line_comment"
            i += 2
            continue
        if ch == "/" and nxt == "*":
            state = "block_comment"
            i += 2
            continue
        if ch.isspace():
            pending_space = bool(out)
            i += 1
            continue
        if ch == "'":
            emit_pending_space()
            out.append(ch)
            state = "single"
            i += 1
            continue
        if ch == '"':
            emit_pending_space()
            out.append(ch)
            state = "double"
            i += 1
            continue
        if ch == "`":
            emit_pending_space()
            out.append(ch)
            state = "backtick"
            i += 1
            continue
        if ch == "[":
            emit_pending_space()
            out.append(ch)
            state = "bracket"
            i += 1
            continue

        emit_pending_space()
        out.append(ch)
        i += 1

    if state == "block_comment":
        die("Remote SQL contains an unterminated block comment.")
    if state in {"single", "double", "backtick", "bracket"}:
        die("Remote SQL contains an unterminated quoted literal/identifier.")

    flattened = "".join(out).strip()
    if "\n" in flattened or "\r" in flattened:
        die("Remote SQL transport normalization failed to remove physical newlines.")
    return flattened


def normalize_remote_statement(sql: str) -> tuple[str | None, str | None]:
    """Return final D1/Windows-safe SQL or a deliberate skip reason."""
    statement = flatten_sql_for_windows_cli(sql)
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

    # This is intentionally checked *after* comment removal/flattening. It would have caught
    # the previous Windows multiline transport failure before any remote migration write.
    if not sqlite3.complete_statement(statement):
        die(f"Normalized remote SQL is incomplete after Windows transport flattening: {statement[:180]}")

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


def npx_executable() -> str:
    executable = shutil.which("npx.cmd") or shutil.which("npx")
    if not executable:
        die("npx is not available on PATH.")
    return executable


def build_wrangler_query_args(sql: str) -> list[str]:
    if not sql.strip():
        die("Refusing to execute an empty SQL statement.")
    if "\n" in sql or "\r" in sql:
        die("Refusing multiline SQL at the Wrangler command boundary.")
    args = [
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
    command_line = subprocess.list2cmdline(args)
    if len(command_line) > WINDOWS_SAFE_COMMAND_LINE_LIMIT:
        die(
            f"Wrangler command line is {len(command_line)} characters, exceeding the guarded "
            f"Windows batch-wrapper limit of {WINDOWS_SAFE_COMMAND_LINE_LIMIT}."
        )
    return args


def statement_fingerprint(sql: str) -> str:
    return hashlib.sha256(sql.encode("utf-8")).hexdigest()[:12]


def preflight_all_files() -> None:
    print("\nBUILD 440 DEVELOPMENT D1 FINAL TRANSPORT PREFLIGHT")
    total = 0
    skipped_total = 0
    first_migration_checked = False
    for filename in (*MIGRATIONS, *VERIFICATIONS):
        statements, skipped = prepared_remote_statements(filename)
        for statement in statements:
            # Build the actual final CLI argument list for every statement before remote work.
            build_wrangler_query_args(statement)
            if "\n" in statement or "\r" in statement or not sqlite3.complete_statement(statement):
                die(f"Final transport statement failed completeness guard in {filename}.")
        if filename == MIGRATIONS[0]:
            first = statements[0]
            if not (
                first.startswith("CREATE TABLE IF NOT EXISTS product_production_run_material_lots (")
                and first.endswith(");")
                and "FOREIGN KEY(site_item_inventory_id)" in first
            ):
                die("The first Build 440 lot-provenance remote statement is not the complete expected table definition.")
            first_migration_checked = True
            print(
                "PASS — exact first lot-provenance statement: complete single-line CREATE TABLE "
                f"({len(first)} chars, sha256:{statement_fingerprint(first)})"
            )
        total += len(statements)
        skipped_total += len(skipped)
        longest = max(len(statement) for statement in statements)
        print(
            f"PASS — {filename}: {len(statements)} complete single-line remote statements, "
            f"{len(skipped)} deliberate skips, longest={longest} chars"
        )
        for detail in skipped:
            print(f"       {detail}")
    if not first_migration_checked:
        die("First Build 440 migration transport assertion did not run.")
    print(f"Final remote statements preflighted: {total}")
    print(f"Local/session directives deliberately skipped: {skipped_total}")


def run_query(sql: str, label: str) -> None:
    # All call sites must provide normalized, single-line, SQLite-complete SQL.
    if not sqlite3.complete_statement(sql):
        die(f"Refusing incomplete SQL at remote execution boundary: {label}")
    print(f"\n--- {label} [{len(sql)} chars / sha256:{statement_fingerprint(sql)}] ---", flush=True)
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
    sql, reason = normalize_remote_statement("SELECT 1 AS build440_development_query_auth_probe;")
    if sql is None:
        die(f"Authentication probe normalization failed: {reason}")
    run_query(sql, "Development D1 query authentication probe")


def transport_smoke_probe() -> None:
    """Prove normalized multiline CREATE TABLE + FK + uppercase trigger transport."""
    print("\nBUILD 440 DEVELOPMENT D1 REPRESENTATIVE REMOTE DDL/TRIGGER TRANSPORT SMOKE")
    raw_statements = [
        f"DROP TRIGGER IF EXISTS {SMOKE_TRIGGER};",
        f"DROP TABLE IF EXISTS {SMOKE_TABLE};",
        f"DROP TABLE IF EXISTS {SMOKE_PARENT_TABLE};",
        f"""
        -- Representative multiline parent DDL.
        CREATE TABLE {SMOKE_PARENT_TABLE} (
          id INTEGER PRIMARY KEY,
          label TEXT NOT NULL DEFAULT 'parent'
        );
        """,
        f"""
        -- Representative multiline child DDL with CHECK, UNIQUE and FK clauses.
        CREATE TABLE {SMOKE_TABLE} (
          id INTEGER PRIMARY KEY,
          parent_id INTEGER NOT NULL,
          touched INTEGER NOT NULL DEFAULT 0 CHECK(touched IN (0,1)),
          note TEXT NOT NULL DEFAULT '-- preserved string text',
          UNIQUE(parent_id, note),
          FOREIGN KEY(parent_id) REFERENCES {SMOKE_PARENT_TABLE}(id) ON DELETE RESTRICT
        );
        """,
        f"""
        -- Representative multiline trigger body.
        CREATE TRIGGER {SMOKE_TRIGGER} AFTER INSERT ON {SMOKE_TABLE}
        BEGIN
          UPDATE {SMOKE_TABLE} SET touched=1 WHERE id=NEW.id;
        END;
        """,
        f"INSERT INTO {SMOKE_PARENT_TABLE}(id,label) VALUES(1,'parent');",
        f"INSERT INTO {SMOKE_TABLE}(id,parent_id,touched,note) VALUES(1,1,0,'-- preserved string text');",
        (
            f"SELECT CASE WHEN (SELECT touched FROM {SMOKE_TABLE} WHERE id=1)=1 "
            "THEN 'PASS' ELSE 'FAIL' END AS build440_query_transport_smoke;"
        ),
        f"DROP TRIGGER IF EXISTS {SMOKE_TRIGGER};",
        f"DROP TABLE IF EXISTS {SMOKE_TABLE};",
        f"DROP TABLE IF EXISTS {SMOKE_PARENT_TABLE};",
    ]
    labels = [
        "transport smoke cleanup trigger",
        "transport smoke cleanup child table",
        "transport smoke cleanup parent table",
        "transport smoke multiline CREATE parent",
        "transport smoke multiline CREATE child with constraints",
        "transport smoke multiline CREATE TRIGGER",
        "transport smoke parent insert",
        "transport smoke trigger execution",
        "transport smoke verification",
        "transport smoke final trigger cleanup",
        "transport smoke final child cleanup",
        "transport smoke final parent cleanup",
    ]
    for raw, label in zip(raw_statements, labels, strict=True):
        sql, reason = normalize_remote_statement(raw)
        if sql is None:
            die(f"Transport smoke statement unexpectedly skipped ({label}): {reason}")
        if "\n" in sql or "\r" in sql:
            die(f"Transport smoke normalization left a physical newline: {label}")
        run_query(sql, label)
    print("BUILD 440 DEVELOPMENT D1 REPRESENTATIVE REMOTE DDL/TRIGGER TRANSPORT: PASS")


def execute_sql_file(filename: str, *, read_only: bool) -> None:
    statements, skipped = prepared_remote_statements(filename)
    mode = "VERIFY" if read_only else "APPLY"
    print(
        f"\n{'=' * 72}\n{mode}: {filename} "
        f"({len(statements)} single-line remote statements; {len(skipped)} directives skipped)\n{'=' * 72}"
    )
    for index, statement in enumerate(statements, 1):
        run_query(statement, f"{filename} remote statement {index}/{len(statements)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build 440 Development D1 guarded query runner")
    parser.add_argument("--auth-only", action="store_true", help="Run only the read-only D1 query auth probe.")
    parser.add_argument("--verify-only", action="store_true", help="Run final preflight, auth probe and read-only verification files only.")
    parser.add_argument("--transport-smoke-only", action="store_true", help="Run final preflight, auth and representative remote transport smoke only.")
    args = parser.parse_args()

    if sum(bool(value) for value in (args.auth_only, args.verify_only, args.transport_smoke_only)) > 1:
        die("Choose only one of --auth-only, --verify-only, or --transport-smoke-only.")

    assert_development_config()
    print("BUILD 440 DEVELOPMENT D1 GUARDED QUERY RUNNER")
    print(f"Database: {DATABASE_NAME} ({DATABASE_ID})")
    print("Transport: Wrangler d1 execute --command=<SINGLE-LINE SQL> / D1 query API")
    print("SQL comments: REMOVED OUTSIDE QUOTED LITERALS")
    print("Multiline CLI SQL: BLOCKED")
    print("PRAGMA foreign_keys = ON: SKIPPED / D1 ENFORCES FOREIGN KEYS")
    print("Explicit transaction control: BLOCKED")
    print(f"Windows batch-wrapper command ceiling: {WINDOWS_SAFE_COMMAND_LINE_LIMIT} chars")
    print("Representative multiline DDL/constraints/trigger smoke: REQUIRED BEFORE REAL MIGRATIONS")
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
