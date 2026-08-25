from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


def exported_async_function(text, name):
    start = text.index(f'export async function {name}')
    end = text.find('\nexport async function ', start + 1)
    return text[start:end if end >= 0 else len(text)]


caip_contract = read('functions/api/admin/contracts/caip-read.js')
intake_contract = read('functions/api/admin/contracts/caip-media-intake-read.js')
service = read('public/js/modules/creative-production/caip-read-services.mjs')
runtime = read('public/js/modules/creative-production/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin_js = read('public/js/admin.js')
page = read('admin/creative-assets/index.html')
caip_legacy = read('functions/api/admin/creative-assets.js')
intake_legacy = read('functions/api/admin/caip-media-intake.js')
intelligence = read('functions/api/_lib/creativeAssetIntelligence.js')
operations = read('functions/api/_lib/creativeAssetOperations.js')
media = read('functions/api/_lib/caipMediaIntake.js')

# Build 359 — both CAIP startup reads receive owned GET-only contracts.
for contract, contract_id, legacy_import in [
    (caip_contract, 'caip-read', "import { onRequestGet as legacyGet } from '../creative-assets.js';"),
    (intake_contract, 'caip-media-intake-read', "import { onRequestGet as legacyGet } from '../caip-media-intake.js';"),
]:
    assert 'export const BUILD = 359' in contract
    assert f"export const CONTRACT_ID = '{contract_id}'" in contract
    assert "export const OWNER = 'caip'" in contract
    assert legacy_import in contract
    assert 'request_time_schema_mutation: false' in contract
    assert 'mutation_ownership_moved: false' in contract
    assert 'schema_verification_only: true' in contract
    assert 'onRequestPost' not in contract
    for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
        assert forbidden not in contract

# The current CAIP schema helpers are verification-only despite their historical names.
for helper, name in [
    (intelligence, 'ensureCreativeAssetIntelligenceSchema'),
    (operations, 'ensureCreativeAssetOperationsSchema'),
    (media, 'assertCaipMediaIntakeSchema'),
]:
    body = exported_async_function(helper, name)
    assert 'SELECT ' in body
    for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
        assert forbidden not in body

# Both legacy automatic GETs remain reads; POST authorities remain separate.
caip_get = section(caip_legacy, 'export async function onRequestGet', 'export async function onRequestPost')
intake_get = section(intake_legacy, 'export async function onRequestGet', 'export async function onRequestPost')
assert 'ensureCreativeAssetIntelligenceSchema(state.db)' in caip_get
assert 'ensureCreativeAssetOperationsSchema(state.db)' in caip_get
assert 'listCaipMediaIntake' in intake_get
assert 'getCaipMediaIntakeReadiness' in intake_get

caip_post = section(caip_legacy, 'export async function onRequestPost')
for action in ['sync_project', 'update_asset', 'update_evidence', 'probe_asset', 'create_derivative_plan', 'create_secure_review_link']:
    assert action in caip_post
intake_post = section(intake_legacy, 'export async function onRequestPost')
for action in ['create_session', 'initiate_file', 'complete_file', 'update_governance', 'request_public_promotion']:
    assert action in intake_post

# Build 360 — passive service registration for exactly the two CAIP startup reads.
assert 'export const BUILD = 360' in service
assert "export const OWNER = 'caip'" in service
assert "export const CAIP_READ_SERVICE_ID = 'caip-read'" in service
assert "export const CAIP_MEDIA_INTAKE_READ_SERVICE_ID = 'caip-media-intake-read'" in service
assert "export const CAIP_READ_ROUTE = '/api/admin/contracts/caip-read'" in service
assert "export const CAIP_MEDIA_INTAKE_READ_ROUTE = '/api/admin/contracts/caip-media-intake-read'" in service
assert 'ensureCaipReadServices' in service
registration = section(service, 'export function ensureCaipReadServices')
assert 'apiFetch(' not in registration

assert 'const BUILD = 360;' in runtime
assert 'const ACTIVATION_BUILD = 361;' in runtime
assert "'caip'" in section(runtime, 'const SUPPORTED_DOMAINS', 'const PACKAGING_RUNTIME_PAGES')
assert "const CAIP_RUNTIME_PAGES = Object.freeze(['/admin/creative-assets/'])" in runtime
assert "const CAIP_REQUIRED_SERVICES = Object.freeze(['caip-read', 'caip-media-intake-read'])" in runtime
assert 'ensureCaipReadServices(registry)' in runtime
assert 'caipMutationOwnership: false' in runtime
assert 'ownsCaipMutations: false' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime

# Build 361 — only /admin/creative-assets/ joins CAIP top-level lifecycle coverage.
creative = section(groups, "id: 'creative-production'", "id: 'business-administration'")
assert "entry: '../modules/creative-production/runtime.mjs?v=360'" in creative
assert "runtimeDomains: Object.freeze(['packaging', 'creative', 'content', 'caip'])" in creative
assert 'CAIP_READ_CONTRACT_BUILD = 359' in groups
assert 'CAIP_MEDIA_INTAKE_READ_CONTRACT_BUILD = 359' in groups
assert 'CREATIVE_PRODUCTION_RUNTIME_IMPLEMENTATION_BUILD = 360' in groups
assert 'CREATIVE_PRODUCTION_RUNTIME_COVERAGE_BUILD = 361' in groups
assert "'/admin/creative-assets/'" in groups
assert 'caipMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert "dd-admin-module-runtime.mjs?v=361" in admin_js

admin_pos = page.index('/public/js/admin.js?v=361')
intake_pos = page.index('/public/js/admin-caip-media-intake.js?v=279')
caip_pos = page.index('/public/js/admin-creative-assets.js?v=271')
assert admin_pos < intake_pos < caip_pos

print('BUILDS 359-361 CAIP RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
