#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "b4dc4ce2890c0a982aae56d343caa88b5f0d807b"
HISTORICAL_HEAD = "d207609967c9a182627561f2f8f9b7ae47b17b04"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD290_CHANGED_FILES.md",
    "BUILD290_VALIDATION.md",
    "docs/architecture/BUILD290_PACKAGING_LEGACY_BROAD_READ_SOURCE_REMOVAL.md",
    "functions/api/_lib/packagingWriteBoundary.mjs",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/packaging-write.js",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "scripts/build290_packaging_legacy_broad_read_source_removal_test.py",
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


def between(text, start, end=None):
    if start not in text:
        fail(f"section start not found: {start}")
    tail = text[text.index(start):]
    if end is None:
        return tail
    if end not in tail:
        fail(f"section end not found: {end}")
    return tail[:tail.index(end)]


js_files = [
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/packaging-write.js",
]
for name in js_files:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 290 JavaScript syntax")

result = run([
    "node", "--input-type=module", "-e",
    "import('./public/js/modules/packaging/runtime.mjs').then(m=>{if(m.metadata?.build!==290)process.exit(2)}).catch(e=>{console.error(e);process.exit(1)})"
])
if result.returncode:
    fail(f"Build 290 module import failed: {result.stderr.strip() or result.stdout.strip()}")
print("PASS: Build 290 module imports resolve")

studio = git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-studio.js")
list_data = between(studio, "async function listData(db){", "async function loadDetail(db,projectId){")
for forbidden in [
    "ORDER BY LOWER(name),product_id DESC LIMIT 500",
    "ORDER BY LOWER(sii.item_name) LIMIT 1000",
    "ORDER BY LOWER(item_name) LIMIT 1000",
    "const products=rows(await db.prepare",
    "let inventory=[]",
    "mapPackagingInventory",
    "return{templates,projects,products,inventory",
]:
    if forbidden in list_data or (forbidden in {"mapPackagingInventory"} and forbidden in studio):
        fail(f"retired broad-read marker remains: {forbidden}")
if "function metadataText" in studio:
    fail("dead metadataText helper remains in Packaging Studio")
if "return{templates,projects,printers" not in list_data:
    fail("Packaging-owned listData return shape is missing")
print("PASS: retired broad Catalog/Inventory SQL is physically absent from Packaging Studio source")

context_markers = [
    "LEFT JOIN products p ON p.product_id=pp.product_id",
    "FROM packaging_components pc LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=pc.site_item_inventory_id",
    "SELECT product_id,name,product_category,short_description,description,weight_grams FROM products WHERE product_id=?",
    "FROM product_resource_links prl",
    "LEFT JOIN site_item_inventory sii",
    "SELECT site_item_inventory_id,item_name FROM site_item_inventory WHERE site_item_inventory_id=?",
]
for marker in context_markers:
    if marker not in studio:
        fail(f"required scoped Packaging relationship read is missing: {marker}")
print("PASS: linked Packaging context joins and selected Product/Inventory reads remain")

base_studio = git_show(BASE, "functions/api/admin/packaging-studio.js")
current_post = between(studio, "export async function onRequestPost(context){")
base_post = between(base_studio, "export async function onRequestPost(context){")
if current_post != base_post:
    fail("mature Packaging onRequestPost business implementation changed from final Build 289")
current_detail = between(studio, "async function loadDetail(db,projectId){", "function snapshotFromBody(body,existing={}){")
base_detail = between(base_studio, "async function loadDetail(db,projectId){", "function snapshotFromBody(body,existing={}){")
if current_detail != base_detail:
    fail("Packaging loadDetail contextual read implementation changed from final Build 289")
print("PASS: mature Packaging POST logic and selected-detail context are unchanged from Build 289")

helper_exists = run(["git", "cat-file", "-e", f"{HISTORICAL_HEAD}:functions/api/_lib/packagingWriteBoundary.mjs"])
if helper_exists.returncode == 0:
    fail("obsolete Build 289 packagingWriteBoundary SQL-filter helper still exists at final Build 290")
print("PASS: obsolete Build 289 SQL-filter helper is removed")

gateway = git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-write.js")
required_gateway_markers = [
    "const BUILD = 290;",
    "onRequestPost as legacyPackagingPost",
    "legacyPackagingPost(context)",
    "legacy_broad_reads_removed: true",
    "legacy_broad_reads_removed_build: BUILD",
    "broad_catalog_queries_skipped: 0",
    "broad_inventory_queries_skipped: 0",
    "delete next.products",
    "delete next.inventory",
]
for marker in required_gateway_markers:
    if marker not in gateway:
        fail(f"Build 290 write gateway marker missing: {marker}")
for forbidden in ["createPackagingResponseFilteredDb", "packagingWriteBoundary", "delegatedContext", "scopedEnvironment"]:
    if forbidden in gateway:
        fail(f"obsolete Build 289 gateway filtering marker remains: {forbidden}")
print("PASS: Packaging write gateway delegates directly with owner-contract response shape")

base = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/index.mjs")
picker = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/artwork-picker.mjs")
retirement = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/read-retirement.mjs")
write_bridge = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/write-response.mjs")
runtime = git_show(HISTORICAL_HEAD, "public/js/modules/packaging/runtime.mjs")
if "apiBoundaryCleanupBridge: true" not in base or "build: 286" not in base:
    fail("Build 286 narrow-bootstrap bridge marker missing")
if "Use selected artwork" not in picker:
    fail("Build 287 artwork picker marker missing")
if "packaging_legacy_get_retired" not in retirement:
    fail("Build 288 GET retirement marker missing")
if "const BUILD = 289;" not in write_bridge or "const WRITE_GATEWAY_PATH = '/api/admin/packaging-write';" not in write_bridge:
    fail("Build 289 browser write bridge marker missing")
for marker in [
    "const BUILD = 290;",
    "const WRITE_RESPONSE_BUILD = 289;",
    "legacyBroadReadsRemoved: true",
    "legacyBroadReadRemovalBuild: BUILD",
    "writeGatewayBuild: BUILD",
    "behaviorMode: 'legacy-broad-read-source-removed-write-response-decoupled-runtime'",
]:
    if marker not in runtime:
        fail(f"Build 290 runtime composition marker missing: {marker}")
print("PASS: Build 286-289 runtime stack remains composed under Build 290")

admin = git_show(HISTORICAL_HEAD, "public/js/admin.js")
module_runtime = git_show(HISTORICAL_HEAD, "public/js/core/dd-admin-module-runtime.mjs")
definitions = git_show(HISTORICAL_HEAD, "public/js/core/dd-module-definitions.mjs")
if "dd-admin-module-runtime.mjs?v=290" not in admin:
    fail("Admin does not load Build 290 runtime")
if "build: 290" not in module_runtime:
    fail("Admin module runtime does not report Build 290")
if "entry: '../modules/packaging/runtime.mjs?v=290'" not in definitions:
    fail("Packaging definition does not load Build 290 runtime")
print("PASS: Build 290 routing/version markers")

result = run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 290 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 290 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 290 changed Cloudflare binding/config")
for forbidden in {
    "public/js/admin-packaging-studio.js",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/artwork-picker.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "functions/api/admin/packaging-bootstrap.js",
}:
    if forbidden in actual:
        fail(f"Build 290 modified protected compatibility file: {forbidden}")
print("PASS: no legacy Packaging UI, SQL/schema, Cloudflare binding/config, or Build 286-289 compatibility-layer change")

print("BUILD 290 PACKAGING LEGACY BROAD READ SOURCE REMOVAL: PASS")
print("No Cloudflare resource was contacted.")
