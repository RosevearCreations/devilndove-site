#!/usr/bin/env python3
"""Build 426 live read-only Production release-candidate evidence.

This helper refreshes the bounded evidence needed after the successful Build 425
Development-only Product-number backfill. It cannot mutate Development or
Production. The output is a local JSON artifact consumed by the Build 426 package
assembler and completion gate.
"""
from __future__ import annotations

from pathlib import Path
import json
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'build426_live_release_candidate_evidence.local.json'
EXPECTED_PRODUCTS = 45
EXPECTED_START = 1084
EXPECTED_END = 1128
EXPECTED_NEXT = 1129
FRACTIONAL_TABLES = [
    'site_item_inventory',
    'site_inventory_movements',
    'creative_project_inventory_posts',
    'creative_project_inventory_reversals',
    'product_material_return_audit',
]
PRODUCT_NUMBER_TABLES = ['product_costs', 'product_deletion_audit', 'products']


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 426 {label}')


def as_int(value, default=None):
    try:
        if value is None or str(value).strip() == '':
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def clean(value) -> str:
    return str(value or '').strip()


def identity(row: dict) -> tuple:
    return (as_int(row.get('product_id')), clean(row.get('slug')).lower(), clean(row.get('name')).casefold())


def col_names(rows: list[dict]) -> list[str]:
    return [str(row.get('name') or '') for row in rows]


def index_names(inv: dict[str, str], table: str) -> list[str]:
    # Kept for compatibility with older source; explicit index names are read separately.
    return []


def orphan_count(npx: str, cfg: Path, sql: str, label: str) -> int:
    rows = q(npx, cfg, sql, label)
    return as_int(rows[0].get('orphan_count'), 0) if rows else 0


