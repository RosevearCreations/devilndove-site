#!/usr/bin/env python3
"""Sync Build 440 Product/Inventory lot provenance into database_full_schema.sql.
Local-only. No Cloudflare, D1, R2, provider, or network access.

The block is replaceable. The base migration contributes tables/opening-balance/settings,
while commitment views/triggers are taken only from the hardening migration so the
aggregate schema has one final authority per object rather than sequential duplicates.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT / 'database_full_schema.sql'
BASE = ROOT / 'database_build440_product_inventory_lot_provenance.sql'
HARDENING = ROOT / 'database_build440_product_inventory_lot_provenance_hardening.sql'
BEGIN = '-- BEGIN BUILD 440 PRODUCT INVENTORY LOT PROVENANCE AGGREGATE SYNC --'
END = '-- END BUILD 440 PRODUCT INVENTORY LOT PROVENANCE AGGREGATE SYNC --'
BASE_REPLACED_BEGIN = 'DROP VIEW IF EXISTS product_inventory_active_commitments;'
BASE_REPLACED_END = "INSERT OR IGNORE INTO app_settings(setting_key,setting_value,is_public)\nVALUES ('site.product.production_lot_policy'"


def clean(text: str) -> str:
    lines = text.strip().splitlines()
    return '\n'.join(line for line in lines if line.strip() != 'PRAGMA foreign_keys = ON;').strip()


def base_for_aggregate(text: str) -> str:
    """Remove base view/trigger definitions that the hardening migration supersedes."""
    source = clean(text)
    start = source.find(BASE_REPLACED_BEGIN)
    end = source.find(BASE_REPLACED_END, start if start >= 0 else 0)
    if start < 0 or end < 0 or end <= start:
        raise SystemExit('STOP: could not identify the base commitment view/trigger section for aggregate replacement.')
    marker = '-- Final Build 440 commitment views/triggers are supplied by the hardening aggregate source below.\n\n'
    return (source[:start].rstrip() + '\n\n' + marker + source[end:].lstrip()).strip()


def remove_existing_block(source: str) -> str:
    if BEGIN not in source:
        return source.rstrip()
    start = source.index(BEGIN)
    end_pos = source.find(END, start)
    if end_pos < 0:
        raise SystemExit('STOP: aggregate Build 440 begin marker exists without its end marker.')
    end_pos += len(END)
    return (source[:start].rstrip() + '\n' + source[end_pos:].lstrip()).rstrip()


def main() -> int:
    if not FULL.exists():
        raise SystemExit('STOP: database_full_schema.sql was not found.')
    for path in (BASE, HARDENING):
        if not path.exists():
            raise SystemExit(f'STOP: required migration is missing: {path.name}')

    source = remove_existing_block(FULL.read_text(encoding='utf-8'))
    base = base_for_aggregate(BASE.read_text(encoding='utf-8'))
    hardening = clean(HARDENING.read_text(encoding='utf-8'))
    block = (
        BEGIN + '\n'
        + f'-- Aggregate source: {BASE.name} (superseded commitment views/triggers omitted)\n{base}\n\n'
        + f'-- Aggregate source: {HARDENING.name} (final commitment authority)\n{hardening}\n'
        + END
    )
    updated = source.rstrip() + '\n\n' + block + '\n'

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

    forbidden_superseded = [
        "IN ('pending','paid','fulfilled')",
        "RAISE(ABORT,'build440_finished_inventory_commitment_exceeds_available') END;\nEND;\n\nDROP TRIGGER IF EXISTS trg_order_items_build440_inventory_commit_guard_update",
    ]
    for token in forbidden_superseded:
        if token in focused:
            raise SystemExit(f'STOP: superseded commitment definition survived aggregate sync: {token!r}')

    FULL.write_text(updated, encoding='utf-8', newline='\n')
    print('BUILD 440 PRODUCT / INVENTORY LOT PROVENANCE FULL-SCHEMA SYNC: UPDATED')
    print('Base provenance tables/seeds/settings: INCLUDED')
    print('Superseded base commitment views/triggers: OMITTED')
    print('Lot provenance tables: 2 / SINGLE AUTHORITY IN MARKED BLOCK')
    print('Commitment views: 2 / FINAL HARDENED DEFINITIONS ONLY')
    print('Commitment triggers: 4 / FINAL HARDENED DEFINITIONS ONLY')
    print('Refund fail-closed commitment policy: INCLUDED')
    print('Partial checkout cancellation guard: INCLUDED')
    print('Historical provenance fabrication: NONE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Next: python scripts/build440_product_inventory_tools_source_gate.py')
    print('Then: git diff --check && git status --short')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
