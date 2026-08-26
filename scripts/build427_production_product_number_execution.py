#!/usr/bin/env python3
"""Build 427 guarded Production Product-number execution controller.

This is intentionally limited to the 45-row legacy Product-number backfill and
monotonic sequence advance. Gift Card, Notification, indexes and every rebuild
family are separate later stages.

Production mutation is impossible unless:
- the literal authorization token is supplied;
- the hard Production name/UUID guard matches;
- the already-green Build 427 authorization-boundary mapping exists;
- a fresh focused Product-number-only live recheck passes immediately before write;
- a fresh full Production D1 export succeeds and its local SHA-256 is reverified;
- the exact 45-row mapping remains collision-free.

The focused immediate recheck deliberately does not rerun unrelated Inventory,
Gift Card, Notification, CAIP or rebuild-family evidence. Those were proven at
the authorization boundary and have their own later execution gates. This keeps
a transient authorization failure on an unrelated read from blocking the already
backed-up Product-number-only stage while retaining every fact that can invalidate
this specific write.
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
import time

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
PREFLIGHT = ROOT / 'build427_production_execution_preflight.local.json'
BACKUP_EVIDENCE = ROOT / 'build427_production_backup.local.json'
APPLY_EVIDENCE = ROOT / 'build427_production_product_number_apply.local.json'
POSTCHECK = ROOT / 'build427_production_product_number_postcheck.local.json'
FOCUSED_RECHECK = ROOT / 'build427_product_number_focused_recheck.local.json'
BACKUP_DIR = ROOT / 'local_backups'
WRANGLER_VERSION = '4.126.0'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
DEV_NAME = 'devilndove-dev'
DEV_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
EXPECTED_START = 1084
EXPECTED_END = 1128
EXPECTED_NEXT = 1129
EXPECTED_PRODUCTS = 45
MAX_BACKUP_AGE_SECONDS = 1800
AUTH_TOKEN = 'AUTHORIZE-BUILD427-PROD-PRODUCT-NUMBERS'


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


configure_console()


def fail(message: str) -> None:
    print(f'BUILD 427 PRODUCTION PRODUCT NUMBERS: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def run_capture(args: list[str], label: str) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        args, cwd=ROOT, text=True, encoding='utf-8', errors='replace',
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        env={**os.environ, 'NO_COLOR': '1', 'FORCE_COLOR': '0', 'PYTHONIOENCODING': 'utf-8'},
        check=False,
    )
    print(result.stdout or '', end='' if (result.stdout or '').endswith('\n') else '\n')
    if result.returncode != 0:
        fail(f'{label} failed with exit code {result.returncode}.')
    return result


def require_authorization(value: str | None) -> None:
    if value != AUTH_TOKEN:
        fail('explicit Production authorization token is missing or incorrect.')


def hard_target_guard() -> None:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('compiled Production target constants do not match the Build 427 hard guard.')
    if base.DEV_DATABASE != DEV_NAME or base.DEV_DATABASE_ID != DEV_ID:
        fail('compiled Development evidence constants do not match the Build 427 expected target.')
    if PROD_ID == DEV_ID or PROD_NAME == DEV_NAME:
        fail('Production and Development target constants unexpectedly collide.')


def prod_config(temp: Path) -> Path:
    path = temp / 'prod.toml'
    path.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
    return path


def dev_config(temp: Path) -> Path:
    path = temp / 'dev.toml'
    path.write_text(base.readonly_config(base.DEV_PROJECT, DEV_NAME, DEV_ID), encoding='utf-8')
    return path


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 427 {label}')


def clean(value) -> str:
    return str(value or '').strip()


def as_int(value, default=None):
    try:
        if value is None or str(value).strip() == '':
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def boundary_mapping() -> list[dict]:
    if not PREFLIGHT.exists():
        fail('green Build 427 authorization-boundary preflight artifact is missing.')
    payload = json.loads(PREFLIGHT.read_text(encoding='utf-8'))
    if payload.get('safe_to_open_product_number_execution') is not True:
        fail('Build 427 authorization-boundary preflight is not green.')
    mapping = payload.get('mapping') if isinstance(payload.get('mapping'), list) else []
    ids = [as_int(row.get('product_id')) for row in mapping]
    numbers = [as_int(row.get('product_number')) for row in mapping]
    if (
        len(mapping) != EXPECTED_PRODUCTS
        or len(set(ids)) != EXPECTED_PRODUCTS
        or len(set(numbers)) != EXPECTED_PRODUCTS
        or min(numbers or [0]) != EXPECTED_START
        or max(numbers or [0]) != EXPECTED_END
    ):
        fail('authorization-boundary Product-number mapping is not the exact 45-row 1084..1128 map.')
    return mapping


def focused_product_number_recheck() -> dict:
    """Re-prove only facts capable of invalidating the Product-number write."""
    hard_target_guard()
    mapping = boundary_mapping()
    expected_by_id = {as_int(row.get('product_id')): row for row in mapping}
    candidate_numbers = {as_int(row.get('product_number')) for row in mapping}
    npx = base.npx_path()

    with tempfile.TemporaryDirectory(prefix='dd-build427-focused-') as temp_dir:
        temp = Path(temp_dir)
        prod_cfg = prod_config(temp)
        dev_cfg = dev_config(temp)
        product_sql = 'SELECT product_id,product_number,name,slug FROM products ORDER BY product_id;'
        prod_rows = q(npx, prod_cfg, product_sql, 'PRODUCTION FOCUSED PRODUCT RECHECK')
        dev_rows = q(npx, dev_cfg, product_sql, 'DEVELOPMENT FOCUSED PRODUCT RECHECK')
        prod_seq_rows = q(
            npx, prod_cfg,
            "SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products' LIMIT 1;",
            'PRODUCTION FOCUSED SEQUENCE RECHECK',
        )
        dev_seq_rows = q(
            npx, dev_cfg,
            "SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products' LIMIT 1;",
            'DEVELOPMENT FOCUSED SEQUENCE RECHECK',
        )
        reserved_rows = []
        for table in ('product_costs', 'product_deletion_audit'):
            reserved_rows.extend(q(
                npx, prod_cfg,
                f'SELECT DISTINCT CAST(product_number AS INTEGER) AS product_number FROM "{table}" '
                "WHERE product_number IS NOT NULL AND trim(CAST(product_number AS TEXT))<>'' "
                'AND CAST(product_number AS INTEGER)>0 ORDER BY product_number;',
                f'PRODUCTION {table} FOCUSED HISTORY RECHECK',
            ))

    prod_by_id = {as_int(row.get('product_id')): row for row in prod_rows}
    dev_by_id = {as_int(row.get('product_id')): row for row in dev_rows}
    expected_ids = sorted(expected_by_id)

    def identity_matches(actual: dict, expected: dict) -> bool:
        return (
            clean(actual.get('slug')).lower() == clean(expected.get('slug')).lower()
            and clean(actual.get('name')).casefold() == clean(expected.get('name')).casefold()
        )

    prod_identity_ok = (
        len(prod_rows) == EXPECTED_PRODUCTS
        and sorted(prod_by_id) == expected_ids
        and all(identity_matches(prod_by_id[pid], expected_by_id[pid]) for pid in expected_ids)
    )
    dev_mapping_ok = (
        len(dev_rows) == EXPECTED_PRODUCTS
        and sorted(dev_by_id) == expected_ids
        and all(identity_matches(dev_by_id[pid], expected_by_id[pid]) for pid in expected_ids)
        and all(as_int(dev_by_id[pid].get('product_number')) == as_int(expected_by_id[pid].get('product_number')) for pid in expected_ids)
    )
    prod_all_null = all(as_int(row.get('product_number')) is None for row in prod_rows)
    prod_seq = as_int(prod_seq_rows[0].get('next_product_number')) if prod_seq_rows else None
    dev_seq = as_int(dev_seq_rows[0].get('next_product_number')) if dev_seq_rows else None
    history_numbers = {
        as_int(row.get('product_number')) for row in reserved_rows
        if as_int(row.get('product_number')) is not None
    }
    collisions = sorted(candidate_numbers & history_numbers)
    safe = (
        prod_identity_ok
        and dev_mapping_ok
        and prod_all_null
        and prod_seq == EXPECTED_START
        and dev_seq is not None and dev_seq >= EXPECTED_NEXT
        and not collisions
    )
    payload = {
        'artifact': 'Build 427 focused Product-number immediate pre-write recheck',
        'safe_to_apply_product_numbers': safe,
        'production_identity_ok': prod_identity_ok,
        'development_mapping_ok': dev_mapping_ok,
        'production_all_product_numbers_null': prod_all_null,
        'production_sequence_next': prod_seq,
        'development_sequence_next': dev_seq,
        'candidate_collisions_in_product_costs_or_deletion_audit': collisions,
        'mapping': mapping if safe else [],
        'unrelated_schema_families_queried': False,
        'production_mutation_executed': False,
    }
    FOCUSED_RECHECK.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('=== BUILD 427 FOCUSED PRODUCT-NUMBER RECHECK ===')
    print(f'Production identities unchanged: {prod_identity_ok}')
    print(f'Development mapping unchanged: {dev_mapping_ok}')
    print(f'Production Product numbers still all NULL: {prod_all_null}')
    print(f'Production sequence next: {prod_seq}')
    print(f'Development sequence next: {dev_seq}')
    print(f'Candidate history collisions: {collisions}')
    print(f'Safe for Product-number-only write: {"YES" if safe else "NO"}')
    if not safe:
        fail('focused Product-number immediate pre-write recheck is not safe.')
    return payload


def export_backup() -> dict:
    hard_target_guard()
    npx = base.npx_path()
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    path = BACKUP_DIR / f'build427_prod_before_product_numbers_{stamp}.sql'
    cmd = [
        npx, '--yes', f'wrangler@{WRANGLER_VERSION}', 'd1', 'export', PROD_NAME,
        '--remote', '--skip-confirmation', f'--output={path}',
    ]
    run_capture(cmd, 'Production D1 export')
    if not path.exists() or path.stat().st_size < 1:
        fail('Production backup export did not create a non-empty SQL file.')
    payload = {
        'artifact': 'Build 427 Production pre-write D1 export',
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'backup_path': str(path.relative_to(ROOT)),
        'backup_bytes': path.stat().st_size,
        'backup_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'backup_created_at_utc': datetime.now(timezone.utc).isoformat(),
        'production_mutation_executed': False,
    }
    BACKUP_EVIDENCE.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print('BUILD 427 PRODUCTION BACKUP: PASS')
    print(f'Backup: {payload["backup_path"]}')
    print(f'Bytes: {payload["backup_bytes"]}')
    print(f'SHA-256: {payload["backup_sha256"]}')
    print('Production mutation executed: NO')
    return payload


def validate_existing_backup() -> dict:
    if not BACKUP_EVIDENCE.exists():
        fail('Production backup evidence is missing. Run the authorized --backup stage first.')
    backup = json.loads(BACKUP_EVIDENCE.read_text(encoding='utf-8'))
    if backup.get('production_database') != PROD_NAME or backup.get('production_database_id') != PROD_ID:
        fail('Production backup evidence does not match the hard Production target.')
    relative = str(backup.get('backup_path') or '').replace('\\', '/')
    backup_path = ROOT / Path(relative)
    if not backup_path.exists() or not backup_path.is_file():
        fail('recorded Production backup file is missing.')
    actual_bytes = backup_path.stat().st_size
    expected_bytes = int(backup.get('backup_bytes') or 0)
    if actual_bytes < 1 or actual_bytes != expected_bytes:
        fail('recorded Production backup byte size no longer matches the local export.')
    actual_sha = hashlib.sha256(backup_path.read_bytes()).hexdigest()
    if actual_sha != str(backup.get('backup_sha256') or ''):
        fail('recorded Production backup SHA-256 no longer matches the local export.')
    age_seconds = max(0.0, time.time() - backup_path.stat().st_mtime)
    if age_seconds > MAX_BACKUP_AGE_SECONDS:
        fail(
            f'Production backup is {int(age_seconds)} seconds old; '
            f'maximum allowed is {MAX_BACKUP_AGE_SECONDS}. Run the authorized --backup stage again.'
        )
    print('BUILD 427 EXISTING PRODUCTION BACKUP RECHECK: PASS')
    print(f'Backup bytes: {actual_bytes}')
    print(f'Backup SHA-256: {actual_sha}')
    print(f'Backup age seconds: {int(age_seconds)}')
    return backup


def sql_quote(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def build_product_sql(mapping: list[dict]) -> str:
    updates = []
    for row in mapping:
        pid = int(row['product_id'])
        number = int(row['product_number'])
        slug = sql_quote(str(row['slug']))
        updates.append(
            f"UPDATE products SET product_number={number} "
            f"WHERE product_id={pid} AND slug={slug} AND product_number IS NULL "
            f"AND NOT EXISTS (SELECT 1 FROM products WHERE product_number={number});"
        )
    if len(updates) != EXPECTED_PRODUCTS:
        fail('refusing to build Product-number SQL without exactly 45 guarded updates.')
    return '\n'.join([
        '-- Build 427 explicitly authorized Production Product-number backfill',
        'PRAGMA foreign_keys = ON;',
        *updates,
        '',
        'INSERT INTO catalog_product_number_sequence(sequence_key,next_product_number,updated_at)',
        f"VALUES('products',{EXPECTED_NEXT},CURRENT_TIMESTAMP)",
        'ON CONFLICT(sequence_key) DO UPDATE SET',
        '  next_product_number = CASE',
        '    WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number',
        '      THEN excluded.next_product_number',
        '    ELSE catalog_product_number_sequence.next_product_number',
        '  END,',
        '  updated_at = CURRENT_TIMESTAMP;',
        '',
    ])


def apply_product_numbers() -> None:
    hard_target_guard()
    backup = validate_existing_backup()
    focused = focused_product_number_recheck()
    mapping = focused['mapping']
    sql = build_product_sql(mapping)
    npx = base.npx_path()
    with tempfile.TemporaryDirectory(prefix='dd-build427-prod-') as temp_dir:
        temp = Path(temp_dir)
        cfg = prod_config(temp)
        sql_path = temp / 'product_numbers.sql'
        sql_path.write_text(sql, encoding='utf-8')
        cmd = [
            npx, '--yes', f'wrangler@{WRANGLER_VERSION}', 'd1', 'execute', 'DB',
            '--remote', '--config', str(cfg), '--yes', '--file', str(sql_path),
        ]
        run_capture(cmd, 'Production Product-number backfill')

    payload = {
        'artifact': 'Build 427 Production Product-number apply evidence',
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'candidate_start': EXPECTED_START,
        'candidate_end': EXPECTED_END,
        'candidate_next': EXPECTED_NEXT,
        'guarded_product_updates_submitted': EXPECTED_PRODUCTS,
        'backup_sha256': backup.get('backup_sha256'),
        'focused_recheck_artifact': FOCUSED_RECHECK.name,
        'production_mutation_executed': True,
        'scope': 'product_numbers_only',
    }
    APPLY_EVIDENCE.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print('BUILD 427 PRODUCTION PRODUCT-NUMBER APPLY: COMPLETE')
    print('Scope: Product numbers only')
    print('Gift Card/Notification/index/rebuild families: NOT EXECUTED')
    print('PRODUCTION PROMOTION: CLOSED')


def postcheck() -> None:
    hard_target_guard()
    npx = base.npx_path()
    with tempfile.TemporaryDirectory(prefix='dd-build427-check-') as temp_dir:
        temp = Path(temp_dir)
        prod_cfg = prod_config(temp)
        dev_cfg = dev_config(temp)
        sql = 'SELECT product_id,product_number,name,slug FROM products ORDER BY product_id;'
        prod_rows = q(npx, prod_cfg, sql, 'PRODUCTION PRODUCT POSTCHECK')
        dev_rows = q(npx, dev_cfg, sql, 'DEVELOPMENT PRODUCT POSTCHECK')
        prod_seq_rows = q(npx, prod_cfg, "SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products' LIMIT 1;", 'PRODUCTION SEQUENCE POSTCHECK')
        dev_seq_rows = q(npx, dev_cfg, "SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products' LIMIT 1;", 'DEVELOPMENT SEQUENCE POSTCHECK')

    prod_numbers = [int(r['product_number']) for r in prod_rows if r.get('product_number') is not None]
    dev_numbers = [int(r['product_number']) for r in dev_rows if r.get('product_number') is not None]
    prod_by_id = {int(r['product_id']): r for r in prod_rows}
    dev_by_id = {int(r['product_id']): r for r in dev_rows}
    identity_equal = (
        set(prod_by_id) == set(dev_by_id)
        and all(
            str(prod_by_id[pid].get('slug') or '').strip().lower() == str(dev_by_id[pid].get('slug') or '').strip().lower()
            and str(prod_by_id[pid].get('name') or '').strip().casefold() == str(dev_by_id[pid].get('name') or '').strip().casefold()
            for pid in prod_by_id
        )
    )
    exact_prod = (
        len(prod_rows) == EXPECTED_PRODUCTS
        and len(prod_numbers) == EXPECTED_PRODUCTS
        and len(set(prod_numbers)) == EXPECTED_PRODUCTS
        and min(prod_numbers or [0]) == EXPECTED_START
        and max(prod_numbers or [0]) == EXPECTED_END
    )
    exact_dev = (
        len(dev_rows) == EXPECTED_PRODUCTS
        and len(dev_numbers) == EXPECTED_PRODUCTS
        and len(set(dev_numbers)) == EXPECTED_PRODUCTS
        and min(dev_numbers or [0]) == EXPECTED_START
        and max(dev_numbers or [0]) == EXPECTED_END
    )
    prod_seq = int(prod_seq_rows[0]['next_product_number']) if prod_seq_rows else 0
    dev_seq = int(dev_seq_rows[0]['next_product_number']) if dev_seq_rows else 0
    passed = exact_prod and exact_dev and identity_equal and prod_seq >= EXPECTED_NEXT and dev_seq >= EXPECTED_NEXT
    payload = {
        'artifact': 'Build 427 Production Product-number postcheck',
        'pass': passed,
        'production_products': len(prod_rows),
        'production_unique_product_numbers': len(set(prod_numbers)),
        'production_min_product_number': min(prod_numbers or [0]),
        'production_max_product_number': max(prod_numbers or [0]),
        'production_sequence_next': prod_seq,
        'development_products': len(dev_rows),
        'development_unique_product_numbers': len(set(dev_numbers)),
        'development_min_product_number': min(dev_numbers or [0]),
        'development_max_product_number': max(dev_numbers or [0]),
        'development_sequence_next': dev_seq,
        'product_identity_equal': identity_equal,
        'production_promotion_open': False,
    }
    POSTCHECK.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print('=== BUILD 427 PRODUCTION PRODUCT-NUMBER POSTCHECK ===')
    print(f'Production Product numbers: {payload["production_min_product_number"]}..{payload["production_max_product_number"]} ({payload["production_unique_product_numbers"]} unique)')
    print(f'Production sequence next: {prod_seq}')
    print(f'Development Product numbers: {payload["development_min_product_number"]}..{payload["development_max_product_number"]} ({payload["development_unique_product_numbers"]} unique)')
    print(f'Development sequence next: {dev_seq}')
    print(f'Product identities equal: {identity_equal}')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 427 PRODUCTION PRODUCT-NUMBER POSTCHECK:', 'PASS' if passed else 'FAIL')
    raise SystemExit(0 if passed else 1)


def main() -> None:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--backup', action='store_true')
    group.add_argument('--apply-product-numbers', action='store_true')
    group.add_argument('--postcheck', action='store_true')
    parser.add_argument('--confirm')
    args = parser.parse_args()

    if args.postcheck:
        postcheck()
        return
    require_authorization(args.confirm)
    if args.backup:
        hard_target_guard()
        focused_product_number_recheck()
        export_backup()
        return
    if args.apply_product_numbers:
        apply_product_numbers()
        return


if __name__ == '__main__':
    main()
