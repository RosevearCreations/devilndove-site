#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "000b9617bc5141ba876ec667d4fbc653ea9ee556"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD303_CHANGED_FILES.md",
    "BUILD303_VALIDATION.md",
    "docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "scripts/build302_core_three_module_architecture_test.py",
    "scripts/build303_commerce_operations_umbrella_bridge_test.py",
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


for path in ["public/js/admin.js", "public/js/core/dd-admin-module-runtime.mjs"]:
    syntax = run(["node", "--check", path])
    if syntax.returncode:
        fail(syntax.stderr.strip() or f"JavaScript syntax failed: {path}")
print("PASS: Build 303 shared Admin/Core JavaScript syntax")

runtime = read("public/js/core/dd-admin-module-runtime.mjs")
for marker in [
    "// Devil n Dove Build 303 Admin module runtime bridge.",
    "BUILD as APPLICATION_ARCHITECTURE_BUILD",
    "applicationModuleForDomain",
    "getApplicationModule",
    "snapshotApplicationArchitecture",
    "link.dataset.ddApplicationModuleTarget",
    "document.documentElement.dataset.ddApplicationModule",
    "document.documentElement.dataset.ddApplicationModuleMode = 'domain-bridge'",
    "dd:application-module-resolved",
    "build: 303",
    "applicationArchitectureBuild: APPLICATION_ARCHITECTURE_BUILD",
    "getCurrentApplicationModule: () => currentApplicationModule",
]:
    if marker not in runtime:
        fail(f"Build 303 Core runtime marker missing: {marker}")
for forbidden in ["fetch(", "DDAuth.apiFetch", "XMLHttpRequest"]:
    if forbidden in runtime:
        fail(f"Build 303 Core runtime unexpectedly creates network transport: {forbidden}")
print("PASS: Build 303 Core runtime adds umbrella classification without new network transport")

admin = read("public/js/admin.js")
for marker in [
    "Build 303: Core runtime reports Build 302 umbrella application-module classification",
    "dd-admin-module-runtime.mjs?v=303",
]:
    if marker not in admin:
        fail(f"Build 303 shared Admin loader marker missing: {marker}")
print("PASS: shared Admin loader cache-busts the Build 303 Core runtime")

catalog = read("public/js/core/dd-application-module-groups.mjs")
for marker in [
    "id: 'commerce-operations'",
    "domains: Object.freeze(['public', 'catalog', 'inventory', 'operations'])",
    "id: 'creative-production'",
    "domains: Object.freeze(['creative', 'caip', 'packaging', 'content'])",
    "id: 'business-administration'",
    "domains: Object.freeze(['marketing', 'accounting', 'platform', 'admin'])",
]:
    if marker not in catalog:
        fail(f"Build 302 umbrella catalog marker missing during Build 303: {marker}")
print("PASS: Build 303 consumes the completed Build 302 three-module grouping")

build302_test = read("scripts/build302_core_three_module_architecture_test.py")
for marker in [
    'HISTORICAL_HEAD = "000b9617bc5141ba876ec667d4fbc653ea9ee556"',
    'git_show(HISTORICAL_HEAD, catalog_path)',
    'BUILD 302 CORE + THREE MODULE ARCHITECTURE HISTORICAL REGRESSION: PASS',
]:
    if marker not in build302_test:
        fail(f"completed Build 302 historical pin missing marker: {marker}")
print("PASS: completed Build 302 architecture proof is historically pinned")

# Build 303 must not change domain ownership/services or the proven Packaging stack.
protected = [
    "public/js/core/dd-module-registry.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "admin/packaging-studio/index.html",
    "public/js/admin-packaging-compatibility-v301.js",
    "public/js/admin-packaging-save-stabilizer-v300.js",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/admin-packaging-client-transport-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/admin-packaging-studio.js",
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
        fail(f"protected domain/service/Packaging file changed in Build 303: {path}")
print("PASS: domain services and the completed Build 301 Packaging stack remain unchanged")

# Confirm the mapping contract itself by executing only the passive catalog.
node_check = r'''
import {
  applicationModuleForDomain,
  snapshotApplicationArchitecture,
} from './public/js/core/dd-application-module-groups.mjs';
const expected = {
  catalog: 'commerce-operations',
  inventory: 'commerce-operations',
  operations: 'commerce-operations',
  packaging: 'creative-production',
  accounting: 'business-administration',
};
const errors = [];
for (const [domain, moduleId] of Object.entries(expected)) {
  const actual = applicationModuleForDomain(domain);
  if (actual !== moduleId) errors.push(`${domain}: expected ${moduleId}, got ${actual}`);
}
const snapshot = snapshotApplicationArchitecture();
if (snapshot.topLevelApplicationModuleCount !== 3) errors.push('top-level module count is not 3');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('umbrella-map-ok');
'''
module_check = run(["node", "--input-type=module", "--eval", node_check])
if module_check.returncode:
    fail(module_check.stderr.strip() or module_check.stdout.strip() or "Build 303 umbrella mapping check failed")
print("PASS: Commerce/Packaging/Accounting domains resolve to the expected umbrella modules")

committed = changed_files(BASE, "HEAD")
working = changed_files("HEAD")
staged = changed_files("--cached", "HEAD")
actual = committed | working | staged
if actual != EXPECTED:
    fail(
        "Build 303 changed-file boundary mismatch. "
        f"expected={sorted(EXPECTED)} actual={sorted(actual)}"
    )
print("PASS: exact Build 303 umbrella-bridge changed-file boundary")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in Build 303 boundary: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 303 COMMERCE & OPERATIONS UMBRELLA RUNTIME BRIDGE: PASS")
print("No Cloudflare resource was contacted.")
