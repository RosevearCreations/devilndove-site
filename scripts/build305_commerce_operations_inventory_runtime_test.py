#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "b142b3a6267df57ac43b8189982bd6abe82605ac"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD305_CHANGED_FILES.md",
    "BUILD305_VALIDATION.md",
    "admin/inventory-operations/index.html",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build304_commerce_operations_catalog_runtime_test.py",
    "scripts/build305_commerce_operations_inventory_runtime_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(
        args,
        cwd=ROOT,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
    )


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
        line
        for line in result.stdout.splitlines()
        if (line.startswith("+") or line.startswith("-"))
        and not line.startswith("+++")
        and not line.startswith("---")
    ]


for path in [
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
]:
    syntax = run(["node", "--check", path])
    if syntax.returncode:
        fail(syntax.stderr.strip() or f"JavaScript syntax failed: {path}")
print("PASS: Build 305 shared Core/definition/Commerce runtime JavaScript syntax")

admin = read("public/js/admin.js")
for marker in [
    "Build 305: Commerce & Operations extends to Inventory through the existing inventory-read authority.",
    "dd-admin-module-runtime.mjs?v=305",
]:
    if marker not in admin:
        fail(f"Build 305 shared Admin loader marker missing: {marker}")
print("PASS: shared Admin loader points to the Build 305 Core runtime")

catalog = read("public/js/core/dd-application-module-groups.mjs")
for marker in [
    "export const BUILD = 302;",
    "export const RUNTIME_CATALOG_BUILD = 304;",
    "export const RUNTIME_INVENTORY_BUILD = 305;",
    "entry: '../modules/commerce-operations/runtime.mjs?v=305'",
    "runtimeDomains: Object.freeze(['catalog', 'inventory'])",
    "secondUmbrellaRuntimeDomain: 'inventory'",
    "currentRuntimeMigrationMode: 'catalog-inventory-umbrella-runtime-extraction'",
]:
    if marker not in catalog:
        fail(f"Build 305 application runtime catalog marker missing: {marker}")
for forbidden in ["fetch(", "setInterval(", "setTimeout(", "XMLHttpRequest", "DDAuth.apiFetch"]:
    if forbidden in catalog:
        fail(f"Build 305 application catalog unexpectedly creates runtime work: {forbidden}")
print("PASS: Build 302 architecture remains intact while Build 305 opts Catalog and Inventory into Commerce & Operations")

definitions = read("public/js/core/dd-module-definitions.mjs")
for marker in [
    "// Devil n Dove Build 305 module catalog.",
    "id: 'inventory'",
    "'/admin/inventory-operations'",
    "capabilities: ['inventory-read', 'inventory-post', 'inventory-reverse', 'inventory-cost']",
    "id: 'operations'",
]:
    if marker not in definitions:
        fail(f"Build 305 Inventory route-ownership marker missing: {marker}")
print("PASS: real Inventory Operations workspace is explicitly owned by the Inventory domain")

runtime = read("public/js/modules/commerce-operations/runtime.mjs")
for marker in [
    "const BUILD = 305;",
    "const SUPPORTED_DOMAINS = Object.freeze(['catalog', 'inventory']);",
    "catalog: Object.freeze(['catalog-read'])",
    "inventory: Object.freeze(['inventory-read'])",
    "behaviorMode: 'catalog-inventory-umbrella-runtime-boundary'",
    "createsNetworkTransport: false",
    "ownsInventoryMutations: false",
    "inventoryRuntimeBoundaryActive",
    "catalogRuntimeBoundaryActive",
]:
    if marker not in runtime:
        fail(f"Build 305 Commerce runtime marker missing: {marker}")
for forbidden in ["fetch(", "DDAuth.apiFetch", "XMLHttpRequest", "inventory-post", "inventory-reverse", "operations-read"]:
    if forbidden in runtime:
        fail(f"Build 305 Commerce runtime exceeded read-boundary scope: {forbidden}")
print("PASS: Commerce & Operations adds Inventory through inventory-read only and owns no Inventory mutations")

core = read("public/js/core/dd-admin-module-runtime.mjs")
for marker in [
    "// Devil n Dove Build 305 Admin module runtime bridge.",
    "RUNTIME_INVENTORY_BUILD as APPLICATION_RUNTIME_INVENTORY_BUILD",
    "applicationRuntimeInventoryBuild: APPLICATION_RUNTIME_INVENTORY_BUILD",
    "applicationRuntimeCatalogBuild: APPLICATION_RUNTIME_CATALOG_BUILD",
    "build: 305",
    "getActiveApplicationModuleId: () => activeApplicationModuleId",
    "getCurrentApplicationModuleRuntimeStatus",
    "reconcileVerifiedAuthState",
]:
    if marker not in core:
        fail(f"Build 305 Core runtime marker missing: {marker}")
for forbidden in ["fetch(", "DDAuth.apiFetch", "XMLHttpRequest"]:
    if forbidden in core:
        fail(f"Build 305 Core runtime unexpectedly creates network transport: {forbidden}")
print("PASS: Core exposes Build 305 Inventory runtime identity while preserving the generic lifecycle and auth reconciliation")

