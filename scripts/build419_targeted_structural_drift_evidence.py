#!/usr/bin/env python3
"""Build 419 targeted live read-only structural drift evidence.

Build 418 reduced 54 stored CREATE-SQL differences to exact matches,
column-order/history-only candidates, and genuine structural candidates.
Build 419 prints exact Dev-vs-Prod column/FK/index differences without mutation.

Build 420 hardening reuses the same evidence flow but normalizes formatting-only
index differences (comma/parenthesis whitespace and redundant ASC) before
classification. UNIQUE, DESC and indexed-column order remain material.
"""
from __future__ import annotations

from pathlib import Path
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401
from build420_index_semantics import index_signature as build420_index_signature


def column_map(rows: list[dict]) -> dict[str, tuple]:
    result: dict[str, tuple] = {}
    for row in rows:
        name = str(row.get('name') or '').lower()
        result[name] = (
            base.normalize_sql(row.get('type')),
            int(row.get('notnull_value') or 0),
            base.normalize_sql(row.get('dflt_value')),
            int(row.get('pk') or 0),
            int(row.get('hidden') or 0),
        )
    return result


def column_order(rows: list[dict]) -> list[str]:
    return [
        str(row.get('name') or '').lower()
        for row in sorted(rows, key=lambda item: int(item.get('cid') or 0))
    ]


def fmt_column(value: tuple | None) -> str:
    if value is None:
        return 'MISSING'
    col_type, notnull, default, pk, hidden = value
    return (
        f"type={col_type or '(none)'} notnull={notnull} "
        f"default={default or '(none)'} pk={pk} hidden={hidden}"
    )


def fk_set(rows: list[dict]) -> set[tuple]:
    return set(base.fk_signature(rows))


def index_set(rows: list[str]) -> set[str]:
    return set(build420_index_signature(rows))


def print_set_diff(label: str, dev_values: set, prod_values: set) -> None:
    dev_only = sorted(dev_values - prod_values)
    prod_only = sorted(prod_values - dev_values)
    print(f'    {label} Development-only:')
    if dev_only:
        for value in dev_only:
            print(f'      + {value}')
    else:
        print('      none')
    print(f'    {label} Production-only:')
    if prod_only:
        for value in prod_only:
            print(f'      - {value}')
    else:
        print('      none')


