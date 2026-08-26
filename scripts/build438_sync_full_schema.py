#!/usr/bin/env python3
"""Synchronize Build 438 module authority into database_full_schema.sql.

This helper is local-only. It never contacts Cloudflare or D1. The GitHub connector
cannot safely replace the ~780 KB aggregate in-place, so the owner runs this helper
once after pulling Build 438 source, reviews the generated diff, and commits it.

The helper appends the exact focused Build 438 migration only when both Build 438
CREATE TABLE authorities are absent. It refuses ambiguous/partial aggregate states.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
AGGREGATE = ROOT / 'database_full_schema.sql'
MIGRATION = ROOT / 'database_build438_application_module_activation.sql'
BEGIN_MARKER = '-- BEGIN BUILD 438 APPLICATION MODULE ACTIVATION AUTHORITY'
END_MARKER = '-- END BUILD 438 APPLICATION MODULE ACTIVATION AUTHORITY'

REQUIRED_SNIPPETS = (
    'CREATE TABLE IF NOT EXISTS app_modules',
    'CREATE TABLE IF NOT EXISTS app_module_role_access',
    'CREATE INDEX IF NOT EXISTS idx_app_modules_enabled_priority',
    'CREATE INDEX IF NOT EXISTS idx_app_module_role_access_role',
    "'commerce-operations'",
    "'creative-production'",
    "'business-administration'",
)


def fail(message: str) -> None:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(path: Path) -> str:
    if not path.exists():
        fail(f'Missing required file: {path.name}')
    return path.read_text(encoding='utf-8')


def validate_aggregate(text: str) -> None:
    missing = [snippet for snippet in REQUIRED_SNIPPETS if snippet not in text]
    if missing:
        fail('Full schema is missing Build 438 authority: ' + ', '.join(missing))
    if text.count('CREATE TABLE IF NOT EXISTS app_modules') != 1:
        fail('Full schema must contain exactly one app_modules CREATE TABLE authority.')
    if text.count('CREATE TABLE IF NOT EXISTS app_module_role_access') != 1:
        fail('Full schema must contain exactly one app_module_role_access CREATE TABLE authority.')
    marker_count = text.count(BEGIN_MARKER)
    if marker_count not in (0, 1):
        fail('Full schema contains duplicate Build 438 begin markers.')
    if marker_count == 1 and text.count(END_MARKER) != 1:
        fail('Full schema Build 438 marker block is incomplete.')


def sync() -> bool:
    aggregate = read(AGGREGATE)
    migration = read(MIGRATION).strip()

    has_modules = 'CREATE TABLE IF NOT EXISTS app_modules' in aggregate
    has_roles = 'CREATE TABLE IF NOT EXISTS app_module_role_access' in aggregate

    if has_modules != has_roles:
        fail('Full schema contains a partial Build 438 module authority. Refusing automatic append.')

    if has_modules and has_roles:
        validate_aggregate(aggregate)
        print('BUILD 438 FULL-SCHEMA SYNC: ALREADY PRESENT / NO CHANGE')
        return False

    if BEGIN_MARKER in aggregate or END_MARKER in aggregate:
        fail('Build 438 marker exists without complete table authority. Refusing automatic append.')

    if not migration:
        fail('Focused Build 438 migration is empty.')

    # The aggregate already enables foreign keys near its beginning. Keeping the
    # migration's own PRAGMA is harmless and preserves exact migration semantics.
    suffix = (
        '\n\n'
        '/* =========================================================\n'
        '   BUILD 438 — APPLICATION CORE / MODULE ACTIVATION AUTHORITY\n'
        '   Focused authority: database_build438_application_module_activation.sql\n'
        '   ========================================================= */\n'
        f'{BEGIN_MARKER}\n'
        f'{migration}\n'
        f'{END_MARKER}\n'
    )

    updated = aggregate.rstrip() + suffix
    validate_aggregate(updated)
    AGGREGATE.write_text(updated, encoding='utf-8', newline='\n')
    print('BUILD 438 FULL-SCHEMA SYNC: UPDATED')
    print(f'Aggregate: {AGGREGATE.name}')
    print(f'Focused source: {MIGRATION.name}')
    print('Build 438 table authorities: 2 / EXACT')
    print('Build 438 indexes: 2 / PRESENT')
    print('Top-level module seed keys: 3 / PRESENT')
    print('Cloudflare/D1 access: NONE')
    return True


def check() -> None:
    validate_aggregate(read(AGGREGATE))
    print('BUILD 438 FULL-SCHEMA CHECK: PASS')
    print('app_modules: PRESENT / SINGLE AUTHORITY')
    print('app_module_role_access: PRESENT / SINGLE AUTHORITY')
    print('Build 438 indexes: PRESENT')
    print('Top-level module seed keys: PRESENT')
    print('Cloudflare/D1 access: NONE')


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--sync', action='store_true', help='Append the exact Build 438 focused migration when absent.')
    group.add_argument('--check', action='store_true', help='Verify Build 438 authority is present in the aggregate.')
    args = parser.parse_args()

    if args.sync:
        sync()
        check()
    else:
        check()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
