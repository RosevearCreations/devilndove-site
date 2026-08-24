#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "eba6d248a6c3a8725076c3f31b1edbfb0fa5f74e"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD306_CHANGED_FILES.md",
    "BUILD306_VALIDATION.md",
    "admin/inventory-operations/index.html",
    "docs/architecture/BUILD306_INVENTORY_WRITE_CONTRACTS.md",
    "public/js/admin.js",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/modules/commerce-operations/inventory-write-boundary.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build305_commerce_operations_inventory_runtime_test.py",
    "scripts/build306_inventory_write_contracts_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, encoding="utf-8", errors="replace")


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def changed_files(*args):
    result = run(["git", "diff", "--name-only", *args])
    if result.returncode:
        fail(result.stderr.strip() or f"could not compare {args}")
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


def payload_diff_lines(path):
    result = run(["git", "diff", "--unified=0", BASE, "HEAD", "--", path])
    if result.returncode:
        fail(result.stderr.strip() or f"could not inspect diff for {path}")
    return [
        line for line in result.stdout.splitlines()
        if (line.startswith("+") or line.startswith("-"))
        and not line.startswith("+++") and not line.startswith("---")
    ]


for path in [
    "public/js/admin.js",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/modules/commerce-operations/inventory-write-boundary.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
]:
    syntax = run(["node", "--check", path])
    if syntax.returncode:
        fail(syntax.stderr.strip() or f"JavaScript syntax failed: {path}")
print("PASS: Build 306 shared loader/contract/Commerce JavaScript syntax")

admin = read("public/js/admin.js")
for marker in [
    "Build 306: Inventory write-side contract readiness is exposed without moving mutation authority.",
    "dd-admin-module-runtime.mjs?v=306",
]:
    if marker not in admin:
        fail(f"Build 306 shared-loader marker missing: {marker}")
print("PASS: Build 306 cache-busts the proven Core lifecycle without rewriting Core")

catalog = read("public/js/core/dd-application-module-groups.mjs")
for marker in [
    "export const BUILD = 302;",
    "export const RUNTIME_CATALOG_BUILD = 304;",
    "export const RUNTIME_INVENTORY_BUILD = 305;",
    "export const INVENTORY_WRITE_CONTRACT_BUILD = 306;",
    "entry: '../modules/commerce-operations/runtime.mjs?v=306'",
    "runtimeDomains: Object.freeze(['catalog', 'inventory'])",
    "currentRuntimeMigrationMode: 'catalog-inventory-write-contract-hardening'",
]:
    if marker not in catalog:
        fail(f"Build 306 application catalog marker missing: {marker}")
print("PASS: Catalog + Inventory runtime ownership is preserved while write-contract build advances to 306")

contracts = read("public/js/core/dd-module-contracts.mjs")
for marker in [
    "// Devil n Dove Build 306 cross-module contract catalog.",
    "contract('inventory-post'",
    "authorityRoute: '/api/admin/site-item-inventory'",
    "authorityAction: 'consume_usage'",
    "implementationState: 'existing-authority-not-yet-contract-route'",
    "contract('inventory-reverse'",
    "implementationState: 'blocked-pending-compensating-movement-service'",
    "requiresOriginalMovementId: true",
    "compensatingMovementOnly: true",
    "directStockAddBackAllowed: false",
    "consumerWritesReady: false",
]:
    if marker not in contracts:
        fail(f"Build 306 write-contract marker missing: {marker}")
print("PASS: Inventory post/reverse contracts record current authority and fail-closed reversal requirements")

boundary = read("public/js/modules/commerce-operations/inventory-write-boundary.mjs")
for marker in [
    "export const BUILD = 306;",
    "export const LEGACY_AUTHORITY_ROUTE = '/api/admin/site-item-inventory';",
    "export const POST_ACTION = 'consume_usage';",
    "requiresOriginalMovementId: true",
    "compensatingMovementOnly: true",
    "directStockAddBackAllowed: false",
    "consumerMutationReady: false",
    "mutatesInventory: false",
    "window.DDInventoryWriteBoundary",
]:
    if marker not in boundary:
        fail(f"Build 306 Inventory write-boundary marker missing: {marker}")
for forbidden in ["fetch(", "apiFetch(", "XMLHttpRequest", "method: 'POST'", 'method: "POST"']:
    if forbidden in boundary:
        fail(f"Build 306 write boundary unexpectedly performs mutation/network work: {forbidden}")
print("PASS: Inventory write-boundary facade is declarative and performs no mutation or network work")

runtime = read("public/js/modules/commerce-operations/runtime.mjs")
for marker in [
    "const BUILD = 306;",
    "const SUPPORTED_DOMAINS = Object.freeze(['catalog', 'inventory']);",
    "inventory: Object.freeze(['inventory-read'])",
    "inventoryWriteBoundaryBuild: INVENTORY_WRITE_BOUNDARY_BUILD",
    "inventoryConsumerMutationReady: writeBoundary.consumerMutationReady",
    "inventoryReverseRequiresOriginalMovementId",
    "inventoryDirectStockAddBackAllowed",
    "ownsInventoryMutations: false",
]:
    if marker not in runtime:
        fail(f"Build 306 Commerce runtime marker missing: {marker}")
