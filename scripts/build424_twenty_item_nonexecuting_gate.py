#!/usr/bin/env python3
"""Build 424 local twenty-item Product-number reservation/preview gate.

Consumes Build 424 live read-only evidence plus the inert SQL preview. This gate
never contacts Cloudflare and contains no database mutation capability.
"""
from __future__ import annotations

from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'build424_product_number_reservation_evidence.local.json'
PREVIEW = ROOT / 'build424_nonexecuting_product_number_preview.local.sql'
DOC = ROOT / 'BUILD424_TWENTY_ITEM_PRODUCT_NUMBER_RESERVATION.md'
BUILD423_DOC = ROOT / 'BUILD423_TWENTY_ITEM_BLOCKER_REMEDIATION_FIXTURES.md'


class Gate:
    def __init__(self):
        self.total = 0
        self.failures: list[str] = []

    def check(self, condition: bool, label: str):
        self.total += 1
        if condition:
            print(f'{self.total:02d}. PASS — {label}')
        else:
            print(f'{self.total:02d}. FAIL — {label}')
            self.failures.append(label)


def branch() -> str:
    result = subprocess.run(
        ['git', 'branch', '--show-current'], cwd=ROOT, text=True, encoding='utf-8',
        errors='replace', stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False,
    )
    return result.stdout.strip()


def next_count(text: str) -> int:
    marker = '## Next 20 ordered changes'
    if marker not in text:
        return 0
    tail = text.split(marker, 1)[1]
    stop = tail.find('\n## ')
    if stop >= 0:
        tail = tail[:stop]
    return len(re.findall(r'^\d+\.\s+', tail, re.M))


def main() -> int:
    print('BUILD 424 TWENTY-ITEM LOCAL NON-EXECUTING RESERVATION GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    print()

    gate = Gate()
    data = json.loads(EVIDENCE.read_text(encoding='utf-8')) if EVIDENCE.exists() else {}
    mapping = data.get('mapping') if isinstance(data.get('mapping'), list) else []
    preview = PREVIEW.read_text(encoding='utf-8', errors='replace') if PREVIEW.exists() else ''
    doc = DOC.read_text(encoding='utf-8', errors='replace') if DOC.exists() else ''
    build423 = BUILD423_DOC.read_text(encoding='utf-8', errors='replace') if BUILD423_DOC.exists() else ''

    ids = [row.get('product_id') for row in mapping]
    numbers = [row.get('candidate_product_number') for row in mapping]
    noncomment = [line for line in preview.splitlines() if line.strip() and not line.lstrip().startswith('--')]
    update_comments = [line for line in preview.splitlines() if line.startswith('-- PREVIEW: UPDATE products SET product_number=')]

    gate.check(branch() == 'dev', 'current git branch is dev')
    gate.check('Development missing product_number: 45' in build423 and 'Production missing product_number: 45' in build423, 'Build 423 records both databases missing all 45 legacy Product numbers')
    gate.check(EVIDENCE.exists(), 'Build 424 live reservation evidence artifact exists')
    gate.check(data.get('safe_to_prepare_nonexecuting_preview') is True, 'live reservation evidence is safe for an inert preview')
    gate.check(data.get('development_products') == 45 and data.get('production_products') == 45 and data.get('shared_product_ids') == 45, 'Development and Production still contain the same 45 Product IDs')
    gate.check(not data.get('development_only_ids') and not data.get('production_only_ids') and not data.get('identity_mismatch_ids'), 'Product identity parity remains exact by ID + slug + name')
    gate.check(data.get('development_missing_product_numbers') == 45 and data.get('production_missing_product_numbers') == 45, 'both legacy Product sets still have 45 NULL Product numbers')
    gate.check(set(data.get('development_product_number_tables') or []) == set(data.get('production_product_number_tables') or []), 'exact product_number-bearing table sets agree between environments')
    gate.check(data.get('invalid_historical_numeric_rows') == 0, 'no invalid historical Product-number values block reservation planning')
    gate.check(int(data.get('candidate_reservation_start') or 0) >= 1000, 'candidate reservation starts at or above canonical 1000')
    gate.check(int(data.get('candidate_reservation_end') or 0) == int(data.get('candidate_reservation_start') or 0) + 44, 'candidate reservation block contains exactly 45 numbers')
    gate.check(int(data.get('candidate_next_product_number') or 0) == int(data.get('candidate_reservation_end') or 0) + 1, 'candidate next sequence value advances beyond the legacy block')
    gate.check(len(mapping) == 45 and len(set(ids)) == 45, 'candidate mapping contains 45 unique Product IDs')
    gate.check(len(mapping) == 45 and len(set(numbers)) == 45 and min(numbers or [0]) >= 1000, 'candidate mapping contains 45 unique canonical Product numbers')
    gate.check(PREVIEW.exists(), 'Build 424 inert SQL preview exists')
    gate.check(not noncomment, 'SQL preview contains zero executable statements')
    gate.check(len(update_comments) == 45, 'SQL preview contains exactly 45 commented guarded Product UPDATE lines')
    gate.check('next_product_number < excluded.next_product_number' in preview and 'ELSE catalog_product_number_sequence.next_product_number' in preview, 'sequence preview can advance but never roll back')
    gate.check(next_count(doc) == 20, 'Build 424 Markdown records exactly the next 20 ordered changes')
    gate.check('Production schema/data mutation                      CLOSED' in doc and 'Executable Production helper                       DISABLED' in doc, 'Build 424 keeps Production mutation/helper generation disabled')

    print()
    if gate.failures:
        print(f'BUILD 424 TWENTY-ITEM LOCAL NON-EXECUTING RESERVATION GATE: FAIL ({len(gate.failures)}/{gate.total} failed)')
        for failure in gate.failures:
            print(' -', failure)
        return 1

    print(f'BUILD 424 TWENTY-ITEM LOCAL NON-EXECUTING RESERVATION GATE: PASS ({gate.total}/{gate.total})')
    print(f'Candidate Product-number block: {data.get("candidate_reservation_start")}..{data.get("candidate_reservation_end")}')
    print(f'Candidate next Product number: {data.get("candidate_next_product_number")}')
    print('Executable statements in preview: ZERO')
    print('No Cloudflare resource was contacted by this local gate.')
    print('No database or R2 mutation was executed.')
    print('Executable Production helper generated: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
