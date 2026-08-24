#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASE = "3b5709c842ed7bce8335ddd57fe11420ae207367"

EXPECTED_CHANGED = {
    "AI_CONTEXT.md",
    "BUILD313_CHANGED_FILES.md",
    "BUILD313_VALIDATION.md",
    "admin/operations/index.html",
    "docs/architecture/BUILD313_OPERATIONS_READ_ONLY_RUNTIME.md",
    "public/js/admin.js",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build313_operations_read_only_runtime_test.py",
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
    suffix = ".mjs"
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=suffix, dir=ROOT, delete=False) as handle:
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


runtime = text("public/js/modules/commerce-operations/runtime.mjs")
groups = text("public/js/core/dd-application-module-groups.mjs")
admin = text("public/js/admin.js")
operations_page = text("admin/operations/index.html")
orders_page = text("admin/orders/index.html")
architecture = text("docs/architecture/BUILD313_OPERATIONS_READ_ONLY_RUNTIME.md")
validation = text("BUILD313_VALIDATION.md")

for rel in [
    "public/js/modules/commerce-operations/runtime.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/admin.js",
]:
    ok, detail = node_check(rel)
    check(ok, f"Build 313 JavaScript syntax: {rel}" + (f" ({detail})" if detail and not ok else ""))

check("const BUILD = 313;" in runtime,
      "Commerce runtime exposes Build 313 identity")
check("const SUPPORTED_DOMAINS = Object.freeze(['catalog', 'inventory', 'operations'])" in runtime,
      "Operations joins the supported Commerce runtime domains")
check("operations: Object.freeze(['catalog-read', 'inventory-read', 'accounting-read'])" in runtime,
      "Operations requires exactly the three proven read contracts")
check("ownsOperationsMutations: false" in runtime and "operationsMutationOwnership: false" in runtime,
      "Operations runtime owns no mutation authority")
check("behaviorMode: 'catalog-inventory-operations-read-only-runtime'" in runtime,
      "Commerce runtime explicitly identifies the read-only Operations activation mode")
check("operationsRuntimeActive: state === 'active' && currentDomain === 'operations'" in runtime,
      "runtime status reports actual Operations activation from current domain state")
check("createsNetworkTransport: false" in runtime,
      "runtime activation creates no network transport")

check("export const BUILD = 302;" in groups and "export const RUNTIME_OPERATIONS_BUILD = 313;" in groups,
      "Core architecture remains Build 302 while exposing Operations runtime Build 313")
check("runtimeDomains: Object.freeze(['catalog', 'inventory', 'operations'])" in groups,
      "application architecture admits Operations to the Commerce runtime")
check("../modules/commerce-operations/runtime.mjs?v=313" in groups,
      "Commerce runtime entry is cache-busted to Build 313")
check("operationsRuntimeDomainActive: true" in groups and "operationsRuntimeActivationMode: 'read-only-first-page'" in groups,
      "architecture records the bounded read-only Operations activation")

check("dd-admin-module-runtime.mjs?v=313" in admin,
      "shared Admin loader requests the Build 313 runtime graph")
check('/public/js/admin.js?v=313' in operations_page,
      "Operations validation page explicitly loads Build 313 shared Admin runtime")
check('/public/js/admin.js' not in orders_page,
      "Orders remains outside Build 313 loader migration coverage")

check("/admin/operations/" in architecture and "read-only" in architecture.lower(),
      "architecture handoff documents the first read-only Operations runtime page")
check("does not claim" in architecture.lower() and "/admin/orders/" in architecture,
      "handoff explicitly avoids claiming unproven Operations route coverage")
check("/admin/operations/" in validation and "owns_operations_mutations" in validation,
      "validation proves runtime activation without Operations mutation ownership")

for rel in [
    "functions/api/admin/contracts/accounting-read.js",
    "functions/api/admin/contracts/inventory-cost.js",
    "functions/api/admin/contracts/inventory-read.js",
    "functions/api/admin/contracts/catalog-read.js",
    "functions/api/_lib/inventoryPostService.js",
    "functions/api/admin/contracts/inventory-post.js",
    "functions/api/_lib/inventoryReversalService.js",
    "functions/api/admin/contracts/inventory-reverse.js",
    "functions/api/_lib/creativeInventoryPostConsumer.js",
    "functions/api/_lib/creativeInventoryReversalConsumer.js",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "functions/api/_lib/accounting.js",
    "functions/api/admin/accounting-summary.js",
    "admin/orders/index.html",
]:
    try:
        check(git_path_matches_base(rel), f"historical authority/compatibility pin remains unchanged: {rel}")
    except Exception as exc:
        check(False, f"could not verify historical pin for {rel}: {exc}")

try:
    changed = {line for line in git("diff", "--name-only", f"{BASE}..HEAD").splitlines() if line}
    check(changed == EXPECTED_CHANGED,
          "exact Build 313 Operations read-only runtime changed-file boundary")
except Exception as exc:
    check(False, f"could not evaluate Build 313 changed-file boundary: {exc}")

try:
    changed = {line for line in git("diff", "--name-only", f"{BASE}..HEAD").splitlines() if line}
    forbidden = [
        p for p in changed
        if p.endswith(".sql")
        or p in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"}
        or p.startswith("functions/api/admin/orders")
        or p.startswith("functions/api/admin/operations")
        or p.startswith("functions/api/admin/accounting")
        or p.startswith("functions/api/admin/gift")
        or p.startswith("functions/api/admin/member")
    ]
    check(not forbidden,
          "Build 313 adds no business mutation implementation, SQL/schema, Cloudflare config, or Production change")
except Exception as exc:
    check(False, f"could not evaluate Build 313 exclusions: {exc}")

if failures:
    print("BUILD 313 OPERATIONS READ-ONLY RUNTIME: FAIL")
    for failure in failures:
        print(" -", failure)
    sys.exit(1)

print("BUILD 313 OPERATIONS READ-ONLY RUNTIME: PASS")
print("No Cloudflare resource was contacted.")
