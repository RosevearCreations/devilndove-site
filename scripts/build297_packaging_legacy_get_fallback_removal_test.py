#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "ab0b7cc6e5dd3ac54bbdba0a3dc8e455ff318de3"
HISTORICAL_HEAD = "525b5187cddcede69f8b10334951a56366885ebf"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD297_CHANGED_FILES.md",
    "BUILD297_VALIDATION.md",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD297_PACKAGING_LEGACY_GET_FALLBACK_REMOVAL.md",
    "public/js/admin-packaging-client-transport-v297.js",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/modules/packaging/native-read-transport.mjs",
    "scripts/build296_packaging_explicit_client_transport_test.py",
    "scripts/build297_packaging_legacy_get_fallback_removal_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, encoding="utf-8", errors="replace")


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def git_show(ref, path):
    result = run(["git", "show", f"{ref}:{path}"])
    if result.returncode:
        fail(f"git show failed for {ref}:{path}: {result.stderr.strip()}")
    return result.stdout


for name in [
    "public/js/admin-packaging-client-transport-v297.js",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/modules/packaging/native-read-transport.mjs",
    "public/js/admin-packaging-studio.js",
    "public/js/modules/packaging/runtime.mjs",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/admin/packaging-studio.js",
]:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: current JavaScript syntax remains compatible with Build 297")

native = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/native-read-transport.mjs")
for marker in [
    "const BUILD = 297;",
    "const NATIVE_BOOTSTRAP_PATH = '/api/admin/packaging-bootstrap';",
    "response = await auth.apiFetch(nativeBootstrapUrl(input), init);",
    "legacy_get_fallback_removed: true",
    "legacyServerRouteReachable: false",
    "source: 'session-cache'",
    "source: 'contract-unavailable'",
]:
    if marker not in native:
        fail(f"Build 297 native read marker missing: {marker}")
for forbidden in [
    "fetchLegacyBootstrap",
    "legacy-endpoint-fallback",
    "packaging-bootstrap-with-legacy-data-fallback",
    "using rollback GET",
]:
    if forbidden in native:
        fail(f"Build 297 native read transport still contains retired fallback behavior: {forbidden}")
print("PASS: historical Build 297 native Packaging read transport has zero retired GET fallback")

overlay = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/client-transport-v297.mjs")
for marker in [
    "const BUILD = 297;",
    "if (method === 'GET')",
    "return reads.transport(input, init);",
    "return prior.transportLegacyRequest(input, init);",
    "auth.apiFetch = bridgedApiFetch;",
    "legacyGetFallbackRemovalBuild: BUILD",
    "postActivationTransportArmed:",
    "dd:packaging-client-transport-active",
]:
    if marker not in overlay:
        fail(f"Build 297 post-activation transport marker missing: {marker}")
if "Number(facade.clientTransportBuild || 0) === 296" not in overlay:
    fail("Build 297 does not retain the proven Build 296 facade safely")
print("PASS: historical Build 297 post-activation transport owns Refresh GET while preserving Build 296 write transport")

gate = git_show(HISTORICAL_HEAD, "public/js/admin-packaging-startup-gate-v297.js")
for marker in [
    "const BUILD = 297;",
    "const CLIENT_ACTIVE_EVENT = 'dd:packaging-client-transport-active';",
    "Number(status.legacyGetFallbackRemovalBuild || 0) === BUILD",
    "status.postActivationTransportArmed === true",
    "status.legacyGetFallbackRemoved === true",
    "status.legacyServerGetReachable === false",
    "lastReplayTransport = 'packaging-client-transport-v297';",
    "legacyServerRouteContactedByGate: false",
]:
    if marker not in gate:
        fail(f"Build 297 startup gate marker missing: {marker}")
print("PASS: historical Build 297 startup waits for the no-legacy transport")

page = git_show(HISTORICAL_HEAD, "admin/packaging-studio/index.html")
refs = [
    '/public/js/admin-packaging-startup-gate-v297.js?v=297',
    '/public/js/admin.js?v=296',
    '/public/js/admin-packaging-client-transport-v297.js?v=297',
    '/public/js/admin-packaging-studio.js?v=277',
]
for ref in refs:
    if ref not in page:
        fail(f"Build 297 Packaging page marker missing: {ref}")
if not (page.index(refs[0]) < page.index(refs[1]) < page.index(refs[2]) < page.index(refs[3])):
    fail("Build 297 page order must be gate -> Build296 runtime -> Build297 overlay -> mature editor")
if '/public/js/admin-packaging-startup-gate.js?v=296' in page:
    fail("Build 297 Packaging page still activates the superseded Build 296 startup adapter")
print("PASS: historical Build 297 page activation order is deterministic")

build296 = git_show(HISTORICAL_HEAD, "scripts/build296_packaging_explicit_client_transport_test.py")
if 'HISTORICAL_HEAD = "ab0b7cc6e5dd3ac54bbdba0a3dc8e455ff318de3"' not in build296:
    fail("Build 296 historical regression head is not pinned")
if 'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])' not in build296:
    fail("Build 296 changed-file boundary still follows future HEAD")
print("PASS: Build 296 historical regression boundary is pinned")

protected = [
    "public/js/admin-packaging-studio.js",
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
    result = run(["git", "diff", "--quiet", BASE, HISTORICAL_HEAD, "--", path])
    if result.returncode != 0:
        fail(f"Build 297 unexpectedly changed protected authority/runtime: {path}")
print("PASS: historical Build 297 mature editor, Build 296 runtime, and server read/write authorities are unchanged")

result = run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"Build 297 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact historical Build 297 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 297 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 297 changed Cloudflare binding/config")
print("PASS: historical Build 297 has no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 297 PACKAGING LEGACY GET FALLBACK REMOVAL: PASS")
print("Historical head pinned at 525b5187cddcede69f8b10334951a56366885ebf.")
print("No Cloudflare resource was contacted.")