def table_count(npx: str, cfg: Path, table: str, label: str) -> int:
    rows = q(npx, cfg, f'SELECT COUNT(*) AS row_count FROM "{table}";', label)
    return as_int(rows[0].get('row_count'), 0) if rows else 0


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build426_live_release_candidate_evidence.py --run')
        return 2

    base.validate_dev_pin()
    npx = base.npx_path()
    print('BUILD 426 LIVE READ-ONLY PRODUCTION RELEASE-CANDIDATE EVIDENCE')
    print(f'Development target: {base.DEV_DATABASE} ({base.DEV_DATABASE_ID})')
    print(f'Production target:  {base.PROD_DATABASE} ({base.PROD_DATABASE_ID})')
    print('D1 mutation capability: NONE')
    print('R2/provider mutation capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build426-') as temp_dir:
        temp = Path(temp_dir)
        dev_cfg = temp / 'dev.toml'
        prod_cfg = temp / 'prod.toml'
        dev_cfg.write_text(base.readonly_config(base.DEV_PROJECT, base.DEV_DATABASE, base.DEV_DATABASE_ID), encoding='utf-8')
        prod_cfg.write_text(base.readonly_config(base.PROD_PROJECT, base.PROD_DATABASE, base.PROD_DATABASE_ID), encoding='utf-8')

        dev_inv = base.inventory(npx, dev_cfg, 'BUILD 426 DEVELOPMENT')
        prod_inv = base.inventory(npx, prod_cfg, 'BUILD 426 PRODUCTION')

        product_sql = 'SELECT product_id,product_number,name,slug,sku,status FROM products ORDER BY product_id;'
        dev_products = q(npx, dev_cfg, product_sql, 'DEVELOPMENT PRODUCTS')
        prod_products = q(npx, prod_cfg, product_sql, 'PRODUCTION PRODUCTS')
        dev_by_id = {as_int(row.get('product_id')): row for row in dev_products}
        prod_by_id = {as_int(row.get('product_id')): row for row in prod_products}
        shared_ids = sorted(set(dev_by_id) & set(prod_by_id))
        identity_mismatches = [pid for pid in shared_ids if identity(dev_by_id[pid]) != identity(prod_by_id[pid])]
        dev_numbers = [as_int(row.get('product_number')) for row in dev_products if as_int(row.get('product_number')) is not None]
        prod_numbers = [as_int(row.get('product_number')) for row in prod_products if as_int(row.get('product_number')) is not None]

        dev_seq_rows = q(npx, dev_cfg, "SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products' LIMIT 1;", 'DEVELOPMENT PRODUCT SEQUENCE')
        prod_seq_rows = q(npx, prod_cfg, "SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products' LIMIT 1;", 'PRODUCTION PRODUCT SEQUENCE')
        dev_seq = as_int(dev_seq_rows[0].get('next_product_number')) if dev_seq_rows else None
        prod_seq = as_int(prod_seq_rows[0].get('next_product_number')) if prod_seq_rows else None

        prod_reserved = set()
        for table in PRODUCT_NUMBER_TABLES:
            if table not in prod_inv:
                continue
            rows = q(
                npx, prod_cfg,
                f'SELECT DISTINCT CAST(product_number AS INTEGER) AS product_number FROM "{table}" '
                "WHERE product_number IS NOT NULL AND trim(CAST(product_number AS TEXT))<>'' AND CAST(product_number AS INTEGER)>0 ORDER BY product_number;",
                f'PRODUCTION {table} PRODUCT NUMBER HISTORY',
            )
            for row in rows:
                number = as_int(row.get('product_number'))
                if number:
                    prod_reserved.add(number)

        target_tables = sorted(set(FRACTIONAL_TABLES + [
            'gift_card_lookup_attempts', 'notification_outbox', 'product_image_annotations', 'membership_tier_policies'
        ]))
        dev_columns = base.load_column_rows(npx, dev_cfg, target_tables, 'BUILD 426 DEVELOPMENT')
        prod_columns = base.load_column_rows(npx, prod_cfg, [t for t in target_tables if t in prod_inv], 'BUILD 426 PRODUCTION')
        dev_indexes = base.load_index_rows(npx, dev_cfg, 'BUILD 426 DEVELOPMENT')
        prod_indexes = base.load_index_rows(npx, prod_cfg, 'BUILD 426 PRODUCTION')

        gift_expected = {'lookup_email', 'code_suffix', 'ip_hash', 'user_agent', 'result_status'}
        gift_prod_cols = set(col_names(prod_columns.get('gift_card_lookup_attempts', [])))
        gift_missing_cols = sorted(gift_expected - gift_prod_cols)
        gift_lockout_exists = 'gift_card_lookup_lockouts' in prod_inv

        notification_cols = set(col_names(prod_columns.get('notification_outbox', [])))
        notification_metadata_exists = 'metadata_json' in notification_cols
        prod_notification_index_sql = '\n'.join(prod_indexes.get('notification_outbox', []))
        notification_expected_indexes = [
            'idx_notification_outbox_kind_destination',
            'idx_notification_outbox_order',
            'idx_notification_outbox_payment',
            'idx_notification_outbox_product',
        ]
        notification_missing_indexes = [name for name in notification_expected_indexes if name.lower() not in prod_notification_index_sql.lower()]

        prod_annotation_index_sql = '\n'.join(prod_indexes.get('product_image_annotations', []))
        annotation_index_exists = 'idx_product_image_annotations_product_image_build197' in prod_annotation_index_sql

        membership_dev_cols = col_names(dev_columns.get('membership_tier_policies', []))
        membership_prod_cols = col_names(prod_columns.get('membership_tier_policies', []))
        membership_requires_rebuild = membership_dev_cols != membership_prod_cols

        fractional = {}
        for table in FRACTIONAL_TABLES:
            dev_map = {str(r.get('name') or ''): base.normalize_sql(r.get('type')) for r in dev_columns.get(table, [])}
            prod_map = {str(r.get('name') or ''): base.normalize_sql(r.get('type')) for r in prod_columns.get(table, [])}
            changed = sorted(name for name in set(dev_map) & set(prod_map) if dev_map[name] != prod_map[name])
            fractional[table] = {
                'development_rows': table_count(npx, dev_cfg, table, f'DEVELOPMENT {table} COUNT') if table in dev_inv else None,
                'production_rows': table_count(npx, prod_cfg, table, f'PRODUCTION {table} COUNT') if table in prod_inv else None,
                'type_changed_columns': changed,
                'development_types': {name: dev_map[name] for name in changed},
                'production_types': {name: prod_map[name] for name in changed},
            }

        orphans = {
            'product_media_score_history_product': orphan_count(npx, prod_cfg, "SELECT COUNT(*) AS orphan_count FROM product_media_score_history x LEFT JOIN products p ON p.product_id=x.product_id WHERE x.product_id IS NOT NULL AND p.product_id IS NULL;", 'PRODUCT MEDIA SCORE PRODUCT ORPHANS'),
            'product_media_score_history_actor': orphan_count(npx, prod_cfg, "SELECT COUNT(*) AS orphan_count FROM product_media_score_history x LEFT JOIN users u ON u.user_id=x.actor_user_id WHERE x.actor_user_id IS NOT NULL AND u.user_id IS NULL;", 'PRODUCT MEDIA SCORE USER ORPHANS'),
            'product_review_actions_actor': orphan_count(npx, prod_cfg, "SELECT COUNT(*) AS orphan_count FROM product_review_actions x LEFT JOIN users u ON u.user_id=x.actor_user_id WHERE x.actor_user_id IS NOT NULL AND u.user_id IS NULL;", 'PRODUCT REVIEW USER ORPHANS'),
            'products_capture_created': orphan_count(npx, prod_cfg, "SELECT COUNT(*) AS orphan_count FROM products x LEFT JOIN users u ON u.user_id=x.capture_created_by_user_id WHERE x.capture_created_by_user_id IS NOT NULL AND u.user_id IS NULL;", 'PRODUCT CAPTURE CREATED USER ORPHANS'),
            'products_capture_updated': orphan_count(npx, prod_cfg, "SELECT COUNT(*) AS orphan_count FROM products x LEFT JOIN users u ON u.user_id=x.capture_updated_by_user_id WHERE x.capture_updated_by_user_id IS NOT NULL AND u.user_id IS NULL;", 'PRODUCT CAPTURE UPDATED USER ORPHANS'),
            'site_page_views_session': orphan_count(npx, prod_cfg, "SELECT COUNT(*) AS orphan_count FROM site_page_views x LEFT JOIN site_visitor_sessions s ON s.site_visitor_session_id=x.site_visitor_session_id WHERE x.site_visitor_session_id IS NOT NULL AND s.site_visitor_session_id IS NULL;", 'SITE PAGE VIEW SESSION ORPHANS'),
            'supplier_po_inventory': orphan_count(npx, prod_cfg, "SELECT COUNT(*) AS orphan_count FROM supplier_purchase_order_items x LEFT JOIN site_item_inventory i ON i.site_item_inventory_id=x.site_item_inventory_id WHERE x.site_item_inventory_id IS NOT NULL AND i.site_item_inventory_id IS NULL;", 'SUPPLIER PO INVENTORY ORPHANS'),
        }

        special_counts = {}
        for table in ('search_query_terms', '__sql_test'):
            special_counts[table] = table_count(npx, prod_cfg, table, f'PRODUCTION {table} COUNT') if table in prod_inv else None
        caip_rows = table_count(npx, prod_cfg, 'caip_media_upload_files', 'PRODUCTION CAIP ROW COUNT') if 'caip_media_upload_files' in prod_inv else None

        dev_exact_numbers = (
            len(dev_products) == EXPECTED_PRODUCTS
            and len(dev_numbers) == EXPECTED_PRODUCTS
            and len(set(dev_numbers)) == EXPECTED_PRODUCTS
            and min(dev_numbers or [0]) == EXPECTED_START
            and max(dev_numbers or [0]) == EXPECTED_END
            and dev_seq is not None and dev_seq >= EXPECTED_NEXT
        )
        prod_legacy_null = len(prod_products) == EXPECTED_PRODUCTS and len(prod_numbers) == 0 and prod_seq == EXPECTED_START
        identity_exact = len(shared_ids) == EXPECTED_PRODUCTS and not identity_mismatches and set(dev_by_id) == set(prod_by_id)
        candidate_numbers = set(range(EXPECTED_START, EXPECTED_END + 1))
        prod_collision = sorted(candidate_numbers & prod_reserved)
        product_number_ready = dev_exact_numbers and prod_legacy_null and identity_exact and not prod_collision
        zero_orphans = all(value == 0 for value in orphans.values())

        payload = {
            'artifact': 'Build 426 live Production release-candidate evidence',
            'development_products': len(dev_products),
            'production_products': len(prod_products),
            'shared_product_ids': len(shared_ids),
            'identity_mismatch_ids': identity_mismatches,
            'development_product_numbers': sorted(dev_numbers),
            'production_product_numbers': sorted(prod_numbers),
            'development_sequence_next': dev_seq,
            'production_sequence_next': prod_seq,
            'product_number_candidate_start': EXPECTED_START,
            'product_number_candidate_end': EXPECTED_END,
            'product_number_candidate_next': EXPECTED_NEXT,
            'production_reserved_product_numbers': sorted(prod_reserved),
            'production_candidate_collisions': prod_collision,
            'product_number_candidate_ready': product_number_ready,
            'product_mapping': [
                {
                    'product_id': as_int(dev_by_id[pid].get('product_id')),
                    'slug': clean(dev_by_id[pid].get('slug')),
                    'name': clean(dev_by_id[pid].get('name')),
                    'product_number': as_int(dev_by_id[pid].get('product_number')),
                }
                for pid in shared_ids
            ] if product_number_ready else [],
            'gift_card': {
                'missing_lookup_attempt_columns': gift_missing_cols,
                'lockout_table_exists': gift_lockout_exists,
                'lookup_attempt_rows': table_count(npx, prod_cfg, 'gift_card_lookup_attempts', 'PRODUCTION GIFT LOOKUP ATTEMPT COUNT'),
            },
            'notification': {
                'metadata_json_exists': notification_metadata_exists,
                'missing_indexes': notification_missing_indexes,
                'outbox_rows': table_count(npx, prod_cfg, 'notification_outbox', 'PRODUCTION NOTIFICATION OUTBOX COUNT'),
            },
            'product_image_annotations': {
                'build197_index_exists': annotation_index_exists,
                'rows': table_count(npx, prod_cfg, 'product_image_annotations', 'PRODUCTION PRODUCT IMAGE ANNOTATION COUNT'),
            },
            'membership': {
                'development_columns': membership_dev_cols,
                'production_columns': membership_prod_cols,
                'requires_rebuild': membership_requires_rebuild,
                'production_rows': table_count(npx, prod_cfg, 'membership_tier_policies', 'PRODUCTION MEMBERSHIP POLICY COUNT'),
            },
            'fractional_tables': fractional,
            'orphan_counts': orphans,
            'zero_orphans': zero_orphans,
            'one_sided_counts': special_counts,
            'caip_media_upload_files_rows': caip_rows,
            'production_mutation_executed': False,
            'development_mutation_executed': False,
            'executable_production_helper_invoked': False,
        }
        OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 426 RELEASE-CANDIDATE EVIDENCE ===')
    print(f'Development Product numbers: {min(dev_numbers or [0])}..{max(dev_numbers or [0])} ({len(dev_numbers)} rows)')
    print(f'Development sequence next: {dev_seq}')
    print(f'Production Product numbers assigned: {len(prod_numbers)}')
    print(f'Production sequence next: {prod_seq}')
    print(f'Product-number Production candidate ready: {"YES" if product_number_ready else "NO"}')
    print(f'Gift Card missing lookup columns: {gift_missing_cols}')
    print(f'Gift Card lockout exists: {gift_lockout_exists}')
    print(f'Notification metadata_json exists: {notification_metadata_exists}')
    print(f'Notification missing current indexes: {notification_missing_indexes}')
    print(f'Build 197 annotation index exists: {annotation_index_exists}')
    print(f'Membership rebuild required: {membership_requires_rebuild}')
    print(f'Product/FK live orphan counts all zero: {zero_orphans}')
    print(f'site_item_inventory Production rows: {fractional.get("site_item_inventory", {}).get("production_rows")}')
    print(f'search_query_terms rows: {special_counts.get("search_query_terms")}')
    print(f'__sql_test rows: {special_counts.get("__sql_test")}')
    print(f'CAIP media upload rows: {caip_rows}')
    print(f'Local evidence artifact: {OUTPUT.name}')
    print('No database or R2 mutation was executed.')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 426 LIVE READ-ONLY RELEASE-CANDIDATE EVIDENCE: COMPLETE')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
