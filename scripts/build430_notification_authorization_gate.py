#!/usr/bin/env python3
"""Build 430 local-only twenty-item Notification authorization-boundary gate."""
from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PRODUCT = ROOT / 'build427_production_product_number_postcheck.local.json'
GIFT = ROOT / 'build428_production_gift_postcheck.local.json'
PRE = ROOT / 'build430_notification_authorization_preflight.local.json'
DOC = ROOT / 'BUILD430_TWENTY_ITEM_NOTIFICATION_AUTHORIZATION_BOUNDARY.md'
EXEC_SOURCE = (ROOT / 'scripts' / 'build428_production_additive_execution.py').read_text(encoding='utf-8')

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
    print('BUILD 430 TWENTY-ITEM NOTIFICATION AUTHORIZATION-BOUNDARY GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability in this gate: NONE')
    print()

    branch = subprocess.run(['git','branch','--show-current'], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False).stdout.strip()
    product = load(PRODUCT)
    gift = load(GIFT)
    pre = load(PRE)
    doc_text = DOC.read_text(encoding='utf-8') if DOC.exists() else ''
    next_section = doc_text.split('## Next 20 ordered changes — Build 431', 1)[1] if '## Next 20 ordered changes — Build 431' in doc_text else ''
    next_block = next_section.split('## Gate state', 1)[0] if next_section else ''
    next_items = re.findall(r'(?m)^\d+\.\s+', next_block)
    expected_indexes = {
        'idx_notification_outbox_kind_destination',
        'idx_notification_outbox_order',
        'idx_notification_outbox_payment',
        'idx_notification_outbox_product',
    }

    check(branch == 'dev', 'current git branch is dev')
    check(product.get('pass') is True, 'Build 427 Product-number Production prerequisite remains green')
    check(product.get('production_min_product_number') == 1084 and product.get('production_max_product_number') == 1128, 'Production Product numbers remain 1084..1128')
    check(int(product.get('production_sequence_next') or 0) >= 1129, 'Production Product-number sequence remains at least 1129')
    check(gift.get('pass') is True and gift.get('stage') == 'gift', 'Gift Card Production stage postcheck is green')
    check(gift.get('row_count_preserved') is True, 'Gift Card Production stage preserved its recorded row boundaries')
    check(bool(pre), 'Build 430 Notification read-only preflight artifact exists')
    check(pre.get('product_number_prerequisite_pass') is True, 'Notification preflight is anchored to Product-number prerequisite')
    check(pre.get('gift_card_prerequisite_pass') is True, 'Notification preflight is anchored to completed Gift Card prerequisite')
    check(pre.get('metadata_json_exists') is False, 'Notification metadata_json is still absent before authorization')
    check(set(pre.get('missing_indexes') or []) == expected_indexes, 'Notification live gap is exactly the reviewed four-index set')
    check(pre.get('exact_known_gap') is True, 'Notification preflight matches the exact reviewed Build 403 additive gap')
    check(pre.get('safe_to_request_notification_authorization') is True, 'Notification preflight is safe to request stage-specific authorization')
    check(isinstance(pre.get('notification_outbox_rows'), int) and pre.get('notification_outbox_rows') >= 0, 'Notification outbox preservation row boundary is recorded')
    check(pre.get('production_backup_created') is False, 'no Notification Production backup is claimed before authorization')
    check(pre.get('notification_authorization_received') is False, 'Notification authorization is not inferred from Gift Card success')
    check(pre.get('production_mutation_executed') is False, 'Notification preflight claims no Production mutation')
    check(pre.get('annotation_authorization_received') is False and pre.get('rebuild_authorization_received') is False, 'annotation/rebuild authorizations remain false')
    check("'notification': 'AUTHORIZE-BUILD428-PROD-NOTIFICATION'" in EXEC_SOURCE and 'verify_backup(stage)' in EXEC_SOURCE, 'future Notification apply remains separately token-gated and fresh-backup-gated')
    check(len(next_items) == 20 and 'Production promotion' in doc_text and 'CLOSED' in doc_text, 'Build 430 records exactly next 20 and keeps Production promotion closed')

    print()
    if failures:
        print(f'BUILD 430 TWENTY-ITEM NOTIFICATION AUTHORIZATION-BOUNDARY GATE: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 430 TWENTY-ITEM NOTIFICATION AUTHORIZATION-BOUNDARY GATE: PASS ({checks}/{checks})')
    print('Product-number Production stage: COMPLETE / PROVEN')
    print('Gift Card Production stage: COMPLETE / PROVEN')
    print('Notification backup: NOT CREATED')
    print('Notification authorization: NOT RECEIVED')
    print('Notification mutation executed: NO')
    print('Annotation-index authorization: NOT RECEIVED')
    print('Rebuild-family authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: explicit Notification Production authorization is required before its backup/apply sequence.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
