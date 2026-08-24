#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "6cbcc4353327eea093ef4701497fa5321b680096"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD304_CHANGED_FILES.md",
    "BUILD304_VALIDATION.md",
    "docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md",
    "admin/products/index.html",
    "admin/packaging-studio/index.html",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build303_commerce_operations_umbrella_bridge_test.py",
    "scripts/build304_commerce_operations_catalog_runtime_test.py",
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
    "public/js/modules/commerce-operations/runtime.mjs",
]:
    syntax = run(["node", "--check", path])
    if syntax.returncode:
        fail(syntax.stderr.strip() or f"JavaScript syntax failed: {path}")
print("PASS: Build 304 shared Core/catalog/application-runtime JavaScript syntax")

admin = read("public/js/admin.js")
for marker in [
    "Build 304: Core activates the Commerce & Operations umbrella runtime for Catalog routes only.",
    "dd-admin-module-runtime.mjs?v=304",
]:
    if marker not in admin:
        fail(f"Build 304 shared Admin loader marker missing: {marker}")
print("PASS: shared Admin loader cache-busts the Build 304 Core runtime")

catalog = read("public/js/core/dd-application-module-groups.mjs")
for marker in [
    "export const BUILD = 302;",
    "export const RUNTIME_CATALOG_BUILD = 304;",
    "id: 'commerce-operations'",
    "extractionState: 'in-progress'",
    "entry: '../modules/commerce-operations/runtime.mjs?v=304'",
    "runtimeDomains: Object.freeze(['catalog'])",
    "id: 'creative-production'",
    "entry: null",
    "firstUmbrellaRuntimeModule: 'commerce-operations'",
    "firstUmbrellaRuntimeDomain: 'catalog'",
    "applicationModuleRuntimeForDomain",
]:
    if marker not in catalog:
        fail(f"Build 304 application catalog marker missing: {marker}")
for forbidden in ["fetch(", "setInterval(", "setTimeout(", "XMLHttpRequest", "DDAuth.apiFetch"]:
    if forbidden in catalog:
        fail(f"Build 304 application catalog unexpectedly creates runtime work: {forbidden}")
print("PASS: Build 302 architecture remains intact while Build 304 opts only Catalog into the first umbrella runtime")

runtime = read("public/js/modules/commerce-operations/runtime.mjs")
for marker in [
    "const BUILD = 304;",
    "const MODULE_ID = 'commerce-operations';",
    "const SUPPORTED_DOMAINS = Object.freeze(['catalog']);",
    "const REQUIRED_SERVICES = Object.freeze(['catalog-read']);",
    "behaviorMode: 'catalog-first-umbrella-runtime-boundary'",
    "createsNetworkTransport: false",
    "export async function onLoad",
    "export async function onActivate",
    "export async function onDeactivate",
    "catalogRuntimeBoundaryActive",
    "window.DDCommerceOperations",
]:
    if marker not in runtime:
        fail(f"Build 304 Commerce & Operations runtime marker missing: {marker}")
for forbidden in ["fetch(", "DDAuth.apiFetch", "XMLHttpRequest", "inventory-read", "operations-read"]:
    if forbidden in runtime:
        fail(f"Build 304 Catalog-first runtime exceeded scope: {forbidden}")
print("PASS: Commerce & Operations runtime is Catalog-only, service-bounded, and creates no network transport")

core = read("public/js/core/dd-admin-module-runtime.mjs")
for marker in [
    "// Devil n Dove Build 304 Admin module runtime bridge.",
    "RUNTIME_CATALOG_BUILD as APPLICATION_RUNTIME_CATALOG_BUILD",
    "applicationModuleRuntimeForDomain",
    "let activeApplicationModuleId = null",
    "const applicationModuleNamespaces = new Map()",
    "async function loadApplicationModule",
    "async function activateApplicationModuleForDefinition",
    "async function deactivateActiveApplicationModule",
    "getActiveApplicationModuleId: () => activeApplicationModuleId",
    "getCurrentApplicationModuleRuntimeStatus",
    "build: 304",
    "applicationArchitectureBuild: APPLICATION_ARCHITECTURE_BUILD",
    "applicationRuntimeCatalogBuild: APPLICATION_RUNTIME_CATALOG_BUILD",
    "reconcileVerifiedAuthState",
]:
    if marker not in core:
        fail(f"Build 304 Core runtime marker missing: {marker}")
for forbidden in ["fetch(", "DDAuth.apiFetch", "XMLHttpRequest"]:
    if forbidden in core:
        fail(f"Build 304 Core runtime unexpectedly creates network transport: {forbidden}")
print("PASS: Core now has a generic top-level application-module lifecycle while preserving Build 303 auth reconciliation")

