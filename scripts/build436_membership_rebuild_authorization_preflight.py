#!/usr/bin/env python3
"""Build 436 read-only Membership Build 395 rebuild-execution preflight.

Reruns the complete-row Build 435 mapping proof and then inspects live Production
for dependency/collision conditions that matter to a table rebuild. This script
has no backup or mutation capability.
"""
from __future__ import annotations

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
BUILD435_SCRIPT = ROOT / 'scripts' / 'build435_membership_value_mapping_preflight.py'
BUILD435_ARTIFACT = ROOT / 'build435_membership_value_mapping_preflight.local.json'
OUTPUT = ROOT / 'build436_membership_rebuild_authorization_preflight.local.json'
PROD_NAME = 'devilndove-prod'
PROD_ID = '0dc8fa3e-319c-45f7-a515-34c8acd89fcf'
SHADOW_TABLE = 'membership_tier_policies_build436_shadow'
ASSERT_TABLE = '_build436_membership_assert'
EXPECTED_TIERS = {'bronze', 'silver', 'gold'}
CANONICAL_COLUMNS = [
    'policy_id', 'tier_code', 'title', 'short_description', 'benefits_json',
    'badge_color', 'sort_order', 'is_visible', 'created_at', 'updated_at',
]


def configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, OSError):
            pass


def fail(message: str) -> None:
    print(f'BUILD 436 MEMBERSHIP REBUILD AUTHORIZATION PREFLIGHT: FAIL — {message}', file=sys.stderr)
    raise SystemExit(1)


