#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASE = "9a4dde6b974e0a4885b4fb91fa83e4cb6c666f20"
FINAL = "70902c5144e91964e42dbf113931bcd5edcde2f8"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD287_CHANGED_FILES.md",
    "BUILD287_VALIDATION.md",
    "docs/architecture/BUILD287_PACKAGING_CONTENT_ARTWORK_PICKER.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/artwork-picker.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "scripts/build286_packaging_boundary_test.py",
    "scripts/build287_packaging_artwork_picker_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True)


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


js_files = [
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/artwork-picker.mjs",
    "public/js/modules/packaging/runtime.mjs",
]
for name in js_files:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 287 JavaScript syntax")

result = run([
    "node", "--input-type=module", "-e",
    "import('./public/js/modules/packaging/runtime.mjs').then(m=>{if(m.metadata?.build!==287)process.exit(2)}).catch(e=>{console.error(e);process.exit(1)})"
])
if result.returncode:
    fail(f"Build 287 module import failed: {result.stderr.strip() or result.stdout.strip()}")
print("PASS: Build 287 module imports resolve")

picker_path = ROOT / "public/js/modules/packaging/artwork-picker.mjs"
harness = r"""
import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL(process.argv[2]).href + `?test=${Date.now()}`);
const stable = mod.stableArtworkUrl('/media/art.png?foo=1&v=20260823120000#x');
if (stable !== '/media/art.png?foo=1#x') throw new Error(`unexpected stable URL ${stable}`);
const rows = mod.normalizeContentArtworkRows([
  { media_asset_id: 7, public_url: '/media/art.png?v=1', display_name: 'Managed Art', width_px: 1000, height_px: 1000 },
  { media_asset_id: 7, public_url: '/media/art.png?v=2', display_name: 'Duplicate' },
  { media_asset_id: 8, public_url: '', display_name: 'No URL' },
]);
if (rows.length !== 1) throw new Error(`expected one normalized row, got ${rows.length}`);
if (rows[0].stable_url !== '/media/art.png') throw new Error(`unexpected normalized stable URL ${rows[0].stable_url}`);
const model = mod.buildArtworkPickerModel(rows, '/media/art.png?v=old');
if (model.count !== 1 || model.selectedMediaAssetId !== 7 || model.selectedUrl !== '/media/art.png') throw new Error('picker model did not match stable existing path');
console.log(JSON.stringify({ ok: true, stable, model }));
"""
with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as tmp:
    tmp.write(harness)
    harness_path = tmp.name
try:
    result = subprocess.run(
        ["node", harness_path, str(picker_path)],
        cwd=ROOT, text=True, capture_output=True
    )
finally:
    Path(harness_path).unlink(missing_ok=True)
if result.returncode:
    fail(f"artwork picker model harness failed: {result.stderr.strip() or result.stdout.strip()}")
payload = json.loads(result.stdout.strip().splitlines()[-1])
if not payload.get("ok"):
    fail("artwork picker model harness returned false")
print("PASS: Content artwork URL normalization/model behavior")

runtime = read("public/js/modules/packaging/runtime.mjs")
base = read("public/js/modules/packaging/index.mjs")
if "import * as base from './index.mjs';" not in runtime:
    fail("Build 287 runtime does not compose the Build 286 Packaging bridge")
if "baseBuild: 286" not in runtime or "behaviorMode: 'content-artwork-picker-runtime'" not in runtime:
    fail("Build 287 runtime composition markers missing")
if "apiBoundaryCleanupBridge: true" not in base or "build: 286" not in base:
    fail("proven Build 286 base bridge markers missing")
print("PASS: Packaging runtime composes Build 286 without modifying it")

picker = read("public/js/modules/packaging/artwork-picker.mjs")
required_picker_markers = [
    "documentRef.getElementById('packagingArtworkAsset')",
    "Use selected artwork",
    "Refresh Content artwork",
    "Clear artwork path",
    "The advanced manual path remains available",
    "field.value = row.stable_url",
    "field.value = ''",
    "media_type “artwork”",
]
for marker in required_picker_markers:
    if marker not in picker:
        fail(f"artwork picker behavior marker missing: {marker}")
if "setInterval(" in picker or "setTimeout(" in picker:
    fail("artwork picker introduced timer-based polling")
print("PASS: artwork picker preserves manual path and explicit selection semantics")

admin = read("public/js/admin.js")
module_runtime = read("public/js/core/dd-admin-module-runtime.mjs")
definitions = read("public/js/core/dd-module-definitions.mjs")
if "dd-admin-module-runtime.mjs?v=287" not in admin:
    fail("Admin does not load Build 287 runtime")
if "build: 287" not in module_runtime:
    fail("module runtime does not report Build 287")
if "entry: '../modules/packaging/runtime.mjs?v=287'" not in definitions:
    fail("Packaging definition does not load the Build 287 composition runtime")
print("PASS: Build 287 routing/version markers")

build286_test = read("scripts/build286_packaging_boundary_test.py")
if '"9a4dde6b974e0a4885b4fb91fa83e4cb6c666f20"' not in build286_test:
    fail("Build 286 historical changed-file audit is not pinned to final Build 286")
if '"125a4a6b77485b582d93ca30504b2333b7cb3476",\n    "HEAD"' in build286_test:
    fail("Build 286 regression still compares its historical boundary to future HEAD")
print("PASS: Build 286 historical regression boundary is pinned")

result = run(["git", "diff", "--name-only", BASE, FINAL])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 287 changed-file boundary")

if any(name.startswith("functions/") for name in actual):
    fail("Build 287 changed a Function")
if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 287 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 287 changed Cloudflare binding/config")
for forbidden in {
    "public/js/admin-packaging-studio.js",
    "public/js/modules/packaging/index.mjs",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/packaging-bootstrap.js",
}:
    if forbidden in actual:
        fail(f"Build 287 modified protected compatibility boundary file: {forbidden}")
print("PASS: no Function, SQL/schema, Cloudflare binding/config, or legacy Packaging UI change")

print("BUILD 287 PACKAGING CONTENT ARTWORK PICKER: PASS")
print("No Cloudflare resource was contacted.")
