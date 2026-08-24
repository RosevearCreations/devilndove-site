#!/usr/bin/env python3
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASE = "e5be1b4adcb2a6f335d1aabbe90ca6b9234a2f45"
HISTORICAL_HEAD = "21b01cc34ef734f581da22a7f0d3c43ec10607c0"
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


def git_show(ref, path):
    result = run(["git", "show", f"{ref}:{path}"])
    if result.returncode:
        fail(f"could not read historical {path} at {ref}: {result.stderr.strip()}")
    return result.stdout


stabilizer = git_show(HISTORICAL_HEAD, "public/js/admin-packaging-save-stabilizer-v300.js")
with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".js", delete=False) as handle:
    handle.write(stabilizer)
    syntax_path = handle.name
syntax = subprocess.run(["node", "--check", syntax_path], text=True, capture_output=True, encoding="utf-8", errors="replace")
Path(syntax_path).unlink(missing_ok=True)
if syntax.returncode:
    fail(syntax.stderr.strip() or "historical Build 300 JavaScript syntax failed")
print("PASS: completed Build 300 JavaScript syntax")

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
        fail(f"completed Build 300 stabilizer marker missing: {marker}")
if "/api/admin/packaging-studio" in stabilizer:
    fail("completed Build 300 stabilizer names the retired Packaging route")
if "not printed on soap ribbon" in stabilizer:
    fail("completed Build 300 falsely labels the soap front tagline as non-printing")
print("PASS: completed Build 300 verified-save + fitted-preview stabilization is pinned")

page = git_show(HISTORICAL_HEAD, "admin/packaging-studio/index.html")
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
        fail(f"completed Build 300 Packaging page marker missing: {marker}")
positions = [page.index(marker) for marker in required]
if positions != sorted(positions):
    fail("completed Build 300 Packaging script order is not deterministic")
if '/public/js/admin-packaging-print-source-v299.js?v=299' in page:
    fail("completed Build 300 still loads the rolled-back Build 299 browser controller")
print("PASS: completed Build 300 live page shape is pinned historically")

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
    result = run(["git", "diff", "--quiet", BASE, HISTORICAL_HEAD, "--", path])
    if result.returncode != 0:
        fail(f"protected Packaging authority changed inside completed Build 300 boundary: {path}")
print("PASS: completed Build 300 protected authorities are historically unchanged")

build299_validation = git_show(HISTORICAL_HEAD, "BUILD299_VALIDATION.md")
for marker in ["NOT COMPLETE", "rolled back", "Build 300"]:
    if marker.lower() not in build299_validation.lower():
        fail(f"completed Build 300 rollback record missing marker: {marker}")
print("PASS: completed Build 300 preserves the Build 299 rollback record")

committed = run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])
if committed.returncode:
    fail(committed.stderr.strip() or "could not read completed Build 300 boundary")
actual = {line.strip() for line in committed.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"completed Build 300 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact completed Build 300 stabilization boundary is historically pinned")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in completed Build 300 boundary: {path}")
print("PASS: completed Build 300 had no SQL/schema, Cloudflare binding/config, R2, or Production change")

print(f"BUILD 300 PACKAGING STABILIZATION HISTORICAL REGRESSION: PASS ({HISTORICAL_HEAD[:8]})")
print("No Cloudflare resource was contacted.")