node_check = r'''
import { createModuleRegistry } from './public/js/core/dd-module-registry.mjs';
import { DD_MODULE_DEFINITIONS } from './public/js/core/dd-module-definitions.mjs';
import {
  BUILD,
  RUNTIME_CATALOG_BUILD,
  RUNTIME_INVENTORY_BUILD,
  applicationModuleForDomain,
  applicationModuleRuntimeForDomain,
  snapshotApplicationArchitecture,
} from './public/js/core/dd-application-module-groups.mjs';
const errors = [];
const registry = createModuleRegistry(DD_MODULE_DEFINITIONS);
const admin = { role: 'admin' };
if (registry.resolve('/admin/inventory-operations/', admin)?.id !== 'inventory') errors.push('inventory-operations route does not resolve to inventory');
if (registry.resolve('/admin/products/', admin)?.id !== 'catalog') errors.push('products route no longer resolves to catalog');
if (BUILD !== 302) errors.push(`architecture build changed to ${BUILD}`);
if (RUNTIME_CATALOG_BUILD !== 304) errors.push(`Catalog runtime historical build changed to ${RUNTIME_CATALOG_BUILD}`);
if (RUNTIME_INVENTORY_BUILD !== 305) errors.push(`Inventory runtime build=${RUNTIME_INVENTORY_BUILD}`);
for (const domain of ['catalog', 'inventory']) {
  if (applicationModuleForDomain(domain) !== 'commerce-operations') errors.push(`${domain} umbrella mapping changed`);
  if (applicationModuleRuntimeForDomain(domain)?.id !== 'commerce-operations') errors.push(`${domain} is not on the Commerce runtime`);
}
for (const domain of ['operations', 'public', 'packaging', 'creative', 'accounting']) {
  if (applicationModuleRuntimeForDomain(domain) !== null) errors.push(`${domain} unexpectedly has an umbrella runtime`);
}
const snapshot = snapshotApplicationArchitecture();
if (snapshot.topLevelApplicationModuleCount !== 3) errors.push('top-level application module count changed');
if (snapshot.secondUmbrellaRuntimeDomain !== 'inventory') errors.push('Inventory is not recorded as the second umbrella runtime domain');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('build305-runtime-map-ok');
'''
module_check = run(["node", "--input-type=module", "--eval", node_check])
if module_check.returncode:
    fail(module_check.stderr.strip() or module_check.stdout.strip() or "Build 305 runtime map check failed")
print("PASS: Catalog and Inventory resolve to the Commerce runtime while Operations/Public remain bridge-only")

build304_test = read("scripts/build304_commerce_operations_catalog_runtime_test.py")
for marker in [
    'HISTORICAL_HEAD = "b142b3a6267df57ac43b8189982bd6abe82605ac"',
    'BUILD 304 COMMERCE & OPERATIONS CATALOG RUNTIME HISTORICAL REGRESSION: PASS',
]:
    if marker not in build304_test:
        fail(f"completed Build 304 historical pin missing marker: {marker}")
print("PASS: completed Build 304 runtime/deployment/browser proof is historically pinned")

inventory_page = read("admin/inventory-operations/index.html")
packaging_page = read("admin/packaging-studio/index.html")
if '/public/js/admin.js?v=305' not in inventory_page:
    fail("Inventory Operations validation page does not load the Build 305 shared Admin/Core loader")
if '/public/js/admin.js?v=305' not in packaging_page:
    fail("Packaging regression page does not load the Build 305 shared Admin/Core loader")
expected_inventory_diff = {
    '-  <script src="/public/js/admin.js?v=245"></script>',
    '+  <script src="/public/js/admin.js?v=305"></script>',
}
expected_packaging_diff = {
    '-  <script src="/public/js/admin.js?v=304"></script>',
    '+  <script src="/public/js/admin.js?v=305"></script>',
}
if set(payload_diff_lines("admin/inventory-operations/index.html")) != expected_inventory_diff:
    fail("Inventory Operations page changed beyond the Build 305 shared-loader pin")
if set(payload_diff_lines("admin/packaging-studio/index.html")) != expected_packaging_diff:
    fail("Packaging page changed beyond the Build 305 shared-loader pin")
print("PASS: Inventory and Packaging validation pages have exact Build 305 shared-loader pins")

protected = [
    "public/js/core/dd-module-registry.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "admin/products/index.html",
    "admin/catalog/index.html",
    "functions/api/admin/contracts/catalog-read.js",
    "functions/api/admin/contracts/inventory-read.js",
    "public/js/admin-packaging-compatibility-v301.js",
    "public/js/admin-packaging-save-stabilizer-v300.js",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "public/js/admin-packaging-studio.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/_lib/packagingDomainService.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"protected Catalog/Inventory API/Packaging file changed in Build 305: {path}")
print("PASS: Catalog behavior, Inventory read/API authority, Inventory mutation paths, and Packaging implementation remain unchanged")

committed = changed_files(BASE, "HEAD")
working = changed_files("HEAD")
staged = changed_files("--cached", "HEAD")
actual = committed | working | staged
if actual != EXPECTED:
    fail(f"Build 305 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 305 Inventory umbrella-runtime changed-file boundary")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in Build 305 boundary: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or real Production change")

print("BUILD 305 COMMERCE & OPERATIONS INVENTORY UMBRELLA RUNTIME: PASS")
print("No Cloudflare resource was contacted.")
