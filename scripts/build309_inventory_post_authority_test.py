#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = '6d9a236ae688fe3d4b8e6975b866c637efe51c9b'

EXPECTED = {
    'AI_CONTEXT.md',
    'BUILD309_CHANGED_FILES.md',
    'BUILD309_VALIDATION.md',
    'admin/inventory-operations/index.html',
    'docs/architecture/BUILD309_INVENTORY_POST_AUTHORITY.md',
    'functions/api/_lib/inventoryPostService.js',
    'functions/api/admin/contracts/inventory-post.js',
    'public/js/admin.js',
    'public/js/core/dd-application-module-groups.mjs',
    'public/js/core/dd-module-contracts.mjs',
    'public/js/modules/commerce-operations/inventory-write-boundary.mjs',
    'public/js/modules/commerce-operations/runtime.mjs',
    'scripts/build309_inventory_post_authority_test.py',
}

failures = []

def check(ok, message):
    if not ok:
        failures.append(message)
    else:
        print(f'PASS: {message}')


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')

syntax_files = [
    'functions/api/_lib/inventoryPostService.js',
    'functions/api/admin/contracts/inventory-post.js',
    'public/js/admin.js',
    'public/js/core/dd-module-contracts.mjs',
    'public/js/core/dd-application-module-groups.mjs',
    'public/js/modules/commerce-operations/inventory-write-boundary.mjs',
    'public/js/modules/commerce-operations/runtime.mjs',
]
syntax_ok = True
for rel in syntax_files:
    proc = subprocess.run(['node', '--check', str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode != 0:
        syntax_ok = False
        failures.append(f'{rel} JavaScript syntax failed: {proc.stderr.strip()}')
check(syntax_ok, 'Build 309 Inventory post/contract/runtime JavaScript syntax')

service = read('functions/api/_lib/inventoryPostService.js')
route = read('functions/api/admin/contracts/inventory-post.js')
contracts = read('public/js/core/dd-module-contracts.mjs')
boundary = read('public/js/modules/commerce-operations/inventory-write-boundary.mjs')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin = read('public/js/admin.js')
page = read('admin/inventory-operations/index.html')
context = read('AI_CONTEXT.md')

check(
    "export const BUILD = 309" in service
    and "export const CONTRACT_ID = 'inventory-post'" in service
    and "IMPLEMENTATION_STATE = 'implemented-not-consumer-enabled'" in service,
    'Inventory owns a dedicated Build 309 post service but Creative consumption is not enabled',
)

check(
    'creative_project_material_review_id' in service
    and 'review_status' in service
    and 'inventory_consumed' in service
    and 'NOT EXISTS' in service
    and 'db.batch(statements)' in service,
    'post service claims one approved material review idempotently inside one guarded D1 batch',
)

check(
    "'consume'" in service
    and 'site_inventory_movements' in service
    and 'site_inventory_usage_movements' in service
    and 'site_inventory_movement_id' in service
    and 'creative_project_inventory_usage_details' in service,
    'post service records physical and fractional usage provenance through linked Inventory movements',
)

check(
    "POST /api/admin/contracts/inventory-post" not in route
    and 'postCreativeInventoryUsage' in route
    and 'getInventoryPostReadiness' in route
    and 'consumer_writes_ready: false' in route
    and 'schema_ready' in route,
    'Inventory post contract route exposes safe readiness and the owned mutation authority without enabling consumers',
)

check(
    "contract('inventory-post'" in contracts
    and "route: '/api/admin/contracts/inventory-post'" in contracts
    and "implementationState: 'implemented-not-consumer-enabled'" in contracts
    and "contract('inventory-reverse'" in contracts
    and "implementationState: 'implemented-creative-consumer-enabled'" in contracts
    and 'consumerWritesReady: true' in contracts,
    'contract catalog keeps reverse consumer-enabled while post remains implemented but consumer-disabled',
)

check(
    'export const BUILD = 309' in boundary
    and "POST_CONTRACT_ROUTE = '/api/admin/contracts/inventory-post'" in boundary
    and 'atomicReviewPosting: true' in boundary
    and 'consumerWritesReady: false' in boundary
    and "implementationState: 'implemented-creative-consumer-enabled'" in boundary,
    'write boundary reports the Build 309 post service without regressing the proven reverse cutover',
)

check(
    'const BUILD = 309' in runtime
    and "inventory-write-boundary.mjs?v=309" in runtime
    and 'inventoryPostRoute' in runtime
    and 'inventoryPostConsumerReady' in runtime
    and 'inventoryPostAtomicReviewPosting' in runtime
    and 'ownsInventoryMutations: false' in runtime,
    'Commerce runtime surfaces Build 309 post readiness while remaining a non-mutating umbrella runtime',
)

check(
    'INVENTORY_WRITE_CONTRACT_BUILD = 309' in groups
    and "runtime.mjs?v=309" in groups
    and "currentRuntimeMigrationMode: 'catalog-inventory-post-and-reversal-authorities'" in groups,
    'Core architecture catalog points Inventory runtime diagnostics at Build 309 without changing architecture build 302',
)

check(
    "dd-admin-module-runtime.mjs?v=309" in admin
    and 'admin.js?v=309' in page,
    'Inventory validation page and shared loader explicitly request the Build 309 runtime metadata',
)

check(
    'Build 308' in context and 'BROWSER PROVEN' in context
    and 'Build 309' in context,
    'handoff records the Build 308 proof honestly and the staged Build 309 authority pass',
)

try:
    proc = subprocess.run(
        ['git', 'diff', '--name-only', f'{BASE}..HEAD'],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    changed = {line.strip() for line in proc.stdout.splitlines() if line.strip()}
    check(changed == EXPECTED, 'exact Build 309 Inventory post-authority changed-file boundary')
    unexpected = sorted(
        p for p in changed
        if p.endswith('.sql')
        or p in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}
        or p == 'functions/api/admin/creative-process.js'
        or p == 'functions/api/_lib/inventoryReversalService.js'
        or p == 'functions/api/admin/site-item-inventory.js'
    )
    check(not unexpected, 'Build 309 leaves Creative consumer, reversal authority, legacy Inventory mutations, SQL/schema, and Cloudflare config unchanged')
except Exception as exc:
    failures.append(f'could not validate git boundary: {exc}')

if failures:
    print('BUILD 309 INVENTORY POST AUTHORITY: FAIL')
    for failure in failures:
        print(' -', failure)
    sys.exit(1)

print('BUILD 309 INVENTORY POST AUTHORITY: PASS')
print('No Cloudflare resource was contacted.')
