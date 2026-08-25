#!/usr/bin/env python3
"""Build 424 live read-only Product-number reservation-boundary evidence.

Both Development and Production currently contain the same 45 legacy Products and
all 45 product_number values are NULL. Build 195 created the never-reused sequence
but intentionally did not backfill existing rows.

This helper does not assign numbers. It discovers every live table with an exact
`product_number` column, inspects sequence/settings/history in both D1 databases,
and computes the first collision-free deterministic legacy block that could be
used by a later reviewed migration. No DDL/DML exists in this helper.
"""
from __future__ import annotations

from pathlib import Path
import json
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'build424_product_number_reservation_evidence.local.json'
DEFAULT_START = 1000
EXPECTED_PRODUCTS = 45


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 424 {label}')


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


def exact_product_number_tables(npx: str, cfg: Path, inv: dict[str, str], label: str) -> list[str]:
    candidates = sorted(
        name for name, create_sql in inv.items()
        if 'product_number' in base.normalize_sql(create_sql)
    )
    if not candidates:
        return []
    columns = base.load_column_rows(npx, cfg, candidates, f'{label} PRODUCT NUMBER DISCOVERY')
    result = []
    for table in candidates:
        if any(str(row.get('name') or '').lower() == 'product_number' for row in columns.get(table, [])):
            result.append(table)
    return result


def table_number_stats(npx: str, cfg: Path, tables: list[str], label: str) -> list[dict]:
    rows = []
    for table in tables:
        if not base.IDENTIFIER_RE.fullmatch(table):
            raise RuntimeError(f'unsafe table identifier {table!r}')
        sql = (
            f'SELECT {base.quote_literal(table)} AS table_name,COUNT(*) AS row_count,'
            'SUM(CASE WHEN product_number IS NOT NULL AND trim(CAST(product_number AS TEXT))<>\'\' THEN 1 ELSE 0 END) AS nonnull_rows,'
            'SUM(CASE WHEN product_number IS NOT NULL AND trim(CAST(product_number AS TEXT))<>\'\' AND CAST(product_number AS INTEGER)<=0 THEN 1 ELSE 0 END) AS invalid_numeric_rows,'
            'MIN(CASE WHEN CAST(product_number AS INTEGER)>0 THEN CAST(product_number AS INTEGER) END) AS min_numeric,'
            'MAX(CASE WHEN CAST(product_number AS INTEGER)>0 THEN CAST(product_number AS INTEGER) END) AS max_numeric '
            f'FROM "{table}";'
        )
        result = q(npx, cfg, sql, f'{label} {table} PRODUCT NUMBER STATS')
        if result:
            rows.append(result[0])
    return rows


def sequence_state(npx: str, cfg: Path, inv: dict[str, str], label: str) -> dict:
    if 'catalog_product_number_sequence' not in inv:
        return {'table_exists': False, 'next_product_number': None}
    rows = q(
        npx, cfg,
        "SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products' LIMIT 1;",
        f'{label} PRODUCT NUMBER SEQUENCE',
    )
    return {
        'table_exists': True,
        'next_product_number': as_int(rows[0].get('next_product_number')) if rows else None,
    }


