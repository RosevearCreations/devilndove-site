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
    "function isLegacyPackagingRequest(input, init = {})",
    "function waitForPackagingRuntime()",
    "status.legacyGetGuardArmed === true",
    "status.writeResponseBridgeArmed === true",
    "if (currentFetch !== gatedApiFetch && typeof currentFetch === 'function')",
    "error_code: 'packaging_runtime_not_ready'",
    "legacy_server_route_contacted: false",
    "status: 503",
    "globalThis.DDPackagingStartupGate = Object.freeze",
    "legacyServerRouteContactedByGate: false",
]:
    if marker not in gate:
        fail(f"Build 295 startup-gate marker missing: {marker}")
if "return originalApiFetch.call(auth, input, init);" not in gate:
    fail("Build 295 gate does not preserve non-Packaging traffic")
print("PASS: startup gate delays legacy-shaped Packaging traffic until modular transport is active")

page = read("admin/packaging-studio/index.html")
gate_ref = '/public/js/admin-packaging-startup-gate.js?v=295'
editor_ref = '/public/js/admin-packaging-studio.js?v=277'
if gate_ref not in page:
    fail("Packaging page does not load the Build 295 startup gate")
if editor_ref not in page:
    fail("Packaging page lost the proven mature editor script")
if page.index(gate_ref) > page.index(editor_ref):
    fail("Build 295 startup gate loads after the mature Packaging editor")
print("PASS: Packaging startup gate loads before the mature editor")

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
