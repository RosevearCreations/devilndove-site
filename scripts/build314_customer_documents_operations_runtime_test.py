from __future__ import annotations

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = "4ba68bf720561fab590e2dfb74581c0adf871b46"

EXPECTED_CHANGED = {
    "AI_CONTEXT.md",
    "BUILD314_CHANGED_FILES.md",
    "BUILD314_VALIDATION.md",
    "admin/customer-documents/index.html",
    "admin/operations/index.html",
    "docs/architecture/BUILD314_CUSTOMER_DOCUMENTS_OPERATIONS_RUNTIME.md",
    "public/js/admin.js",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build314_customer_documents_operations_runtime_test.py",
}

FAILURES: list[str] = []


def text(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def check(condition: bool, label: str) -> None:
    if condition:
        print(f"PASS: {label}")
    else:
        print(f"FAIL: {label}")
        FAILURES.append(label)


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def git_path_matches_base(rel: str) -> bool:
    result = subprocess.run(
        ["git", "diff", "--quiet", BASE, "--", rel],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    return result.returncode == 0


def node_check(rel: str) -> None:
    result = subprocess.run(
        ["node", "--check", rel],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    check(result.returncode == 0, f"Build 314 JavaScript syntax: {rel}")
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
admin_js = text("public/js/admin.js")
operations_page = text("admin/operations/index.html")
documents_page = text("admin/customer-documents/index.html")
validation = text("BUILD314_VALIDATION.md")
architecture = text("docs/architecture/BUILD314_CUSTOMER_DOCUMENTS_OPERATIONS_RUNTIME.md")
changed_files_doc = text("BUILD314_CHANGED_FILES.md")

check("const BUILD = 314;" in runtime, "Commerce runtime identity is Build 314")
check("'/admin/operations/'" in runtime and "'/admin/customer-documents/'" in runtime,
      "Operations runtime has the two explicit proven page paths")
check("OPERATIONS_RUNTIME_PAGES.includes(normalizePathname(pathname))" in runtime,
      "Operations activation is guarded by the explicit pathname allow-list")
check("catalog-read', 'inventory-read', 'accounting-read" in runtime,
      "Operations keeps the three proven read prerequisites")
check("ownsOperationsMutations: false" in runtime and "operationsMutationOwnership: false" in runtime,
      "Operations runtime remains non-mutating")
check("currentOperationsPageProven" in runtime,
      "runtime exposes current-page coverage proof")
check("operationsRuntimeCoverageBuild: 314" in runtime,
      "runtime exposes Build 314 Operations coverage identity")

check("export const RUNTIME_OPERATIONS_BUILD = 314;" in groups,
      "architecture catalog records Operations runtime Build 314")
check("export const OPERATIONS_RUNTIME_COVERAGE_BUILD = 314;" in groups,
      "architecture catalog records Build 314 coverage identity")
check("../modules/commerce-operations/runtime.mjs?v=314" in groups,
      "architecture catalog cache-busts Commerce runtime to Build 314")
check("'/admin/operations/'" in groups and "'/admin/customer-documents/'" in groups,
      "architecture catalog publishes the explicit Operations page set")

check("dd-admin-module-runtime.mjs?v=314" in admin_js,
      "shared Admin loader requests the Build 314 runtime graph")
check('/public/js/admin.js?v=314' in operations_page,
      "existing proven Operations page is re-pinned to Build 314")
check('/public/js/admin.js?v=314' in documents_page,
      "Customer Documents is explicitly pinned to Build 314")
check('/public/js/admin-customer-documents.js?v=227' in documents_page,
      "Customer Documents keeps its historical Build 227 business script")

for rel in [
    "public/js/admin-customer-documents.js",
    "admin/orders/index.html",
    "functions/api/admin/contracts/accounting-read.js",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "functions/api/_lib/inventoryPostService.js",
    "functions/api/admin/contracts/inventory-post.js",
    "functions/api/_lib/inventoryReversalService.js",
    "functions/api/admin/contracts/inventory-reverse.js",
    "functions/api/_lib/creativeInventoryPostConsumer.js",
    "functions/api/_lib/creativeInventoryReversalConsumer.js",
]:
    try:
        check(git_path_matches_base(rel), f"protected behavior remains historically pinned: {rel}")
    except Exception as exc:
        check(False, f"could not verify historical pin for {rel}: {exc}")

check("/admin/orders/" in architecture and "does not claim" in architecture,
      "handoff keeps Orders outside Build 314 runtime coverage")
check("No document issue, void, refund, order, payment" in validation,
      "validation requires no Customer Documents or order mutation")
check("10 files" in changed_files_doc,
      "changed-file handoff declares the ten-file boundary")

try:
    changed = {line for line in git("diff", "--name-only", f"{BASE}..HEAD").splitlines() if line}
    check(changed == EXPECTED_CHANGED, "exact Build 314 changed-file boundary")
    if changed != EXPECTED_CHANGED:
        print("  expected only:")
        for rel in sorted(EXPECTED_CHANGED):
            print(f"    {rel}")
        print("  actual:")
        for rel in sorted(changed):
            print(f"    {rel}")
except Exception as exc:
    check(False, f"could not verify exact Build 314 changed-file boundary: {exc}")

for forbidden in [
    "wrangler.toml",
    "database_full_schema.sql",
]:
    try:
        changed = git("diff", "--name-only", f"{BASE}..HEAD", "--", forbidden)
        check(not changed, f"Build 314 leaves {forbidden} unchanged")
    except Exception as exc:
        check(False, f"could not verify protected file {forbidden}: {exc}")

if FAILURES:
    print("BUILD 314 CUSTOMER DOCUMENTS OPERATIONS RUNTIME: FAIL")
    for item in FAILURES:
        print(f" - {item}")
    sys.exit(1)

print("BUILD 314 CUSTOMER DOCUMENTS OPERATIONS RUNTIME: PASS")
print("No Cloudflare resource was contacted.")
