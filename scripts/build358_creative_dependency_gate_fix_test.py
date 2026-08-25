from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


runtime = read('public/js/modules/creative-production/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
adapters = read('public/js/core/dd-module-service-adapters.mjs')
write_boundary = read('public/js/modules/commerce-operations/inventory-write-boundary.mjs')
creative_legacy = read('functions/api/admin/creative-process.js')
admin_js = read('public/js/admin.js')
creative_page = read('admin/creative-process/index.html')
content_page = read('admin/content-studio/index.html')

# Build 358 — correct top-level Creative activation dependency gate.
assert 'const BUILD = 358;' in runtime
assert 'const ACTIVATION_BUILD = 357;' in runtime
assert 'const DEPENDENCY_GATE_FIX_BUILD = 358;' in runtime
assert "const CREATIVE_REQUIRED_SERVICES = Object.freeze(['creative-process-read', 'inventory-read'])" in runtime
assert "const CREATIVE_MUTATION_AUTHORITIES = Object.freeze(['inventory-post', 'inventory-reverse'])" in runtime
assert 'mutationAuthoritiesRequiredAsActivationServices: false' in runtime
assert 'creativeMutationOwnership: false' in runtime
assert 'ownsCreativeMutations: false' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime

# The Inventory write authorities are real contracts, but they are not default Core
# browser services and must not be invented merely to satisfy top-level activation.
assert "contractId: 'inventory-post'" in write_boundary
assert "contractId: 'inventory-reverse'" in write_boundary
assert 'createsNetworkTransport: false' in write_boundary
assert "'inventory-post':" not in adapters
assert "'inventory-reverse':" not in adapters

# Creative Process retains direct consumption of the Inventory-owned mutation authorities.
assert "inventory_post_authority: 'inventory-post'" in creative_legacy
assert "inventory_reversal_authority: 'inventory-reverse'" in creative_legacy
assert 'postCreativeInventoryThroughContract' in creative_legacy
assert 'reverseCreativeInventoryThroughContract' in creative_legacy
for action in ['post_material_inventory', 'record_inventory_use', 'correct_inventory_use']:
    assert action in creative_legacy

# Core points at the corrected runtime without changing coverage or mutation ownership.
assert 'CREATIVE_PRODUCTION_RUNTIME_IMPLEMENTATION_BUILD = 358' in groups
assert 'CREATIVE_PRODUCTION_RUNTIME_COVERAGE_BUILD = 357' in groups
assert 'CREATIVE_PROCESS_DEPENDENCY_GATE_FIX_BUILD = 358' in groups
assert "entry: '../modules/creative-production/runtime.mjs?v=358'" in groups
assert "runtimeDomains: Object.freeze(['packaging', 'creative', 'content'])" in groups
assert 'creativeProcessMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert 'contentStudioMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert 'creativeMutationAuthoritiesRequiredAsActivationServices: false' in groups

# Affected pages and shared admin bridge are cache-busted to the corrected runtime.
assert "dd-admin-module-runtime.mjs?v=358" in admin_js
assert '/public/js/admin.js?v=358' in creative_page
assert '/public/js/admin.js?v=358' in content_page

print('BUILD 358 CREATIVE DEPENDENCY GATE FIX: PASS')
print('No Cloudflare resource was contacted.')
