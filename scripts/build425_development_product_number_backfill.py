#!/usr/bin/env python3
"""Build 425 Development-only legacy Product-number backfill.

Safety model:
- Production can only be queried; there is no Production write command in this file.
- The Development target is hard-pinned by name + UUID through wrangler.toml validation.
- Build 424 live reservation evidence must still be current.
- A full remote Development D1 export is created before the first write.
- The legacy backfill is deterministic and guarded by Product ID + slug + NULL state.
- Post-write proof is written locally for Build 425 release gating.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

import build418_live_semantic_schema_classification as base
import build418_live_semantic_schema_classification_resilient  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]
RESERVATION = ROOT / 'build424_product_number_reservation_evidence.local.json'
PREFLIGHT = ROOT / 'build425_development_product_number_preflight.local.json'
APPLY_EVIDENCE = ROOT / 'build425_development_product_number_apply.local.json'
POSTWRITE = ROOT / 'build425_development_product_number_postwrite.local.json'
BACKUP_DIR = ROOT / 'local_backups'
WRANGLER_VERSION = '4.126.0'
EXPECTED_PRODUCTS = 45
EXPECTED_DEV_NAME = 'devilndove-dev'
EXPECTED_DEV_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'
EXPECTED_PROD_NAME = 'devilndove-prod'
EXPECTED_PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
CONFIRM_TEXT = 'DEV-ONLY-PRODUCT-NUMBERS'


def fail(message: str, code: int = 1) -> None:
    print(f'BUILD 425: FAIL — {message}', file=sys.stderr)
    raise SystemExit(code)


def clean(value) -> str:
    return str(value or '').strip()


def as_int(value, default=None):
    try:
        if value is None or str(value).strip() == '':
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def load_reservation() -> dict:
    if not RESERVATION.exists():
        fail('Build 424 reservation artifact is missing; rerun Build 424 live evidence first.')
    payload = json.loads(RESERVATION.read_text(encoding='utf-8'))
    if payload.get('safe_to_prepare_nonexecuting_preview') is not True:
        fail('Build 424 reservation artifact is not marked safe.')
    mapping = payload.get('mapping') if isinstance(payload.get('mapping'), list) else []
    numbers = [as_int(row.get('candidate_product_number')) for row in mapping]
    ids = [as_int(row.get('product_id')) for row in mapping]
    if len(mapping) != EXPECTED_PRODUCTS or len(set(ids)) != EXPECTED_PRODUCTS or len(set(numbers)) != EXPECTED_PRODUCTS:
        fail('Build 424 mapping is not an exact unique 45-row map.')
    return payload


def readonly_configs() -> tuple[tempfile.TemporaryDirectory, Path, Path]:
    temp_obj = tempfile.TemporaryDirectory(prefix='dd-build425-')
    temp = Path(temp_obj.name)
    dev_cfg = temp / 'dev.toml'
    prod_cfg = temp / 'prod.toml'
    dev_cfg.write_text(base.readonly_config(base.DEV_PROJECT, base.DEV_DATABASE, base.DEV_DATABASE_ID), encoding='utf-8')
    prod_cfg.write_text(base.readonly_config(base.PROD_PROJECT, base.PROD_DATABASE, base.PROD_DATABASE_ID), encoding='utf-8')
    return temp_obj, dev_cfg, prod_cfg


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 425 {label}')


def product_rows(npx: str, cfg: Path, label: str) -> list[dict]:
    return q(
        npx, cfg,
        'SELECT product_id,product_number,name,slug,sku,status FROM products ORDER BY product_id;',
        f'{label} PRODUCT IDENTITY',
    )


def sequence_next(npx: str, cfg: Path, label: str) -> int | None:
    rows = q(
        npx, cfg,
        "SELECT next_product_number FROM catalog_product_number_sequence WHERE sequence_key='products' LIMIT 1;",
        f'{label} PRODUCT SEQUENCE',
    )
    return as_int(rows[0].get('next_product_number')) if rows else None


def history_numbers(npx: str, cfg: Path, tables: list[str], label: str) -> set[int]:
    values: set[int] = set()
    for table in tables:
        if not base.IDENTIFIER_RE.fullmatch(table):
            fail(f'unsafe product-number table identifier {table!r}')
        rows = q(
            npx, cfg,
            f'SELECT DISTINCT CAST(product_number AS INTEGER) AS product_number FROM "{table}" '
            "WHERE product_number IS NOT NULL AND trim(CAST(product_number AS TEXT))<>'' AND CAST(product_number AS INTEGER)>0 ORDER BY product_number;",
            f'{label} {table} RESERVED PRODUCT NUMBERS',
        )
        for row in rows:
            number = as_int(row.get('product_number'))
            if number and number > 0:
                values.add(number)
    return values


def identity(row: dict) -> tuple:
    return (as_int(row.get('product_id')), clean(row.get('slug')).lower(), clean(row.get('name')).casefold())


def mapping_identity(row: dict) -> tuple:
    return (as_int(row.get('product_id')), clean(row.get('slug')).lower(), clean(row.get('name')).casefold())


def sku_overlaps(rows: list[dict], mapping: list[dict], environment: str) -> list[dict]:
    sku_to_product = {clean(row.get('sku')).upper(): as_int(row.get('product_id')) for row in rows if clean(row.get('sku'))}
    overlaps = []
    for item in mapping:
        number = as_int(item.get('candidate_product_number'))
        encoded = f'DND-{number:05d}'
        if encoded in sku_to_product:
            overlaps.append({
                'environment': environment,
                'sku': encoded,
                'sku_product_id': sku_to_product[encoded],
                'mapped_product_id': as_int(item.get('product_id')),
                'same_product': sku_to_product[encoded] == as_int(item.get('product_id')),
            })
    return overlaps


def validate_target_pin() -> None:
    base.validate_dev_pin()
    if base.DEV_DATABASE != EXPECTED_DEV_NAME or base.DEV_DATABASE_ID != EXPECTED_DEV_ID:
        fail('compiled Development target constants do not match Build 425 hard guard.')
    if base.PROD_DATABASE != EXPECTED_PROD_NAME or base.PROD_DATABASE_ID != EXPECTED_PROD_ID:
        fail('compiled Production evidence constants do not match Build 425 expected read-only target.')
    config_text = (ROOT / 'wrangler.toml').read_text(encoding='utf-8', errors='replace')
    if EXPECTED_PROD_ID in config_text:
        fail('wrangler.toml unexpectedly contains the Production D1 UUID; refusing Development write helper.')


def build_preflight() -> dict:
    validate_target_pin()
    reservation = load_reservation()
    mapping = reservation['mapping']
    candidate_numbers = {as_int(row.get('candidate_product_number')) for row in mapping}
    npx = base.npx_path()
    temp_obj, dev_cfg, prod_cfg = readonly_configs()
    try:
        dev_rows = product_rows(npx, dev_cfg, 'DEVELOPMENT')
        prod_rows = product_rows(npx, prod_cfg, 'PRODUCTION')
        dev_seq = sequence_next(npx, dev_cfg, 'DEVELOPMENT')
        prod_seq = sequence_next(npx, prod_cfg, 'PRODUCTION')
        tables = reservation.get('development_product_number_tables') or []
        prod_tables = reservation.get('production_product_number_tables') or []
        if set(tables) != set(prod_tables):
            fail('Build 424 product-number-bearing table sets no longer match.')
        dev_reserved = history_numbers(npx, dev_cfg, tables, 'DEVELOPMENT')
        prod_reserved = history_numbers(npx, prod_cfg, prod_tables, 'PRODUCTION')
    finally:
        temp_obj.cleanup()

    dev_by_id = {as_int(row.get('product_id')): row for row in dev_rows}
    prod_by_id = {as_int(row.get('product_id')): row for row in prod_rows}
    expected_by_id = {as_int(row.get('product_id')): row for row in mapping}
    ids = sorted(expected_by_id)
    identity_ok = (
        len(dev_rows) == EXPECTED_PRODUCTS
        and len(prod_rows) == EXPECTED_PRODUCTS
        and sorted(dev_by_id) == ids
        and sorted(prod_by_id) == ids
        and all(identity(dev_by_id[pid]) == mapping_identity(expected_by_id[pid]) for pid in ids)
        and all(identity(prod_by_id[pid]) == mapping_identity(expected_by_id[pid]) for pid in ids)
    )
    dev_all_null = all(as_int(row.get('product_number')) is None for row in dev_rows)
    prod_all_null = all(as_int(row.get('product_number')) is None for row in prod_rows)
    expected_dev_seq = as_int((reservation.get('development_sequence') or {}).get('next_product_number'))
    expected_prod_seq = as_int((reservation.get('production_sequence') or {}).get('next_product_number'))
    sequence_fresh = dev_seq == expected_dev_seq and prod_seq == expected_prod_seq
    reserved_collision = sorted(candidate_numbers & (dev_reserved | prod_reserved))
    overlaps = sku_overlaps(dev_rows, mapping, 'development') + sku_overlaps(prod_rows, mapping, 'production')

    safe = identity_ok and dev_all_null and prod_all_null and sequence_fresh and not reserved_collision
    payload = {
        'artifact': 'Build 425 Development-only Product-number preflight',
        'safe_to_apply_development': safe,
        'development_database': EXPECTED_DEV_NAME,
        'development_database_id': EXPECTED_DEV_ID,
        'production_database_write_capability': False,
        'mapping_count': len(mapping),
        'candidate_start': min(candidate_numbers),
        'candidate_end': max(candidate_numbers),
        'candidate_next': as_int(reservation.get('candidate_next_product_number')),
        'identity_ok': identity_ok,
        'development_all_null': dev_all_null,
        'production_all_null': prod_all_null,
        'development_sequence_current': dev_seq,
        'development_sequence_expected': expected_dev_seq,
        'production_sequence_current': prod_seq,
        'production_sequence_expected': expected_prod_seq,
        'sequence_evidence_fresh': sequence_fresh,
        'reserved_candidate_collisions': reserved_collision,
        'sku_overlaps': overlaps,
        'sku_overlap_count': len(overlaps),
        'mapping': mapping,
    }
    PREFLIGHT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return payload


def sql_quote(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def build_write_sql(preflight: dict) -> str:
    mapping = preflight['mapping']
    cases = []
    guarded_ids = []
    for row in mapping:
        pid = as_int(row.get('product_id'))
        number = as_int(row.get('candidate_product_number'))
        slug = clean(row.get('slug'))
        cases.append(f"WHEN product_id={pid} AND slug={sql_quote(slug)} THEN {number}")
        guarded_ids.append(str(pid))
    next_number = as_int(preflight.get('candidate_next'))
    return f"""-- Build 425 Development-only Product-number legacy backfill\n-- HARD TARGET: {EXPECTED_DEV_NAME} ({EXPECTED_DEV_ID})\n-- Production target does not appear in this SQL.\n\nUPDATE products\nSET product_number = CASE\n  {' '.join(cases)}\n  ELSE product_number\nEND\nWHERE product_number IS NULL\n  AND product_id IN ({','.join(guarded_ids)});\n\nINSERT INTO catalog_product_number_sequence(sequence_key,next_product_number,updated_at)\nVALUES('products',{next_number},CURRENT_TIMESTAMP)\nON CONFLICT(sequence_key) DO UPDATE SET\n  next_product_number = CASE\n    WHEN catalog_product_number_sequence.next_product_number < excluded.next_product_number\n      THEN excluded.next_product_number\n    ELSE catalog_product_number_sequence.next_product_number\n  END,\n  updated_at = CURRENT_TIMESTAMP;\n"""


def run_cli(args: list[str], label: str) -> subprocess.CompletedProcess[str]:
    env = {**__import__('os').environ, 'NO_COLOR': '1', 'FORCE_COLOR': '0', 'PYTHONIOENCODING': 'utf-8'}
    result = subprocess.run(
        args, cwd=ROOT, text=True, encoding='utf-8', errors='replace',
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env, check=False,
    )
    print(result.stdout or '', end='' if (result.stdout or '').endswith('\n') else '\n')
    if result.returncode != 0:
        fail(f'{label} failed with exit code {result.returncode}.')
    return result


def export_backup(npx: str) -> tuple[Path, str]:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    path = BACKUP_DIR / f'build425_dev_before_product_numbers_{stamp}.sql'
    cmd = [
        npx, '--yes', f'wrangler@{WRANGLER_VERSION}', 'd1', 'export', EXPECTED_DEV_NAME,
        '--remote', '--config', str(ROOT / 'wrangler.toml'), '--skip-confirmation', f'--output={path}',
    ]
    run_cli(cmd, 'Development D1 export')
    if not path.exists() or path.stat().st_size < 1:
        fail('Development backup export did not create a non-empty SQL file.')
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return path, digest


def apply_development(ack_sku_overlap: bool) -> None:
    preflight = build_preflight()
    print('\n=== BUILD 425 DEVELOPMENT PRE-WRITE GATE ===')
    print(f"Safe to apply Development: {'YES' if preflight['safe_to_apply_development'] else 'NO'}")
    print(f"Candidate block: {preflight['candidate_start']}..{preflight['candidate_end']}")
    print(f"Candidate next: {preflight['candidate_next']}")
    print(f"SKU overlaps: {preflight['sku_overlap_count']} (SKU and Product number are separate identities)")
    if not preflight['safe_to_apply_development']:
        fail('live Development preflight is not safe; no write attempted.')
    if preflight['sku_overlap_count'] and not ack_sku_overlap:
        fail('SKU overlap evidence requires review. Rerun with --ack-sku-overlap only after reviewing preflight JSON.')

    npx = base.npx_path()
    backup_path, backup_sha256 = export_backup(npx)
    sql = build_write_sql(preflight)
    with tempfile.NamedTemporaryFile('w', suffix='.sql', prefix='build425-dev-', encoding='utf-8', delete=False) as handle:
        handle.write(sql)
        sql_path = Path(handle.name)
    try:
        cmd = [
            npx, '--yes', f'wrangler@{WRANGLER_VERSION}', 'd1', 'execute', 'DB',
            '--remote', '--config', str(ROOT / 'wrangler.toml'), '--yes', '--file', str(sql_path),
        ]
        run_cli(cmd, 'Development Product-number backfill')
    finally:
        try:
            sql_path.unlink(missing_ok=True)
        except OSError:
            pass

    evidence = {
        'artifact': 'Build 425 Development Product-number write evidence',
        'development_database': EXPECTED_DEV_NAME,
        'development_database_id': EXPECTED_DEV_ID,
        'candidate_start': preflight['candidate_start'],
        'candidate_end': preflight['candidate_end'],
        'candidate_next': preflight['candidate_next'],
        'backup_path': str(backup_path.relative_to(ROOT)),
        'backup_sha256': backup_sha256,
        'backup_bytes': backup_path.stat().st_size,
        'production_write_executed': False,
        'development_write_attempted': True,
    }
    APPLY_EVIDENCE.write_text(json.dumps(evidence, indent=2) + '\n', encoding='utf-8')
    print('\nBUILD 425 DEVELOPMENT WRITE: COMPLETE — POST-WRITE PROOF REQUIRED')
    print(f'Backup: {evidence["backup_path"]}')
    print(f'Backup SHA-256: {backup_sha256}')
    print('Production write executed: NO')


def postcheck() -> dict:
    validate_target_pin()
    reservation = load_reservation()
    mapping = reservation['mapping']
    expected = {as_int(row.get('product_id')): as_int(row.get('candidate_product_number')) for row in mapping}
    expected_identity = {as_int(row.get('product_id')): mapping_identity(row) for row in mapping}
    npx = base.npx_path()
    temp_obj, dev_cfg, prod_cfg = readonly_configs()
    try:
        dev_rows = product_rows(npx, dev_cfg, 'DEVELOPMENT POSTWRITE')
        prod_rows = product_rows(npx, prod_cfg, 'PRODUCTION UNTOUCHED')
        dev_seq = sequence_next(npx, dev_cfg, 'DEVELOPMENT POSTWRITE')
        prod_seq = sequence_next(npx, prod_cfg, 'PRODUCTION UNTOUCHED')
    finally:
        temp_obj.cleanup()

    dev_by_id = {as_int(row.get('product_id')): row for row in dev_rows}
    prod_by_id = {as_int(row.get('product_id')): row for row in prod_rows}
    dev_numbers = [as_int(row.get('product_number')) for row in dev_rows]
    mapped_exact = all(as_int(dev_by_id[pid].get('product_number')) == number for pid, number in expected.items())
    identities_preserved = all(identity(dev_by_id[pid]) == expected_identity[pid] for pid in expected)
    production_still_null = len(prod_rows) == EXPECTED_PRODUCTS and all(as_int(row.get('product_number')) is None for row in prod_rows)
    production_identities_preserved = all(identity(prod_by_id[pid]) == expected_identity[pid] for pid in expected)
    unique_numbers = len(dev_numbers) == EXPECTED_PRODUCTS and None not in dev_numbers and len(set(dev_numbers)) == EXPECTED_PRODUCTS
    candidate_next = as_int(reservation.get('candidate_next_product_number'))
    next_preview = max(candidate_next or 0, (max(dev_numbers) + 1) if unique_numbers else 0, dev_seq or 0)
    safe = (
        len(dev_rows) == EXPECTED_PRODUCTS
        and mapped_exact
        and identities_preserved
        and unique_numbers
        and dev_seq is not None and dev_seq >= candidate_next
        and production_still_null
        and production_identities_preserved
    )
    payload = {
        'artifact': 'Build 425 Development Product-number post-write proof',
        'pass': safe,
        'development_rows': len(dev_rows),
        'development_unique_number_count': len(set(dev_numbers)) if None not in dev_numbers else 0,
        'development_min_product_number': min(dev_numbers) if unique_numbers else None,
        'development_max_product_number': max(dev_numbers) if unique_numbers else None,
        'development_mapping_exact': mapped_exact,
        'development_identities_preserved': identities_preserved,
        'development_sequence_next': dev_seq,
        'read_only_next_allocation_preview': next_preview,
        'production_rows': len(prod_rows),
        'production_still_all_null': production_still_null,
        'production_identities_preserved': production_identities_preserved,
        'production_sequence_next': prod_seq,
        'production_write_executed': False,
    }
    POSTWRITE.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print('\n=== BUILD 425 DEVELOPMENT POST-WRITE PROOF ===')
    print(f'Development Products: {len(dev_rows)}')
    print(f'Development mapping exact: {mapped_exact}')
    print(f'Development unique Product numbers: {payload["development_unique_number_count"]}')
    print(f'Development Product-number range: {payload["development_min_product_number"]}..{payload["development_max_product_number"]}')
    print(f'Development sequence next: {dev_seq}')
    print(f'Read-only next allocation preview: {next_preview}')
    print(f'Production Products: {len(prod_rows)}')
    print(f'Production still all Product numbers NULL: {production_still_null}')
    print(f'Production sequence next: {prod_seq}')
    print('Production write executed: NO')
    print('BUILD 425 DEVELOPMENT POST-WRITE PROOF:', 'PASS' if safe else 'FAIL')
    if not safe:
        fail('Development post-write proof failed. Preserve backup and evidence; do not touch Production.')
    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--preflight', action='store_true')
    group.add_argument('--apply-development', action='store_true')
    group.add_argument('--postcheck', action='store_true')
    parser.add_argument('--confirm', default='')
    parser.add_argument('--ack-sku-overlap', action='store_true')
    args = parser.parse_args()

    if args.preflight:
        payload = build_preflight()
        print('BUILD 425 DEVELOPMENT PRODUCT NUMBER PREFLIGHT')
        print(f"Target: {payload['development_database']} ({payload['development_database_id']})")
        print(f"Candidate block: {payload['candidate_start']}..{payload['candidate_end']}")
        print(f"Candidate next: {payload['candidate_next']}")
        print(f"Identity/state/sequence fresh: {'YES' if payload['safe_to_apply_development'] else 'NO'}")
        print(f"SKU overlaps: {payload['sku_overlap_count']} (informational; review before write)")
        print('Production mutation capability: NONE')
        print('BUILD 425 DEVELOPMENT PREFLIGHT:', 'PASS' if payload['safe_to_apply_development'] else 'BLOCKED')
        return 0 if payload['safe_to_apply_development'] else 1

    if args.apply_development:
        if args.confirm != CONFIRM_TEXT:
            fail(f'explicit confirmation required: --confirm {CONFIRM_TEXT}')
        apply_development(args.ack_sku_overlap)
        return 0

    postcheck()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
