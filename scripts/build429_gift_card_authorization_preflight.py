#!/usr/bin/env python3
"""Build 429 read-only Gift Card Production authorization preflight.

This helper narrows the remaining Production work to the Build 384 Gift Card
lookup-attempt/lockout additive family. It does not create a backup and cannot
mutate Production.
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
OUTPUT = ROOT / 'build429_gift_card_authorization_preflight.local.json'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
EXPECTED_MISSING_COLUMNS = {'lookup_email', 'code_suffix', 'ip_hash', 'user_agent', 'result_status'}
EXPECTED_MISSING_INDEXES = {
    'idx_gift_card_lookup_attempts_created',
    'idx_gift_card_lookup_attempts_email',
    'idx_gift_card_lookup_lockouts_status',
}


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 429 GIFT CARD AUTHORIZATION PREFLIGHT: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def require_product_prerequisite() -> dict:
    if not PRODUCT_POSTCHECK.exists():
        fail('Build 427 Product-number postcheck artifact is missing.')
    payload = json.loads(PRODUCT_POSTCHECK.read_text(encoding='utf-8'))
    if payload.get('pass') is not True:
        fail('Build 427 Product-number prerequisite is not green.')
    if payload.get('production_min_product_number') != 1084 or payload.get('production_max_product_number') != 1128:
        fail('Production Product-number range is no longer the proven 1084..1128 block.')
    if int(payload.get('production_sequence_next') or 0) < 1129:
        fail('Production Product-number sequence regressed below 1129.')
    return payload


def hard_target_guard() -> None:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match the Build 429 hard guard.')


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 429 {label}')


def main() -> int:
    configure_console()
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build429_gift_card_authorization_preflight.py --run')
        return 2

    product = require_product_prerequisite()
    hard_target_guard()
    npx = base.npx_path()

    print('BUILD 429 GIFT CARD LIVE READ-ONLY AUTHORIZATION PREFLIGHT')
    print(f'Production target: {PROD_NAME} ({PROD_ID})')
    print('Product-number prerequisite: PASS / 1084..1128 / sequence >=1129')
    print('D1 mutation capability: NONE')
    print('R2/provider mutation capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build429-gift-') as td:
        cfg = Path(td) / 'prod.toml'
        cfg.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')

        cols = {str(r.get('name') or '') for r in q(
            npx, cfg,
            "SELECT name FROM pragma_table_info('gift_card_lookup_attempts') ORDER BY cid;",
            'PRODUCTION GIFT LOOKUP COLUMNS',
        )}
        indexes = {str(r.get('name') or '') for r in q(
            npx, cfg,
            "SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name IN ('gift_card_lookup_attempts','gift_card_lookup_lockouts') AND sql IS NOT NULL ORDER BY name;",
            'PRODUCTION GIFT INDEXES',
        )}
        lockout_exists = bool(q(
            npx, cfg,
            "SELECT name FROM sqlite_schema WHERE type='table' AND name='gift_card_lookup_lockouts';",
            'PRODUCTION GIFT LOCKOUT TABLE',
        ))
        lookup_rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM gift_card_lookup_attempts;', 'PRODUCTION GIFT LOOKUP ROW COUNT')
        gift_rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM gift_cards;', 'PRODUCTION GIFT CARD ROW COUNT')
        redemption_rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM gift_card_redemptions;', 'PRODUCTION GIFT REDEMPTION ROW COUNT')

    missing_columns = sorted(EXPECTED_MISSING_COLUMNS - cols)
    missing_indexes = sorted(EXPECTED_MISSING_INDEXES - indexes)
    exact_known_gap = (
        set(missing_columns) == EXPECTED_MISSING_COLUMNS
        and set(missing_indexes) == EXPECTED_MISSING_INDEXES
        and not lockout_exists
    )

    payload = {
        'artifact': 'Build 429 Gift Card Production authorization preflight',
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'product_number_prerequisite_pass': product.get('pass') is True,
        'missing_lookup_columns': missing_columns,
        'missing_indexes': missing_indexes,
        'lockout_table_exists': lockout_exists,
        'gift_card_lookup_attempt_rows': int(lookup_rows[0].get('row_count') or 0),
        'gift_cards_rows': int(gift_rows[0].get('row_count') or 0),
        'gift_card_redemptions_rows': int(redemption_rows[0].get('row_count') or 0),
        'exact_known_gap': exact_known_gap,
        'safe_to_request_gift_card_authorization': exact_known_gap,
        'production_backup_created': False,
        'gift_card_authorization_received': False,
        'production_mutation_executed': False,
        'notification_authorization_received': False,
        'annotation_authorization_received': False,
        'rebuild_authorization_received': False,
        'production_promotion_open': False,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 429 GIFT CARD AUTHORIZATION BOUNDARY ===')
    print(f'Missing lookup columns: {missing_columns}')
    print(f'Missing Gift Card indexes: {missing_indexes}')
    print(f'Gift Card lockout table exists: {lockout_exists}')
    print(f'gift_card_lookup_attempts rows: {payload["gift_card_lookup_attempt_rows"]}')
    print(f'gift_cards rows: {payload["gift_cards_rows"]}')
    print(f'gift_card_redemptions rows: {payload["gift_card_redemptions_rows"]}')
    print(f'Exact known Build 384 gap: {"YES" if exact_known_gap else "NO"}')
    print(f'Safe to request Gift Card authorization: {"YES" if exact_known_gap else "NO"}')
    print('Production backup created: NO')
    print('Gift Card authorization received: NO')
    print('Production mutation executed: NO')
    print('Notification/annotation/rebuild authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 429 GIFT CARD AUTHORIZATION PREFLIGHT:', 'PASS' if exact_known_gap else 'BLOCKED')
    return 0 if exact_known_gap else 1


if __name__ == '__main__':
    raise SystemExit(main())
