#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "525b5187cddcede69f8b10334951a56366885ebf"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD298_CHANGED_FILES.md",
    "BUILD298_VALIDATION.md",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD298_PACKAGING_NATIVE_CLIENT_CUTOVER.md",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/admin-packaging-studio.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "scripts/apply_build298_packaging_native_client_cutover.py",
    "scripts/build297_packaging_legacy_get_fallback_removal_test.py",
    "scripts/build298_packaging_native_client_cutover_test.py",
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
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/admin-packaging-studio.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/admin/packaging-studio.js",
]:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 298 JavaScript syntax")

launcher = read("public/js/admin-packaging-native-client-v298.js")
for marker in [
    "const BUILD = 298;",
    "DDPackagingClient = Object.freeze",
    "import('/public/js/modules/packaging/native-client-v298.mjs?v=298')",
    "async function request(body = null, projectId = 0)",
    "nativeBootstrapPath: '/api/admin/packaging-bootstrap'",
    "nativeWritePath: '/api/admin/packaging-write'",
    "legacyRouteNamedByClient: false",
]:
    if marker not in launcher:
        fail(f"Build 298 launcher marker missing: {marker}")
if "/api/admin/packaging-studio" in launcher:
    fail("Build 298 launcher names the retired Packaging Studio route")
print("PASS: Build 298 browser launcher exposes native Packaging semantics only")

client = read("public/js/modules/packaging/native-client-v298.mjs")
for marker in [
    "const BUILD = 298;",
    "const NATIVE_BOOTSTRAP_PATH = '/api/admin/packaging-bootstrap';",
    "const NATIVE_WRITE_PATH = '/api/admin/packaging-write';",
    "facade.readCatalog({ limit: 500 })",
    "facade.readInventory({ limit: 1000 })",
    "facade.readContentMedia({ mediaType: 'artwork', limit: 72 })",
    "response = await auth.apiFetch(url);",
    "response = await auth.apiFetch(url, {",
    "lastWriteBoundary = payload?.write_boundary",
    "legacyRouteNamedByClient: false",
    "source: 'session-cache'",
    "source: 'contract-unavailable'",
]:
    if marker not in client:
        fail(f"Build 298 native client marker missing: {marker}")
if "/api/admin/packaging-studio" in client:
    fail("Build 298 native client names the retired Packaging Studio route")
if "fetchLegacyBootstrap" in client or "legacy-endpoint-fallback" in client:
    fail("Build 298 native read path contains legacy fallback behavior")
print("PASS: Build 298 native client reads bootstrap + owner contracts and writes native gateway directly")

editor = read("public/js/admin-packaging-studio.js")
for marker in [
    "// Build 298 - Mature Packaging editor requests now use the native DDPackagingClient facade.",
    "const client = globalThis.DDPackagingClient;",
    "typeof client.request !== 'function'",
    "const response = await client.request(body, projectId);",
]:
    if marker not in editor:
        fail(f"Build 298 mature editor marker missing: {marker}")
if "/api/admin/packaging-studio" in editor:
    fail("mature Packaging editor still names the retired endpoint")
api_start = editor.index("  async function api(body = null, projectId = 0) {")
api_end = editor.index("\n  function options(", api_start)
api_body = editor[api_start:api_end]
if "DDAuth.apiFetch" in api_body:
    fail("mature Packaging editor API helper still owns transport details")
print("PASS: mature editor has no retired endpoint name and consumes DDPackagingClient")

page = read("admin/packaging-studio/index.html")
refs = [
    '/public/js/admin-packaging-startup-gate-v297.js?v=297',
    '/public/js/admin.js?v=296',
    '/public/js/admin-packaging-client-transport-v297.js?v=297',
    '/public/js/admin-packaging-native-client-v298.js?v=298',
    '/public/js/admin-packaging-studio.js?v=298',
]
for ref in refs:
    if ref not in page:
        fail(f"Build 298 Packaging page marker missing: {ref}")
if not all(page.index(refs[index]) < page.index(refs[index + 1]) for index in range(len(refs) - 1)):
    fail("Build 298 page order must remain gate -> runtime -> Build297 defense -> Build298 native client -> mature editor")
if '/public/js/admin-packaging-studio.js?v=277' in page:
    fail("Packaging page still uses the pre-cutover mature editor cache key")
print("PASS: Build 298 native client is loaded before the mature editor")

build297 = read("scripts/build297_packaging_legacy_get_fallback_removal_test.py")
if 'HISTORICAL_HEAD = "525b5187cddcede69f8b10334951a56366885ebf"' not in build297:
    fail("Build 297 historical regression head is not pinned at the completed parity head")
if 'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])' not in build297:
    fail("Build 297 changed-file boundary still follows future HEAD")
print("PASS: Build 297 completed parity boundary is pinned historically")

protected = [
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/modules/packaging/native-read-transport.mjs",
    "functions/api/admin/packaging-studio.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-write.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"Build 298 unexpectedly changed proven runtime/server authority: {path}")
print("PASS: Build 297 defense runtime and 293/286 read + 292/291 write authorities are unchanged")

# Build 298 is intentionally validated before its two activation files are committed.
# Combine committed BASE->HEAD changes with unstaged/staged working-tree changes so the
# exact boundary check works both immediately before the activation commit and after it.
committed = changed_files(BASE, "HEAD")
working_tree = changed_files("HEAD")
staged = changed_files("--cached", "HEAD")
actual = committed | working_tree | staged
if actual != EXPECTED:
    fail(
        "Build 298 changed-file boundary mismatch. "
        f"expected={sorted(EXPECTED)} actual={sorted(actual)} "
        f"committed={sorted(committed)} working_tree={sorted(working_tree)} staged={sorted(staged)}"
    )
print("PASS: exact Build 298 changed-file boundary across committed + local activation changes")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 298 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 298 changed Cloudflare binding/config")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 298 PACKAGING NATIVE CLIENT CUTOVER: PASS")
print("No Cloudflare resource was contacted.")
