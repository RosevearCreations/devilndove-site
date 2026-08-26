#!/usr/bin/env python3
"""Build 427 guarded additive Production parity stages.

Stages are deliberately independent:
- Gift Card Build 384 additive alignment
- Notification Build 403 additive alignment
- Product image annotation Build 197 index

Each mutation stage requires the Build 427 Product-number Production postcheck to
be green and an explicit stage-specific authorization token. Rebuild families are
not handled here.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
POSTCHECK = ROOT / 'build427_production_product_number_postcheck.local.json'
OUT = ROOT / 'build427_production_additive_postcheck.local.json'
WRANGLER_VERSION = '4.126.0'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
TOKENS = {
    'gift': 'AUTHORIZE-BUILD427-PROD-GIFT-CARD',
    'notification': 'AUTHORIZE-BUILD427-PROD-NOTIFICATION',
    'annotation': 'AUTHORIZE-BUILD427-PROD-ANNOTATION-INDEX',
}
GIFT_COLUMNS = ['lookup_email', 'code_suffix', 'ip_hash', 'user_agent', 'result_status']
GIFT_INDEXES = ['idx_gift_card_lookup_attempts_created', 'idx_gift_card_lookup_attempts_email', 'idx_gift_card_lookup_lockouts_status']
NOTIFICATION_INDEXES = [
    'idx_notification_outbox_kind_destination',
    'idx_notification_outbox_order',
    'idx_notification_outbox_payment',
    'idx_notification_outbox_product',
]
ANNOTATION_INDEX = 'idx_product_image_annotations_product_image_build197'


def fail(message: str) -> None:
    print(f'BUILD 427 PRODUCTION ADDITIVE: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def require_product_postcheck() -> None:
    if not POSTCHECK.exists():
        fail('Product-number Production postcheck artifact is missing.')
    payload = json.loads(POSTCHECK.read_text(encoding='utf-8'))
    if payload.get('pass') is not True:
        fail('Product-number Production postcheck is not green.')


def require_token(stage: str, supplied: str | None) -> None:
    if supplied != TOKENS[stage]:
        fail(f'explicit {stage} Production authorization token is missing or incorrect.')


def run_capture(args: list[str], label: str) -> None:
    result = subprocess.run(
        args, cwd=ROOT, text=True, encoding='utf-8', errors='replace',
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        env={**os.environ, 'NO_COLOR':'1', 'FORCE_COLOR':'0', 'PYTHONIOENCODING':'utf-8'},
        check=False,
    )
    print(result.stdout or '', end='' if (result.stdout or '').endswith('\n') else '\n')
    if result.returncode != 0:
        fail(f'{label} failed with exit code {result.returncode}.')


def prod_config(temp: Path) -> Path:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match Build 427 hard guard.')
    path = temp / 'prod.toml'
    path.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
    return path


def execute_sql(sql: str, label: str) -> None:
    npx = base.npx_path()
    with tempfile.TemporaryDirectory(prefix='dd-build427-additive-') as temp_dir:
        temp = Path(temp_dir)
        cfg = prod_config(temp)
        sql_path = temp / 'stage.sql'
        sql_path.write_text(sql, encoding='utf-8')
        run_capture([
            npx, '--yes', f'wrangler@{WRANGLER_VERSION}', 'd1', 'execute', 'DB',
            '--remote', '--config', str(cfg), '--yes', '--file', str(sql_path),
        ], label)


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 427 {label}')


def current_state() -> dict:
    npx = base.npx_path()
    with tempfile.TemporaryDirectory(prefix='dd-build427-additive-check-') as temp_dir:
        temp = Path(temp_dir)
        cfg = prod_config(temp)
        gift_cols = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM pragma_table_info('gift_card_lookup_attempts') ORDER BY cid;", 'GIFT CARD COLUMNS')}
        gift_lockout = bool(q(npx, cfg, "SELECT name FROM sqlite_schema WHERE type='table' AND name='gift_card_lookup_lockouts';", 'GIFT LOCKOUT TABLE'))
        gift_indexes = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name IN ('gift_card_lookup_attempts','gift_card_lookup_lockouts') AND sql IS NOT NULL;", 'GIFT INDEXES')}
        gift_rows = int(q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM gift_card_lookup_attempts;', 'GIFT ROW COUNT')[0].get('row_count') or 0)

        notification_cols = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM pragma_table_info('notification_outbox') ORDER BY cid;", 'NOTIFICATION COLUMNS')}
        notification_indexes = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name='notification_outbox' AND sql IS NOT NULL;", 'NOTIFICATION INDEXES')}
        notification_rows = int(q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM notification_outbox;', 'NOTIFICATION ROW COUNT')[0].get('row_count') or 0)

        annotation_indexes = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name='product_image_annotations' AND sql IS NOT NULL;", 'ANNOTATION INDEXES')}
        annotation_rows = int(q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM product_image_annotations;', 'ANNOTATION ROW COUNT')[0].get('row_count') or 0)

    return {
        'gift_columns': sorted(gift_cols),
        'gift_lockout_exists': gift_lockout,
        'gift_indexes': sorted(gift_indexes),
        'gift_rows': gift_rows,
        'notification_columns': sorted(notification_cols),
        'notification_indexes': sorted(notification_indexes),
        'notification_rows': notification_rows,
        'annotation_indexes': sorted(annotation_indexes),
        'annotation_rows': annotation_rows,
    }


def gift_sql(state: dict) -> str:
    lines = ['PRAGMA foreign_keys = ON;']
    for column in GIFT_COLUMNS:
        if column not in state['gift_columns']:
            lines.append(f'ALTER TABLE gift_card_lookup_attempts ADD COLUMN {column} TEXT;')
    lines.extend([
        'CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_created ON gift_card_lookup_attempts(created_at DESC);',
        'CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_email ON gift_card_lookup_attempts(lookup_email, created_at DESC);',
    ])
    if not state['gift_lockout_exists']:
        lines.extend([
            'CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts (',
            ' gift_card_lookup_lockout_id INTEGER PRIMARY KEY AUTOINCREMENT,',
            ' lookup_email TEXT, code_suffix TEXT, ip_hash TEXT,',
            " lockout_status TEXT NOT NULL DEFAULT 'active',",
            ' lockout_reason TEXT, locked_by_user_id INTEGER,',
            ' locked_at TEXT DEFAULT CURRENT_TIMESTAMP, expires_at TEXT, released_at TEXT, notes TEXT,',
            ' FOREIGN KEY (locked_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL',
            ');',
        ])
    lines.append('CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_lockouts_status ON gift_card_lookup_lockouts(lockout_status, locked_at DESC);')
    return '\n'.join(lines) + '\n'


def notification_sql(state: dict) -> str:
    lines = ['PRAGMA foreign_keys = ON;']
    if 'metadata_json' not in state['notification_columns']:
        lines.append('ALTER TABLE notification_outbox ADD COLUMN metadata_json TEXT;')
    lines.extend([
        'CREATE INDEX IF NOT EXISTS idx_notification_outbox_kind_destination ON notification_outbox(notification_kind, destination, created_at DESC);',
        'CREATE INDEX IF NOT EXISTS idx_notification_outbox_order ON notification_outbox(related_order_id, created_at DESC);',
        'CREATE INDEX IF NOT EXISTS idx_notification_outbox_payment ON notification_outbox(related_payment_id, created_at DESC);',
        'CREATE INDEX IF NOT EXISTS idx_notification_outbox_product ON notification_outbox(related_product_id, created_at DESC);',
    ])
    return '\n'.join(lines) + '\n'


def annotation_sql() -> str:
    return 'CREATE INDEX IF NOT EXISTS idx_product_image_annotations_product_image_build197 ON product_image_annotations(product_id, product_image_id);\n'


def apply(stage: str, confirm: str | None) -> None:
    require_product_postcheck()
    require_token(stage, confirm)
    before = current_state()
    if stage == 'gift':
        execute_sql(gift_sql(before), 'Production Gift Card additive alignment')
    elif stage == 'notification':
        execute_sql(notification_sql(before), 'Production Notification additive alignment')
    elif stage == 'annotation':
        execute_sql(annotation_sql(), 'Production Product-image annotation index')
    after = current_state()
    payload = {
        'artifact': f'Build 427 Production {stage} additive postcheck',
        'stage': stage,
        'before': before,
        'after': after,
        'production_mutation_executed': True,
        'production_promotion_open': False,
    }
    OUT.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print(f'BUILD 427 PRODUCTION {stage.upper()} ADDITIVE STAGE: COMPLETE')
    print('PRODUCTION PROMOTION: CLOSED')


def check() -> None:
    require_product_postcheck()
    state = current_state()
    gift_ok = set(GIFT_COLUMNS).issubset(state['gift_columns']) and state['gift_lockout_exists'] and set(GIFT_INDEXES).issubset(state['gift_indexes'])
    notification_ok = 'metadata_json' in state['notification_columns'] and set(NOTIFICATION_INDEXES).issubset(state['notification_indexes'])
    annotation_ok = ANNOTATION_INDEX in state['annotation_indexes']
    payload = {
        'artifact': 'Build 427 Production additive aggregate postcheck',
        'gift_card_pass': gift_ok,
        'notification_pass': notification_ok,
        'annotation_pass': annotation_ok,
        'state': state,
        'production_promotion_open': False,
    }
    OUT.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print('=== BUILD 427 PRODUCTION ADDITIVE POSTCHECK ===')
    print(f'Gift Card additive parity: {"PASS" if gift_ok else "PENDING"}')
    print(f'Notification additive parity: {"PASS" if notification_ok else "PENDING"}')
    print(f'Product-image annotation index: {"PASS" if annotation_ok else "PENDING"}')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 427 PRODUCTION ADDITIVE POSTCHECK:', 'PASS' if gift_ok and notification_ok and annotation_ok else 'PENDING')
    raise SystemExit(0 if gift_ok and notification_ok and annotation_ok else 1)


def main() -> None:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--apply-gift-card', action='store_true')
    group.add_argument('--apply-notification', action='store_true')
    group.add_argument('--apply-annotation-index', action='store_true')
    group.add_argument('--postcheck', action='store_true')
    parser.add_argument('--confirm')
    args = parser.parse_args()
    if args.postcheck:
        check(); return
    if args.apply_gift_card:
        apply('gift', args.confirm); return
    if args.apply_notification:
        apply('notification', args.confirm); return
    if args.apply_annotation_index:
        apply('annotation', args.confirm); return


if __name__ == '__main__':
    main()
