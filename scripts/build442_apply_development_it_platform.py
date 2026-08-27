#!/usr/bin/env python3
"""Build 442 guarded Development D1 I.T. module migration runner.

This is deliberately narrower than the Build 440 lot/receiving runner. It reuses the
proven Windows-safe Wrangler query transport, hard-coded Development D1 target and SQL
normalization from Build 440, then adds Build 442-specific pre/post conditions.

Production is not a supported target. There are no automatic retries and no request-time DDL.
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

from build440_apply_development_d1 import (  # noqa: E402
    DATABASE_ID,
    DATABASE_NAME,
    WINDOWS_SAFE_COMMAND_LINE_LIMIT,
    assert_development_config,
    build_wrangler_query_args,
    execute_sql_file,
    normalize_remote_statement,
    prepared_remote_statements,
    statement_fingerprint,
)

MIGRATION = 'database_build442_it_platform_user_access.sql'
VERIFICATION = 'BUILD442_IT_PLATFORM_D1_VERIFICATION.sql'
EXPECTED_DATABASE_NAME = 'devilndove-dev'
EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'


def die(message: str, code: int = 2) -> NoReturn:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(code)


def guard_exact_target() -> None:
    assert_development_config()
    if DATABASE_NAME != EXPECTED_DATABASE_NAME or DATABASE_ID != EXPECTED_DATABASE_ID:
        die('Imported D1 transport authority no longer points at the exact Development database.')
    lowered = DATABASE_NAME.lower()
    if 'prod' in lowered or 'production' in lowered:
        die('Production target detected. Build 442 I.T. migration runner is Development-only.')


def normalized(sql: str) -> str:
    value, reason = normalize_remote_statement(sql)
    if value is None:
        die(f'Build 442 query unexpectedly normalized to a skip: {reason}')
    return value


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
    sql = normalized(sql)
    args = build_wrangler_query_args(sql) + ['--json']
    if len(subprocess.list2cmdline(args)) > WINDOWS_SAFE_COMMAND_LINE_LIMIT:
        die(f'Build 442 JSON query command exceeds Windows transport ceiling: {label}')
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
        die(f'Wrangler returned non-JSON output for guarded query: {label}')
    return extract_rows(payload)


def scalar_count(sql: str, field: str, label: str) -> int:
    rows = query_json(sql, label)
    if len(rows) != 1 or field not in rows[0]:
        die(f'Expected exactly one {field} result row: {label}')
    try:
        return int(rows[0][field])
    except (TypeError, ValueError):
        die(f'Expected integer {field}: {label}')


def preflight_transport() -> None:
    print('\nBUILD 442 I.T. PLATFORM D1 FINAL TRANSPORT PREFLIGHT')
    for filename in (MIGRATION, VERIFICATION):
        statements, skipped = prepared_remote_statements(filename)
        for statement in statements:
            build_wrangler_query_args(statement)
            if '\n' in statement or '\r' in statement or not sqlite3.complete_statement(statement):
                die(f'Final transport statement failed completeness guard in {filename}.')
        longest = max(len(statement) for statement in statements)
        print(
            f'PASS — {filename}: {len(statements)} complete single-line remote statements, '
            f'{len(skipped)} deliberate skips, longest={longest} chars'
        )


def preflight_remote_schema() -> None:
    rows = query_json(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('app_modules','app_module_role_access','users') ORDER BY name;",
        'Build 442 required base-table preflight',
    )
    names = {str(row.get('name') or '') for row in rows}
    expected = {'app_modules', 'app_module_role_access', 'users'}
    if names != expected:
        die(f'Build 442 base schema is incomplete. Expected {sorted(expected)}, got {sorted(names)}.')
    active_admins = scalar_count(
        "SELECT COUNT(*) AS active_admin_count FROM users WHERE is_active=1 AND LOWER(TRIM(role))='admin';",
        'active_admin_count',
        'Build 442 active-admin lockout preflight',
    )
    if active_admins < 1:
        die('No active administrator exists. Refusing I.T. grant bootstrap to avoid an inaccessible module.')
    print(f'PASS — active administrators available for one-time explicit I.T. bootstrap: {active_admins}')


def verify_remote_state() -> None:
    module_rows = query_json(
        "SELECT module_key,display_name,is_enabled,requires_login,default_route,load_priority,background_activity_enabled FROM app_modules WHERE module_key='it-platform';",
        'Build 442 I.T. module row verification',
    )
    if len(module_rows) != 1:
        die('Expected exactly one it-platform module row.')
    module = module_rows[0]
    expected_module = {
        'module_key': 'it-platform',
        'display_name': 'I.T. & Platform',
        'is_enabled': 1,
        'requires_login': 1,
        'default_route': '/admin/it-platform/',
        'load_priority': 40,
        'background_activity_enabled': 0,
    }
    for key, expected in expected_module.items():
        actual = module.get(key)
        if isinstance(expected, int):
            try:
                actual = int(actual)
            except (TypeError, ValueError):
                pass
        if actual != expected:
            die(f'I.T. module row mismatch for {key}: expected {expected!r}, got {actual!r}.')

    role_rows = query_json(
        "SELECT role_code,is_allowed,access_level FROM app_module_role_access WHERE module_key='it-platform' ORDER BY role_code;",
        'Build 442 I.T. role-denial verification',
    )
    shaped = sorted((str(r.get('role_code')), int(r.get('is_allowed') or 0), str(r.get('access_level'))) for r in role_rows)
    if shaped != [('admin', 0, 'none'), ('member', 0, 'none')]:
        die(f'I.T. role rows must deny role-derived access. Got: {shaped}')

    managers = scalar_count(
        "SELECT COUNT(*) AS active_it_manager_count FROM app_module_user_access aua INNER JOIN users u ON u.user_id=aua.user_id WHERE aua.module_key='it-platform' AND aua.is_allowed=1 AND aua.access_level='manage' AND u.is_active=1;",
        'active_it_manager_count',
        'Build 442 active explicit I.T. manager verification',
    )
    if managers < 1:
        die('No active explicit I.T. manager exists after Build 442 migration.')

    fk_rows = query_json('PRAGMA foreign_key_check;', 'Build 442 foreign-key verification')
    if fk_rows:
        die(f'Build 442 foreign-key verification returned violations: {fk_rows[:5]}')

    print('PASS — it-platform module row exact')
    print('PASS — role-derived I.T. access denied')
    print(f'PASS — active explicit I.T. managers: {managers}')
    print('PASS — foreign keys clean')


def main() -> int:
    parser = argparse.ArgumentParser(description='Build 442 Development-only I.T. platform D1 runner')
    parser.add_argument('--auth-only', action='store_true', help='Run only a read-only Development D1 auth probe.')
    parser.add_argument('--verify-only', action='store_true', help='Do not apply; verify the current Build 442 I.T. authority only.')
    args = parser.parse_args()
    if args.auth_only and args.verify_only:
        die('Choose only one of --auth-only or --verify-only.')

    guard_exact_target()
    print('BUILD 442 DEVELOPMENT I.T. PLATFORM D1 GUARDED RUNNER')
    print(f'Database: {DATABASE_NAME} ({DATABASE_ID})')
    print('Transport: proven Build 440 single-line Wrangler D1 query authority')
    print('Automatic retries: NONE')
    print('Bulk import: NONE')
    print('R2/provider mutation: NONE')
    print('Production mutation capability: NONE')

    if args.auth_only:
        rows = query_json('SELECT 1 AS build442_development_query_auth_probe;', 'Build 442 Development D1 auth probe')
        if not rows or int(rows[0].get('build442_development_query_auth_probe') or 0) != 1:
            die('Development D1 auth probe did not return the expected value.')
        print('BUILD 442 DEVELOPMENT D1 QUERY AUTH: PASS')
        return 0

    preflight_transport()
    preflight_remote_schema()

    if not args.verify_only:
        execute_sql_file(MIGRATION, read_only=False)

    verify_remote_state()
    execute_sql_file(VERIFICATION, read_only=True)

    print('\nBUILD 442 DEVELOPMENT I.T. PLATFORM D1 APPLY/VERIFY: PASS')
    print('Runtime enforcement activation: NOT PART OF THIS PHASE')
    print('Production mutation: NONE')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