node_check = r'''
import {
  BUILD,
  RUNTIME_CATALOG_BUILD,
  applicationModuleForDomain,
  applicationModuleRuntimeForDomain,
  snapshotApplicationArchitecture,
} from './public/js/core/dd-application-module-groups.mjs';
const errors = [];
if (BUILD !== 302) errors.push(`architecture build changed to ${BUILD}`);
if (RUNTIME_CATALOG_BUILD !== 304) errors.push(`runtime catalog build=${RUNTIME_CATALOG_BUILD}`);
if (applicationModuleForDomain('catalog') !== 'commerce-operations') errors.push('catalog umbrella mapping changed');
const catalogRuntime = applicationModuleRuntimeForDomain('catalog');
if (catalogRuntime?.id !== 'commerce-operations') errors.push('catalog runtime is not commerce-operations');
for (const domain of ['inventory', 'operations', 'public', 'packaging', 'creative', 'accounting']) {
  if (applicationModuleRuntimeForDomain(domain) !== null) errors.push(`${domain} unexpectedly has an umbrella runtime`);
}
const snapshot = snapshotApplicationArchitecture();
if (snapshot.topLevelApplicationModuleCount !== 3) errors.push('top-level module count changed');
if (snapshot.firstUmbrellaRuntimeDomain !== 'catalog') errors.push('first runtime domain is not catalog');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('catalog-umbrella-runtime-map-ok');
'''
module_check = run(["node", "--input-type=module", "--eval", node_check])
if module_check.returncode:
    fail(module_check.stderr.strip() or module_check.stdout.strip() or "Build 304 runtime catalog mapping check failed")
print("PASS: only Catalog resolves to an active umbrella-runtime definition in Build 304")

build303_test = read("scripts/build303_commerce_operations_umbrella_bridge_test.py")
for marker in [
    'HISTORICAL_HEAD = "6cbcc4353327eea093ef4701497fa5321b680096"',
    'git_show(HISTORICAL_HEAD, "public/js/core/dd-admin-module-runtime.mjs")',
    '"catalog    -> commerce-operations"',
    'BUILD 303 COMMERCE & OPERATIONS UMBRELLA BRIDGE HISTORICAL REGRESSION: PASS',
]:
    if marker not in build303_test:
        fail(f"completed Build 303 historical pin missing marker: {marker}")
print("PASS: completed Build 303 runtime/browser proof is historically pinned")

products = read("admin/products/index.html")
packaging_page = read("admin/packaging-studio/index.html")
if '/public/js/admin.js?v=304' not in products:
    fail("Products validation page does not cache-bust the Build 304 shared Admin loader")
if '/public/js/admin.js?v=304' not in packaging_page:
    fail("Packaging validation page does not cache-bust the Build 304 shared Admin loader")
expected_products_diff = {
    '-  <script src="/public/js/admin.js?v=245"></script>',
    '+  <script src="/public/js/admin.js?v=304"></script>',
}
expected_packaging_diff = {
    '-  <script src="/public/js/admin.js?v=296"></script>',
    '+  <script src="/public/js/admin.js?v=304"></script>',
}
if set(payload_diff_lines("admin/products/index.html")) != expected_products_diff:
    fail("Products page changed beyond the Build 304 shared Admin loader cache-bust")
if set(payload_diff_lines("admin/packaging-studio/index.html")) != expected_packaging_diff:
    fail("Packaging page changed beyond the Build 304 shared Admin loader cache-bust")
print("PASS: Build 304 validation pages explicitly load the fresh shared Admin/Core runtime and otherwise remain unchanged")

protected = [
    "public/js/core/dd-module-registry.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "admin/catalog/index.html",
    "public/js/admin-packaging-compatibility-v301.js",
    "public/js/admin-packaging-save-stabilizer-v300.js",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/admin-packaging-client-transport-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/admin-packaging-studio.js",
    "public/js/modules/packaging/runtime.mjs",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/contracts/catalog-read.js",
    "functions/api/admin/contracts/inventory-read.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"protected domain/API/Packaging file changed in Build 304: {path}")
print("PASS: Catalog APIs, Inventory/Operations domains, and completed Packaging runtime remain unchanged")

committed = changed_files(BASE, "HEAD")
working = changed_files("HEAD")
staged = changed_files("--cached", "HEAD")
actual = committed | working | staged
if actual != EXPECTED:
    fail(f"Build 304 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 304 Catalog-first umbrella-runtime changed-file boundary")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in Build 304 boundary: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 304 COMMERCE & OPERATIONS CATALOG UMBRELLA RUNTIME: PASS")
print("No Cloudflare resource was contacted.")
