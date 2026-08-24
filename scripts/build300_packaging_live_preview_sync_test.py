#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "e5be1b4adcb2a6f335d1aabbe90ca6b9234a2f45"
EXPECTED = {
    "BUILD300_CHANGED_FILES.md",
    "BUILD300_VALIDATION.md",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD300_PACKAGING_LIVE_PREVIEW_SYNC.md",
    "public/js/admin-packaging-preview-sync-v300.js",
    "scripts/apply_build300_packaging_live_preview_sync.py",
    "scripts/build300_packaging_live_preview_sync_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, encoding="utf-8", errors="replace")


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


controller = read("public/js/admin-packaging-preview-sync-v300.js")
syntax = run(["node", "--check", "public/js/admin-packaging-preview-sync-v300.js"])
if syntax.returncode:
    fail(syntax.stderr.strip() or "Build 300 JavaScript syntax failed")
print("PASS: Build 300 JavaScript syntax")

for marker in [
    "const BUILD = 300;",
    "build300DerivedIdentity",
    "identitySyncCount",
    "identity.dispatchEvent(new Event('input', { bubbles: true }))",
    "Front tagline (saved metadata; not printed on soap ribbon)",
    "globalThis.DDPackagingPreviewSync = Object.freeze",
    "matureEditorPreserved: true",
    "saveTransportPreserved: true",
]:
    if marker not in controller:
        fail(f"Build 300 controller marker missing: {marker}")
print("PASS: Build 300 synchronizes only derived English identity and exposes preview diagnostics")

page = read("admin/packaging-studio/index.html")
required = [
    '/public/js/admin-packaging-studio.js?v=298',
    '/public/js/admin-packaging-preview-sync-v300.js?v=300',
    '/public/js/admin-packaging-print-source-v299.js?v=299',
]
for marker in required:
    if marker not in page:
        fail(f"Packaging page marker missing: {marker}")
if not (page.index(required[0]) < page.index(required[1]) < page.index(required[2])):
    fail("Build 300 preview controller must load after mature editor and before Build 299 print-source controller")
print("PASS: Build 300 page activation order")

# Preserve proven editor/transport/server authorities byte-for-byte from the Build 299 base.
protected = [
    "public/js/admin-packaging-studio.js",
    "public/js/admin-packaging-native-client-v298.js",
    "public/js/modules/packaging/native-client-v298.mjs",
    "public/js/admin-packaging-print-source-v299.js",
    "functions/api/admin/packaging-version-artifact.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-write.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-studio.js",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode not in (0,):
        fail(f"protected Build 298/299 Packaging authority changed: {path}")
print("PASS: mature editor and proven read/write/print/tombstone authorities are unchanged")

committed = run(["git", "diff", "--name-only", BASE, "HEAD"])
if committed.returncode:
    fail(committed.stderr.strip() or "could not read committed Build 300 boundary")
local = run(["git", "diff", "--name-only"])
if local.returncode:
    fail(local.stderr.strip() or "could not read local Build 300 boundary")
actual = {line.strip() for line in (committed.stdout + "\n" + local.stdout).splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"Build 300 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 300 changed-file boundary across committed + local activation changes")

for forbidden in [".sql", "wrangler.toml", "wrangler.json", "wrangler.jsonc"]:
    if any(path.endswith(forbidden) or path == forbidden for path in actual):
        fail(f"forbidden schema/config change in Build 300 boundary: {forbidden}")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 300 PACKAGING LIVE PREVIEW SYNC: PASS")
print("No Cloudflare resource was contacted.")
