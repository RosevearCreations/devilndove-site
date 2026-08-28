#!/usr/bin/env python3
"""Execute and validate the one current Development D1 convergence migration."""
from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_PATH = ROOT / 'database_platform_convergence.sql'
VERIFY_PATH = ROOT / 'PLATFORM_CONVERGENCE_D1_VERIFICATION.sql'
SCHEMA_PATH = ROOT / 'database_full_schema.sql'
failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def users_schema(conn: sqlite3.Connection) -> None:
    conn.executescript("""
      PRAGMA foreign_keys=ON;
      CREATE TABLE users (
        user_id INTEGER PRIMARY KEY,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'member',
        is_active INTEGER NOT NULL DEFAULT 1
      );
      INSERT INTO users(user_id,email,role,is_active)
      VALUES (1,'owner@example.invalid','admin',1);
    """)


def assert_current(conn: sqlite3.Connection, label: str) -> None:
    modules = [row[0] for row in conn.execute(
        "SELECT module_key FROM app_modules ORDER BY load_priority,module_key"
    ).fetchall()]
    require(modules == ['storefront','creators','socials','financials','it-platform'], f'{label}: canonical module rows drifted: {modules}')
    require(conn.execute("SELECT COUNT(*) FROM app_module_role_access WHERE module_key IN ('storefront','creators','socials','financials','it-platform')").fetchone()[0] == 10, f'{label}: expected 10 canonical role rows')
    require(conn.execute("SELECT COUNT(*) FROM app_module_role_access WHERE module_key='it-platform' AND is_allowed<>0").fetchone()[0] == 0, f'{label}: I.T. role access must remain denied')
    require(conn.execute("SELECT COUNT(*) FROM app_module_user_access WHERE module_key='it-platform' AND user_id=1 AND is_allowed=1 AND access_level='manage'").fetchone()[0] == 1, f'{label}: active admin did not receive initial explicit I.T. manager grant')
    for table in ('home_carousel_slides','home_carousel_events'):
        require(conn.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()[0] == 1, f'{label}: missing {table}')
    require(conn.execute('SELECT COUNT(*) FROM home_carousel_slides').fetchone()[0] == 0, f'{label}: convergence migration must not seed public carousel slides')
    require(conn.execute("SELECT COUNT(*) FROM app_modules WHERE module_key IN ('commerce-operations','creative-production','business-administration')").fetchone()[0] == 0, f'{label}: legacy module registry rows remain')
    fk_rows = conn.execute('PRAGMA foreign_key_check').fetchall()
    require(not fk_rows, f'{label}: foreign key check failed: {fk_rows[:3]}')


def fresh_database_test(sql: str) -> None:
    conn = sqlite3.connect(':memory:')
    try:
        users_schema(conn)
        conn.executescript(sql)
        assert_current(conn, 'fresh migration')
        conn.executescript(sql)
        assert_current(conn, 'idempotent rerun')
    finally:
        conn.close()


def legacy_database_test(sql: str) -> None:
    conn = sqlite3.connect(':memory:')
    try:
        users_schema(conn)
        conn.executescript("""
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
            PRIMARY KEY(module_key,role_code),
            FOREIGN KEY(module_key) REFERENCES app_modules(module_key) ON DELETE CASCADE
          );
          INSERT INTO app_modules(module_key,display_name,is_enabled,requires_login,default_route,load_priority,background_activity_enabled) VALUES
            ('commerce-operations','Commerce & Operations',0,0,'/',10,0),
            ('creative-production','Creative & Production',1,1,'/admin/creative-automation/',20,1),
            ('business-administration','Business & Administration',1,1,'/admin/',30,0);
          INSERT INTO app_module_role_access(module_key,role_code,is_allowed,access_level) VALUES
            ('commerce-operations','member',1,'member'),('commerce-operations','admin',1,'read'),
            ('creative-production','member',0,'none'),('creative-production','admin',1,'manage'),
            ('business-administration','member',0,'none'),('business-administration','admin',1,'manage');
        """)
        conn.executescript(sql)
        assert_current(conn, 'legacy bridge')
        require(conn.execute("SELECT is_enabled FROM app_modules WHERE module_key='storefront'").fetchone()[0] == 0, 'legacy bridge: Storefront did not preserve Commerce enabled state')
        require(conn.execute("SELECT background_activity_enabled FROM app_modules WHERE module_key='creators'").fetchone()[0] == 1, 'legacy bridge: Creators did not preserve Creative background state')
        require(conn.execute("SELECT access_level FROM app_module_role_access WHERE module_key='storefront' AND role_code='admin'").fetchone()[0] == 'read', 'legacy bridge: Storefront admin role state was not preserved')
    finally:
        conn.close()


require(SQL_PATH.exists(), 'database_platform_convergence.sql is missing')
require(VERIFY_PATH.exists(), 'PLATFORM_CONVERGENCE_D1_VERIFICATION.sql is missing')
require(SCHEMA_PATH.exists(), 'database_full_schema.sql aggregate authority is missing')
if SCHEMA_PATH.exists():
    require(SCHEMA_PATH.stat().st_size > 1024, 'database_full_schema.sql aggregate authority is unexpectedly empty')

sql = SQL_PATH.read_text(encoding='utf-8') if SQL_PATH.exists() else ''
for marker in (
    'CREATE TABLE IF NOT EXISTS app_modules',
    'CREATE TABLE IF NOT EXISTS app_module_role_access',
    'CREATE TABLE IF NOT EXISTS app_module_user_access',
    'CREATE TABLE IF NOT EXISTS home_carousel_slides',
    'CREATE TABLE IF NOT EXISTS home_carousel_events',
    'PRAGMA foreign_key_check',
):
    require(marker in sql, f'current D1 convergence authority missing: {marker}')
for key in ('storefront','creators','socials','financials','it-platform'):
    require(f"'{key}'" in sql, f'canonical D1 migration missing {key}')
for legacy in ('commerce-operations','creative-production','business-administration'):
    require(legacy in sql, f'legacy-state bridge missing {legacy}')
require("WHERE module_key='it-platform' AND role_code IN ('member','admin')" in sql, 'I.T. role denial authority missing')
require('DROP TABLE' not in sql.upper(), 'platform convergence must not drop tables')
require('DROP COLUMN' not in sql.upper(), 'platform convergence must not drop columns')
require('BUILD' not in sql.upper(), 'current D1 migration must not carry a historical build identity')

if not failures:
    try:
        fresh_database_test(sql)
        legacy_database_test(sql)
    except Exception as exc:  # surface exact SQLite parser/runtime errors in CI
        failures.append(f'SQLite execution failed: {exc}')

print('DATABASE PLATFORM GATE')
print(f'Aggregate schema bytes: {SCHEMA_PATH.stat().st_size if SCHEMA_PATH.exists() else 0}')
print('Canonical registry: Storefront, Creators, Socials, Financials, I.T.')
print('Migration execution: fresh + idempotent rerun + legacy bridge')
if failures:
    for i, failure in enumerate(failures, 1):
        print(f'{i:03d}. FAIL — {failure}')
    raise SystemExit(1)
print('DATABASE PLATFORM GATE: PASS')
