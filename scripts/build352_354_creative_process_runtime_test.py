from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def numeric_constant(text, name):
    match = re.search(rf"(?:export\s+)?const\s+{re.escape(name)}\s*=\s*(\d+)", text)
    assert match, f'Missing numeric constant: {name}'
    return int(match.group(1))


def cache_version(text, pattern):
    match = re.search(pattern, text)
    assert match, f'Missing cache-busted path matching: {pattern}'
    return int(match.group(1))


contract = read('functions/api/admin/contracts/creative-process-read.js')
legacy = read('functions/api/admin/creative-process.js')
compat = read('functions/api/admin/creative-process-compat.js')
runtime = read('public/js/modules/creative-production/runtime.mjs')
service = read('public/js/modules/creative-production/creative-process-read-service.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin_js = read('public/js/admin.js')
page = read('admin/creative-process/index.html')

# Build 352 — owned GET-only contract around the existing non-mutating Creative read.
assert 'export const BUILD = 352' in contract
assert "export const CONTRACT_ID = 'creative-process-read'" in contract
assert "export const OWNER = 'creative'" in contract
assert "import { onRequestGet as legacyGet } from '../creative-process.js';" in contract
assert 'request_time_schema_mutation: false' in contract
assert 'mutation_ownership_moved: false' in contract
assert 'onRequestPost' not in contract
for token in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert token not in contract

# The retained compatibility GET itself is read-only. POST code is outside this slice.
start = compat.index('export async function onRequestGet')
end = compat.index('async function ensureCaipProjectForWork', start)
compat_get = compat[start:end]
for token in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert token not in compat_get
assert 'SELECT ' in compat_get

# Existing Creative Process POST authorities are preserved.
assert "inventory_post_authority: 'inventory-post'" in legacy
assert "inventory_reversal_authority: 'inventory-reverse'" in legacy
for action in ['post_material_inventory', 'record_inventory_use', 'correct_inventory_use']:
    assert action in legacy
assert 'postCreativeInventoryThroughContract' in legacy
assert 'reverseCreativeInventoryThroughContract' in legacy

# Build 353 durable boundary — passive Creative Process read service remains registered.
assert 'export const BUILD = 353' in service
assert "export const SERVICE_ID = 'creative-process-read'" in service
assert "export const OWNER = 'creative'" in service
assert "export const ROUTE = '/api/admin/contracts/creative-process-read'" in service
assert 'ensureCreativeProcessReadService' in service

# The shared Creative & Production runtime may advance after Build 353/354, but it
# must continue to support the Creative Process boundary without owning transport
# or Creative mutations. Inventory write contracts are mutation authorities used by
# the retained POST path; they are not required Core browser activation services.
assert numeric_constant(runtime, 'BUILD') >= 353
assert numeric_constant(runtime, 'ACTIVATION_BUILD') >= 354
assert "const MODULE_ID = 'creative-production'" in runtime
supported = runtime[runtime.index('const SUPPORTED_DOMAINS'):runtime.index('const PACKAGING_RUNTIME_PAGES')]
assert "'packaging'" in supported
assert "'creative'" in supported
assert "'/admin/creative-process/'" in runtime
for required in ['creative-process-read', 'inventory-read']:
    assert required in runtime
assert "const CREATIVE_MUTATION_AUTHORITIES = Object.freeze(['inventory-post', 'inventory-reverse'])" in runtime
assert 'mutationAuthoritiesRequiredAsActivationServices: false' in runtime
assert 'ensureCreativeProcessReadService(registry)' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'creativeMutationOwnership: false' in runtime
assert 'ownsCreativeMutations: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime

# Build 354 durable boundary — Packaging and Creative Process remain covered even
# if later builds add more Creative & Production domains/pages.
creative_start = groups.index("id: 'creative-production'")
creative_end = groups.index("id: 'business-administration'", creative_start)
creative = groups[creative_start:creative_end]
assert '../modules/creative-production/runtime.mjs?v=' in creative
assert cache_version(creative, r"\.\./modules/creative-production/runtime\.mjs\?v=(\d+)") >= 353
runtime_domains = creative[creative.index('runtimeDomains:'):]
assert "'packaging'" in runtime_domains
assert "'creative'" in runtime_domains
assert "'/admin/packaging-studio/'" in groups
assert "'/admin/creative-process/'" in groups
assert 'creativeProcessMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert cache_version(admin_js, r"dd-admin-module-runtime\.mjs\?v=(\d+)") >= 354

admin_version = cache_version(page, r"/public/js/admin\.js\?v=(\d+)")
assert admin_version >= 354
admin_pos = page.index(f'/public/js/admin.js?v={admin_version}')
creative_pos = page.index('/public/js/admin-creative-process.js?v=274')
assert admin_pos < creative_pos

print('BUILDS 352-354 CREATIVE PROCESS RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
