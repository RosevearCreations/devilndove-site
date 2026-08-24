#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "3a19ebc263a206acd22e6490327ffa32567e4a8a"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD299_CHANGED_FILES.md",
    "BUILD299_VALIDATION.md",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD299_PACKAGING_PRINT_SOURCE_CONSISTENCY.md",
    "functions/api/admin/packaging-version-artifact.js",
    "public/js/admin-packaging-print-source-v299.js",
    "scripts/build298_packaging_native_client_cutover_test.py",
    "scripts/build299_packaging_print_source_consistency_test.py",
}

DEFERRED_RETIREMENT_STAGING = {
    "docs/architecture/BUILD299_PACKAGING_BROWSER_COMPATIBILITY_RETIREMENT.md",
    "public/js/admin-packaging-native-client-v299.js",
    "public/js/modules/packaging/native-client-v299.mjs",
    "scripts/apply_build299_packaging_browser_compatibility_retirement.py",
    "scripts/build299_packaging_browser_compatibility_retirement_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, encoding="utf-8", errors="replace")


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


for path in [
    "functions/api/admin/packaging-version-artifact.js",
    "public/js/admin-packaging-print-source-v299.js",
    "public/js/admin-packaging-studio.js",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/admin/packaging-studio.js",
]:
    result = run(["node", "--check", path])
    if result.returncode:
        fail(f"JavaScript syntax failed for {path}: {result.stderr.strip()}")
print("PASS: Build 299 JavaScript syntax")

endpoint = read("functions/api/admin/packaging-version-artifact.js")
for marker in [
    "const BUILD = 299;",
    "getAdminUserFromRequest(context.request, context.env)",
    "FROM packaging_project_versions",
    "packaging_project_version_id = ?",
    "packaging_project_id = ?",
    "svg_markup",
    "read_authority: 'packaging-version-artifact'",
    "immutable_saved_version: true",
]:
    if marker not in endpoint:
        fail(f"Build 299 version-artifact endpoint marker missing: {marker}")
if "/api/admin/packaging-studio" in endpoint:
    fail("Build 299 version-artifact endpoint names the retired Packaging route")
if any(token in endpoint for token in ["INSERT INTO packaging_project_versions", "UPDATE packaging_project_versions", "DELETE FROM packaging_project_versions"]):
    fail("Build 299 version-artifact endpoint mutates saved Packaging versions")
print("PASS: exact saved-version SVG read is authenticated, project-scoped, and read-only")

controller = read("public/js/admin-packaging-print-source-v299.js")
for marker in [
    "const BUILD = 299;",
    "const VERSION_ARTIFACT_PATH = '/api/admin/packaging-version-artifact';",
    "select.value = '';",
    "Print source / evidence version",
    "savedVersionsImmutable: true",
    "historicalVersionMustBeExplicitlySelected: true",
    "event.stopImmediatePropagation();",
    "if (!versionId) {",
    "return;",
    "void printSavedVersion(versionId);",
    "payload?.artifact?.svg_markup",
    "lastPrintSource = 'saved-review-version';",
]:
    if marker not in controller:
        fail(f"Build 299 print-source controller marker missing: {marker}")
if "/api/admin/packaging-studio" in controller:
    fail("Build 299 print-source controller names the retired Packaging route")
if "save_version" in controller or "save_project" in controller:
    fail("Build 299 print-source controller attempts to mutate project/version state")
print("PASS: Project draft remains default; saved versions require explicit selection and exact artifact read")

page = read("admin/packaging-studio/index.html")
refs = [
    '/public/js/admin-packaging-startup-gate-v297.js?v=297',
    '/public/js/admin.js?v=296',
    '/public/js/admin-packaging-client-transport-v297.js?v=297',
    '/public/js/admin-packaging-native-client-v298.js?v=298',
    '/public/js/admin-packaging-studio.js?v=298',
    '/public/js/admin-packaging-print-source-v299.js?v=299',
]
for ref in refs:
    if ref not in page:
        fail(f"Build 299 Packaging page marker missing: {ref}")
if not all(page.index(refs[index]) < page.index(refs[index + 1]) for index in range(len(refs) - 1)):
    fail("Build 299 page order must preserve Build 297/298 and load print-source controller last")
print("PASS: Build 299 controller activates after the proven mature editor without retiring compatibility defenses")

for path in DEFERRED_RETIREMENT_STAGING:
    if (ROOT / path).exists():
        fail(f"deferred browser-compatibility-retirement staging remains active in Build 299 tree: {path}")
print("PASS: earlier browser-compatibility-retirement staging is removed from the current Build 299 tree")

build298 = read("scripts/build298_packaging_native_client_cutover_test.py")
if 'HISTORICAL_HEAD = "3a19ebc263a206acd22e6490327ffa32567e4a8a"' not in build298:
    fail("Build 298 completed parity boundary is not pinned historically")
if 'git_show(HISTORICAL_HEAD' not in build298:
    fail("Build 298 regression no longer reads its historical completed source")
print("PASS: completed Build 298 regression is historically pinned")

protected = [
    "public/js/admin-packaging-studio.js",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/admin-packaging-client-transport-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/modules/packaging/native-read-transport.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/admin/packaging-studio.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"Build 299 unexpectedly changed protected Packaging authority/runtime: {path}")
print("PASS: mature editor and proven Packaging read/write/compatibility/tombstone authorities are unchanged")

result = run(["git", "diff", "--name-only", BASE, "HEAD"])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"Build 299 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 299 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 299 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 299 changed Cloudflare binding/config")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 299 PACKAGING PRINT SOURCE CONSISTENCY: PASS")
print("No Cloudflare resource was contacted.")
