#!/usr/bin/env python3
"""Build 410 Development-only parity overlay applicator.

Applies post-Gift-Card migration authorities one SQL statement at a time through
Wrangler's remote --command path.

Special Development compatibility handling is intentionally narrow:
- legacy membership_tier_policies shapes are rebuilt in-place through a shadow table
  into the canonical Build 395 shape while preserving mapped legacy rows;
- legacy notification_outbox columns are aligned immediately after its CREATE/no-op
  statement and before dependent notification indexes/defaults.

This script MUTATES only the Development D1 target declared in wrangler.toml.
"""
from __future__ import annotations

import json
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

MEMBERSHIP_CANONICAL_COLUMNS = (
    'policy_id',
    'tier_code',
    'title',
    'short_description',
    'benefits_json',
    'badge_color',
    'sort_order',
    'is_visible',
    'created_at',
    'updated_at',
)
MEMBERSHIP_SHADOW = 'membership_tier_policies_build410_current'
MEMBERSHIP_BACKUP = 'membership_tier_policies_build410_legacy'

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


def configured_auth_env_names() -> list[str]:
    return [name for name in AUTH_ENV_NAMES if str(os.environ.get(name, '')).strip()]


def print_auth_diagnostics(npx: str) -> None:
    print('\n=== WRANGLER AUTH DIAGNOSTIC (NO SECRETS) ===')
    configured = configured_auth_env_names()
    print(
        'Cloudflare auth/account environment overrides:',
        ', '.join(configured) if configured else 'none detected in inherited environment',
    )
    print('Wrangler identity:')
    result = run_capture([npx, 'wrangler', 'whoami'])
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
        if ch == ';' and not in_single and not in_double:
            statement = ''.join(current).strip()
            if statement:
                statements.append(statement + ';')
            current = []
            i += 1
            continue
        current.append(ch)
        i += 1
    trailing = ''.join(current).strip()
    if trailing:
        statements.append(trailing)
    if in_single or in_double:
        fail('Migration contains an unterminated quoted string.')
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
            if pending_space and out and out[-1] != ' ':
                out.append(' ')
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
            if pending_space and out and out[-1] != ' ':
                out.append(' ')
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
        if pending_space and out and out[-1] != ' ':
            out.append(' ')
        pending_space = False
        out.append(ch)
        i += 1
    compact = ''.join(out).strip()
    if '\n' in compact or '\r' in compact:
        fail('SQL compaction left a physical newline.')
    if len(compact) > MAX_COMMAND_CHARS:
        fail(f'SQL command exceeds {MAX_COMMAND_CHARS} characters.')
    return compact


def command(npx: str, sql: str) -> list[str]:
    return [
        npx,
        'wrangler',
        'd1',
        'execute',
        DATABASE,
        '--remote',
        '--config',
        str(CONFIG),
        '--yes',
        '--command',
        compact_sql(sql),
    ]


def handle_failure(result: subprocess.CompletedProcess[str], label: str) -> None:
    lower = (result.stdout or '').lower()
    if 'code: 7403' in lower or 'not valid or is not authorized to access this service' in lower:
        configured = configured_auth_env_names()
        suffix = f' Environment overrides currently detected: {", ".join(configured)}.' if configured else ''
        fail(
            f'{label} was blocked by Cloudflare authorization (7403); no SQL from this statement was executed.'
            f'{suffix} Verify `npx wrangler whoami`. If CLOUDFLARE_API_TOKEN is set, it takes precedence over Wrangler OAuth and must grant D1 Read/Write for the target account.'
        )
    fail(f'{label} failed with exit code {result.returncode}. Preserve this output; do not use --file.')


def execute(npx: str, sql: str, label: str, *, tolerate_duplicate_column: bool = False) -> None:
    print(f'\n=== {label} ===')
    preview = compact_sql(sql)
    print('SQL:', preview if len(preview) <= 180 else preview[:177] + '...')
    result = run_capture(command(npx, sql))
    print(result.stdout, end='' if result.stdout.endswith('\n') else '\n')
    if result.returncode == 0:
        return
    lower = (result.stdout or '').lower()
    if tolerate_duplicate_column and 'duplicate column name' in lower:
        print('Compatibility column already exists; continuing.')
        return
    handle_failure(result, label)


