from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


legacy = read('functions/api/admin/custom-requests.js')
contract = read('functions/api/admin/contracts/operations-custom-requests-read.js')
client_service = read('public/js/modules/commerce-operations/operations-custom-requests-read-service.mjs')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin_js = read('public/js/admin.js')
page = read('admin/custom-request/index.html')
ui = read('public/js/admin-custom-requests.js')
definitions = read('public/js/core/dd-module-definitions.mjs')

# Legacy automatic list read is already non-migrating; listPayload must not call ensureSchema.
list_section = section(legacy, 'async function listPayload(db)', 'async function recordConversion')
assert 'ensureSchema(' not in list_section
assert 'CREATE TABLE' not in list_section
assert 'ALTER TABLE' not in list_section
assert 'INSERT INTO' not in list_section
assert 'UPDATE ' not in list_section
assert 'DELETE FROM' not in list_section
assert 'SELECT * FROM custom_requests' in list_section

# Legacy explicit marketplace CSV compatibility GET still owns schema ensure/seeding and is outside this contract.
marketplace_section = section(legacy, 'async function marketplaceCsv', 'export async function onRequestGet')
assert 'ensureSchema(db)' in marketplace_section
assert 'seedMarketplacePresets(db)' in marketplace_section
get_section = section(legacy, 'export async function onRequestGet', 'export async function onRequestPost')
assert "searchParams.get('format')" in get_section
assert "'marketplace_csv'" in get_section
assert 'return marketplaceCsv(context, db)' in get_section
assert 'return jsonResponse(await listPayload(db)' in get_section

# Build 370 owned startup-read contract is GET-only and can never enter marketplace CSV mode.
assert 'export const BUILD = 370' in contract
assert "export const CONTRACT_ID = 'operations-custom-requests-read'" in contract
assert "export const OWNER = 'operations'" in contract
assert "export const COMPATIBILITY_ROUTE = '/api/admin/custom-requests'" in contract
assert "url.pathname = COMPATIBILITY_ROUTE" in contract
assert "url.search = ''" in contract
assert 'legacyGet(readContext)' in contract
assert 'request_time_schema_mutation: false' in contract
assert 'mutation_ownership_moved: false' in contract
assert 'schema_ready: readiness.schema_ready' in contract
assert 'missing_tables: readiness.missing_tables' in contract
assert 'checked_tables: readiness.checked_tables' in contract
assert 'marketplace_csv_legacy_get_outside_contract: true' in contract
assert 'compatibility_post_mutation_ownership_moved: false' in contract
assert 'onRequestPost' not in contract
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in contract

# Contract checks every table used by listPayload instead of silently treating missing schema as empty data.
for table in [
    'custom_requests',
    'custom_request_quote_drafts',
    'custom_request_job_drafts',
    'custom_request_product_drafts',
    'custom_request_reply_templates',
    'custom_request_payment_candidates',
    'custom_request_quote_share_links',
    'custom_request_quote_line_items',
    'custom_request_quote_revisions',
    'custom_request_payment_request_drafts',
    'custom_request_order_drafts',
    'custom_request_payment_links',
    'custom_request_payment_link_approval_gates',
    'custom_request_payment_checkout_records',
    'custom_request_order_status_links',
    'custom_request_marketplace_export_packs',
    'custom_request_fulfillment_prompts',
    'custom_request_order_stage_events',
    'custom_request_public_proof_candidates',
    'marketplace_channel_presets',
    'custom_request_payment_provider_tests',
    'custom_request_reference_uploads',
    'custom_request_conversion_events',
]:
    assert f"'{table}'" in contract

# Build 371 passive service registration creates no request.
assert 'export const BUILD = 371' in client_service
assert 'export const CONTRACT_BUILD = 370' in client_service
assert "export const SERVICE_ID = 'operations-custom-requests-read'" in client_service
assert "export const OWNER = 'operations'" in client_service
assert "export const ROUTE = '/api/admin/contracts/operations-custom-requests-read'" in client_service
registration = section(client_service, 'export function ensureOperationsCustomRequestsReadService')
assert 'apiFetch(' not in registration
assert 'fetch(' not in registration

# Build 371/372 shared Commerce runtime gives the dedicated page one read prerequisite only.
assert 'const BUILD = 371;' in runtime
assert 'const ACTIVATION_BUILD = 372;' in runtime
assert "const CUSTOM_REQUESTS_RUNTIME_PAGE = '/admin/custom-request/'" in runtime
assert "const CUSTOM_REQUESTS_REQUIRED_SERVICES = Object.freeze(['operations-custom-requests-read'])" in runtime
assert 'ensureOperationsCustomRequestsReadService(registry)' in runtime
assert "const CUSTOM_REQUESTS_COMPATIBILITY_AUTHORITY = '/api/admin/custom-requests'" in runtime
assert 'customRequestsMutationOwnership: false' in runtime
assert 'ownsCustomRequestsMutations: false' in runtime
assert 'customRequestsMutationOwnershipMoved: false' in runtime
assert 'customRequestsMarketplaceCsvLegacyGetOutsideContract: true' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime
assert 'currentCustomRequestsPageProven' in runtime

# Broad Operations retains its original three-service gate; the new page is isolated.
assert "const LEGACY_OPERATIONS_REQUIRED_SERVICES = Object.freeze(['catalog-read', 'inventory-read', 'accounting-read'])" in runtime

# Build 372 Core coverage and cache-bust.
commerce = section(groups, "id: 'commerce-operations'", "id: 'creative-production'")
assert "entry: '../modules/commerce-operations/runtime.mjs?v=371'" in commerce
assert "runtimeDomains: Object.freeze(['catalog', 'inventory', 'operations'])" in commerce
assert "'/admin/custom-request/'" in groups
assert 'OPERATIONS_CUSTOM_REQUESTS_READ_CONTRACT_BUILD = 370' in groups
assert 'RUNTIME_OPERATIONS_BUILD = 371' in groups
assert 'OPERATIONS_RUNTIME_COVERAGE_BUILD = 372' in groups
assert 'customRequestsMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert 'dd-admin-module-runtime.mjs?v=372' in admin_js

# Route was already Operations-owned; Build 372 supplies the dedicated page.
operations_definition = section(definitions, "id: 'operations'", "id: 'creative'")
assert "'/admin/custom-request'" in operations_definition
assert 'id="customRequestsAdminMount"' in page
assert '/public/js/admin.js?v=372' in page
assert '/public/js/admin-custom-requests.js?v=372' in page
assert page.index('/public/js/admin.js?v=372') < page.index('/public/js/admin-custom-requests.js?v=372')

# Mature UI remains compatibility-backed; writes are still explicit user actions on the legacy authority.
assert "apiFetch('/api/admin/custom-requests')" in ui
assert "apiFetch('/api/admin/custom-requests'," in ui
assert "method: 'POST'" in ui
assert '/api/admin/custom-requests?format=marketplace_csv' in ui

print('BUILDS 370-372 CUSTOM REQUESTS RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
