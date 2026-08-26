#!/usr/bin/env python3
"""Build 431 guarded full-Build-403 Notification Production execution controller.

The first authorized Notification attempt stopped before backup because live
Production proved idx_notification_outbox_status_due was also absent. The prior
four-index authorization is therefore not accepted by this controller.

This corrected controller requires:
- Product-number and Gift Card Production prerequisites remain green;
- corrected full Build 403 preflight is green;
- metadata_json is missing immediately before backup/apply;
- all five canonical notification_outbox indexes are missing immediately before
  backup/apply;
- a new explicit full-Build-403 Notification authorization token;
- a separate full Production D1 backup with byte/SHA/age verification;
- notification_outbox row-count preservation;
- metadata_json and all five canonical indexes present after execution.

No Gift Card mutation, annotation-index, Membership, fractional Inventory,
Product/FK, Accounting/default, R2/provider, or promotion mutation path exists.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

import build428_production_additive_execution as additive

ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT_SCRIPT = ROOT / 'scripts' / 'build431_notification_full_authorization_preflight.py'
PREFLIGHT_ARTIFACT = ROOT / 'build431_notification_full_authorization_preflight.local.json'
GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'
EVIDENCE = ROOT / 'build431_production_notification_postcheck.local.json'
AUTH_TOKEN = 'AUTHORIZE-BUILD431-PROD-NOTIFICATION-FULL-BUILD403'
CANONICAL_INDEXES = {
    'idx_notification_outbox_status_due',
    'idx_notification_outbox_kind_destination',
    'idx_notification_outbox_order',
    'idx_notification_outbox_payment',
    'idx_notification_outbox_product',
}


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 431 PRODUCTION NOTIFICATION: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def require_token(value: str | None) -> None:
    if value != AUTH_TOKEN:
        fail('explicit full-Build-403 Notification Production authorization token is missing or incorrect.')


def require_gift_postcheck() -> dict:
    if not GIFT_POSTCHECK.exists():
        fail('Gift Card Production postcheck artifact is missing.')
    payload = json.loads(GIFT_POSTCHECK.read_text(encoding='utf-8'))
    if payload.get('pass') is not True or payload.get('stage') != 'gift':
        fail('Gift Card Production prerequisite is not green.')
    if payload.get('row_count_preserved') is not True:
        fail('Gift Card Production prerequisite does not prove row preservation.')
    return payload


def fresh_preflight() -> dict:
    result = subprocess.run(
        [sys.executable, '-u', str(PREFLIGHT_SCRIPT), '--run'],
        cwd=ROOT,
        text=True,
        encoding='utf-8',
        errors='replace',
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**os.environ, 'NO_COLOR': '1', 'FORCE_COLOR': '0', 'PYTHONIOENCODING': 'utf-8'},
        check=False,
    )
    print(result.stdout or '', end='' if (result.stdout or '').endswith('\n') else '\n')
    if result.returncode != 0:
        fail(f'fresh corrected Notification preflight failed with exit code {result.returncode}.')
    if not PREFLIGHT_ARTIFACT.exists():
        fail('fresh corrected Notification preflight artifact was not created.')
    payload = json.loads(PREFLIGHT_ARTIFACT.read_text(encoding='utf-8'))
    if payload.get('safe_to_request_full_notification_authorization') is not True:
        fail('fresh corrected Notification preflight is not safe for the full Build 403 stage.')
    return payload


def exact_before_state(state: dict) -> bool:
    columns = set(state.get('columns') or [])
    indexes = set(state.get('indexes') or [])
    return 'metadata_json' not in columns and (CANONICAL_INDEXES - indexes) == CANONICAL_INDEXES


def complete_after_state(state: dict) -> bool:
    columns = set(state.get('columns') or [])
    indexes = set(state.get('indexes') or [])
    return 'metadata_json' in columns and CANONICAL_INDEXES.issubset(indexes)


def print_before(state: dict) -> None:
    indexes = set(state.get('indexes') or [])
    print('=== BUILD 431 FULL BUILD 403 NOTIFICATION PRE-WRITE STATE ===')
    print(f'metadata_json exists: {"metadata_json" in set(state.get("columns") or [])}')
    print(f'Missing canonical indexes: {sorted(CANONICAL_INDEXES - indexes)}')
    print(f'notification_outbox rows: {state.get("row_count")}')
    print(f'Exact full Build 403 gap: {"YES" if exact_before_state(state) else "NO"}')


def notification_sql_full(before: dict) -> str:
    columns = set(before.get('columns') or [])
    indexes = set(before.get('indexes') or [])
    lines = ['PRAGMA foreign_keys = ON;']
    if 'metadata_json' not in columns:
        lines.append('ALTER TABLE notification_outbox ADD COLUMN metadata_json TEXT;')
    definitions = {
        'idx_notification_outbox_status_due': 'CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_due ON notification_outbox(status, next_attempt_at, created_at);',
        'idx_notification_outbox_kind_destination': 'CREATE INDEX IF NOT EXISTS idx_notification_outbox_kind_destination ON notification_outbox(notification_kind, destination, created_at DESC);',
        'idx_notification_outbox_order': 'CREATE INDEX IF NOT EXISTS idx_notification_outbox_order ON notification_outbox(related_order_id, created_at DESC);',
        'idx_notification_outbox_payment': 'CREATE INDEX IF NOT EXISTS idx_notification_outbox_payment ON notification_outbox(related_payment_id, created_at DESC);',
        'idx_notification_outbox_product': 'CREATE INDEX IF NOT EXISTS idx_notification_outbox_product ON notification_outbox(related_product_id, created_at DESC);',
    }
    for name in sorted(CANONICAL_INDEXES):
        if name not in indexes:
            lines.append(definitions[name])
    return '\n'.join(lines) + '\n'


def backup(confirm: str | None) -> None:
    require_token(confirm)
    additive.require_product_postcheck()
    require_gift_postcheck()
    fresh_preflight()
    before = additive.current_state('notification')
    print_before(before)
    if not exact_before_state(before):
        fail('Notification state drifted from the corrected full Build 403 gap before backup.')
    additive.export_backup('notification')
    after_backup = additive.current_state('notification')
    if after_backup != before:
        fail('Notification state changed during the backup-only stage.')
    print('BUILD 431 FULL BUILD 403 NOTIFICATION BACKUP BOUNDARY: PASS')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')


def apply(confirm: str | None) -> None:
    require_token(confirm)
    additive.require_product_postcheck()
    require_gift_postcheck()
    additive.hard_target_guard()
    additive.verify_backup('notification')
    before = additive.current_state('notification')
    print_before(before)
    if not exact_before_state(before):
        fail('Notification state drifted from the corrected full Build 403 gap after backup; refusing DDL.')

    sql = notification_sql_full(before)
    additive.execute_sql('notification', sql)
    after = additive.current_state('notification')

    rows_preserved = int(after.get('row_count') or 0) == int(before.get('row_count') or 0)
    schema_complete = complete_after_state(after)
    passed = rows_preserved and schema_complete
    payload = {
        'artifact': 'Build 431 Production full Build 403 Notification apply/postcheck evidence',
        'stage': 'notification',
        'scope': 'full_build403_notification_outbox_additive',
        'pass': passed,
        'before': before,
        'after': after,
        'row_count_preserved': rows_preserved,
        'all_five_indexes_present': CANONICAL_INDEXES.issubset(set(after.get('indexes') or [])),
        'production_mutation_executed': True,
        'production_promotion_open': False,
    }
    EVIDENCE.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('BUILD 431 PRODUCTION FULL BUILD 403 NOTIFICATION POSTCHECK:', 'PASS' if passed else 'FAIL')
    print(f'notification_outbox rows preserved: {before.get("row_count")} -> {after.get("row_count")}')
    print(f'metadata_json present: {"metadata_json" in set(after.get("columns") or [])}')
    print(f'All five canonical indexes present: {CANONICAL_INDEXES.issubset(set(after.get("indexes") or []))}')
    print('PRODUCTION PROMOTION: CLOSED')
    if not passed:
        raise SystemExit(1)


def postcheck() -> None:
    additive.require_product_postcheck()
    require_gift_postcheck()
    additive.hard_target_guard()
    state = additive.current_state('notification')
    passed = complete_after_state(state)
    print('BUILD 431 PRODUCTION FULL BUILD 403 NOTIFICATION READ-ONLY POSTCHECK:', 'PASS' if passed else 'FAIL')
    print(f'notification_outbox rows: {state.get("row_count")}')
    print(f'metadata_json present: {"metadata_json" in set(state.get("columns") or [])}')
    print(f'All five canonical indexes present: {CANONICAL_INDEXES.issubset(set(state.get("indexes") or []))}')
    print('PRODUCTION PROMOTION: CLOSED')
    raise SystemExit(0 if passed else 1)


def main() -> None:
    configure_console()
    parser = argparse.ArgumentParser()
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--backup', action='store_true')
    action.add_argument('--apply', action='store_true')
    action.add_argument('--postcheck', action='store_true')
    parser.add_argument('--confirm')
    args = parser.parse_args()

    if args.postcheck:
        postcheck()
        return
    if args.backup:
        backup(args.confirm)
        return
    apply(args.confirm)


if __name__ == '__main__':
    main()
