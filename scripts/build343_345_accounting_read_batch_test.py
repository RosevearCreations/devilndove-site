from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]

# Build 343
svc343 = read('functions/api/_lib/accountingYearEndCloseReadService.js')
legacy343 = read('functions/api/admin/accounting-year-end-close.js')
contract343 = read('functions/api/admin/contracts/accounting-year-end-close-read.js')
assert 'export const BUILD = 343' in svc343
assert "export const OWNER = 'accounting'" in svc343
assert 'request_time_schema_mutation:false' in svc343
for token in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert token not in svc343
assert 'readAccountingYearEndClose' in legacy343
assert 'ensureAccountingPeriodClosuresTable' not in legacy343
assert 'ensureAccountingGifiNotesTable' not in legacy343
assert 'ensureAccountingReconciliationReviewsTable' not in legacy343
assert 'ensureAccountingAttachmentsTable' not in legacy343
assert 'ensureAccountingStatementImportsTables' not in legacy343
assert 'ensureGlSchema' not in legacy343
assert 'onRequestPost' not in contract343

# Shared export core is read-only.
core = read('functions/api/_lib/accountingSummaryExportReadCore.js')
for token in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert token not in core
assert "['order_id','id']" in core
assert "['total_amount','total','total_cents']" in core

# Build 344
svc344 = read('functions/api/_lib/accountingMonthlySummaryExportReadService.js')
legacy344 = read('functions/api/admin/accounting-monthly-summary-export.js')
contract344 = read('functions/api/admin/contracts/accounting-monthly-summary-export-read.js')
assert 'export const BUILD = 344' in svc344
assert "export const OWNER = 'accounting'" in svc344
assert 'request_time_schema_mutation:false' in svc344
assert 'readAccountingMonthlySummaryExport' in legacy344
assert "'x-dd-request-time-schema-mutation':'false'" in legacy344
assert 'onRequestPost' not in contract344

# Build 345
svc345 = read('functions/api/_lib/accountingPeriodSummaryExportReadService.js')
legacy345 = read('functions/api/admin/accounting-period-summary-export.js')
contract345 = read('functions/api/admin/contracts/accounting-period-summary-export-read.js')
assert 'export const BUILD = 345' in svc345
assert "export const OWNER = 'accounting'" in svc345
assert 'request_time_schema_mutation:false' in svc345
assert 'readAccountingPeriodSummaryExport' in legacy345
assert "'x-dd-request-time-schema-mutation':'false'" in legacy345
assert 'onRequestPost' not in contract345

contracts = read('public/js/core/dd-module-contracts.mjs')
adapters = read('public/js/core/dd-module-service-adapters.mjs')
for marker in [
    "export const BUILD = 345",
    "accounting-year-end-close-read",
    "accounting-monthly-summary-export-read",
    "accounting-period-summary-export-read",
]:
    assert marker in contracts
    assert marker in adapters

# Business & Administration remains inactive.
groups = read('public/js/core/dd-application-module-groups.mjs')
business = section(groups, "id: 'business-administration'", ']);')
assert 'entry: null' in business
assert 'runtimeDomains: Object.freeze([])' in business

print('BUILDS 343-345 ACCOUNTING YEAR-END/EXPORT READ BATCH: PASS')
print('No Cloudflare resource was contacted.')
