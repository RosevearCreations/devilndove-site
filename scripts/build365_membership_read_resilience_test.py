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
contract = read('functions/api/admin/contracts/operations-membership-read.js')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')

# Build 365 hardens the implementation without changing the Build 362 contract identity.
assert 'export const BUILD = 362' in read_service
assert 'export const IMPLEMENTATION_BUILD = 365' in read_service
assert "export const OWNER = 'operations'" in read_service
assert "export const TABLE = 'membership_tier_policies'" in read_service

# The read no longer assumes sqlite_master access or a fixed legacy column list.
assert 'sqlite_master' not in read_service
assert 'SELECT * FROM membership_tier_policies' in read_service
assert 'missingTableError' in read_service
assert "message.includes('no such table')" in read_service
assert 'mapTierPolicyRow' in read_service
assert "row?.policy_id ?? row?.id" in read_service
assert "row?.tier_code ?? row?.code" in read_service
assert "row?.benefits_json ?? row?.benefits" in read_service
assert 'in-memory-defaults-missing-schema' in read_service
assert 'implementation_build: IMPLEMENTATION_BUILD' in read_service
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in read_service

# Tier Policy GET catches read failures and always returns structured Build 362/365 metadata.
get_section = section(tier_api, 'export async function onRequestGet', 'export async function onRequestPost')
assert 'MEMBERSHIP_TIER_POLICY_READ_IMPLEMENTATION_BUILD' in tier_api
assert 'try {' in get_section
assert 'readMembershipTierPolicies(db)' in get_section
assert 'implementation_build: MEMBERSHIP_TIER_POLICY_READ_IMPLEMENTATION_BUILD' in get_section
assert 'error_code: "membership_tier_policy_read_failed"' in get_section
assert 'request_time_schema_mutation: false' in get_section
assert 'ensureTierPolicyTable' not in get_section
assert 'seedDefaultPolicies' not in get_section
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in get_section

# Retained POST compatibility still owns schema ensure/seeding and policy mutation.
post_section = section(tier_api, 'export async function onRequestPost')
assert 'ensureTierPolicyTable(db)' in post_section
assert 'seedDefaultPolicies(db)' in post_section
assert 'INSERT INTO membership_tier_policies' in post_section
assert 'UPDATE SET' in post_section

# Aggregate Membership contract can no longer collapse when one child GET throws.
assert 'export const BUILD = 362' in contract
assert 'export const IMPLEMENTATION_BUILD = 365' in contract
assert 'async function invoke(name, handler, context)' in contract
assert "invoke('users', usersGet, context)" in contract
assert "invoke('access-tiers', accessTiersGet, context)" in contract
assert "invoke('tier-policies', tierPoliciesGet, context)" in contract
assert "error_code: 'membership_startup_read_threw'" in contract
assert 'failed_read: result.name' in contract
assert 'tier_policy_read_implementation_build' in contract
assert 'request_time_schema_mutation: false' in contract
assert 'mutation_ownership_moved: false' in contract
assert 'onRequestPost' not in contract

# Loader/runtime boundary remains the already staged Build 363/364 boundary.
assert 'const BUILD = 363;' in runtime
assert 'const ACTIVATION_BUILD = 364;' in runtime
assert "const MEMBERSHIP_RUNTIME_PAGE = '/admin/membership/'" in runtime
assert "const MEMBERSHIP_REQUIRED_SERVICES = Object.freeze(['operations-membership-read'])" in runtime
assert 'membershipMutationOwnership: false' in runtime
assert "entry: '../modules/commerce-operations/runtime.mjs?v=363'" in groups
assert 'OPERATIONS_RUNTIME_COVERAGE_BUILD = 364' in groups
assert 'membershipMutationOwnershipMovedByTopLevelRuntime: false' in groups

print('BUILD 365 MEMBERSHIP READ RESILIENCE: PASS')
print('No Cloudflare resource was contacted.')
