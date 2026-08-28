#!/usr/bin/env python3
"""Current Development-only D1 platform-convergence runner.

Release authority: Development `devilndove-dev` only.
Production is not a supported target. Statements execute one-by-one through the
proven Wrangler transport with no automatic retry. The runner is idempotent and
verifies canonical module, carousel, explicit I.T.-access and foreign-key state.
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

# Reuse the proven cross-platform Wrangler transport while current release source
# converges on a single generic runner. Historical build identity is not part of
# this runner's release contract.
from build440_apply_development_d1 import (  # noqa: E402
    DATABASE_ID,
    DATABASE_NAME,
    WINDOWS_SAFE_COMMAND_LINE_LIMIT,
    assert_development_config,
    build_wrangler_query_args,
    prepared_remote_statements,
    statement_fingerprint,
)

RELEASE = 447
MIGRATION = 'database_platform_convergence.sql'
VERIFICATION = 'PLATFORM_CONVERGENCE_D1_VERIFICATION.sql'
EXPECTED_DATABASE_NAME = 'devilndove-dev'
EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
CANONICAL_MODULES = ('storefront', 'creators', 'socials', 'financials', 'it-platform')
LEGACY_MODULES = ('commerce-operations', 'creative-production', 'business-administration')


def die(message: str, code: int = 2) -> NoReturn:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(code)


def guard_exact_target() -> None:
    assert_development_config()
    if DATABASE_NAME != EXPECTED_DATABASE_NAME or DATABASE_ID != EXPECTED_DATABASE_ID:
        die('Imported D1 transport authority no longer points at the exact Development database.')
    lowered = DATABASE_NAME.lower()
    if 'prod' in lowered or 'production' in lowered:
        die('Production target detected. This runner is Development-only.')


def extract_rows(payload: Any) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if isinstance(payload, list):
        for item in payload:
            rows.extend(extract_rows(item))
        return rows
    if not isinstance(payload, dict):
        return rows
    if isinstance(payload.get('results'), list):
        rows.extend(row for row in payload['results'] if isinstance(row, dict))
    result = payload.get('result')
    if isinstance(result, dict):
        rows.extend(extract_rows(result))
    elif isinstance(result, list):
        for item in result:
            rows.extend(extract_rows(item))
    return rows


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
        payload = json.loads(raw)
    except json.JSONDecodeError:
        print(raw)
        die(f'Wrangler returned non-JSON output: {label}')
    return extract_rows(payload)


def scalar_count(sql: str, field: str, label: str) -> int:
    rows = query_json(sql, label)
    if len(rows) != 1 or field not in rows[0]:
        die(f'Expected exactly one {field} result row: {label}')
    try:
        return int(rows[0][field])
    except (TypeError, ValueError):
        die(f'Expected integer {field}: {label}')


def transport_preflight() -> None:
    print('\nCURRENT DEVELOPMENT D1 TRANSPORT PREFLIGHT')
    total = 0
    for filename in (MIGRATION, VERIFICATION):
        statements, skipped = prepared_remote_statements(filename)
        for statement in statements:
            build_wrangler_query_args(statement)
            if '\n' in statement or '\r' in statement or not sqlite3.complete_statement(statement):
                die(f'Final transport statement failed completeness guard in {filename}.')
        longest = max(len(statement) for statement in statements)
        total += len(statements)
        print(
            f'PASS — {filename}: {len(statements)} complete single-line remote statements, '
            f'{len(skipped)} deliberate skips, longest={longest} chars'
        )
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
    rows = query_json('SELECT 1 AS development_d1_auth_probe;', 'Development D1 authentication probe')
    if len(rows) != 1 or int(rows[0].get('development_d1_auth_probe') or 0) != 1:
        die('Development D1 authentication probe did not return the expected value.')
    print('PASS — Development D1 query authentication')


def preflight_remote_schema() -> None:
    users = scalar_count(
        "SELECT COUNT(*) AS users_table_count FROM sqlite_master WHERE type='table' AND name='users';",
        'users_table_count',
        'Required users-table preflight',
    )
    if users != 1:
        die('Required users authority is missing; refusing platform convergence.')
    active_admins = scalar_count(
        "SELECT COUNT(*) AS active_admin_count FROM users WHERE is_active=1 AND LOWER(TRIM(role))='admin';",
        'active_admin_count',
        'Active administrator lockout preflight',
    )
    if active_admins < 1:
        die('No active administrator exists; refusing migration to avoid inaccessible I.T. authority.')
    print(f'PASS — active administrators available for explicit I.T. bootstrap: {active_admins}')


def verify_remote_state() -> None:
    module_rows = query_json(
        "SELECT module_key FROM app_modules ORDER BY module_key;",
        'Canonical module registry verification',
    )
    module_keys = sorted(str(row.get('module_key') or '') for row in module_rows)
    expected_keys = sorted(CANONICAL_MODULES)
    if module_keys != expected_keys:
        die(f'Canonical module registry mismatch. Expected {expected_keys}, got {module_keys}.')

    legacy_count = scalar_count(
        "SELECT COUNT(*) AS legacy_count FROM app_modules WHERE module_key IN ('commerce-operations','creative-production','business-administration');",
        'legacy_count',
        'Legacy module retirement verification',
    )
    if legacy_count != 0:
        die(f'Legacy module rows remain after convergence: {legacy_count}')

    role_rows = scalar_count(
        "SELECT COUNT(*) AS canonical_role_count FROM app_module_role_access WHERE module_key IN ('storefront','creators','socials','financials','it-platform') AND role_code IN ('member','admin');",
        'canonical_role_count',
        'Canonical role authority verification',
    )
    if role_rows != 10:
        die(f'Expected 10 canonical role rows, got {role_rows}.')

    it_role_grants = scalar_count(
        "SELECT COUNT(*) AS it_role_grant_count FROM app_module_role_access WHERE module_key='it-platform' AND is_allowed<>0;",
        'it_role_grant_count',
        'I.T. role-denial verification',
    )
    if it_role_grants != 0:
        die('I.T. role-derived access must remain denied.')

    active_it_managers = scalar_count(
        "SELECT COUNT(*) AS active_it_manager_count FROM app_module_user_access a INNER JOIN users u ON u.user_id=a.user_id WHERE a.module_key='it-platform' AND a.is_allowed=1 AND a.access_level='manage' AND u.is_active=1;",
        'active_it_manager_count',
        'Active explicit I.T. manager verification',
    )
    if active_it_managers < 1:
        die('No active explicit I.T. manager exists after platform convergence.')

    required_tables = scalar_count(
        "SELECT COUNT(*) AS required_table_count FROM sqlite_master WHERE type='table' AND name IN ('app_modules','app_module_role_access','app_module_user_access','home_carousel_slides','home_carousel_events');",
        'required_table_count',
        'Required platform-table verification',
    )
    if required_tables != 5:
        die(f'Expected all five required platform tables, got {required_tables}.')

    fk_rows = query_json('PRAGMA foreign_key_check;', 'Foreign-key verification')
    if fk_rows:
        die(f'Foreign-key violations detected: {fk_rows[:5]}')

    print('PASS — exact five-module registry')
    print('PASS — legacy module registry rows retired')
    print('PASS — canonical role authority: 10 rows')
    print('PASS — role-derived I.T. access denied')
    print(f'PASS — active explicit I.T. managers: {active_it_managers}')
    print('PASS — Storefront carousel/platform tables present')
    print('PASS — foreign keys clean')


def main() -> int:
    parser = argparse.ArgumentParser(description='Current Development-only D1 platform convergence runner')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--auth-only', action='store_true', help='Run only a read-only Development D1 auth probe.')
    mode.add_argument('--verify-only', action='store_true', help='Do not apply; verify current remote platform authority.')
    mode.add_argument('--transport-preflight', action='store_true', help='Validate exact transport locally without contacting Cloudflare.')
    args = parser.parse_args()

    guard_exact_target()
    print(f'RELEASE {RELEASE} DEVELOPMENT D1 PLATFORM CONVERGENCE')
    print(f'Database: {DATABASE_NAME} ({DATABASE_ID})')
    print('Execution: statement-by-statement Wrangler remote query transport')
    print('Automatic retries: NONE')
    print('R2/provider mutation: NONE')
    print('Production mutation capability: NONE')

    transport_preflight()
    if args.transport_preflight:
        print('CURRENT DEVELOPMENT D1 TRANSPORT PREFLIGHT: PASS')
        return 0

    auth_probe()
    if args.auth_only:
        return 0

    preflight_remote_schema()
    if not args.verify_only:
        execute_file(MIGRATION, read_only=False)

    verify_remote_state()
    execute_file(VERIFICATION, read_only=True)

    print('\nRELEASE 447 DEVELOPMENT D1 PLATFORM CONVERGENCE: PASS')
    print('Production mutation capability: NONE')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
