#!/usr/bin/env python3
"""Read-only Cloudflare Development account/resource preflight and safe runner wrapper.

Purpose
-------
Make the recurring D1/R2 authentication problem explicit before any database write.
The wrapper pins the one Development account, reports the active Wrangler credential
source without printing credentials, verifies access to the exact Development D1 and
both R2 buckets, then optionally launches the canonical platform-convergence runner.

No Cloudflare mutation is performed by this file. D1 mutation happens only if this
preflight passes and the child convergence runner is invoked without --auth-only or
--verify-only.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any, NoReturn

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'wrangler.toml'
WRANGLER_VERSION = '4.126.0'
EXPECTED_ACCOUNT_ID = 'c0d5bc25df16ae5b7d47c985c4b7b787'
EXPECTED_DATABASE_NAME = 'devilndove-dev'
EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
EXPECTED_R2_BUCKETS = (
    'devilndove-toolshed-images-dev',
    'devilndove-caip-media-dev',
)
CHILD_RUNNER = ROOT / 'scripts' / 'apply_development_platform_convergence.py'
AUTH_ENV_KEYS = ('CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_API_KEY', 'CLOUDFLARE_EMAIL')


def die(message: str, code: int = 2) -> NoReturn:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(code)


def npx_executable() -> str:
    executable = shutil.which('npx.cmd') or shutil.which('npx')
    if not executable:
        die('npx is not available on PATH.')
    return executable


def assert_source_authority() -> None:
    text = CONFIG.read_text(encoding='utf-8')
    required = (
        'name = "devilndove-site-dev"',
        f'database_name = "{EXPECTED_DATABASE_NAME}"',
        f'database_id = "{EXPECTED_DATABASE_ID}"',
        'bucket_name = "devilndove-toolshed-images-dev"',
        'bucket_name = "devilndove-caip-media-dev"',
    )
    missing = [marker for marker in required if marker not in text]
    if missing:
        die(f'wrangler.toml Development authority drifted: missing {missing}')
    if 'account_id =' in text:
        die('Pages wrangler.toml must not contain account_id. Local tooling pins CLOUDFLARE_ACCOUNT_ID instead.')
    if 'prod' in EXPECTED_DATABASE_NAME.lower() or 'production' in EXPECTED_DATABASE_NAME.lower():
        die('Production target detected. This preflight is Development-only.')


def credential_source(auth_mode: str) -> str:
    if auth_mode == 'oauth':
        return 'Wrangler OAuth (environment API credentials suppressed for this process)'
    if os.environ.get('CLOUDFLARE_API_TOKEN'):
        return 'CLOUDFLARE_API_TOKEN environment variable'
    if os.environ.get('CLOUDFLARE_API_KEY') or os.environ.get('CLOUDFLARE_EMAIL'):
        return 'legacy CLOUDFLARE_API_KEY/CLOUDFLARE_EMAIL environment variables'
    return 'Wrangler OAuth/login session'


def build_env(auth_mode: str) -> dict[str, str]:
    env = os.environ.copy()
    # Deterministically select the one Development account for all Wrangler child calls.
    env['CLOUDFLARE_ACCOUNT_ID'] = EXPECTED_ACCOUNT_ID
    if auth_mode == 'oauth':
        for key in AUTH_ENV_KEYS:
            env.pop(key, None)
    return env


def wrangler_args(*parts: str) -> list[str]:
    return [
        npx_executable(),
        '--yes',
        f'wrangler@{WRANGLER_VERSION}',
        *parts,
        '--config',
        str(CONFIG),
    ]


def run_capture(parts: tuple[str, ...], *, label: str, env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    print(f'\n--- {label} ---', flush=True)
    return subprocess.run(
        wrangler_args(*parts),
        cwd=ROOT,
        env=env,
        check=False,
        capture_output=True,
        text=True,
    )


def parse_json_output(result: subprocess.CompletedProcess[str], label: str) -> Any:
    raw = (result.stdout or '').strip()
    if not raw:
        die(f'{label} returned no JSON output.')
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        die(f'{label} returned non-JSON output; inspect Wrangler locally without sharing credentials.')


def auth_failure_message(auth_mode: str, result: subprocess.CompletedProcess[str]) -> str:
    combined = f'{result.stdout or ""}\n{result.stderr or ""}'.lower()
    unauthorized = '7403' in combined or 'not authorized' in combined or 'not valid' in combined
    if auth_mode == 'oauth':
        if unauthorized:
            return (
                'Wrangler OAuth is authenticated but is not authorized for the pinned Development account. '
                'Run `npx wrangler logout`, then `npx wrangler login`, sign into the Cloudflare account that owns '
                '`devilndove-site-dev`, and rerun this preflight.'
            )
        return (
            'Wrangler OAuth is not usable for the pinned Development account. Run `npx wrangler login` and rerun '
            '`python scripts/cloudflare_development_access.py --auth-only --auth-mode oauth`.'
        )
    if os.environ.get('CLOUDFLARE_API_TOKEN'):
        return (
            'The active CLOUDFLARE_API_TOKEN is not authorized for the pinned Development account/D1 resource. '
            'Wrangler gives this environment token precedence over OAuth. Replace it with a Development token that '
            'has D1 and R2 access, or rerun with `--auth-mode oauth` to deliberately ignore the environment token.'
        )
    if unauthorized:
        return (
            'The active Wrangler credential is not authorized for the pinned Development account. Reauthenticate with '
            '`npx wrangler login` or supply a Development-scoped CLOUDFLARE_API_TOKEN with D1 and R2 access.'
        )
    return 'Wrangler authentication/account membership preflight failed.'


def whoami_preflight(auth_mode: str, env: dict[str, str]) -> None:
    result = run_capture(
        ('whoami', '--account', EXPECTED_ACCOUNT_ID, '--json'),
        label='Wrangler account membership preflight',
        env=env,
    )
    if result.returncode:
        die(auth_failure_message(auth_mode, result), result.returncode)
    payload = parse_json_output(result, 'wrangler whoami')
    # Do not print the payload. It may contain user/account metadata; only record PASS.
    if not payload:
        die('Wrangler account membership preflight returned an empty result.')
    print('PASS — Wrangler credential is accepted for the pinned Development account')


def d1_preflight(env: dict[str, str]) -> None:
    result = run_capture(
        ('d1', 'info', EXPECTED_DATABASE_NAME, '--json'),
        label='Development D1 visibility preflight',
        env=env,
    )
    if result.returncode:
        die('Wrangler cannot read the exact Development D1 database. No D1 write was attempted.', result.returncode)
    payload = parse_json_output(result, 'wrangler d1 info')
    rows = payload if isinstance(payload, list) else [payload]
    flattened: list[dict[str, Any]] = []
    for item in rows:
        if isinstance(item, dict):
            flattened.append(item)
            result_value = item.get('result')
            if isinstance(result_value, dict):
                flattened.append(result_value)
    ids = {str(row.get('uuid') or row.get('id') or '') for row in flattened}
    names = {str(row.get('name') or '') for row in flattened}
    if EXPECTED_DATABASE_ID not in ids or EXPECTED_DATABASE_NAME not in names:
        die('D1 info returned a resource other than the exact Development database; refusing to continue.')
    print(f'PASS — D1 visible: {EXPECTED_DATABASE_NAME} ({EXPECTED_DATABASE_ID})')


def r2_preflight(env: dict[str, str]) -> None:
    for bucket in EXPECTED_R2_BUCKETS:
        result = run_capture(
            ('r2', 'bucket', 'info', bucket, '--json'),
            label=f'R2 visibility preflight: {bucket}',
            env=env,
        )
        if result.returncode:
            die(f'Wrangler cannot read Development R2 bucket `{bucket}`. No R2 mutation was attempted.', result.returncode)
        payload = parse_json_output(result, f'wrangler r2 bucket info {bucket}')
        raw = json.dumps(payload, ensure_ascii=False)
        if bucket not in raw:
            die(f'R2 info did not resolve the expected Development bucket `{bucket}`.')
        print(f'PASS — R2 visible: {bucket}')


def run_child(args: argparse.Namespace, env: dict[str, str]) -> int:
    if not CHILD_RUNNER.exists():
        die(f'Canonical child runner is missing: {CHILD_RUNNER.relative_to(ROOT)}')
    command = [sys.executable, str(CHILD_RUNNER)]
    if args.verify_only:
        command.append('--verify-only')
    elif args.auth_only:
        command.append('--auth-only')
    elif args.transport_preflight:
        command.append('--transport-preflight')
    print('\nLaunching canonical Development platform convergence runner…', flush=True)
    result = subprocess.run(command, cwd=ROOT, env=env, check=False)
    return int(result.returncode)


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Development-only Cloudflare D1/R2 access preflight and platform-convergence wrapper'
    )
    parser.add_argument(
        '--auth-mode',
        choices=('auto', 'oauth'),
        default='auto',
        help='auto respects Cloudflare environment credentials; oauth suppresses them and uses `wrangler login`.',
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--auth-only', action='store_true', help='Verify Cloudflare account, D1 and R2 read access only.')
    mode.add_argument('--verify-only', action='store_true', help='After access preflight, run D1 state verification only.')
    mode.add_argument('--transport-preflight', action='store_true', help='Run only local SQL transport checks; no Cloudflare contact.')
    args = parser.parse_args()

    assert_source_authority()
    print('RELEASE 447 DEVELOPMENT CLOUDFLARE ACCESS AUTHORITY')
    print('Target: Development only')
    print(f'Credential source: {credential_source(args.auth_mode)}')
    print('Credentials printed: NEVER')
    print('Production mutation capability: NONE')

    if args.transport_preflight:
        return run_child(args, build_env(args.auth_mode))

    env = build_env(args.auth_mode)
    inherited_account = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
    if inherited_account and inherited_account != EXPECTED_ACCOUNT_ID:
        print('NOTICE — an inherited CLOUDFLARE_ACCOUNT_ID differs from Development and is being overridden safely.')

    whoami_preflight(args.auth_mode, env)
    d1_preflight(env)
    r2_preflight(env)
    print('\nDEVELOPMENT CLOUDFLARE READ ACCESS PREFLIGHT: PASS')

    if args.auth_only:
        return 0
    return run_child(args, env)


if __name__ == '__main__':
    raise SystemExit(main())
