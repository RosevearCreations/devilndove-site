#!/usr/bin/env python3
"""Build 431 local-only Notification Production execution safety regression."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CTL = (ROOT / 'scripts' / 'build431_production_notification_execution.py').read_text(encoding='utf-8')
ADD = (ROOT / 'scripts' / 'build428_production_additive_execution.py').read_text(encoding='utf-8')
AUTH = (ROOT / 'database_notification_runtime_parity.sql').read_text(encoding='utf-8')

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


check("AUTH_TOKEN = 'AUTHORIZE-BUILD428-PROD-NOTIFICATION'" in CTL, 'Notification controller requires the exact explicit token')
check("GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'" in CTL, 'Notification controller requires Gift Card proof artifact')
check('additive.require_product_postcheck()' in CTL, 'Notification controller requires Product-number proof')
check('require_gift_postcheck()' in CTL, 'Notification controller requires completed Gift Card proof')
check("PREFLIGHT_SCRIPT = ROOT / 'scripts' / 'build430_notification_authorization_preflight.py'" in CTL, 'backup stage reruns the targeted Notification preflight')
check("STATUS_DUE_INDEX = 'idx_notification_outbox_status_due'" in CTL, 'status-due index is an explicit preserved boundary')
check(all(name in CTL for name in ['idx_notification_outbox_kind_destination','idx_notification_outbox_order','idx_notification_outbox_payment','idx_notification_outbox_product']), 'all four reviewed Notification indexes are explicit')
check("'metadata_json' not in columns" in CTL and "'metadata_json' in columns" in CTL, 'controller distinguishes exact before/after metadata state')
check('missing == EXPECTED_MISSING_INDEXES' in CTL, 'controller refuses partial or unexpected pre-write index drift')
check('STATUS_DUE_INDEX in indexes' in CTL, 'controller requires status-due index before write')
check("additive.export_backup('notification')" in CTL, 'Notification backup delegates to the full Production D1 export')
check("additive.verify_backup('notification')" in CTL, 'Notification apply re-verifies backup bytes/SHA/age')
check('after_backup != before' in CTL, 'backup-only stage refuses unexpected Notification state change')
check("additive.current_state('notification')" in CTL, 'Notification state is reread immediately around execution')
check("additive.notification_sql(before)" in CTL and "additive.execute_sql('notification', sql)" in CTL, 'controller executes only Notification additive SQL')
check("rows_preserved = int(after.get('row_count') or 0) == int(before.get('row_count') or 0)" in CTL, 'notification_outbox row count must be preserved')
check("'status_due_index_preserved'" in CTL and 'complete_after_state(after)' in CTL, 'post-proof records status-due preservation and schema completion')
check('annotation' not in CTL.split('def main()', 1)[-1].lower() and 'membership' not in CTL.split('def main()', 1)[-1].lower(), 'controller exposes no annotation/rebuild execution action')
check('MAX_BACKUP_AGE_SECONDS = 1800' in ADD and 'hashlib.sha256' in ADD and "'d1', 'export', PROD_NAME" in ADD, 'underlying backup is full, SHA-256 verified, and age-limited')
check('metadata_json TEXT' in AUTH and 'idx_notification_outbox_status_due' in AUTH and all(name in AUTH for name in ['idx_notification_outbox_kind_destination','idx_notification_outbox_order','idx_notification_outbox_payment','idx_notification_outbox_product']), 'Build 403 authority contains metadata, status-due, and all four reviewed indexes')

if failures:
    print(f'BUILD 431 NOTIFICATION EXECUTION SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 431 NOTIFICATION EXECUTION SAFETY REGRESSION: PASS ({checks}/{checks})')
print('Notification Production authorization token path: PRESENT / NOT EXERCISED')
print('Notification full-backup boundary: PASS')
print('Exact pre-write drift refusal: PASS')
print('notification_outbox row preservation: PASS')
print('idx_notification_outbox_status_due preservation: PASS')
print('Annotation/rebuild execution path: NONE')
print('Cloudflare access: NONE')
print('Production mutation executed: NO')
print('PRODUCTION PROMOTION: CLOSED')
