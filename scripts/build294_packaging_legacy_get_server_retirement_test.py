#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "4d605e87a7cfdcf7378c236fa3f609bccb9ddd1a"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD294_CHANGED_FILES.md",
    "BUILD294_VALIDATION.md",
    "docs/architecture/BUILD294_PACKAGING_LEGACY_GET_SERVER_RETIREMENT.md",
    "functions/api/admin/packaging-studio.js",
    "scripts/build293_packaging_read_service_extraction_test.py",
    "scripts/build294_packaging_legacy_get_server_retirement_test.py",
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
    "functions/api/admin/packaging-studio.js",
    "functions/api/_lib/packagingReadService.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-write.js",
]:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 294 JavaScript syntax")

legacy = read("functions/api/admin/packaging-studio.js")
for marker in [
    "const BUILD = 294;",
    "const LEGACY_POST_RETIREMENT_BUILD = 292;",
    "const REPLACEMENT_READ_PATH = '/api/admin/packaging-bootstrap';",
    "const REPLACEMENT_WRITE_PATH = '/api/admin/packaging-write';",
    "getAdminUserFromRequest",
    "export async function onRequestGet(context)",
    "packaging_legacy_get_retired",
    "legacy_get_retired: true",
    "replacement_path: REPLACEMENT_READ_PATH",
    "export async function onRequestPost(context)",
    "packaging_legacy_post_retired",
    "build: LEGACY_POST_RETIREMENT_BUILD",
    "legacy_post_retired: true",
    "replacement_path: REPLACEMENT_WRITE_PATH",
]:
    if marker not in legacy:
        fail(f"Build 294 legacy retirement marker missing: {marker}")
for forbidden in [
    "packagingReadService.js",
    "executePackagingRead",
    "rewrittenJsonResponse",
    "readPayload",
    "read_boundary",
    "legacy_get_compatibility",
    "packagingDomainService.js",
    "executePackagingWrite",
    "db.prepare(`",
]:
    if forbidden in legacy:
        fail(f"legacy route still owns/delegates active Packaging behavior: {forbidden}")
get_start = legacy.index("export async function onRequestGet(context)")
post_start = legacy.index("export async function onRequestPost(context)")
get_body = legacy[get_start:post_start]
if get_body.index("getAdminUserFromRequest") > get_body.index("packaging_legacy_get_retired"):
    fail("legacy GET retirement is returned before administrator authentication")
if "}, 410);" not in get_body:
    fail("legacy GET retirement does not return HTTP 410")
post_body = legacy[post_start:]
if post_body.index("getAdminUserFromRequest") > post_body.index("packaging_legacy_post_retired"):
    fail("legacy POST retirement is returned before administrator authentication")
if "}, 410);" not in post_body:
    fail("legacy POST retirement does not return HTTP 410")
print("PASS: legacy Packaging GET authority is retired with authenticated 410 semantics")
print("PASS: Build 292 legacy Packaging POST retirement remains intact")

for path in [
    "functions/api/_lib/packagingReadService.js",
    "functions/api/admin/packaging-bootstrap.js",
]:
    if read(path) != git_show(BASE, path):
        fail(f"Build 293 active read boundary changed during Build 294: {path}")
print("PASS: Build 293 Packaging read service and bootstrap are unchanged")

bootstrap = read("functions/api/admin/packaging-bootstrap.js")
for marker in [
    "const BUILD = 293;",
    "const READ_IMPLEMENTATION_BUILD = 286;",
    "from '../_lib/packagingReadService.js'",
    "read_service_build: BUILD",
    "read_authority: 'packaging-read-service'",
    "shared_read_service: true",
]:
    if marker not in bootstrap:
        fail(f"active Packaging bootstrap provenance missing: {marker}")
read_service = read("functions/api/_lib/packagingReadService.js")
for marker in ["const BUILD = 286;", "bulk_catalog_rows: 0", "bulk_inventory_rows: 0"]:
    if marker not in read_service:
        fail(f"proven Packaging read implementation marker missing: {marker}")
print("PASS: active Packaging read authority remains Build 293 over proven Build 286 implementation")

for path in [
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-write.js",
]:
    if read(path) != git_show(BASE, path):
        fail(f"Packaging write boundary changed during Build 294: {path}")
print("PASS: Build 291 write service and Build 292 native gateway are unchanged")

gateway = read("functions/api/admin/packaging-write.js")
for marker in [
    "const BUILD = 292;",
    "const WRITE_SERVICE_BUILD = 291;",
    "write_authority: 'packaging-domain-service'",
    "legacy_post_route_retired: true",
]:
    if marker not in gateway:
        fail(f"active Packaging write provenance missing: {marker}")
print("PASS: active Packaging write provenance remains Build 292 gateway / Build 291 service")

protected = [
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
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"Build 294 unexpectedly changed proven browser/runtime file: {path}")
print("PASS: proven Build 290 Packaging browser/runtime stack is unchanged")

build293 = read("scripts/build293_packaging_read_service_extraction_test.py")
if 'HISTORICAL_HEAD = "4d605e87a7cfdcf7378c236fa3f609bccb9ddd1a"' not in build293:
    fail("Build 293 historical regression head is not pinned")
if 'git_show(HISTORICAL_HEAD, "functions/api/_lib/packagingReadService.js")' not in build293:
    fail("Build 293 regression still reads future shared read-service source")
if 'git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-bootstrap.js")' not in build293:
    fail("Build 293 regression still reads future bootstrap source")
if 'git_show(HISTORICAL_HEAD, "functions/api/admin/packaging-studio.js")' not in build293:
    fail("Build 293 regression still reads future legacy-route source")
if 'run(["git", "diff", "--name-only", BASE, HISTORICAL_HEAD])' not in build293:
    fail("Build 293 historical changed-file boundary still follows future HEAD")
print("PASS: Build 293 historical regression boundary is pinned")

result = run(["git", "diff", "--name-only", BASE, "HEAD"])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 294 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 294 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 294 changed Cloudflare binding/config")
for path in [
    "functions/api/_lib/packagingReadService.js",
    "functions/api/admin/packaging-bootstrap.js",
    "functions/api/_lib/packagingDomainService.js",
    "functions/api/admin/packaging-write.js",
    *protected,
]:
    if path in actual:
        fail(f"Build 294 modified protected active boundary: {path}")
print("PASS: no SQL/schema, Cloudflare binding/config, active read/write service, legacy UI, or client-runtime change")

print("BUILD 294 PACKAGING LEGACY GET SERVER RETIREMENT: PASS")
print("No Cloudflare resource was contacted.")