def parse_wrangler_payload(output: str) -> list[dict]:
    decoder = json.JSONDecoder()
    for index, ch in enumerate(output):
        if ch != '[':
            continue
        try:
            value, _ = decoder.raw_decode(output[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, list) and all(isinstance(item, dict) for item in value):
            if any('results' in item or 'success' in item for item in value):
                return value
    return []


def query_rows(npx: str, sql: str, label: str) -> list[dict]:
    print(f'\n=== {label} ===')
    preview = compact_sql(sql)
    print('SQL:', preview if len(preview) <= 180 else preview[:177] + '...')
    result = run_capture(command(npx, sql))
    print(result.stdout, end='' if result.stdout.endswith('\n') else '\n')
    if result.returncode != 0:
        handle_failure(result, label)
    payload = parse_wrangler_payload(result.stdout or '')
    if not payload:
        fail(f'{label} returned success but no parseable Wrangler result payload.')
    rows: list[dict] = []
    for item in payload:
        values = item.get('results')
        if isinstance(values, list):
            rows.extend(row for row in values if isinstance(row, dict))
    return rows


def quoted(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def first_existing(columns: set[str], *names: str) -> str | None:
    return next((name for name in names if name in columns), None)


def source_expr(columns: set[str], names: tuple[str, ...], fallback: str) -> str:
    name = first_existing(columns, *names)
    return quoted(name) if name else fallback


def membership_code_expr(columns: set[str]) -> str:
    code = first_existing(columns, 'tier_code', 'code')
    if code:
        return f"CASE WHEN trim(COALESCE({quoted(code)},''))<>'' THEN lower(trim({quoted(code)})) ELSE 'legacy_' || rowid END"
    title = first_existing(columns, 'title', 'name')
    if title:
        return f"CASE WHEN trim(COALESCE({quoted(title)},''))<>'' THEN lower(replace(trim({quoted(title)}),' ','_')) || '_' || rowid ELSE 'legacy_' || rowid END"
    return "'legacy_' || rowid"


def rebuild_membership_policy_table(npx: str, columns: set[str]) -> None:
    print('\n##### REBUILD LEGACY membership_tier_policies -> BUILD 395 CANONICAL SHAPE #####')
    print('Detected legacy columns:', ', '.join(sorted(columns)) if columns else '(none)')

    code_expr = membership_code_expr(columns)
    duplicate_rows = query_rows(
        npx,
        f"SELECT mapped_code, COUNT(*) AS row_count FROM (SELECT {code_expr} AS mapped_code FROM membership_tier_policies) GROUP BY mapped_code HAVING COUNT(*)>1 OR trim(COALESCE(mapped_code,''))='';",
        'CHECK MEMBERSHIP LEGACY CODE MAPPING',
    )
    if duplicate_rows:
        fail(f'Membership legacy rows cannot be mapped safely to unique tier_code values: {duplicate_rows}')

    title_expr = source_expr(columns, ('title', 'name'), "''")
    description_expr = source_expr(columns, ('short_description', 'description'), "''")
    benefits_expr = source_expr(columns, ('benefits_json', 'benefits'), "'[]'")
    badge_expr = source_expr(columns, ('badge_color', 'badge_colour'), "''")
    sort_expr = source_expr(columns, ('sort_order',), '0')
    visible_expr = source_expr(columns, ('is_visible',), '1')
    created_expr = source_expr(columns, ('created_at',), 'CURRENT_TIMESTAMP')
    updated_expr = source_expr(columns, ('updated_at',), 'CURRENT_TIMESTAMP')

    execute(npx, f'DROP TABLE IF EXISTS {MEMBERSHIP_SHADOW};', 'DROP STALE MEMBERSHIP SHADOW')
    execute(
        npx,
        f'''CREATE TABLE {MEMBERSHIP_SHADOW} (
          policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
          tier_code TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL DEFAULT '',
          short_description TEXT NOT NULL DEFAULT '',
          benefits_json TEXT NOT NULL DEFAULT '[]',
          badge_color TEXT NOT NULL DEFAULT '',
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_visible INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );''',
        'CREATE MEMBERSHIP CANONICAL SHADOW',
    )
    execute(
        npx,
        f'''INSERT INTO {MEMBERSHIP_SHADOW}
          (tier_code,title,short_description,benefits_json,badge_color,sort_order,is_visible,created_at,updated_at)
        SELECT {code_expr},
               COALESCE({title_expr},''),
               COALESCE({description_expr},''),
               COALESCE({benefits_expr},'[]'),
               COALESCE({badge_expr},''),
               COALESCE({sort_expr},0),
               COALESCE({visible_expr},1),
               COALESCE({created_expr},CURRENT_TIMESTAMP),
               COALESCE({updated_expr},CURRENT_TIMESTAMP)
        FROM membership_tier_policies;''',
        'COPY MEMBERSHIP LEGACY ROWS TO CANONICAL SHADOW',
    )

    counts = query_rows(
        npx,
        f'SELECT (SELECT COUNT(*) FROM membership_tier_policies) AS legacy_count, (SELECT COUNT(*) FROM {MEMBERSHIP_SHADOW}) AS current_count;',
        'VERIFY MEMBERSHIP SHADOW ROW COUNT',
    )
    if not counts or int(counts[0].get('legacy_count', -1)) != int(counts[0].get('current_count', -2)):
        fail(f'Membership shadow row-count verification failed: {counts}')

    execute(npx, f'DROP TABLE IF EXISTS {MEMBERSHIP_BACKUP};', 'DROP STALE MEMBERSHIP BACKUP')
    execute(npx, f'ALTER TABLE membership_tier_policies RENAME TO {MEMBERSHIP_BACKUP};', 'BACK UP LEGACY MEMBERSHIP TABLE')
    execute(npx, f'ALTER TABLE {MEMBERSHIP_SHADOW} RENAME TO membership_tier_policies;', 'ACTIVATE CANONICAL MEMBERSHIP TABLE')


def apply_membership_migration(npx: str, statements: list[str]) -> None:
    create_index = next(
        (i for i, sql in enumerate(statements) if sql.lstrip().upper().startswith('CREATE TABLE IF NOT EXISTS MEMBERSHIP_TIER_POLICIES')),
        None,
    )
    if create_index is None:
        fail('Membership migration no longer defines membership_tier_policies.')

    for index, statement in enumerate(statements[: create_index + 1], start=1):
        execute(npx, statement, f'database_membership_tier_policy_runtime_parity.sql STATEMENT {index}/{len(statements)}')

    column_rows = query_rows(
        npx,
        "SELECT name FROM pragma_table_info('membership_tier_policies') ORDER BY cid;",
        'INSPECT MEMBERSHIP TIER POLICY COLUMNS',
    )
    columns = {str(row.get('name') or '').strip() for row in column_rows if str(row.get('name') or '').strip()}
    missing = [name for name in MEMBERSHIP_CANONICAL_COLUMNS if name not in columns]
    if missing:
        print('Membership canonical columns missing:', ', '.join(missing))
        rebuild_membership_policy_table(npx, columns)
    else:
        print('Membership tier-policy table already has the canonical Build 395 column set.')

    for index, statement in enumerate(statements[create_index + 1 :], start=create_index + 2):
        execute(npx, statement, f'database_membership_tier_policy_runtime_parity.sql STATEMENT {index}/{len(statements)}')

    verification = query_rows(
        npx,
        "SELECT tier_code,title,sort_order,is_visible FROM membership_tier_policies ORDER BY sort_order,tier_code;",
        'VERIFY MEMBERSHIP CURRENT ROWS',
    )
    print('Membership current row count:', len(verification))
    execute(npx, f'DROP TABLE IF EXISTS {MEMBERSHIP_BACKUP};', 'RETIRE MEMBERSHIP LEGACY BACKUP AFTER VERIFIED SEED')


def apply_notification_migration(npx: str, statements: list[str]) -> None:
    create_index = next(
        (i for i, sql in enumerate(statements) if sql.lstrip().upper().startswith('CREATE TABLE IF NOT EXISTS NOTIFICATION_OUTBOX')),
        None,
    )
    if create_index is None:
        fail('Notification migration no longer defines notification_outbox.')

    execute(
        npx,
        statements[create_index],
        f'database_notification_runtime_parity.sql STATEMENT {create_index + 1}/{len(statements)}',
    )

    print('\n##### ALIGN LEGACY notification_outbox COLUMNS #####')
    for column, ddl in NOTIFICATION_COMPAT_COLUMNS:
        execute(
            npx,
            f'ALTER TABLE notification_outbox ADD COLUMN {column} {ddl};',
            f'ALIGN notification_outbox.{column}',
            tolerate_duplicate_column=True,
        )

    for index, statement in enumerate(statements, start=1):
        if index - 1 == create_index:
            continue
        execute(npx, statement, f'database_notification_runtime_parity.sql STATEMENT {index}/{len(statements)}')


def main() -> int:
    print('=== BUILD 410 DEVELOPMENT PARITY OVERLAY APPLICATOR ===')
    if current_branch() != 'dev':
        fail('Current branch is not dev.')
    config = CONFIG.read_text(encoding='utf-8') if CONFIG.exists() else ''
    if f'name = "{PROJECT}"' not in config:
        fail(f'wrangler.toml is not Development project {PROJECT}.')
    if f'database_name = "{DATABASE}"' not in config:
        fail(f'wrangler.toml is not Development D1 {DATABASE}.')
    for name in MIGRATIONS:
        if not (ROOT / name).exists():
            fail(f'Missing migration: {name}')

    npx = npx_path()
    print_auth_diagnostics(npx)
    execute(
        npx,
        "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name LIMIT 5;",
        'READ-ONLY DEVELOPMENT PREFLIGHT',
    )

    for migration_name in MIGRATIONS:
        statements = split_sql((ROOT / migration_name).read_text(encoding='utf-8'))
        print(f'\n##### APPLY {migration_name} — {len(statements)} statements #####')
        if migration_name == 'database_membership_tier_policy_runtime_parity.sql':
            apply_membership_migration(npx, statements)
            continue
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
