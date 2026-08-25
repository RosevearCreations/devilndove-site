import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


def numeric_constant(text, name):
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*(\d+)\s*;", text)
    assert match, f'Missing numeric constant {name}'
    return int(match.group(1))


def export_numeric_constant(text, name):
    match = re.search(rf"export\s+const\s+{re.escape(name)}\s*=\s*(\d+)\s*;", text)
    assert match, f'Missing exported numeric constant {name}'
    return int(match.group(1))


def cache_version(text, pattern):
    match = re.search(pattern, text)
    assert match, f'Missing cache version: {pattern}'
    return int(match.group(1))


legacy = read('functions/api/admin/custom-requests.js')
contract = read('functions/api/admin/contracts/operations-custom-requests-read.js')
client_service = read('public/js/modules/commerce-operations/operations-custom-requests-read-service.mjs')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin_js = read('public/js/admin.js')
page = read('admin/custom-request/index.html')
ui = read('public/js/admin-custom-requests.js')
definitions = read('public/js/core/dd-module-definitions.mjs')

list_section = section(legacy, 'async function listPayload(db)', 'async function recordConversion')
assert 'ensureSchema(' not in list_section
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in list_section
assert 'SELECT * FROM custom_requests' in list_section

marketplace_section = section(legacy, 'async function marketplaceCsv', 'export async function onRequestGet')
assert 'ensureSchema(db)' in marketplace_section
assert 'seedMarketplacePresets(db)' in marketplace_section
get_section = section(legacy, 'export async function onRequestGet', 'export async function onRequestPost')
assert "searchParams.get('format')" in get_section
assert "'marketplace_csv'" in get_section
assert 'return marketplaceCsv(context, db)' in get_section
assert 'return jsonResponse(await listPayload(db)' in get_section

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

for table in [
    'custom_requests', 'custom_request_quote_drafts', 'custom_request_job_drafts',
    'custom_request_product_drafts', 'custom_request_reply_templates', 'custom_request_payment_candidates',
    'custom_request_quote_share_links', 'custom_request_quote_line_items', 'custom_request_quote_revisions',
    'custom_request_payment_request_drafts', 'custom_request_order_drafts', 'custom_request_payment_links',
    'custom_request_payment_link_approval_gates', 'custom_request_payment_checkout_records',
    'custom_request_order_status_links', 'custom_request_marketplace_export_packs',
    'custom_request_fulfillment_prompts', 'custom_request_order_stage_events',
    'custom_request_public_proof_candidates', 'marketplace_channel_presets',
    'custom_request_payment_provider_tests', 'custom_request_reference_uploads',
    'custom_request_conversion_events',
]:
    assert f"'{table}'" in contract

assert 'export const BUILD = 371' in client_service
assert 'export const CONTRACT_BUILD = 370' in client_service
assert "export const SERVICE_ID = 'operations-custom-requests-read'" in client_service
assert "export const ROUTE = '/api/admin/contracts/operations-custom-requests-read'" in client_service
registration = section(client_service, 'export function ensureOperationsCustomRequestsReadService')
assert 'apiFetch(' not in registration
assert 'fetch(' not in registration

# Shared Commerce may advance later; durable Custom Requests boundary must remain.
assert numeric_constant(runtime, 'BUILD') >= 371
assert numeric_constant(runtime, 'ACTIVATION_BUILD') >= 372
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
assert "const LEGACY_OPERATIONS_REQUIRED_SERVICES = Object.freeze(['catalog-read', 'inventory-read', 'accounting-read'])" in runtime

commerce = section(groups, "id: 'commerce-operations'", "id: 'creative-production'")
assert cache_version(commerce, r"entry:\s*'\.\./modules/commerce-operations/runtime\.mjs\?v=(\d+)'") >= 371
assert "runtimeDomains: Object.freeze(['catalog', 'inventory', 'operations'])" in commerce
assert "'/admin/custom-request/'" in groups
assert 'OPERATIONS_CUSTOM_REQUESTS_READ_CONTRACT_BUILD = 370' in groups
assert export_numeric_constant(groups, 'RUNTIME_OPERATIONS_BUILD') >= 371
assert export_numeric_constant(groups, 'OPERATIONS_RUNTIME_COVERAGE_BUILD') >= 372
assert 'customRequestsMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert cache_version(admin_js, r"dd-admin-module-runtime\.mjs\?v=(\d+)") >= 372

operations_definition = section(definitions, "id: 'operations'", "id: 'creative'")
assert "'/admin/custom-request'" in operations_definition
assert 'id="customRequestsAdminMount"' in page
assert '/public/js/admin.js?v=372' in page
assert '/public/js/admin-custom-requests.js?v=372' in page
assert page.index('/public/js/admin.js?v=372') < page.index('/public/js/admin-custom-requests.js?v=372')

assert "apiFetch('/api/admin/custom-requests')" in ui
assert "apiFetch('/api/admin/custom-requests'," in ui
assert "method: 'POST'" in ui
assert '/api/admin/custom-requests?format=marketplace_csv' in ui

print('BUILDS 370-372 CUSTOM REQUESTS RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
