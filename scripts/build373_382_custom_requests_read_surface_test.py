from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


safe_export = read('functions/api/admin/contracts/operations-custom-requests-marketplace-export.js')
export_read = read('functions/api/admin/contracts/operations-custom-requests-marketplace-export-read.js')
page_tools = read('public/js/modules/commerce-operations/custom-requests-page-tools.mjs')
page = read('admin/custom-request/index.html')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
legacy = read('functions/api/admin/custom-requests.js')
read_contract = read('functions/api/admin/contracts/operations-custom-requests-read.js')

# Build 373: marketplace CSV export is owned, GET-only and non-mutating.
assert 'export const BUILD = 373' in safe_export
assert "export const CONTRACT_ID = 'operations-custom-requests-marketplace-export'" in safe_export
assert "export const OWNER = 'operations'" in safe_export
assert 'custom_request_marketplace_export_packs' in safe_export
assert 'x-dd-request-time-schema-mutation' in safe_export
assert "'false'" in safe_export
assert 'onRequestPost' not in safe_export
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in safe_export

# Build 374: export readiness is read-only and never seeds presets.
assert 'export const BUILD = 374' in export_read
assert "export const CONTRACT_ID = 'operations-custom-requests-marketplace-export-read'" in export_read
assert "export const OWNER = 'operations'" in export_read
assert 'PRAGMA table_info' in export_read
assert 'custom_request_marketplace_export_packs' in export_read
assert 'marketplace_channel_presets' in export_read
assert 'seeds_marketplace_presets: false' in export_read
assert 'legacy_marketplace_csv_get_replacement_available: true' in export_read
assert 'onRequestPost' not in export_read
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in export_read

# Builds 375-380: dedicated page tools use owned reads and safe exports.
assert 'export const BUILD = 380' in page_tools
assert 'export const READ_CONTRACT_BUILD = 370' in page_tools
assert 'export const EXPORT_CONTRACT_BUILD = 373' in page_tools
assert 'export const EXPORT_READINESS_BUILD = 374' in page_tools
assert "export const READ_ROUTE = '/api/admin/contracts/operations-custom-requests-read'" in page_tools
assert "export const EXPORT_READINESS_ROUTE = '/api/admin/contracts/operations-custom-requests-marketplace-export-read'" in page_tools
assert "export const SAFE_EXPORT_ROUTE = '/api/admin/contracts/operations-custom-requests-marketplace-export'" in page_tools
assert 'rewriteLegacyExportLinks' in page_tools
assert 'MutationObserver' in page_tools
assert 'format=marketplace_csv' in page_tools
assert 'ddCustomRequestsOwnedReadReady' in page_tools
assert 'ddCustomRequestsMarketplaceExportReady' in page_tools
assert 'setInterval(' not in page_tools
assert 'setTimeout(' not in page_tools

# The dedicated page exposes diagnostics and loads the page tools without changing Core/runtime versions.
assert 'id="customRequestsOwnedReadStatus"' in page
assert 'id="customRequestsReadDiagnostics"' in page
assert 'id="customRequestsSafeExportLinks"' in page
assert 'id="customRequestsReadRefresh"' in page
assert '/public/js/admin.js?v=372' in page
assert '/public/js/admin-custom-requests.js?v=372' in page
assert '/public/js/modules/commerce-operations/custom-requests-page-tools.mjs?v=380' in page

# Build 370 startup contract remains the page lifecycle read boundary.
assert 'export const BUILD = 370' in read_contract
assert "marketplace_csv_legacy_get_outside_contract: true" in read_contract
assert 'request_time_schema_mutation: false' in read_contract
assert 'mutation_ownership_moved: false' in read_contract

# Shared Commerce loader remains the already browser-proven 371/372 boundary.
assert 'const BUILD = 371;' in runtime
assert 'const ACTIVATION_BUILD = 372;' in runtime
assert "const CUSTOM_REQUESTS_RUNTIME_PAGE = '/admin/custom-request/'" in runtime
assert "const CUSTOM_REQUESTS_REQUIRED_SERVICES = Object.freeze(['operations-custom-requests-read'])" in runtime
assert 'customRequestsMutationOwnership: false' in runtime
assert 'createsNetworkTransport: false' in runtime

# Legacy endpoint remains compatibility-owned. The dedicated page no longer needs its CSV GET path.
get_section = section(legacy, 'export async function onRequestGet', 'export async function onRequestPost')
post_section = section(legacy, 'export async function onRequestPost')
assert "format') || '').toLowerCase() === 'marketplace_csv'" in get_section
assert 'marketplaceCsv(context, db)' in get_section
assert 'await ensureSchema(db)' in legacy
assert 'export async function onRequestPost' in legacy
assert 'await ensureSchema(db)' in post_section

print('BUILDS 373-382 CUSTOM REQUESTS READ SURFACE: PASS')
print('No Cloudflare resource was contacted.')