for forbidden in ["fetch(", "DDAuth.apiFetch", "XMLHttpRequest", "inventory-post", "inventory-reverse"]:
    if forbidden in runtime:
        fail(f"Build 306 Commerce runtime exceeded diagnostic-only scope: {forbidden}")
print("PASS: Commerce runtime exposes write readiness while remaining read-only and non-mutating")

node_check = r'''
import { DD_MODULE_DEFINITIONS } from './public/js/core/dd-module-definitions.mjs';
import { DD_MODULE_CONTRACTS, moduleContract, validateModuleContracts } from './public/js/core/dd-module-contracts.mjs';
import { INVENTORY_WRITE_BOUNDARY } from './public/js/modules/commerce-operations/inventory-write-boundary.mjs';
const errors = [];
const validation = validateModuleContracts(DD_MODULE_DEFINITIONS, DD_MODULE_CONTRACTS);
if (!validation.ok) errors.push(`contract validation failed: ${validation.errors.join(', ')}`);
const post = moduleContract('inventory-post');
const reverse = moduleContract('inventory-reverse');
if (post?.authorityRoute !== '/api/admin/site-item-inventory') errors.push('inventory-post authority route changed');
if (post?.authorityAction !== 'consume_usage') errors.push('inventory-post authority action changed');
if (post?.consumerWritesReady !== false) errors.push('inventory-post unexpectedly consumer-ready');
if (reverse?.requiresOriginalMovementId !== true) errors.push('inventory-reverse does not require original movement id');
if (reverse?.compensatingMovementOnly !== true) errors.push('inventory-reverse is not compensation-only');
if (reverse?.directStockAddBackAllowed !== false) errors.push('inventory-reverse permits direct add-back');
if (reverse?.consumerWritesReady !== false) errors.push('inventory-reverse unexpectedly consumer-ready');
if (INVENTORY_WRITE_BOUNDARY.consumerMutationReady !== false) errors.push('write boundary unexpectedly mutation-ready');
if (INVENTORY_WRITE_BOUNDARY.mutatesInventory !== false) errors.push('write boundary unexpectedly mutates Inventory');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('build306-inventory-write-contracts-ok');
'''
node = run(["node", "--input-type=module", "--eval", node_check])
if node.returncode:
    fail(node.stderr.strip() or node.stdout.strip() or "Build 306 contract execution check failed")
print("PASS: executable contract catalog enforces blocked compensating reversal and non-ready consumer writes")

# The existing Inventory mutation authority is evidence, not a Build 306 change.
for path in [
    "functions/api/admin/site-item-inventory.js",
    "public/js/admin-site-item-inventory.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "functions/api/admin/contracts/inventory-read.js",
    "admin/packaging-studio/index.html",
    "public/js/modules/packaging/runtime.mjs",
    "functions/api/admin/packaging-write.js",
]:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"protected authority/runtime file changed in Build 306: {path}")
print("PASS: existing Inventory mutation authority, Core lifecycle, read adapter, and Packaging implementation remain unchanged")

server = read("functions/api/admin/site-item-inventory.js")
for marker in ["consume_usage", "site_inventory_movements", "site_inventory_movement_id"]:
    if marker not in server:
        fail(f"existing Inventory authority evidence missing: {marker}")
print("PASS: existing Inventory authority still records movement-backed consume_usage evidence")

build305 = read("scripts/build305_commerce_operations_inventory_runtime_test.py")
for marker in [
    'HISTORICAL_HEAD = "eba6d248a6c3a8725076c3f31b1edbfb0fa5f74e"',
    "BUILD 305 COMMERCE & OPERATIONS INVENTORY RUNTIME HISTORICAL REGRESSION: PASS",
]:
    if marker not in build305:
        fail(f"completed Build 305 historical pin missing marker: {marker}")
print("PASS: completed Build 305 Inventory runtime proof is historically pinned")

inventory_page = read("admin/inventory-operations/index.html")
if '/public/js/admin.js?v=306' not in inventory_page:
    fail("Inventory Operations page does not load Build 306 diagnostics")
expected_inventory_diff = {
    '-  <script src="/public/js/admin.js?v=305"></script>',
    '+  <script src="/public/js/admin.js?v=306"></script>',
}
if set(payload_diff_lines("admin/inventory-operations/index.html")) != expected_inventory_diff:
    fail("Inventory Operations page changed beyond the Build 306 shared-loader pin")
print("PASS: Inventory validation page changes only the Build 306 shared-loader query")

committed = changed_files(BASE, "HEAD")
working = changed_files("HEAD")
staged = changed_files("--cached", "HEAD")
actual = committed | working | staged
if actual != EXPECTED:
    fail(f"Build 306 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 306 Inventory write-contract changed-file boundary")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in Build 306 boundary: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or real Production change")

print("BUILD 306 INVENTORY WRITE-SIDE CONTRACT HARDENING: PASS")
print("No Cloudflare resource was contacted.")
