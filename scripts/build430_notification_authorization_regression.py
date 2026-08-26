#!/usr/bin/env python3
"""Build 430 local-only Notification Production authorization safety regression."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRE = (ROOT / 'scripts' / 'build430_notification_authorization_preflight.py').read_text(encoding='utf-8')
EXEC = (ROOT / 'scripts' / 'build428_production_additive_execution.py').read_text(encoding='utf-8')
AUTH = (ROOT / 'database_notification_runtime_parity.sql').read_text(encoding='utf-8')

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


check("PRODUCT_POSTCHECK = ROOT / 'build427_production_product_number_postcheck.local.json'" in PRE, 'Notification preflight requires Product-number prerequisite')
check("GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'" in PRE, 'Notification preflight requires completed Gift Card prerequisite')
check("PROD_NAME = 'devilndove-prod'" in PRE and "PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'" in PRE, 'Notification preflight hard-pins Production')
check("stream.reconfigure(encoding='utf-8', errors='replace')" in PRE, 'Notification preflight is Windows UTF-8 safe')
check('D1 mutation capability: NONE' in PRE and 'R2/provider mutation capability: NONE' in PRE, 'Notification preflight declares no mutation capability')
check('metadata_json' in PRE, 'Notification preflight checks metadata_json')
check(all(name in PRE for name in ['idx_notification_outbox_kind_destination','idx_notification_outbox_order','idx_notification_outbox_payment','idx_notification_outbox_product']), 'Notification preflight covers all four canonical indexes')
check('notification_outbox_rows' in PRE, 'Notification preflight captures outbox preservation row boundary')
check("'production_backup_created': False" in PRE and "'notification_authorization_received': False" in PRE, 'Notification preflight cannot infer backup or authorization')
check("'production_mutation_executed': False" in PRE and "'production_promotion_open': False" in PRE, 'Notification preflight cannot claim mutation or promotion')
check("'notification': 'AUTHORIZE-BUILD428-PROD-NOTIFICATION'" in EXEC, 'Notification executor requires exact separate authorization token')
check('def export_backup(stage: str)' in EXEC and "'d1', 'export', PROD_NAME" in EXEC and "'--remote'" in EXEC, 'Notification executor requires full remote Production backup')
check('hashlib.sha256' in EXEC and 'backup_sha256' in EXEC and 'MAX_BACKUP_AGE_SECONDS = 1800' in EXEC, 'Notification backup records SHA-256 and has 30-minute age limit')
check('verify_backup(stage)' in EXEC and 'current_state(stage)' in EXEC, 'Notification apply re-verifies backup and targeted before-state')
check("after['row_count'] == before['row_count']" in EXEC and 'stage_complete(stage, after)' in EXEC, 'Notification apply requires outbox-row preservation plus schema completion')
check('notification_sql(before)' in EXEC, 'Notification SQL is generated as a separate additive family')
check('membership' not in EXEC.lower() and 'fractional' not in EXEC.lower() and 'accounting' not in EXEC.lower(), 'Notification executor contains no rebuild-family path')
check('metadata_json TEXT' in AUTH, 'Build 403 authority contains metadata_json')
check(all(name in AUTH for name in ['idx_notification_outbox_kind_destination','idx_notification_outbox_order','idx_notification_outbox_payment','idx_notification_outbox_product']), 'Build 403 authority contains all four Notification indexes')
check('idx_notification_outbox_status_due' in AUTH and 'CREATE TABLE IF NOT EXISTS notification_outbox' in AUTH, 'Build 403 authority retains base outbox/status-due authority')

if failures:
    print(f'BUILD 430 NOTIFICATION AUTHORIZATION SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 430 NOTIFICATION AUTHORIZATION SAFETY REGRESSION: PASS ({checks}/{checks})')
print('Gift Card Production stage prerequisite: SOURCE-GATED')
print('Notification Production authorization inferred: NO')
print('Production backup created by regression: NO')
print('Production mutation executed: NO')
print('Annotation/rebuild authorization inferred: NO')
print('PRODUCTION PROMOTION: CLOSED')
