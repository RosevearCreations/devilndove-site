from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


read_service = read('functions/api/_lib/membershipTierPolicyReadService.js')
tier_api = read('functions/api/admin/tier-policies.js')
users_api = read('functions/api/admin/users.js')
tiers_api = read('functions/api/admin/access-tiers.js')
contract = read('functions/api/admin/contracts/operations-membership-read.js')
client_service = read('public/js/modules/commerce-operations/operations-membership-read-service.mjs')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin_js = read('public/js/admin.js')
page = read('admin/membership/index.html')
access_ui = read('public/js/admin-access-tiers.js')
policy_ui = read('public/js/admin-tier-policy.js')

# Build 362 — Tier Policy GET uses a non-mutating read service.
assert 'export const BUILD = 362' in read_service
assert "export const OWNER = 'operations'" in read_service
assert "export const TABLE = 'membership_tier_policies'" in read_service
assert 'sqlite_master' in read_service
assert 'in-memory-defaults-missing-schema' in read_service
assert 'request_time_schema_mutation: false' in read_service
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in read_service

get_section = section(tier_api, 'export async function onRequestGet', 'export async function onRequestPost')
assert 'readMembershipTierPolicies(db)' in get_section
assert 'ensureTierPolicyTable' not in get_section
assert 'seedDefaultPolicies' not in get_section
assert 'request_time_schema_mutation: false' in get_section
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in get_section

# Retained POST compatibility still owns policy writes/schema ensure.
post_section = section(tier_api, 'export async function onRequestPost')
assert 'ensureTierPolicyTable(db)' in post_section
assert 'seedDefaultPolicies(db)' in post_section
assert 'INSERT INTO membership_tier_policies' in post_section
assert 'UPDATE SET' in post_section

# Other automatic Membership reads are SELECT-only.
for source in [users_api, tiers_api]:
    get = section(source, 'export async function onRequestGet')
    for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
        assert forbidden not in get

# Build 362 aggregate startup-read contract is GET-only and moves no mutations.
assert 'export const BUILD = 362' in contract
assert "export const CONTRACT_ID = 'operations-membership-read'" in contract
assert "export const OWNER = 'operations'" in contract
assert "from '../users.js'" in contract
assert "from '../access-tiers.js'" in contract
assert "from '../tier-policies.js'" in contract
assert 'request_time_schema_mutation: false' in contract
assert 'mutation_ownership_moved: false' in contract
assert 'onRequestPost' not in contract

# Build 363 passive browser service. Registration itself performs no request.
assert 'export const BUILD = 363' in client_service
assert 'export const CONTRACT_BUILD = 362' in client_service
assert "export const SERVICE_ID = 'operations-membership-read'" in client_service
assert "export const OWNER = 'operations'" in client_service
assert "export const ROUTE = '/api/admin/contracts/operations-membership-read'" in client_service
assert 'ensureOperationsMembershipReadService' in client_service

# Build 363/364 shared Commerce runtime adds page-specific Membership prerequisites.
assert 'const BUILD = 363;' in runtime
assert 'const ACTIVATION_BUILD = 364;' in runtime
assert "const MEMBERSHIP_RUNTIME_PAGE = '/admin/membership/'" in runtime
assert "const MEMBERSHIP_REQUIRED_SERVICES = Object.freeze(['operations-membership-read'])" in runtime
assert "const LEGACY_OPERATIONS_REQUIRED_SERVICES = Object.freeze(['catalog-read', 'inventory-read', 'accounting-read'])" in runtime
assert 'ensureOperationsMembershipReadService(registry)' in runtime
assert 'membershipMutationOwnership: false' in runtime
assert 'ownsMembershipMutations: false' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime
assert 'currentMembershipPageProven' in runtime

# Build 364 Core coverage keeps the original Operations pages and adds Membership only.
commerce = section(groups, "id: 'commerce-operations'", "id: 'creative-production'")
assert "entry: '../modules/commerce-operations/runtime.mjs?v=363'" in commerce
assert "runtimeDomains: Object.freeze(['catalog', 'inventory', 'operations'])" in commerce
for path in ['/admin/operations/', '/admin/customer-documents/', '/admin/orders/', '/admin/membership/']:
    assert f"'{path}'" in groups
assert 'OPERATIONS_MEMBERSHIP_READ_CONTRACT_BUILD = 362' in groups
assert 'RUNTIME_OPERATIONS_BUILD = 363' in groups
assert 'OPERATIONS_RUNTIME_COVERAGE_BUILD = 364' in groups
assert 'membershipMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert "dd-admin-module-runtime.mjs?v=364" in admin_js

# Membership page loads Core before retained UI scripts and fixes the existing policy mount typo.
assert 'id="tierPolicyAdminMount"' in page
assert 'id="adminTierPolicyMount"' not in page
assert "getElementById('tierPolicyAdminMount')" in policy_ui or 'getElementById("tierPolicyAdminMount")' in policy_ui
admin_pos = page.index('/public/js/admin.js?v=364')
access_pos = page.index('/public/js/admin-access-tiers.js')
policy_pos = page.index('/public/js/admin-tier-policy.js')
assert admin_pos < access_pos < policy_pos
assert '/api/admin/users' in access_ui
assert '/api/admin/access-tiers' in access_ui
assert '/api/admin/tier-policies' in policy_ui

print('BUILDS 362-364 OPERATIONS MEMBERSHIP RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
