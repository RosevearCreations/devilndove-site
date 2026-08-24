#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "000b9617bc5141ba876ec667d4fbc653ea9ee556"
HISTORICAL_HEAD = "6cbcc4353327eea093ef4701497fa5321b680096"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD303_CHANGED_FILES.md",
    "BUILD303_VALIDATION.md",
    "docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "scripts/build302_core_three_module_architecture_test.py",
    "scripts/build303_commerce_operations_umbrella_bridge_test.py",
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


def git_show(ref, path):
    result = run(["git", "show", f"{ref}:{path}"])
    if result.returncode:
        fail(f"could not read {path} at {ref}: {result.stderr.strip()}")
    return result.stdout


def changed_files(base, head):
    result = run(["git", "diff", "--name-only", base, head])
    if result.returncode:
        fail(result.stderr.strip() or f"could not compare {base}..{head}")
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


def node_check_source(source, filename):
    path = ROOT / filename
    try:
        path.write_text(source, encoding="utf-8")
        result = run(["node", "--check", filename])
        if result.returncode:
            fail(result.stderr.strip() or f"historical JavaScript syntax failed: {filename}")
    finally:
        path.unlink(missing_ok=True)


admin = git_show(HISTORICAL_HEAD, "public/js/admin.js")
runtime = git_show(HISTORICAL_HEAD, "public/js/core/dd-admin-module-runtime.mjs")
node_check_source(admin, ".build303-historical-admin.js")
node_check_source(runtime, ".build303-historical-runtime.mjs")
print("PASS: completed Build 303 shared Admin/Core JavaScript syntax is historically pinned")

for marker in [
    "// Devil n Dove Build 303 Admin module runtime bridge.",
    "BUILD as APPLICATION_ARCHITECTURE_BUILD",
    "applicationModuleForDomain",
    "getApplicationModule",
    "snapshotApplicationArchitecture",
    "link.dataset.ddApplicationModuleTarget",
    "document.documentElement.dataset.ddApplicationModule",
    "dd:application-module-resolved",
    "build: 303",
    "applicationArchitectureBuild: APPLICATION_ARCHITECTURE_BUILD",
    "getCurrentApplicationModule: () => currentApplicationModule",
    "let verifiedResolutionPromise = null",
    "function requestVerifiedAdminResolution",
    "function reconcileVerifiedAuthState",
    "globalThis.DDAuthUiState",
    "queueMicrotask(reconcileVerifiedAuthState)",
    "document.addEventListener('dd:auth-verified'",
]:
    if marker not in runtime:
        fail(f"historical Build 303 Core runtime marker missing: {marker}")
for forbidden in ["fetch(", "DDAuth.apiFetch", "XMLHttpRequest"]:
    if forbidden in runtime:
        fail(f"historical Build 303 Core runtime unexpectedly creates network transport: {forbidden}")
print("PASS: completed Build 303 umbrella classification and verified-auth reconciliation are historically pinned")

for marker in [
    "Build 303: Core runtime reports Build 302 umbrella application-module classification",
    "dd-admin-module-runtime.mjs?v=303",
]:
    if marker not in admin:
        fail(f"historical Build 303 shared Admin loader marker missing: {marker}")
print("PASS: completed Build 303 shared Admin loader is historically pinned")

validation = git_show(HISTORICAL_HEAD, "BUILD303_VALIDATION.md")
for marker in [
    "Status — COMPLETE IN DEVELOPMENT",
    "4fa2124cb89edff89c873c0dbdc1feee35a4e92b",
    "catalog -> commerce-operations",
    "packaging -> creative-production",
    "packaging_compatibility_state   active",
    "native_read_status              200",
]:
    if marker not in validation:
        fail(f"completed Build 303 validation marker missing: {marker}")
print("PASS: completed Build 303 Development browser proof is historically pinned")

build302_test = git_show(HISTORICAL_HEAD, "scripts/build302_core_three_module_architecture_test.py")
for marker in [
    'HISTORICAL_HEAD = "000b9617bc5141ba876ec667d4fbc653ea9ee556"',
    'BUILD 302 CORE + THREE MODULE ARCHITECTURE HISTORICAL REGRESSION: PASS',
]:
    if marker not in build302_test:
        fail(f"completed Build 302 historical pin missing at Build 303 head: {marker}")
print("PASS: Build 303 preserves the completed Build 302 historical pin")

protected = [
    "public/js/core/dd-module-registry.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "admin/packaging-studio/index.html",
    "public/js/admin-packaging-compatibility-v301.js",
    "public/js/admin-packaging-save-stabilizer-v300.js",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/admin-packaging-client-transport-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/modules/packaging/native-read-transport.mjs",
    "public/js/admin-packaging-studio.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/contracts/catalog-read.js",
    "functions/api/admin/contracts/inventory-read.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, HISTORICAL_HEAD, "--", path])
    if result.returncode != 0:
        fail(f"protected domain/service/Packaging file changed in completed Build 303: {path}")
print("PASS: completed Build 303 preserved domain services and the Build 301 Packaging stack")

actual = changed_files(BASE, HISTORICAL_HEAD)
if actual != EXPECTED:
    fail(f"completed Build 303 boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact completed Build 303 umbrella-bridge boundary is historically pinned")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in completed Build 303 boundary: {path}")
print("PASS: completed Build 303 had no SQL/schema, Cloudflare binding/config, R2, or Production change")

print(f"BUILD 303 COMMERCE & OPERATIONS UMBRELLA BRIDGE HISTORICAL REGRESSION: PASS ({HISTORICAL_HEAD[:8]})")
print("No Cloudflare resource was contacted.")
