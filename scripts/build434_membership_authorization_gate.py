#!/usr/bin/env python3
"""Build 434 local-only twenty-item Membership rebuild authorization gate."""
from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PRODUCT = ROOT / 'build427_production_product_number_postcheck.local.json'
GIFT = ROOT / 'build428_production_gift_postcheck.local.json'
NOTIFICATION = ROOT / 'build431_production_notification_postcheck.local.json'
ANNOTATION = ROOT / 'build433_production_annotation_postcheck.local.json'
PRE = ROOT / 'build434_membership_authorization_preflight.local.json'
PREVIEW = ROOT / 'build434_membership_rebuild_preview.local.json'
DOC = ROOT / 'BUILD434_TWENTY_ITEM_MEMBERSHIP_AUTHORIZATION_BOUNDARY.md'
EXPECTED_TIERS = {'bronze', 'silver', 'gold'}
EXPECTED_ALIASES = {
    'membership_tier_policy_id': 'policy_id',
    'code': 'tier_code',
    'name': 'title',
    'display_title': 'title',
}

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    print(f'{checks:02d}. {"PASS" if condition else "FAIL"} — {label}')
    if not condition:
        failures.append(label)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}


def main() -> int:
    print('BUILD 434 TWENTY-ITEM MEMBERSHIP BUILD 395 AUTHORIZATION-BOUNDARY GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability in this gate: NONE')
    print()

    branch = subprocess.run(['git','branch','--show-current'], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False).stdout.strip()
    product = load(PRODUCT)
    gift = load(GIFT)
    notification = load(NOTIFICATION)
    annotation = load(ANNOTATION)
    pre = load(PRE)
    preview = load(PREVIEW)
    doc_text = DOC.read_text(encoding='utf-8') if DOC.exists() else ''
    next_section = doc_text.split('## Next 20 ordered changes — Build 435', 1)[1] if '## Next 20 ordered changes — Build 435' in doc_text else ''
    next_block = next_section.split('## Gate state', 1)[0] if next_section else ''
    next_items = re.findall(r'(?m)^\d+\.\s+', next_block)

    check(branch == 'dev', 'current git branch is dev')
    check(product.get('pass') is True and product.get('production_min_product_number') == 1084 and product.get('production_max_product_number') == 1128, 'Product-number Production prerequisite remains green')
    check(gift.get('pass') is True and gift.get('stage') == 'gift' and gift.get('row_count_preserved') is True, 'Gift Card Production prerequisite remains green')
    check(notification.get('pass') is True and notification.get('stage') == 'notification' and notification.get('all_five_indexes_present') is True, 'full Notification Production prerequisite remains green')
    check(annotation.get('pass') is True and annotation.get('stage') == 'annotation' and annotation.get('annotation_index_present') is True, 'Build 197 annotation Production prerequisite remains green')
    check(annotation.get('row_count_preserved') is True, 'Build 197 annotation row-preservation proof remains green')
    check(bool(pre), 'Build 434 Membership read-only preflight artifact exists')
    check(all(pre.get(key) is True for key in ['product_number_prerequisite_pass','gift_card_prerequisite_pass','notification_prerequisite_pass','annotation_prerequisite_pass']), 'Membership preflight is anchored to all completed prerequisites')
    check(pre.get('membership_row_count') == 3, 'Membership live row boundary is exactly three rows')
    check(set(pre.get('normalized_tiers') or []) == EXPECTED_TIERS and pre.get('three_expected_tiers') is True, 'Membership rows normalize exactly to bronze/silver/gold')
    check(pre.get('legacy_aliases') == EXPECTED_ALIASES and pre.get('legacy_aliases_present') is True, 'reviewed four-field legacy alias mapping is present')
    check(pre.get('canonical_column_names_exact') is False and pre.get('rebuild_required') is True, 'Membership live column shape still requires canonical Build 395 rebuild')
    check(pre.get('safe_to_request_membership_rebuild_authorization') is True, 'Membership preflight is safe to request separate rebuild authorization')
    check(pre.get('production_backup_created') is False and pre.get('membership_rebuild_authorization_received') is False, 'no Membership backup or authorization is inferred')
    check(pre.get('production_mutation_executed') is False and pre.get('production_promotion_open') is False, 'Membership preflight claims no mutation or promotion')
    check(bool(preview), 'Membership inert rebuild preview artifact exists')
    check(preview.get('executable_statement_count') == 0 and preview.get('executable_statements') == [], 'Membership rebuild preview contains zero executable statements')
    check(preview.get('cloudflare_access') is False and preview.get('production_mutation_executed') is False, 'Membership preview cannot contact Cloudflare or mutate Production')
    check(preview.get('membership_row_count') == 3 and set(preview.get('normalized_tiers') or []) == EXPECTED_TIERS, 'Membership preview preserves the exact three-tier identity boundary')
    check(len(next_items) == 20 and 'Production promotion' in doc_text and 'CLOSED' in doc_text, 'Build 434 records exactly next 20 and keeps Production promotion closed')

    print()
    if failures:
        print(f'BUILD 434 TWENTY-ITEM MEMBERSHIP BUILD 395 AUTHORIZATION-BOUNDARY GATE: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 434 TWENTY-ITEM MEMBERSHIP BUILD 395 AUTHORIZATION-BOUNDARY GATE: PASS ({checks}/{checks})')
    print('Product/Gift/Notification/Annotation Production stages: COMPLETE / PROVEN')
    print('Membership rows: 3 / bronze,silver,gold')
    print('Membership rebuild preview executable statements: 0')
    print('Membership Production backup: NOT CREATED')
    print('Membership rebuild authorization: NOT RECEIVED')
    print('Membership Production mutation executed: NO')
    print('Later rebuild-family authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: explicit Membership rebuild Production authorization would be required before any backup/rebuild controller is created or exercised.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
