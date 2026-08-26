#!/usr/bin/env python3
"""Build 429 local-only Gift Card Production authorization-boundary gate."""
from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PRE = ROOT / 'build429_gift_card_authorization_preflight.local.json'
POST = ROOT / 'build427_production_product_number_postcheck.local.json'
DOC = ROOT / 'BUILD429_TWENTY_ITEM_GIFT_CARD_AUTHORIZATION_BOUNDARY.md'
EXEC = (ROOT / 'scripts' / 'build428_production_additive_execution.py').read_text(encoding='utf-8')

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
    print('BUILD 429 TWENTY-ITEM GIFT CARD AUTHORIZATION-BOUNDARY GATE')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability in this gate: NONE')
    print()

    branch = subprocess.run(['git','branch','--show-current'], cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=False).stdout.strip()
    post = load(POST)
    pre = load(PRE)
    doc_text = DOC.read_text(encoding='utf-8') if DOC.exists() else ''
    next_section = doc_text.split('## Next 20 ordered changes — Build 430', 1)[1] if '## Next 20 ordered changes — Build 430' in doc_text else ''
    next_items = re.findall(r'(?m)^\d+\.\s+', next_section.split('## Gate state', 1)[0]) if next_section else []

    check(branch == 'dev', 'current git branch is dev')
    check(post.get('pass') is True, 'Build 427 Product-number Production prerequisite remains green')
    check(post.get('production_min_product_number') == 1084 and post.get('production_max_product_number') == 1128, 'Production Product numbers remain 1084..1128')
    check(int(post.get('production_sequence_next') or 0) >= 1129, 'Production Product-number sequence remains at least 1129')
    check(bool(pre), 'Build 429 Gift Card read-only preflight artifact exists')
    check(pre.get('product_number_prerequisite_pass') is True, 'Gift Card preflight is anchored to the proven Product-number prerequisite')
    check(set(pre.get('missing_lookup_columns') or []) == {'lookup_email','code_suffix','ip_hash','user_agent','result_status'}, 'Gift Card live gap is exactly five canonical lookup columns')
    check(set(pre.get('missing_indexes') or []) == {'idx_gift_card_lookup_attempts_created','idx_gift_card_lookup_attempts_email','idx_gift_card_lookup_lockouts_status'}, 'Gift Card live gap is exactly three canonical indexes')
    check(pre.get('lockout_table_exists') is False, 'Gift Card lockout table is still absent before authorization')
    check(pre.get('exact_known_gap') is True, 'Gift Card preflight matches the exact reviewed Build 384 additive gap')
    check(pre.get('safe_to_request_gift_card_authorization') is True, 'Gift Card preflight is safe to request stage-specific authorization')
    check(isinstance(pre.get('gift_card_lookup_attempt_rows'), int), 'lookup-attempt preservation row boundary is recorded')
    check(isinstance(pre.get('gift_cards_rows'), int) and isinstance(pre.get('gift_card_redemptions_rows'), int), 'Gift Card/redemption preservation row boundaries are recorded')
    check(pre.get('production_backup_created') is False, 'no Gift Card Production backup is claimed before authorization')
    check(pre.get('gift_card_authorization_received') is False, 'Gift Card authorization is not inferred from Build 428 PASS')
    check(pre.get('production_mutation_executed') is False, 'Gift Card preflight claims no Production mutation')
    check(all(pre.get(key) is False for key in ['notification_authorization_received','annotation_authorization_received','rebuild_authorization_received']), 'Notification/annotation/rebuild authorizations remain false')
    check("AUTHORIZE-BUILD428-PROD-GIFT-CARD" in EXEC and 'verify_backup(stage)' in EXEC and 'MAX_BACKUP_AGE_SECONDS = 1800' in EXEC, 'future Gift Card apply remains token-gated and fresh-backup-gated')
    check(len(next_items) == 20, 'Build 429 records exactly the next 20 ordered Build 430 changes')
    check('Production promotion' in doc_text and 'CLOSED' in doc_text, 'Production promotion remains closed at Gift Card authorization boundary')

    print()
    if failures:
        print(f'BUILD 429 TWENTY-ITEM GIFT CARD AUTHORIZATION-BOUNDARY GATE: FAIL ({len(failures)}/{checks} failed)')
        for failure in failures:
            print(' -', failure)
        return 1

    print(f'BUILD 429 TWENTY-ITEM GIFT CARD AUTHORIZATION-BOUNDARY GATE: PASS ({checks}/{checks})')
    print('Product-number Production stage: COMPLETE / PROVEN')
    print('Gift Card backup: NOT CREATED')
    print('Gift Card authorization: NOT RECEIVED')
    print('Gift Card mutation executed: NO')
    print('Notification authorization: NOT RECEIVED')
    print('Annotation-index authorization: NOT RECEIVED')
    print('Rebuild-family authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('NEXT: explicit Gift Card Production authorization is required before its backup/apply sequence.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
