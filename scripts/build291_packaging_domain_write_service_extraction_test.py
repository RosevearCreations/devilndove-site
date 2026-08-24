#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "d207609967c9a182627561f2f8f9b7ae47b17b04"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD291_CHANGED_FILES.md",
    "BUILD291_VALIDATION.md",
    "docs/architecture/BUILD291_PACKAGING_DOMAIN_WRITE_SERVICE_EXTRACTION.md",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/packaging-write.js",
    "scripts/build290_packaging_legacy_broad_read_source_removal_test.py",
    "scripts/build291_packaging_domain_write_service_extraction_test.py",
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
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/packaging-write.js",
]:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 291 JavaScript syntax")

service = read("functions/api/_lib/packagingDomainService.js")
base_studio = git_show(BASE, "functions/api/admin/packaging-studio.js")
if service != base_studio:
    fail("shared Packaging domain service is not byte-for-byte final Build 290 mature source")
print("PASS: shared Packaging domain service is byte-for-byte final Build 290 mature source")

adapter = read("functions/api/admin/packaging-studio.js")
required_adapter = [
    "from '../_lib/packagingDomainService.js'",
    "onRequestGet as loadLegacyPackagingStudio",
    "onRequestPost as executePackagingWrite",
    "return loadLegacyPackagingStudio(context);",
    "return executePackagingWrite(context);",
]
for marker in required_adapter:
    if marker not in adapter:
        fail(f"legacy Packaging adapter marker missing: {marker}")
for forbidden in [
    "db.prepare(`",
    "packaging_projects",
    "site_item_inventory",
    "auditAdminAction",
    "captureRuntimeIncident",
    "function snapshotFromBody",
    "function listData",
]:
    if forbidden in adapter:
        fail(f"legacy Packaging route still contains mature business implementation: {forbidden}")
print("PASS: legacy Packaging Studio route is a thin compatibility adapter")

gateway = read("functions/api/admin/packaging-write.js")
required_gateway = [
    "const BUILD = 291;",
    "const BROAD_READ_REMOVAL_BUILD = 290;",
    "from '../_lib/packagingDomainService.js'",
    "onRequestPost as executePackagingWrite",
    "executePackagingWrite(context)",
    "write_service_build: BUILD",
    "write_authority: 'packaging-domain-service'",
    "shared_write_service: true",
    "legacy_post_route_is_adapter: true",
    "legacy_broad_reads_removed_build: BROAD_READ_REMOVAL_BUILD",
    "broad_catalog_queries_skipped: 0",
    "broad_inventory_queries_skipped: 0",
    "legacy_post_business_logic_preserved: true",
]
for marker in required_gateway:
    if marker not in gateway:
        fail(f"Build 291 gateway marker missing: {marker}")
for forbidden in [
    "from './packaging-studio.js'",
    "legacyPackagingPost",
    "createPackagingResponseFilteredDb",
    "packagingWriteBoundary",
]:
    if forbidden in gateway:
        fail(f"active write gateway still depends on legacy route/filtering: {forbidden}")
print("PASS: active Packaging write gateway imports the shared service directly")

for forbidden in [
    "ORDER BY LOWER(name),product_id DESC LIMIT 500",
    "ORDER BY LOWER(sii.item_name) LIMIT 1000",
    "ORDER BY LOWER(item_name) LIMIT 1000",
    "mapPackagingInventory",
    "function metadataText",
    "return{templates,projects,products,inventory",
]:
    if forbidden in service:
        fail(f"Build 290 retired broad-read marker reappeared in shared service: {forbidden}")
for required in [
    "LEFT JOIN products p ON p.product_id=pp.product_id",
    "FROM packaging_components pc LEFT JOIN site_item_inventory sii",
    "SELECT product_id,name,product_category,short_description,description,weight_grams FROM products WHERE product_id=?",
    "SELECT site_item_inventory_id,item_name FROM site_item_inventory WHERE site_item_inventory_id=?",
]:
    if required not in service:
        fail(f"required scoped Packaging relationship read missing from shared service: {required}")
print("PASS: Build 290 broad-read removal remains intact in the shared service")

protected_client = [
    "public/js/admin-packaging-studio.js",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/artwork-picker.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "functions/api/admin/packaging-bootstrap.js",
]
for path in protected_client:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"Build 291 unexpectedly changed protected compatibility file: {path}")
print("PASS: Build 290 browser/runtime compatibility stack is unchanged")

build290 = read("scripts/build290_packaging_legacy_broad_read_source_removal_test.py")
if 'HISTORICAL_HEAD = "d207609967c9a182627561f2f8f9b7ae47b17b04"' not in build290:
    fail("Build 290 historical regression head is not pinned")
if 'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])' not in build290:
    fail("Build 290 historical changed-file boundary still follows future HEAD")
print("PASS: Build 290 historical regression boundary is pinned")

result = run(["git", "diff", "--name-only", BASE, "HEAD"])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 291 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 291 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 291 changed Cloudflare binding/config")
for forbidden in protected_client:
    if forbidden in actual:
        fail(f"Build 291 modified protected compatibility file: {forbidden}")
print("PASS: no SQL/schema, Cloudflare binding/config, legacy UI, bootstrap, or client-runtime change")

print("BUILD 291 PACKAGING DOMAIN WRITE SERVICE EXTRACTION: PASS")
print("No Cloudflare resource was contacted.")
