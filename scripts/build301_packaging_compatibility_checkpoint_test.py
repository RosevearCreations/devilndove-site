#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "21b01cc34ef734f581da22a7f0d3c43ec10607c0"
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
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, encoding="utf-8", errors="replace")


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def changed_files(*args):
    result = run(["git", "diff", "--name-only", *args])
    if result.returncode:
        fail(f"git changed-file check failed for {args}: {result.stderr.strip()}")
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


compat = read("public/js/admin-packaging-compatibility-v301.js")
syntax = run(["node", "--check", "public/js/admin-packaging-compatibility-v301.js"])
if syntax.returncode:
    fail(syntax.stderr.strip() or "Build 301 JavaScript syntax failed")
print("PASS: Build 301 JavaScript syntax")

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
        fail(f"Build 301 compatibility marker missing: {marker}")
if "DDAuth.apiFetch" in compat or "fetch(" in compat:
    fail("Build 301 compatibility checkpoint must be diagnostic-only and must not create a network transport")
if "/api/admin/packaging-studio" in compat:
    fail("Build 301 compatibility checkpoint names the retired Packaging route")
print("PASS: Build 301 is a diagnostic compatibility umbrella with explicit implementation provenance")

page = read("admin/packaging-studio/index.html")
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
        fail(f"Packaging page marker missing: {marker}")
positions = [page.index(marker) for marker in required]
if positions != sorted(positions):
    fail("Build 301 Packaging script order is not deterministic")
if 'Build 301 compatibility checkpoint' not in page:
    fail("Packaging page does not present Build 301 as the current compatibility checkpoint")
if '/public/js/admin-packaging-print-source-v299.js?v=299' in page:
    fail("rolled-back Build 299 browser controller is loaded on the Build 301 page")
print("PASS: Packaging page presents one Build 301 compatibility checkpoint over the proven implementation stack")

build300_test = read("scripts/build300_packaging_stabilization_test.py")
for marker in [
    'HISTORICAL_HEAD = "21b01cc34ef734f581da22a7f0d3c43ec10607c0"',
    'git_show(HISTORICAL_HEAD, "public/js/admin-packaging-save-stabilizer-v300.js")',
    'git_show(HISTORICAL_HEAD, "admin/packaging-studio/index.html")',
    'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])',
    'BUILD 300 PACKAGING STABILIZATION HISTORICAL REGRESSION: PASS',
]:
    if marker not in build300_test:
        fail(f"Build 300 historical pin missing marker: {marker}")
print("PASS: completed Build 300 stabilization is historically pinned")

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
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"protected proven Packaging implementation changed in Build 301: {path}")
print("PASS: Build 297/298/300 browser implementations and 293/286 + 292/291 server authorities are unchanged")

# Build 301 is deliberately validated before the one activation page file is committed.
# Combine committed BASE->HEAD changes with unstaged/staged working-tree changes so the
# exact boundary check works immediately before activation commit and after it.
committed = changed_files(BASE, "HEAD")
working_tree = changed_files("HEAD")
staged = changed_files("--cached", "HEAD")
actual = committed | working_tree | staged
if actual != EXPECTED:
    fail(
        "Build 301 changed-file boundary mismatch. "
        f"expected={sorted(EXPECTED)} actual={sorted(actual)} "
        f"committed={sorted(committed)} working_tree={sorted(working_tree)} staged={sorted(staged)}"
    )
print("PASS: exact Build 301 changed-file boundary across committed + local activation changes")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in Build 301 boundary: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 301 PACKAGING COMPATIBILITY CHECKPOINT: PASS")
print("No Cloudflare resource was contacted.")
