#!/usr/bin/env python3
"""Development-only root administrator module-access verification/repair.

The four non-I.T. modules remain role-derived `admin/manage`. I.T. remains explicit-user
only. When --repair is deliberately supplied, this script may upsert exactly one row:
the active root administrator's `it-platform` explicit `manage` grant. It performs no
schema changes, no R2 work, no provider work and has no Production target capability.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'wrangler.toml'
WRANGLER_VERSION = '4.128.0'
EXPECTED_DATABASE_NAME = 'devilndove-dev'
EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
EXPECTED_ACCOUNT_ID = 'c0d5bc25df16ae5b7d47c985c4b7b787'
BUSINESS_MODULES = ('storefront', 'creators', 'socials', 'financials')
IT_MODULE = 'it-platform'


def die(message: str, code: int = 2) -> None:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(code)


def npx() -> str:
    value = shutil.which('npx') or shutil.which('npx.cmd')
    if not value:
        die('npx is not available on PATH.')
    return value


def assert_source() -> None:
    text = CONFIG.read_text(encoding='utf-8')
    required = (
        'name = "devilndove-site"',
        'DND_ENVIRONMENT = "development"',
        f'database_name = "{EXPECTED_DATABASE_NAME}"',
        f'database_id = "{EXPECTED_DATABASE_ID}"',
        'bucket_name = "devilndove-toolshed-images-dev"',
        'bucket_name = "devilndove-caip-media-dev"',
    )
    missing = [token for token in required if token not in text]
    if missing:
        die(f'Development source authority drifted: {missing}')
    if 'account_id =' in text:
        die('Tracked wrangler.toml must not contain account_id.')


def run_d1(command: str) -> Any:
    env = os.environ.copy()
    env['CLOUDFLARE_ACCOUNT_ID'] = EXPECTED_ACCOUNT_ID
    args = [
        npx(), '--yes', f'wrangler@{WRANGLER_VERSION}', 'd1', 'execute', EXPECTED_DATABASE_NAME,
        '--remote', '--config', str(CONFIG), '--json', '--command', command,
    ]
    result = subprocess.run(args, cwd=ROOT, env=env, check=False, capture_output=True, text=True)
    if result.returncode:
        die('Development D1 command failed. No Production target is available to this script.', result.returncode)
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        die('Development D1 returned non-JSON output.')


def walk(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def row_with(payload: Any, keys: tuple[str, ...]) -> dict[str, Any] | None:
    for row in walk(payload):
        if all(key in row for key in keys):
            return row
    return None


def root_admin() -> dict[str, Any]:
    payload = run_d1("SELECT user_id,email,display_name,role,is_active FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1;")
    row = row_with(payload, ('user_id', 'role', 'is_active'))
    if not row or int(row.get('user_id') or 0) <= 0:
        die('No active administrator exists in Development D1.')
    return row


def verify(root_id: int) -> dict[str, Any]:
    quoted = ','.join(f"'{key}'" for key in BUSINESS_MODULES)
    payload = run_d1(
        "SELECT "
        f"(SELECT COUNT(*) FROM app_module_role_access WHERE role_code='admin' AND module_key IN ({quoted}) AND is_allowed=1 AND access_level='manage') AS business_admin_manage, "
        "(SELECT COUNT(*) FROM app_module_role_access WHERE module_key='it-platform' AND is_allowed<>0) AS it_role_grants, "
        f"(SELECT COUNT(*) FROM app_module_user_access WHERE module_key='it-platform' AND user_id={int(root_id)} AND is_allowed=1 AND access_level='manage') AS root_it_manage, "
        f"(SELECT COUNT(*) FROM app_module_user_access WHERE user_id={int(root_id)} AND is_allowed=0 AND module_key IN ({quoted})) AS root_explicit_business_denials, "
        "(SELECT COUNT(*) FROM app_modules WHERE is_enabled=1) AS enabled_modules;"
    )
    row = row_with(payload, ('business_admin_manage', 'it_role_grants', 'root_it_manage', 'root_explicit_business_denials', 'enabled_modules'))
    if not row:
        die('Could not read Development root-admin module authority.')
    compact = {key: int(row.get(key) or 0) for key in ('business_admin_manage', 'it_role_grants', 'root_it_manage', 'root_explicit_business_denials', 'enabled_modules')}
    compact['root_admin_full_manage'] = (
        compact['business_admin_manage'] == len(BUSINESS_MODULES)
        and compact['it_role_grants'] == 0
        and compact['root_it_manage'] == 1
        and compact['root_explicit_business_denials'] == 0
        and compact['enabled_modules'] == 5
    )
    return compact


def repair(root_id: int) -> None:
    # Deliberately narrow DML: one recovery invariant row. No schema DDL.
    run_d1(
        "INSERT INTO app_module_user_access(module_key,user_id,is_allowed,access_level,created_at,updated_at) "
        f"VALUES('it-platform',{int(root_id)},1,'manage',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) "
        "ON CONFLICT(module_key,user_id) DO UPDATE SET is_allowed=1,access_level='manage',updated_at=CURRENT_TIMESTAMP;"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--verify-only', action='store_true', help='Read-only verification; this is the default.')
    mode.add_argument('--repair', action='store_true', help='Restore only the active root administrator explicit I.T. manage grant if needed.')
    args = parser.parse_args()

    assert_source()
    print('RELEASE 467 ROOT ADMIN ACCESS AUTHORITY')
    print(f'Development D1: {EXPECTED_DATABASE_NAME} / {EXPECTED_DATABASE_ID}')
    print('Production mutation capability: NONE')
    print('R2/provider mutation capability: NONE')
    admin = root_admin()
    root_id = int(admin['user_id'])
    before = verify(root_id)
    if before['root_admin_full_manage']:
        print('ROOT ADMIN MODULE AUTHORITY: PASS')
        print(json.dumps(before, sort_keys=True))
        return 0
    if not args.repair:
        print('ROOT ADMIN MODULE AUTHORITY: HOLD — explicit recovery repair is required.')
        print(json.dumps(before, sort_keys=True))
        return 1

    if before['business_admin_manage'] != len(BUSINESS_MODULES) or before['it_role_grants'] != 0 or before['root_explicit_business_denials'] != 0 or before['enabled_modules'] != 5:
        die('Root-admin access drift is broader than the one allowed I.T. explicit-grant repair. Refusing mutation.')
    repair(root_id)
    after = verify(root_id)
    if not after['root_admin_full_manage']:
        die('Root-admin I.T. repair did not produce full effective manage authority.')
    print('ROOT ADMIN MODULE AUTHORITY: PASS — explicit I.T. manage recovery grant restored.')
    print(json.dumps(after, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
