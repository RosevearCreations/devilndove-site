#!/usr/bin/env python3
"""Build 436/437 guarded Membership Build 395 Production rebuild controller.

Source creation does not authorize execution. The controller requires the exact
Membership-specific token, fresh lossless/dependency evidence, a fresh full D1
backup, exact fingerprints, one D1 execute-file rebuild batch, and independent
canonical postchecks. Build 437 also preserves the reviewed Production sort
index by translating legacy `(sort_order, code)` to canonical
`(sort_order, tier_code)`.

No fractional Inventory, Product/FK, Accounting/default, R2/provider, CAIP-copy,
or Production-promotion path exists here.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401
import build428_production_additive_execution as additive

ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT_SCRIPT = ROOT / 'scripts' / 'build436_membership_rebuild_authorization_preflight.py'
PREFLIGHT_ARTIFACT = ROOT / 'build436_membership_rebuild_authorization_preflight.local.json'
BACKUP_BOUNDARY = ROOT / 'build436_membership_backup_boundary.local.json'
POSTCHECK = ROOT / 'build436_production_membership_postcheck.local.json'
AUTH_TOKEN = 'AUTHORIZE-BUILD436-PROD-MEMBERSHIP-BUILD395-REBUILD'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
SHADOW_TABLE = 'membership_tier_policies_build436_shadow'
ASSERT_TABLE = '_build436_membership_assert'
SORT_INDEX = 'idx_membership_tier_policies_sort'
EXPECTED_TIERS = {'bronze', 'silver', 'gold'}
CANONICAL_SORT_COLUMNS = ['sort_order', 'tier_code']
CANONICAL_COLUMNS = [
    'policy_id', 'tier_code', 'title', 'short_description', 'benefits_json',
    'badge_color', 'sort_order', 'is_visible', 'created_at', 'updated_at',
]


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 436 PRODUCTION MEMBERSHIP REBUILD: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def require_token(value: str | None) -> None:
    if value != AUTH_TOKEN:
        fail('explicit Membership Build 395 Production rebuild authorization token is missing or incorrect.')


def hard_target_guard() -> None:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match the Build 436 hard guard.')
    additive.hard_target_guard()


def stable_fingerprint(rows: list[dict]) -> str:
    encoded = json.dumps(rows, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(encoded).hexdigest()


def fresh_preflight() -> dict:
    result = subprocess.run(
        [sys.executable, '-u', str(PREFLIGHT_SCRIPT), '--run'],
        cwd=ROOT,
        text=True,
        encoding='utf-8',
        errors='replace',
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**os.environ, 'NO_COLOR': '1', 'FORCE_COLOR': '0', 'PYTHONIOENCODING': 'utf-8'},
        check=False,
    )
    print(result.stdout or '', end='' if (result.stdout or '').endswith('\n') else '\n')
    if result.returncode != 0 or not PREFLIGHT_ARTIFACT.exists():
        fail('fresh Build 436/437 Membership rebuild authorization preflight is not green.')
    payload = json.loads(PREFLIGHT_ARTIFACT.read_text(encoding='utf-8'))
    if payload.get('safe_to_request_membership_rebuild_authorization') is not True:
        fail('fresh Build 436/437 Membership rebuild preflight is not safe.')
    return payload


def exact_prewrite_match(expected: dict, current: dict) -> bool:
    return all([
        current.get('safe_to_request_membership_rebuild_authorization') is True,
        current.get('membership_row_count') == expected.get('membership_row_count') == 3,
        current.get('source_rows_sha256') == expected.get('source_rows_sha256'),
        current.get('canonical_preview_sha256') == expected.get('canonical_preview_sha256'),
        current.get('policy_ids') == expected.get('policy_ids'),
        current.get('legacy_sort_index_compatible') is True,
        current.get('no_unhandled_user_objects') is True,
        current.get('no_outbound_foreign_keys') is True,
        current.get('no_inbound_foreign_keys') is True,
        current.get('no_rebuild_name_collisions') is True,
    ])


def rebuild_sql() -> str:
    return f"""PRAGMA foreign_keys = ON;

