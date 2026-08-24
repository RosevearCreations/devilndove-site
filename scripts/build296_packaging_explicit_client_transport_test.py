#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "afc50a80183ce30bc9c6182a4db3c4adc068f0ad"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD296_CHANGED_FILES.md",
    "BUILD296_VALIDATION.md",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD296_PACKAGING_EXPLICIT_CLIENT_TRANSPORT.md",
    "public/js/admin-packaging-startup-gate.js",
    "public/js/admin.js",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "scripts/build295_packaging_startup_transport_gate_test.py",
    "scripts/build296_packaging_explicit_client_transport_test.py",
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


for name in [
    "public/js/admin-packaging-startup-gate.js",
    "public/js/admin-packaging-studio.js",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
]:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 296 JavaScript syntax")

base = read("public/js/modules/packaging/index.mjs")
for marker in [
    "const CLIENT_TRANSPORT_BUILD = 296;",
    "export async function transportBootstrapRequest(input, init)",
    "return bridgedApiFetch(input, init);",
    "transportBootstrapRequest,",
    "transportBootstrapReady: Boolean(state === 'active' && bridgedApiFetch)",
]:
    if marker not in base:
        fail(f"Build 296 bootstrap transport marker missing: {marker}")
if "build: 286" not in base:
    fail("Build 286 read implementation provenance changed")
print("PASS: Build 286 bootstrap bridge exposes an explicit Build 296 transport handle")

writes = read("public/js/modules/packaging/write-response.mjs")
for marker in [
    "const BUILD = 289;",
    "const CLIENT_TRANSPORT_BUILD = 296;",
    "const WRITE_GATEWAY_PATH = '/api/admin/packaging-write';",
    "async function transport(input, init)",
    "return bridgedApiFetch(input, init);",
    "return Object.freeze({ arm, disarm, transport, getStatus });",
]:
    if marker not in writes:
        fail(f"Build 296 write transport marker missing: {marker}")
print("PASS: Build 289 write bridge exposes an explicit Build 296 transport handle")

runtime = read("public/js/modules/packaging/runtime.mjs")
for marker in [
    "const BUILD = 290;",
    "const CLIENT_TRANSPORT_BUILD = 296;",
    "transportLegacyRequest,",
    "export async function transportLegacyRequest(input, init = {})",
    "if (method === 'GET') return base.transportBootstrapRequest(input, init);",
    "if (method === 'POST') return ensureWriteBridge().transport(input, init);",
    "clientTransportReady: Boolean(",
]:
    if marker not in runtime:
        fail(f"Build 296 runtime transport marker missing: {marker}")
print("PASS: Build 290 facade routes compatibility GET/POST through explicit proven bridge handles")

gate = read("public/js/admin-packaging-startup-gate.js")
for marker in [
    "const BUILD = 296;",
    "status.clientTransportBuild === BUILD",
    "status.clientTransportReady === true",
    "typeof facade?.transportLegacyRequest === 'function'",
    "lastReplayTransport = 'packaging-client-transport-facade';",
    "return transport(input, init);",
    "error_code: 'packaging_client_transport_not_ready'",
    "legacyServerRouteContactedByGate: false",
]:
    if marker not in gate:
        fail(f"Build 296 adapter marker missing: {marker}")
for forbidden in [
    "currentFetch !== gatedApiFetch",
    "capturedRuntimeReadyAtInstall",
    "runtime-captured-before-gate",
    "runtime-installed-after-gate",
]:
    if forbidden in gate:
        fail(f"Build 296 still infers mutable DDAuth wrapper ownership: {forbidden}")
print("PASS: browser adapter uses explicit Packaging client transport instead of DDAuth wrapper inference")

admin = read("public/js/admin.js")
if "dd-admin-module-runtime.mjs?v=296" not in admin:
    fail("admin runtime cache key was not advanced to Build 296")
page = read("admin/packaging-studio/index.html")
for marker in [
    '/public/js/admin-packaging-startup-gate.js?v=296',
    '/public/js/admin.js?v=296',
    '/public/js/admin-packaging-studio.js?v=277',
]:
    if marker not in page:
        fail(f"Build 296 Packaging page asset marker missing: {marker}")
if not (
    page.index('/public/js/admin-packaging-startup-gate.js?v=296')
    < page.index('/public/js/admin.js?v=296')
    < page.index('/public/js/admin-packaging-studio.js?v=277')
):
    fail("Build 296 script order must remain adapter -> admin runtime -> mature editor")
print("PASS: Build 296 runtime/adapter cache keys and script ordering are deterministic")

build295 = read("scripts/build295_packaging_startup_transport_gate_test.py")
if 'HISTORICAL_HEAD = "afc50a80183ce30bc9c6182a4db3c4adc068f0ad"' not in build295:
    fail("Build 295 historical regression head is not pinned")
if 'git_show(HISTORICAL_HEAD, "public/js/admin-packaging-startup-gate.js")' not in build295:
    fail("Build 295 regression still reads future adapter source")
if 'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])' not in build295:
    fail("Build 295 changed-file boundary still follows future HEAD")
print("PASS: Build 295 historical regression boundary is pinned")

protected = [
    "public/js/admin-packaging-studio.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/artwork-picker.mjs",
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
        fail(f"Build 296 changed protected editor/server authority: {path}")
print("PASS: mature editor, retirement guard, and server read/write authorities are unchanged")

result = run(["git", "diff", "--name-only", BASE, "HEAD"])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"Build 296 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 296 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 296 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 296 changed Cloudflare binding/config")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 296 PACKAGING EXPLICIT CLIENT TRANSPORT: PASS")
print("No Cloudflare resource was contacted.")
