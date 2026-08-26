#!/usr/bin/env python3
"""Build 438 Development-only module activation migration helper.

Hard-pinned to devilndove-dev and its known D1 UUID. This helper has no Production
mode and refuses to run outside branch `dev` or against a different wrangler.toml.
"""
from __future__ import annotations

import argparse
import json
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
STRICT_VERIFY = ROOT / 'BUILD438_D1_STRICT_VERIFICATION.sql'
DATABASE = 'devilndove-dev'
EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
WRANGLER_VERSION = '4.126.0'
EXPECTED_MODULE_KEYS = 'business-administration|commerce-operations|creative-production'


def fail(message: str, code: int = 1) -> None:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(code)


def emit_output(text: str, *, stream=None) -> None:
    """Write subprocess output without crashing on Windows console encodings.

    Wrangler can emit Unicode glyphs even when Python stdout is CP1252. Encode the
    captured UTF-8 text through the active stream encoding with replacement before
    writing so Git Bash, cmd.exe, PowerShell, redirection and `tee` remain safe.
    """
    target = stream or sys.stdout
    value = str(text or '')
    encoding = getattr(target, 'encoding', None) or 'utf-8'
    try:
        safe = value.encode(encoding, errors='replace').decode(encoding, errors='replace')
    except LookupError:
        safe = value.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    target.write(safe)
    if value and not value.endswith('\n'):
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


def base_command() -> list[str]:
    return [
        npx(), '--yes', f'wrangler@{WRANGLER_VERSION}',
        'd1', 'execute', DATABASE,
        '--remote', '--config', str(CONFIG), '--yes',
    ]


def file_command(file_path: Path) -> list[str]:
    return [*base_command(), '--file', str(file_path)]


def json_file_command(file_path: Path) -> list[str]:
    return [*file_command(file_path), '--json']


def auth_check() -> None:
    result = run([npx(), '--yes', f'wrangler@{WRANGLER_VERSION}', 'whoami'])
    if result.returncode != 0:
        fail('Wrangler authentication check failed. No D1 command was attempted.')


def classify_failure(result: subprocess.CompletedProcess[str], label: str) -> None:
    lower = (result.stdout or '').lower()
    # D1 error code 7500 is also used for ordinary SQLite failures (for example
    # SQLITE_ERROR / incomplete input), so never classify the numeric code alone
    # as authorization. Require explicit authorization semantics instead.
    if '7403' in lower or 'not authorized' in lower or 'sqlite_auth' in lower:
        fail(f'Cloudflare authorization blocked {label}. Treat this as an access interruption; do not infer schema failure.')
    if 'sqlite_error' in lower or 'incomplete input' in lower or 'syntax error' in lower:
        fail(f'{label} was rejected as SQLite/query-form failure; do not infer authorization or schema drift.')
    fail(f'{label} failed with exit code {result.returncode}.')


def parse_json_payload(output: str) -> list[dict]:
    decoder = json.JSONDecoder()
    for index, char in enumerate(output):
        if char != '[':
            continue
        try:
            value, _ = decoder.raw_decode(output[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def first_result_row(payload: list[dict]) -> dict | None:
    for item in payload:
        results = item.get('results')
        if isinstance(results, list) and results and isinstance(results[0], dict):
            return results[0]
    return None


def apply() -> None:
    if not MIGRATION.exists():
        fail(f'Missing migration: {MIGRATION.name}')
    print('=== BUILD 438 DEVELOPMENT MODULE AUTHORITY APPLY ===')
    print(f'Target: {DATABASE} ({EXPECTED_DATABASE_ID})')
    print('Production target capability: NONE')
    result = run(file_command(MIGRATION))
    if result.returncode != 0:
        classify_failure(result, 'the Development migration')
    print('BUILD 438 DEVELOPMENT MODULE AUTHORITY APPLY: PASS')


def verify() -> None:
    if not VERIFY.exists():
        fail(f'Missing verification SQL: {VERIFY.name}')
    if not STRICT_VERIFY.exists():
        fail(f'Missing strict verification SQL: {STRICT_VERIFY.name}')
    print('=== BUILD 438 DEVELOPMENT MODULE AUTHORITY READ-ONLY VERIFICATION ===')
    print(f'Target: {DATABASE} ({EXPECTED_DATABASE_ID})')

    human = run(file_command(VERIFY))
    if human.returncode != 0:
        classify_failure(human, 'the Development verification SQL')

    print('\n=== BUILD 438 STRICT MACHINE VERIFICATION ===')
    # Use Wrangler --file rather than --command. On Windows, npx.cmd/cmd.exe can
    # truncate or reinterpret complex SQL command arguments even when Python passes
    # them as one argv element. File transport has already proven reliable here.
    strict = run(json_file_command(STRICT_VERIFY), echo=False)
    if strict.returncode != 0:
        emit_output(strict.stdout)
        classify_failure(strict, 'the strict Development module verification')

    payload = parse_json_payload(strict.stdout or '')
    row = first_result_row(payload)
    if not row:
        emit_output(strict.stdout)
        fail('Strict verification returned no parseable D1 result row.')

    actual = {
        'module_count': int(row.get('module_count') or 0),
        'role_access_count': int(row.get('role_access_count') or 0),
        'enabled_module_count': int(row.get('enabled_module_count') or 0),
        'background_enabled_count': int(row.get('background_enabled_count') or 0),
        'expected_index_count': int(row.get('expected_index_count') or 0),
        'module_keys': str(row.get('module_keys') or ''),
    }
    expected = {
        'module_count': 3,
        'role_access_count': 6,
        'enabled_module_count': 3,
        'background_enabled_count': 0,
        'expected_index_count': 2,
        'module_keys': EXPECTED_MODULE_KEYS,
    }

    for key in expected:
        print(f'{key}: {actual[key]}')
    mismatches = [key for key, value in expected.items() if actual.get(key) != value]
    if mismatches:
        fail('Strict Development verification mismatch: ' + ', '.join(mismatches))

    print('BUILD 438 DEVELOPMENT MODULE AUTHORITY READ-ONLY VERIFICATION: PASS / EXACT')


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
