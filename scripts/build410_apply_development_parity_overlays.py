#!/usr/bin/env python3
"""Build 410 Development-only parity overlay applicator.

Applies post-Gift-Card migration authorities one SQL statement at a time through
Wrangler's remote --command path. Notification outbox compatibility columns are
aligned immediately after its CREATE statement and before dependent indexes/defaults.

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
AUTH_ENV_NAMES = (
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_KEY',
    'CLOUDFLARE_EMAIL',
    'CF_API_TOKEN',
    'CF_ACCOUNT_ID',
    'CF_API_KEY',
    'CF_EMAIL',
)

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
        args, cwd=ROOT, text=True, encoding='utf-8', errors='replace',
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        env={**os.environ, 'NO_COLOR': '1', 'FORCE_COLOR': '0'}, check=False,
    )


def npx_path() -> str:
    return shutil.which('npx.cmd') or shutil.which('npx') or fail('npx was not found on PATH.')


def current_branch() -> str:
    result = run_capture(['git', 'branch', '--show-current'])
    if result.returncode != 0: fail(result.stdout or 'Unable to determine branch.')
    return result.stdout.strip()


def configured_auth_env_names() -> list[str]:
    return [name for name in AUTH_ENV_NAMES if str(os.environ.get(name, '')).strip()]


def print_auth_diagnostics(npx: str) -> None:
    print('\n=== WRANGLER AUTH DIAGNOSTIC (NO SECRETS) ===')
    configured = configured_auth_env_names()
    print('Cloudflare auth/account environment overrides:', ', '.join(configured) if configured else 'none detected in inherited environment')
    print('Wrangler identity:')
    result = run_capture([npx, 'wrangler', 'whoami'])
    # `whoami` does not print bearer tokens; preserve its account/auth summary for diagnosis.
    print(result.stdout, end='' if result.stdout.endswith('\n') else '\n')
    if result.returncode != 0:
        fail('Wrangler is not currently authenticated. Run `npx wrangler login`, then retry this helper.')


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
    preview = compact_sql(sql)
    print('SQL:', preview if len(preview) <= 180 else preview[:177] + '...')
    result = run_capture(command(npx, sql))
    print(result.stdout, end='' if result.stdout.endswith('\n') else '\n')
    if result.returncode == 0: return
    lower = (result.stdout or '').lower()
    if tolerate_duplicate_column and 'duplicate column name' in lower:
        print('Compatibility column already exists; continuing.')
        return
    if 'code: 7403' in lower or 'not valid or is not authorized to access this service' in lower:
        configured = configured_auth_env_names()
        suffix = f' Environment overrides currently detected: {", ".join(configured)}.' if configured else ''
        fail(
            f'{label} was blocked by Cloudflare authorization (7403); no SQL from this statement was executed.'
            f'{suffix} Verify `npx wrangler whoami`. If CLOUDFLARE_API_TOKEN is set, remember it takes precedence over Wrangler OAuth and must grant D1 Read/Write for the target account.'
        )
    fail(f'{label} failed with exit code {result.returncode}. Preserve this output; do not use --file.')


def apply_notification_migration(npx: str, statements: list[str]) -> None:
    create_index = next((i for i, sql in enumerate(statements) if sql.lstrip().upper().startswith('CREATE TABLE IF NOT EXISTS NOTIFICATION_OUTBOX')), None)
    if create_index is None: fail('Notification migration no longer defines notification_outbox.')

    # First materialize/no-op the canonical table. On an older existing table this
    # leaves its shape unchanged, so align columns immediately afterward.
    execute(npx, statements[create_index], f'database_notification_runtime_parity.sql STATEMENT {create_index + 1}/{len(statements)}')

    print('\n##### ALIGN LEGACY notification_outbox COLUMNS #####')
    for column, ddl in NOTIFICATION_COMPAT_COLUMNS:
        execute(
            npx,
            f'ALTER TABLE notification_outbox ADD COLUMN {column} {ddl};',
            f'ALIGN notification_outbox.{column}',
            tolerate_duplicate_column=True,
        )

    for index, statement in enumerate(statements, start=1):
        if index - 1 == create_index: continue
        execute(npx, statement, f'database_notification_runtime_parity.sql STATEMENT {index}/{len(statements)}')


def main() -> int:
    print('=== BUILD 410 DEVELOPMENT PARITY OVERLAY APPLICATOR ===')
    if current_branch() != 'dev': fail('Current branch is not dev.')
    config = CONFIG.read_text(encoding='utf-8') if CONFIG.exists() else ''
    if f'name = "{PROJECT}"' not in config: fail(f'wrangler.toml is not Development project {PROJECT}.')
    if f'database_name = "{DATABASE}"' not in config: fail(f'wrangler.toml is not Development D1 {DATABASE}.')
    for name in MIGRATIONS:
        if not (ROOT / name).exists(): fail(f'Missing migration: {name}')

    npx = npx_path()
    print_auth_diagnostics(npx)
    execute(npx, "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name LIMIT 5;", 'READ-ONLY DEVELOPMENT PREFLIGHT')

    for migration_name in MIGRATIONS:
        statements = split_sql((ROOT / migration_name).read_text(encoding='utf-8'))
        print(f'\n##### APPLY {migration_name} — {len(statements)} statements #####')
        if migration_name == 'database_notification_runtime_parity.sql':
            apply_notification_migration(npx, statements)
            continue
        for index, statement in enumerate(statements, start=1):
            execute(npx, statement, f'{migration_name} STATEMENT {index}/{len(statements)}')

    verification = "SELECT name FROM sqlite_schema WHERE type='table' AND name IN ('today_task_actions','membership_tier_policies','customer_documents','customer_document_sequences','accounting_order_records','accounting_hst_gst_reviews','accountant_export_packages','notification_outbox','notification_dispatch_log','notification_exclusions','notification_cooldown_rules','notification_automation_settings') ORDER BY name;"
    execute(npx, verification, 'VERIFY CURRENT PARITY TABLE SET')
    print('\nBUILD 410 DEVELOPMENT PARITY OVERLAY APPLICATOR: COMPLETE')
    print('Next: read-only browser gates and local Development RC regression.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
