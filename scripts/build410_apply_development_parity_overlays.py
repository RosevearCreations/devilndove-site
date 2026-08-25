#!/usr/bin/env python3
"""Build 410 Development-only parity overlay applicator.

Applies the post-Gift-Card migration authorities one SQL statement at a time through
Wrangler's remote --command path. This avoids the Windows/remote --file issues already
seen during Build 384 and makes any remaining legacy-schema drift exact and actionable.

This script MUTATES only the Development D1 target declared in wrangler.toml.
"""
from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'wrangler.toml'
DATABASE = 'devilndove-dev'
PROJECT = 'devilndove-site-dev'
MIGRATIONS = [
    'database_today_task_actions_runtime_parity.sql',
    'database_membership_tier_policy_runtime_parity.sql',
    'database_customer_documents_runtime_parity.sql',
    'database_accounting_runtime_parity.sql',
    'database_notification_runtime_parity.sql',
]
MAX_COMMAND_CHARS = 7000

NOTIFICATION_COMPAT_COLUMNS = (
    ('channel', "TEXT NOT NULL DEFAULT 'email'"),
    ('destination', 'TEXT'),
    ('related_order_id', 'INTEGER'),
    ('related_payment_id', 'INTEGER'),
    ('related_product_id', 'INTEGER'),
    ('payload_json', 'TEXT'),
    ('metadata_json', 'TEXT'),
    ('status', "TEXT NOT NULL DEFAULT 'queued'"),
    ('attempt_count', 'INTEGER NOT NULL DEFAULT 0'),
    ('last_attempt_at', 'TEXT'),
    ('next_attempt_at', 'TEXT'),
    ('provider_message_id', 'TEXT'),
    ('error_text', 'TEXT'),
    ('created_at', 'TEXT'),
    ('updated_at', 'TEXT'),
)


def fail(message: str, code: int = 1) -> None:
    print(f'\nSTOP: {message}', file=sys.stderr)
    raise SystemExit(code)


def run_capture(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=ROOT,
        text=True,
        encoding='utf-8',
        errors='replace',
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**os.environ, 'NO_COLOR': '1', 'FORCE_COLOR': '0'},
        check=False,
    )


def npx_path() -> str:
    return shutil.which('npx.cmd') or shutil.which('npx') or fail('npx was not found on PATH.')


def current_branch() -> str:
    result = run_capture(['git', 'branch', '--show-current'])
    if result.returncode != 0:
        fail(result.stdout or 'Unable to determine branch.')
    return result.stdout.strip()


def strip_line_comments(text: str) -> str:
    return '\n'.join(line for line in text.splitlines() if not line.lstrip().startswith('--'))


def split_sql(text: str) -> list[str]:
    text = strip_line_comments(text)
    statements: list[str] = []
    current: list[str] = []
    in_single = False
    in_double = False
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "'" and not in_double:
            if in_single and i + 1 < len(text) and text[i + 1] == "'":
                current.extend(("'", "'")); i += 2; continue
            in_single = not in_single; current.append(ch); i += 1; continue
        if ch == '"' and not in_single:
            if in_double and i + 1 < len(text) and text[i + 1] == '"':
                current.extend(('"', '"')); i += 2; continue
            in_double = not in_double; current.append(ch); i += 1; continue
        if ch == ';' and not in_single and not in_double:
            statement = ''.join(current).strip()
            if statement: statements.append(statement + ';')
            current = []; i += 1; continue
        current.append(ch); i += 1
    trailing = ''.join(current).strip()
    if trailing: statements.append(trailing)
    if in_single or in_double: fail('Migration contains an unterminated quoted string.')
    return statements


