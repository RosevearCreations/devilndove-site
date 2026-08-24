#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "b142b3a6267df57ac43b8189982bd6abe82605ac"
HISTORICAL_HEAD = "eba6d248a6c3a8725076c3f31b1edbfb0fa5f74e"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD305_CHANGED_FILES.md",
    "BUILD305_VALIDATION.md",
    "admin/inventory-operations/index.html",
    "admin/packaging-studio/index.html",
    "docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build304_commerce_operations_catalog_runtime_test.py",
    "scripts/build305_commerce_operations_inventory_runtime_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True, encoding="utf-8", errors="replace")


def git_show(path):
    result = run(["git", "show", f"{HISTORICAL_HEAD}:{path}"])
    if result.returncode:
        fail(result.stderr.strip() or f"could not read historical {path}")
    return result.stdout


def changed_files(base, head):
    result = run(["git", "diff", "--name-only", base, head])
    if result.returncode:
        fail(result.stderr.strip() or "historical diff failed")
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


for path in [
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
]:
    source = git_show(path)
    temp = ROOT / ".build305-historical-check.mjs"
    temp.write_text(source, encoding="utf-8")
    syntax = run(["node", "--check", str(temp)])
    temp.unlink(missing_ok=True)
    if syntax.returncode:
        fail(syntax.stderr.strip() or f"historical syntax failed: {path}")
print("PASS: completed Build 305 shared runtime syntax is historically pinned")

admin = git_show("public/js/admin.js")
if "dd-admin-module-runtime.mjs?v=305" not in admin:
    fail("completed Build 305 shared loader is not historically pinned")
print("PASS: completed Build 305 shared loader is historically pinned")

catalog = git_show("public/js/core/dd-application-module-groups.mjs")
for marker in [
    "export const RUNTIME_CATALOG_BUILD = 304;",
    "export const RUNTIME_INVENTORY_BUILD = 305;",
    "runtimeDomains: Object.freeze(['catalog', 'inventory'])",
    "entry: '../modules/commerce-operations/runtime.mjs?v=305'",
]:
    if marker not in catalog:
        fail(f"completed Build 305 runtime catalog marker missing: {marker}")
print("PASS: completed Build 305 Catalog + Inventory runtime catalog is historically pinned")

runtime = git_show("public/js/modules/commerce-operations/runtime.mjs")
for marker in [
    "const BUILD = 305;",
    "const SUPPORTED_DOMAINS = Object.freeze(['catalog', 'inventory']);",
    "inventory: Object.freeze(['inventory-read'])",
    "ownsInventoryMutations: false",
    "inventoryRuntimeBoundaryActive",
]:
    if marker not in runtime:
        fail(f"completed Build 305 Commerce runtime marker missing: {marker}")
print("PASS: completed Build 305 Inventory read-only umbrella boundary is historically pinned")

validation = git_show("BUILD305_VALIDATION.md")
for marker in [
    "## Status — COMPLETE IN DEVELOPMENT",
    "f999a5fd61a233254e062540b80aff4fa57956d7",
    "pathname                    /admin/inventory-operations/",
    "domain                      inventory",
    "required_services           inventory-read",
    "owns_inventory_mutations    false",
]:
    if marker not in validation:
        fail(f"completed Build 305 validation marker missing: {marker}")
print("PASS: completed Build 305 Development browser proof is historically pinned")

actual = changed_files(BASE, HISTORICAL_HEAD)
if actual != EXPECTED:
    fail(f"completed Build 305 boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact completed Build 305 Inventory-runtime boundary is historically pinned")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"completed Build 305 unexpectedly changed schema/config: {path}")
print("PASS: completed Build 305 had no SQL/schema, binding/config, R2, or real Production change")

print(f"BUILD 305 COMMERCE & OPERATIONS INVENTORY RUNTIME HISTORICAL REGRESSION: PASS ({HISTORICAL_HEAD[:8]})")
print("No Cloudflare resource was contacted.")
