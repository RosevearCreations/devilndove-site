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
    "docs/architecture/BUILD299_PACKAGING_BROWSER_COMPATIBILITY_RETIREMENT.md",
    "public/js/admin-packaging-native-client-v299.js",
    "public/js/modules/packaging/native-client-v299.mjs",
    "scripts/apply_build299_packaging_browser_compatibility_retirement.py",
    "scripts/build298_packaging_native_client_cutover_test.py",
    "scripts/build299_packaging_browser_compatibility_retirement_test.py",
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
        fail(f"git changed-file check failed for {args}: {result.stderr.strip()}")
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


for name in [
    "public/js/admin-packaging-native-client-v299.js",
    "public/js/modules/packaging/native-client-v299.mjs",
    "public/js/admin-packaging-studio.js",
    "public/js/modules/packaging/runtime.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/admin/packaging-studio.js",
]:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 299 JavaScript syntax")

launcher = read("public/js/admin-packaging-native-client-v299.js")
for marker in [
    "const BUILD = 299;",
    "DDPackagingClient = Object.freeze",
    "import('/public/js/modules/packaging/native-client-v299.mjs?v=299')",
    "runtimeDependencyEvent: 'dd:packaging-runtime-active'",
    "build297ReadinessDependency: false",
    "legacyCompatibilityScriptsRequired: false",
]:
    if marker not in launcher:
        fail(f"Build 299 launcher marker missing: {marker}")
for forbidden in [
    "/api/admin/packaging-studio",
    "dd:packaging-client-transport-active",
    "admin-packaging-startup-gate-v297",
    "admin-packaging-client-transport-v297",
]:
    if forbidden in launcher:
        fail(f"Build 299 launcher still depends on retired browser compatibility: {forbidden}")
print("PASS: Build 299 launcher has no Build 297 readiness dependency")

client = read("public/js/modules/packaging/native-client-v299.mjs")
for marker in [
    "const BUILD = 299;",
    "const RUNTIME_READY_EVENT = 'dd:packaging-runtime-active';",
    "const NATIVE_BOOTSTRAP_PATH = '/api/admin/packaging-bootstrap';",
    "const NATIVE_WRITE_PATH = '/api/admin/packaging-write';",
    "status?.state === 'active'",
    "Number(status?.build || 0) >= 290",
    "typeof facade.readCatalog === 'function'",
    "typeof facade.readInventory === 'function'",
    "typeof facade.readContentMedia === 'function'",
    "facade.readCatalog({ limit: 500 })",
    "facade.readInventory({ limit: 1000 })",
    "facade.readContentMedia({ mediaType: 'artwork', limit: 72 })",
    "build297ReadinessDependency: false",
    "legacyCompatibilityScriptsRequired: false",
    "lastWriteBoundary = payload?.write_boundary",
]:
    if marker not in client:
        fail(f"Build 299 native client marker missing: {marker}")
for forbidden in [
    "/api/admin/packaging-studio",
    "dd:packaging-client-transport-active",
    "clientTransportBuild",
    "clientTransportReady",
    "fetchLegacyBootstrap",
    "legacy-endpoint-fallback",
]:
    if forbidden in client:
        fail(f"Build 299 native client still depends on compatibility readiness/fallback: {forbidden}")
print("PASS: Build 299 native client waits directly on Build 290 runtime + owner contracts")

editor = read("public/js/admin-packaging-studio.js")
if "const response = await client.request(body, projectId);" not in editor:
    fail("mature editor no longer uses DDPackagingClient")
if "/api/admin/packaging-studio" in editor:
    fail("mature editor regained the retired endpoint name")
print("PASS: mature Build 298 editor remains unchanged and transport-neutral")

page = read("admin/packaging-studio/index.html")
required = [
    '/public/js/admin.js?v=296',
    '/public/js/admin-packaging-native-client-v299.js?v=299',
    '/public/js/admin-packaging-studio.js?v=298',
]
for ref in required:
    if ref not in page:
        fail(f"Build 299 Packaging page marker missing: {ref}")
if not (page.index(required[0]) < page.index(required[1]) < page.index(required[2])):
    fail("Build 299 page order must be runtime -> Build299 native client -> mature editor")
for forbidden in [
    '/public/js/admin-packaging-startup-gate-v297.js?v=297',
    '/public/js/admin-packaging-client-transport-v297.js?v=297',
    '/public/js/admin-packaging-native-client-v298.js?v=298',
]:
    if forbidden in page:
        fail(f"Build 299 page still loads retired/superseded browser layer: {forbidden}")
print("PASS: Build 297 outer browser compatibility scripts are unloaded")

build298 = read("scripts/build298_packaging_native_client_cutover_test.py")
if 'HISTORICAL_HEAD = "3a19ebc263a206acd22e6490327ffa32567e4a8a"' not in build298:
    fail("Build 298 completed parity head is not pinned historically")
if 'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])' not in build298:
    fail("Build 298 historical changed-file boundary still follows future HEAD")
print("PASS: Build 298 completed parity boundary is pinned historically")

protected = [
    "public/js/admin-packaging-studio.js",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/admin-packaging-client-transport-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/modules/packaging/native-read-transport.mjs",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "functions/api/admin/packaging-studio.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-write.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"Build 299 unexpectedly changed protected historical/runtime/server authority: {path}")
print("PASS: Build 297 history, Build 298 editor/client, Build 290 runtime, and server authorities are unchanged")

committed = changed_files(BASE, "HEAD")
working_tree = changed_files("HEAD")
staged = changed_files("--cached", "HEAD")
actual = committed | working_tree | staged
if actual != EXPECTED:
    fail(
        "Build 299 changed-file boundary mismatch. "
        f"expected={sorted(EXPECTED)} actual={sorted(actual)} "
        f"committed={sorted(committed)} working_tree={sorted(working_tree)} staged={sorted(staged)}"
    )
print("PASS: exact Build 299 boundary across staged support + local page activation")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 299 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 299 changed Cloudflare binding/config")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 299 PACKAGING BROWSER COMPATIBILITY RETIREMENT: PASS")
print("No Cloudflare resource was contacted.")
