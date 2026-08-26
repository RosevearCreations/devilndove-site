#!/usr/bin/env python3
"""Build 433 guarded Build-197 annotation-index Production execution controller.

This controller is intentionally narrower than the generic additive executor.
It requires the already-proven Product-number, Gift Card, and full Build 403
Notification Production stages; reruns the read-only Build 432 annotation
preflight; creates a fresh full Production D1 backup; applies only the canonical
Build 197 composite index; preserves product_image_annotations row count; and
keeps Production promotion closed.

No Membership, fractional Inventory, Product/FK, Accounting/default,
R2/provider, CAIP-copy, or Production-promotion mutation path exists here.
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
PREFLIGHT_SCRIPT = ROOT / 'scripts' / 'build432_annotation_authorization_preflight.py'
PREFLIGHT_ARTIFACT = ROOT / 'build432_annotation_authorization_preflight.local.json'
GIFT_POSTCHECK = ROOT / 'build428_production_gift_postcheck.local.json'
NOTIFICATION_POSTCHECK = ROOT / 'build431_production_notification_postcheck.local.json'
EVIDENCE = ROOT / 'build433_production_annotation_postcheck.local.json'
AUTH_TOKEN = 'AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX'
ANNOTATION_INDEX = 'idx_product_image_annotations_product_image_build197'


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 433 PRODUCTION ANNOTATION: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def require_token(value: str | None) -> None:
    if value != AUTH_TOKEN:
        fail('explicit Build 197 annotation-index Production authorization token is missing or incorrect.')


def load_green(path: Path, label: str) -> dict:
    if not path.exists():
        fail(f'{label} artifact is missing.')
    payload = json.loads(path.read_text(encoding='utf-8'))
    if payload.get('pass') is not True:
        fail(f'{label} is not green.')
    return payload


def require_completed_prerequisites() -> None:
    additive.require_product_postcheck()
    gift = load_green(GIFT_POSTCHECK, 'Gift Card Production postcheck')
    if gift.get('stage') != 'gift' or gift.get('row_count_preserved') is not True:
        fail('Gift Card Production prerequisite is incomplete or lacks row-preservation proof.')
    notification = load_green(NOTIFICATION_POSTCHECK, 'Full Build 403 Notification Production postcheck')
    if notification.get('stage') != 'notification' or notification.get('scope') != 'full_build403_notification_outbox_additive':
        fail('Full Build 403 Notification Production prerequisite is not the corrected completed scope.')
    if notification.get('row_count_preserved') is not True or notification.get('all_five_indexes_present') is not True:
        fail('Full Build 403 Notification Production prerequisite lacks row/index proof.')


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
        fail(f'fresh Build 432 annotation preflight failed with exit code {result.returncode}.')
    if not PREFLIGHT_ARTIFACT.exists():
        fail('fresh annotation preflight artifact was not created.')
    payload = json.loads(PREFLIGHT_ARTIFACT.read_text(encoding='utf-8'))
    if payload.get('safe_to_request_annotation_authorization') is not True:
        fail('fresh annotation preflight is not safe for the authorized stage.')
    if payload.get('required_columns_present') is not True or payload.get('annotation_index_exists') is not False:
        fail('fresh annotation preflight no longer matches the exact Build 197 index gap.')
    return payload


def exact_before_state(preflight: dict, state: dict) -> bool:
    indexes = set(state.get('indexes') or [])
    return (
        preflight.get('required_columns_present') is True
        and preflight.get('annotation_index_exists') is False
        and ANNOTATION_INDEX not in indexes
        and int(state.get('row_count') or 0) == int(preflight.get('product_image_annotations_rows') or 0)
    )


def print_before(preflight: dict, state: dict) -> None:
    indexes = set(state.get('indexes') or [])
    print('=== BUILD 433 BUILD 197 ANNOTATION PRE-WRITE STATE ===')
    print(f'Required columns present: {preflight.get("required_columns_present") is True}')
    print(f'Annotation index exists: {ANNOTATION_INDEX in indexes}')
    print(f'product_image_annotations rows: {state.get("row_count")}')
    print(f'Exact Build 197 index gap: {"YES" if exact_before_state(preflight, state) else "NO"}')


def backup(confirm: str | None) -> None:
    require_token(confirm)
    require_completed_prerequisites()
    additive.hard_target_guard()
    preflight = fresh_preflight()
    before = additive.current_state('annotation')
    print_before(preflight, before)
    if not exact_before_state(preflight, before):
        fail('annotation state drifted from the exact Build 197 index gap before backup.')
    additive.export_backup('annotation')
    after_backup_preflight = fresh_preflight()
    after_backup = additive.current_state('annotation')
    if not exact_before_state(after_backup_preflight, after_backup):
        fail('annotation state changed during the backup-only stage.')
    if int(after_backup.get('row_count') or 0) != int(before.get('row_count') or 0):
        fail('product_image_annotations row count changed during the backup-only stage.')
    print('BUILD 433 BUILD 197 ANNOTATION BACKUP BOUNDARY: PASS')
    print(f'product_image_annotations rows preserved across backup: {before.get("row_count")} -> {after_backup.get("row_count")}')
    print('Production mutation executed: NO')
    print('PRODUCTION PROMOTION: CLOSED')


def apply(confirm: str | None) -> None:
    require_token(confirm)
    require_completed_prerequisites()
    additive.hard_target_guard()
    additive.verify_backup('annotation')
    preflight = fresh_preflight()
    before = additive.current_state('annotation')
    print_before(preflight, before)
    if not exact_before_state(preflight, before):
        fail('annotation state drifted from the exact Build 197 index gap after backup; refusing DDL.')

    additive.execute_sql('annotation', additive.annotation_sql())
    after = additive.current_state('annotation')
    rows_preserved = int(after.get('row_count') or 0) == int(before.get('row_count') or 0)
    index_present = ANNOTATION_INDEX in set(after.get('indexes') or [])
    passed = rows_preserved and index_present
    payload = {
        'artifact': 'Build 433 Production Build 197 annotation-index apply/postcheck evidence',
        'stage': 'annotation',
        'scope': 'build197_product_image_annotations_composite_index',
        'pass': passed,
        'before': before,
        'after': after,
        'row_count_preserved': rows_preserved,
        'annotation_index_present': index_present,
        'production_mutation_executed': True,
        'production_promotion_open': False,
    }
    EVIDENCE.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('BUILD 433 PRODUCTION BUILD 197 ANNOTATION POSTCHECK:', 'PASS' if passed else 'FAIL')
    print(f'product_image_annotations rows preserved: {before.get("row_count")} -> {after.get("row_count")}')
    print(f'Build 197 annotation index present: {index_present}')
    print('PRODUCTION PROMOTION: CLOSED')
    if not passed:
        raise SystemExit(1)


def postcheck() -> None:
    require_completed_prerequisites()
    additive.hard_target_guard()
    state = additive.current_state('annotation')
    index_present = ANNOTATION_INDEX in set(state.get('indexes') or [])
    print('BUILD 433 PRODUCTION BUILD 197 ANNOTATION READ-ONLY POSTCHECK:', 'PASS' if index_present else 'FAIL')
    print(f'product_image_annotations rows: {state.get("row_count")}')
    print(f'Build 197 annotation index present: {index_present}')
    print('PRODUCTION PROMOTION: CLOSED')
    raise SystemExit(0 if index_present else 1)


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
