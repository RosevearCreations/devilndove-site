#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "e5be1b4adcb2a6f335d1aabbe90ca6b9234a2f45"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD299_VALIDATION.md",
    "BUILD300_CHANGED_FILES.md",
    "BUILD300_VALIDATION.md",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD300_PACKAGING_STABILIZATION.md",
    "public/js/admin-packaging-save-stabilizer-v300.js",
    "scripts/build300_packaging_stabilization_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, encoding="utf-8", errors="replace")


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


stabilizer = read("public/js/admin-packaging-save-stabilizer-v300.js")
syntax = run(["node", "--check", "public/js/admin-packaging-save-stabilizer-v300.js"])
if syntax.returncode:
    fail(syntax.stderr.strip() or "Build 300 JavaScript syntax failed")
print("PASS: Build 300 JavaScript syntax")

for marker in [
    "const BUILD = 300;",
    "if (body?.action === 'save_project') return verifiedSave(body, projectId);",
    "const freshResponse = await originalRequest(null, requestedProjectId);",
    "const expectedClaims = normalizeClaims(body?.structured_claims);",
    "const actualClaims = normalizeClaims(freshPayload.detail?.structured_claims);",
    "const claimsMatch = claimsEqual(expectedClaims, actualClaims);",
    "const mismatches = coreMismatches(body || {}, freshPayload.detail.project);",
    "packaging_save_verification_mismatch",
    "Verified by fresh D1 read-back.",
    "identity.dataset.build300DerivedIdentity",
    "identity.dispatchEvent(new Event('input', { bubbles: true }))",
    "let previewMode = 'fit';",
    "data-build300-preview-fit",
    "data-build300-preview-detail",
    "svg.style.setProperty('width', '100%', 'important');",
    "svg.style.setProperty('min-width', '0', 'important');",
    "preview_claims_match_dom",
    "dom_matches_verified",
    "forcedPreviewRefreshCount",
    "const nextStatus = `${savePart} ${claimPart} ${modePart}`;",
    "if (status.textContent !== nextStatus) status.textContent = nextStatus;",
    "const observer = new MutationObserver((mutations) => {",
    "return !target?.closest?.('[data-build300-preview-controls]');",
    "auditPreview: () => auditPreview('manual', true)",
    "globalThis.DDPackagingSaveStabilizer = Object.freeze",
]:
    if marker not in stabilizer:
        fail(f"Build 300 stabilizer marker missing: {marker}")
if "/api/admin/packaging-studio" in stabilizer:
    fail("Build 300 stabilizer names the retired Packaging route")
if "not printed on soap ribbon" in stabilizer:
    fail("Build 300 still falsely labels the soap front tagline as non-printing")
print("PASS: Build 300 verifies Save Project, fits/audits the full live soap preview, and prevents preview-audit observer feedback")

page = read("admin/packaging-studio/index.html")
required = [
    '/public/js/admin-packaging-startup-gate-v297.js?v=297',
    '/public/js/admin.js?v=296',
    '/public/js/admin-packaging-client-transport-v297.js?v=297',
    '/public/js/admin-packaging-native-client-v298.js?v=298',
    '/public/js/admin-packaging-save-stabilizer-v300.js?v=300',
    '/public/js/admin-packaging-studio.js?v=298',
]
for marker in required:
    if marker not in page:
        fail(f"Packaging page marker missing: {marker}")
positions = [page.index(marker) for marker in required]
if positions != sorted(positions):
    fail("Packaging stabilization script order is not deterministic")
if '/public/js/admin-packaging-print-source-v299.js?v=299' in page:
    fail("Build 299 browser print-source controller is still loaded on the live Packaging page")
print("PASS: Packaging page restored to proven Build 298 runtime with Build 300 stabilizer only")

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
    if result.returncode != 0:
        fail(f"protected Packaging authority changed from Build 299 base: {path}")
print("PASS: mature editor and proven native read/write/tombstone authorities are unchanged")

build299_validation = read("BUILD299_VALIDATION.md")
for marker in [
    "NOT COMPLETE",
    "rolled back",
    "Build 300",
]:
    if marker.lower() not in build299_validation.lower():
        fail(f"Build 299 rollback record missing marker: {marker}")
print("PASS: Build 299 is explicitly not signed off and its browser controller rollback is documented")

committed = run(["git", "diff", "--name-only", BASE, "HEAD"])
if committed.returncode:
    fail(committed.stderr.strip() or "could not read committed Build 300 boundary")
local = run(["git", "diff", "--name-only"])
if local.returncode:
    fail(local.stderr.strip() or "could not read local Build 300 boundary")
actual = {line.strip() for line in (committed.stdout + "\n" + local.stdout).splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"Build 300 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 300 stabilization changed-file boundary")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in Build 300 boundary: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change")

print("BUILD 300 PACKAGING STABILIZATION: PASS")
print("No Cloudflare resource was contacted.")