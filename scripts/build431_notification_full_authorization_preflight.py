#!/usr/bin/env python3
"""Build 431 read-only corrected full-Build-403 Notification authorization preflight."""
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
OUTPUT = ROOT / 'build431_notification_full_authorization_preflight.local.json'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
EXPECTED_MISSING_INDEXES = {
    'idx_notification_outbox_status_due',
    'idx_notification_outbox_kind_destination',
    'idx_notification_outbox_order',
    'idx_notification_outbox_payment',
    'idx_notification_outbox_product',
}


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 431 FULL NOTIFICATION AUTHORIZATION PREFLIGHT: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def load_required(path: Path, label: str) -> dict:
    if not path.exists():
        fail(f'{label} artifact is missing.')
    payload = json.loads(path.read_text(encoding='utf-8'))
    if payload.get('pass') is not True:
        fail(f'{label} is not green.')
    return payload


def prerequisites() -> tuple[dict, dict]:
    product = load_required(PRODUCT_POSTCHECK, 'Build 427 Product-number postcheck')
    gift = load_required(GIFT_POSTCHECK, 'Build 428 Gift Card Production postcheck')
    if product.get('production_min_product_number') != 1084 or product.get('production_max_product_number') != 1128:
        fail('Production Product-number range is no longer 1084..1128.')
    if int(product.get('production_sequence_next') or 0) < 1129:
        fail('Production Product-number sequence regressed below 1129.')
    if gift.get('stage') != 'gift' or gift.get('row_count_preserved') is not True:
        fail('Gift Card Production proof is not the preserved completed gift stage.')
    return product, gift


def hard_target_guard() -> None:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match the Build 431 hard guard.')


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 431 {label}')


def main() -> int:
    configure_console()
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build431_notification_full_authorization_preflight.py --run')
        return 2

    product, gift = prerequisites()
    hard_target_guard()
    npx = base.npx_path()

    print('BUILD 431 FULL BUILD 403 NOTIFICATION LIVE READ-ONLY AUTHORIZATION PREFLIGHT')
    print(f'Production target: {PROD_NAME} ({PROD_ID})')
    print('Product-number prerequisite: PASS / 1084..1128 / sequence >=1129')
    print('Gift Card prerequisite: PASS / Build 384 Production stage complete')
    print('D1 mutation capability: NONE')
    print('R2/provider mutation capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build431-notification-full-') as td:
        cfg = Path(td) / 'prod.toml'
        cfg.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
        cols = {str(r.get('name') or '') for r in q(
            npx, cfg,
            "SELECT name FROM pragma_table_info('notification_outbox') ORDER BY cid;",
            'PRODUCTION NOTIFICATION COLUMNS',
        )}
        indexes = {str(r.get('name') or '') for r in q(
            npx, cfg,
            "SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name='notification_outbox' AND sql IS NOT NULL ORDER BY name;",
            'PRODUCTION NOTIFICATION INDEXES',
        )}
        rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM notification_outbox;', 'PRODUCTION NOTIFICATION ROW COUNT')

    metadata_exists = 'metadata_json' in cols
    missing_indexes = sorted(EXPECTED_MISSING_INDEXES - indexes)
    exact_known_gap = (not metadata_exists and set(missing_indexes) == EXPECTED_MISSING_INDEXES)
    payload = {
        'artifact': 'Build 431 corrected full Build 403 Notification Production authorization preflight',
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'product_number_prerequisite_pass': product.get('pass') is True,
        'gift_card_prerequisite_pass': gift.get('pass') is True,
        'metadata_json_exists': metadata_exists,
        'missing_indexes': missing_indexes,
        'notification_outbox_rows': int(rows[0].get('row_count') or 0),
        'exact_full_build403_gap': exact_known_gap,
        'safe_to_request_full_notification_authorization': exact_known_gap,
        'prior_four_index_authorization_sufficient': False,
        'production_backup_created': False,
        'full_notification_authorization_received': False,
        'production_mutation_executed': False,
        'annotation_authorization_received': False,
        'rebuild_authorization_received': False,
        'production_promotion_open': False,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 431 CORRECTED NOTIFICATION AUTHORIZATION BOUNDARY ===')
    print(f'metadata_json exists: {metadata_exists}')
    print(f'Missing canonical Notification indexes: {missing_indexes}')
    print(f'notification_outbox rows: {payload["notification_outbox_rows"]}')
    print(f'Exact full Build 403 gap: {"YES" if exact_known_gap else "NO"}')
    print(f'Prior four-index authorization sufficient: NO')
    print(f'Safe to request full Notification authorization: {"YES" if exact_known_gap else "NO"}')
    print('Production backup created: NO')
    print('Full Notification authorization received: NO')
    print('Production mutation executed: NO')
    print('Annotation/rebuild authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 431 FULL NOTIFICATION AUTHORIZATION PREFLIGHT:', 'PASS' if exact_known_gap else 'BLOCKED')
    return 0 if exact_known_gap else 1


if __name__ == '__main__':
    raise SystemExit(main())
