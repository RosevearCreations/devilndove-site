#!/usr/bin/env python3
"""Generate a deliberately non-executable Build 424 Product-number SQL preview.

Every mutation-looking statement is emitted as a SQL comment. The output is a review
artifact only; piping it to Wrangler would execute no mutation statements.
"""
from __future__ import annotations

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'build424_product_number_reservation_evidence.local.json'
OUTPUT = ROOT / 'build424_nonexecuting_product_number_preview.local.sql'


def sql_literal(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def main() -> int:
    if not EVIDENCE.exists():
        print(f'BUILD 424 NON-EXECUTING PRODUCT NUMBER PREVIEW: FAIL — missing {EVIDENCE.name}')
        return 1
    data = json.loads(EVIDENCE.read_text(encoding='utf-8'))
    mapping = data.get('mapping') if isinstance(data.get('mapping'), list) else []
    if data.get('safe_to_prepare_nonexecuting_preview') is not True or len(mapping) != 45:
        print('BUILD 424 NON-EXECUTING PRODUCT NUMBER PREVIEW: BLOCKED — live reservation evidence is not safe.')
        return 1

    start = int(data['candidate_reservation_start'])
    end = int(data['candidate_reservation_end'])
    next_number = int(data['candidate_next_product_number'])
    numbers = [int(row['candidate_product_number']) for row in mapping]
    ids = [int(row['product_id']) for row in mapping]
    if len(set(numbers)) != 45 or len(set(ids)) != 45 or min(numbers) != start or max(numbers) != end:
        print('BUILD 424 NON-EXECUTING PRODUCT NUMBER PREVIEW: BLOCKED — mapping integrity failed.')
        return 1

    lines = [
        '-- Devil n Dove Build 424 — NON-EXECUTING PRODUCT NUMBER PREVIEW',
        '-- REVIEW ARTIFACT ONLY. EVERY DML/DDL STATEMENT BELOW IS COMMENTED OUT.',
        '-- DO NOT remove PREVIEW comment prefixes until a later explicitly authorized build.',
        '-- Production promotion remains CLOSED.',
        '',
        f'-- Candidate legacy reservation block: {start}..{end}',
        f'-- Candidate sequence next value after backfill: {next_number}',
        '-- Required preconditions before any later write:',
        '--   * Dev and Prod still contain the same 45 product_id + slug + name identities.',
        '--   * Every mapped products.product_number is still NULL.',
        '--   * No mapped candidate number exists on another Product.',
        '--   * Sequence/history evidence has not advanced beyond this reservation block.',
        '',
        '-- PREVIEW: BEGIN IMMEDIATE;',
    ]

    for row in mapping:
        pid = int(row['product_id'])
        number = int(row['candidate_product_number'])
        slug = sql_literal(str(row.get('slug') or ''))
        lines.append(
            f'-- PREVIEW: UPDATE products SET product_number={number} '
            f'WHERE product_id={pid} AND product_number IS NULL AND slug={slug};'
        )

    lines += [
        '',
        '-- Sequence may advance, never roll back:',
        '-- PREVIEW: INSERT INTO catalog_product_number_sequence(sequence_key,next_product_number,updated_at)',
        f"-- PREVIEW: VALUES('products',{next_number},CURRENT_TIMESTAMP)",
        '-- PREVIEW: ON CONFLICT(sequence_key) DO UPDATE SET',
        '-- PREVIEW: next_product_number=CASE',
        '-- PREVIEW:   WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number',
        '-- PREVIEW:   THEN excluded.next_product_number',
        '-- PREVIEW:   ELSE catalog_product_number_sequence.next_product_number END,',
        '-- PREVIEW: updated_at=CURRENT_TIMESTAMP;',
        '',
        '-- Required postconditions for a later authorized migration:',
        '--   * exactly 45 mapped rows changed from NULL to the candidate values;',
        '--   * all Product IDs/slugs/names remain unchanged;',
        '--   * all 45 product_number values are unique and >= canonical start;',
        f'--   * sequence next_product_number is at least {next_number};',
        '-- PREVIEW: COMMIT;',
        '',
        '-- Executable statements in this file: ZERO',
        '-- Production D1 mutation performed by Build 424: NO',
    ]
    OUTPUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('BUILD 424 NON-EXECUTING PRODUCT NUMBER PREVIEW: PASS')
    print(f'Mapped Products: {len(mapping)}')
    print(f'Candidate block: {start}..{end}')
    print(f'Candidate next number: {next_number}')
    print(f'Local preview: {OUTPUT.name}')
    print('Executable statements generated: ZERO')
    print('No Cloudflare resource was contacted.')
    print('No database or R2 mutation was executed.')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
