#!/usr/bin/env python3
"""Validate the one current D1 platform-convergence migration source."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_PATH = ROOT / 'database_platform_convergence.sql'
SCHEMA_PATH = ROOT / 'database_full_schema.sql'
failures = []


def require(condition, message):
    if not condition:
        failures.append(message)


require(SQL_PATH.exists(), 'database_platform_convergence.sql is missing')
require(SCHEMA_PATH.exists(), 'database_full_schema.sql aggregate authority is missing')
if SCHEMA_PATH.exists():
    require(SCHEMA_PATH.stat().st_size > 1024, 'database_full_schema.sql aggregate authority is unexpectedly empty')

sql = SQL_PATH.read_text(encoding='utf-8') if SQL_PATH.exists() else ''
for key in ('storefront', 'creators', 'socials', 'financials', 'it-platform'):
    require(f"'{key}'" in sql, f'canonical D1 migration missing {key}')
for legacy in ('commerce-operations', 'creative-production', 'business-administration'):
    require(legacy in sql, f'legacy-state bridge missing {legacy}')
require('CREATE TABLE IF NOT EXISTS app_module_user_access' in sql, 'explicit per-user access authority missing')
require("WHERE module_key='it-platform' AND role_code IN ('member','admin')" in sql, 'I.T. role denial authority missing')
require("DELETE FROM app_module_user_access WHERE module_key IN" in sql, 'legacy per-user grants are not retired')
require("DELETE FROM app_module_role_access WHERE module_key IN" in sql, 'legacy role rows are not retired')
require("DELETE FROM app_modules WHERE module_key IN" in sql, 'legacy module registry rows are not retired')
require('DROP TABLE' not in sql.upper(), 'platform convergence must not drop tables')
require('DROP COLUMN' not in sql.upper(), 'platform convergence must not drop columns')
require('BUILD' not in sql.upper(), 'current D1 migration must not carry a historical build identity')

print('DATABASE PLATFORM GATE')
print(f'Aggregate schema bytes: {SCHEMA_PATH.stat().st_size if SCHEMA_PATH.exists() else 0}')
print('Canonical registry: Storefront, Creators, Socials, Financials, I.T.')
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('DATABASE PLATFORM GATE: PASS')
