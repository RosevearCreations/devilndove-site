#!/usr/bin/env python3
"""Sync Build 440 Inventory receiving/source-provenance authority into database_full_schema.sql.

Local-only. No Cloudflare, D1, R2, provider, or network access. The marked block is replaceable,
so rerunning this helper cannot multiply fresh-install authority.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT / 'database_full_schema.sql'
MIGRATIONS = [
    ROOT / 'database_build440_inventory_receiving_source_provenance.sql',
    ROOT / 'database_build440_inventory_receiving_reversal.sql',
]
BEGIN = '-- BEGIN BUILD 440 INVENTORY RECEIVING SOURCE PROVENANCE AGGREGATE SYNC --'
END = '-- END BUILD 440 INVENTORY RECEIVING SOURCE PROVENANCE AGGREGATE SYNC --'


def cleaned(text: str) -> str:
    return '\n'.join(line for line in text.strip().splitlines() if line.strip() != 'PRAGMA foreign_keys = ON;').strip()


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
            raise SystemExit('STOP: receiving aggregate begin marker exists without its end marker.')
        source = (source[:start].rstrip() + '\n' + source[end_pos + len(END):].lstrip()).rstrip()

    body = []
    for path in MIGRATIONS:
        body.append(f'-- Aggregate source: {path.name}\n{cleaned(path.read_text(encoding="utf-8"))}')
    block = BEGIN + '\n' + '\n\n'.join(body) + '\n' + END
    updated = source.rstrip() + '\n\n' + block + '\n'

    singletons = [
        'CREATE TABLE IF NOT EXISTS inventory_item_identifiers',
        'CREATE TABLE IF NOT EXISTS inventory_item_sources',
        'CREATE TABLE IF NOT EXISTS inventory_receiving_claims',
        'CREATE TABLE IF NOT EXISTS inventory_receiving_reversals',
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_item_identifiers_global_barcode',
        'CREATE INDEX IF NOT EXISTS idx_inventory_receiving_reversals_item',
    ]
    for token in singletons:
        count = updated.count(token)
        if count != 1:
            raise SystemExit(f'STOP: expected exactly one aggregate authority for {token!r}; found {count}.')

    if updated.count(BEGIN) != 1 or updated.count(END) != 1:
        raise SystemExit('STOP: receiving aggregate block markers are not singular.')

    FULL.write_text(updated, encoding='utf-8', newline='\n')
    print('BUILD 440 INVENTORY RECEIVING FULL-SCHEMA SYNC: UPDATED')
    print('Aggregate source files: 2')
    print('Receiving/source tables: 3 / SINGLE AUTHORITY')
    print('Receiving reversal tables: 1 / SINGLE AUTHORITY')
    print('Historical barcode fabrication: NONE')
    print('Stock authority duplicated: NO')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Next: python scripts/build440_product_inventory_tools_source_gate.py')
    print('Then: git diff --check && git status --short')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
