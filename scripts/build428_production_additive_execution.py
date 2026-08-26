#!/usr/bin/env python3
"""Build 428 guarded per-family Production additive execution controller.

Prepared only. No stage is authorized by source creation. Each stage requires:
- Build 427 Product-number postcheck PASS;
- hard Production name/UUID guard;
- its own literal authorization token;
- a fresh full Production D1 export for that same stage;
- backup path/bytes/SHA-256/age verification;
- targeted before/after row-preservation proof.

For the Gift Card stage, preservation covers all three Build 429 boundaries:
`gift_card_lookup_attempts`, `gift_cards`, and `gift_card_redemptions`.

Rebuild families are intentionally absent.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
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
BACKUP_DIR = ROOT / 'local_backups'
WRANGLER_VERSION = '4.126.0'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
MAX_BACKUP_AGE_SECONDS = 1800
TOKENS = {
    'gift': 'AUTHORIZE-BUILD428-PROD-GIFT-CARD',
    'notification': 'AUTHORIZE-BUILD428-PROD-NOTIFICATION',
    'annotation': 'AUTHORIZE-BUILD428-PROD-ANNOTATION-INDEX',
}
GIFT_COLUMNS = {'lookup_email', 'code_suffix', 'ip_hash', 'user_agent', 'result_status'}
GIFT_INDEXES = {
    'idx_gift_card_lookup_attempts_created',
    'idx_gift_card_lookup_attempts_email',
    'idx_gift_card_lookup_lockouts_status',
}
NOTIFICATION_INDEXES = {
    'idx_notification_outbox_kind_destination',
    'idx_notification_outbox_order',
    'idx_notification_outbox_payment',
    'idx_notification_outbox_product',
}
ANNOTATION_INDEX = 'idx_product_image_annotations_product_image_build197'


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 428 PRODUCTION ADDITIVE: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def backup_evidence_path(stage: str) -> Path:
    return ROOT / f'build428_production_{stage}_backup.local.json'


def stage_evidence_path(stage: str) -> Path:
    return ROOT / f'build428_production_{stage}_postcheck.local.json'


def require_product_postcheck() -> dict:
    if not POSTCHECK.exists():
        fail('Build 427 Product-number Production postcheck artifact is missing.')
    payload = json.loads(POSTCHECK.read_text(encoding='utf-8'))
    if payload.get('pass') is not True:
        fail('Build 427 Product-number Production postcheck is not green.')
    return payload


def hard_target_guard() -> None:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match the Build 428 hard guard.')


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
    hard_target_guard()
    path = temp / 'prod.toml'
    path.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
    return path


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 428 {label}')


def current_state(stage: str) -> dict:
    npx = base.npx_path()
    with tempfile.TemporaryDirectory(prefix='dd-build428-additive-check-') as td:
        cfg = prod_config(Path(td))
        if stage == 'gift':
            cols = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM pragma_table_info('gift_card_lookup_attempts') ORDER BY cid;", 'GIFT COLUMNS')}
            lockout = bool(q(npx, cfg, "SELECT name FROM sqlite_schema WHERE type='table' AND name='gift_card_lookup_lockouts';", 'GIFT LOCKOUT TABLE'))
            idx = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name IN ('gift_card_lookup_attempts','gift_card_lookup_lockouts') AND sql IS NOT NULL;", 'GIFT INDEXES')}
            lookup_rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM gift_card_lookup_attempts;', 'GIFT LOOKUP ROW COUNT')
            gift_rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM gift_cards;', 'GIFT CARD ROW COUNT')
            redemption_rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM gift_card_redemptions;', 'GIFT REDEMPTION ROW COUNT')
            lookup_count = int(lookup_rows[0].get('row_count') or 0)
            return {
                'columns': sorted(cols),
                'lockout_exists': lockout,
                'indexes': sorted(idx),
                'row_count': lookup_count,
                'lookup_attempt_rows': lookup_count,
                'gift_cards_rows': int(gift_rows[0].get('row_count') or 0),
                'gift_card_redemptions_rows': int(redemption_rows[0].get('row_count') or 0),
            }
        if stage == 'notification':
            cols = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM pragma_table_info('notification_outbox') ORDER BY cid;", 'NOTIFICATION COLUMNS')}
            idx = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name='notification_outbox' AND sql IS NOT NULL;", 'NOTIFICATION INDEXES')}
            rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM notification_outbox;', 'NOTIFICATION ROW COUNT')
            return {'columns': sorted(cols), 'indexes': sorted(idx), 'row_count': int(rows[0].get('row_count') or 0)}
        idx = {str(r.get('name') or '') for r in q(npx, cfg, "SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name='product_image_annotations' AND sql IS NOT NULL;", 'ANNOTATION INDEXES')}
        rows = q(npx, cfg, 'SELECT COUNT(*) AS row_count FROM product_image_annotations;', 'ANNOTATION ROW COUNT')
        return {'indexes': sorted(idx), 'row_count': int(rows[0].get('row_count') or 0)}


def stage_complete(stage: str, state: dict) -> bool:
    if stage == 'gift':
        return GIFT_COLUMNS.issubset(set(state['columns'])) and state['lockout_exists'] and GIFT_INDEXES.issubset(set(state['indexes']))
    if stage == 'notification':
        return 'metadata_json' in state['columns'] and NOTIFICATION_INDEXES.issubset(set(state['indexes']))
    return ANNOTATION_INDEX in state['indexes']


def gift_rows_preserved(before: dict, after: dict) -> bool:
    return all(
        before.get(key) == after.get(key)
        for key in ('lookup_attempt_rows', 'gift_cards_rows', 'gift_card_redemptions_rows')
    )


def export_backup(stage: str) -> dict:
    require_product_postcheck()
    hard_target_guard()
    npx = base.npx_path()
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    path = BACKUP_DIR / f'build428_prod_before_{stage}_{stamp}.sql'
    run_capture([
        npx, '--yes', f'wrangler@{WRANGLER_VERSION}', 'd1', 'export', PROD_NAME,
        '--remote', '--skip-confirmation', f'--output={path}',
    ], f'Production {stage} D1 export')
    if not path.exists() or path.stat().st_size < 1:
        fail(f'{stage} Production backup export did not create a non-empty SQL file.')
    payload = {
        'artifact': f'Build 428 Production {stage} pre-write D1 export',
        'stage': stage,
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'backup_path': str(path.relative_to(ROOT)),
        'backup_bytes': path.stat().st_size,
        'backup_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'created_at_utc': datetime.now(timezone.utc).isoformat(),
        'production_mutation_executed': False,
    }
    backup_evidence_path(stage).write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print(f'BUILD 428 PRODUCTION {stage.upper()} BACKUP: PASS')
    print(f'Backup: {payload["backup_path"]}')
    print(f'Bytes: {payload["backup_bytes"]}')
    print(f'SHA-256: {payload["backup_sha256"]}')
    print('Production mutation executed: NO')
    return payload


def verify_backup(stage: str) -> dict:
    path = backup_evidence_path(stage)
    if not path.exists():
        fail(f'{stage} backup evidence is missing.')
    payload = json.loads(path.read_text(encoding='utf-8'))
    if payload.get('production_database_id') != PROD_ID:
        fail(f'{stage} backup target UUID mismatch.')
    backup_path = ROOT / str(payload.get('backup_path') or '')
    if not backup_path.exists() or backup_path.stat().st_size != int(payload.get('backup_bytes') or 0):
        fail(f'{stage} backup file is missing or byte count changed.')
    digest = hashlib.sha256(backup_path.read_bytes()).hexdigest()
    if digest != payload.get('backup_sha256'):
        fail(f'{stage} backup SHA-256 changed.')
    created = datetime.fromisoformat(str(payload.get('created_at_utc')))
    age = (datetime.now(timezone.utc) - created).total_seconds()
    if age < 0 or age > MAX_BACKUP_AGE_SECONDS:
        fail(f'{stage} backup is stale ({int(age)} seconds); create a fresh stage backup.')
    print(f'BUILD 428 EXISTING {stage.upper()} BACKUP RECHECK: PASS')
    print(f'Backup age seconds: {int(age)}')
    return payload


def gift_sql(before: dict) -> str:
    lines = ['PRAGMA foreign_keys = ON;']
    for column in sorted(GIFT_COLUMNS):
        if column not in before['columns']:
            lines.append(f'ALTER TABLE gift_card_lookup_attempts ADD COLUMN {column} TEXT;')
    lines.extend([
        'CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_created ON gift_card_lookup_attempts(created_at DESC);',
        'CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_email ON gift_card_lookup_attempts(lookup_email, created_at DESC);',
    ])
    if not before['lockout_exists']:
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


def notification_sql(before: dict) -> str:
    lines = ['PRAGMA foreign_keys = ON;']
    if 'metadata_json' not in before['columns']:
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


def execute_sql(stage: str, sql: str) -> None:
    npx = base.npx_path()
    with tempfile.TemporaryDirectory(prefix='dd-build428-additive-') as td:
        temp = Path(td)
        cfg = prod_config(temp)
        sql_path = temp / f'{stage}.sql'
        sql_path.write_text(sql, encoding='utf-8')
        run_capture([
            npx, '--yes', f'wrangler@{WRANGLER_VERSION}', 'd1', 'execute', 'DB',
            '--remote', '--config', str(cfg), '--yes', '--file', str(sql_path),
        ], f'Production {stage} additive alignment')


def apply(stage: str, supplied: str | None) -> None:
    require_product_postcheck()
    require_token(stage, supplied)
    verify_backup(stage)
    before = current_state(stage)
    if stage_complete(stage, before):
        print(f'BUILD 428 PRODUCTION {stage.upper()} STAGE: ALREADY PASS / NO WRITE REQUIRED')
        print('PRODUCTION PROMOTION: CLOSED')
        return
    sql = gift_sql(before) if stage == 'gift' else notification_sql(before) if stage == 'notification' else annotation_sql()
    execute_sql(stage, sql)
    after = current_state(stage)
    row_preserved = gift_rows_preserved(before, after) if stage == 'gift' else after['row_count'] == before['row_count']
    passed = stage_complete(stage, after) and row_preserved
    payload = {
        'artifact': f'Build 428 Production {stage} additive postcheck',
        'stage': stage,
        'pass': passed,
        'before': before,
        'after': after,
        'row_count_preserved': row_preserved,
        'production_mutation_executed': True,
        'production_promotion_open': False,
    }
    stage_evidence_path(stage).write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print(f'BUILD 428 PRODUCTION {stage.upper()} ADDITIVE POSTCHECK:', 'PASS' if passed else 'FAIL')
    if stage == 'gift':
        print(f'gift_card_lookup_attempts rows preserved: {before["lookup_attempt_rows"]} -> {after["lookup_attempt_rows"]}')
        print(f'gift_cards rows preserved: {before["gift_cards_rows"]} -> {after["gift_cards_rows"]}')
        print(f'gift_card_redemptions rows preserved: {before["gift_card_redemptions_rows"]} -> {after["gift_card_redemptions_rows"]}')
    else:
        print(f'Rows preserved: {before["row_count"]} -> {after["row_count"]}')
    print('PRODUCTION PROMOTION: CLOSED')
    if not passed:
        raise SystemExit(1)


def postcheck(stage: str) -> None:
    require_product_postcheck()
    state = current_state(stage)
    passed = stage_complete(stage, state)
    print(f'BUILD 428 PRODUCTION {stage.upper()} READ-ONLY POSTCHECK:', 'PASS' if passed else 'PENDING')
    if stage == 'gift':
        print(f'gift_card_lookup_attempts rows: {state["lookup_attempt_rows"]}')
        print(f'gift_cards rows: {state["gift_cards_rows"]}')
        print(f'gift_card_redemptions rows: {state["gift_card_redemptions_rows"]}')
    else:
        print(f'Rows: {state["row_count"]}')
    print('PRODUCTION PROMOTION: CLOSED')
    raise SystemExit(0 if passed else 1)


def main() -> None:
    configure_console()
    parser = argparse.ArgumentParser()
    parser.add_argument('--stage', choices=sorted(TOKENS), required=True)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--backup', action='store_true')
    action.add_argument('--apply', action='store_true')
    action.add_argument('--postcheck', action='store_true')
    parser.add_argument('--confirm')
    args = parser.parse_args()
    if args.postcheck:
        postcheck(args.stage)
        return
    require_token(args.stage, args.confirm)
    if args.backup:
        export_backup(args.stage)
        return
    apply(args.stage, args.confirm)


if __name__ == '__main__':
    main()
