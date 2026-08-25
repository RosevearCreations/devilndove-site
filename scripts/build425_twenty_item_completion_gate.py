#!/usr/bin/env python3
"""Build 425 local completion gate after Development Product-number proof."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
RESERVATION = ROOT / 'build424_product_number_reservation_evidence.local.json'
PREFLIGHT = ROOT / 'build425_development_product_number_preflight.local.json'
APPLY = ROOT / 'build425_development_product_number_apply.local.json'
POST = ROOT / 'build425_development_product_number_postwrite.local.json'
PROD_PREVIEW = ROOT / 'build425_nonexecuting_production_product_number_preview.local.sql'
DOC = ROOT / 'BUILD425_TWENTY_ITEM_DEVELOPMENT_PRODUCT_NUMBER_BACKFILL.md'
WRITE_HELPER = ROOT / 'scripts/build425_development_product_number_backfill.py'
CREATE_PRODUCT = ROOT / 'functions/api/admin/create-product.js'
MOBILE_CREATE = ROOT / 'functions/api/admin/mobile-create-product.js'


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


def load(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return {}


def branch() -> str:
    result = subprocess.run(
        ['git', 'branch', '--show-current'], cwd=ROOT, text=True, encoding='utf-8', errors='replace',
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False,
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
    print('BUILD 425 TWENTY-ITEM DEVELOPMENT PRODUCT NUMBER COMPLETION GATE')
    print('Cloudflare/D1/provider access from this gate: NONE')
    print('Production mutation capability: NONE')
    print()

    gate = Gate()
    reservation = load(RESERVATION)
    preflight = load(PREFLIGHT)
    apply = load(APPLY)
    post = load(POST)
    doc_text = DOC.read_text(encoding='utf-8', errors='replace') if DOC.exists() else ''
    helper_text = WRITE_HELPER.read_text(encoding='utf-8', errors='replace') if WRITE_HELPER.exists() else ''
    create_text = CREATE_PRODUCT.read_text(encoding='utf-8', errors='replace') if CREATE_PRODUCT.exists() else ''
    mobile_text = MOBILE_CREATE.read_text(encoding='utf-8', errors='replace') if MOBILE_CREATE.exists() else ''
    preview_text = PROD_PREVIEW.read_text(encoding='utf-8', errors='replace') if PROD_PREVIEW.exists() else ''
    executable_preview_lines = [line for line in preview_text.splitlines() if line.strip() and not line.lstrip().startswith('--')]
    preview_updates = [line for line in preview_text.splitlines() if line.startswith('-- PREVIEW: UPDATE products SET product_number=')]

    backup_rel = str(apply.get('backup_path') or '')
    backup = ROOT / backup_rel if backup_rel else Path('')
    backup_hash_ok = False
    if backup_rel and backup.exists() and backup.is_file():
        backup_hash_ok = hashlib.sha256(backup.read_bytes()).hexdigest() == str(apply.get('backup_sha256') or '')

    gate.check(branch() == 'dev', 'current git branch is dev')
    gate.check(reservation.get('safe_to_prepare_nonexecuting_preview') is True and reservation.get('candidate_reservation_start') == 1084 and reservation.get('candidate_reservation_end') == 1128, 'Build 424 reservation remains the proven 1084..1128 block')
    gate.check(preflight.get('safe_to_apply_development') is True and preflight.get('development_database_id') == 'dbc1615b-dcbe-4951-973b-b47c99c73bfa', 'Development pre-write target/state gate passed')
    gate.check(preflight.get('identity_ok') is True and preflight.get('development_all_null') is True, 'pre-write Development identity and 45-NULL state were exact')
    gate.check(preflight.get('production_all_null') is True and preflight.get('production_database_write_capability') is False, 'pre-write Production remained read-only and 45-NULL')
    gate.check(preflight.get('sequence_evidence_fresh') is True and not preflight.get('reserved_candidate_collisions'), 'sequence/history evidence was fresh with no reservation collision')
    gate.check(APPLY.exists() and apply.get('development_write_attempted') is True and apply.get('production_write_executed') is False, 'Development write evidence exists and records no Production write')
    gate.check(backup_rel != '' and backup.exists() and int(apply.get('backup_bytes') or 0) > 0, 'full Development D1 export exists before write')
    gate.check(backup_hash_ok, 'Development backup SHA-256 matches recorded evidence')
    gate.check(post.get('pass') is True and post.get('development_rows') == 45, 'Development post-write proof passed for all 45 Products')
    gate.check(post.get('development_mapping_exact') is True and post.get('development_unique_number_count') == 45, 'Development mapping is exact and contains 45 unique Product numbers')
    gate.check(post.get('development_min_product_number') == 1084 and post.get('development_max_product_number') == 1128, 'Development Product-number range is exactly 1084..1128')
    gate.check(post.get('development_identities_preserved') is True, 'Product IDs/slugs/names were preserved')
    gate.check(int(post.get('development_sequence_next') or 0) >= 1129 and int(post.get('read_only_next_allocation_preview') or 0) >= 1129, 'Development sequence and read-only next allocation are beyond the legacy block')
    gate.check(post.get('production_still_all_null') is True and post.get('production_identities_preserved') is True and post.get('production_write_executed') is False, 'Production remains untouched after Development proof')
    gate.check(PROD_PREVIEW.exists() and len(executable_preview_lines) == 0 and len(preview_updates) == 45, 'Production Product-number preview is inert with exactly 45 commented updates')
    gate.check('allocateNextProductNumber' in create_text and 'ensureProductNumberSequenceAtLeast' in create_text and 'allocateNextProductNumber' in mobile_text, 'desktop/mobile creation paths remain sequence-aware without creating a validation Product')
    gate.check('EXPECTED_DEV_ID' in helper_text and 'EXPECTED_PROD_ID' in helper_text and 'Production target does not appear in this SQL' in helper_text, 'write helper retains explicit Dev target and Production exclusion guards')
    gate.check(next_count(doc_text) == 20, 'Build 425 Markdown records exactly the next 20 ordered Build 426 changes')
    gate.check('Production Product-number write         DISABLED' in doc_text and 'Production promotion                    CLOSED' in doc_text, 'Production mutation and promotion remain closed')

    print()
    if gate.failures:
        print(f'BUILD 425 TWENTY-ITEM DEVELOPMENT PRODUCT NUMBER COMPLETION GATE: FAIL ({len(gate.failures)}/{gate.total} failed)')
        for item in gate.failures:
            print(' -', item)
        return 1

    print(f'BUILD 425 TWENTY-ITEM DEVELOPMENT PRODUCT NUMBER COMPLETION GATE: PASS ({gate.total}/{gate.total})')
    print('Development legacy Product numbers: 1084..1128')
    print(f'Development next Product number: {post.get("read_only_next_allocation_preview")}')
    print('Production Product numbers: unchanged / still NULL')
    print('Production preview executable statements: ZERO')
    print('No Cloudflare resource was contacted by this local gate.')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: Build 426 executes the next 20 ordered Production release-candidate assembly tasks from BUILD425_TWENTY_ITEM_DEVELOPMENT_PRODUCT_NUMBER_BACKFILL.md.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
