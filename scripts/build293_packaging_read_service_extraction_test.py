#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "40a458354a8c0785386456dc4646cb44b48ca124"
HISTORICAL_HEAD = "4d605e87a7cfdcf7378c236fa3f609bccb9ddd1a"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD293_CHANGED_FILES.md",
    "BUILD293_VALIDATION.md",
    "docs/architecture/BUILD293_PACKAGING_READ_SERVICE_EXTRACTION.md",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-studio.js",
    "scripts/build292_packaging_legacy_post_retirement_test.py",
    "scripts/build293_packaging_read_service_extraction_test.py",
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
    "functions/api/_lib/packagingReadService.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/admin/packaging-studio.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-write.js",
]:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 293 JavaScript syntax")

read_service = git_show(HISTORICAL_HEAD, "functions/api/_lib/packagingReadService.js")
base_bootstrap = git_show(BASE, "functions/api/admin/packaging-bootstrap.js")
if read_service != base_bootstrap:
    fail("shared Packaging read service is not byte-for-byte final Build 292 bootstrap source")
print("PASS: shared Packaging read service is byte-for-byte final Build 292 bootstrap source")

for marker in [
    "// Build 286 - narrow Packaging-owned GET bootstrap",
    "const BUILD = 286;",
    "async function listPackagingData(db)",
    "async function loadDetail(db, projectId)",
    "mode: 'packaging_owned_bootstrap_contract_boundary'",
    "bulk_catalog_rows: 0",
    "bulk_inventory_rows: 0",
    "legacy_broad_get_bypassed: true",
]:
    if marker not in read_service:
        fail(f"preserved Build 286 read implementation marker missing: {marker}")
print("PASS: Build 286 Packaging read implementation provenance is preserved")

bootstrap = git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-bootstrap.js")
for marker in [
    "const BUILD = 293;",
    "const READ_IMPLEMENTATION_BUILD = 286;",
    "from '../_lib/packagingReadService.js'",
    "onRequestGet as executePackagingRead",
    "executePackagingRead(context)",
    "read_service_build: BUILD",
    "read_implementation_build: READ_IMPLEMENTATION_BUILD",
    "read_authority: 'packaging-read-service'",
    "shared_read_service: true",
    "module_boundary:",
]:
    if marker not in bootstrap:
        fail(f"Build 293 bootstrap adapter marker missing: {marker}")
for forbidden in ["db.prepare(`", "function listPackagingData", "function loadDetail", "getAdminUserFromRequest"]:
    if forbidden in bootstrap:
        fail(f"bootstrap adapter still owns read implementation: {forbidden}")
print("PASS: Packaging bootstrap is a thin Build 293 shared-read adapter")

legacy = git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-studio.js")
for marker in [
    "const BUILD = 293;",
    "const LEGACY_SURFACE_BUILD = '277';",
    "const READ_IMPLEMENTATION_BUILD = 286;",
    "from '../_lib/packagingReadService.js'",
    "onRequestGet as executePackagingRead",
    "next.build = LEGACY_SURFACE_BUILD",
    "material_library_all_packaging_structured_content_truth_reference_review_first",
    "read_boundary =",
    "read_authority: 'packaging-read-service'",
    "legacy_get_compatibility: true",
    "packaging_legacy_post_retired",
    "build: 292",
    "legacy_post_retired: true",
    "}, 410);",
]:
    if marker not in legacy:
        fail(f"legacy Packaging adapter marker missing: {marker}")
for forbidden in [
    "from '../_lib/packagingDomainService.js'",
    "onRequestPost as executePackagingWrite",
    "return executePackagingWrite(context)",
    "db.prepare(`",
    "function listData",
    "function loadDetail",
]:
    if forbidden in legacy:
        fail(f"legacy route retained direct read/write implementation authority: {forbidden}")
print("PASS: legacy Packaging GET uses shared read service and Build 292 POST retirement remains intact")

for forbidden in [
    "ORDER BY LOWER(name),product_id DESC LIMIT 500",
    "ORDER BY LOWER(sii.item_name) LIMIT 1000",
    "ORDER BY LOWER(item_name) LIMIT 1000",
    "mapPackagingInventory",
    "function metadataText",
    "products,inventory",
]:
    if forbidden in read_service:
        fail(f"retired broad Catalog/Inventory read marker appears in read service: {forbidden}")
for required in [
    "LEFT JOIN products p ON p.product_id=pp.product_id",
    "FROM packaging_components pc LEFT JOIN site_item_inventory sii",
    "bulk_catalog_rows: 0",
    "bulk_inventory_rows: 0",
]:
    if required not in read_service:
        fail(f"required scoped Packaging read marker missing: {required}")
print("PASS: Build 290 broad-read retirement remains intact in the shared read service")

protected = [
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-write.js",
    "public/js/admin-packaging-studio.js",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/artwork-picker.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "public/js/modules/packaging/runtime.mjs",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, HISTORICAL_HEAD, "--", path])
    if result.returncode != 0:
        fail(f"Build 293 unexpectedly changed protected write/client file: {path}")
print("PASS: Build 291 write service, Build 292 gateway and proven browser/runtime stack are unchanged")

build292 = read("scripts/build292_packaging_legacy_post_retirement_test.py")
if 'HISTORICAL_HEAD = "40a458354a8c0785386456dc4646cb44b48ca124"' not in build292:
    fail("Build 292 historical regression head is not pinned")
if 'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])' not in build292:
    fail("Build 292 historical changed-file boundary still follows future HEAD")
if 'git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-studio.js")' not in build292:
    fail("Build 292 regression still reads future legacy-route source")
if 'git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-write.js")' not in build292:
    fail("Build 292 regression still reads future native-gateway source")
print("PASS: Build 292 historical regression boundary is pinned")

result = run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 293 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 293 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 293 changed Cloudflare binding/config")
for path in protected:
    if path in actual:
        fail(f"Build 293 modified protected write/client file: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, write-service, native-gateway, legacy UI, or client-runtime change")

print("BUILD 293 PACKAGING READ SERVICE EXTRACTION: PASS")
print("No Cloudflare resource was contacted.")