def compact_sql(sql: str) -> str:
    out: list[str] = []
    in_single = False
    in_double = False
    pending_space = False
    i = 0
    while i < len(sql):
        ch = sql[i]
        if ch == "'" and not in_double:
            if pending_space and out and out[-1] != ' ': out.append(' ')
            pending_space = False; out.append(ch)
            if in_single and i + 1 < len(sql) and sql[i + 1] == "'":
                out.append("'"); i += 2; continue
            in_single = not in_single; i += 1; continue
        if ch == '"' and not in_single:
            if pending_space and out and out[-1] != ' ': out.append(' ')
            pending_space = False; out.append(ch)
            if in_double and i + 1 < len(sql) and sql[i + 1] == '"':
                out.append('"'); i += 2; continue
            in_double = not in_double; i += 1; continue
        if not in_single and not in_double and ch.isspace():
            pending_space = True; i += 1; continue
        if pending_space and out and out[-1] != ' ': out.append(' ')
        pending_space = False; out.append(ch); i += 1
    compact = ''.join(out).strip()
    if '\n' in compact or '\r' in compact: fail('SQL compaction left a physical newline.')
    if len(compact) > MAX_COMMAND_CHARS: fail(f'SQL command exceeds {MAX_COMMAND_CHARS} characters.')
    return compact


def command(npx: str, sql: str) -> list[str]:
    return [npx, 'wrangler', 'd1', 'execute', DATABASE, '--remote', '--config', str(CONFIG), '--yes', '--command', compact_sql(sql)]


def execute(npx: str, sql: str, label: str, *, tolerate_duplicate_column: bool = False) -> None:
    print(f'\n=== {label} ===')
    preview = ' '.join(compact_sql(sql).split())
    print('SQL:', preview if len(preview) <= 180 else preview[:177] + '...')
    result = run_capture(command(npx, sql))
    print(result.stdout, end='' if result.stdout.endswith('\n') else '\n')
    if result.returncode == 0: return
    lower = (result.stdout or '').lower()
    if tolerate_duplicate_column and 'duplicate column name' in lower:
        print('Compatibility column already exists; continuing.')
        return
    fail(f'{label} failed with exit code {result.returncode}. Preserve this output; do not use --file.')


def main() -> int:
    print('=== BUILD 410 DEVELOPMENT PARITY OVERLAY APPLICATOR ===')
    if current_branch() != 'dev': fail('Current branch is not dev.')
    config = CONFIG.read_text(encoding='utf-8') if CONFIG.exists() else ''
    if f'name = "{PROJECT}"' not in config: fail(f'wrangler.toml is not Development project {PROJECT}.')
    if f'database_name = "{DATABASE}"' not in config: fail(f'wrangler.toml is not Development D1 {DATABASE}.')
    for name in MIGRATIONS:
        if not (ROOT / name).exists(): fail(f'Missing migration: {name}')

    npx = npx_path()
    execute(npx, "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name LIMIT 5;", 'READ-ONLY DEVELOPMENT PREFLIGHT')

    for migration_name in MIGRATIONS:
        path = ROOT / migration_name
        statements = split_sql(path.read_text(encoding='utf-8'))
        print(f'\n##### APPLY {migration_name} — {len(statements)} statements #####')
        for index, statement in enumerate(statements, start=1):
            execute(npx, statement, f'{migration_name} STATEMENT {index}/{len(statements)}')

        if migration_name == 'database_notification_runtime_parity.sql':
            print('\n##### ALIGN LEGACY notification_outbox COLUMNS #####')
            for column, ddl in NOTIFICATION_COMPAT_COLUMNS:
                execute(
                    npx,
                    f'ALTER TABLE notification_outbox ADD COLUMN {column} {ddl};',
                    f'ALIGN notification_outbox.{column}',
                    tolerate_duplicate_column=True,
                )
            # Re-run notification indexes/defaults after compatibility alignment so an
            # older pre-existing outbox cannot leave a current index unapplied.
            for index, statement in enumerate(statements, start=1):
                if statement.lstrip().upper().startswith(('CREATE INDEX', 'INSERT INTO')):
                    execute(npx, statement, f'REAPPLY notification authority {index}/{len(statements)}')

    verification = "SELECT name FROM sqlite_schema WHERE type='table' AND name IN ('today_task_actions','membership_tier_policies','customer_documents','customer_document_sequences','accounting_order_records','accounting_hst_gst_reviews','accountant_export_packages','notification_outbox','notification_dispatch_log','notification_exclusions','notification_cooldown_rules','notification_automation_settings') ORDER BY name;"
    execute(npx, verification, 'VERIFY CURRENT PARITY TABLE SET')
    print('\nBUILD 410 DEVELOPMENT PARITY OVERLAY APPLICATOR: COMPLETE')
    print('Next: read-only browser gates and local Development RC regression.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
