#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "7c2e49ee3764edb80adb3e26786cc97693a6e60b"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD295_CHANGED_FILES.md",
    "BUILD295_VALIDATION.md",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD295_PACKAGING_STARTUP_TRANSPORT_GATE.md",
    "public/js/admin-packaging-startup-gate.js",
    "scripts/build294_packaging_legacy_get_server_retirement_test.py",
    "scripts/build295_packaging_startup_transport_gate_test.py",
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
print("PASS: Build 295 JavaScript syntax")

gate = read("public/js/admin-packaging-startup-gate.js")
for marker in [
    "const BUILD = 295;",
    "const LEGACY_PACKAGING_PATH = '/api/admin/packaging-studio';",
    "const RUNTIME_ACTIVE_EVENT = 'dd:packaging-runtime-active';",
    "const AUTH_DEGRADED_EVENT = 'dd:auth-degraded';",
    "const WAIT_TIMEOUT_MS = 30000;",
    "function isLegacyPackagingRequest(input, init = {})",
    "function waitForPackagingRuntime()",
    "status.legacyGetGuardArmed === true",
    "status.writeResponseBridgeArmed === true",
    "const capturedRuntimeReadyAtInstall = runtimeReady();",
    "degradedAuthEvents += 1;",
    "if (runtimeReady()) finish(true, 'runtime-active');",
    "if (currentFetch !== gatedApiFetch && typeof currentFetch === 'function')",
    "lastReplayTransport = 'runtime-installed-after-gate';",
    "if (capturedRuntimeReadyAtInstall)",
    "lastReplayTransport = 'runtime-captured-before-gate';",
    "error_code: 'packaging_runtime_not_ready'",
    "wait_exit_reason: lastWaitExitReason",
    "replay_transport: lastReplayTransport",
    "legacy_server_route_contacted: false",
    "status: 503",
    "globalThis.DDPackagingStartupGate = Object.freeze",
    "capturedRuntimeReadyAtInstall,",
    "degradedAuthEvents,",
    "lastWaitExitReason,",
    "lastReplayTransport,",
    "legacyServerRouteContactedByGate: false",
]:
    if marker not in gate:
        fail(f"Build 295 startup-gate marker missing: {marker}")
if "return originalApiFetch.call(auth, input, init);" not in gate:
    fail("Build 295 gate does not preserve non-Packaging traffic")
if "document.addEventListener(AUTH_DEGRADED_EVENT, onAuthUnavailable)" in gate:
    fail("Build 295 still treats temporary degraded auth as a terminal startup failure")
if "document.addEventListener(AUTH_DEGRADED_EVENT, onAuthDegraded)" not in gate:
    fail("Build 295 does not observe degraded auth without aborting the startup wait")
if gate.count("replayedLegacyRequests += 1;") < 2:
    fail("Build 295 does not protect both runtime-before-gate and gate-before-runtime replay orders")
print("PASS: startup gate delays legacy-shaped Packaging traffic until modular transport is active")
print("PASS: temporary degraded auth no longer aborts the Packaging startup wait")
print("PASS: both valid dynamic-import startup orders replay through modular Packaging transport")

page = read("admin/packaging-studio/index.html")
gate_ref = '/public/js/admin-packaging-startup-gate.js?v=295'
admin_ref = '/public/js/admin.js?v=245'
editor_ref = '/public/js/admin-packaging-studio.js?v=277'
for ref, label in [
    (gate_ref, "Build 295 startup gate"),
    (admin_ref, "admin modular runtime launcher"),
    (editor_ref, "mature Packaging editor"),
]:
    if ref not in page:
        fail(f"Packaging page does not load the {label}")
if not (page.index(gate_ref) < page.index(admin_ref) < page.index(editor_ref)):
    fail("Packaging script order must be startup gate -> admin runtime launcher -> mature editor")
print("PASS: Packaging startup gate loads before admin.js and the mature editor")

protected = [
    "public/js/admin-packaging-studio.js",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/artwork-picker.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "functions/api/admin/packaging-studio.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-write.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"Build 295 unexpectedly changed protected Packaging authority/runtime: {path}")
print("PASS: proven Build 290-294 Packaging runtime and server authorities are unchanged")

build294 = read("scripts/build294_packaging_legacy_get_server_retirement_test.py")
if 'HISTORICAL_HEAD = "7c2e49ee3764edb80adb3e26786cc97693a6e60b"' not in build294:
    fail("Build 294 historical regression head is not pinned")
if 'run(["git", "diff", "--quiet", BASE, HISTORICAL_HEAD, "--", path])' not in build294:
    fail("Build 294 protected browser/runtime boundary still follows future HEAD")
if 'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])' not in build294:
    fail("Build 294 changed-file boundary still follows future HEAD")
print("PASS: Build 294 historical regression boundary is pinned")

result = run(["git", "diff", "--name-only", BASE, "HEAD"])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 295 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 295 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 295 changed Cloudflare binding/config")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, read/write authority, or mature editor change")

print("BUILD 295 PACKAGING STARTUP TRANSPORT GATE: PASS")
print("No Cloudflare resource was contacted.")
