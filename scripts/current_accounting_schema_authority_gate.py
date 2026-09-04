#!/usr/bin/env python3
"""Release-neutral guard for Accounting core baseline schema ownership."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []
DDL = re.compile(r"(?:CREATE\s+(?:TABLE|INDEX|TRIGGER|VIEW)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|TRIGGER|VIEW)|VACUUM\b|REINDEX\b)", re.I)
CANONICAL = [
    '0001_release464_migration_authority.sql',
    '0002_release464_operational_acceptance.sql',
    '0003_release464_business_growth.sql',
    '0004_release465_storefront_quality.sql',
]


def req(ok, msg):
    if not ok:
        FAIL.append(msg)


def read(path):
    target = ROOT / path
    if not target.is_file():
        FAIL.append(f'missing required file: {path}')
        return ''
    return target.read_text(encoding='utf-8', errors='replace')


def load(path):
    try:
        return json.loads(read(path) or '{}')
    except json.JSONDecodeError as exc:
        FAIL.append(f'invalid JSON {path}: {exc}')
        return {}


pointer = load('current-development-authority.json')
authority = load('release467-build38-accounting-core-runtime-ddl-elimination.json')
manifest = load('migrations/canonical/manifest.json')
accounting = read('functions/api/_lib/accounting.js')

pointer_release = int(pointer.get('release') or 0)
pointer_build = int(pointer.get('build') or 0)
req(pointer_release == 467, 'current Development pointer must remain Release 467')
req(pointer_build in (37, 38), 'Build 38 Accounting authority requires current pointer Build 37 or 38')
req(int(authority.get('release') or 0) == 467 and int(authority.get('build') or 0) == 38, 'Build 38 Accounting authority identity drifted')
req(authority.get('title') == 'Accounting Core Runtime-DDL Elimination & Baseline Schema Assertion', 'Build 38 title drifted')
req(authority.get('state') in ('FEATURE_CANDIDATE', 'DEVELOPMENT_GREEN'), 'Build 38 authority must be candidate or Development GREEN')

req('ensureAccountingSchema' in accounting, 'Accounting schema assertion function is missing')
req('PRAGMA table_info(accounting_order_records)' in accounting, 'Accounting baseline column assertion is missing')
req('PRAGMA index_list(accounting_order_records)' in accounting, 'Accounting baseline index assertion is missing')
for token in (
    'idx_accounting_order_records_status',
    'idx_accounting_order_records_customer_email',
    'accounting_baseline_schema_not_ready',
    'syncAccountingForOrder',
    'INSERT INTO accounting_order_records',
    'ON CONFLICT(order_id) DO UPDATE',
):
    req(token in accounting, f'Accounting runtime contract missing: {token}')
req(not DDL.search(accounting), 'Accounting core carries request-time schema DDL')

migrations = manifest.get('migrations') if isinstance(manifest.get('migrations'), list) else []
files = [str(row.get('file') or '') for row in migrations if isinstance(row, dict)]
req(files == CANONICAL, 'Build 38 must preserve the existing four-file canonical migration stream')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 38 must not invent migration 0005 for proven baseline Accounting schema')

scope = authority.get('scope') or {}
req(scope.get('accounting_order_records_baseline_assertion') is True, 'Build 38 baseline assertion scope missing')
req(scope.get('runtime_accounting_schema_ddl_removed') is True, 'Build 38 runtime DDL removal scope missing')
req(int(scope.get('accounting_required_columns') or 0) == 22, 'Build 38 Accounting required-column count drifted')
req(int(scope.get('accounting_required_indexes') or 0) == 2, 'Build 38 Accounting required-index count drifted')
req(int(scope.get('runtime_schema_residue_files_ceiling_after') or 0) <= 60, 'Build 38 runtime DDL file ceiling weakened')
req(int(scope.get('runtime_schema_residue_occurrences_ceiling_after') or 0) <= 526, 'Build 38 runtime DDL occurrence ceiling weakened')
req(int(scope.get('runtime_schema_residue_shared_helpers_ceiling_after') or 0) <= 4, 'Build 38 shared-helper DDL ceiling weakened')
req(scope.get('canonical_migration_stream_unchanged') is True and int(scope.get('canonical_migration_count') or 0) == 4, 'Build 38 canonical migration boundary drifted')

safety = authority.get('safety') or {}
for key in (
    'schema_change_authorized',
    'd1_business_data_mutation_authorized',
    'r2_mutation_authorized',
    'provider_execution_authorized',
    'provider_publication_authorized',
    'cloudflare_access_mutation_authorized',
    'main_mutation_authorized',
    'production_mutation_authorized',
    'rollback_execution_authorized',
    'automatic_production_promotion_authorized',
):
    req(safety.get(key) is False, f'Build 38 safety boundary weakened: {key}')
req(safety.get('secret_values_emitted') is False, 'Build 38 must not emit secret values')

if FAIL:
    print('CURRENT ACCOUNTING SCHEMA AUTHORITY GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT ACCOUNTING SCHEMA AUTHORITY GATE: PASS')
print('Accounting order-record schema: PROVEN BASELINE / READ-ONLY ASSERTION')
print('Accounting request-time DDL: ZERO')
print('Canonical migration stream: UNCHANGED 0001-0004')
print('Business accounting write path: PRESERVED')
