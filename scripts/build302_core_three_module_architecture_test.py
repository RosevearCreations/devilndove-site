#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "a81f8d6af0004d847174fa27043c11e159ca3d10"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD302_CHANGED_FILES.md",
    "BUILD302_VALIDATION.md",
    "docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md",
    "docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md",
    "public/js/core/dd-application-module-groups.mjs",
    "scripts/build301_packaging_compatibility_checkpoint_test.py",
    "scripts/build302_core_three_module_architecture_test.py",
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


catalog_path = "public/js/core/dd-application-module-groups.mjs"
catalog = read(catalog_path)
syntax = run(["node", "--check", catalog_path])
if syntax.returncode:
    fail(syntax.stderr.strip() or "Build 302 architecture catalog JavaScript syntax failed")
print("PASS: Build 302 architecture catalog JavaScript syntax")

for marker in [
    "export const BUILD = 302;",
    "id: 'core'",
    "id: 'commerce-operations'",
    "id: 'creative-production'",
    "id: 'business-administration'",
    "domains: Object.freeze(['public', 'catalog', 'inventory', 'operations'])",
    "domains: Object.freeze(['creative', 'caip', 'packaging', 'content'])",
    "domains: Object.freeze(['marketing', 'accounting', 'platform', 'admin'])",
    "packagingBaselineBuild: 301",
    "packagingDomainModule: 'creative-production'",
]:
    if marker not in catalog:
        fail(f"Build 302 catalog marker missing: {marker}")

for forbidden in [
    "fetch(",
    "setInterval(",
    "setTimeout(",
    "DDAuth",
    "document.",
    "window.",
    "XMLHttpRequest",
]:
    if forbidden in catalog:
        fail(f"Build 302 passive catalog contains runtime side-effect marker: {forbidden}")
print("PASS: Build 302 catalog is passive and defines Core + three application modules")

node_check = r'''
import { DD_MODULE_DEFINITIONS } from './public/js/core/dd-module-definitions.mjs';
import {
  DD_APPLICATION_MODULES,
  DD_DOMAIN_TO_APPLICATION_MODULE,
  snapshotApplicationArchitecture,
} from './public/js/core/dd-application-module-groups.mjs';

const ids = DD_MODULE_DEFINITIONS.map((definition) => definition.id).sort();
const mapped = Object.keys(DD_DOMAIN_TO_APPLICATION_MODULE).sort();
const expectedModules = ['business-administration', 'commerce-operations', 'creative-production'];
const actualModules = DD_APPLICATION_MODULES.map((definition) => definition.id).sort();
const architecture = snapshotApplicationArchitecture();

const errors = [];
if (DD_APPLICATION_MODULES.length !== 3) errors.push(`module-count=${DD_APPLICATION_MODULES.length}`);
if (JSON.stringify(ids) !== JSON.stringify(mapped)) errors.push(`domain-map mismatch ids=${JSON.stringify(ids)} mapped=${JSON.stringify(mapped)}`);
if (JSON.stringify(actualModules) !== JSON.stringify(expectedModules)) errors.push(`module-ids=${JSON.stringify(actualModules)}`);
if (DD_DOMAIN_TO_APPLICATION_MODULE.packaging !== 'creative-production') errors.push('Packaging not mapped to creative-production');
if (architecture.topLevelApplicationModuleCount !== 3) errors.push('snapshot top-level count is not 3');
if (architecture.packagingBaselineBuild !== 301) errors.push('Packaging baseline is not 301');

const counts = new Map();
for (const definition of DD_APPLICATION_MODULES) {
  for (const domainId of definition.domains) counts.set(domainId, (counts.get(domainId) || 0) + 1);
}
for (const id of ids) {
  if (counts.get(id) !== 1) errors.push(`${id} assignment count=${counts.get(id) || 0}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`domains=${ids.length} modules=${DD_APPLICATION_MODULES.length} packaging=${DD_DOMAIN_TO_APPLICATION_MODULE.packaging}`);
'''
module_check = run(["node", "--input-type=module", "--eval", node_check])
if module_check.returncode:
    fail(module_check.stderr.strip() or module_check.stdout.strip() or "Build 302 domain grouping check failed")
print("PASS: all current domains are assigned exactly once across the three application modules")

architecture = read("docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md")
for marker in [
    "one Application Core + exactly three top-level application modules",
    "Module 1 — Commerce & Operations",
    "Module 2 — Creative & Production",
    "Module 3 — Business & Administration",
    "Packaging is the first substantially extracted domain",
    "Build 302 passive architecture catalog",
    "The current domain identifiers remain useful",
]:
    if marker not in architecture:
        fail(f"authoritative architecture document missing marker: {marker}")
print("PASS: authoritative architecture is normalized to Core + three modules")

build302_doc = read("docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md")
for marker in [
    "one shared Application Core",
    "three top-level application modules",
    "Build 301 remains the trusted Packaging compatibility baseline",
    "Packaging Build 301 is the first proven extracted domain",
    "does **not** rename those domain IDs to three new IDs in the active runtime yet",
]:
    if marker not in build302_doc:
        fail(f"Build 302 architecture note missing marker: {marker}")
print("PASS: Build 302 documents the migration state without claiming runtime conversion is complete")

build301_test = read("scripts/build301_packaging_compatibility_checkpoint_test.py")
for marker in [
    'HISTORICAL_HEAD = "a81f8d6af0004d847174fa27043c11e159ca3d10"',
    'git_show(HISTORICAL_HEAD, "public/js/admin-packaging-compatibility-v301.js")',
    'git_show(HISTORICAL_HEAD, "admin/packaging-studio/index.html")',
    'BUILD 301 PACKAGING COMPATIBILITY HISTORICAL REGRESSION: PASS',
]:
    if marker not in build301_test:
        fail(f"completed Build 301 historical pin missing marker: {marker}")
print("PASS: completed Build 301 compatibility proof is historically pinned")

protected = [
    "admin/packaging-studio/index.html",
    "public/js/admin-packaging-compatibility-v301.js",
    "public/js/admin-packaging-save-stabilizer-v300.js",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/admin-packaging-client-transport-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/modules/packaging/native-read-transport.mjs",
    "public/js/admin-packaging-studio.js",
    "public/js/core/dd-module-registry.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "public/js/core/dd-admin-module-runtime.mjs",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-studio.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"protected Build 301/current runtime file changed in Build 302: {path}")
print("PASS: Build 301 Packaging and current Core/domain runtime behavior are unchanged")

committed = run(["git", "diff", "--name-only", BASE, "HEAD"])
if committed.returncode:
    fail(committed.stderr.strip() or "could not read committed Build 302 boundary")
local = run(["git", "diff", "--name-only"])
if local.returncode:
    fail(local.stderr.strip() or "could not read local Build 302 boundary")
staged = run(["git", "diff", "--name-only", "--cached", "HEAD"])
if staged.returncode:
    fail(staged.stderr.strip() or "could not read staged Build 302 boundary")
actual = {
    line.strip().replace("\\", "/")
    for line in (committed.stdout + "\n" + local.stdout + "\n" + staged.stdout).splitlines()
    if line.strip()
}
if actual != EXPECTED:
    fail(f"Build 302 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 302 architecture-normalization changed-file boundary")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in Build 302 boundary: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 302 CORE + THREE MODULE ARCHITECTURE NORMALIZATION: PASS")
print("No Cloudflare resource was contacted.")
