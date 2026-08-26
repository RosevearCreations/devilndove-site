#!/usr/bin/env python3
"""Build 428 local-only twenty-item remaining parity authorization-boundary gate."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
LIVE = ROOT / 'build428_live_remaining_parity_evidence.local.json'
POST = ROOT / 'build427_production_product_number_postcheck.local.json'
MEM_PREVIEW = ROOT / 'build428_membership_rebuild_preview.local.sql'
DOC = ROOT / 'BUILD428_TWENTY_ITEM_REMAINING_PARITY_BOUNDARY.md'
ADD_SOURCE = (ROOT / 'scripts' / 'build427_production_additive_execution.py').read_text(encoding='utf-8')

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    status = 'PASS' if condition else 'FAIL'
    print(f'{checks:02d}. {status} — {label}')
    if not condition:
        failures.append(label)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}


def main() -> int:
    print('BUILD 428 TWENTY-ITEM REMAINING PARITY AUTHORIZATION-BOUNDARY GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability in this gate: NONE')
    print()

    branch = subprocess.run(['git','branch','--show-current'], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False).stdout.strip()
    post = load(POST)
    live = load(LIVE)
    gift = live.get('gift_card') or {}
    notification = live.get('notification') or {}
    annotation = live.get('product_image_annotations') or {}
    membership = live.get('membership') or {}
    fractional = live.get('fractional_tables') or {}
    preview_text = MEM_PREVIEW.read_text(encoding='utf-8') if MEM_PREVIEW.exists() else ''
    doc_text = DOC.read_text(encoding='utf-8') if DOC.exists() else ''

    check(branch == 'dev', 'current git branch is dev')
    check(post.get('pass') is True, 'Build 427 Production Product-number postcheck remains green')
    check(post.get('production_min_product_number') == 1084 and post.get('production_max_product_number') == 1128, 'Production Product-number range remains 1084..1128')
    check(post.get('production_sequence_next', 0) >= 1129 and post.get('development_sequence_next', 0) >= 1129, 'Dev/Prod Product-number sequences remain at least 1129')
    check(bool(live), 'Build 428 live remaining-parity evidence artifact exists')
    check(live.get('product_number_prerequisite_pass') is True, 'remaining parity evidence is anchored to the closed Product-number prerequisite')
    check(set(gift.get('missing_columns') or []) == {'lookup_email','code_suffix','ip_hash','user_agent','result_status'}, 'Gift Card live gap remains exactly five lookup-attempt columns')
    check(gift.get('lockout_table_exists') is False, 'Gift Card lockout table is still absent before separate authorization')
    check(notification.get('metadata_json_exists') is False, 'Notification metadata_json is still absent before separate authorization')
    check(set(notification.get('missing_indexes') or []) == {'idx_notification_outbox_kind_destination','idx_notification_outbox_payment','idx_notification_outbox_product'}, 'Notification live missing-index set remains the proven three-index gap')
    check(annotation.get('build197_index_exists') is False, 'Build 197 Product-image annotation index remains absent before authorization')
    check(membership.get('production_rows') == 3 and membership.get('requires_rebuild') is True, 'Membership remains a three-row data-preserving rebuild family')
    check(set(fractional.keys()) == {'site_item_inventory','site_inventory_movements','creative_project_inventory_posts','creative_project_inventory_reversals','product_material_return_audit'}, 'fractional rebuild evidence remains bounded to five tables')
    check(live.get('site_item_inventory_rows') == 1041, 'Production site_item_inventory preservation boundary remains exactly 1,041 rows')
    check(live.get('zero_orphans') is True, 'fresh Product/FK orphan evidence remains zero')
    check(live.get('search_query_terms_rows') == 5 and live.get('__sql_test_rows') == 0, 'one-sided table preservation/no-action boundaries remain 5/0')
    check(live.get('caip_media_upload_files_rows') == 113, 'CAIP 113-row/private-R2 delta remains excluded from parity execution')
    check(all(live.get(key) is False for key in ['gift_card_authorized','notification_authorized','annotation_authorized','rebuild_authorized']), 'no remaining Production authorization is inferred')
    check(bool(preview_text) and all(line.lstrip().startswith('--') or not line.strip() for line in preview_text.splitlines()), 'Membership preview exists and contains zero executable statements')
    check(doc_text.count('\n1.') == 1 and 'Next 20 ordered changes — Build 429' in doc_text and 'Production promotion' in doc_text and 'CLOSED' in doc_text, 'Build 428 records the next 20 and keeps Production promotion closed')

    print()
    if failures:
        print(f'BUILD 428 TWENTY-ITEM REMAINING PARITY AUTHORIZATION-BOUNDARY GATE: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 428 TWENTY-ITEM REMAINING PARITY AUTHORIZATION-BOUNDARY GATE: PASS ({checks}/{checks})')
    print('Product-number Production stage: COMPLETE / PROVEN')
    print('Gift Card authorization: NOT RECEIVED')
    print('Notification authorization: NOT RECEIVED')
    print('Annotation-index authorization: NOT RECEIVED')
    print('Rebuild-family authorization: NOT RECEIVED')
    print('Production mutation executed by Build 428: NO')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: explicit per-family Production authorization is required before any remaining mutation stage.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
