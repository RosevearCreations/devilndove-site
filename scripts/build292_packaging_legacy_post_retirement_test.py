#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "f144edffe54c9ec46160ab95b129c4c71267baeb"
HISTORICAL_HEAD = "40a458354a8c0785386456dc4646cb44b48ca124"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD292_CHANGED_FILES.md",
    "BUILD292_VALIDATION.md",
    "docs/architecture/BUILD292_PACKAGING_LEGACY_POST_RETIREMENT.md",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/packaging-write.js",
    "scripts/build291_packaging_domain_write_service_extraction_test.py",
    "scripts/build292_packaging_legacy_post_retirement_test.py",
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
print("PASS: Build 292 JavaScript syntax")

service = git_show(HISTORICAL_HEAD, "functions/api/_lib/packagingDomainService.js")
base_service = git_show(BASE, "functions/api/_lib/packagingDomainService.js")
if service != base_service:
    fail("Build 291 shared Packaging domain service changed during Build 292")
print("PASS: Build 291 shared Packaging domain service is unchanged")

adapter = git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-studio.js")
for marker in [
    "const BUILD = 292;",
    "onRequestGet as loadLegacyPackagingStudio",
    "return loadLegacyPackagingStudio(context);",
    "getAdminUserFromRequest",
    "if (!adminUser)",
    "packaging_legacy_post_retired",
    "legacy_post_retired: true",
    "replacement_path: REPLACEMENT_WRITE_PATH",
    "}, 410);",
]:
    if marker not in adapter:
        fail(f"legacy POST retirement marker missing: {marker}")
for forbidden in [
    "onRequestPost as executePackagingWrite",
    "return executePackagingWrite(context)",
    "db.prepare(`",
    "packaging_projects",
    "function snapshotFromBody",
]:
    if forbidden in adapter:
        fail(f"retired legacy route still owns/delegates write behavior: {forbidden}")
print("PASS: legacy Packaging POST authority is retired with authenticated 410 semantics")
print("PASS: legacy Packaging GET compatibility delegation remains")

gateway = git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-write.js")
for marker in [
    "const BUILD = 292;",
    "const WRITE_SERVICE_BUILD = 291;",
    "const BROAD_READ_REMOVAL_BUILD = 290;",
    "const LEGACY_POST_RETIREMENT_BUILD = 292;",
    "from '../_lib/packagingDomainService.js'",
    "onRequestPost as executePackagingWrite",
    "executePackagingWrite(context)",
    "write_service_build: WRITE_SERVICE_BUILD",
    "write_authority: 'packaging-domain-service'",
    "shared_write_service: true",
    "legacy_post_route_is_adapter: false",
    "legacy_post_route_retired: true",
    "legacy_post_retirement_build: LEGACY_POST_RETIREMENT_BUILD",
    "legacy_post_error_code: 'packaging_legacy_post_retired'",
    "legacy_broad_reads_removed_build: BROAD_READ_REMOVAL_BUILD",
    "broad_catalog_queries_skipped: 0",
    "broad_inventory_queries_skipped: 0",
]:
    if marker not in gateway:
        fail(f"Build 292 native gateway marker missing: {marker}")
for forbidden in ["from './packaging-studio.js'", "legacyPackagingPost"]:
    if forbidden in gateway:
        fail(f"native gateway regained legacy route dependency: {forbidden}")
print("PASS: native Packaging gateway remains direct and reports Build 292 retirement provenance")

for forbidden in [
    "ORDER BY LOWER(name),product_id DESC LIMIT 500",
    "ORDER BY LOWER(sii.item_name) LIMIT 1000",
    "ORDER BY LOWER(item_name) LIMIT 1000",
    "mapPackagingInventory",
    "function metadataText",
    "return{templates,projects,products,inventory",
]:
    if forbidden in service:
        fail(f"retired broad-read marker reappeared in shared service: {forbidden}")
print("PASS: Build 290 broad-read source removal remains intact")

protected = [
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-bootstrap.js",
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
        fail(f"Build 292 unexpectedly changed protected file: {path}")
print("PASS: shared service, bootstrap, legacy UI and Build 290 browser/runtime stack are unchanged")

build291 = read("scripts/build291_packaging_domain_write_service_extraction_test.py")
if 'HISTORICAL_HEAD = "f144edffe54c9ec46160ab95b129c4c71267baeb"' not in build291:
    fail("Build 291 historical regression head is not pinned")
if 'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])' not in build291:
    fail("Build 291 historical changed-file boundary still follows future HEAD")
if 'git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-studio.js")' not in build291:
    fail("Build 291 regression still reads future legacy adapter source")
print("PASS: Build 291 historical regression boundary is pinned")

result = run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 292 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 292 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 292 changed Cloudflare binding/config")
for path in protected:
    if path in actual:
        fail(f"Build 292 modified protected file: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, shared-service, bootstrap, legacy UI, or client-runtime change")

print("BUILD 292 PACKAGING LEGACY POST RETIREMENT: PASS")
print("No Cloudflare resource was contacted.")
