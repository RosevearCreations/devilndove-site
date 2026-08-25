#!/usr/bin/env python3
"""Build 423 local twenty-item release-candidate gate.

Requires the read-only Product-number mapping artifact produced by Build 423.
No network access and no Production mutation capability exists in this gate.
"""
from __future__ import annotations

from pathlib import Path
import json
import re
import subprocess

from build423_nonexecuting_migration_catalog import (
    ACCOUNTING_FAMILY,
    CONSTRAINT_DEFAULT_FAMILY,
    FRACTIONAL_TABLES,
    GIFT_CARD,
    MEMBERSHIP,
    NOTIFICATION,
    ONE_SIDED,
    PRODUCT_FK_FAMILY,
    PRODUCT_IMAGE_ANNOTATIONS,
    PRODUCT_NUMBER,
    SAFETY,
)

ROOT = Path(__file__).resolve().parents[1]
MAPPING = ROOT / 'build423_product_number_backfill_mapping.local.json'
BLOCKER_MAP = ROOT / 'build422_blocker_mapping.local.md'
DOC = ROOT / 'BUILD423_TWENTY_ITEM_BLOCKER_REMEDIATION_FIXTURES.md'


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
    pos = tail.find('\n## ')
    if pos >= 0:
        tail = tail[:pos]
    return len(re.findall(r'^\d+\.\s+', tail, re.M))


def main() -> int:
    print('BUILD 423 TWENTY-ITEM LOCAL RELEASE CANDIDATE GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    print()

    gate = Gate()
    mapping = json.loads(MAPPING.read_text(encoding='utf-8')) if MAPPING.exists() else {}
    blocker_text = BLOCKER_MAP.read_text(encoding='utf-8', errors='replace') if BLOCKER_MAP.exists() else ''
    doc_text = DOC.read_text(encoding='utf-8', errors='replace') if DOC.exists() else ''

    rows = mapping.get('mapping') if isinstance(mapping.get('mapping'), list) else []
    product_ids = [row.get('product_id') for row in rows]
    numbers = [row.get('development_product_number') for row in rows]

    gate.check(branch() == 'dev', 'current git branch is dev')
    gate.check('products.product_number semantic uniqueness' in blocker_text and 'FAIL-CLOSED' in blocker_text, 'Build 421 Product-number blocker is retained fail-closed in Build 422 mapping')
    gate.check(PRODUCT_NUMBER['start'] == 1000 and PRODUCT_NUMBER['never_reuse'] is True, 'Product-number authority is a never-reused sequence starting at 1000')
    gate.check(MAPPING.exists(), 'Build 423 live read-only Product-number mapping artifact exists')
    gate.check(mapping.get('safe_to_prepare_backfill_sql') is True, 'Product-number live identity evidence is safe to prepare as a non-executing backfill map')
    gate.check(mapping.get('development_rows') == 45 and mapping.get('production_rows') == 45 and mapping.get('shared_product_ids') == 45, 'Development/Production Product row and ID sets are exactly 45/45')
    gate.check(mapping.get('identity_mismatch_count') == 0 and not mapping.get('development_only_ids') and not mapping.get('production_only_ids'), 'Product identity matches exactly by Product ID + slug + name')
    gate.check(mapping.get('development_missing_product_numbers') == 0 and mapping.get('development_duplicate_product_numbers') is False, 'Development has a complete unique Product-number mapping')
    gate.check(mapping.get('production_missing_product_numbers') == 45 and not mapping.get('production_existing_product_numbers'), 'Production blocker remains exactly 45 missing Product numbers with no conflicting assigned numbers')
    gate.check(len(rows) == 45 and len(set(product_ids)) == 45 and len(set(numbers)) == 45 and min(numbers) >= 1000, 'Non-executing Product-number map contains 45 unique IDs and 45 unique 1000+ numbers')
    gate.check(GIFT_CARD['plan'] == 'additive' and len(GIFT_CARD['lookup_attempt_columns']) == 5 and len(GIFT_CARD['lookup_attempt_indexes']) == 2, 'Gift Card additive fixture catalog covers five columns and two lookup indexes')
    gate.check(GIFT_CARD['lockout_table'] == 'gift_card_lookup_lockouts' and GIFT_CARD['lockout_index'] == 'idx_gift_card_lookup_lockouts_status', 'Gift Card lockout additive fixture authority is complete')
    gate.check(NOTIFICATION['plan'] == 'additive' and NOTIFICATION['columns'] == ['metadata_json'] and len(NOTIFICATION['indexes']) == 4, 'Notification additive fixture catalog covers metadata_json and four current indexes')
    gate.check(PRODUCT_IMAGE_ANNOTATIONS['authority'] == 'database_build197_application_resilience_media_catalog.sql' and PRODUCT_IMAGE_ANNOTATIONS['plan'] == 'additive-index', 'Product image annotation index is resolved to Build 197 additive authority')
    gate.check(MEMBERSHIP['plan'] == 'data-preserving-rebuild' and len(MEMBERSHIP['canonical_columns']) == 10 and MEMBERSHIP['legacy_aliases']['code'] == 'tier_code', 'Membership Build 395 mapping fixture authority is complete')
    gate.check(len(FRACTIONAL_TABLES) == 5 and 'site_item_inventory' in FRACTIONAL_TABLES and 'product_material_return_audit' in FRACTIONAL_TABLES, 'Fractional Inventory preservation fixture family contains all five evidenced tables')
    gate.check(len(PRODUCT_FK_FAMILY) == 5 and 'products' in PRODUCT_FK_FAMILY and 'supplier_purchase_order_items' in PRODUCT_FK_FAMILY, 'Product/FK orphan-gated fixture family contains all five evidenced tables')
    gate.check(ACCOUNTING_FAMILY == ['accounting_expenses', 'accounting_writeoffs', 'general_ledger_accounts'] and CONSTRAINT_DEFAULT_FAMILY == ['product_costs', 'movie_catalog', 'product_resource_links', 'tax_classes'], 'Accounting and constraint/default fixture families remain bounded to evidenced tables')
    gate.check(ONE_SIDED['search_query_terms'].startswith('preserve-5-live-rows') and 'untouched' in ONE_SIDED['__sql_test'], 'One-sided table disposition preserves search rows and avoids count-parity deletion')
    gate.check(next_count(doc_text) == 20 and all(value is False for value in SAFETY.values()), 'Build 423 records exactly next 20 and all mutation/copy/promotion capabilities remain disabled')

    print()
    if gate.failures:
        print(f'BUILD 423 TWENTY-ITEM LOCAL RELEASE CANDIDATE GATE: FAIL ({len(gate.failures)}/{gate.total} failed)')
        for failure in gate.failures:
            print(' -', failure)
        return 1

    print(f'BUILD 423 TWENTY-ITEM LOCAL RELEASE CANDIDATE GATE: PASS ({gate.total}/{gate.total})')
    print('Product-number blocker disposition: exact non-executing 45-row mapping proven; Production write still disabled.')
    print('No Cloudflare resource was contacted by this local gate.')
    print('No database or R2 mutation was executed.')
    print('Executable Production helper generated: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: execute the next 20 ordered Build 424 migration-assembly/fixture items from BUILD423_TWENTY_ITEM_BLOCKER_REMEDIATION_FIXTURES.md.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
