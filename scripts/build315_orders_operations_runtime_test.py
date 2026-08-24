#!/usr/bin/env python3
"""Build 315 Orders Operations runtime coverage regression.

Static/local-only proof. No Cloudflare resource is contacted.
"""

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = "c29aca8c789ac53e9418f6074e8408b56391d7e5"

EXPECTED_CHANGED = {
    "AI_CONTEXT.md",
    "BUILD315_CHANGED_FILES.md",
    "BUILD315_VALIDATION.md",
    "admin/customer-documents/index.html",
    "admin/operations/index.html",
    "admin/orders/index.html",
    "docs/architecture/BUILD315_ORDERS_OPERATIONS_RUNTIME.md",
    "public/js/admin.js",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build315_orders_operations_runtime_test.py",
}

PROTECTED_ORDER_PATHS = [
    "public/js/admin-orders.js",
    "public/js/admin-order-detail.js",
    "public/js/admin-gift-card-order-redemption.js",
    "public/js/admin-accounting-backend.js",
    "functions/api/admin/orders.js",
    "functions/api/admin/update-order-status.js",
    "functions/api/admin/record-payment.js",
    "functions/api/admin/payment-actions.js",
    "functions/api/admin/order-payments.js",
]

PROTECTED_EXISTING_AUTHORITIES = [
    "public/js/admin-customer-documents.js",
    "functions/api/admin/contracts/accounting-read.js",
    "functions/api/_lib/inventoryPostService.js",
    "functions/api/admin/contracts/inventory-post.js",
    "functions/api/_lib/inventoryReversalService.js",
    "functions/api/admin/contracts/inventory-reverse.js",
    "functions/api/_lib/creativeInventoryPostConsumer.js",
    "functions/api/_lib/creativeInventoryReversalConsumer.js",
]

failures = []


def text(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def check(condition, message):
    if condition:
        print(f"PASS: {message}")
    else:
        print(f"FAIL: {message}")
        failures.append(message)


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
    result = subprocess.run(
        ["node", "--check", str(ROOT / rel)],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    check(result.returncode == 0, f"Build 315 JavaScript syntax: {rel}")
    if result.returncode != 0 and result.stderr:
        print(result.stderr.strip())


for rel in [
    "public/js/modules/commerce-operations/runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/admin.js",
]:
    node_check(rel)

runtime = text("public/js/modules/commerce-operations/runtime.mjs")
groups = text("public/js/core/dd-application-module-groups.mjs")
admin = text("public/js/admin.js")
operations_page = text("admin/operations/index.html")
customer_documents_page = text("admin/customer-documents/index.html")
orders_page = text("admin/orders/index.html")
validation = text("BUILD315_VALIDATION.md")
architecture = text("docs/architecture/BUILD315_ORDERS_OPERATIONS_RUNTIME.md")
changed_files_doc = text("BUILD315_CHANGED_FILES.md")

check("const BUILD = 315;" in runtime, "Commerce runtime exposes Build 315 identity")
check("'/admin/operations/'" in runtime and "'/admin/customer-documents/'" in runtime and "'/admin/orders/'" in runtime,
      "Build 315 runtime allow-list contains exactly the three intended Operations pages")
check("operationsRuntimeBuild: 315" in runtime and "operationsRuntimeCoverageBuild: 315" in runtime,
      "Operations runtime and coverage identities advance together to Build 315")
check("ownsOperationsMutations: false" in runtime and "createsNetworkTransport: false" in runtime,
      "Commerce runtime remains non-mutating for Operations")
check("catalog-read', 'inventory-read', 'accounting-read" in runtime,
      "Operations read-service requirements remain unchanged")
check("no proven Operations runtime coverage" in runtime and "supportedPathForDomain" in runtime,
      "Operations runtime still rejects unproven classified paths")

check("export const RUNTIME_OPERATIONS_BUILD = 315;" in groups,
      "architecture catalog records Operations runtime Build 315")
check("export const OPERATIONS_RUNTIME_COVERAGE_BUILD = 315;" in groups,
      "architecture catalog records Operations coverage Build 315")
check("../modules/commerce-operations/runtime.mjs?v=315" in groups,
      "architecture catalog cache-busts Commerce runtime to Build 315")
check("'/admin/orders/'" in groups and "read-only-explicit-three-page-coverage" in groups,
      "architecture snapshot exposes three-page read-only Operations coverage")
check("BUILD = 302" in groups,
      "top-level application architecture remains Build 302")

check("dd-admin-module-runtime.mjs?v=315" in admin,
      "shared Admin loader requests the Build 315 runtime graph")
check("/public/js/admin.js?v=315" in operations_page,
      "existing Operations proof page is re-pinned to Build 315")
check("/public/js/admin.js?v=315" in customer_documents_page,
      "Customer Documents proof page is re-pinned to Build 315")
check("/public/js/admin.js?v=315" in orders_page,
      "Orders receives the shared Build 315 Admin/runtime loader")

orders_scripts = [
    "/public/js/admin-orders.js",
    "/public/js/admin-order-detail.js",
    "/public/js/admin-gift-card-order-redemption.js",
    "/public/js/admin-accounting-backend.js",
]
for script in orders_scripts:
    check(script in orders_page, f"Orders page retains historical business script: {script}")

check(orders_page.index('/public/js/admin.js?v=315') < orders_page.index('/public/js/admin-orders.js'),
      "shared module loader is installed before Orders business scripts")

for rel in PROTECTED_ORDER_PATHS:
    try:
        check(git_path_matches_base(rel), f"Orders business/API authority remains historically pinned: {rel}")
    except Exception as exc:
        check(False, f"could not verify Orders historical pin for {rel}: {exc}")

for rel in PROTECTED_EXISTING_AUTHORITIES:
    try:
        check(git_path_matches_base(rel), f"completed authority/consumer remains historically pinned: {rel}")
    except Exception as exc:
        check(False, f"could not verify completed historical pin for {rel}: {exc}")

check("No order update, payment record, refund, gift-card redemption" in validation,
      "Build 315 browser validation remains non-mutating")
check("loader/runtime coverage only" in architecture,
      "Build 315 architecture explicitly excludes mutation-authority migration")
check("Exactly 11 files." in changed_files_doc,
      "Build 315 changed-file document records the intended boundary size")

try:
    changed = {line for line in git("diff", "--name-only", f"{BASE}..HEAD").splitlines() if line}
    check(changed == EXPECTED_CHANGED, "exact Build 315 Orders Operations runtime changed-file boundary")
    if changed != EXPECTED_CHANGED:
        print("  expected only:")
        for rel in sorted(EXPECTED_CHANGED):
            print(f"    {rel}")
        print("  actual:")
        for rel in sorted(changed):
            print(f"    {rel}")
except Exception as exc:
    check(False, f"could not verify changed-file boundary: {exc}")

for forbidden in [
    "wrangler.toml",
    "database_full_schema.sql",
]:
    try:
        changed_forbidden = subprocess.run(
            ["git", "diff", "--quiet", BASE, "--", forbidden],
            cwd=ROOT,
            text=True,
            capture_output=True,
        ).returncode != 0
        check(not changed_forbidden, f"Build 315 does not modify protected config/schema file: {forbidden}")
    except Exception as exc:
        check(False, f"could not verify protected file {forbidden}: {exc}")

if failures:
    print("BUILD 315 ORDERS OPERATIONS RUNTIME: FAIL")
    for failure in failures:
        print(f" - {failure}")
    sys.exit(1)

print("BUILD 315 ORDERS OPERATIONS RUNTIME: PASS")
print("No Cloudflare resource was contacted.")
