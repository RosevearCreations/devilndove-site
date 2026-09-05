#!/usr/bin/env python3
"""Release-neutral guard for Product Social Automation baseline schema ownership."""
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
authority = load('release467-build40-product-social-automation-runtime-ddl-elimination.json')
manifest = load('migrations/canonical/manifest.json')
helper = read('functions/api/_lib/productSocialAutomation.js')
runtime_gate = read('scripts/runtime_schema_mutation_gate.py')

pointer_release = int(pointer.get('release') or 0)
pointer_build = int(pointer.get('build') or 0)
req(pointer_release == 467, 'current Development pointer must remain Release 467')
req(pointer_build >= 40, 'Build 40 Product Social authority requires current pointer Build 40 or later')
req(int(authority.get('release') or 0) == 467 and int(authority.get('build') or 0) == 40, 'Build 40 Product Social authority identity drifted')
req(authority.get('title') == 'Product Social Automation Runtime-DDL Elimination & Baseline Schema Convergence', 'Build 40 title drifted')
req(authority.get('state') in ('FEATURE_CANDIDATE', 'DEVELOPMENT_GREEN'), 'Build 40 authority must be candidate or Development GREEN')

for token in (
    'REQUIRED_SETTINGS_COLUMNS',
    'REQUIRED_QUEUE_COLUMNS',
    'product_social_automation_settings',
    'social_post_queue',
    'requireProductSocialAutomationSchema',
    'PRAGMA table_info(${tableName})',
    'product_social_automation_schema_not_ready',
    'runtime schema repair is disabled',
    'INSERT OR IGNORE INTO product_social_automation_settings',
    'INSERT INTO social_post_queue',
    "approval_status, post_status",
    "'needs_review', 'draft'",
    "'needs_review', 0, 'review_first'",
    'updateProductSocialAutomationSettings',
):
    req(token in helper, f'Product Social runtime contract missing: {token}')
req(not DDL.search(helper), 'Product Social Automation helper carries request-time schema DDL')
req('provider' not in (authority.get('scope') or {}) or (authority.get('scope') or {}).get('provider_execution_added') is False, 'Product Social scope must not add provider execution')

for token in ('MAX_DDL_FILES = 58', 'MAX_DDL_OCCURRENCES = 522', 'MAX_DELEGATED_LIBRARIES = 2'):
    req(token in runtime_gate, f'Build 40 runtime-schema ratchet missing: {token}')
req('functions/api/_lib/productSocialAutomation.js regained request-time schema DDL after Build 40 cleanup' in runtime_gate, 'Runtime schema gate does not pin Product Social cleanup')

migrations = manifest.get('migrations') if isinstance(manifest.get('migrations'), list) else []
files = [str(row.get('file') or '') for row in migrations if isinstance(row, dict)]
req(files == CANONICAL, 'Build 40 must preserve the existing four-file canonical migration stream')
req(not list((ROOT / 'migrations/canonical').glob('0005*')), 'Build 40 must not invent migration 0005 for proven Product Social baseline schema')

scope = authority.get('scope') or {}
req(scope.get('product_social_settings_baseline_assertion') is True, 'Build 40 settings baseline assertion scope missing')
req(scope.get('social_post_queue_baseline_assertion') is True, 'Build 40 queue baseline assertion scope missing')
req(scope.get('runtime_product_social_schema_ddl_removed') is True, 'Build 40 Product Social DDL removal scope missing')
req(int(scope.get('required_settings_columns') or 0) == 12, 'Build 40 required settings-column count drifted')
req(int(scope.get('required_queue_columns') or 0) == 33, 'Build 40 required queue-column count drifted')
req(scope.get('settings_row_dml_preserved') is True, 'Build 40 settings-row DML preservation scope missing')
req(scope.get('review_first_queue_dml_preserved') is True, 'Build 40 review-first queue DML preservation scope missing')
req(scope.get('missing_schema_fails_closed') is True, 'Build 40 fail-closed schema scope missing')
req(scope.get('provider_execution_added') is False, 'Build 40 must not add provider execution')
req(scope.get('provider_publication_added') is False, 'Build 40 must not add provider publication')
req(int(scope.get('runtime_schema_residue_files_ceiling_after') or 0) <= 58, 'Build 40 runtime DDL file ceiling weakened')
req(int(scope.get('runtime_schema_residue_occurrences_ceiling_after') or 0) <= 522, 'Build 40 runtime DDL occurrence ceiling weakened')
req(int(scope.get('runtime_schema_residue_shared_helpers_ceiling_after') or 0) <= 2, 'Build 40 shared-helper DDL ceiling weakened')
req(int(scope.get('raw_d1_bypass_with_ddl_ceiling', -1)) == 0, 'Build 40 raw D1 bypass ceiling weakened')
req(scope.get('canonical_migration_stream_unchanged') is True and int(scope.get('canonical_migration_count') or 0) == 4, 'Build 40 canonical migration boundary drifted')

safety = authority.get('safety') or {}
for key in (
    'schema_change_authorized',
    'r2_mutation_authorized',
    'provider_execution_authorized',
    'provider_publication_authorized',
    'cloudflare_access_mutation_authorized',
    'main_mutation_authorized',
    'production_mutation_authorized',
    'rollback_execution_authorized',
    'automatic_production_promotion_authorized',
):
    req(safety.get(key) is False, f'Build 40 safety boundary weakened: {key}')
req(safety.get('secret_values_emitted') is False, 'Build 40 must not emit secret values')

if FAIL:
    print('CURRENT PRODUCT SOCIAL AUTOMATION SCHEMA AUTHORITY GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT PRODUCT SOCIAL AUTOMATION SCHEMA AUTHORITY GATE: PASS')
print('Product Social settings schema: PROVEN BASELINE / READ-ONLY ASSERTION')
print('Social post queue schema: PROVEN BASELINE / READ-ONLY ASSERTION')
print('Product Social request-time DDL: ZERO')
print('Runtime schema residue ceiling: 58 files / 522 statements / 2 delegated helpers')
print('Canonical migration stream: UNCHANGED 0001-0004')
print('Settings and review-first queue DML: PRESERVED')
print('Provider publication/execution: CLOSED')