def stable_fingerprint(rows: list[dict]) -> str:
    encoded = json.dumps(rows, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(encoded).hexdigest()


def fresh_build435() -> dict:
    result = subprocess.run(
        [sys.executable, '-u', str(BUILD435_SCRIPT), '--run'],
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
    if result.returncode != 0 or not BUILD435_ARTIFACT.exists():
        fail('fresh Build 435 complete-row mapping proof is not green.')
    payload = json.loads(BUILD435_ARTIFACT.read_text(encoding='utf-8'))
    if payload.get('safe_to_prepare_membership_execution_boundary') is not True:
        fail('Build 435 does not prove a lossless Membership mapping.')
    return payload


def hard_target_guard() -> None:
    if base.PROD_DATABASE != PROD_NAME or base.PROD_DATABASE_ID != PROD_ID:
        fail('Production target constants do not match the Build 436 hard guard.')


def q(npx: str, cfg: Path, sql: str, label: str) -> list[dict]:
    return base.query_rows(npx, cfg, sql, f'BUILD 436 {label}')


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def inbound_foreign_keys(npx: str, cfg: Path) -> tuple[list[str], list[dict]]:
    """Find inbound Membership FKs without a dynamic table-valued PRAGMA join.

    D1 documents PRAGMA foreign_key_list("TABLE_NAME") for a fixed table. First
    narrow sqlite_schema to CREATE TABLE statements mentioning the Membership
    table, then inspect only those candidate tables with the documented PRAGMA.
    The schema-text search is only a candidate filter; the PRAGMA result is the
    authoritative FK evidence.
    """
    candidates = q(
        npx,
        cfg,
        "SELECT name,sql FROM sqlite_schema "
        "WHERE type='table' "
        "AND name NOT LIKE 'sqlite_%' "
        "AND name<>'membership_tier_policies' "
        "AND lower(COALESCE(sql,'')) LIKE '%membership_tier_policies%' "
        "ORDER BY name;",
        'PRODUCTION MEMBERSHIP INBOUND FK CANDIDATES',
    )
    candidate_names: list[str] = []
    inbound: list[dict] = []
    for candidate in candidates:
        table_name = str(candidate.get('name') or '')
        if not table_name:
            continue
        candidate_names.append(table_name)
        fk_rows = q(
            npx,
            cfg,
            f'PRAGMA foreign_key_list({quote_identifier(table_name)});',
            f'PRODUCTION MEMBERSHIP INBOUND FK CHECK {table_name}',
        )
        for fk in fk_rows:
            parent = str(fk.get('table') or fk.get('parent_table') or '')
            if parent != 'membership_tier_policies':
                continue
            inbound.append({
                'child_table': table_name,
                'id': fk.get('id'),
                'seq': fk.get('seq'),
                'from_col': fk.get('from') if 'from' in fk else fk.get('from_col'),
                'to_col': fk.get('to') if 'to' in fk else fk.get('to_col'),
                'on_update': fk.get('on_update'),
                'on_delete': fk.get('on_delete'),
                'match': fk.get('match'),
            })
    return candidate_names, inbound


def main() -> int:
    configure_console()
    if len(sys.argv) != 2 or sys.argv[1] != '--run':
        print('Run explicitly with:')
        print('  python -u scripts/build436_membership_rebuild_authorization_preflight.py --run')
        return 2

    mapping = fresh_build435()
    hard_target_guard()
    npx = base.npx_path()

    print('BUILD 436 MEMBERSHIP BUILD 395 REBUILD AUTHORIZATION PREFLIGHT')
    print(f'Production target: {PROD_NAME} ({PROD_ID})')
    print('Build 435 lossless complete-row mapping: PASS')
    print('D1 mutation capability: NONE')
    print('R2/provider mutation capability: NONE')

    with tempfile.TemporaryDirectory(prefix='dd-build436-membership-preflight-') as td:
        cfg = Path(td) / 'prod.toml'
        cfg.write_text(base.readonly_config(base.PROD_PROJECT, PROD_NAME, PROD_ID), encoding='utf-8')
        user_objects = q(
            npx, cfg,
            "SELECT type,name,sql FROM sqlite_schema WHERE tbl_name='membership_tier_policies' AND type IN ('index','trigger') AND sql IS NOT NULL ORDER BY type,name;",
            'PRODUCTION MEMBERSHIP USER OBJECTS',
        )
        outbound_fks = q(
            npx,
            cfg,
            'PRAGMA foreign_key_list("membership_tier_policies");',
            'PRODUCTION MEMBERSHIP OUTBOUND FKS',
        )
        inbound_fk_candidates, inbound_fks = inbound_foreign_keys(npx, cfg)
        collisions = q(
            npx, cfg,
            f"SELECT type,name,sql FROM sqlite_schema WHERE name IN ('{SHADOW_TABLE}','{ASSERT_TABLE}') ORDER BY name;",
            'PRODUCTION MEMBERSHIP REBUILD NAME COLLISIONS',
        )
        sequence_rows = q(
            npx, cfg,
            "SELECT name,seq FROM sqlite_sequence WHERE name='membership_tier_policies';",
            'PRODUCTION MEMBERSHIP SEQUENCE',
        )

    canonical_rows = list(mapping.get('canonical_preview_rows') or [])
    source_rows = list(mapping.get('source_rows') or [])
    canonical_sha = stable_fingerprint(canonical_rows)
    source_sha = str(mapping.get('source_rows_sha256') or '')
    policy_ids = [row.get('policy_id') for row in canonical_rows]
    ids_valid = (
        len(policy_ids) == 3
        and len(set(policy_ids)) == 3
        and all(isinstance(value, int) and value > 0 for value in policy_ids)
    )
    required_values_nonnull = (
        len(canonical_rows) == 3
        and all(all(row.get(column) is not None for column in CANONICAL_COLUMNS) for row in canonical_rows)
    )
    tiers_exact = {row.get('tier_code') for row in canonical_rows} == EXPECTED_TIERS
    no_user_objects = len(user_objects) == 0
    no_outbound_fks = len(outbound_fks) == 0
    no_inbound_fks = len(inbound_fks) == 0
    no_collisions = len(collisions) == 0
    sequence_value = int(sequence_rows[0].get('seq') or 0) if sequence_rows else None
    sequence_compatible = sequence_value is None or sequence_value >= max(policy_ids)

    safe = all([
        mapping.get('lossless_mapping_possible') is True,
        mapping.get('exact_legacy_shape') is True,
        mapping.get('membership_row_count') == 3,
        mapping.get('raw_codes_exact') is True,
        mapping.get('title_values_exact_equal') is True,
        len(source_sha) == 64,
        len(canonical_sha) == 64,
        ids_valid,
        required_values_nonnull,
        tiers_exact,
        no_user_objects,
        no_outbound_fks,
        no_inbound_fks,
        no_collisions,
        sequence_compatible,
    ])

    payload = {
        'artifact': 'Build 436 Membership Build 395 rebuild authorization preflight',
        'production_database': PROD_NAME,
        'production_database_id': PROD_ID,
        'build435_mapping_green': mapping.get('lossless_mapping_possible') is True,
        'source_rows_sha256': source_sha,
        'canonical_preview_sha256': canonical_sha,
        'membership_row_count': mapping.get('membership_row_count'),
        'raw_codes': mapping.get('raw_codes'),
        'canonical_preview_rows': canonical_rows,
        'policy_ids': policy_ids,
        'policy_ids_valid': ids_valid,
        'canonical_required_values_nonnull': required_values_nonnull,
        'canonical_tiers_exact': tiers_exact,
        'user_defined_indexes_or_triggers': user_objects,
        'no_user_defined_indexes_or_triggers': no_user_objects,
        'outbound_foreign_keys': outbound_fks,
        'no_outbound_foreign_keys': no_outbound_fks,
        'inbound_fk_candidate_tables': inbound_fk_candidates,
        'inbound_foreign_keys': inbound_fks,
        'no_inbound_foreign_keys': no_inbound_fks,
        'rebuild_name_collisions': collisions,
        'no_rebuild_name_collisions': no_collisions,
        'legacy_sequence_value': sequence_value,
        'legacy_sequence_compatible': sequence_compatible,
        'safe_to_request_membership_rebuild_authorization': safe,
        'production_backup_created': False,
        'membership_rebuild_authorization_received': False,
        'production_mutation_executed': False,
        'later_rebuild_authorization_received': False,
        'production_promotion_open': False,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    print('\n=== BUILD 436 MEMBERSHIP REBUILD AUTHORIZATION BOUNDARY ===')
    print(f'Membership rows: {payload["membership_row_count"]}')
    print(f'Source-row SHA-256: {source_sha}')
    print(f'Canonical-preview SHA-256: {canonical_sha}')
    print(f'Policy IDs valid/unique/positive: {ids_valid} / {policy_ids}')
    print(f'Canonical required values non-null: {required_values_nonnull}')
    print(f'Canonical tiers exact: {tiers_exact}')
    print(f'User-defined Membership indexes/triggers: {len(user_objects)}')
    print(f'Outbound Membership foreign keys: {len(outbound_fks)}')
    print(f'Inbound FK candidate tables: {len(inbound_fk_candidates)} / {inbound_fk_candidates}')
    print(f'Inbound Membership foreign keys: {len(inbound_fks)}')
    print(f'Rebuild-name collisions: {len(collisions)}')
    print(f'Legacy sqlite_sequence: {sequence_value!r} / compatible={sequence_compatible}')
    print(f'Safe to request Membership rebuild authorization: {safe}')
    print('Production backup created: NO')
    print('Membership rebuild authorization received: NO')
    print('Production mutation executed: NO')
    print('Later rebuild authorization: NOT RECEIVED')
    print('PRODUCTION PROMOTION: CLOSED')
    print('BUILD 436 MEMBERSHIP REBUILD AUTHORIZATION PREFLIGHT:', 'PASS' if safe else 'BLOCKED')
    return 0 if safe else 1


if __name__ == '__main__':
    raise SystemExit(main())
