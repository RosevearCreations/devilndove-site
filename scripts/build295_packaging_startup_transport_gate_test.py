#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "7c2e49ee3764edb80adb3e26786cc97693a6e60b"
HISTORICAL_HEAD = "afc50a80183ce30bc9c6182a4db3c4adc068f0ad"
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
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: current JavaScript syntax remains valid after historical Build 295 pin")

gate = git_show(HISTORICAL_HEAD, "public/js/admin-packaging-startup-gate.js")
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
    "legacy_server_route_contacted: false",
]:
    if marker not in gate:
        fail(f"historical Build 295 startup-gate marker missing: {marker}")
if "document.addEventListener(AUTH_DEGRADED_EVENT, onAuthUnavailable)" in gate:
    fail("historical Build 295 treated temporary degraded auth as terminal")
if gate.count("replayedLegacyRequests += 1;") < 2:
    fail("historical Build 295 did not protect both dynamic-import startup orders")
print("PASS: historical Build 295 startup-gate source is pinned")

page = git_show(HISTORICAL_HEAD, "admin/packaging-studio/index.html")
gate_ref = '/public/js/admin-packaging-startup-gate.js?v=295'
admin_ref = '/public/js/admin.js?v=245'
editor_ref = '/public/js/admin-packaging-studio.js?v=277'
for ref, label in [
    (gate_ref, "Build 295 startup gate"),
    (admin_ref, "admin modular runtime launcher"),
    (editor_ref, "mature Packaging editor"),
]:
    if ref not in page:
        fail(f"historical Packaging page does not load the {label}")
if not (page.index(gate_ref) < page.index(admin_ref) < page.index(editor_ref)):
    fail("historical Build 295 Packaging script order is incorrect")
print("PASS: historical Build 295 script ordering is pinned")

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
    result = run(["git", "diff", "--quiet", BASE, HISTORICAL_HEAD, "--", path])
    if result.returncode != 0:
        fail(f"historical Build 295 unexpectedly changed protected authority/runtime: {path}")
print("PASS: historical Build 290-294 authority/runtime boundary is pinned")

build294 = read("scripts/build294_packaging_legacy_get_server_retirement_test.py")
if 'HISTORICAL_HEAD = "7c2e49ee3764edb80adb3e26786cc97693a6e60b"' not in build294:
    fail("Build 294 historical regression head is not pinned")
print("PASS: Build 294 historical regression boundary remains pinned")

result = run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])
if result.returncode:
    fail(f"historical changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"historical Build 295 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact historical Build 295 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("historical Build 295 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("historical Build 295 changed Cloudflare binding/config")
print("PASS: historical Build 295 had no SQL/schema or Cloudflare binding/config change")

print("BUILD 295 PACKAGING STARTUP TRANSPORT GATE: HISTORICAL PASS")
print("No Cloudflare resource was contacted.")
