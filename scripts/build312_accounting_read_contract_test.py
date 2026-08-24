#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASE = "78546a6b9304ce38d0a42b130445a7504a15823f"

EXPECTED_CHANGED = {
    "AI_CONTEXT.md",
    "BUILD312_CHANGED_FILES.md",
    "BUILD312_VALIDATION.md",
    "admin/inventory-operations/index.html",
    "docs/architecture/BUILD312_ACCOUNTING_READ_CONTRACT.md",
    "functions/api/admin/contracts/accounting-read.js",
    "public/js/admin.js",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build312_accounting_read_contract_test.py",
}

failures = []


def check(ok, message):
    if ok:
        print(f"PASS: {message}")
    else:
        failures.append(message)
        print(f"FAIL: {message}")


def text(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def git_path_matches_base(rel):
    result = subprocess.run(
        ["git", "diff", "--quiet", BASE, "--", rel],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    return result.returncode == 0


def node_check(rel):
    source = text(rel)
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".mjs", dir=ROOT, delete=False) as handle:
            handle.write(source)
            temp_path = Path(handle.name)
        result = subprocess.run(
            ["node", "--check", str(temp_path)],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        return result.returncode == 0, (result.stderr or result.stdout).strip()
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()


route = text("functions/api/admin/contracts/accounting-read.js")
contracts = text("public/js/core/dd-module-contracts.mjs")
adapters = text("public/js/core/dd-module-service-adapters.mjs")
groups = text("public/js/core/dd-application-module-groups.mjs")
runtime = text("public/js/modules/commerce-operations/runtime.mjs")
admin = text("public/js/admin.js")
inventory_page = text("admin/inventory-operations/index.html")
validation = text("BUILD312_VALIDATION.md")
architecture = text("docs/architecture/BUILD312_ACCOUNTING_READ_CONTRACT.md")

for rel in [
    "functions/api/admin/contracts/accounting-read.js",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "public/js/admin.js",
]:
    ok, detail = node_check(rel)
    check(ok, f"Build 312 JavaScript syntax: {rel}" + (f" ({detail})" if detail and not ok else ""))

check("export const BUILD = 312" in route and "export const CONTRACT_ID = 'accounting-read'" in route,
      "Accounting owns a dedicated Build 312 accounting-read route")
check("export const OWNER = 'accounting'" in route and "AUTHORITY_TABLE = 'accounting_order_records'" in route,
      "accounting_order_records is the explicit bounded Accounting authority")
check("read-only-order-financial-state" in route and "request_time_schema_mutation: false" in route,
      "Accounting contract declares read-only behavior and no request-time schema mutation")
check("schema_ready: false" in route and "missing_tables" in route and "missing_columns" in route,
      "Accounting contract reports schema parity gaps instead of repairing them")
check("total_booked_cents" in route and "total_paid_cents" in route and "total_outstanding_cents" in route and "total_tax_cents" in route,
      "Accounting contract exposes bounded operational financial totals")
check("customer_name" not in route and "customer_email" not in route,
      "Accounting contract excludes unnecessary customer PII from the Operations boundary")

for forbidden in [
    "ensureAccountingSchema",
    "syncAccountingForOrder",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "INSERT INTO",
    "UPDATE accounting_order_records",
    "DELETE FROM",
]:
    check(forbidden not in route, f"accounting-read route contains no schema/mutation authority: {forbidden}")

check("contract('accounting-read', 'accounting', ['operations']" in contracts,
      "contract catalog preserves Accounting ownership with Operations as the bounded consumer")
check("route: '/api/admin/contracts/accounting-read'" in contracts and "implemented-read-only-order-financial-state" in contracts,
      "accounting-read is implemented as a dedicated read-only contract")

check("'accounting-read': '/api/admin/contracts/accounting-read'" in adapters,
      "browser service registry contains the Accounting read route")
check("'accounting-read': service('accounting-read', 'accounting'" in adapters,
      "Accounting read service registration is passive and Accounting-owned")
check("schemaReady: Boolean(data.schema_ready)" in adapters and "requestTimeSchemaMutation" in adapters,
      "Accounting browser service preserves schema-readiness diagnostics")

check("export const BUILD = 302;" in groups and "export const ACCOUNTING_READ_CONTRACT_BUILD = 312;" in groups,
      "architecture remains Build 302 while exposing Build 312 Accounting-read identity")
check("runtimeDomains: Object.freeze(['catalog', 'inventory'])" in groups and "operationsRuntimeDomainActive: false" in groups,
      "Operations remains outside the active Commerce runtime")
check("../modules/commerce-operations/runtime.mjs?v=312" in groups,
      "Commerce runtime entry is explicitly cache-busted to Build 312")

check("const BUILD = 312;" in runtime,
      "Commerce runtime exposes Build 312 prerequisite state")
check("operations: Object.freeze(['catalog-read', 'inventory-read', 'accounting-read'])" in runtime,
      "future Operations runtime prerequisites include all three read contracts")
check("const SUPPORTED_DOMAINS = Object.freeze(['catalog', 'inventory'])" in runtime,
      "Operations remains deliberately unsupported for activation in Build 312")
check("operationsRuntimeActive: false" in runtime and "operationsReadPrerequisitesRegistered: true" in runtime,
      "Commerce records Operations read readiness without activating Operations")
check("ownsInventoryMutations: false" in runtime,
      "Commerce remains non-mutating")

check("dd-admin-module-runtime.mjs?v=312" in admin,
      "shared Admin loader requests the Build 312 runtime graph")
check("/public/js/admin.js?v=312" in inventory_page,
      "Inventory validation page pins the Build 312 shared loader")

for rel in [
    "functions/api/admin/accounting-summary.js",
    "functions/api/_lib/accounting.js",
    "admin/operations/index.html",
    "functions/api/_lib/inventoryPostService.js",
    "functions/api/admin/contracts/inventory-post.js",
    "functions/api/_lib/inventoryReversalService.js",
    "functions/api/admin/contracts/inventory-reverse.js",
    "functions/api/_lib/creativeInventoryPostConsumer.js",
    "functions/api/_lib/creativeInventoryReversalConsumer.js",
]:
    try:
        check(git_path_matches_base(rel), f"completed/legacy authority remains historically pinned: {rel}")
    except Exception as exc:
        check(False, f"could not verify historical pin for {rel}: {exc}")

check("does **not** activate Operations" in architecture or "does not activate Operations" in architecture,
      "Build 312 architecture keeps Operations activation out of scope")
check("schema_ready" in validation and "schema-parity blocker" in validation,
      "Build 312 validation distinguishes read-contract proof from schema parity")

try:
    changed = {line for line in git("diff", "--name-only", f"{BASE}..HEAD").splitlines() if line}
    check(changed == EXPECTED_CHANGED,
          "exact Build 312 Accounting read-contract changed-file boundary")
except Exception as exc:
    check(False, f"could not evaluate Build 312 changed-file boundary: {exc}")

try:
    changed = {line for line in git("diff", "--name-only", f"{BASE}..HEAD").splitlines() if line}
    forbidden = [
        p for p in changed
        if p.endswith(".sql")
        or p in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"}
        or p.startswith("functions/api/admin/orders")
        or p.startswith("functions/api/admin/operations")
        or p.startswith("functions/api/admin/accounting-") and p != "functions/api/admin/contracts/accounting-read.js"
    ]
    check(not forbidden,
          "Build 312 adds no SQL/schema, Cloudflare config, Operations implementation, broad Accounting implementation, or real Production change")
except Exception as exc:
    check(False, f"could not evaluate Build 312 exclusions: {exc}")

if failures:
    print("BUILD 312 ACCOUNTING READ CONTRACT: FAIL")
    for failure in failures:
        print(" -", failure)
    sys.exit(1)

print("BUILD 312 ACCOUNTING READ CONTRACT: PASS")
print("No Cloudflare resource was contacted.")
