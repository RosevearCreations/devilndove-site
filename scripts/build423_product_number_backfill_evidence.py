#!/usr/bin/env python3
"""Build 423 live read-only Product-number blocker remediation evidence.

This helper NEVER mutates either D1 database. It proves whether Development and
Production Product rows are the same logical rows before producing a local,
non-executing Product-number backfill mapping artifact.
"""
from __future__ import annotations

from pathlib import Path
import json
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'build423_product_number_backfill_mapping.local.json'


def query(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 423 {label}')


def clean(value) -> str:
    return str(value or '').strip()


def as_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def identity(row: dict) -> tuple:
    return (
        as_int(row.get('product_id')),
        clean(row.get('slug')).lower(),
        clean(row.get('name')).casefold(),
    )


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build423_product_number_backfill_evidence.py --run')
        return 2

    base.validate_dev_pin()
    npx = base.npx_path()
    print('BUILD 423 PRODUCT NUMBER LIVE READ-ONLY BACKFILL EVIDENCE')
    print(f'Development target: {base.DEV_DATABASE} ({base.DEV_DATABASE_ID})')
    print(f'Production target:  {base.PROD_DATABASE} ({base.PROD_DATABASE_ID})')
    print('D1 mutation capability: NONE')
    print('Executable Production helper capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build423-') as temp_dir:
        temp = Path(temp_dir)
        dev_cfg = temp / 'dev.toml'
        prod_cfg = temp / 'prod.toml'
        dev_cfg.write_text(base.readonly_config(base.DEV_PROJECT, base.DEV_DATABASE, base.DEV_DATABASE_ID), encoding='utf-8')
        prod_cfg.write_text(base.readonly_config(base.PROD_PROJECT, base.PROD_DATABASE, base.PROD_DATABASE_ID), encoding='utf-8')

        sql = (
            "SELECT product_id,product_number,name,slug,sku,status "
            "FROM products ORDER BY product_id;"
        )
        dev_rows = query(npx, dev_cfg, sql, 'DEVELOPMENT PRODUCT IDENTITY')
        prod_rows = query(npx, prod_cfg, sql, 'PRODUCTION PRODUCT IDENTITY')

        dev_by_id = {as_int(row.get('product_id')): row for row in dev_rows}
        prod_by_id = {as_int(row.get('product_id')): row for row in prod_rows}
        shared_ids = sorted(set(dev_by_id) & set(prod_by_id))
        dev_only = sorted(set(dev_by_id) - set(prod_by_id))
        prod_only = sorted(set(prod_by_id) - set(dev_by_id))

        identity_mismatches = []
        mapping = []
        dev_numbers = []
        production_existing_numbers = []

        for pid in shared_ids:
            dev = dev_by_id[pid]
            prod = prod_by_id[pid]
            if identity(dev) != identity(prod):
                identity_mismatches.append({
                    'product_id': pid,
                    'development_slug': clean(dev.get('slug')),
                    'production_slug': clean(prod.get('slug')),
                    'development_name': clean(dev.get('name')),
                    'production_name': clean(prod.get('name')),
                })
            dev_number = as_int(dev.get('product_number'))
            prod_number = as_int(prod.get('product_number'))
            if dev_number is not None:
                dev_numbers.append(dev_number)
            if prod_number is not None:
                production_existing_numbers.append(prod_number)
            mapping.append({
                'product_id': pid,
                'slug': clean(dev.get('slug')),
                'development_product_number': dev_number,
                'production_current_product_number': prod_number,
            })

        duplicate_dev_numbers = len(dev_numbers) != len(set(dev_numbers))
        dev_missing_numbers = len(dev_rows) - len(dev_numbers)
        prod_missing_numbers = sum(1 for row in prod_rows if as_int(row.get('product_number')) is None)
        dev_start_ok = bool(dev_numbers) and min(dev_numbers) >= 1000
        exact_product_id_set = not dev_only and not prod_only and len(dev_rows) == len(prod_rows)
        exact_identity = exact_product_id_set and not identity_mismatches
        all_prod_missing = prod_missing_numbers == len(prod_rows)
        mapping_safe = (
            len(dev_rows) == 45
            and len(prod_rows) == 45
            and exact_identity
            and dev_missing_numbers == 0
            and not duplicate_dev_numbers
            and dev_start_ok
            and all_prod_missing
        )

        dev_seq = query(
            npx, dev_cfg,
            "SELECT sequence_key,next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products';",
            'DEVELOPMENT PRODUCT SEQUENCE',
        )
        prod_seq = query(
            npx, prod_cfg,
            "SELECT sequence_key,next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products';",
            'PRODUCTION PRODUCT SEQUENCE',
        )

        payload = {
            'artifact': 'Build 423 non-executing Product-number mapping evidence',
            'safe_to_prepare_backfill_sql': mapping_safe,
            'development_rows': len(dev_rows),
            'production_rows': len(prod_rows),
            'shared_product_ids': len(shared_ids),
            'development_only_ids': dev_only,
            'production_only_ids': prod_only,
            'identity_mismatch_count': len(identity_mismatches),
            'identity_mismatches': identity_mismatches,
            'development_missing_product_numbers': dev_missing_numbers,
            'development_duplicate_product_numbers': duplicate_dev_numbers,
            'development_min_product_number': min(dev_numbers) if dev_numbers else None,
            'development_max_product_number': max(dev_numbers) if dev_numbers else None,
            'production_missing_product_numbers': prod_missing_numbers,
            'production_existing_product_numbers': sorted(production_existing_numbers),
            'development_sequence_rows': dev_seq,
            'production_sequence_rows': prod_seq,
            'mapping': mapping if mapping_safe else [],
            'production_mutation_executed': False,
            'executable_helper_generated': False,
        }
        OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 423 PRODUCT NUMBER EVIDENCE ===')
    print(f'Development Products: {len(dev_rows)}')
    print(f'Production Products: {len(prod_rows)}')
    print(f'Shared Product IDs: {len(shared_ids)}')
    print(f'Identity mismatches: {len(identity_mismatches)}')
    print(f'Development missing product_number: {dev_missing_numbers}')
    print(f'Development duplicate product_number: {duplicate_dev_numbers}')
    print(f'Development number range: {min(dev_numbers) if dev_numbers else None}..{max(dev_numbers) if dev_numbers else None}')
    print(f'Production missing product_number: {prod_missing_numbers}')
    print(f'Production existing numbered rows: {len(production_existing_numbers)}')
    print(f'Non-executing mapping safe to prepare: {"YES" if mapping_safe else "NO"}')
    print(f'Local evidence artifact: {OUTPUT.name}')
    print('No database or R2 mutation was executed.')
    print('Executable Production helper generated: NO')
    print('PRODUCTION PROMOTION: CLOSED')

    if mapping_safe:
        print('BUILD 423 PRODUCT NUMBER BACKFILL EVIDENCE: PASS')
        return 0
    print('BUILD 423 PRODUCT NUMBER BACKFILL EVIDENCE: BLOCKED')
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