CREATE TABLE {SHADOW_TABLE} (
  policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  benefits_json TEXT NOT NULL DEFAULT '[]',
  badge_color TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO {SHADOW_TABLE} (
  policy_id, tier_code, title, short_description, benefits_json,
  badge_color, sort_order, is_visible, created_at, updated_at
)
SELECT
  membership_tier_policy_id,
  code,
  display_title,
  short_description,
  benefits_json,
  badge_color,
  sort_order,
  is_visible,
  created_at,
  updated_at
FROM membership_tier_policies
ORDER BY membership_tier_policy_id;

CREATE TABLE {ASSERT_TABLE} (
  assertion_name TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK (ok = 1)
);

INSERT INTO {ASSERT_TABLE}(assertion_name, ok)
SELECT 'source_shape', CASE WHEN COUNT(*) = 11 THEN 1 ELSE 0 END
FROM pragma_table_info('membership_tier_policies');

INSERT INTO {ASSERT_TABLE}(assertion_name, ok)
SELECT 'shadow_row_count', CASE WHEN COUNT(*) = 3 THEN 1 ELSE 0 END
FROM {SHADOW_TABLE};

INSERT INTO {ASSERT_TABLE}(assertion_name, ok)
SELECT 'tier_identity', CASE WHEN
  COUNT(*) = 3
  AND COUNT(DISTINCT tier_code) = 3
  AND SUM(CASE WHEN tier_code IN ('bronze','silver','gold') THEN 1 ELSE 0 END) = 3
THEN 1 ELSE 0 END
FROM {SHADOW_TABLE};

INSERT INTO {ASSERT_TABLE}(assertion_name, ok)
SELECT 'title_alias_equality', CASE WHEN COUNT(*) = 3 THEN 1 ELSE 0 END
FROM membership_tier_policies
WHERE name IS display_title;

INSERT INTO {ASSERT_TABLE}(assertion_name, ok)
SELECT 'mapped_value_equality', CASE WHEN COUNT(*) = 3 THEN 1 ELSE 0 END
FROM membership_tier_policies AS s
JOIN {SHADOW_TABLE} AS d
  ON d.policy_id IS s.membership_tier_policy_id
 AND d.tier_code IS s.code
 AND d.title IS s.display_title
 AND d.short_description IS s.short_description
 AND d.benefits_json IS s.benefits_json
 AND d.badge_color IS s.badge_color
 AND d.sort_order IS s.sort_order
 AND d.is_visible IS s.is_visible
 AND d.created_at IS s.created_at
 AND d.updated_at IS s.updated_at;

DROP TABLE membership_tier_policies;
ALTER TABLE {SHADOW_TABLE} RENAME TO membership_tier_policies;
CREATE INDEX {SORT_INDEX}
  ON membership_tier_policies(sort_order ASC, tier_code ASC);
DROP TABLE {ASSERT_TABLE};
"""


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 436 {label}')


def current_canonical_state() -> dict:
    hard_target_guard()
    npx = base.npx_path()
    with tempfile.TemporaryDirectory(prefix='dd-build436-membership-postcheck-') as td:
        cfg = Path(td) / 'prod.toml'
        cfg.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
        columns = q(
            npx, cfg,
            "SELECT cid,name,type,\"notnull\" AS notnull_value,dflt_value,pk FROM pragma_table_info('membership_tier_policies') ORDER BY cid;",
            'PRODUCTION CANONICAL MEMBERSHIP COLUMNS',
        )
        rows = q(npx, cfg, 'SELECT * FROM membership_tier_policies ORDER BY policy_id;', 'PRODUCTION CANONICAL MEMBERSHIP ROWS')
        indexes = q(npx, cfg, "SELECT seq,name,\"unique\" AS unique_value,origin,partial FROM pragma_index_list('membership_tier_policies') ORDER BY seq;", 'PRODUCTION CANONICAL MEMBERSHIP INDEXES')
        sort_index_info = q(npx, cfg, f'PRAGMA index_info("{SORT_INDEX}");', 'PRODUCTION CANONICAL MEMBERSHIP SORT INDEX COLUMNS')
        table_sql_rows = q(npx, cfg, "SELECT sql FROM sqlite_schema WHERE type='table' AND name='membership_tier_policies';", 'PRODUCTION CANONICAL MEMBERSHIP CREATE SQL')
        collisions = q(npx, cfg, f"SELECT type,name FROM sqlite_schema WHERE name IN ('{SHADOW_TABLE}','{ASSERT_TABLE}') ORDER BY name;", 'PRODUCTION MEMBERSHIP LEFTOVER REBUILD OBJECTS')
        sequence_rows = q(npx, cfg, "SELECT name,seq FROM sqlite_sequence WHERE name='membership_tier_policies';", 'PRODUCTION CANONICAL MEMBERSHIP SEQUENCE')

    column_names = [str(row.get('name') or '') for row in columns]
    tiers = [row.get('tier_code') for row in rows]
    sequence_value = int(sequence_rows[0].get('seq') or 0) if sequence_rows else None
    unique_tier_index = any(int(row.get('unique_value') or 0) == 1 and str(row.get('origin') or '') == 'u' for row in indexes)
    sort_index_columns = [str(row.get('name') or '') for row in sorted(sort_index_info, key=lambda row: int(row.get('seqno') or row.get('seq') or 0))]
    table_sql = str((table_sql_rows[0] if table_sql_rows else {}).get('sql') or '')
    return {
        'columns': columns,
        'column_names': column_names,
        'rows': rows,
        'row_count': len(rows),
        'tiers': tiers,
        'canonical_rows_sha256': stable_fingerprint(rows),
        'indexes': indexes,
        'unique_tier_index_present': unique_tier_index,
        'sort_index_name': SORT_INDEX,
        'sort_index_columns': sort_index_columns,
        'canonical_sort_index_present': sort_index_columns == CANONICAL_SORT_COLUMNS,
        'table_sql': table_sql,
        'autoincrement_present': 'AUTOINCREMENT' in table_sql.upper(),
        'leftover_rebuild_objects': collisions,
        'sequence_value': sequence_value,
    }


def state_passes(state: dict, expected_canonical_sha: str) -> bool:
    policy_ids = [row.get('policy_id') for row in state.get('rows') or []]
    sequence_value = state.get('sequence_value')
    sequence_ok = sequence_value is not None and policy_ids and sequence_value >= max(policy_ids)
    return all([
        state.get('column_names') == CANONICAL_COLUMNS,
        state.get('row_count') == 3,
        set(state.get('tiers') or []) == EXPECTED_TIERS,
        len(set(state.get('tiers') or [])) == 3,
        state.get('canonical_rows_sha256') == expected_canonical_sha,
        state.get('unique_tier_index_present') is True,
        state.get('canonical_sort_index_present') is True,
        state.get('autoincrement_present') is True,
        len(state.get('leftover_rebuild_objects') or []) == 0,
        sequence_ok,
    ])


def backup(confirm: str | None) -> None:
    require_token(confirm)
    hard_target_guard()
    before = fresh_preflight()
    additive.export_backup('membership')
    after_backup = fresh_preflight()
    if not exact_prewrite_match(before, after_backup):
        fail('Membership source state changed during the backup-only stage.')
    backup_info = additive.verify_backup('membership')
    payload = {
        'artifact': 'Build 436/437 Membership Build 395 backup/fingerprint boundary',
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'backup_path': backup_info.get('backup_path'),
        'backup_bytes': backup_info.get('backup_bytes'),
        'backup_sha256': backup_info.get('backup_sha256'),
        'source_rows_sha256': before.get('source_rows_sha256'),
        'canonical_preview_sha256': before.get('canonical_preview_sha256'),
        'membership_row_count': before.get('membership_row_count'),
        'policy_ids': before.get('policy_ids'),
        'raw_codes': before.get('raw_codes'),
        'legacy_sort_index_name': before.get('legacy_sort_index_name'),
        'legacy_sort_index_columns': before.get('legacy_sort_index_columns'),
        'production_mutation_executed': False,
        'production_promotion_open': False,
    }
    BACKUP_BOUNDARY.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('BUILD 436/437 MEMBERSHIP BACKUP/FINGERPRINT BOUNDARY: PASS')
    print(f'Rows protected: {payload["membership_row_count"]}')
    print(f'Source-row SHA-256: {payload["source_rows_sha256"]}')
    print(f'Canonical-preview SHA-256: {payload["canonical_preview_sha256"]}')
    print(f'Legacy sort index protected: {payload["legacy_sort_index_name"]} {payload["legacy_sort_index_columns"]}')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')


def load_backup_boundary() -> dict:
    if not BACKUP_BOUNDARY.exists():
        fail('Build 436 Membership backup/fingerprint boundary artifact is missing.')
    payload = json.loads(BACKUP_BOUNDARY.read_text(encoding='utf-8'))
    if payload.get('production_database_id') != PROD_ID or payload.get('membership_row_count') != 3:
        fail('Build 436 Membership backup/fingerprint boundary is invalid.')
    return payload


def apply(confirm: str | None) -> None:
    require_token(confirm)
    hard_target_guard()
    additive.verify_backup('membership')
    boundary = load_backup_boundary()
    before = fresh_preflight()
    if before.get('source_rows_sha256') != boundary.get('source_rows_sha256'):
        fail('Membership source-row fingerprint changed after backup; refusing rebuild.')
    if before.get('canonical_preview_sha256') != boundary.get('canonical_preview_sha256'):
        fail('Membership canonical-preview fingerprint changed after backup; refusing rebuild.')
    if before.get('policy_ids') != boundary.get('policy_ids') or before.get('membership_row_count') != 3:
        fail('Membership identity boundary changed after backup; refusing rebuild.')
    if before.get('legacy_sort_index_compatible') is not True or before.get('no_unhandled_user_objects') is not True:
        fail('Membership index/object boundary changed after backup; refusing rebuild.')

    additive.execute_sql('membership', rebuild_sql())
    after = current_canonical_state()
    passed = state_passes(after, str(boundary.get('canonical_preview_sha256') or ''))
    payload = {
        'artifact': 'Build 436/437 Production Membership Build 395 rebuild postcheck',
        'stage': 'membership',
        'scope': 'membership_build395_lossless_shadow_rebuild_with_sort_index',
        'pass': passed,
        'before_source_rows_sha256': boundary.get('source_rows_sha256'),
        'expected_canonical_rows_sha256': boundary.get('canonical_preview_sha256'),
        'after': after,
        'row_count_preserved': after.get('row_count') == boundary.get('membership_row_count'),
        'canonical_values_preserved': after.get('canonical_rows_sha256') == boundary.get('canonical_preview_sha256'),
        'canonical_sort_index_preserved': after.get('canonical_sort_index_present') is True,
        'production_mutation_executed': True,
        'production_promotion_open': False,
    }
    POSTCHECK.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('BUILD 436/437 PRODUCTION MEMBERSHIP BUILD 395 REBUILD POSTCHECK:', 'PASS' if passed else 'FAIL')
    print(f'Membership rows preserved: {boundary.get("membership_row_count")} -> {after.get("row_count")}')
    print(f'Canonical columns exact: {after.get("column_names") == CANONICAL_COLUMNS}')
    print(f'Canonical tier identities exact: {set(after.get("tiers") or []) == EXPECTED_TIERS}')
    print(f'Canonical values fingerprint preserved: {payload["canonical_values_preserved"]}')
    print(f'Tier UNIQUE constraint present: {after.get("unique_tier_index_present")}')
    print(f'Canonical sort index present: {after.get("canonical_sort_index_present")} / {after.get("sort_index_columns")}')
    print(f'AUTOINCREMENT present: {after.get("autoincrement_present")}')
    print(f'Leftover rebuild objects: {len(after.get("leftover_rebuild_objects") or [])}')
    print('PRODUCTION PROMOTION: CLOSED')
    if not passed:
        raise SystemExit(1)


def postcheck() -> None:
    hard_target_guard()
    boundary = load_backup_boundary()
    state = current_canonical_state()
    passed = state_passes(state, str(boundary.get('canonical_preview_sha256') or ''))
    print('BUILD 436/437 PRODUCTION MEMBERSHIP BUILD 395 READ-ONLY POSTCHECK:', 'PASS' if passed else 'FAIL')
    print(f'Membership rows: {state.get("row_count")}')
    print(f'Canonical columns exact: {state.get("column_names") == CANONICAL_COLUMNS}')
    print(f'Canonical tier identities exact: {set(state.get("tiers") or []) == EXPECTED_TIERS}')
    print(f'Canonical values fingerprint preserved: {state.get("canonical_rows_sha256") == boundary.get("canonical_preview_sha256")}')
    print(f'Tier UNIQUE constraint present: {state.get("unique_tier_index_present")}')
    print(f'Canonical sort index present: {state.get("canonical_sort_index_present")} / {state.get("sort_index_columns")}')
    print(f'AUTOINCREMENT present: {state.get("autoincrement_present")}')
    print(f'Leftover rebuild objects: {len(state.get("leftover_rebuild_objects") or [])}')
    print('PRODUCTION PROMOTION: CLOSED')
    raise SystemExit(0 if passed else 1)


def main() -> None:
    configure_console()
    parser = argparse.ArgumentParser()
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--backup', action='store_true')
    action.add_argument('--apply', action='store_true')
    action.add_argument('--postcheck', action='store_true')
    parser.add_argument('--confirm')
    args = parser.parse_args()

    if args.postcheck:
        postcheck()
    elif args.backup:
        backup(args.confirm)
    else:
        apply(args.confirm)


if __name__ == '__main__':
    main()
