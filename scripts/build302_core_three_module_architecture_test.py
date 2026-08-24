#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "a81f8d6af0004d847174fa27043c11e159ca3d10"
HISTORICAL_HEAD = "000b9617bc5141ba876ec667d4fbc653ea9ee556"
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


def git_show(ref, path):
    result = run(["git", "show", f"{ref}:{path}"])
    if result.returncode:
        fail(f"could not read {path} at {ref}: {result.stderr.strip()}")
    return result.stdout


def changed_files(base, head):
    result = run(["git", "diff", "--name-only", base, head])
    if result.returncode:
        fail(result.stderr.strip() or f"could not compare {base}..{head}")
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


catalog_path = "public/js/core/dd-application-module-groups.mjs"
catalog = git_show(HISTORICAL_HEAD, catalog_path)
syntax = run(["node", "--check", catalog_path])
if syntax.returncode:
    fail(syntax.stderr.strip() or "current Build 302 architecture catalog JavaScript syntax failed")
print("PASS: completed Build 302 architecture catalog JavaScript syntax is historically pinned")

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
        fail(f"historical Build 302 catalog marker missing: {marker}")

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
        fail(f"historical Build 302 passive catalog contains side-effect marker: {forbidden}")
print("PASS: completed Build 302 passive Core + three-module catalog is historically pinned")

architecture = git_show(HISTORICAL_HEAD, "docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md")
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
        fail(f"historical architecture document missing marker: {marker}")
print("PASS: completed Build 302 authoritative architecture is historically pinned")

build302_doc = git_show(HISTORICAL_HEAD, "docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md")
for marker in [
    "Status — COMPLETE IN DEVELOPMENT",
    "one shared Application Core",
    "three top-level application modules",
    "Build 301 remains the trusted Packaging compatibility baseline",
    "Packaging Build 301 is the first proven extracted domain",
    "does **not** rename those domain IDs to three new IDs in the active runtime yet",
]:
    if marker not in build302_doc:
        fail(f"historical Build 302 architecture note missing marker: {marker}")
print("PASS: completed Build 302 migration state is historically pinned")

validation = git_show(HISTORICAL_HEAD, "BUILD302_VALIDATION.md")
for marker in [
    "Status — COMPLETE IN DEVELOPMENT",
    "cb68b71440f344c258809e79efe23bea65d0167f",
    "BUILD 302 CORE + THREE MODULE ARCHITECTURE NORMALIZATION: PASS",
    "git status --short` returned no entries",
]:
    if marker not in validation:
        fail(f"completed Build 302 validation marker missing: {marker}")
print("PASS: completed Build 302 local proof is historically pinned")

build301_test = git_show(HISTORICAL_HEAD, "scripts/build301_packaging_compatibility_checkpoint_test.py")
for marker in [
    'HISTORICAL_HEAD = "a81f8d6af0004d847174fa27043c11e159ca3d10"',
    'BUILD 301 PACKAGING COMPATIBILITY HISTORICAL REGRESSION: PASS',
]:
    if marker not in build301_test:
        fail(f"completed Build 301 historical pin missing at Build 302 head: {marker}")
print("PASS: Build 302 preserves the completed Build 301 historical pin")

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
    result = run(["git", "diff", "--quiet", BASE, HISTORICAL_HEAD, "--", path])
    if result.returncode != 0:
        fail(f"protected Build 301/runtime file changed in completed Build 302: {path}")
print("PASS: completed Build 302 preserved Build 301 Packaging and Core/domain runtime behavior")

actual = changed_files(BASE, HISTORICAL_HEAD)
if actual != EXPECTED:
    fail(f"completed Build 302 boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact completed Build 302 architecture-normalization boundary is historically pinned")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in completed Build 302 boundary: {path}")
print("PASS: completed Build 302 had no SQL/schema, Cloudflare binding/config, R2, or Production change")

print(f"BUILD 302 CORE + THREE MODULE ARCHITECTURE HISTORICAL REGRESSION: PASS ({HISTORICAL_HEAD[:8]})")
print("No Cloudflare resource was contacted.")
