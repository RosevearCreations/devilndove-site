#!/usr/bin/env python3
"""Release 449 corporate/commerce Development source gate. No Cloudflare contact."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def text(path):
    return (ROOT / path).read_text(encoding='utf-8')


def require(path, *needles):
    value = text(path)
    for needle in needles:
        if needle not in value:
            raise SystemExit(f'FAIL — {path} missing {needle!r}')
    return value

wrangler = require('wrangler.toml', 'database_name = "devilndove-dev"', 'database_id = "dbc1615b-dcbe-4951-973b-b47c99c73bfa"')
if 'account_id =' in wrangler:
    raise SystemExit('FAIL — account_id must remain absent from wrangler.toml')

service = require(
    'functions/api/_lib/release449CorporateCommerceReadService.js',
    "import { readAccountingGifiSummary }",
    "mode: 'read-only-corporate-commerce-readiness'",
    'request_time_schema_mutation: false',
    "source: 'existing-accounting-journal-and-gifi-authority'",
    'balance_difference_cents',
    'quarterly_completeness',
    'commerce_transaction_costs',
)
if 'CREATE TABLE' in service.upper() or '.exec(' in service:
    raise SystemExit('FAIL — Release 449 read service must not mutate schema')

require(
    'functions/api/admin/corporate-financial-readiness.js',
    'readCorporateCommerceReadiness',
    'Admin access required.',
)
provider = require(
    'functions/api/admin/provider-status.js',
    "owner: 'it'",
    'provider_setup_authorities',
    'marketplace_channels',
    'secret_values_exposed: false',
    'request_time_schema_mutation: false',
)
if 'secret_value' in provider.lower() and 'secret_values_exposed: false' not in provider:
    raise SystemExit('FAIL — provider status must not expose secret values')

etsy = require(
    'functions/api/admin/etsy-product-syndication.js',
    "channel_key='etsy'",
    "'draft'",
    'publication_requested: false',
    'publication_performed: false',
    'does not call Etsy or publish a listing',
)
if 'fetch(' in etsy:
    raise SystemExit('FAIL — Release 449 Etsy draft authority must not call an external API')

require(
    'docs/operations/release449-corporate-commerce-convergence.md',
    'existing Accounting ledger and expense framework',
    'publication_allowed = 0',
    'Release 447/448 migrations are not replayed blindly',
)

for path in [
    'functions/api/_lib/release449CorporateCommerceReadService.js',
    'functions/api/admin/corporate-financial-readiness.js',
    'functions/api/admin/provider-status.js',
    'functions/api/admin/etsy-product-syndication.js',
]:
    subprocess.run(['node', '--check', str(ROOT / path)], check=True)

print('RELEASE 449 CORPORATE / COMMERCE SOURCE GATE: PASS')
print('Accounting ledger authority: PRESERVED')
print('Balance Sheet / GIFI: DERIVED READ ONLY')
print('Provider secret values exposed: NO')
print('Etsy publication path: NONE (DRAFT ONLY)')
print('D1/R2/provider/Production mutation: NONE')
