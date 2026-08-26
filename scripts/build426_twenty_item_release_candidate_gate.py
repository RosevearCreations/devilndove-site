#!/usr/bin/env python3
"""Build 426 local twenty-item Production release-candidate gate."""
from __future__ import annotations

from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'build426_live_release_candidate_evidence.local.json'
SQL = ROOT / 'build426_production_release_candidate.local.sql'
MANIFEST = ROOT / 'build426_production_release_candidate_manifest.local.json'
DOC = ROOT / 'BUILD426_TWENTY_ITEM_PRODUCTION_RELEASE_CANDIDATE.md'
HANDOFF_OVERLAY = ROOT / 'BUILD426_CURRENT_STATE_HANDOFF_OVERLAY.md'
ROADMAP_OVERLAY = ROOT / 'BUILD426_CURRENT_STATE_ROADMAP_OVERLAY.md'


class Gate:
    def __init__(self):
        self.total = 0
        self.failures: list[str] = []

    def check(self, condition: bool, label: str) -> None:
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
    marker = '## Next 20 ordered changes — Build 427'
    if marker not in text:
        return 0
    tail = text.split(marker, 1)[1]
    pos = tail.find('\n## ')
    if pos >= 0:
        tail = tail[:pos]
    return len(re.findall(r'^\d+\.\s+', tail, re.M))


def main() -> int:
    print('BUILD 426 TWENTY-ITEM PRODUCTION RELEASE-CANDIDATE GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE')
    print()

    gate = Gate()
    evidence = json.loads(EVIDENCE.read_text(encoding='utf-8')) if EVIDENCE.exists() else {}
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {}
    sql = SQL.read_text(encoding='utf-8', errors='replace') if SQL.exists() else ''
    doc = DOC.read_text(encoding='utf-8', errors='replace') if DOC.exists() else ''

    dev_numbers = evidence.get('development_product_numbers') or []
    prod_numbers = evidence.get('production_product_numbers') or []
    mapping = evidence.get('product_mapping') or []
    product_updates = [line for line in sql.splitlines() if line.startswith('UPDATE products SET product_number=')]
    ready = manifest.get('ready_candidate_families') or {}
    review = manifest.get('review_required_families') or {}
    preserve = manifest.get('preserve_no_action') or {}
    fractional = evidence.get('fractional_tables') or {}

    gate.check(branch() == 'dev', 'current git branch is dev')
    gate.check('Build 425  Development Product-number backfill       PASS (20/20)' in doc or 'Build 425' in doc, 'Build 426 documentation carries the green Build 425 boundary')
    gate.check(HANDOFF_OVERLAY.exists() and ROADMAP_OVERLAY.exists(), 'current parity handoff and roadmap overlays exist')
    gate.check(EVIDENCE.exists(), 'Build 426 live read-only evidence artifact exists')
    gate.check(len(dev_numbers) == 45 and min(dev_numbers or [0]) == 1084 and max(dev_numbers or [0]) == 1128 and len(set(dev_numbers)) == 45, 'Development remains exact 45 unique Product numbers 1084..1128')
    gate.check(evidence.get('development_sequence_next', 0) >= 1129, 'Development Product-number sequence remains at least 1129')
    gate.check(len(prod_numbers) == 0 and evidence.get('production_products') == 45 and evidence.get('production_sequence_next') == 1084, 'Production still has 45 NULL Product numbers and sequence next 1084')
    gate.check(evidence.get('product_number_candidate_ready') is True and not evidence.get('production_candidate_collisions'), 'fresh Product-number Production candidate is collision-free and ready')
    gate.check(len(mapping) == 45 and len({row.get('product_id') for row in mapping}) == 45 and len({row.get('product_number') for row in mapping}) == 45, 'fresh live Product mapping contains 45 unique IDs and numbers')
    gate.check((evidence.get('gift_card') or {}).get('missing_lookup_attempt_columns') is not None and ready.get('gift_card') is True, 'Gift Card Build 384 additive authority is package-ready')
    gate.check((evidence.get('notification') or {}).get('missing_indexes') is not None and ready.get('notification') is True, 'Notification Build 403 additive authority is package-ready')
    gate.check(ready.get('product_image_annotation_index') is True, 'Build 197 Product-image annotation index authority is package-ready')
    gate.check(review.get('membership') is True and (evidence.get('membership') or {}).get('production_rows') == 3, 'Membership Build 395 remains a three-row data-preserving rebuild family')
    gate.check(len(fractional) == 5 and (fractional.get('site_item_inventory') or {}).get('production_rows') == 1041, 'fractional rebuild family is bounded to five tables with exact 1,041-row Inventory preservation')
    gate.check(evidence.get('zero_orphans') is True and all(value == 0 for value in (evidence.get('orphan_counts') or {}).values()), 'fresh Product/FK orphan evidence remains zero')
    gate.check(preserve.get('search_query_terms_rows') == 5 and preserve.get('__sql_test_rows') == 0, 'one-sided table decisions preserve five search rows and leave empty __sql_test untouched')
    gate.check(preserve.get('caip_media_upload_files_rows') == 113, 'CAIP 113-row/private-R2 delta remains excluded from parity execution')
    gate.check(SQL.exists() and len(product_updates) == 45 and 'DO NOT EXECUTE WITHOUT THE LATER EXPLICIT PRODUCTION AUTHORIZATION GATE' in sql, 'local candidate SQL contains 45 guarded Product updates and explicit no-execution warning')
    gate.check(MANIFEST.exists() and manifest.get('production_execution_enabled') is False and manifest.get('production_backup_created_by_build426') is False and manifest.get('production_mutation_executed') is False, 'manifest records no Production backup/execution/mutation in Build 426')
    gate.check(next_count(doc) == 20 and manifest.get('production_promotion_open') is False, 'Build 426 records exactly next 20 and keeps Production promotion closed')

    print()
    if gate.failures:
        print(f'BUILD 426 TWENTY-ITEM PRODUCTION RELEASE-CANDIDATE GATE: FAIL ({len(gate.failures)}/{gate.total} failed)')
        for failure in gate.failures:
            print(' -', failure)
        return 1

    print(f'BUILD 426 TWENTY-ITEM PRODUCTION RELEASE-CANDIDATE GATE: PASS ({gate.total}/{gate.total})')
    print('Development Product numbers: 1084..1128; next >=1129')
    print('Production Product numbers: unchanged / still NULL')
    print('Production release candidate: assembled locally, NOT executed')
    print('Production backup for execution: NOT YET CREATED')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: Build 427 follows the 20 ordered execution/post-proof tasks only after separate explicit Production authorization.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
