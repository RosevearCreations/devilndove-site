#!/usr/bin/env python3
"""Build 425 inert Production Product-number preview.

Requires a PASS Development post-write proof. Every mutation-looking line is
commented; this file cannot execute or contact Cloudflare.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESERVATION = ROOT / 'build424_product_number_reservation_evidence.local.json'
POSTWRITE = ROOT / 'build425_development_product_number_postwrite.local.json'
OUTPUT = ROOT / 'build425_nonexecuting_production_product_number_preview.local.sql'


def quote(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


if not RESERVATION.exists() or not POSTWRITE.exists():
    print('BUILD 425 PRODUCTION PREVIEW: BLOCKED — Development proof artifacts are incomplete.')
    raise SystemExit(1)

reservation = json.loads(RESERVATION.read_text(encoding='utf-8'))
post = json.loads(POSTWRITE.read_text(encoding='utf-8'))
mapping = reservation.get('mapping') if isinstance(reservation.get('mapping'), list) else []
if post.get('pass') is not True or post.get('production_still_all_null') is not True:
    print('BUILD 425 PRODUCTION PREVIEW: BLOCKED — Development proof is not green or Production changed.')
    raise SystemExit(1)
if len(mapping) != 45:
    print('BUILD 425 PRODUCTION PREVIEW: BLOCKED — expected 45 mapped Products.')
    raise SystemExit(1)

lines = [
    '-- Build 425 NON-EXECUTING Production Product-number preview',
    '-- DO NOT EXECUTE. All mutation-looking lines are comments.',
    '-- Target when separately authorized later: devilndove-prod (0dc8fa3e-319c-45f7-a515-34c8acd89fcf)',
    f"-- Candidate block: {reservation['candidate_reservation_start']}..{reservation['candidate_reservation_end']}",
    f"-- Candidate next: {reservation['candidate_next_product_number']}",
    '-- Preconditions: exact 45 Product identities, all Product numbers still NULL, sequence/history evidence revalidated.',
    '',
]
for row in mapping:
    pid = int(row['product_id'])
    slug = str(row['slug'])
    number = int(row['candidate_product_number'])
    lines.append(
        f"-- PREVIEW: UPDATE products SET product_number={number} WHERE product_id={pid} AND slug={quote(slug)} AND product_number IS NULL;"
    )
lines.extend([
    '',
    '-- PREVIEW: INSERT INTO catalog_product_number_sequence(sequence_key,next_product_number,updated_at)',
    f"-- PREVIEW: VALUES('products',{int(reservation['candidate_next_product_number'])},CURRENT_TIMESTAMP)",
    '-- PREVIEW: ON CONFLICT(sequence_key) DO UPDATE SET',
    '-- PREVIEW: next_product_number=CASE WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number THEN excluded.next_product_number ELSE catalog_product_number_sequence.next_product_number END,',
    '-- PREVIEW: updated_at=CURRENT_TIMESTAMP;',
    '',
    '-- Postconditions required before any later Production promotion:',
    '-- 45/45 Product numbers non-NULL and unique; exact 1084..1128 mapping; Product IDs/slugs/names unchanged; sequence >=1129.',
])
OUTPUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
text = OUTPUT.read_text(encoding='utf-8')
executable = [line for line in text.splitlines() if line.strip() and not line.lstrip().startswith('--')]
updates = [line for line in text.splitlines() if line.startswith('-- PREVIEW: UPDATE products SET product_number=')]
if executable or len(updates) != 45:
    print('BUILD 425 PRODUCTION PREVIEW: FAIL — output is not inert or does not contain 45 updates.')
    raise SystemExit(1)
print('BUILD 425 NON-EXECUTING PRODUCTION PRODUCT NUMBER PREVIEW: PASS')
print('Mapped Products: 45')
print(f"Candidate block: {reservation['candidate_reservation_start']}..{reservation['candidate_reservation_end']}")
print(f"Candidate next: {reservation['candidate_next_product_number']}")
print(f'Local preview: {OUTPUT.name}')
print('Executable statements generated: ZERO')
print('No Cloudflare resource was contacted.')
print('Production mutation executed: NO')
