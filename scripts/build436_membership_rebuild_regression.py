#!/usr/bin/env python3
"""Build 436 local-only Membership rebuild execution safety regression."""
from __future__ import annotations

import sqlite3
from pathlib import Path

import build436_production_membership_rebuild as executor

ROOT = Path(__file__).resolve().parents[1]
CONTROLLER = ROOT / 'scripts' / 'build436_production_membership_rebuild.py'
PREFLIGHT = ROOT / 'scripts' / 'build436_membership_rebuild_authorization_preflight.py'
AUTH_TOKEN = 'AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD'

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    print(f'{checks:02d}. {"PASS" if condition else "FAIL"} — {label}')
    if not condition:
        failures.append(label)


def simulate() -> tuple[list[str], list[tuple], str]:
    conn = sqlite3.connect(':memory:')
    conn.executescript("""
    CREATE TABLE membership_tier_policies (
      membership_tier_policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      display_title TEXT NOT NULL,
      short_description TEXT NOT NULL,
      benefits_json TEXT NOT NULL,
      badge_color TEXT NOT NULL,
      is_visible INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT INTO membership_tier_policies
      (membership_tier_policy_id,code,name,display_title,short_description,benefits_json,badge_color,is_visible,sort_order,created_at,updated_at)
    VALUES
      (11,'bronze','Bronze','Bronze','b-desc','["b"]','#111111',1,10,'2026-01-01','2026-01-02'),
      (22,'silver','Silver','Silver','s-desc','["s"]','#222222',1,20,'2026-02-01','2026-02-02'),
      (33,'gold','Gold','Gold','g-desc','["g"]','#333333',0,30,'2026-03-01','2026-03-02');
    """)
    conn.executescript(executor.rebuild_sql())
    columns = [row[1] for row in conn.execute("PRAGMA table_info('membership_tier_policies')")]
    rows = list(conn.execute("SELECT policy_id,tier_code,title,short_description,benefits_json,badge_color,sort_order,is_visible,created_at,updated_at FROM membership_tier_policies ORDER BY policy_id"))
    table_sql = conn.execute("SELECT sql FROM sqlite_schema WHERE type='table' AND name='membership_tier_policies'").fetchone()[0]
    leftovers = list(conn.execute("SELECT name FROM sqlite_schema WHERE name IN ('membership_tier_policies_build436_shadow','_build436_membership_assert')"))
    conn.close()
    return columns, rows, table_sql if not leftovers else table_sql + ' LEFTOVERS'


def main() -> int:
    controller_text = CONTROLLER.read_text(encoding='utf-8')
    preflight_text = PREFLIGHT.read_text(encoding='utf-8')
    sql = executor.rebuild_sql()
    columns, rows, table_sql = simulate()

    check(CONTROLLER.exists() and PREFLIGHT.exists(), 'Build 436 controller and preflight source exist')
    check(executor.AUTH_TOKEN == AUTH_TOKEN and AUTH_TOKEN in controller_text, 'Membership rebuild uses one exact stage-specific token')
    check(executor.PROD_NAME == 'devilndove-prod' and executor.PROD_ID == '0dc8fa3e-319c-45f7-a515-34c8acd89fcf', 'Production database name/UUID are hard pinned')
    check('safe_to_request_membership_rebuild_authorization' in preflight_text, 'execution preflight exposes an explicit safe-to-request decision')
    check("export_backup('membership')" in controller_text and "verify_backup('membership')" in controller_text, 'controller requires a dedicated full Membership backup and recheck')
    check('source_rows_sha256' in controller_text and 'canonical_preview_sha256' in controller_text, 'controller preserves source and canonical fingerprints')
    check(
        'no_inbound_foreign_keys' in preflight_text
        and 'no_outbound_foreign_keys' in preflight_text
        and 'def inbound_foreign_keys' in preflight_text
        and 'PRAGMA foreign_key_list(' in preflight_text
        and 'JOIN pragma_foreign_key_list' not in preflight_text,
        'preflight blocks Membership FK dependencies using D1-compatible per-table PRAGMA discovery',
    )
    check('no_user_defined_indexes_or_triggers' in preflight_text, 'preflight blocks unhandled Membership indexes/triggers')
    check('no_rebuild_name_collisions' in preflight_text, 'preflight blocks shadow/assert object-name collisions')
    check(f'CREATE TABLE {executor.SHADOW_TABLE}' in sql and 'policy_id INTEGER PRIMARY KEY AUTOINCREMENT' in sql, 'SQL creates the exact canonical shadow table')
    check('membership_tier_policy_id' in sql and 'display_title' in sql and 'short_description' in sql and 'updated_at' in sql, 'SQL uses explicit reviewed legacy-to-canonical mappings')
    check("('bronze','silver','gold')" in sql and "COUNT(DISTINCT tier_code) = 3" in sql, 'SQL asserts the exact three canonical tier identities')
    check('title_alias_equality' in sql and 'name IS display_title' in sql, 'SQL reasserts name/display_title equality inside the batch')
    check('mapped_value_equality' in sql and 'd.updated_at IS s.updated_at' in sql, 'SQL asserts complete mapped-row value equality before swap')
    check('CHECK (ok = 1)' in sql, 'in-batch assertion table converts failed proofs into SQL failure')
    check('DROP TABLE membership_tier_policies;' in sql and f'ALTER TABLE {executor.SHADOW_TABLE} RENAME TO membership_tier_policies;' in sql, 'swap is limited to legacy drop plus canonical shadow rename')
    check('BEGIN TRANSACTION' not in sql.upper() and '\nBEGIN;' not in sql.upper() and '\nCOMMIT;' not in sql.upper(), 'SQL does not embed explicit transaction statements inside D1 file execution')
    check(columns == executor.CANONICAL_COLUMNS, 'in-memory rebuild produces the exact canonical ten-column order')
    check(rows == [
        (11,'bronze','Bronze','b-desc','["b"]','#111111',10,1,'2026-01-01','2026-01-02'),
        (22,'silver','Silver','s-desc','["s"]','#222222',20,1,'2026-02-01','2026-02-02'),
        (33,'gold','Gold','g-desc','["g"]','#333333',30,0,'2026-03-01','2026-03-02'),
    ], 'in-memory rebuild preserves all three IDs and mapped business values exactly')
    check('AUTOINCREMENT' in table_sql.upper() and 'LEFTOVERS' not in table_sql, 'in-memory rebuild retains AUTOINCREMENT and leaves no rebuild helper tables')

    print()
    if failures:
        print(f'BUILD 436 MEMBERSHIP REBUILD SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1
    print(f'BUILD 436 MEMBERSHIP REBUILD SAFETY REGRESSION: PASS ({checks}/{checks})')
    print('In-memory legacy -> canonical shadow rebuild: PASS')
    print('Complete three-row value preservation: PASS')
    print('Membership Production authorization inferred: NO')
    print('Cloudflare access: NONE')
    print('Production mutation executed: NO')
    print('Later rebuild authorization inferred: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
