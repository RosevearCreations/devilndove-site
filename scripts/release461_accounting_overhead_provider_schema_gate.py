#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
overhead_route = ROOT / 'functions/api/admin/accounting-overhead-allocations.js'
overhead_product_route = ROOT / 'functions/api/admin/accounting-overhead-product-allocations.js'
provider_route = ROOT / 'functions/api/admin/accounting-statement-provider-profiles.js'
overhead_read = ROOT / 'functions/api/_lib/accountingOverheadAllocationsReadService.js'
overhead_product_read = ROOT / 'functions/api/_lib/accountingOverheadProductAllocationsReadService.js'
provider_read = ROOT / 'functions/api/_lib/accountingStatementProviderProfilesReadService.js'
migration = ROOT / 'migrations/dev/20260830_release461_accounting_overhead_provider_schema_authority.sql'
release_marker = ROOT / 'development-release.json'

DDL = re.compile(r'\b(?:CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX|DROP\s+TABLE|DROP\s+INDEX)\b', re.I)

runtime_paths = (overhead_route, overhead_product_route, provider_route, overhead_read, overhead_product_read, provider_read)
for path in runtime_paths:
    text = path.read_text(encoding='utf-8')
    assert not DDL.search(text), f'accounting overhead/provider runtime DDL remains in {path}'

for path, tokens in (
    (overhead_route, (
        'PRAGMA table_info(', 'PRAGMA index_list(', 'ensureTable', 'accounting_overhead_allocations',
        'idx_accounting_overhead_allocations_period', 'assertAccountingPeriodOpen',
        'Apply the current Development migration authority.',
    )),
    (overhead_product_route, (
        'PRAGMA table_info(', 'PRAGMA index_list(', 'ensureTable', 'accounting_overhead_product_allocations',
        'idx_accounting_overhead_product_allocations_month', 'idx_accounting_overhead_product_allocations_product',
        'assertAccountingPeriodOpen', 'Apply the current Development migration authority.',
    )),
    (provider_route, (
        'PRAGMA table_info(', 'PRAGMA index_list(', 'ensureProviderProfilesTable',
        'accounting_statement_provider_profiles', 'idx_accounting_statement_provider_profiles_active',
        "action === 'seed_defaults'", 'await seedDefaults(db);', 'accounting_statement_provider_profiles_seed_defaults',
        'Apply the current Development migration authority.',
    )),
):
    text = path.read_text(encoding='utf-8')
    for token in tokens:
        assert token in text, f'missing read-only accounting overhead/provider token {token} in {path}'

provider_text = provider_route.read_text(encoding='utf-8')
seed_call = 'await seedDefaults(db);'
assert provider_text.count(seed_call) == 1, 'provider defaults must materialize only through the explicit seed_defaults action'
assert provider_text.find("action === 'seed_defaults'") < provider_text.find(seed_call), 'seedDefaults must remain behind explicit seed_defaults action'

for path, tokens in (
    (overhead_read, ('request_time_schema_mutation: false', 'PRAGMA table_info(', "AUTHORITY_TABLE = 'accounting_overhead_allocations'")),
    (overhead_product_read, ('request_time_schema_mutation: false', 'PRAGMA table_info(', "AUTHORITY_TABLE = 'accounting_overhead_product_allocations'")),
    (provider_read, ('request_time_schema_mutation:false', 'PRAGMA table_info(', "AUTHORITY_TABLE = 'accounting_statement_provider_profiles'", 'defaults_materialized:false', 'in-memory-defaults')),
):
    text = path.read_text(encoding='utf-8')
    for token in tokens:
        assert token in text, f'missing read-only service token {token} in {path}'

migration_text = migration.read_text(encoding='utf-8')
assert not re.search(r'\bALTER\s+TABLE\b|\bDROP\s+TABLE\b|\bDROP\s+INDEX\b', migration_text, re.I)
assert not re.search(r'\bINSERT\s+INTO\s+accounting_statement_provider_profiles\b', migration_text, re.I), 'provider migration must not materialize default business rows'
for token in (
    'CREATE TABLE IF NOT EXISTS accounting_overhead_allocations', 'allocation_id', 'period_month', 'ledger_code',
    'ledger_name', 'allocation_basis', 'amount_cents', 'idx_accounting_overhead_allocations_period',
    'CREATE TABLE IF NOT EXISTS accounting_overhead_product_allocations', 'overhead_product_allocation_id', 'product_id',
    'idx_accounting_overhead_product_allocations_month', 'idx_accounting_overhead_product_allocations_product',
    'CREATE TABLE IF NOT EXISTS accounting_statement_provider_profiles', 'accounting_statement_provider_profile_id',
    'provider_scope', 'display_name', 'date_column', 'description_column', 'gross_column', 'fee_column', 'net_column',
    'currency_column', 'reference_column', 'default_currency', 'mapping_json', 'is_active',
    'idx_accounting_statement_provider_profiles_active', 'PRAGMA foreign_key_check',
):
    assert token in migration_text, f'accounting overhead/provider migration is missing authority token: {token}'

release_text = release_marker.read_text(encoding='utf-8')
assert re.search(r'"release"\s*:\s*460\b', release_text), 'development-release.json must remain at accepted Release 460 until manual D1 acceptance'

for path in runtime_paths:
    subprocess.run(['node', '--check', str(path)], cwd=ROOT, check=True)

print('RELEASE 461 ACCOUNTING OVERHEAD/PROVIDER SCHEMA SOURCE GATE: PASS')
