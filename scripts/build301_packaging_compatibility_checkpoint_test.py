#!/usr/bin/env python3
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASE = "21b01cc34ef734f581da22a7f0d3c43ec10607c0"
HISTORICAL_HEAD = "a81f8d6af0004d847174fa27043c11e159ca3d10"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD301_CHANGED_FILES.md",
    "BUILD301_VALIDATION.md",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD301_PACKAGING_COMPATIBILITY_CHECKPOINT.md",
    "public/js/admin-packaging-compatibility-v301.js",
    "scripts/apply_build301_packaging_compatibility_checkpoint.py",
    "scripts/build300_packaging_stabilization_test.py",
    "scripts/build301_packaging_compatibility_checkpoint_test.py",
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


compat = git_show(HISTORICAL_HEAD, "public/js/admin-packaging-compatibility-v301.js")
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as handle:
    handle.write(compat)
    syntax_path = handle.name
try:
    syntax = run(["node", "--check", syntax_path])
finally:
    Path(syntax_path).unlink(missing_ok=True)
if syntax.returncode:
    fail(syntax.stderr.strip() or "historical Build 301 compatibility JavaScript syntax failed")
print("PASS: completed Build 301 JavaScript syntax is historically pinned")

for marker in [
    "const BUILD = 301;",
    "compatibilityCheckpoint: true",
    "singleConversationBuild: BUILD",
    "startupGateBuild: 297",
    "clientTransportBuild: 297",
    "nativeClientBuild: 298",
    "stabilizationBuild: 300",
    "editorImplementationBuild: 298",
    "nativeReadGatewayBuild: 293",
    "nativeReadImplementationBuild: 286",
    "nativeWriteGatewayBuild: 292",
    "nativeWriteServiceBuild: 291",
    "globalThis.DDPackagingCompatibility = Object.freeze",
    "dd:packaging-compatibility-active",
    "productionContactedByCheckpoint: false",
]:
    if marker not in compat:
        fail(f"historical Build 301 compatibility marker missing: {marker}")
if "DDAuth.apiFetch" in compat or "fetch(" in compat:
    fail("historical Build 301 checkpoint unexpectedly creates a network transport")
if "/api/admin/packaging-studio" in compat:
    fail("historical Build 301 checkpoint names the retired Packaging route")
print("PASS: completed Build 301 compatibility umbrella is historically pinned")

page = git_show(HISTORICAL_HEAD, "admin/packaging-studio/index.html")
required = [
    '/public/js/admin-packaging-startup-gate-v297.js?v=297',
    '/public/js/admin.js?v=296',
    '/public/js/admin-packaging-client-transport-v297.js?v=297',
    '/public/js/admin-packaging-native-client-v298.js?v=298',
    '/public/js/admin-packaging-save-stabilizer-v300.js?v=300',
    '/public/js/admin-packaging-compatibility-v301.js?v=301',
    '/public/js/admin-packaging-studio.js?v=298',
]
for marker in required:
    if marker not in page:
        fail(f"historical Build 301 page marker missing: {marker}")
positions = [page.index(marker) for marker in required]
if positions != sorted(positions):
    fail("historical Build 301 Packaging script order is not deterministic")
if 'Build 301 compatibility checkpoint' not in page:
    fail("historical Packaging page does not present Build 301 as current checkpoint")
if '/public/js/admin-packaging-print-source-v299.js?v=299' in page:
    fail("rolled-back Build 299 browser controller is loaded in historical Build 301")
print("PASS: completed Build 301 live page shape is historically pinned")

build300_test = git_show(HISTORICAL_HEAD, "scripts/build300_packaging_stabilization_test.py")
for marker in [
    'HISTORICAL_HEAD = "21b01cc34ef734f581da22a7f0d3c43ec10607c0"',
    'BUILD 300 PACKAGING STABILIZATION HISTORICAL REGRESSION: PASS',
]:
    if marker not in build300_test:
        fail(f"Build 300 historical pin missing at Build 301 head: {marker}")
print("PASS: Build 301 preserves the completed Build 300 historical pin")

protected = [
    "public/js/admin.js",
    "public/js/admin-packaging-startup-gate-v297.js",
    "public/js/admin-packaging-client-transport-v297.js",
    "public/js/modules/packaging/client-transport-v297.mjs",
    "public/js/modules/packaging/native-read-transport.mjs",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/admin-packaging-save-stabilizer-v300.js",
    "public/js/admin-packaging-studio.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-studio.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, HISTORICAL_HEAD, "--", path])
    if result.returncode != 0:
        fail(f"protected Packaging implementation changed in completed Build 301: {path}")
print("PASS: completed Build 301 protected Packaging authorities are historically unchanged")

actual = changed_files(BASE, HISTORICAL_HEAD)
if actual != EXPECTED:
    fail(f"completed Build 301 boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact completed Build 301 boundary is historically pinned")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in completed Build 301 boundary: {path}")
print("PASS: completed Build 301 had no SQL/schema, Cloudflare binding/config, R2, or Production change")

print(f"BUILD 301 PACKAGING COMPATIBILITY HISTORICAL REGRESSION: PASS ({HISTORICAL_HEAD[:8]})")
print("No Cloudflare resource was contacted.")
