#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "525b5187cddcede69f8b10334951a56366885ebf"
HISTORICAL_HEAD = "3a19ebc263a206acd22e6490327ffa32567e4a8a"
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


def git_show(ref, path):
    result = run(["git", "show", f"{ref}:{path}"])
    if result.returncode:
        fail(f"git show failed for {ref}:{path}: {result.stderr.strip()}")
    return result.stdout


launcher = git_show(HISTORICAL_HEAD, "public/js/admin-packaging-native-client-v298.js")
for marker in [
    "const BUILD = 298;",
    "DDPackagingClient = Object.freeze",
    "import('/public/js/modules/packaging/native-client-v298.mjs?v=298')",
    "nativeBootstrapPath: '/api/admin/packaging-bootstrap'",
    "nativeWritePath: '/api/admin/packaging-write'",
    "legacyRouteNamedByClient: false",
]:
    if marker not in launcher:
        fail(f"historical Build 298 launcher marker missing: {marker}")
if "/api/admin/packaging-studio" in launcher:
    fail("historical Build 298 launcher names the retired route")
print("PASS: historical Build 298 launcher exposes native Packaging semantics")

client = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/native-client-v298.mjs")
for marker in [
    "const BUILD = 298;",
    "const NATIVE_BOOTSTRAP_PATH = '/api/admin/packaging-bootstrap';",
    "const NATIVE_WRITE_PATH = '/api/admin/packaging-write';",
    "facade.readCatalog({ limit: 500 })",
    "facade.readInventory({ limit: 1000 })",
    "facade.readContentMedia({ mediaType: 'artwork', limit: 72 })",
    "lastWriteBoundary = payload?.write_boundary",
    "legacyRouteNamedByClient: false",
]:
    if marker not in client:
        fail(f"historical Build 298 client marker missing: {marker}")
if "/api/admin/packaging-studio" in client:
    fail("historical Build 298 native client names the retired route")
print("PASS: historical Build 298 native read/write client is preserved")

editor = git_show(HISTORICAL_HEAD, "public/js/admin-packaging-studio.js")
for marker in [
    "// Build 298 - Mature Packaging editor requests now use the native DDPackagingClient facade.",
    "const client = globalThis.DDPackagingClient;",
    "const response = await client.request(body, projectId);",
]:
    if marker not in editor:
        fail(f"historical Build 298 mature editor marker missing: {marker}")
if "/api/admin/packaging-studio" in editor:
    fail("historical Build 298 mature editor names the retired route")
print("PASS: historical Build 298 mature editor native-client cutover is preserved")

page = git_show(HISTORICAL_HEAD, "admin/packaging-studio/index.html")
refs = [
    '/public/js/admin-packaging-startup-gate-v297.js?v=297',
    '/public/js/admin.js?v=296',
    '/public/js/admin-packaging-client-transport-v297.js?v=297',
    '/public/js/admin-packaging-native-client-v298.js?v=298',
    '/public/js/admin-packaging-studio.js?v=298',
]
for ref in refs:
    if ref not in page:
        fail(f"historical Build 298 page marker missing: {ref}")
if not all(page.index(refs[index]) < page.index(refs[index + 1]) for index in range(len(refs) - 1)):
    fail("historical Build 298 page order changed")
print("PASS: historical Build 298 page activation boundary is pinned")

build297 = git_show(HISTORICAL_HEAD, "scripts/build297_packaging_legacy_get_fallback_removal_test.py")
if 'HISTORICAL_HEAD = "525b5187cddcede69f8b10334951a56366885ebf"' not in build297:
    fail("Build 297 historical regression head was not pinned inside Build 298")
print("PASS: Build 297 historical proof remains nested under Build 298")

result = run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"historical Build 298 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact historical Build 298 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("historical Build 298 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("historical Build 298 changed Cloudflare binding/config")
print("PASS: historical Build 298 has no SQL/schema, binding/config, R2, or Production change")

print("BUILD 298 PACKAGING NATIVE CLIENT CUTOVER: PASS")
print(f"Historical head pinned at {HISTORICAL_HEAD}.")
print("No Cloudflare resource was contacted.")
