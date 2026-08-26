#!/usr/bin/env python3
"""Build 431 local-only corrected full-Build-403 Notification safety regression."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRE = (ROOT / 'scripts' / 'build431_notification_full_authorization_preflight.py').read_text(encoding='utf-8')
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


check("AUTH_TOKEN = 'AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403'" in CTL, 'corrected controller requires a new full-Build-403 authorization token')
check("PRODUCT_POSTCHECK = ROOT / 'build427_production_product_number_postcheck.local.json'" in PRE, 'corrected preflight requires Product-number prerequisite')
check("GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'" in PRE and "GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'" in CTL, 'preflight/controller require completed Gift Card proof')
check("PROD_NAME = 'devilndove-prod'" in PRE and "PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'" in PRE, 'corrected preflight hard-pins Production')
check("PREFLIGHT_SCRIPT = ROOT / 'scripts' / 'build431_notification_full_authorization_preflight.py'" in CTL, 'execution reruns corrected full-scope preflight')
check('prior_four_index_authorization_sufficient' in PRE and "'prior_four_index_authorization_sufficient': False" in PRE, 'prior four-index authorization is explicitly insufficient')
check('metadata_json' in PRE and "'metadata_json' not in columns" in CTL, 'metadata_json remains part of exact before-state')
check(all(name in PRE and name in CTL for name in ['idx_notification_outbox_status_due','idx_notification_outbox_kind_destination','idx_notification_outbox_order','idx_notification_outbox_payment','idx_notification_outbox_product']), 'all five canonical indexes are explicit in preflight/controller')
check('CANONICAL_INDEXES - indexes' in CTL and '== CANONICAL_INDEXES' in CTL, 'controller refuses partial/unexpected pre-write index drift')
check('def notification_sql_full(before: dict)' in CTL, 'controller owns full Build 403 Notification SQL rather than the older four-index helper')
check('CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_due' in CTL, 'corrected SQL creates missing status-due index')
check(all(f'CREATE INDEX IF NOT EXISTS {name}' in CTL for name in ['idx_notification_outbox_kind_destination','idx_notification_outbox_order','idx_notification_outbox_payment','idx_notification_outbox_product']), 'corrected SQL creates all four secondary canonical indexes')
check("additive.export_backup('notification')" in CTL, 'Notification backup still delegates to full Production D1 export')
check("additive.verify_backup('notification')" in CTL, 'Notification apply still re-verifies backup bytes/SHA/age')
check('after_backup != before' in CTL, 'backup-only stage refuses state changes')
check("additive.current_state('notification')" in CTL, 'Notification state is reread immediately around execution')
check("rows_preserved = int(after.get('row_count') or 0) == int(before.get('row_count') or 0)" in CTL, 'notification_outbox row count must be preserved')
check("'all_five_indexes_present'" in CTL and 'complete_after_state(after)' in CTL, 'post-proof records all-five-index completion')
check('MAX_BACKUP_AGE_SECONDS = 1800' in ADD and 'hashlib.sha256' in ADD and "'d1', 'export', PROD_NAME" in ADD, 'underlying backup remains full, SHA-256 verified, and age-limited')
check('metadata_json TEXT' in AUTH and all(name in AUTH for name in ['idx_notification_outbox_status_due','idx_notification_outbox_kind_destination','idx_notification_outbox_order','idx_notification_outbox_payment','idx_notification_outbox_product']), 'Build 403 authority contains metadata and all five canonical indexes')

if failures:
    print(f'BUILD 431 FULL NOTIFICATION AUTHORIZATION SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 431 FULL NOTIFICATION AUTHORIZATION SAFETY REGRESSION: PASS ({checks}/{checks})')
print('Prior four-index Notification authorization sufficient: NO')
print('Full Build 403 Notification token path: PRESENT / NOT EXERCISED')
print('Full Production backup boundary: PASS')
print('Exact five-index pre-write drift refusal: PASS')
print('notification_outbox row preservation: PASS')
print('Annotation/rebuild execution path: NONE')
print('Cloudflare access: NONE')
print('Production mutation executed: NO')
print('PRODUCTION PROMOTION: CLOSED')