def configured_start(npx: str, cfg: Path, inv: dict[str, str], label: str) -> int:
    if 'app_settings' not in inv:
        return DEFAULT_START
    rows = q(
        npx, cfg,
        "SELECT setting_value FROM app_settings WHERE setting_key='site.catalog.product_number_start' LIMIT 1;",
        f'{label} PRODUCT NUMBER START SETTING',
    )
    value = as_int(rows[0].get('setting_value')) if rows else None
    return value if value and value > 0 else DEFAULT_START


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build424_product_number_reservation_evidence.py --run')
        return 2

    base.validate_dev_pin()
    npx = base.npx_path()
    print('BUILD 424 PRODUCT NUMBER LIVE READ-ONLY RESERVATION EVIDENCE')
    print(f'Development target: {base.DEV_DATABASE} ({base.DEV_DATABASE_ID})')
    print(f'Production target:  {base.PROD_DATABASE} ({base.PROD_DATABASE_ID})')
    print('D1 mutation capability: NONE')
    print('Executable Production helper capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build424-') as temp_dir:
        temp = Path(temp_dir)
        dev_cfg = temp / 'dev.toml'
        prod_cfg = temp / 'prod.toml'
        dev_cfg.write_text(base.readonly_config(base.DEV_PROJECT, base.DEV_DATABASE, base.DEV_DATABASE_ID), encoding='utf-8')
        prod_cfg.write_text(base.readonly_config(base.PROD_PROJECT, base.PROD_DATABASE, base.PROD_DATABASE_ID), encoding='utf-8')

        dev_inv = base.inventory(npx, dev_cfg, 'BUILD 424 DEVELOPMENT')
        prod_inv = base.inventory(npx, prod_cfg, 'BUILD 424 PRODUCTION')

        product_sql = 'SELECT product_id,product_number,name,slug,sku,status FROM products ORDER BY product_id;'
        dev_products = q(npx, dev_cfg, product_sql, 'DEVELOPMENT PRODUCT IDENTITY')
        prod_products = q(npx, prod_cfg, product_sql, 'PRODUCTION PRODUCT IDENTITY')

        dev_by_id = {as_int(row.get('product_id')): row for row in dev_products}
        prod_by_id = {as_int(row.get('product_id')): row for row in prod_products}
        shared_ids = sorted(set(dev_by_id) & set(prod_by_id))
        dev_only = sorted(set(dev_by_id) - set(prod_by_id))
        prod_only = sorted(set(prod_by_id) - set(dev_by_id))
        mismatches = [pid for pid in shared_ids if identity(dev_by_id[pid]) != identity(prod_by_id[pid])]

        dev_missing = sum(1 for row in dev_products if as_int(row.get('product_number')) is None)
        prod_missing = sum(1 for row in prod_products if as_int(row.get('product_number')) is None)

        dev_tables = exact_product_number_tables(npx, dev_cfg, dev_inv, 'DEVELOPMENT')
        prod_tables = exact_product_number_tables(npx, prod_cfg, prod_inv, 'PRODUCTION')
        dev_stats = table_number_stats(npx, dev_cfg, dev_tables, 'DEVELOPMENT')
        prod_stats = table_number_stats(npx, prod_cfg, prod_tables, 'PRODUCTION')

        dev_seq = sequence_state(npx, dev_cfg, dev_inv, 'DEVELOPMENT')
        prod_seq = sequence_state(npx, prod_cfg, prod_inv, 'PRODUCTION')
        dev_start = configured_start(npx, dev_cfg, dev_inv, 'DEVELOPMENT')
        prod_start = configured_start(npx, prod_cfg, prod_inv, 'PRODUCTION')

        all_stats = dev_stats + prod_stats
        invalid_history = sum(as_int(row.get('invalid_numeric_rows'), 0) or 0 for row in all_stats)
        history_max = max(
            [as_int(row.get('max_numeric'), 0) or 0 for row in all_stats] + [0]
        )
        sequence_next_values = [
            value for value in (
                as_int(dev_seq.get('next_product_number')),
                as_int(prod_seq.get('next_product_number')),
            ) if value and value > 0
        ]
        reservation_start = max(
            [DEFAULT_START, dev_start, prod_start, history_max + 1] + sequence_next_values
        )
        reservation_end = reservation_start + EXPECTED_PRODUCTS - 1
        next_after_backfill = reservation_end + 1

        exact_identity = (
            len(dev_products) == EXPECTED_PRODUCTS
            and len(prod_products) == EXPECTED_PRODUCTS
            and len(shared_ids) == EXPECTED_PRODUCTS
            and not dev_only and not prod_only and not mismatches
        )
        both_legacy_null = dev_missing == EXPECTED_PRODUCTS and prod_missing == EXPECTED_PRODUCTS
        discovered_same_tables = set(dev_tables) == set(prod_tables)
        safe = exact_identity and both_legacy_null and invalid_history == 0 and discovered_same_tables

        mapping = []
        if safe:
            for offset, pid in enumerate(shared_ids):
                row = dev_by_id[pid]
                mapping.append({
                    'product_id': pid,
                    'slug': clean(row.get('slug')),
                    'name': clean(row.get('name')),
                    'candidate_product_number': reservation_start + offset,
                })

        payload = {
            'artifact': 'Build 424 Product-number reservation evidence',
            'safe_to_prepare_nonexecuting_preview': safe,
            'development_products': len(dev_products),
            'production_products': len(prod_products),
            'shared_product_ids': len(shared_ids),
            'development_only_ids': dev_only,
            'production_only_ids': prod_only,
            'identity_mismatch_ids': mismatches,
            'development_missing_product_numbers': dev_missing,
            'production_missing_product_numbers': prod_missing,
            'development_product_number_tables': dev_tables,
            'production_product_number_tables': prod_tables,
            'development_number_stats': dev_stats,
            'production_number_stats': prod_stats,
            'invalid_historical_numeric_rows': invalid_history,
            'historical_max_product_number': history_max,
            'development_sequence': dev_seq,
            'production_sequence': prod_seq,
            'development_configured_start': dev_start,
            'production_configured_start': prod_start,
            'candidate_reservation_start': reservation_start,
            'candidate_reservation_end': reservation_end,
            'candidate_next_product_number': next_after_backfill,
            'mapping': mapping,
            'production_mutation_executed': False,
            'development_mutation_executed': False,
            'executable_helper_generated': False,
        }
        OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 424 PRODUCT NUMBER RESERVATION ===')
    print(f'Development Products: {len(dev_products)}')
    print(f'Production Products: {len(prod_products)}')
    print(f'Shared Product IDs: {len(shared_ids)}')
    print(f'Identity mismatches: {len(mismatches)}')
    print(f'Development missing product_number: {dev_missing}')
    print(f'Production missing product_number: {prod_missing}')
    print(f'Development product_number tables: {", ".join(dev_tables) or "none"}')
    print(f'Production product_number tables: {", ".join(prod_tables) or "none"}')
    print(f'Invalid historical numeric rows: {invalid_history}')
    print(f'Historical maximum Product number: {history_max}')
    print(f'Development sequence next: {dev_seq.get("next_product_number")}')
    print(f'Production sequence next: {prod_seq.get("next_product_number")}')
    print(f'Candidate reservation block: {reservation_start}..{reservation_end}')
    print(f'Candidate next Product number: {next_after_backfill}')
    print(f'Non-executing preview safe to prepare: {"YES" if safe else "NO"}')
    print(f'Local evidence artifact: {OUTPUT.name}')
    print('No database or R2 mutation was executed.')
    print('Executable Production helper generated: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 424 PRODUCT NUMBER RESERVATION EVIDENCE:', 'PASS' if safe else 'BLOCKED')
    return 0 if safe else 1


if __name__ == '__main__':
    raise SystemExit(main())
