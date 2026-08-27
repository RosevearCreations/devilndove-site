#!/usr/bin/env python3
"""Build 443 guarded Development-only Home carousel D1 apply/verifier.

Production is not a supported target. There are no automatic retries, no bulk
import and no request-time DDL path.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))

from build440_apply_development_d1 import execute_sql_file, prepared_remote_statements, build_wrangler_query_args  # noqa:E402
from build442_apply_development_it_platform import guard_exact_target, query_json, scalar_count, die  # noqa:E402

MIGRATION='database_build443_home_carousel.sql'
VERIFICATION='BUILD443_HOME_CAROUSEL_D1_VERIFICATION.sql'

def transport_preflight():
    for filename in (MIGRATION,VERIFICATION):
        statements,_=prepared_remote_statements(filename)
        for statement in statements: build_wrangler_query_args(statement)
        print(f'PASS — {filename}: {len(statements)} Windows-safe statements')

def verify():
    tables=query_json("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('home_carousel_slides','home_carousel_events') ORDER BY name;",'Build 443 carousel tables')
    if [str(row.get('name') or '') for row in tables] != ['home_carousel_events','home_carousel_slides']:
        die(f'Build 443 carousel tables are incomplete: {tables}')
    invalid=scalar_count("SELECT COUNT(*) AS invalid_slide_count FROM home_carousel_slides WHERE status NOT IN ('draft','published','paused','archived') OR sort_order<1 OR sort_order>999999 OR auto_advance_seconds<5 OR auto_advance_seconds>20 OR trim(title)='' OR trim(image_url)='' OR trim(alt_text)='' OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND datetime(ends_at)<=datetime(starts_at));",'invalid_slide_count','Build 443 invalid-slide verification')
    if invalid: die(f'Build 443 carousel has {invalid} invalid slide rows.')
    fk=query_json('PRAGMA foreign_key_check;','Build 443 carousel foreign keys')
    if fk: die(f'Build 443 carousel foreign-key violations: {fk[:5]}')
    print('PASS — carousel tables exact')
    print('PASS — carousel invalid slide rows: 0')
    print('PASS — carousel foreign keys clean')

def main():
    parser=argparse.ArgumentParser(description='Build 443 Development-only Home carousel D1 runner')
    parser.add_argument('--auth-only',action='store_true')
    parser.add_argument('--verify-only',action='store_true')
    args=parser.parse_args()
    if args.auth_only and args.verify_only: die('Choose only one of --auth-only or --verify-only.')
    guard_exact_target()
    print('BUILD 443 DEVELOPMENT HOME CAROUSEL D1 GUARDED RUNNER')
    print('Database: devilndove-dev (dbc1615b-dcbe-4951-973b-b47c99c73bfa)')
    print('Automatic retries: NONE')
    print('Bulk import: NONE')
    print('Production mutation capability: NONE')
    if args.auth_only:
        rows=query_json('SELECT 1 AS build443_development_query_auth_probe;','Build 443 Development D1 auth probe')
        if not rows or int(rows[0].get('build443_development_query_auth_probe') or 0)!=1: die('Build 443 auth probe failed.')
        print('BUILD 443 DEVELOPMENT D1 QUERY AUTH: PASS')
        return 0
    transport_preflight()
    users=query_json("SELECT name FROM sqlite_master WHERE type='table' AND name='users' LIMIT 1;",'Build 443 users-table preflight')
    if len(users)!=1: die('Required users authority is missing; refusing carousel migration.')
    if not args.verify_only: execute_sql_file(MIGRATION,read_only=False)
    verify()
    execute_sql_file(VERIFICATION,read_only=True)
    print('BUILD 443 DEVELOPMENT HOME CAROUSEL D1 APPLY/VERIFY: PASS')
    print('Production mutation capability: NONE')
    return 0

if __name__=='__main__': raise SystemExit(main())
