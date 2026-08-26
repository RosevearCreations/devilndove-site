#!/usr/bin/env python3
"""Build 429 local-only Gift Card Production authorization safety regression."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRE = (ROOT / 'scripts' / 'build429_gift_card_authorization_preflight.py').read_text(encoding='utf-8')
EXEC = (ROOT / 'scripts' / 'build428_production_additive_execution.py').read_text(encoding='utf-8')
AUTH = (ROOT / 'database_gift_card_runtime_parity.sql').read_text(encoding='utf-8')

checks = 0
failures: list[str] = []


def check(condition: bool, label: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(label)


check("PRODUCT_POSTCHECK = ROOT / 'build427_production_product_number_postcheck.local.json'" in PRE, 'Gift Card preflight requires green Product-number prerequisite')
check("PROD_NAME = 'devilndove-prod'" in PRE and "PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'" in PRE, 'Gift Card preflight hard-pins Production name and UUID')
check("stream.reconfigure(encoding='utf-8', errors='replace')" in PRE, 'Gift Card preflight is Windows UTF-8 safe')
check('D1 mutation capability: NONE' in PRE and 'R2/provider mutation capability: NONE' in PRE, 'Gift Card preflight declares no mutation capability')
check(all(name in PRE for name in ['lookup_email','code_suffix','ip_hash','user_agent','result_status']), 'Gift Card preflight covers all five canonical lookup columns')
check(all(name in PRE for name in ['idx_gift_card_lookup_attempts_created','idx_gift_card_lookup_attempts_email','idx_gift_card_lookup_lockouts_status']), 'Gift Card preflight covers all three canonical indexes')
check('gift_card_lookup_lockouts' in PRE, 'Gift Card preflight checks lockout-table existence')
check('gift_card_lookup_attempt_rows' in PRE and 'gift_cards_rows' in PRE and 'gift_card_redemptions_rows' in PRE, 'Gift Card preflight captures preservation row boundaries')
check("'production_backup_created': False" in PRE and "'gift_card_authorization_received': False" in PRE, 'Gift Card preflight cannot infer backup or authorization')
check("'production_mutation_executed': False" in PRE and "'production_promotion_open': False" in PRE, 'Gift Card preflight cannot claim mutation or promotion')
check("'gift': 'AUTHORIZE-BUILD428-PROD-GIFT-CARD'" in EXEC, 'Gift Card executor requires exact separate authorization token')
check(
    'def export_backup(stage: str)' in EXEC
    and "'d1', 'export', PROD_NAME" in EXEC
    and "'--remote'" in EXEC
    and "'--skip-confirmation'" in EXEC,
    'Gift Card executor requires a full remote Production D1 export',
)
check('hashlib.sha256' in EXEC and 'backup_sha256' in EXEC and 'MAX_BACKUP_AGE_SECONDS = 1800' in EXEC, 'Gift Card backup records SHA-256 and has a 30-minute age limit')
check('verify_backup(stage)' in EXEC and 'current_state(stage)' in EXEC, 'Gift Card apply re-verifies backup and targeted before-state')
check(
    'stage_complete(stage, after)' in EXEC
    and 'gift_rows_preserved(before, after)' in EXEC
    and all(key in EXEC for key in ['lookup_attempt_rows','gift_cards_rows','gift_card_redemptions_rows']),
    'Gift Card apply requires schema completion plus all three Gift Card row-preservation boundaries',
)
check('gift_sql(before)' in EXEC and 'notification_sql(before)' in EXEC and 'annotation_sql()' in EXEC, 'additive families remain separately generated rather than broad candidate execution')
check('membership' not in EXEC.lower() and 'fractional' not in EXEC.lower() and 'accounting' not in EXEC.lower(), 'Gift Card/additive executor contains no rebuild-family path')
check(all(column in AUTH for column in ['lookup_email','code_suffix','ip_hash','user_agent','result_status']), 'Build 384 authority contains all five lookup columns')
check(all(name in AUTH for name in ['idx_gift_card_lookup_attempts_created','idx_gift_card_lookup_attempts_email','idx_gift_card_lookup_lockouts_status']), 'Build 384 authority contains all three Gift Card indexes')
check('CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts' in AUTH and 'FOREIGN KEY (locked_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL' in AUTH, 'Build 384 authority contains the canonical lockout table and FK')

if failures:
    print(f'BUILD 429 GIFT CARD AUTHORIZATION SAFETY REGRESSION: FAIL ({len(failures)}/{checks} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 429 GIFT CARD AUTHORIZATION SAFETY REGRESSION: PASS ({checks}/{checks})')
print('Gift Card Production authorization inferred: NO')
print('Production backup created by regression: NO')
print('Production mutation executed: NO')
print('Notification/annotation/rebuild authorization inferred: NO')
print('PRODUCTION PROMOTION: CLOSED')
