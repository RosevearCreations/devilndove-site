#!/usr/bin/env python3
"""Release-neutral guard for Product Numbering baseline schema ownership."""
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
authority = load('release467-build39-product-numbering-runtime-ddl-elimination.json')
manifest = load('migrations/canonical/manifest.json')
numbering = read('functions/api/admin/_product-numbering.js')
desktop = read('functions/api/admin/create-product.js')
mobile = read('functions/api/admin/mobile-create-product.js')
runtime_gate = read('scripts/runtime_schema_mutation_gate.py')

pointer_release = int(pointer.get('release') or 0)
pointer_build = int(pointer.get('build') or 0)
req(pointer_release == 467, 'current Development pointer must remain Release 467')
req(pointer_build in (38, 39), 'Build 39 Product Numbering authority requires current pointer Build 38 or 39')
req(int(authority.get('release') or 0) == 467 and int(authority.get('build') or 0) == 39, 'Build 39 Product Numbering authority identity drifted')
req(authority.get('title') == 'Product Numbering Runtime-DDL Elimination & Sequence Safety Convergence', 'Build 39 title drifted')
req(authority.get('state') in ('FEATURE_CANDIDATE', 'DEVELOPMENT_GREEN'), 'Build 39 authority must be candidate or Development GREEN')

for token in (
    'PRODUCT_SEQUENCE_TABLE',
    'catalog_product_number_sequence',
    "REQUIRED_SEQUENCE_COLUMNS = ['sequence_key', 'next_product_number', 'updated_at']",
    'requireProductNumberSequenceSchema',
    'PRAGMA table_info(${PRODUCT_SEQUENCE_TABLE})',
    'product_number_sequence_schema_not_ready',
    'ensureProductNumberSequenceAtLeast',
    'getNextProductNumber',
    'allocateNextProductNumber',
    'INSERT INTO catalog_product_number_sequence',
    'ON CONFLICT(sequence_key) DO UPDATE',
    'UPDATE catalog_product_number_sequence',
    'RETURNING next_product_number - 1 AS product_number',
    'product_number_sequence_allocation_failed',
):
    req(token in numbering, f'Product Numbering runtime contract missing: {token}')
req(not DDL.search(numbering), 'Product Numbering helper carries request-time schema DDL')

for token in ('allocateNextProductNumber', 'ensureProductNumberSequenceAtLeast', 'getNextProductNumber'):
    req(token in desktop, f'Desktop product creation lost Product Numbering contract: {token}')
    req(token in mobile, f'Mobile product creation lost Product Numbering contract: {token}')

for token in ('MAX_DDL_FILES = 59', 'MAX_DDL_OCCURRENCES = 525', 'MAX_DELEGATED_LIBRARIES = 3'):
    req(token in runtime_gate, f'Build 39 runtime-schema ratchet missing: {token}')
req('functions/api/admin/_product-numbering.js regained request-time schema DDL after Build 39 cleanup' in runtime_gate, 'Runtime schema gate does not pin Product Numbering cleanup')

migrations = manifest.get('migrations') if isinstance(manifest.get('migrations'), list) else []
files = [str(row.get('file') or '') for row in migrations if isinstance(row, dict)]
req(files == CANONICAL, 'Build 39 must preserve the existing four-file canonical migration stream')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 39 must not invent migration 0005 for proven baseline Product Numbering schema')

scope = authority.get('scope') or {}
req(scope.get('product_number_sequence_baseline_assertion') is True, 'Build 39 sequence baseline assertion scope missing')
req(scope.get('runtime_product_numbering_schema_ddl_removed') is True, 'Build 39 Product Numbering DDL removal scope missing')
req(int(scope.get('required_sequence_columns') or 0) == 3, 'Build 39 required sequence-column count drifted')
req(scope.get('required_sequence_column_names') == ['sequence_key', 'next_product_number', 'updated_at'], 'Build 39 required sequence-column names drifted')
req(scope.get('desktop_product_creation_allocation_preserved') is True, 'Desktop product allocation preservation scope missing')
req(scope.get('mobile_product_creation_allocation_preserved') is True, 'Mobile product allocation preservation scope missing')
req(scope.get('missing_sequence_schema_fails_closed') is True, 'Build 39 fail-closed sequence-schema scope missing')
req(int(scope.get('runtime_schema_residue_files_ceiling_after') or 0) <= 59, 'Build 39 runtime DDL file ceiling weakened')
req(int(scope.get('runtime_schema_residue_occurrences_ceiling_after') or 0) <= 525, 'Build 39 runtime DDL occurrence ceiling weakened')
req(int(scope.get('runtime_schema_residue_shared_helpers_ceiling_after') or 0) <= 3, 'Build 39 shared-helper DDL ceiling weakened')
req(int(scope.get('raw_d1_bypass_with_ddl_ceiling', -1)) == 0, 'Build 39 raw D1 bypass ceiling weakened')
req(scope.get('canonical_migration_stream_unchanged') is True and int(scope.get('canonical_migration_count') or 0) == 4, 'Build 39 canonical migration boundary drifted')

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
    req(safety.get(key) is False, f'Build 39 safety boundary weakened: {key}')
req(safety.get('secret_values_emitted') is False, 'Build 39 must not emit secret values')

if FAIL:
    print('CURRENT PRODUCT NUMBERING SCHEMA AUTHORITY GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT PRODUCT NUMBERING SCHEMA AUTHORITY GATE: PASS')
print('Product-number sequence schema: PROVEN BASELINE / READ-ONLY ASSERTION')
print('Product-numbering request-time DDL: ZERO')
print('Runtime schema residue ceiling: 59 files / 525 statements / 3 delegated helpers')
print('Canonical migration stream: UNCHANGED 0001-0004')
print('Desktop/mobile product-number allocation: PRESERVED / FAIL-CLOSED ON SCHEMA DRIFT')
