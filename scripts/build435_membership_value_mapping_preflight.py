#!/usr/bin/env python3
"""Build 435 read-only complete-row Membership Build 395 value-mapping preflight.

This closes the only unresolved legacy-to-canonical mapping question before any
Membership rebuild executor can exist: legacy `name` and `display_title` both
map toward canonical `title`. The script reads complete Production rows, proves
whether that mapping is lossless, fingerprints the exact source values, and has
no mutation or backup capability.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
BUILD434 = ROOT / 'build434_membership_authorization_preflight.local.json'
OUTPUT = ROOT / 'build435_membership_value_mapping_preflight.local.json'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
EXPECTED_TIERS = {'bronze', 'silver', 'gold'}
EXPECTED_LEGACY_COLUMNS = [
    'membership_tier_policy_id', 'code', 'name', 'display_title',
    'short_description', 'benefits_json', 'badge_color', 'is_visible',
    'sort_order', 'created_at', 'updated_at',
]
DIRECT_FIELDS = [
    'short_description', 'benefits_json', 'badge_color', 'sort_order',
    'is_visible', 'created_at', 'updated_at',
]


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 435 MEMBERSHIP VALUE-MAPPING PREFLIGHT: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def require_build434() -> dict:
    if not BUILD434.exists():
        fail('Build 434 Membership authorization preflight artifact is missing.')
    pre = json.loads(BUILD434.read_text(encoding='utf-8'))
    if pre.get('safe_to_request_membership_rebuild_authorization') is not True:
        fail('Build 434 Membership authorization boundary is not green.')
    if pre.get('membership_row_count') != 3 or pre.get('three_expected_tiers') is not True:
        fail('Build 434 Membership three-tier identity boundary is not green.')
    if pre.get('legacy_aliases_present') is not True or pre.get('rebuild_required') is not True:
        fail('Build 434 Membership legacy/rebuild boundary is not green.')
    if not all(pre.get(key) is True for key in (
        'product_number_prerequisite_pass', 'gift_card_prerequisite_pass',
        'notification_prerequisite_pass', 'annotation_prerequisite_pass',
    )):
        fail('Completed Production prerequisites are not all green in Build 434 evidence.')
    return pre


def hard_target_guard() -> None:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match the Build 435 hard guard.')


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 435 {label}')


def stable_fingerprint(rows: list[dict]) -> str:
    encoded = json.dumps(rows, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(encoded).hexdigest()


def main() -> int:
    configure_console()
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build435_membership_value_mapping_preflight.py --run')
        return 2

    build434 = require_build434()
    hard_target_guard()
    npx = base.npx_path()

    print('BUILD 435 MEMBERSHIP COMPLETE-ROW VALUE-MAPPING READ-ONLY PREFLIGHT')
    print(f'Production target: {PROD_NAME} ({PROD_ID})')
    print('Build 434 Membership authorization boundary: PASS / SOURCE-GATED')
    print('D1 mutation capability: NONE')
    print('R2/provider mutation capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build435-membership-values-') as td:
        cfg = Path(td) / 'prod.toml'
        cfg.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
        column_rows = q(
            npx, cfg,
            "SELECT cid,name,type,\"notnull\" AS notnull_value,dflt_value,pk FROM pragma_table_info('membership_tier_policies') ORDER BY cid;",
            'PRODUCTION MEMBERSHIP COLUMNS',
        )
        rows = q(npx, cfg, 'SELECT * FROM membership_tier_policies ORDER BY 1;', 'PRODUCTION MEMBERSHIP COMPLETE ROWS')

    columns = [str(row.get('name') or '') for row in column_rows]
    exact_legacy_shape = columns == EXPECTED_LEGACY_COLUMNS
    row_count = len(rows)
    raw_codes = [row.get('code') for row in rows]
    raw_codes_exact = set(raw_codes) == EXPECTED_TIERS and len(set(raw_codes)) == 3
    normalized_tiers = sorted(str(value or '').strip().lower() for value in raw_codes)
    normalized_expected = row_count == 3 and set(normalized_tiers) == EXPECTED_TIERS and len(set(normalized_tiers)) == 3

    title_comparisons = []
    for row in rows:
        title_comparisons.append({
            'membership_tier_policy_id': row.get('membership_tier_policy_id'),
            'code': row.get('code'),
            'name': row.get('name'),
            'display_title': row.get('display_title'),
            'exact_equal': row.get('name') == row.get('display_title'),
        })
    title_values_exact_equal = row_count == 3 and all(item['exact_equal'] for item in title_comparisons)

    direct_fields_present = all(field in columns for field in DIRECT_FIELDS)
    source_fingerprint = stable_fingerprint(rows)
    lossless_mapping_possible = (
        exact_legacy_shape and row_count == 3 and normalized_expected and raw_codes_exact
        and title_values_exact_equal and direct_fields_present
    )

    canonical_preview_rows = []
    if lossless_mapping_possible:
        for row in rows:
            canonical_preview_rows.append({
                'policy_id': row.get('membership_tier_policy_id'),
                'tier_code': row.get('code'),
                'title': row.get('display_title'),
                'short_description': row.get('short_description'),
                'benefits_json': row.get('benefits_json'),
                'badge_color': row.get('badge_color'),
                'sort_order': row.get('sort_order'),
                'is_visible': row.get('is_visible'),
                'created_at': row.get('created_at'),
                'updated_at': row.get('updated_at'),
            })

    payload = {
        'artifact': 'Build 435 Membership complete-row value-mapping preflight',
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'build434_boundary_green': build434.get('safe_to_request_membership_rebuild_authorization') is True,
        'source_columns': columns,
        'expected_legacy_columns': EXPECTED_LEGACY_COLUMNS,
        'exact_legacy_shape': exact_legacy_shape,
        'membership_row_count': row_count,
        'raw_codes': raw_codes,
        'raw_codes_exact': raw_codes_exact,
        'normalized_tiers': normalized_tiers,
        'normalized_tiers_expected': normalized_expected,
        'title_comparisons': title_comparisons,
        'title_values_exact_equal': title_values_exact_equal,
        'direct_fields': DIRECT_FIELDS,
        'direct_fields_present': direct_fields_present,
        'source_rows': rows,
        'source_rows_sha256': source_fingerprint,
        'canonical_preview_rows': canonical_preview_rows,
        'lossless_mapping_possible': lossless_mapping_possible,
        'safe_to_prepare_membership_execution_boundary': lossless_mapping_possible,
        'production_backup_created': False,
        'membership_rebuild_authorization_received': False,
        'production_mutation_executed': False,
        'later_rebuild_authorization_received': False,
        'production_promotion_open': False,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 435 MEMBERSHIP VALUE-MAPPING BOUNDARY ===')
    print(f'Legacy column shape exact: {exact_legacy_shape}')
    print(f'Membership rows: {row_count}')
    print(f'Raw tier codes: {raw_codes}')
    print(f'Raw codes exactly bronze/silver/gold: {raw_codes_exact}')
    print(f'Normalized tiers: {normalized_tiers}')
    print(f'name == display_title for every tier: {title_values_exact_equal}')
    for item in title_comparisons:
        print(f"  {item['code']}: name={item['name']!r} / display_title={item['display_title']!r} / equal={item['exact_equal']}")
    print(f'Direct preservation fields present: {direct_fields_present}')
    print(f'Complete source-row SHA-256: {source_fingerprint}')
    print(f'Lossless canonical mapping possible: {lossless_mapping_possible}')
    print(f'Safe to prepare Membership execution boundary: {lossless_mapping_possible}')
    print('Production backup created: NO')
    print('Membership rebuild authorization received: NO')
    print('Production mutation executed: NO')
    print('Later rebuild authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 435 MEMBERSHIP VALUE-MAPPING PREFLIGHT:', 'PASS' if lossless_mapping_possible else 'BLOCKED')
    return 0 if lossless_mapping_possible else 1


if __name__ == '__main__':
    raise SystemExit(main())
