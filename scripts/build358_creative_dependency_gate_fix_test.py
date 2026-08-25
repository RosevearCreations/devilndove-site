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


runtime = read('public/js/modules/creative-production/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
adapters = read('public/js/core/dd-module-service-adapters.mjs')
write_boundary = read('public/js/modules/commerce-operations/inventory-write-boundary.mjs')
creative_legacy = read('functions/api/admin/creative-process.js')
admin_js = read('public/js/admin.js')
creative_page = read('admin/creative-process/index.html')
content_page = read('admin/content-studio/index.html')

# Build 358 durable correction — the shared runtime may advance, but the Creative
# activation gate must keep mutation authorities separate from passive services.
assert numeric_constant(runtime, 'BUILD') >= 358
assert numeric_constant(runtime, 'ACTIVATION_BUILD') >= 357
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

# Core may expand Creative coverage after Build 358, but the dependency-fix metadata
# and non-ownership invariants must remain.
assert numeric_constant(groups, 'CREATIVE_PRODUCTION_RUNTIME_IMPLEMENTATION_BUILD') >= 358
assert numeric_constant(groups, 'CREATIVE_PRODUCTION_RUNTIME_COVERAGE_BUILD') >= 357
assert 'CREATIVE_PROCESS_DEPENDENCY_GATE_FIX_BUILD = 358' in groups
creative_start = groups.index("id: 'creative-production'")
creative_end = groups.index("id: 'business-administration'", creative_start)
creative = groups[creative_start:creative_end]
assert cache_version(creative, r"\.\./modules/creative-production/runtime\.mjs\?v=(\d+)") >= 358
runtime_domains = creative[creative.index('runtimeDomains:'):]
for domain in ['packaging', 'creative', 'content']:
    assert f"'{domain}'" in runtime_domains
assert 'creativeProcessMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert 'contentStudioMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert 'creativeMutationAuthoritiesRequiredAsActivationServices: false' in groups

# Affected pages and shared admin bridge may receive later cache-busts.
assert cache_version(admin_js, r"dd-admin-module-runtime\.mjs\?v=(\d+)") >= 358
for page in [creative_page, content_page]:
    assert cache_version(page, r"/public/js/admin\.js\?v=(\d+)") >= 358

print('BUILD 358 CREATIVE DEPENDENCY GATE FIX: PASS')
print('No Cloudflare resource was contacted.')
