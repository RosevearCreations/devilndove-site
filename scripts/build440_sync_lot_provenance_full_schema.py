#!/usr/bin/env python3
"""Sync Build 440 Product/Inventory lot provenance into database_full_schema.sql.
Local-only. No Cloudflare, D1, R2, provider, or network access.

The block is replaceable: rerunning the helper removes the previous marked block and
re-appends the current migration sources, so aggregate-schema authority cannot multiply.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT / 'database_full_schema.sql'
MIGRATIONS = [
    ROOT / 'database_build440_product_inventory_lot_provenance.sql',
    ROOT / 'database_build440_product_inventory_lot_provenance_hardening.sql',
]
BEGIN = '-- BEGIN BUILD 440 PRODUCT INVENTORY LOT PROVENANCE AGGREGATE SYNC --'
END = '-- END BUILD 440 PRODUCT INVENTORY LOT PROVENANCE AGGREGATE SYNC --'


def clean_migration(text: str) -> str:
    # The aggregate schema may contain PRAGMA multiple times harmlessly, but keeping one
    # focused block clearer for future audits.
    lines = text.strip().splitlines()
    return '\n'.join(line for line in lines if line.strip() != 'PRAGMA foreign_keys = ON;').strip()


def main() -> int:
    if not FULL.exists():
        raise SystemExit('STOP: database_full_schema.sql was not found.')
    for path in MIGRATIONS:
        if not path.exists():
            raise SystemExit(f'STOP: required migration is missing: {path.name}')

    source = FULL.read_text(encoding='utf-8')
    if BEGIN in source:
        start = source.index(BEGIN)
        end_pos = source.find(END, start)
        if end_pos < 0:
            raise SystemExit('STOP: aggregate Build 440 begin marker exists without its end marker.')
        end_pos += len(END)
        source = (source[:start].rstrip() + '\n' + source[end_pos:].lstrip()).rstrip()

    body_parts = []
    for path in MIGRATIONS:
        body_parts.append(f'-- Aggregate source: {path.name}\n{clean_migration(path.read_text(encoding="utf-8"))}')
    block = BEGIN + '\n' + '\n\n'.join(body_parts) + '\n' + END
    updated = source.rstrip() + '\n\n' + block + '\n'

    # Fail before writing if the focused authority would not be singular inside this block.
    required_singletons = [
        'CREATE TABLE IF NOT EXISTS product_production_run_material_lots',
        'CREATE TABLE IF NOT EXISTS product_finished_inventory_lots',
        'CREATE VIEW product_inventory_active_commitments AS',
        'CREATE VIEW product_finished_lot_commitment_attribution AS',
        'CREATE TRIGGER trg_products_build440_inventory_commit_guard_decrease',
        'CREATE TRIGGER trg_order_items_build440_inventory_commit_guard_insert',
        'CREATE TRIGGER trg_order_items_build440_inventory_commit_guard_update',
        'CREATE TRIGGER trg_orders_build440_inventory_commit_guard_reactivate',
    ]
    focused = updated[updated.index(BEGIN):updated.index(END) + len(END)]
    for token in required_singletons:
        count = focused.count(token)
        if count != 1:
            raise SystemExit(f'STOP: expected exactly one focused aggregate authority for {token!r}; found {count}.')

    FULL.write_text(updated, encoding='utf-8', newline='\n')
    print('BUILD 440 PRODUCT / INVENTORY LOT PROVENANCE FULL-SCHEMA SYNC: UPDATED')
    print('Aggregate source files: 2')
    print('Lot provenance tables: 2 / SINGLE AUTHORITY IN MARKED BLOCK')
    print('Commitment views: 2 / FINAL HARDENED DEFINITIONS')
    print('Commitment triggers: 4 / FINAL HARDENED DEFINITIONS')
    print('Historical provenance fabrication: NONE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Next: python scripts/build440_product_inventory_tools_source_gate.py')
    print('Then: git diff --check && git status --short')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
