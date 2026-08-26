#!/usr/bin/env python3
"""Build 438 Development-only module activation migration helper.

Hard-pinned to devilndove-dev and its known D1 UUID. This helper has no Production
mode and refuses to run outside branch `dev` or against a different wrangler.toml.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'wrangler.toml'
MIGRATION = ROOT / 'database_build438_application_module_activation.sql'
VERIFY = ROOT / 'BUILD438_D1_VERIFICATION.sql'
DATABASE = 'devilndove-dev'
EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
WRANGLER_VERSION = '4.126.0'


def fail(message: str, code: int = 1) -> None:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(code)


def run(args: list[str]) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
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
    print(result.stdout, end='' if result.stdout.endswith('\n') else '\n')
    return result


def npx() -> str:
    value = shutil.which('npx.cmd') or shutil.which('npx')
    if not value:
        fail('npx was not found on PATH.')
    return value


def require_dev_branch() -> None:
    result = subprocess.run(
        ['git', 'branch', '--show-current'], cwd=ROOT, text=True,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False,
    )
    if result.returncode != 0:
        fail('Could not determine the current Git branch.')
    branch = result.stdout.strip()
    if branch != 'dev':
        fail(f'Build 438 Development helper requires branch dev, found {branch or "unknown"}.')


def require_exact_dev_config() -> None:
    if not CONFIG.exists():
        fail('wrangler.toml is missing.')
    text = CONFIG.read_text(encoding='utf-8')
    name_match = re.search(r'^\s*database_name\s*=\s*"([^"]+)"', text, flags=re.MULTILINE)
    id_match = re.search(r'^\s*database_id\s*=\s*"([^"]+)"', text, flags=re.MULTILINE)
    database_name = name_match.group(1).strip() if name_match else ''
    database_id = id_match.group(1).strip() if id_match else ''
    if database_name != DATABASE or database_id != EXPECTED_DATABASE_ID:
        fail(
            'Build 438 helper target mismatch. '
            f'Expected {DATABASE} ({EXPECTED_DATABASE_ID}), found '
            f'{database_name or "missing"} ({database_id or "missing"}).'
        )


def command(file_path: Path) -> list[str]:
    return [
        npx(), '--yes', f'wrangler@{WRANGLER_VERSION}',
        'd1', 'execute', DATABASE,
        '--remote', '--config', str(CONFIG), '--file', str(file_path), '--yes',
    ]


def auth_check() -> None:
    result = run([npx(), '--yes', f'wrangler@{WRANGLER_VERSION}', 'whoami'])
    if result.returncode != 0:
        fail('Wrangler authentication check failed. No D1 command was attempted.')


def apply() -> None:
    if not MIGRATION.exists():
        fail(f'Missing migration: {MIGRATION.name}')
    print('=== BUILD 438 DEVELOPMENT MODULE AUTHORITY APPLY ===')
    print(f'Target: {DATABASE} ({EXPECTED_DATABASE_ID})')
    print('Production target capability: NONE')
    result = run(command(MIGRATION))
    if result.returncode != 0:
        lower = (result.stdout or '').lower()
        if '7403' in lower or '7500' in lower or 'not authorized' in lower or 'sqlite_auth' in lower:
            fail('Cloudflare authorization blocked the Development migration. Treat this as an access interruption; do not infer schema failure.')
        fail(f'Development migration failed with exit code {result.returncode}.')
    print('BUILD 438 DEVELOPMENT MODULE AUTHORITY APPLY: PASS')


def verify() -> None:
    if not VERIFY.exists():
        fail(f'Missing verification SQL: {VERIFY.name}')
    print('=== BUILD 438 DEVELOPMENT MODULE AUTHORITY READ-ONLY VERIFICATION ===')
    print(f'Target: {DATABASE} ({EXPECTED_DATABASE_ID})')
    result = run(command(VERIFY))
    if result.returncode != 0:
        lower = (result.stdout or '').lower()
        if '7403' in lower or '7500' in lower or 'not authorized' in lower or 'sqlite_auth' in lower:
            fail('Cloudflare authorization blocked the Development verification. Treat this as an access interruption; no Production action is implied.')
        fail(f'Development verification failed with exit code {result.returncode}.')
    print('BUILD 438 DEVELOPMENT MODULE AUTHORITY READ-ONLY VERIFICATION: PASS')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='Apply the additive Build 438 migration to Development only.')
    parser.add_argument('--verify', action='store_true', help='Run the read-only Build 438 verification against Development only.')
    parser.add_argument('--apply-and-verify', action='store_true', help='Apply then verify Development in one guarded invocation.')
    args = parser.parse_args()

    if sum(bool(v) for v in (args.apply, args.verify, args.apply_and_verify)) != 1:
        parser.error('Choose exactly one of --apply, --verify, or --apply-and-verify.')

    require_dev_branch()
    require_exact_dev_config()
    auth_check()

    if args.apply or args.apply_and_verify:
        apply()
    if args.verify or args.apply_and_verify:
        verify()

    print('Production D1 mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
