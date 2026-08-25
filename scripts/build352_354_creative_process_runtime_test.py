from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


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

# Build 353 — passive service registration plus two-domain Creative wrapper.
assert 'export const BUILD = 353' in service
assert "export const SERVICE_ID = 'creative-process-read'" in service
assert "export const OWNER = 'creative'" in service
assert "export const ROUTE = '/api/admin/contracts/creative-process-read'" in service
assert 'ensureCreativeProcessReadService' in service
assert "const BUILD = 353;" in runtime
assert 'const ACTIVATION_BUILD = 354;' in runtime
assert "Object.freeze(['packaging', 'creative'])" in runtime
assert "'/admin/creative-process/'" in runtime
for required in ['creative-process-read', 'inventory-read', 'inventory-post', 'inventory-reverse']:
    assert required in runtime
assert 'ensureCreativeProcessReadService(registry)' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'creativeMutationOwnership: false' in runtime
assert 'ownsCreativeMutations: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime

# Build 354 — only Packaging + Creative Process receive Creative top-level runtime coverage.
assert "entry: '../modules/creative-production/runtime.mjs?v=353'" in groups
assert "runtimeDomains: Object.freeze(['packaging', 'creative'])" in groups
assert "'/admin/packaging-studio/'" in groups
assert "'/admin/creative-process/'" in groups
assert 'creativeProcessMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert "dd-admin-module-runtime.mjs?v=354" in admin_js

admin_pos = page.index('/public/js/admin.js?v=354')
creative_pos = page.index('/public/js/admin-creative-process.js?v=274')
assert admin_pos < creative_pos

print('BUILDS 352-354 CREATIVE PROCESS RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
