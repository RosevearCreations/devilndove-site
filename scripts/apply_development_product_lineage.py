#!/usr/bin/env python3
"""Release 448 Development-only Product lineage D1 migration runner.

Targets exactly devilndove-dev. Production is unsupported. Statements are sent one at a
time through the established Windows-safe Wrangler transport with no automatic retry.
The verification file is read-only and inventory quantities are never changed by this migration.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import subprocess
import sys
from pathlib import Path
from typing import Any, NoReturn

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

# Historical filename is retained only as the proven transport implementation.
# It does not define release authority.
from build440_apply_development_d1 import (  # noqa: E402
    DATABASE_ID,
    DATABASE_NAME,
    WINDOWS_SAFE_COMMAND_LINE_LIMIT,
    assert_development_config,
    build_wrangler_query_args,
    prepared_remote_statements,
    statement_fingerprint,
)

RELEASE = 448
MIGRATION = 'database_release448_product_lineage.sql'
VERIFICATION = 'RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql'
EXPECTED_DATABASE_NAME = 'devilndove-dev'
EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
REQUIRED_BASE_TABLES = ('users', 'products', 'product_resource_links', 'site_item_inventory')
REQUIRED_LINEAGE_TABLES = ('product_lineage_profiles', 'product_resource_lineage_reviews', 'inventory_vendor_reviews')
REQUIRED_TRIGGER = 'trg_product_lineage_profile_after_insert'


def die(message: str, code: int = 2) -> NoReturn:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(code)


def guard_exact_target() -> None:
    assert_development_config()
    if DATABASE_NAME != EXPECTED_DATABASE_NAME or DATABASE_ID != EXPECTED_DATABASE_ID:
        die('D1 transport authority no longer points at the exact Development database.')
    lowered = DATABASE_NAME.lower()
    if 'prod' in lowered or 'production' in lowered:
        die('Production target detected. Release 448 Product lineage runner is Development-only.')


def extract_rows(payload: Any) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    if isinstance(payload, list):
        for item in payload:
            found.extend(extract_rows(item))
        return found
    if not isinstance(payload, dict):
        return found
    if isinstance(payload.get('results'), list):
        found.extend(row for row in payload['results'] if isinstance(row, dict))
    result = payload.get('result')
    if isinstance(result, (dict, list)):
        found.extend(extract_rows(result))
    return found


def query_json(sql: str, label: str) -> list[dict[str, Any]]:
    if '\n' in sql or '\r' in sql or not sqlite3.complete_statement(sql):
        die(f'Refusing incomplete/multiline guarded query: {label}')
    args = build_wrangler_query_args(sql) + ['--json']
    if len(subprocess.list2cmdline(args)) > WINDOWS_SAFE_COMMAND_LINE_LIMIT:
        die(f'Guarded JSON query exceeds Windows transport ceiling: {label}')
    print(f'\n--- {label} [{len(sql)} chars / sha256:{statement_fingerprint(sql)}] ---', flush=True)
    result = subprocess.run(args, cwd=ROOT, check=False, capture_output=True, text=True)
    if result.returncode:
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        die(f'Development D1 query failed: {label}', result.returncode)
    raw = (result.stdout or '').strip()
    if not raw:
        die(f'Development D1 query returned no JSON: {label}')
    try:
        return extract_rows(json.loads(raw))
    except json.JSONDecodeError:
        print(raw)
        die(f'Wrangler returned non-JSON output: {label}')


def scalar_count(sql: str, field: str, label: str) -> int:
    result = query_json(sql, label)
    if len(result) != 1 or field not in result[0]:
        die(f'Expected exactly one {field} result row: {label}')
    try:
        return int(result[0][field])
    except (TypeError, ValueError):
        die(f'Expected integer {field}: {label}')


def transport_preflight() -> None:
    print('\nRELEASE 448 PRODUCT LINEAGE TRANSPORT PREFLIGHT')
    total = 0
    for filename in (MIGRATION, VERIFICATION):
        statements, skipped = prepared_remote_statements(filename)
        if not statements:
            die(f'No executable statements found in {filename}.')
        for statement in statements:
            build_wrangler_query_args(statement)
            if '\n' in statement or '\r' in statement or not sqlite3.complete_statement(statement):
                die(f'Final transport statement failed completeness guard in {filename}.')
        total += len(statements)
        print(f'PASS — {filename}: {len(statements)} complete remote statements; {len(skipped)} deliberate skips')
    print(f'Final remote statements preflighted: {total}')


def run_remote_statement(sql: str, label: str) -> None:
    if '\n' in sql or '\r' in sql or not sqlite3.complete_statement(sql):
        die(f'Refusing incomplete/multiline remote statement: {label}')
    print(f'\n--- {label} [{len(sql)} chars / sha256:{statement_fingerprint(sql)}] ---', flush=True)
    result = subprocess.run(build_wrangler_query_args(sql), cwd=ROOT, check=False)
    if result.returncode:
        print('No automatic retry was attempted. The runner stopped before the next statement.', file=sys.stderr)
        raise SystemExit(result.returncode)


def execute_file(filename: str, *, read_only: bool) -> None:
    statements, skipped = prepared_remote_statements(filename)
    print(f'\nExecuting {filename}: {len(statements)} statements; {len(skipped)} deliberate skips.')
    for index, statement in enumerate(statements, 1):
        if read_only:
            keyword = statement.lstrip().split(None, 1)[0].upper()
            if keyword not in {'SELECT', 'PRAGMA', 'WITH', 'EXPLAIN'}:
                die(f'Read-only verification file contains a mutation statement at {index}: {keyword}')
            rows = query_json(statement, f'{filename} statement {index}/{len(statements)}')
            print(json.dumps(rows, ensure_ascii=False))
        else:
            run_remote_statement(statement, f'{filename} statement {index}/{len(statements)}')


def auth_probe() -> None:
    result = query_json('SELECT 1 AS development_d1_auth_probe;', 'Development D1 authentication probe')
    if len(result) != 1 or int(result[0].get('development_d1_auth_probe') or 0) != 1:
        die('Development D1 authentication probe did not return the expected value.')
    print('PASS — exact Development D1 query authentication')


def preflight_remote_schema() -> None:
    names = ','.join(f"'{name}'" for name in REQUIRED_BASE_TABLES)
    count = scalar_count(
        f"SELECT COUNT(*) AS required_base_count FROM sqlite_master WHERE type='table' AND name IN ({names});",
        'required_base_count',
        'Product lineage base-table preflight',
    )
    if count != len(REQUIRED_BASE_TABLES):
        die(f'Expected {len(REQUIRED_BASE_TABLES)} base tables before Product lineage migration, got {count}.')
    print('PASS — Product/Resource/Inventory base authorities are present')


def verify_remote_state() -> None:
    names = ','.join(f"'{name}'" for name in REQUIRED_LINEAGE_TABLES)
    count = scalar_count(
        f"SELECT COUNT(*) AS lineage_table_count FROM sqlite_master WHERE type='table' AND name IN ({names});",
        'lineage_table_count',
        'Release 448 lineage-table verification',
    )
    if count != len(REQUIRED_LINEAGE_TABLES):
        die(f'Expected {len(REQUIRED_LINEAGE_TABLES)} lineage tables, got {count}.')

    trigger_count = scalar_count(
        f"SELECT COUNT(*) AS lineage_trigger_count FROM sqlite_master WHERE type='trigger' AND name='{REQUIRED_TRIGGER}';",
        'lineage_trigger_count',
        'Release 448 new-product lineage trigger verification',
    )
    if trigger_count != 1:
        die('New Product lineage trigger is missing.')

    product_count = scalar_count('SELECT COUNT(*) AS product_count FROM products;', 'product_count', 'Product count verification')
    profile_count = scalar_count('SELECT COUNT(*) AS profile_count FROM product_lineage_profiles;', 'profile_count', 'Product lineage profile coverage')
    if profile_count != product_count:
        die(f'Product lineage profile coverage mismatch: products={product_count}, profiles={profile_count}.')

    invalid_exempt = scalar_count(
        "SELECT COUNT(*) AS invalid_exempt_count FROM product_lineage_profiles WHERE publication_policy='exempt' AND (lineage_status<>'exempt' OR materials_required<>0);",
        'invalid_exempt_count',
        'Exempt lineage policy verification',
    )
    if invalid_exempt:
        die(f'Invalid exempt lineage profile count: {invalid_exempt}.')

    fk_rows = query_json('PRAGMA foreign_key_check;', 'Foreign-key verification')
    if fk_rows:
        die(f'Foreign-key violations detected: {fk_rows[:5]}')

    print('PASS — Product lineage profile covers every existing Product')
    print('PASS — outside finished-good exemptions are internally consistent')
    print('PASS — new Product trigger is installed')
    print('PASS — foreign keys clean')


def main() -> int:
    parser = argparse.ArgumentParser(description='Release 448 Development-only Product lineage migration')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--auth-only', action='store_true', help='Run only a read-only exact Development D1 auth probe.')
    mode.add_argument('--verify-only', action='store_true', help='Do not apply; verify current Release 448 lineage authority.')
    mode.add_argument('--transport-preflight', action='store_true', help='Validate transport locally without contacting Cloudflare.')
    args = parser.parse_args()

    guard_exact_target()
    print(f'RELEASE {RELEASE} DEVELOPMENT PRODUCT LINEAGE')
    print(f'Database: {DATABASE_NAME} ({DATABASE_ID})')
    print('Inventory quantity mutation in migration: NONE')
    print('Automatic retries: NONE')
    print('R2/provider mutation: NONE')
    print('Production mutation capability: NONE')

    transport_preflight()
    if args.transport_preflight:
        print('RELEASE 448 PRODUCT LINEAGE TRANSPORT PREFLIGHT: PASS')
        return 0

    auth_probe()
    if args.auth_only:
        return 0

    preflight_remote_schema()
    if not args.verify_only:
        execute_file(MIGRATION, read_only=False)

    verify_remote_state()
    execute_file(VERIFICATION, read_only=True)

    print('\nRELEASE 448 DEVELOPMENT PRODUCT LINEAGE: PASS')
    print('Production mutation capability: NONE')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
