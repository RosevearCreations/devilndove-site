#!/usr/bin/env python3
"""Builds 337-339 Accounting automatic-read regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def read(path): return (ROOT/path).read_text(encoding='utf-8')
def no_mutation(text,label):
    upper=text.upper()
    for token in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','DELETE FROM','UPDATE '):
        assert token not in upper, f'{label} contains mutation/DDL token: {token}'
checks=[
 (337,'accounting-sales-tax-filing-read','functions/api/_lib/accountingSalesTaxFilingReadService.js','functions/api/admin/contracts/accounting-sales-tax-filing-read.js','functions/api/admin/accounting-sales-tax-filing.js','readAccountingSalesTaxFiling'),
 (338,'accounting-fixed-assets-read','functions/api/_lib/accountingFixedAssetsReadService.js','functions/api/admin/contracts/accounting-fixed-assets-read.js','functions/api/admin/accounting-fixed-assets.js','readAccountingFixedAssets'),
 (339,'accounting-evidence-check-read','functions/api/_lib/accountingEvidenceCheckReadService.js','functions/api/admin/contracts/accounting-evidence-check-read.js','functions/api/admin/accounting-evidence-check.js','readAccountingEvidenceCheck'),
]
for build,cid,service_path,contract_path,legacy_path,delegate in checks:
    service=read(service_path); contract=read(contract_path); legacy=read(legacy_path)
    assert f'export const BUILD = {build};' in service and cid in service and "OWNER = 'accounting'" in service
    assert 'request_time_schema_mutation: false' in service or 'request_time_schema_mutation:false' in service.replace(' ','')
    no_mutation(service,f'Build {build} service')
    assert 'onRequestGet' in contract and 'onRequestPost' not in contract
    get_block=legacy.split('export async function onRequestGet',1)[1]
    if 'export async function onRequestPost' in get_block: get_block=get_block.split('export async function onRequestPost',1)[0]
    assert delegate in get_block and 'CREATE TABLE' not in get_block and 'ALTER TABLE' not in get_block
fixed_post=read('functions/api/admin/accounting-fixed-assets.js').split('export async function onRequestPost',1)[1]
assert 'ensureFixedAssetsTable' in fixed_post and 'INSERT INTO accounting_fixed_assets' in fixed_post
contracts=read('public/js/core/dd-module-contracts.mjs'); adapters=read('public/js/core/dd-module-service-adapters.mjs')
for text in (contracts,adapters):
    m=re.search(r'export const BUILD = (\d+);',text); assert m and int(m.group(1))>=339
    for _,cid,*_ in checks: assert cid in text
print('BUILDS 337-339 ACCOUNTING READ BATCH: PASS')
print('No Cloudflare resource was contacted.')
