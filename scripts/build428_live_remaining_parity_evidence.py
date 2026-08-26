#!/usr/bin/env python3
"""Build 428 live read-only evidence for remaining Production parity families.

Product numbers are already closed by Build 427. This helper refreshes only the
remaining additive/rebuild evidence and cannot mutate D1/R2/providers.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'build428_live_remaining_parity_evidence.local.json'
PRODUCT_POSTCHECK = ROOT / 'build427_production_product_number_postcheck.local.json'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
DEV_NAME = 'devilndove-dev'
DEV_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
GIFT_COLUMNS = {'lookup_email', 'code_suffix', 'ip_hash', 'user_agent', 'result_status'}
GIFT_INDEXES = {
    'idx_gift_card_lookup_attempts_created',
    'idx_gift_card_lookup_attempts_email',
    'idx_gift_card_lookup_lockouts_status',
}
NOTIFICATION_INDEXES = {
    'idx_notification_outbox_kind_destination',
    'idx_notification_outbox_order',
    'idx_notification_outbox_payment',
    'idx_notification_outbox_product',
}
ANNOTATION_INDEX = 'idx_product_image_annotations_product_image_build197'
FRACTIONAL_TABLES = [
    'site_item_inventory',
    'site_inventory_movements',
    'creative_project_inventory_posts',
    'creative_project_inventory_reversals',
    'product_material_return_audit',
]


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 428 REMAINING PARITY EVIDENCE: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 428 {label}')


def count(npx: str, cfg: Path, table: str, label: str) -> int:
    rows = q(npx, cfg, f'SELECT COUNT(*) AS row_count FROM "{table}";', label)
    return int(rows[0].get('row_count') or 0) if rows else 0


def columns(npx: str, cfg: Path, table: str, label: str) -> list[dict]:
    return q(npx, cfg, f"SELECT cid,name,type,\"notnull\",dflt_value,pk FROM pragma_table_info('{table}') ORDER BY cid;", label)


def indexes(npx: str, cfg: Path, table: str, label: str) -> set[str]:
    rows = q(npx, cfg, f"SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name='{table}' AND sql IS NOT NULL ORDER BY name;", label)
    return {str(r.get('name') or '') for r in rows}


def require_product_postcheck() -> dict:
    if not PRODUCT_POSTCHECK.exists():
        fail('Build 427 Product-number postcheck artifact is missing.')
    payload = json.loads(PRODUCT_POSTCHECK.read_text(encoding='utf-8'))
    if payload.get('pass') is not True:
        fail('Build 427 Product-number Production postcheck is not green.')
    if int(payload.get('production_min_product_number') or 0) != 1084 or int(payload.get('production_max_product_number') or 0) != 1128:
        fail('Build 427 Production Product-number range is not exact 1084..1128.')
    return payload


def main() -> int:
    configure_console()
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build428_live_remaining_parity_evidence.py --run')
        return 2

    product = require_product_postcheck()
    base.validate_dev_pin()
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match Build 428 hard guard.')
    if base.DEV_DATABASE != DEV_NAME or base.DEV_DATABASE_ID != DEV_ID:
        fail('Development target constants do not match Build 428 hard guard.')

    npx = base.npx_path()
    print('BUILD 428 LIVE READ-ONLY REMAINING PARITY EVIDENCE')
    print(f'Production target: {PROD_NAME} ({PROD_ID})')
    print('Product-number prerequisite: PASS / 1084..1128')
    print('D1 mutation capability: NONE')
    print('R2/provider mutation capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build428-') as td:
        temp = Path(td)
        prod_cfg = temp / 'prod.toml'
        dev_cfg = temp / 'dev.toml'
        prod_cfg.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
        dev_cfg.write_text(base.readonly_config(base.DEV_PROJECT, DEV_NAME, DEV_ID), encoding='utf-8')

        gift_cols = {str(r.get('name') or '') for r in columns(npx, prod_cfg, 'gift_card_lookup_attempts', 'PRODUCTION GIFT COLUMNS')}
        gift_idx = indexes(npx, prod_cfg, 'gift_card_lookup_attempts', 'PRODUCTION GIFT LOOKUP INDEXES')
        lockout_exists = bool(q(npx, prod_cfg, "SELECT name FROM sqlite_schema WHERE type='table' AND name='gift_card_lookup_lockouts';", 'PRODUCTION GIFT LOCKOUT TABLE'))
        if lockout_exists:
            gift_idx |= indexes(npx, prod_cfg, 'gift_card_lookup_lockouts', 'PRODUCTION GIFT LOCKOUT INDEXES')
        gift_rows = count(npx, prod_cfg, 'gift_card_lookup_attempts', 'PRODUCTION GIFT LOOKUP ROW COUNT')

        notif_cols = {str(r.get('name') or '') for r in columns(npx, prod_cfg, 'notification_outbox', 'PRODUCTION NOTIFICATION COLUMNS')}
        notif_idx = indexes(npx, prod_cfg, 'notification_outbox', 'PRODUCTION NOTIFICATION INDEXES')
        notif_rows = count(npx, prod_cfg, 'notification_outbox', 'PRODUCTION NOTIFICATION ROW COUNT')

        ann_idx = indexes(npx, prod_cfg, 'product_image_annotations', 'PRODUCTION ANNOTATION INDEXES')
        ann_rows = count(npx, prod_cfg, 'product_image_annotations', 'PRODUCTION ANNOTATION ROW COUNT')

        membership_prod = columns(npx, prod_cfg, 'membership_tier_policies', 'PRODUCTION MEMBERSHIP COLUMNS')
        membership_dev = columns(npx, dev_cfg, 'membership_tier_policies', 'DEVELOPMENT MEMBERSHIP COLUMNS')
        membership_rows = count(npx, prod_cfg, 'membership_tier_policies', 'PRODUCTION MEMBERSHIP ROW COUNT')
        membership_codes = q(npx, prod_cfg, 'SELECT * FROM membership_tier_policies ORDER BY 1;', 'PRODUCTION MEMBERSHIP ROW SNAPSHOT')

        fractional = {}
        for table in FRACTIONAL_TABLES:
            prod_cols = columns(npx, prod_cfg, table, f'PRODUCTION {table} COLUMNS')
            dev_cols = columns(npx, dev_cfg, table, f'DEVELOPMENT {table} COLUMNS')
            pmap = {str(r.get('name') or ''): str(r.get('type') or '').upper() for r in prod_cols}
            dmap = {str(r.get('name') or ''): str(r.get('type') or '').upper() for r in dev_cols}
            changed = sorted(name for name in pmap.keys() & dmap.keys() if pmap[name] != dmap[name])
            fractional[table] = {
                'production_rows': count(npx, prod_cfg, table, f'PRODUCTION {table} ROW COUNT'),
                'development_rows': count(npx, dev_cfg, table, f'DEVELOPMENT {table} ROW COUNT'),
                'type_changed_columns': changed,
                'production_types': {name: pmap[name] for name in changed},
                'development_types': {name: dmap[name] for name in changed},
            }

        orphans = {
            'product_media_score_history_product': count(npx, prod_cfg, '(SELECT 1)', 'DUMMY') if False else 0,
        }
        orphan_queries = {
            'product_media_score_history_product': "SELECT COUNT(*) AS orphan_count FROM product_media_score_history x LEFT JOIN products p ON p.product_id=x.product_id WHERE x.product_id IS NOT NULL AND p.product_id IS NULL;",
            'product_media_score_history_actor': "SELECT COUNT(*) AS orphan_count FROM product_media_score_history x LEFT JOIN users u ON u.user_id=x.actor_user_id WHERE x.actor_user_id IS NOT NULL AND u.user_id IS NULL;",
            'product_review_actions_actor': "SELECT COUNT(*) AS orphan_count FROM product_review_actions x LEFT JOIN users u ON u.user_id=x.actor_user_id WHERE x.actor_user_id IS NOT NULL AND u.user_id IS NULL;",
            'products_capture_created': "SELECT COUNT(*) AS orphan_count FROM products x LEFT JOIN users u ON u.user_id=x.capture_created_by_user_id WHERE x.capture_created_by_user_id IS NOT NULL AND u.user_id IS NULL;",
            'products_capture_updated': "SELECT COUNT(*) AS orphan_count FROM products x LEFT JOIN users u ON u.user_id=x.capture_updated_by_user_id WHERE x.capture_updated_by_user_id IS NOT NULL AND u.user_id IS NULL;",
            'site_page_views_session': "SELECT COUNT(*) AS orphan_count FROM site_page_views x LEFT JOIN site_visitor_sessions s ON s.site_visitor_session_id=x.site_visitor_session_id WHERE x.site_visitor_session_id IS NOT NULL AND s.site_visitor_session_id IS NULL;",
            'supplier_po_inventory': "SELECT COUNT(*) AS orphan_count FROM supplier_purchase_order_items x LEFT JOIN site_item_inventory i ON i.site_item_inventory_id=x.site_item_inventory_id WHERE x.site_item_inventory_id IS NOT NULL AND i.site_item_inventory_id IS NULL;",
        }
        orphans = {}
        for key, sql in orphan_queries.items():
            rows = q(npx, prod_cfg, sql, f'PRODUCTION {key} ORPHANS')
            orphans[key] = int(rows[0].get('orphan_count') or 0) if rows else 0

        search_rows = count(npx, prod_cfg, 'search_query_terms', 'PRODUCTION SEARCH QUERY TERMS COUNT')
        sql_test_rows = count(npx, prod_cfg, '__sql_test', 'PRODUCTION SQL TEST COUNT')
        caip_rows = count(npx, prod_cfg, 'caip_media_upload_files', 'PRODUCTION CAIP COUNT')

    gift_missing_cols = sorted(GIFT_COLUMNS - gift_cols)
    gift_missing_idx = sorted(GIFT_INDEXES - gift_idx)
    notif_missing_idx = sorted(NOTIFICATION_INDEXES - notif_idx)
    payload = {
        'artifact': 'Build 428 live remaining Production parity evidence',
        'product_number_prerequisite_pass': True,
        'product_number_range': [1084, 1128],
        'product_number_sequence_next': int(product.get('production_sequence_next') or 0),
        'gift_card': {
            'lookup_attempt_rows': gift_rows,
            'missing_columns': gift_missing_cols,
            'lockout_table_exists': lockout_exists,
            'missing_indexes': gift_missing_idx,
            'ready_for_separate_authorization': True,
        },
        'notification': {
            'outbox_rows': notif_rows,
            'metadata_json_exists': 'metadata_json' in notif_cols,
            'missing_indexes': notif_missing_idx,
            'ready_for_separate_authorization': True,
        },
        'product_image_annotations': {
            'rows': ann_rows,
            'build197_index_exists': ANNOTATION_INDEX in ann_idx,
            'ready_for_separate_authorization': True,
        },
        'membership': {
            'production_rows': membership_rows,
            'production_columns': [str(r.get('name') or '') for r in membership_prod],
            'development_columns': [str(r.get('name') or '') for r in membership_dev],
            'requires_rebuild': [str(r.get('name') or '') for r in membership_prod] != [str(r.get('name') or '') for r in membership_dev],
            'row_snapshot': membership_codes,
            'authorized': False,
        },
        'fractional_tables': fractional,
        'orphan_counts': orphans,
        'zero_orphans': all(v == 0 for v in orphans.values()),
        'site_item_inventory_rows': fractional['site_item_inventory']['production_rows'],
        'search_query_terms_rows': search_rows,
        '__sql_test_rows': sql_test_rows,
        'caip_media_upload_files_rows': caip_rows,
        'gift_card_authorized': False,
        'notification_authorized': False,
        'annotation_authorized': False,
        'rebuild_authorized': False,
        'production_mutation_executed': False,
        'production_promotion_open': False,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 428 REMAINING PARITY SUMMARY ===')
    print(f'Gift Card missing columns: {gift_missing_cols}')
    print(f'Gift Card missing indexes: {gift_missing_idx}')
    print(f'Gift Card lockout exists: {lockout_exists}')
    print(f'Notification metadata_json exists: {"metadata_json" in notif_cols}')
    print(f'Notification missing indexes: {notif_missing_idx}')
    print(f'Build 197 annotation index exists: {ANNOTATION_INDEX in ann_idx}')
    print(f'Membership rows: {membership_rows}; rebuild required: {payload["membership"]["requires_rebuild"]}')
    print(f'Product/FK orphan counts all zero: {payload["zero_orphans"]}')
    print(f'site_item_inventory Production rows: {payload["site_item_inventory_rows"]}')
    print(f'search_query_terms rows preserved: {search_rows}')
    print(f'__sql_test rows untouched: {sql_test_rows}')
    print(f'CAIP rows excluded: {caip_rows}')
    print('Remaining Production authorization inferred: NO')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 428 LIVE READ-ONLY REMAINING PARITY EVIDENCE: PASS')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
