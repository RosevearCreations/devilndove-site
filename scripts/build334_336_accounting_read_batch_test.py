#!/usr/bin/env python3
"""Builds 334-336 Accounting read batch regression. No Cloudflare resource is contacted."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
def read(path): return (ROOT/path).read_text(encoding='utf-8')
def no_mutation(text,label):
    for token in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','DELETE FROM','UPDATE accounting_'):
        assert token not in text, f'{label} contains read-side mutation token: {token}'
checks=[
 (334,'accounting-statement-imports-read','functions/api/_lib/accountingStatementImportsReadService.js','functions/api/admin/contracts/accounting-statement-imports-read.js','functions/api/admin/accounting-statement-imports.js','readAccountingStatementImports'),
 (335,'accounting-reconciliation-exceptions-read','functions/api/_lib/accountingReconciliationExceptionsReadService.js','functions/api/admin/contracts/accounting-reconciliation-exceptions-read.js','functions/api/admin/accounting-reconciliation-exceptions.js','readAccountingReconciliationExceptions'),
 (336,'accounting-vendor-statements-read','functions/api/_lib/accountingVendorStatementsReadService.js','functions/api/admin/contracts/accounting-vendor-statements-read.js','functions/api/admin/accounting-vendor-statements.js','readAccountingVendorStatements'),
]
for build,cid,service_path,contract_path,legacy_path,delegate in checks:
    service=read(service_path); contract=read(contract_path); legacy=read(legacy_path)
    assert f'export const BUILD = {build}' in service
    assert cid in service and "OWNER = 'accounting'" in service
    assert 'request_time_schema_mutation:false' in service.replace(' ','')
    no_mutation(service,f'Build {build} service')
    assert 'onRequestGet' in contract and 'onRequestPost' not in contract
    get_block=legacy.split('export async function onRequestGet',1)[1].split('export async function onRequestPost',1)[0] if 'export async function onRequestPost' in legacy else legacy.split('export async function onRequestGet',1)[1]
    assert delegate in get_block
    for forbidden in ('ensureAccountingStatementImportsTables','seedProviderProfileDefaults','ensureAccountingAttachmentsTable','listAccountingAttachments'):
        assert forbidden not in get_block, f'Build {build} GET still reaches {forbidden}'

statement_post=read('functions/api/admin/accounting-statement-imports.js').split('export async function onRequestPost',1)[1]
assert 'ensureAccountingStatementImportsTables' in statement_post and 'seedProviderProfileDefaults' in statement_post and 'createStatementImportFromCsv' in statement_post
exception_post=read('functions/api/admin/accounting-reconciliation-exceptions.js').split('export async function onRequestPost',1)[1]
assert 'ensureAccountingStatementImportsTables' in exception_post and 'UPDATE accounting_reconciliation_exceptions' in exception_post
vendor_service=read('functions/api/_lib/accountingVendorStatementsReadService.js')
assert 'readAccountingAttachments' in vendor_service and 'accountingAttachmentsReadService.js' in vendor_service
contracts=read('public/js/core/dd-module-contracts.mjs'); adapters=read('public/js/core/dd-module-service-adapters.mjs')
for text in (contracts,adapters):
    match=re.search(r'export const BUILD = (\d+);',text); assert match and int(match.group(1))>=336
    for _,cid,*_ in checks: assert cid in text
print('BUILDS 334-336 ACCOUNTING READ BATCH: PASS')
print('No Cloudflare resource was contacted.')
