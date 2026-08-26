#!/usr/bin/env python3
"""Build 431 local-only twenty-item corrected Notification authorization gate."""
from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PRODUCT = ROOT / 'build427_production_product_number_postcheck.local.json'
GIFT = ROOT / 'build428_production_gift_postcheck.local.json'
PRE = ROOT / 'build431_notification_full_authorization_preflight.local.json'
DOC = ROOT / 'BUILD431_TWENTY_ITEM_NOTIFICATION_FULL_AUTHORIZATION_BOUNDARY.md'
CTL = (ROOT / 'scripts' / 'build431_production_notification_execution.py').read_text(encoding='utf-8')

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
    print('BUILD 431 TWENTY-ITEM FULL NOTIFICATION AUTHORIZATION-BOUNDARY GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability in this gate: NONE')
    print()

    branch = subprocess.run(['git','branch','--show-current'], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False).stdout.strip()
    product = load(PRODUCT)
    gift = load(GIFT)
    pre = load(PRE)
    doc_text = DOC.read_text(encoding='utf-8') if DOC.exists() else ''
    next_section = doc_text.split('## Next 20 ordered changes — Build 432', 1)[1] if '## Next 20 ordered changes — Build 432' in doc_text else ''
    next_block = next_section.split('## Gate state', 1)[0] if next_section else ''
    next_items = re.findall(r'(?m)^\d+\.\s+', next_block)
    expected_indexes = {
        'idx_notification_outbox_status_due',
        'idx_notification_outbox_kind_destination',
        'idx_notification_outbox_order',
        'idx_notification_outbox_payment',
        'idx_notification_outbox_product',
    }

    check(branch == 'dev', 'current git branch is dev')
    check(product.get('pass') is True, 'Build 427 Product-number Production prerequisite remains green')
    check(product.get('production_min_product_number') == 1084 and product.get('production_max_product_number') == 1128, 'Production Product numbers remain 1084..1128')
    check(int(product.get('production_sequence_next') or 0) >= 1129, 'Production Product-number sequence remains at least 1129')
    check(gift.get('pass') is True and gift.get('stage') == 'gift', 'Gift Card Production stage remains green')
    check(gift.get('row_count_preserved') is True, 'Gift Card Production row-preservation proof remains green')
    check(bool(pre), 'corrected Build 431 Notification preflight artifact exists')
    check(pre.get('product_number_prerequisite_pass') is True and pre.get('gift_card_prerequisite_pass') is True, 'corrected preflight is anchored to Product/Gift prerequisites')
    check(pre.get('metadata_json_exists') is False, 'Notification metadata_json is still absent before corrected authorization')
    check(set(pre.get('missing_indexes') or []) == expected_indexes, 'Notification live gap is exactly all five canonical Build 403 indexes')
    check(pre.get('exact_full_build403_gap') is True, 'corrected preflight matches exact full Build 403 gap')
    check(pre.get('safe_to_request_full_notification_authorization') is True, 'corrected preflight is safe to request expanded Notification authorization')
    check(pre.get('prior_four_index_authorization_sufficient') is False, 'prior four-index authorization is explicitly insufficient')
    check(isinstance(pre.get('notification_outbox_rows'), int) and pre.get('notification_outbox_rows') >= 0, 'Notification outbox row-preservation boundary is recorded')
    check(pre.get('production_backup_created') is False, 'no Notification Production backup was created after the safe stop')
    check(pre.get('full_notification_authorization_received') is False, 'new full-Build-403 authorization is not inferred')
    check(pre.get('production_mutation_executed') is False, 'corrected preflight claims no Production mutation')
    check(pre.get('annotation_authorization_received') is False and pre.get('rebuild_authorization_received') is False, 'annotation/rebuild authorizations remain false')
    check("AUTH_TOKEN = 'AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403'" in CTL and 'notification_sql_full(before)' in CTL, 'future full Notification execution is separately token-gated and full-scope')
    check(len(next_items) == 20 and 'Production promotion' in doc_text and 'CLOSED' in doc_text, 'Build 431 records exactly next 20 and keeps Production promotion closed')

    print()
    if failures:
        print(f'BUILD 431 TWENTY-ITEM FULL NOTIFICATION AUTHORIZATION-BOUNDARY GATE: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 431 TWENTY-ITEM FULL NOTIFICATION AUTHORIZATION-BOUNDARY GATE: PASS ({checks}/{checks})')
    print('Product-number Production stage: COMPLETE / PROVEN')
    print('Gift Card Production stage: COMPLETE / PROVEN')
    print('Prior four-index Notification authorization: SUPERSEDED / INSUFFICIENT')
    print('Full Build 403 Notification backup: NOT CREATED')
    print('Full Build 403 Notification authorization: NOT RECEIVED')
    print('Notification mutation executed: NO')
    print('Annotation-index authorization: NOT RECEIVED')
    print('Rebuild-family authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: explicit full-Build-403 Notification authorization is required before backup/apply.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
