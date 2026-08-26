#!/usr/bin/env python3
"""Build 432 local-only twenty-item Build 197 annotation authorization-boundary gate."""
from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PRODUCT = ROOT / 'build427_production_product_number_postcheck.local.json'
GIFT = ROOT / 'build428_production_gift_postcheck.local.json'
NOTIFICATION = ROOT / 'build431_production_notification_postcheck.local.json'
PRE = ROOT / 'build432_annotation_authorization_preflight.local.json'
DOC = ROOT / 'BUILD432_TWENTY_ITEM_ANNOTATION_AUTHORIZATION_BOUNDARY.md'
EXEC_SOURCE = (ROOT / 'scripts' / 'build428_production_additive_execution.py').read_text(encoding='utf-8')
AUTH_SOURCE = (ROOT / 'database_build197_application_resilience_media_catalog.sql').read_text(encoding='utf-8')
INDEX = 'idx_product_image_annotations_product_image_build197'

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
    print('BUILD 432 TWENTY-ITEM BUILD 197 ANNOTATION AUTHORIZATION-BOUNDARY GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability in this gate: NONE')
    print()

    branch = subprocess.run(['git', 'branch', '--show-current'], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False).stdout.strip()
    product = load(PRODUCT)
    gift = load(GIFT)
    notification = load(NOTIFICATION)
    pre = load(PRE)
    doc_text = DOC.read_text(encoding='utf-8') if DOC.exists() else ''
    next_section = doc_text.split('## Next 20 ordered changes — Build 433', 1)[1] if '## Next 20 ordered changes — Build 433' in doc_text else ''
    next_block = next_section.split('## Gate state', 1)[0] if next_section else ''
    next_items = re.findall(r'(?m)^\d+\.\s+', next_block)

    check(branch == 'dev', 'current git branch is dev')
    check(product.get('pass') is True, 'Build 427 Product-number Production prerequisite remains green')
    check(product.get('production_min_product_number') == 1084 and product.get('production_max_product_number') == 1128, 'Production Product numbers remain 1084..1128')
    check(int(product.get('production_sequence_next') or 0) >= 1129, 'Production Product-number sequence remains at least 1129')
    check(gift.get('pass') is True and gift.get('stage') == 'gift' and gift.get('row_count_preserved') is True, 'Gift Card Production prerequisite remains complete/proven')
    check(notification.get('pass') is True and notification.get('stage') == 'notification', 'full Build 403 Notification Production postcheck is green')
    check(notification.get('row_count_preserved') is True and notification.get('all_five_indexes_present') is True, 'full Notification row/index proof remains green')
    check(bool(pre), 'Build 432 annotation read-only preflight artifact exists')
    check(pre.get('product_number_prerequisite_pass') is True and pre.get('gift_card_prerequisite_pass') is True and pre.get('notification_prerequisite_pass') is True, 'annotation preflight is anchored to all completed Production prerequisites')
    check(pre.get('annotation_index') == INDEX and pre.get('annotation_index_exists') is False, 'Build 197 annotation composite index is still absent before authorization')
    check(pre.get('required_columns_present') is True, 'product_id and product_image_id required columns are present')
    check(isinstance(pre.get('product_image_annotations_rows'), int) and pre.get('product_image_annotations_rows') >= 0, 'annotation row-preservation boundary is recorded')
    check(pre.get('exact_known_gap') is True, 'annotation preflight matches the exact reviewed Build 197 index gap')
    check(pre.get('safe_to_request_annotation_authorization') is True, 'annotation preflight is safe to request stage-specific authorization')
    check(pre.get('production_backup_created') is False, 'no annotation Production backup is claimed before authorization')
    check(pre.get('annotation_authorization_received') is False, 'annotation authorization is not inferred from Notification success')
    check(pre.get('production_mutation_executed') is False and pre.get('rebuild_authorization_received') is False, 'annotation preflight claims no mutation and no rebuild authorization')
    check("'annotation': 'AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX'" in EXEC_SOURCE and 'verify_backup(stage)' in EXEC_SOURCE, 'future annotation apply remains separately token-gated and fresh-backup-gated')
    check(INDEX in EXEC_SOURCE and 'ON product_image_annotations(product_id, product_image_id)' in AUTH_SOURCE, 'future annotation SQL matches Build 197 authority exactly')
    check(len(next_items) == 20 and 'Production promotion' in doc_text and 'CLOSED' in doc_text, 'Build 432 records exactly next 20 and keeps Production promotion closed')

    print()
    if failures:
        print(f'BUILD 432 TWENTY-ITEM BUILD 197 ANNOTATION AUTHORIZATION-BOUNDARY GATE: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 432 TWENTY-ITEM BUILD 197 ANNOTATION AUTHORIZATION-BOUNDARY GATE: PASS ({checks}/{checks})')
    print('Product-number Production stage: COMPLETE / PROVEN')
    print('Gift Card Production stage: COMPLETE / PROVEN')
    print('Full Build 403 Notification Production stage: COMPLETE / PROVEN')
    print('Annotation backup: NOT CREATED')
    print('Annotation authorization: NOT RECEIVED')
    print('Annotation mutation executed: NO')
    print('Rebuild-family authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: explicit Build 197 annotation-index Production authorization is required before backup/apply.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
