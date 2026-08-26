#!/usr/bin/env python3
"""Build 427 local authorization-boundary gate.

Consumes the fresh read-only Build 427 preflight artifact and verifies that the
Production execution tooling is prepared but no Production backup/mutation or
promotion has been claimed. No network access.
"""
from __future__ import annotations

from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT = ROOT / 'build427_production_execution_preflight.local.json'
DOC = ROOT / 'BUILD427_TWENTY_ITEM_PRODUCTION_EXECUTION_BOUNDARY.md'
PRODUCT = ROOT / 'scripts' / 'build427_production_product_number_execution.py'
ADDITIVE = ROOT / 'scripts' / 'build427_production_additive_execution.py'


class Gate:
    def __init__(self):
        self.total = 0
        self.failures: list[str] = []
    def check(self, condition: bool, label: str) -> None:
        self.total += 1
        print(f'{self.total:02d}. {"PASS" if condition else "FAIL"} — {label}')
        if not condition:
            self.failures.append(label)


def branch() -> str:
    result = subprocess.run(['git','branch','--show-current'], cwd=ROOT, text=True, encoding='utf-8', errors='replace', stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False)
    return result.stdout.strip()


def next_count(text: str) -> int:
    marker = '## Next 20 ordered changes'
    if marker not in text:
        return 0
    tail = text.split(marker, 1)[1]
    pos = tail.find('\n## ')
    if pos >= 0:
        tail = tail[:pos]
    return len(re.findall(r'^\d+\.\s+', tail, re.M))


def main() -> int:
    print('BUILD 427 TWENTY-ITEM PRODUCTION AUTHORIZATION-BOUNDARY GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability in this gate: NONE')
    print()
    gate = Gate()
    pre = json.loads(PREFLIGHT.read_text(encoding='utf-8')) if PREFLIGHT.exists() else {}
    doc = DOC.read_text(encoding='utf-8', errors='replace') if DOC.exists() else ''
    product = PRODUCT.read_text(encoding='utf-8', errors='replace') if PRODUCT.exists() else ''
    additive = ADDITIVE.read_text(encoding='utf-8', errors='replace') if ADDITIVE.exists() else ''
    mapping = pre.get('mapping') if isinstance(pre.get('mapping'), list) else []
    numbers = [int(r.get('product_number')) for r in mapping] if mapping else []

    gate.check(branch() == 'dev', 'current git branch is dev')
    gate.check('Build 426' in doc and 'PASS (20/20)' in doc, 'Build 426 live/package/gate PASS is recorded')
    gate.check(PREFLIGHT.exists(), 'fresh Build 427 read-only Production preflight artifact exists')
    gate.check(pre.get('safe_to_open_product_number_execution') is True, 'fresh preflight is safe to open only the Product-number execution phase')
    gate.check(len(mapping) == 45 and len({int(r.get('product_id')) for r in mapping}) == 45, 'fresh Product-number mapping has exactly 45 unique Product IDs')
    gate.check(len(numbers) == 45 and len(set(numbers)) == 45 and min(numbers or [0]) == 1084 and max(numbers or [0]) == 1128, 'fresh Product-number mapping remains exactly 1084..1128')
    gate.check(int(pre.get('candidate_next') or 0) == 1129, 'fresh Product-number next sequence remains 1129')
    gate.check(pre.get('zero_orphans') is True, 'fresh Product/FK orphan gate remains zero')
    gate.check(int(pre.get('site_item_inventory_rows') or 0) == 1041, 'Production site_item_inventory preservation boundary remains 1,041 rows')
    gate.check(pre.get('search_query_terms_rows') == 5 and pre.get('__sql_test_rows') == 0, 'one-sided table preservation boundaries remain unchanged')
    gate.check(pre.get('caip_media_upload_files_rows') == 113, 'CAIP 113-row/private-R2 delta remains explicitly excluded')
    gate.check(pre.get('production_backup_created') is False, 'no Production execution backup is claimed before authorization')
    gate.check(pre.get('production_authorization_received') is False, 'no Production authorization is inferred from evidence')
    gate.check(pre.get('production_mutation_executed') is False, 'no Production mutation is claimed by the preflight')
    gate.check('AUTHORIZE-BUILD427-PROD-PRODUCT-NUMBERS' in product, 'Product-number executor requires an explicit Production authorization token')
    gate.check("PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'" in product, 'Product-number executor hard-pins the Production D1 UUID')
    gate.check('build426_production_release_candidate.local.sql' not in product and 'build426_production_release_candidate.local.sql' not in additive, 'no Build 427 path bulk-executes the broad Build 426 candidate')
    gate.check(all(token in additive for token in ['AUTHORIZE-BUILD427-PROD-GIFT-CARD','AUTHORIZE-BUILD427-PROD-NOTIFICATION','AUTHORIZE-BUILD427-PROD-ANNOTATION-INDEX']), 'each additive Production stage has a separate authorization token')
    gate.check(next_count(doc) == 20, 'Build 427 records exactly the next 20 ordered changes')
    gate.check('PRODUCTION PROMOTION' in doc and 'CLOSED' in doc, 'Production promotion remains closed at the authorization boundary')

    print()
    if gate.failures:
        print(f'BUILD 427 TWENTY-ITEM PRODUCTION AUTHORIZATION-BOUNDARY GATE: FAIL ({len(gate.failures)}/{gate.total} failed)')
        for item in gate.failures:
            print(' -', item)
        return 1
    print(f'BUILD 427 TWENTY-ITEM PRODUCTION AUTHORIZATION-BOUNDARY GATE: PASS ({gate.total}/{gate.total})')
    print('Production backup for execution: NOT CREATED')
    print('Production authorization received: NO')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: explicit Production authorization is required before the Build 427 backup/apply sequence may be invoked.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
