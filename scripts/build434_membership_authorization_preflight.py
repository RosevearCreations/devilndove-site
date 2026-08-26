#!/usr/bin/env python3
"""Build 434 read-only Membership Build 395 Production authorization preflight.

Requires completed Product-number, Gift Card, full Build 403 Notification, and
Build 197 annotation Production proofs. Inspects membership_tier_policies only.
No backup, DDL, data mutation, or rebuild execution path exists.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
PRODUCT_POSTCHECK = ROOT / 'build427_production_product_number_postcheck.local.json'
GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'
NOTIFICATION_POSTCHECK = ROOT / 'build431_production_notification_postcheck.local.json'
ANNOTATION_POSTCHECK = ROOT / 'build433_production_annotation_postcheck.local.json'
OUTPUT = ROOT / 'build434_membership_authorization_preflight.local.json'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
CANONICAL_COLUMNS = [
    'policy_id', 'tier_code', 'title', 'short_description', 'benefits_json',
    'badge_color', 'sort_order', 'is_visible', 'created_at', 'updated_at',
]
EXPECTED_TIERS = {'bronze', 'silver', 'gold'}
LEGACY_ALIASES = {
    'membership_tier_policy_id': 'policy_id',
    'code': 'tier_code',
    'name': 'title',
    'display_title': 'title',
}


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 434 MEMBERSHIP AUTHORIZATION PREFLIGHT: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def load_green(path: Path, label: str) -> dict:
    if not path.exists():
        fail(f'{label} artifact is missing.')
    payload = json.loads(path.read_text(encoding='utf-8'))
    if payload.get('pass') is not True:
        fail(f'{label} is not green.')
    return payload


def prerequisites() -> tuple[dict, dict, dict, dict]:
    product = load_green(PRODUCT_POSTCHECK, 'Build 427 Product-number postcheck')
    gift = load_green(GIFT_POSTCHECK, 'Build 428 Gift Card postcheck')
    notification = load_green(NOTIFICATION_POSTCHECK, 'Build 431 full Notification postcheck')
    annotation = load_green(ANNOTATION_POSTCHECK, 'Build 433 annotation postcheck')
    if product.get('production_min_product_number') != 1084 or product.get('production_max_product_number') != 1128:
        fail('Production Product-number range is no longer 1084..1128.')
    if int(product.get('production_sequence_next') or 0) < 1129:
        fail('Production Product-number sequence regressed below 1129.')
    if gift.get('stage') != 'gift' or gift.get('row_count_preserved') is not True:
        fail('Gift Card prerequisite is incomplete.')
    if notification.get('stage') != 'notification' or notification.get('all_five_indexes_present') is not True:
        fail('Full Notification prerequisite is incomplete.')
    if annotation.get('stage') != 'annotation' or annotation.get('row_count_preserved') is not True or annotation.get('annotation_index_present') is not True:
        fail('Build 197 annotation prerequisite is incomplete.')
    return product, gift, notification, annotation


def hard_target_guard() -> None:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match the Build 434 hard guard.')


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 434 {label}')


def first_value(row: dict, names: tuple[str, ...]):
    for name in names:
        if name in row and row.get(name) is not None:
            return row.get(name)
    return None


def normalize_row(row: dict) -> dict:
    tier = first_value(row, ('tier_code', 'code'))
    title = first_value(row, ('title', 'display_title', 'name'))
    policy_id = first_value(row, ('policy_id', 'membership_tier_policy_id'))
    return {
        'policy_id': policy_id,
        'tier_code': str(tier or '').strip().lower(),
        'title': str(title or '').strip(),
    }


def main() -> int:
    configure_console()
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build434_membership_authorization_preflight.py --run')
        return 2

    product, gift, notification, annotation = prerequisites()
    hard_target_guard()
    npx = base.npx_path()

    print('BUILD 434 MEMBERSHIP BUILD 395 LIVE READ-ONLY AUTHORIZATION PREFLIGHT')
    print(f'Production target: {PROD_NAME} ({PROD_ID})')
    print('Product/Gift/Notification/Annotation prerequisites: PASS')
    print('D1 mutation capability: NONE')
    print('R2/provider mutation capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build434-membership-') as td:
        cfg = Path(td) / 'prod.toml'
        cfg.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
        column_rows = q(npx, cfg, "SELECT cid,name,type,\"notnull\" AS notnull_value,dflt_value,pk FROM pragma_table_info('membership_tier_policies') ORDER BY cid;", 'PRODUCTION MEMBERSHIP COLUMNS')
        rows = q(npx, cfg, 'SELECT * FROM membership_tier_policies ORDER BY 1;', 'PRODUCTION MEMBERSHIP ROWS')
        table_rows = q(npx, cfg, "SELECT sql FROM sqlite_schema WHERE type='table' AND name='membership_tier_policies';", 'PRODUCTION MEMBERSHIP CREATE SQL')

    columns = [str(row.get('name') or '') for row in column_rows]
    column_set = set(columns)
    normalized = [normalize_row(row) for row in rows]
    normalized_tiers = sorted(row['tier_code'] for row in normalized)
    row_count = len(rows)
    canonical_column_names_exact = columns == CANONICAL_COLUMNS
    legacy_aliases_present = all(name in column_set for name in LEGACY_ALIASES)
    three_expected_tiers = row_count == 3 and set(normalized_tiers) == EXPECTED_TIERS and len(set(normalized_tiers)) == 3
    rebuild_required = not canonical_column_names_exact
    safe_to_request = rebuild_required and legacy_aliases_present and three_expected_tiers

    payload = {
        'artifact': 'Build 434 Membership Build 395 Production authorization preflight',
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'product_number_prerequisite_pass': product.get('pass') is True,
        'gift_card_prerequisite_pass': gift.get('pass') is True,
        'notification_prerequisite_pass': notification.get('pass') is True,
        'annotation_prerequisite_pass': annotation.get('pass') is True,
        'membership_row_count': row_count,
        'production_columns': columns,
        'canonical_columns': CANONICAL_COLUMNS,
        'canonical_column_names_exact': canonical_column_names_exact,
        'legacy_aliases': LEGACY_ALIASES,
        'legacy_aliases_present': legacy_aliases_present,
        'normalized_rows': normalized,
        'normalized_tiers': normalized_tiers,
        'three_expected_tiers': three_expected_tiers,
        'rebuild_required': rebuild_required,
        'safe_to_request_membership_rebuild_authorization': safe_to_request,
        'production_table_sql': str((table_rows[0] if table_rows else {}).get('sql') or ''),
        'production_backup_created': False,
        'membership_rebuild_authorization_received': False,
        'production_mutation_executed': False,
        'fractional_rebuild_authorization_received': False,
        'product_fk_authorization_received': False,
        'accounting_rebuild_authorization_received': False,
        'production_promotion_open': False,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 434 MEMBERSHIP BUILD 395 AUTHORIZATION BOUNDARY ===')
    print(f'Production columns: {columns}')
    print(f'Membership rows: {row_count}')
    print(f'Normalized tiers: {normalized_tiers}')
    print(f'Exactly bronze/silver/gold: {three_expected_tiers}')
    print(f'Canonical column names exact: {canonical_column_names_exact}')
    print(f'Legacy alias mapping present: {legacy_aliases_present}')
    print(f'Rebuild required: {rebuild_required}')
    print(f'Safe to request Membership rebuild authorization: {safe_to_request}')
    print('Production backup created: NO')
    print('Membership rebuild authorization received: NO')
    print('Production mutation executed: NO')
    print('Later rebuild authorizations: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 434 MEMBERSHIP AUTHORIZATION PREFLIGHT:', 'PASS' if safe_to_request else 'BLOCKED')
    return 0 if safe_to_request else 1


if __name__ == '__main__':
    raise SystemExit(main())
