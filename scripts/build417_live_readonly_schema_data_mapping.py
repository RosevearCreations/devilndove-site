#!/usr/bin/env python3
"""Build 417 live read-only Development/Production D1 mapping gate.

This helper contacts Cloudflare D1 but is intentionally incapable of sending
mutation SQL. It inventories user tables/schema text and captures bounded row
counts for selected business-data anchor tables in Development and Production.

It does NOT apply migrations, copy rows, seed defaults, or modify either D1.
Production promotion and Production data copy remain closed after this evidence
capture until the resulting differences are reviewed explicitly.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
DEV_CONFIG = ROOT / 'wrangler.toml'

DEV_PROJECT = 'devilndove-site-dev'
DEV_DATABASE = 'devilndove-dev'
DEV_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'

PROD_PROJECT = 'devilndove-site'
PROD_DATABASE = 'devilndove-prod'
PROD_DATABASE_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'

COMPATIBILITY_DATE = '2026-04-08'
MAX_COMMAND_CHARS = 7000

# These are deliberately bounded business-data anchors. Identity/session/security
# tables are not included in a future-copy decision merely because they have rows.
BUSINESS_ANCHORS = (
    'products',
    'site_item_inventory',
    'packaging_projects',
    'creative_work_projects',
    'creative_projects',
    'content_projects',
    'creative_assets',
    'caip_media_upload_files',
    'orders',
    'order_items',
    'payments',
    'payment_refunds',
    'customer_documents',
    'gift_cards',
    'gift_card_redemptions',
    'membership_tier_policies',
    'accounting_order_records',
    'notification_outbox',
)

MUTATION_RE = re.compile(
    r'\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|TRUNCATE|VACUUM|ATTACH|DETACH|'
    r'REINDEX|ANALYZE|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)\b',
    re.I,
)
SAFE_STATEMENT_RE = re.compile(r'^\s*(?:SELECT\b|PRAGMA\s+(?:table_list\b|table_info\b|table_xinfo\b|foreign_key_check\b))', re.I)
IDENTIFIER_RE = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')

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


def fail(message: str, code: int = 1) -> None:
    print(f'\nBUILD 417 LIVE READ-ONLY MAPPING: FAIL — {message}', file=sys.stderr)
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


def current_branch() -> str:
    result = run_capture(['git', 'branch', '--show-current'])
    if result.returncode != 0:
        fail(result.stdout or 'Unable to determine current git branch.')
    return result.stdout.strip()


def npx_path() -> str:
    return shutil.which('npx.cmd') or shutil.which('npx') or fail('npx was not found on PATH.')


def configured_auth_env_names() -> list[str]:
    return [name for name in AUTH_ENV_NAMES if str(os.environ.get(name, '')).strip()]


def validate_dev_source_pin() -> None:
    if current_branch() != 'dev':
        fail('current branch must be dev.')
    if not DEV_CONFIG.exists():
        fail('wrangler.toml is missing.')
    text = DEV_CONFIG.read_text(encoding='utf-8')
    required = (
        f'name = "{DEV_PROJECT}"',
        f'database_name = "{DEV_DATABASE}"',
        f'database_id = "{DEV_DATABASE_ID}"',
    )
    missing = [value for value in required if value not in text]
    if missing:
        fail('wrangler.toml is not pinned to the expected Development Pages/D1 target.')


def readonly_config(project: str, database: str, database_id: str) -> str:
    # This temporary config contains exactly one D1 binding. Every execute call uses
    # the binding name DB, so Development and Production cannot be selected by an
    # ambiguous positional database name.
    return (
        f'name = "{project}"\n'
        f'compatibility_date = "{COMPATIBILITY_DATE}"\n\n'
        '[[d1_databases]]\n'
        'binding = "DB"\n'
        f'database_name = "{database}"\n'
        f'database_id = "{database_id}"\n'
    )


def split_sql(sql: str) -> list[str]:
    return [part.strip() for part in sql.split(';') if part.strip()]


def assert_read_only_sql(sql: str) -> None:
    if len(sql) > MAX_COMMAND_CHARS:
        fail(f'read-only SQL command exceeds {MAX_COMMAND_CHARS} characters.')
    if MUTATION_RE.search(sql):
        fail(f'read-only SQL guard rejected mutation-capable token in: {sql[:180]}')
    statements = split_sql(sql)
    if not statements:
        fail('empty SQL command was rejected.')
    for statement in statements:
        if not SAFE_STATEMENT_RE.match(statement):
            fail(f'read-only SQL guard rejected statement: {statement[:180]}')


def command(npx: str, config: Path, sql: str) -> list[str]:
    assert_read_only_sql(sql)
    return [
        npx,
        'wrangler',
        'd1',
        'execute',
        'DB',
        '--remote',
        '--config',
        str(config),
        '--yes',
        '--command',
        sql,
    ]


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


def handle_remote_failure(result: subprocess.CompletedProcess[str], label: str) -> None:
    output = result.stdout or ''
    lower = output.lower()
    print(output, end='' if output.endswith('\n') else '\n')
    if 'code: 7403' in lower or 'not valid or is not authorized to access this service' in lower:
        configured = configured_auth_env_names()
        suffix = f' Environment overrides detected: {", ".join(configured)}.' if configured else ''
        fail(
            f'{label} was blocked by Cloudflare authorization (7403). No mutation SQL exists in this helper.'
            f'{suffix} Verify `npx wrangler whoami`; an inherited API token can override Wrangler OAuth.'
        )
    fail(f'{label} failed with exit code {result.returncode}. Preserve the Wrangler output.')


def query_rows(npx: str, config: Path, sql: str, label: str) -> list[dict]:
    result = run_capture(command(npx, config, sql))
    if result.returncode != 0:
        handle_remote_failure(result, label)
    payload = parse_wrangler_payload(result.stdout or '')
    if not payload:
        print(result.stdout, end='' if (result.stdout or '').endswith('\n') else '\n')
        fail(f'{label} returned success but no parseable Wrangler result payload.')
    rows: list[dict] = []
    for item in payload:
        values = item.get('results')
        if isinstance(values, list):
            rows.extend(row for row in values if isinstance(row, dict))
    return rows


def quote_identifier(name: str) -> str:
    if not IDENTIFIER_RE.fullmatch(name):
        fail(f'unsafe table identifier rejected: {name!r}')
    return '"' + name + '"'


def inventory_sql() -> str:
    return (
        "SELECT name, COALESCE(sql,'') AS create_sql "
        "FROM sqlite_schema "
        "WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' "
        "ORDER BY name;"
    )


def load_inventory(npx: str, config: Path, label: str) -> dict[str, str]:
    rows = query_rows(npx, config, inventory_sql(), f'{label} TABLE INVENTORY')
    inventory: dict[str, str] = {}
    for row in rows:
        name = str(row.get('name') or '').strip()
        if not IDENTIFIER_RE.fullmatch(name):
            continue
        inventory[name] = str(row.get('create_sql') or '')
    return inventory


def count_sql(table_names: list[str]) -> str:
    statements = []
    for table in table_names:
        quoted = quote_identifier(table)
        literal = table.replace("'", "''")
        statements.append(f"SELECT '{literal}' AS table_name, COUNT(*) AS row_count FROM {quoted}")
    sql = ';'.join(statements) + (';' if statements else '')
    assert_read_only_sql(sql)
    return sql


def load_anchor_counts(npx: str, config: Path, inventory: dict[str, str], label: str) -> dict[str, int | None]:
    existing = [table for table in BUSINESS_ANCHORS if table in inventory]
    counts: dict[str, int | None] = {table: None for table in BUSINESS_ANCHORS}
    if not existing:
        return counts
    rows = query_rows(npx, config, count_sql(existing), f'{label} BUSINESS ANCHOR COUNTS')
    for row in rows:
        table = str(row.get('table_name') or '').strip()
        if table not in counts:
            continue
        try:
            counts[table] = int(row.get('row_count') or 0)
        except (TypeError, ValueError):
            counts[table] = None
    return counts


def normalize_create_sql(sql: str) -> str:
    return re.sub(r'\s+', ' ', str(sql or '').strip()).lower()


def schema_digest(sql: str) -> str:
    normalized = normalize_create_sql(sql)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()[:12]


def print_name_group(title: str, names: list[str], *, limit: int = 120) -> None:
    print(f'{title}: {len(names)}')
    if not names:
        print('  - none')
        return
    for name in names[:limit]:
        print(f'  - {name}')
    if len(names) > limit:
        print(f'  - ... {len(names) - limit} more omitted from console summary')


def print_anchor_counts(dev_counts: dict[str, int | None], prod_counts: dict[str, int | None]) -> None:
    print('\n=== BOUNDED BUSINESS-DATA ANCHOR COUNTS ===')
    print(f'{"table":38} {"development":>12} {"production":>12} {"prod-dev":>12}')
    print('-' * 78)
    for table in BUSINESS_ANCHORS:
        dev = dev_counts.get(table)
        prod = prod_counts.get(table)
        dev_text = 'MISSING' if dev is None else str(dev)
        prod_text = 'MISSING' if prod is None else str(prod)
        delta_text = '' if dev is None or prod is None else f'{prod - dev:+d}'
        print(f'{table:38} {dev_text:>12} {prod_text:>12} {delta_text:>12}')


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('BUILD 417 LIVE READ-ONLY SCHEMA / DATA MAPPING')
        print('This helper contacts BOTH Development and Production D1 using SELECT-only SQL.')
        print('No migration, data copy, seed, INSERT, UPDATE, DELETE, or DDL is permitted by the SQL guard.')
        print('\nRun explicitly with:')
        print('  python scripts/build417_live_readonly_schema_data_mapping.py --run')
        return 2

    validate_dev_source_pin()
    npx = npx_path()

    print('BUILD 417 LIVE READ-ONLY SCHEMA / DATA MAPPING')
    print(f'Git branch: {current_branch()}')
    print(f'Development target: {DEV_DATABASE} ({DEV_DATABASE_ID})')
    print(f'Production target:  {PROD_DATABASE} ({PROD_DATABASE_ID})')
    print('SQL guard: SELECT / inspection PRAGMA only — PASS')
    print('PRODUCTION MUTATION CAPABILITY IN THIS HELPER: NONE')

    configured = configured_auth_env_names()
    print('Cloudflare auth/account environment overrides:', ', '.join(configured) if configured else 'none detected')
    print('\n=== WRANGLER IDENTITY ===')
    identity = run_capture([npx, 'wrangler', 'whoami'])
    print(identity.stdout, end='' if identity.stdout.endswith('\n') else '\n')
    if identity.returncode != 0:
        fail('Wrangler is not authenticated. Run `npx wrangler login`, then retry.')

    with tempfile.TemporaryDirectory(prefix='dd-build417-') as temp_dir:
        temp = Path(temp_dir)
        dev_cfg = temp / 'wrangler-build417-dev.toml'
        prod_cfg = temp / 'wrangler-build417-prod.toml'
        dev_cfg.write_text(readonly_config(DEV_PROJECT, DEV_DATABASE, DEV_DATABASE_ID), encoding='utf-8')
        prod_cfg.write_text(readonly_config(PROD_PROJECT, PROD_DATABASE, PROD_DATABASE_ID), encoding='utf-8')

        print('\n=== DEVELOPMENT LIVE INVENTORY ===')
        dev_inventory = load_inventory(npx, dev_cfg, 'DEVELOPMENT')
        print(f'Development user tables: {len(dev_inventory)}')

        print('\n=== PRODUCTION LIVE INVENTORY ===')
        prod_inventory = load_inventory(npx, prod_cfg, 'PRODUCTION')
        print(f'Production user tables: {len(prod_inventory)}')

        dev_tables = set(dev_inventory)
        prod_tables = set(prod_inventory)
        common = sorted(dev_tables & prod_tables)
        prod_only = sorted(prod_tables - dev_tables)
        dev_only = sorted(dev_tables - prod_tables)

        create_sql_differences = sorted(
            table for table in common
            if normalize_create_sql(dev_inventory[table]) != normalize_create_sql(prod_inventory[table])
        )

        print('\n=== LIVE TABLE / SCHEMA MAPPING SUMMARY ===')
        print(f'Common tables: {len(common)}')
        print_name_group('Production-only tables', prod_only)
        print_name_group('Development-only tables', dev_only)
        print(f'Common tables with identical normalized CREATE SQL: {len(common) - len(create_sql_differences)}')
        print(f'Common tables with normalized CREATE SQL differences: {len(create_sql_differences)}')
        if create_sql_differences:
            for table in create_sql_differences[:120]:
                print(
                    f'  - {table}: dev={schema_digest(dev_inventory[table])} '
                    f'prod={schema_digest(prod_inventory[table])}'
                )
            if len(create_sql_differences) > 120:
                print(f'  - ... {len(create_sql_differences) - 120} more omitted from console summary')
        else:
            print('  - none')

        dev_counts = load_anchor_counts(npx, dev_cfg, dev_inventory, 'DEVELOPMENT')
        prod_counts = load_anchor_counts(npx, prod_cfg, prod_inventory, 'PRODUCTION')
        print_anchor_counts(dev_counts, prod_counts)

    print('\nBUILD 417 LIVE READ-ONLY SCHEMA / DATA MAPPING: EVIDENCE CAPTURE COMPLETE')
    print('No migration or data mutation was executed.')
    print('PRODUCTION PROMOTION: CLOSED')
    print('PRODUCTION DATA COPY: CLOSED')
    print('NEXT: review Production-only tables, CREATE-SQL differences, and business-data deltas before any rollout decision.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
