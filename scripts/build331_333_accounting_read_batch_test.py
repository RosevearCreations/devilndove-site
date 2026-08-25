#!/usr/bin/env python3
"""Builds 331-333 Accounting read batch regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def no_read_mutation(text, label):
    for forbidden in ('CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'INSERT INTO', 'DELETE FROM'):
        assert forbidden not in text, f'{label} contains mutation/DDL token: {forbidden}'

checks = [
    (331, 'accounting-vendors-read', 'functions/api/_lib/accountingVendorsReadService.js', 'functions/api/admin/contracts/accounting-vendors-read.js', 'functions/api/admin/accounting-vendors.js', 'readAccountingVendors', 'ensureAccountingVendorsTable'),
    (332, 'accounting-recurring-expense-rules-read', 'functions/api/_lib/accountingRecurringExpenseRulesReadService.js', 'functions/api/admin/contracts/accounting-recurring-expense-rules-read.js', 'functions/api/admin/accounting-recurring-expense-rules.js', 'readAccountingRecurringExpenseRules', 'ensureRecurringRulesTable'),
    (333, 'accounting-statement-provider-profiles-read', 'functions/api/_lib/accountingStatementProviderProfilesReadService.js', 'functions/api/admin/contracts/accounting-statement-provider-profiles-read.js', 'functions/api/admin/accounting-statement-provider-profiles.js', 'readAccountingStatementProviderProfiles', 'seedDefaults'),
]

for build, contract_id, service_path, contract_path, legacy_path, delegate, forbidden_get_helper in checks:
    service = read(service_path)
    contract = read(contract_path)
    legacy = read(legacy_path)
    assert f'export const BUILD = {build}' in service
    assert contract_id in service
    assert "OWNER = 'accounting'" in service
    assert 'request_time_schema_mutation:false' in service.replace(' ', '') or 'request_time_schema_mutation: false' in service
    no_read_mutation(service, f'Build {build} read service')
    assert 'onRequestGet' in contract and 'onRequestPost' not in contract
    get_block = legacy.split('export async function onRequestGet', 1)[1].split('export async function onRequestPost', 1)[0]
    assert delegate in get_block, f'Build {build} legacy GET does not delegate'
    assert forbidden_get_helper not in get_block, f'Build {build} legacy GET still reaches write/schema helper {forbidden_get_helper}'
    assert 'CREATE TABLE' not in get_block and 'ALTER TABLE' not in get_block and 'INSERT INTO' not in get_block

vendor_post = read('functions/api/admin/accounting-vendors.js').split('export async function onRequestPost', 1)[1]
assert 'ensureAccountingVendorsTable' in vendor_post and 'INSERT INTO accounting_vendors' in vendor_post

recurring_post = read('functions/api/admin/accounting-recurring-expense-rules.js').split('export async function onRequestPost', 1)[1]
assert 'ensureRecurringRulesTable' in recurring_post and 'ensureExpenseTableExtensions' in recurring_post

profiles = read('functions/api/admin/accounting-statement-provider-profiles.js')
profiles_get = profiles.split('export async function onRequestGet', 1)[1].split('export async function onRequestPost', 1)[0]
profiles_post = profiles.split('export async function onRequestPost', 1)[1]
assert 'seedDefaults' not in profiles_get
assert 'seedDefaults' in profiles_post
assert 'DEFAULT_PROFILES' in read('functions/api/_lib/accountingStatementProviderProfilesReadService.js')
assert 'defaults_materialized:false' in read('functions/api/_lib/accountingStatementProviderProfilesReadService.js').replace(' ', '')

contracts = read('public/js/core/dd-module-contracts.mjs')
adapters = read('public/js/core/dd-module-service-adapters.mjs')
for text in (contracts, adapters):
    match = re.search(r'export const BUILD = (\d+);', text)
    assert match and int(match.group(1)) >= 333
    for contract_id in (item[1] for item in checks):
        assert contract_id in text

print('BUILDS 331-333 ACCOUNTING READ BATCH: PASS')
print('No Cloudflare resource was contacted.')
