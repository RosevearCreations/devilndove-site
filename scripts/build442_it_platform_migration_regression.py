#!/usr/bin/env python3
"""Build 442 source regression for additive I.T. module/user-grant migration and guarded runner."""
from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'database_build442_it_platform_user_access.sql'
RUNNER = ROOT / 'scripts/build442_apply_development_it_platform.py'
checks: list[tuple[str, bool]] = []


def check(label: str, condition: bool) -> None:
    checks.append((label, bool(condition)))
    print(('PASS' if condition else 'FAIL') + ' — ' + label)


migration = MIGRATION.read_text(encoding='utf-8')
runner = RUNNER.read_text(encoding='utf-8')

check('Build 442 I.T. migration exists', MIGRATION.exists())
check('Build 442 Development-only runner exists', RUNNER.exists())
check('migration creates explicit user-grant authority', 'CREATE TABLE IF NOT EXISTS app_module_user_access' in migration)
check('migration registers fourth it-platform module', "'it-platform'" in migration and "'I.T. & Platform'" in migration)
check('role-derived I.T. access is explicitly denied', "('it-platform', 'admin', 0, 'none')" in migration and "('it-platform', 'member', 0, 'none')" in migration)
check('bootstrap requires an active admin', "u.is_active = 1" in migration and "LOWER(TRIM(u.role)) = 'admin'" in migration)
check('bootstrap is one-time rather than future-admin automatic', "NOT EXISTS (" in migration and "existing.module_key = 'it-platform'" in migration)
check('runner hard-guards exact Development D1', "EXPECTED_DATABASE_NAME = 'devilndove-dev'" in runner and "EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'" in runner)
check('runner reuses proven Windows-safe Build 440 transport', 'from build440_apply_development_d1 import' in runner and 'build_wrangler_query_args' in runner)
check('runner has no automatic retry loop', 'for attempt in' not in runner and 'while True' not in runner)
check('runner performs lockout preflight before apply', 'preflight_remote_schema()' in runner and runner.index('preflight_remote_schema()') < runner.index('execute_sql_file(MIGRATION, read_only=False)'))
check('runner exposes verify-only safe mode', "--verify-only" in runner)
check('runner states Production mutation unavailable', 'Production mutation capability: NONE' in runner)

con = sqlite3.connect(':memory:')
con.execute('PRAGMA foreign_keys = ON')
con.executescript('''
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1))
);
CREATE TABLE app_modules (
  module_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK(is_enabled IN (0,1)),
  requires_login INTEGER NOT NULL DEFAULT 1 CHECK(requires_login IN (0,1)),
  default_route TEXT NOT NULL DEFAULT '/',
  load_priority INTEGER NOT NULL DEFAULT 100,
  background_activity_enabled INTEGER NOT NULL DEFAULT 0 CHECK(background_activity_enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE app_module_role_access (
  module_key TEXT NOT NULL,
  role_code TEXT NOT NULL,
  is_allowed INTEGER NOT NULL DEFAULT 0 CHECK(is_allowed IN (0,1)),
  access_level TEXT NOT NULL DEFAULT 'read',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(module_key, role_code),
  FOREIGN KEY(module_key) REFERENCES app_modules(module_key) ON DELETE CASCADE
);
''')
con.execute("INSERT INTO users(email,display_name,role,is_active) VALUES('first-admin@example.invalid','First Admin','admin',1)")
con.execute("INSERT INTO users(email,display_name,role,is_active) VALUES('member@example.invalid','Member','member',1)")
con.executescript(migration)

module = con.execute("SELECT module_key,display_name,is_enabled,requires_login,default_route,load_priority,background_activity_enabled FROM app_modules WHERE module_key='it-platform'").fetchone()
check('local migration creates exact I.T. module row', module == ('it-platform','I.T. & Platform',1,1,'/admin/it-platform/',40,0))
roles = con.execute("SELECT role_code,is_allowed,access_level FROM app_module_role_access WHERE module_key='it-platform' ORDER BY role_code").fetchall()
check('local migration leaves both business roles denied for I.T.', roles == [('admin',0,'none'),('member',0,'none')])
admin_id = con.execute("SELECT user_id FROM users WHERE email='first-admin@example.invalid'").fetchone()[0]
member_id = con.execute("SELECT user_id FROM users WHERE email='member@example.invalid'").fetchone()[0]
admin_grant = con.execute("SELECT is_allowed,access_level FROM app_module_user_access WHERE module_key='it-platform' AND user_id=?", (admin_id,)).fetchone()
member_grant = con.execute("SELECT is_allowed,access_level FROM app_module_user_access WHERE module_key='it-platform' AND user_id=?", (member_id,)).fetchone()
check('initial active admin receives explicit manage grant', admin_grant == (1,'manage'))
check('member receives no implicit I.T. grant', member_grant is None)

con.execute("INSERT INTO users(email,display_name,role,is_active) VALUES('future-admin@example.invalid','Future Admin','admin',1)")
future_admin_id = con.execute("SELECT user_id FROM users WHERE email='future-admin@example.invalid'").fetchone()[0]
con.executescript(migration)
future_grant = con.execute("SELECT is_allowed,access_level FROM app_module_user_access WHERE module_key='it-platform' AND user_id=?", (future_admin_id,)).fetchone()
check('migration replay does not auto-grant a future admin', future_grant is None)

constraint_blocked = False
try:
    con.execute("INSERT INTO app_module_user_access(module_key,user_id,is_allowed,access_level) VALUES('it-platform',?,0,'manage')", (member_id,))
except sqlite3.IntegrityError:
    constraint_blocked = True
check('grant consistency constraint blocks denied/manage mismatch', constraint_blocked)
check('migration replay is idempotent for module and role rows', con.execute("SELECT COUNT(*) FROM app_modules WHERE module_key='it-platform'").fetchone()[0] == 1 and con.execute("SELECT COUNT(*) FROM app_module_role_access WHERE module_key='it-platform'").fetchone()[0] == 2)
check('local migration leaves foreign keys clean', con.execute('PRAGMA foreign_key_check').fetchall() == [])

passed = sum(1 for _, ok in checks if ok)
print(f'\nBUILD 442 I.T. PLATFORM MIGRATION / RUNNER REGRESSION: {passed}/{len(checks)} passed')
print('Remote Cloudflare/D1 access: NONE')
print('Runtime enforcement activation: NONE')
print('Production mutation capability: NONE')
raise SystemExit(0 if passed == len(checks) else 1)
