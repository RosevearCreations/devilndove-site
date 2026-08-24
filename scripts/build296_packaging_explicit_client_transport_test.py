#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "afc50a80183ce30bc9c6182a4db3c4adc068f0ad"
HISTORICAL_HEAD = "ab0b7cc6e5dd3ac54bbdba0a3dc8e455ff318de3"
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
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, encoding="utf-8", errors="replace")


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def git_show(ref, path):
    result = run(["git", "show", f"{ref}:{path}"])
    if result.returncode:
        fail(f"git show failed for {ref}:{path}: {result.stderr.strip()}")
    return result.stdout


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
    source = git_show(HISTORICAL_HEAD, name)
    suffix = ".mjs" if name.endswith(".mjs") else ".js"
    temp = ROOT / f".build296_historical_check{suffix}"
    temp.write_text(source, encoding="utf-8")
    result = run(["node", "--check", str(temp.name)])
    temp.unlink(missing_ok=True)
    if result.returncode:
        fail(f"Build 296 historical JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 296 historical JavaScript syntax")

base = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/index.mjs")
for marker in [
    "const CLIENT_TRANSPORT_BUILD = 296;",
    "export async function transportBootstrapRequest(input, init)",
    "return bridgedApiFetch(input, init);",
    "transportBootstrapRequest,",
    "transportBootstrapReady: Boolean(state === 'active' && bridgedApiFetch)",
]:
    if marker not in base:
        fail(f"Build 296 bootstrap transport marker missing: {marker}")
print("PASS: Build 286 bootstrap bridge exposes the historical Build 296 transport handle")

writes = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/write-response.mjs")
for marker in [
    "const BUILD = 289;",
    "const CLIENT_TRANSPORT_BUILD = 296;",
    "const WRITE_GATEWAY_PATH = '/api/admin/packaging-write';",
    "async function transport(input, init)",
    "return bridgedApiFetch(input, init);",
]:
    if marker not in writes:
        fail(f"Build 296 write transport marker missing: {marker}")
print("PASS: Build 289 write bridge exposes the historical Build 296 transport handle")

runtime = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/runtime.mjs")
for marker in [
    "const BUILD = 290;",
    "const CLIENT_TRANSPORT_BUILD = 296;",
    "export async function transportLegacyRequest(input, init = {})",
    "if (method === 'GET') return base.transportBootstrapRequest(input, init);",
    "if (method === 'POST') return ensureWriteBridge().transport(input, init);",
]:
    if marker not in runtime:
        fail(f"Build 296 runtime transport marker missing: {marker}")
print("PASS: historical Build 290 facade preserves Build 296 GET/POST routing")

gate = git_show(HISTORICAL_HEAD, "public/js/admin-packaging-startup-gate.js")
for marker in [
    "const BUILD = 296;",
    "status.clientTransportBuild === BUILD",
    "typeof facade?.transportLegacyRequest === 'function'",
    "lastReplayTransport = 'packaging-client-transport-facade';",
]:
    if marker not in gate:
        fail(f"Build 296 adapter marker missing: {marker}")
print("PASS: historical Build 296 adapter uses explicit client transport")

admin = git_show(HISTORICAL_HEAD, "public/js/admin.js")
page = git_show(HISTORICAL_HEAD, "admin/packaging-studio/index.html")
if "dd-admin-module-runtime.mjs?v=296" not in admin:
    fail("historical Build 296 admin runtime cache key missing")
for marker in [
    '/public/js/admin-packaging-startup-gate.js?v=296',
    '/public/js/admin.js?v=296',
    '/public/js/admin-packaging-studio.js?v=277',
]:
    if marker not in page:
        fail(f"historical Build 296 Packaging page marker missing: {marker}")
print("PASS: historical Build 296 page/runtime cache boundary retained")

build295 = git_show(HISTORICAL_HEAD, "scripts/build295_packaging_startup_transport_gate_test.py")
if 'HISTORICAL_HEAD = "afc50a80183ce30bc9c6182a4db3c4adc068f0ad"' not in build295:
    fail("Build 295 historical regression head is not pinned")
print("PASS: Build 295 historical regression boundary remains pinned")

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
    result = run(["git", "diff", "--quiet", BASE, HISTORICAL_HEAD, "--", path])
    if result.returncode != 0:
        fail(f"Build 296 changed protected editor/server authority: {path}")
print("PASS: historical Build 296 protected authority boundary retained")

result = run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"Build 296 historical boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact historical Build 296 changed-file boundary")

print("BUILD 296 PACKAGING EXPLICIT CLIENT TRANSPORT: PASS (HISTORICAL)")
print("No Cloudflare resource was contacted.")
