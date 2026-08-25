from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

index = read('admin/accounting/index.html')
groups = read('public/js/core/dd-application-module-groups.mjs')
runtime = read('public/js/modules/business-administration/runtime.mjs')
admin_js = read('public/js/admin.js')
contracts = read('public/js/core/dd-module-contracts.mjs')
adapters = read('public/js/core/dd-module-service-adapters.mjs')
t2 = read('public/js/admin-accounting-t2-presets.js')

accounting_scripts = [
    'admin-accounting-report.js',
    'admin-accounting-backend.js',
    'admin-accounting-t2-presets.js',
    'admin-accounting-advanced.js',
    'admin-accounting-imports.js',
    'admin-accounting-statement-profiles.js',
    'admin-accounting-close-workflow.js',
    'admin-accounting-evidence-check.js',
]
for name in accounting_scripts:
    assert f'/public/js/{name}' in index, name

assert '/api/admin/' not in t2
assert 'admin.js?v=348' in index
assert "dd-admin-module-runtime.mjs?v=348" in admin_js

assert 'export const ACCOUNTING_STARTUP_READ_AUDIT_BUILD = 346' in groups
assert 'export const BUSINESS_ADMINISTRATION_RUNTIME_IMPLEMENTATION_BUILD = 347' in groups
assert 'export const BUSINESS_ADMINISTRATION_RUNTIME_COVERAGE_BUILD = 348' in groups
assert "id: 'business-administration'" in groups
assert "entry: '../modules/business-administration/runtime.mjs?v=347'" in groups
assert "runtimeDomains: Object.freeze(['accounting'])" in groups
assert "'/admin/accounting/'" in groups

assert 'const BUILD = 347' in runtime
assert 'const ACTIVATION_BUILD = 348' in runtime
assert "const MODULE_ID = 'business-administration'" in runtime
assert "const SUPPORTED_DOMAINS = Object.freeze(['accounting'])" in runtime
assert "const ACCOUNTING_RUNTIME_PAGES = Object.freeze(['/admin/accounting/'])" in runtime
assert 'accountingMutationOwnership: false' in runtime
assert 'ownsAccountingMutations: false' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'schemaParityRequiredForActivation: false' in runtime
assert 'currentAccountingPageProven' in runtime
for token in ['fetch(', 'apiFetch(', 'CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert token not in runtime, token

required_services = [
    'accounting-profit-loss-read',
    'accounting-item-costing-read',
    'accounting-journal-read',
    'accounting-overhead-product-allocations-read',
    'accounting-general-ledger-read',
    'accounting-expenses-read',
    'accounting-overhead-allocations-read',
    'accounting-writeoffs-read',
    'accounting-product-costs-read',
    'accounting-gifi-notes-read',
    'accounting-gifi-summary-read',
    'accounting-period-locks-read',
    'platform-db-sanity-read',
    'accounting-vendors-read',
    'accounting-recurring-expense-rules-read',
    'accounting-attachments-read',
    'accounting-reconciliation-read',
    'accounting-year-end-close-read',
    'accounting-statement-imports-read',
    'accounting-reconciliation-exceptions-read',
    'accounting-sales-tax-filing-read',
    'accounting-fixed-assets-read',
    'accounting-vendor-statements-read',
    'accounting-statement-provider-profiles-read',
    'accounting-close-workflow-read',
    'accounting-evidence-check-read',
    'accounting-monthly-summary-export-read',
    'accounting-period-summary-export-read',
]
assert len(required_services) == 28
for service_id in required_services:
    assert service_id in runtime, service_id
    assert service_id in contracts, service_id
    assert service_id in adapters, service_id

# Business activation must stay intentionally bounded.
assert "runtimeDomains: Object.freeze([])" in groups  # Creative & Production remains inactive.
assert "domains: Object.freeze(['marketing', 'accounting', 'platform', 'admin'])" in groups
assert "runtimeDomains: Object.freeze(['accounting'])" in groups

print('BUILDS 346-348 BUSINESS ADMINISTRATION RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
