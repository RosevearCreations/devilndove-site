#!/usr/bin/env python3
"""Build 431 guarded Notification-only Production execution controller.

This controller wraps the already-proven Build 428 additive primitives but adds
Notification-specific fail-closed checks promised by the Build 430 boundary:
- exact Build 403 pre-write gap only;
- idx_notification_outbox_status_due must already exist and survive;
- notification_outbox row count must be preserved;
- separate full Production D1 backup with byte/SHA/age verification;
- exact Notification authorization token only.

No Gift Card, annotation-index, Membership, fractional Inventory, Product/FK,
Accounting/default, R2/provider, or promotion mutation path exists here.
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
PREFLIGHT_SCRIPT = ROOT / 'scripts' / 'build430_notification_authorization_preflight.py'
PREFLIGHT_ARTIFACT = ROOT / 'build430_notification_authorization_preflight.local.json'
EVIDENCE = ROOT / 'build431_production_notification_postcheck.local.json'
AUTH_TOKEN = 'AUTHORIZE-BUILD428-PROD-NOTIFICATION'
STATUS_DUE_INDEX = 'idx_notification_outbox_status_due'
EXPECTED_MISSING_INDEXES = {
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
        fail('explicit Notification Production authorization token is missing or incorrect.')


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
        fail(f'fresh Build 430 Notification preflight failed with exit code {result.returncode}.')
    if not PREFLIGHT_ARTIFACT.exists():
        fail('fresh Notification preflight artifact was not created.')
    payload = json.loads(PREFLIGHT_ARTIFACT.read_text(encoding='utf-8'))
    if payload.get('safe_to_request_notification_authorization') is not True:
        fail('fresh Notification preflight is not safe for the authorized stage.')
    return payload


def exact_before_state(state: dict) -> bool:
    columns = set(state.get('columns') or [])
    indexes = set(state.get('indexes') or [])
    missing = EXPECTED_MISSING_INDEXES - indexes
    return (
        'metadata_json' not in columns
        and missing == EXPECTED_MISSING_INDEXES
        and STATUS_DUE_INDEX in indexes
    )


def complete_after_state(state: dict) -> bool:
    columns = set(state.get('columns') or [])
    indexes = set(state.get('indexes') or [])
    return (
        'metadata_json' in columns
        and EXPECTED_MISSING_INDEXES.issubset(indexes)
        and STATUS_DUE_INDEX in indexes
    )


def print_before(state: dict) -> None:
    indexes = set(state.get('indexes') or [])
    print('=== BUILD 431 NOTIFICATION IMMEDIATE PRE-WRITE STATE ===')
    print(f'metadata_json exists: {"metadata_json" in set(state.get("columns") or [])}')
    print(f'Missing reviewed indexes: {sorted(EXPECTED_MISSING_INDEXES - indexes)}')
    print(f'idx_notification_outbox_status_due intact: {STATUS_DUE_INDEX in indexes}')
    print(f'notification_outbox rows: {state.get("row_count")}')
    print(f'Exact reviewed Build 403 gap: {"YES" if exact_before_state(state) else "NO"}')


def backup(confirm: str | None) -> None:
    require_token(confirm)
    fresh_preflight()
    before = additive.current_state('notification')
    print_before(before)
    if not exact_before_state(before):
        fail('Notification state drifted from the exact reviewed Build 403 gap before backup.')
    additive.export_backup('notification')
    after_backup = additive.current_state('notification')
    if after_backup != before:
        fail('Notification state changed during the backup-only stage.')
    print('BUILD 431 NOTIFICATION BACKUP BOUNDARY: PASS')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')


def apply(confirm: str | None) -> None:
    require_token(confirm)
    additive.require_product_postcheck()
    additive.hard_target_guard()
    additive.verify_backup('notification')
    before = additive.current_state('notification')
    print_before(before)
    if not exact_before_state(before):
        fail('Notification state drifted from the exact reviewed Build 403 gap after backup; refusing DDL.')

    sql = additive.notification_sql(before)
    additive.execute_sql('notification', sql)
    after = additive.current_state('notification')

    rows_preserved = int(after.get('row_count') or 0) == int(before.get('row_count') or 0)
    schema_complete = complete_after_state(after)
    passed = rows_preserved and schema_complete
    payload = {
        'artifact': 'Build 431 Production Notification apply/postcheck evidence',
        'stage': 'notification',
        'pass': passed,
        'before': before,
        'after': after,
        'row_count_preserved': rows_preserved,
        'status_due_index_preserved': STATUS_DUE_INDEX in set(after.get('indexes') or []),
        'production_mutation_executed': True,
        'production_promotion_open': False,
    }
    EVIDENCE.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('BUILD 431 PRODUCTION NOTIFICATION ADDITIVE POSTCHECK:', 'PASS' if passed else 'FAIL')
    print(f'notification_outbox rows preserved: {before.get("row_count")} -> {after.get("row_count")}')
    print(f'metadata_json present: {"metadata_json" in set(after.get("columns") or [])}')
    print(f'Four reviewed indexes present: {EXPECTED_MISSING_INDEXES.issubset(set(after.get("indexes") or []))}')
    print(f'idx_notification_outbox_status_due preserved: {STATUS_DUE_INDEX in set(after.get("indexes") or [])}')
    print('PRODUCTION PROMOTION: CLOSED')
    if not passed:
        raise SystemExit(1)


def postcheck() -> None:
    additive.require_product_postcheck()
    additive.hard_target_guard()
    state = additive.current_state('notification')
    passed = complete_after_state(state)
    print('BUILD 431 PRODUCTION NOTIFICATION READ-ONLY POSTCHECK:', 'PASS' if passed else 'FAIL')
    print(f'notification_outbox rows: {state.get("row_count")}')
    print(f'metadata_json present: {"metadata_json" in set(state.get("columns") or [])}')
    print(f'Four reviewed indexes present: {EXPECTED_MISSING_INDEXES.issubset(set(state.get("indexes") or []))}')
    print(f'idx_notification_outbox_status_due preserved: {STATUS_DUE_INDEX in set(state.get("indexes") or [])}')
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