def main() -> int:
    base.validate_dev_pin()
    npx = base.npx_path()

    print('BUILD 419 TARGETED LIVE READ-ONLY STRUCTURAL DRIFT EVIDENCE')
    print(f'Git branch: {base.current_branch()}')
    print(f'Development target: {base.DEV_DATABASE} ({base.DEV_DATABASE_ID})')
    print(f'Production target:  {base.PROD_DATABASE} ({base.PROD_DATABASE_ID})')
    print('SQL guard: SELECT / inspection-only PRAGMA — PASS')
    print('PRODUCTION MUTATION CAPABILITY IN THIS HELPER: NONE')
    print('Build 420 index normalization: whitespace/ASC cosmetic differences ignored')

    with tempfile.TemporaryDirectory(prefix='dd-build419-') as temp_dir:
        temp = Path(temp_dir)
        dev_cfg = temp / 'dev.toml'
        prod_cfg = temp / 'prod.toml'
        dev_cfg.write_text(
            base.readonly_config(base.DEV_PROJECT, base.DEV_DATABASE, base.DEV_DATABASE_ID),
            encoding='utf-8',
        )
        prod_cfg.write_text(
            base.readonly_config(base.PROD_PROJECT, base.PROD_DATABASE, base.PROD_DATABASE_ID),
            encoding='utf-8',
        )

        dev_inv = base.inventory(npx, dev_cfg, 'BUILD 419 DEVELOPMENT')
        prod_inv = base.inventory(npx, prod_cfg, 'BUILD 419 PRODUCTION')
        common = sorted(set(dev_inv) & set(prod_inv))
        create_diff = [
            table for table in common
            if base.normalize_sql(dev_inv[table]) != base.normalize_sql(prod_inv[table])
        ]

        dev_cols = base.load_column_rows(npx, dev_cfg, create_diff, 'BUILD 419 DEVELOPMENT')
        prod_cols = base.load_column_rows(npx, prod_cfg, create_diff, 'BUILD 419 PRODUCTION')
        dev_fks = base.load_fk_rows(npx, dev_cfg, create_diff, 'BUILD 419 DEVELOPMENT')
        prod_fks = base.load_fk_rows(npx, prod_cfg, create_diff, 'BUILD 419 PRODUCTION')
        dev_indexes = base.load_index_rows(npx, dev_cfg, 'BUILD 419 DEVELOPMENT')
        prod_indexes = base.load_index_rows(npx, prod_cfg, 'BUILD 419 PRODUCTION')

        exact_core_same: list[str] = []
        order_only: list[str] = []
        structural: list[str] = []

        for table in create_diff:
            dev_cmap = column_map(dev_cols.get(table, []))
            prod_cmap = column_map(prod_cols.get(table, []))
            unordered_columns_same = dev_cmap == prod_cmap
            order_same = column_order(dev_cols.get(table, [])) == column_order(prod_cols.get(table, []))
            fks_same = fk_set(dev_fks.get(table, [])) == fk_set(prod_fks.get(table, []))
            indexes_same = index_set(dev_indexes.get(table, [])) == index_set(prod_indexes.get(table, []))

            if unordered_columns_same and order_same and fks_same and indexes_same:
                exact_core_same.append(table)
            elif unordered_columns_same and not order_same and fks_same and indexes_same:
                order_only.append(table)
            else:
                structural.append(table)

        print('\n=== BUILD 419 CLASSIFICATION ===')
        print(f'CREATE-SQL-different common tables inspected: {len(create_diff)}')
        print(f'Exact core semantic match despite CREATE text: {len(exact_core_same)}')
        for table in exact_core_same:
            print(f'  - {table}')
        print(f'Column-order/history-only candidates: {len(order_only)}')
        for table in order_only:
            print(f'  - {table}')
        print(f'Actual structural candidates: {len(structural)}')
        for table in structural:
            print(f'  - {table}')

        print('\n=== EXACT STRUCTURAL DIFFERENCES ===')
        for table in structural:
            print(f'\n{table}')
            dev_cmap = column_map(dev_cols.get(table, []))
            prod_cmap = column_map(prod_cols.get(table, []))
            any_col_diff = False
            for name in sorted(set(dev_cmap) | set(prod_cmap)):
                dev_value = dev_cmap.get(name)
                prod_value = prod_cmap.get(name)
                if dev_value != prod_value:
                    any_col_diff = True
                    print(f'  COLUMN {name}')
                    print(f'    Development: {fmt_column(dev_value)}')
                    print(f'    Production:  {fmt_column(prod_value)}')
            if not any_col_diff:
                print('  COLUMN ATTRIBUTES: identical when ordinal position is ignored')

            dev_order = column_order(dev_cols.get(table, []))
            prod_order = column_order(prod_cols.get(table, []))
            print('  COLUMN ORDER DIFFERS:', 'yes' if dev_order != prod_order else 'no')

            dev_fk = fk_set(dev_fks.get(table, []))
            prod_fk = fk_set(prod_fks.get(table, []))
            print('  FOREIGN KEYS DIFFER:', 'yes' if dev_fk != prod_fk else 'no')
            if dev_fk != prod_fk:
                print_set_diff('FK', dev_fk, prod_fk)

            dev_idx = index_set(dev_indexes.get(table, []))
            prod_idx = index_set(prod_indexes.get(table, []))
            print('  EXPLICIT INDEXES DIFFER:', 'yes' if dev_idx != prod_idx else 'no')
            if dev_idx != prod_idx:
                print_set_diff('INDEX', dev_idx, prod_idx)

        print('\n=== ONE-SIDED TABLE REMINDER ===')
        dev_special = base.special_counts(npx, dev_cfg, dev_inv, 'BUILD 419 DEVELOPMENT')
        prod_special = base.special_counts(npx, prod_cfg, prod_inv, 'BUILD 419 PRODUCTION')
        for table in base.SPECIAL_TABLES:
            dev_value = 'MISSING' if dev_special[table] is None else str(dev_special[table])
            prod_value = 'MISSING' if prod_special[table] is None else str(prod_special[table])
            print(f'{table}: development={dev_value} production={prod_value}')

    print('\nBUILD 419 TARGETED LIVE READ-ONLY STRUCTURAL DRIFT EVIDENCE: COMPLETE')
    print('No migration or data mutation was executed.')
    print('PRODUCTION PROMOTION: CLOSED')
    print('PRODUCTION DATA COPY: CLOSED')
    print('NEXT: map actual structural candidates to canonical migration authority and prepare a targeted Production rollout plan.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
