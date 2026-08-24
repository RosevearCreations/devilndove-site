#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "6cbcc4353327eea093ef4701497fa5321b680096"
HISTORICAL_HEAD = "b142b3a6267df57ac43b8189982bd6abe82605ac"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD304_CHANGED_FILES.md",
    "BUILD304_VALIDATION.md",
    "admin/products/index.html",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build303_commerce_operations_umbrella_bridge_test.py",
    "scripts/build304_commerce_operations_catalog_runtime_test.py",
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


def git_show(ref, path):
    result = run(["git", "show", f"{ref}:{path}"])
    if result.returncode:
        fail(f"could not read {path} at {ref}: {result.stderr.strip()}")
    return result.stdout


def changed_files(base, head):
    result = run(["git", "diff", "--name-only", base, head])
    if result.returncode:
        fail(result.stderr.strip() or f"could not compare {base}..{head}")
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


def node_check_source(source, filename):
    path = ROOT / filename
    try:
        path.write_text(source, encoding="utf-8")
        result = run(["node", "--check", filename])
        if result.returncode:
            fail(result.stderr.strip() or f"historical JavaScript syntax failed: {filename}")
    finally:
        path.unlink(missing_ok=True)


admin = git_show(HISTORICAL_HEAD, "public/js/admin.js")
core = git_show(HISTORICAL_HEAD, "public/js/core/dd-admin-module-runtime.mjs")
catalog = git_show(HISTORICAL_HEAD, "public/js/core/dd-application-module-groups.mjs")
runtime = git_show(HISTORICAL_HEAD, "public/js/modules/commerce-operations/runtime.mjs")
for source, filename in [
    (admin, ".build304-historical-admin.js"),
    (core, ".build304-historical-core.mjs"),
    (catalog, ".build304-historical-catalog.mjs"),
    (runtime, ".build304-historical-commerce.mjs"),
]:
    node_check_source(source, filename)
print("PASS: completed Build 304 shared Core/catalog/application-runtime syntax is historically pinned")

for marker in [
    "dd-admin-module-runtime.mjs?v=304",
    "Build 304: Core activates the Commerce & Operations umbrella runtime for Catalog routes only.",
]:
    if marker not in admin:
        fail(f"historical Build 304 shared loader marker missing: {marker}")
print("PASS: completed Build 304 shared Admin loader is historically pinned")

for marker in [
    "export const BUILD = 302;",
    "export const RUNTIME_CATALOG_BUILD = 304;",
    "entry: '../modules/commerce-operations/runtime.mjs?v=304'",
    "runtimeDomains: Object.freeze(['catalog'])",
    "firstUmbrellaRuntimeDomain: 'catalog'",
]:
    if marker not in catalog:
        fail(f"historical Build 304 runtime catalog marker missing: {marker}")
print("PASS: completed Build 304 Catalog-only umbrella runtime catalog is historically pinned")

for marker in [
    "const BUILD = 304;",
    "const SUPPORTED_DOMAINS = Object.freeze(['catalog']);",
    "const REQUIRED_SERVICES = Object.freeze(['catalog-read']);",
    "behaviorMode: 'catalog-first-umbrella-runtime-boundary'",
    "catalogRuntimeBoundaryActive",
    "createsNetworkTransport: false",
]:
    if marker not in runtime:
        fail(f"historical Build 304 Commerce runtime marker missing: {marker}")
print("PASS: completed Build 304 Catalog runtime boundary is historically pinned")

for marker in [
    "// Devil n Dove Build 304 Admin module runtime bridge.",
    "build: 304",
    "applicationRuntimeCatalogBuild: APPLICATION_RUNTIME_CATALOG_BUILD",
    "getActiveApplicationModuleId: () => activeApplicationModuleId",
    "getCurrentApplicationModuleRuntimeStatus",
    "reconcileVerifiedAuthState",
]:
    if marker not in core:
        fail(f"historical Build 304 Core marker missing: {marker}")
print("PASS: completed Build 304 generic application-runtime lifecycle is historically pinned")

validation = git_show(HISTORICAL_HEAD, "BUILD304_VALIDATION.md")
for marker in [
    "Status — COMPLETE IN DEVELOPMENT",
    "af0993ef9b4da807d9d1f32c63988dc28b07f1f8",
    "active_application_runtime           commerce-operations",
    "application_runtime_domain           catalog",
    "packaging_compatibility_state    active",
    "native_read_status               200",
    "6effd1eb-9a1f-4538-b7d3-3cdc18b54328",
]:
    if marker not in validation:
        fail(f"completed Build 304 validation marker missing: {marker}")
print("PASS: completed Build 304 Development/browser/direct-upload proof is historically pinned")

products = git_show(HISTORICAL_HEAD, "admin/products/index.html")
packaging = git_show(HISTORICAL_HEAD, "admin/packaging-studio/index.html")
if '/public/js/admin.js?v=304' not in products:
    fail("historical Build 304 Products loader pin missing")
if '/public/js/admin.js?v=304' not in packaging:
    fail("historical Build 304 Packaging loader pin missing")
print("PASS: completed Build 304 validation-page loader pins are historically pinned")

build303_test = git_show(HISTORICAL_HEAD, "scripts/build303_commerce_operations_umbrella_bridge_test.py")
for marker in [
    'HISTORICAL_HEAD = "6cbcc4353327eea093ef4701497fa5321b680096"',
    'BUILD 303 COMMERCE & OPERATIONS UMBRELLA BRIDGE HISTORICAL REGRESSION: PASS',
]:
    if marker not in build303_test:
        fail(f"completed Build 303 historical pin missing at Build 304 head: {marker}")
print("PASS: Build 304 preserves the completed Build 303 historical pin")

actual = changed_files(BASE, HISTORICAL_HEAD)
if actual != EXPECTED:
    fail(f"completed Build 304 boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact completed Build 304 Catalog-runtime boundary is historically pinned")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"forbidden schema/config change in completed Build 304 boundary: {path}")
print("PASS: completed Build 304 had no SQL/schema, binding/config, R2, or real Production change")

print(f"BUILD 304 COMMERCE & OPERATIONS CATALOG RUNTIME HISTORICAL REGRESSION: PASS ({HISTORICAL_HEAD[:8]})")
print("No Cloudflare resource was contacted.")
