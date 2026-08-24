#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = 'ab8089b76d881617bc3ca4768abdb4674afcf3a0'

failures = []
def check(condition, message):
    if not condition:
        failures.append(message)

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

wrapper_path = 'functions/api/admin/creative-process.js'
compat_path = 'functions/api/admin/creative-process-compat.js'
adapter_path = 'functions/api/_lib/creativeInventoryPostConsumer.js'
service_path = 'functions/api/_lib/inventoryPostService.js'
contracts_path = 'public/js/core/dd-module-contracts.mjs'
boundary_path = 'public/js/modules/commerce-operations/inventory-write-boundary.mjs'
runtime_path = 'public/js/modules/commerce-operations/runtime.mjs'
groups_path = 'public/js/core/dd-application-module-groups.mjs'
admin_path = 'public/js/admin.js'
page_path = 'admin/inventory-operations/index.html'
validation_path = 'BUILD310_VALIDATION.md'
architecture_path = 'docs/architecture/BUILD310_CREATIVE_INVENTORY_POST_CONSUMER_CUTOVER.md'
handoff_path = 'AI_CONTEXT.md'
changed_path = 'BUILD310_CHANGED_FILES.md'

for path in [wrapper_path, compat_path, adapter_path, service_path, contracts_path, boundary_path, runtime_path, groups_path, admin_path, page_path]:
    check((ROOT / path).exists(), f'missing Build 310 file: {path}')

wrapper = read(wrapper_path)
compat = read(compat_path)
adapter = read(adapter_path)
service = read(service_path)
contracts = read(contracts_path)
boundary = read(boundary_path)
runtime = read(runtime_path)
groups = read(groups_path)
admin = read(admin_path)
page = read(page_path)
validation = read(validation_path) if (ROOT / validation_path).exists() else ''
architecture = read(architecture_path) if (ROOT / architecture_path).exists() else ''
handoff = read(handoff_path) if (ROOT / handoff_path).exists() else ''

# Syntax checks for changed JavaScript modules.
for path in [wrapper_path, compat_path, adapter_path, contracts_path, boundary_path, runtime_path, groups_path, admin_path]:
    result = subprocess.run(['node', '--check', str(ROOT / path)], capture_output=True, text=True)
    check(result.returncode == 0, f'JavaScript syntax failed for {path}: {result.stderr.strip()}')
print('PASS: Build 310 Creative/contract/runtime JavaScript syntax')

# The adapter must delegate to Inventory authority and perform no stock/movement writes itself.
check("postCreativeInventoryUsage" in adapter and "CONTRACT_ID = 'inventory-post'" in adapter, 'Creative post adapter must delegate to inventory-post')
for forbidden in ['UPDATE site_item_inventory', 'INSERT INTO site_inventory_movements', 'INSERT INTO site_inventory_usage_movements', 'INSERT INTO creative_project_inventory_posts']:
    check(forbidden not in adapter, f'Creative post adapter owns forbidden Inventory mutation SQL: {forbidden}')
check('consumerBuild: BUILD' in adapter and 'originalMovementId' in adapter, 'Creative post adapter must preserve consumer/provenance result metadata')
print('PASS: Creative post adapter delegates mutation authority and owns no Inventory writes')

# The wrapper must intercept every current caller of the old posting helper before compatibility delegation.
for action in ['post_material_inventory', 'record_inventory_use', 'correct_inventory_use']:
    check(f"'{action}'" in wrapper, f'Build 310 wrapper does not intercept {action}')
check("INTERCEPTED_POST_ACTIONS" in wrapper and 'compatibilityPost' in wrapper, 'Build 310 wrapper must explicitly separate intercepted posting actions from compatibility delegation')
check('postCreativeInventoryThroughContract' in wrapper, 'Build 310 wrapper must use the Creative post consumer adapter')
for forbidden in ['UPDATE site_item_inventory', 'INSERT INTO site_inventory_movements', 'INSERT INTO site_inventory_usage_movements', 'INSERT INTO creative_project_inventory_posts']:
    check(forbidden not in wrapper, f'Build 310 wrapper contains forbidden direct Inventory write: {forbidden}')
print('PASS: all three Creative posting workflows are intercepted before legacy compatibility logic')

# Compatibility implementation is preserved rather than rewritten in the cutover.
check('async function postInventoryUsage' in compat, 'Build 308 compatibility implementation is not preserved')
check("inventory_reversal_consumer_build" in compat, 'Build 308 reversal consumer metadata must remain in compatibility implementation')
check('creative-process-compat.js' in wrapper, 'Build 310 wrapper must delegate unrelated Creative actions to the preserved compatibility implementation')
print('PASS: unrelated Creative behavior remains on the preserved Build 308 compatibility implementation')

# Build 309 Inventory posting service remains the mutation authority.
check('export const BUILD = 309' in service and 'postCreativeInventoryUsage' in service, 'Build 309 Inventory posting service identity changed')
check('creative_project_material_review_id' in service and 'inventory_post_stale_stock' in service, 'Build 309 guarded/idempotent posting behavior missing')
print('PASS: Build 309 Inventory posting authority remains frozen beneath the Build 310 consumer')

