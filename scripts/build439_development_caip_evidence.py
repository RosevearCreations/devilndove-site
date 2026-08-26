#!/usr/bin/env python3
"""Build 439 Development-only CAIP temporal evidence migration/apply verifier.

Hard-pinned to branch dev and devilndove-dev. No Production mode exists.
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
MIGRATION = ROOT / 'database_build439_caip_temporal_evidence_review.sql'
VERIFY = ROOT / 'BUILD439_D1_VERIFICATION.sql'
STRICT_VERIFY = ROOT / 'BUILD439_D1_STRICT_VERIFICATION.sql'
DATABASE = 'devilndove-dev'
EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
WRANGLER_VERSION = '4.126.0'


def fail(message: str, code: int = 1) -> None:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(code)


def emit_output(value: str, *, stream=None) -> None:
    target = stream or sys.stdout
    raw = str(value or '')
    encoding = getattr(target, 'encoding', None) or 'utf-8'
    try:
        safe = raw.encode(encoding, errors='replace').decode(encoding, errors='replace')
    except LookupError:
        safe = raw.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    target.write(safe)
    if raw and not raw.endswith('\n'):
        target.write('\n')
    target.flush()


def run(args: list[str], *, echo: bool = True) -> subprocess.CompletedProcess[str]:
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
    if echo:
        emit_output(result.stdout)
    return result


def npx() -> str:
    value = shutil.which('npx.cmd') or shutil.which('npx')
    if not value:
        fail('npx was not found on PATH.')
    return value


def require_dev_branch() -> None:
    result = run(['git', 'branch', '--show-current'], echo=False)
    if result.returncode != 0:
        fail('Could not determine the current Git branch.')
    branch = result.stdout.strip()
    if branch != 'dev':
        fail(f'Build 439 Development helper requires branch dev, found {branch or "unknown"}.')


def require_exact_dev_config() -> None:
    if not CONFIG.exists():
        fail('wrangler.toml is missing.')
    source = CONFIG.read_text(encoding='utf-8')
    name_match = re.search(r'^\s*database_name\s*=\s*"([^"]+)"', source, flags=re.MULTILINE)
    id_match = re.search(r'^\s*database_id\s*=\s*"([^"]+)"', source, flags=re.MULTILINE)
    database_name = name_match.group(1).strip() if name_match else ''
    database_id = id_match.group(1).strip() if id_match else ''
    if database_name != DATABASE or database_id != EXPECTED_DATABASE_ID:
        fail(
            'Build 439 helper target mismatch. '
            f'Expected {DATABASE} ({EXPECTED_DATABASE_ID}), found '
            f'{database_name or "missing"} ({database_id or "missing"}).'
        )


def base_command() -> list[str]:
    return [npx(), '--yes', f'wrangler@{WRANGLER_VERSION}', 'd1', 'execute', DATABASE, '--remote', '--config', str(CONFIG), '--yes']


def file_command(path: Path) -> list[str]:
    return [*base_command(), '--file', str(path)]


def auth_check() -> None:
    result = run([npx(), '--yes', f'wrangler@{WRANGLER_VERSION}', 'whoami'])
    if result.returncode != 0:
        fail('Wrangler authentication check failed. No D1 command was attempted.')


def classify_failure(result: subprocess.CompletedProcess[str], label: str) -> None:
    lower = (result.stdout or '').lower()
    if '7403' in lower or 'not authorized' in lower or 'sqlite_auth' in lower:
        fail(f'Cloudflare authorization blocked {label}. Treat this as an access interruption; do not infer schema failure.')
    if 'sqlite_error' in lower or 'syntax error' in lower or 'integer overflow' in lower or 'constraint failed' in lower:
        fail(f'{label} was rejected as SQLite/query/assertion failure; do not infer authorization or unrelated schema drift.')
    fail(f'{label} failed with exit code {result.returncode}.')


def apply() -> None:
    if not MIGRATION.exists():
        fail(f'Missing migration: {MIGRATION.name}')
    print('=== BUILD 439 DEVELOPMENT CAIP TEMPORAL EVIDENCE APPLY ===')
    print(f'Target: {DATABASE} ({EXPECTED_DATABASE_ID})')
    print('Source media/R2/provider mutation by migration: NONE')
    print('Production target capability: NONE')
    result = run(file_command(MIGRATION))
    if result.returncode != 0:
        classify_failure(result, 'the Build 439 Development migration')
    print('BUILD 439 DEVELOPMENT CAIP TEMPORAL EVIDENCE APPLY: PASS')


def verify() -> None:
    for path in (VERIFY, STRICT_VERIFY):
        if not path.exists():
            fail(f'Missing verification SQL: {path.name}')
    print('=== BUILD 439 DEVELOPMENT CAIP TEMPORAL EVIDENCE READ-ONLY VERIFICATION ===')
    print(f'Target: {DATABASE} ({EXPECTED_DATABASE_ID})')
    human = run(file_command(VERIFY))
    if human.returncode != 0:
        classify_failure(human, 'the Build 439 human-readable verification')
    print('\n=== BUILD 439 STRICT MACHINE VERIFICATION ===')
    print('Transport: Wrangler --file / self-asserting read-only SQL')
    strict = run(file_command(STRICT_VERIFY))
    if strict.returncode != 0:
        classify_failure(strict, 'the Build 439 strict verification')
    print('table_count: 3')
    print('index_count: 7')
    print('trigger_count: 2')
    print('disabled_provider_profile_count: 2')
    print('migration_ledger_count: 1')
    print('BUILD 439 DEVELOPMENT CAIP TEMPORAL EVIDENCE READ-ONLY VERIFICATION: PASS / EXACT')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--apply-and-verify', action='store_true')
    args = parser.parse_args()
    if sum(bool(value) for value in (args.apply, args.verify, args.apply_and_verify)) != 1:
        parser.error('Choose exactly one of --apply, --verify, or --apply-and-verify.')
    require_dev_branch()
    require_exact_dev_config()
    auth_check()
    if args.apply or args.apply_and_verify:
        apply()
    if args.verify or args.apply_and_verify:
        verify()
    print('Production D1 mutation executed: NO')
    print('R2/provider mutation executed by helper: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
