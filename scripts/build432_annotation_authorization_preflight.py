#!/usr/bin/env python3
"""Build 432 read-only Build 197 annotation-index Production authorization preflight.

Requires completed Product-number, Gift Card, and full Build 403 Notification
Production proofs, then inspects only the Build 197 product-image annotation
composite-index boundary. No mutation path exists.
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
OUTPUT = ROOT / 'build432_annotation_authorization_preflight.local.json'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
ANNOTATION_INDEX = 'idx_product_image_annotations_product_image_build197'
REQUIRED_COLUMNS = {'product_id', 'product_image_id'}


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 432 ANNOTATION AUTHORIZATION PREFLIGHT: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def load_green(path: Path, label: str) -> dict:
    if not path.exists():
        fail(f'{label} artifact is missing.')
    payload = json.loads(path.read_text(encoding='utf-8'))
    if payload.get('pass') is not True:
        fail(f'{label} is not green.')
    return payload


def prerequisites() -> tuple[dict, dict, dict]:
    product = load_green(PRODUCT_POSTCHECK, 'Build 427 Product-number postcheck')
    gift = load_green(GIFT_POSTCHECK, 'Build 428 Gift Card Production postcheck')
    notification = load_green(NOTIFICATION_POSTCHECK, 'Build 431 full Notification Production postcheck')
    if product.get('production_min_product_number') != 1084 or product.get('production_max_product_number') != 1128:
        fail('Production Product-number range is no longer 1084..1128.')
    if int(product.get('production_sequence_next') or 0) < 1129:
        fail('Production Product-number sequence regressed below 1129.')
    if gift.get('stage') != 'gift' or gift.get('row_count_preserved') is not True:
        fail('Gift Card Production proof is incomplete.')
    if notification.get('stage') != 'notification' or notification.get('row_count_preserved') is not True:
        fail('Full Notification Production proof is incomplete.')
    if notification.get('all_five_indexes_present') is not True:
        fail('Full Notification Production proof does not confirm all five canonical indexes.')
    return product, gift, notification


def hard_target_guard() -> None:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match the Build 432 hard guard.')


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 432 {label}')


def main() -> int:
    configure_console()
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build432_annotation_authorization_preflight.py --run')
        return 2

    product, gift, notification = prerequisites()
    hard_target_guard()
    npx = base.npx_path()

    print('BUILD 432 BUILD 197 ANNOTATION-INDEX LIVE READ-ONLY AUTHORIZATION PREFLIGHT')
    print(f'Production target: {PROD_NAME} ({PROD_ID})')
    print('Product-number prerequisite: PASS / 1084..1128 / sequence >=1129')
    print('Gift Card prerequisite: PASS / Build 384 Production stage complete')
    print('Notification prerequisite: PASS / full Build 403 Production stage complete')
    print('D1 mutation capability: NONE')
    print('R2/provider mutation capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build432-annotation-') as td:
        cfg = Path(td) / 'prod.toml'
        cfg.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
        columns = {str(r.get('name') or '') for r in q(
            npx, cfg,
            "SELECT name FROM pragma_table_info('product_image_annotations') ORDER BY cid;",
            'PRODUCTION ANNOTATION COLUMNS',
        )}
        index_rows = q(
            npx, cfg,
            f"SELECT name, sql FROM sqlite_schema WHERE type='index' AND name='{ANNOTATION_INDEX}';",
            'PRODUCTION BUILD 197 ANNOTATION INDEX',
        )
        rows = q(
            npx, cfg,
            'SELECT COUNT(*) AS row_count FROM product_image_annotations;',
            'PRODUCTION ANNOTATION ROW COUNT',
        )

    index_exists = bool(index_rows)
    required_columns_present = REQUIRED_COLUMNS.issubset(columns)
    row_count = int(rows[0].get('row_count') or 0)
    exact_known_gap = (not index_exists and required_columns_present)

    payload = {
        'artifact': 'Build 432 Build 197 annotation-index Production authorization preflight',
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'product_number_prerequisite_pass': product.get('pass') is True,
        'gift_card_prerequisite_pass': gift.get('pass') is True,
        'notification_prerequisite_pass': notification.get('pass') is True,
        'annotation_index': ANNOTATION_INDEX,
        'annotation_index_exists': index_exists,
        'required_columns_present': required_columns_present,
        'product_image_annotations_rows': row_count,
        'exact_known_gap': exact_known_gap,
        'safe_to_request_annotation_authorization': exact_known_gap,
        'production_backup_created': False,
        'annotation_authorization_received': False,
        'production_mutation_executed': False,
        'rebuild_authorization_received': False,
        'production_promotion_open': False,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 432 BUILD 197 ANNOTATION AUTHORIZATION BOUNDARY ===')
    print(f'Annotation index exists: {index_exists}')
    print(f'Required product_id/product_image_id columns present: {required_columns_present}')
    print(f'product_image_annotations rows: {row_count}')
    print(f'Exact Build 197 index gap: {"YES" if exact_known_gap else "NO"}')
    print(f'Safe to request annotation authorization: {"YES" if exact_known_gap else "NO"}')
    print('Production backup created: NO')
    print('Annotation authorization received: NO')
    print('Production mutation executed: NO')
    print('Rebuild authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 432 ANNOTATION AUTHORIZATION PREFLIGHT:', 'PASS' if exact_known_gap else 'BLOCKED')
    return 0 if exact_known_gap else 1


if __name__ == '__main__':
    raise SystemExit(main())