# Contract/runtime truth after the consumer cutover.
check("implementationState: 'implemented-creative-consumer-enabled'" in contracts and contracts.count('consumerWritesReady: true') >= 2, 'post and reverse contracts must both be Creative-consumer-enabled')
check('export const BUILD = 310' in boundary and "consumerMutationReady: true" in boundary, 'Build 310 write boundary must report both Inventory mutation consumers ready')
check("implementationState: 'implemented-creative-consumer-enabled'" in boundary and boundary.count('consumerWritesReady: true') >= 2, 'Build 310 write boundary must enable post and reverse consumers')
check('const BUILD = 310' in runtime and 'ownsInventoryMutations: false' in runtime and 'consumerMutationReady: true' in runtime, 'Commerce runtime must surface consumer readiness without owning mutations')
check("inventory-write-boundary.mjs?v=310" in runtime, 'Commerce runtime must cache-bust the Build 310 write boundary')
print('PASS: post and reverse consumers are enabled while Commerce remains non-mutating')

# Core architecture identity is unchanged; only write/runtime catalog metadata advances.
check('export const BUILD = 302' in groups, 'Core architecture identity must remain Build 302')
check('export const INVENTORY_WRITE_CONTRACT_BUILD = 310' in groups, 'Inventory write-contract catalog must advance to Build 310')
check("runtime.mjs?v=310" in groups, 'Commerce runtime catalog entry must point to Build 310')
check("dd-admin-module-runtime.mjs?v=310" in admin, 'shared Admin loader must request the Build 310 Core graph')
check('admin.js?v=310' in page, 'Inventory validation page must request the Build 310 shared loader')
print('PASS: Build 310 runtime/catalog/cache identity is explicit without changing architecture Build 302')

# Build 309 proof stays historically honest.
check('Build 309 is COMPLETE IN DEVELOPMENT' in validation or 'COMPLETE IN DEVELOPMENT' in validation, 'Build 309 completion must remain historically recorded')
check('f23a914c9ea4848c6f91d715ce0c983a06f716b3' in architecture or 'f23a914c9ea4848c6f91d715ce0c983a06f716b3' in handoff, 'Build 309 proven runtime head must remain pinned')
print('PASS: completed Build 309 post-authority proof remains historically pinned')

# Documentation states the safe Build 310 intent.
for text_value, label in [(validation, validation_path), (architecture, architecture_path), (handoff, handoff_path), (read(changed_path) if (ROOT / changed_path).exists() else '', changed_path)]:
    check('Build 310' in text_value, f'{label} does not record Build 310')
check('Production' in architecture and 'Operations' in architecture, 'Build 310 architecture doc must preserve Production/Operations exclusions')
print('PASS: Build 310 handoff documents the posting-consumer cutover and exclusions')

expected = {
    'AI_CONTEXT.md',
    'BUILD310_CHANGED_FILES.md',
    'BUILD310_VALIDATION.md',
    'admin/inventory-operations/index.html',
    'docs/architecture/BUILD310_CREATIVE_INVENTORY_POST_CONSUMER_CUTOVER.md',
    'functions/api/_lib/creativeInventoryPostConsumer.js',
    'functions/api/admin/creative-process-compat.js',
    'functions/api/admin/creative-process.js',
    'public/js/admin.js',
    'public/js/core/dd-application-module-groups.mjs',
    'public/js/core/dd-module-contracts.mjs',
    'public/js/modules/commerce-operations/inventory-write-boundary.mjs',
    'public/js/modules/commerce-operations/runtime.mjs',
    'scripts/build310_creative_inventory_post_consumer_cutover_test.py',
}
try:
    changed = set(subprocess.check_output(['git', 'diff', '--name-only', f'{BASE}..HEAD'], cwd=ROOT, text=True).splitlines())
    check(changed == expected, f'exact Build 310 boundary mismatch; expected {sorted(expected)}, found {sorted(changed)}')
except Exception as exc:
    failures.append(f'could not verify Build 310 changed-file boundary: {exc}')
print('PASS: exact Build 310 Creative Inventory post-consumer changed-file boundary')

for path in expected:
    lower = path.lower()
    check(not lower.endswith('.sql'), f'Build 310 unexpectedly changes SQL: {path}')
    check(path not in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}, f'Build 310 unexpectedly changes Cloudflare config: {path}')
print('PASS: no SQL/schema, Cloudflare binding/config, R2, Operations implementation, or real Production change')

if failures:
    print('BUILD 310 CREATIVE INVENTORY POST CONSUMER CUTOVER: FAIL')
    for item in failures:
        print(' -', item)
    sys.exit(1)

print('BUILD 310 CREATIVE INVENTORY POST CONSUMER CUTOVER: PASS')
print('No Cloudflare resource was contacted.')
