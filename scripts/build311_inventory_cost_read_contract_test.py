#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASE = "c88bcd63d7478cdb24e2b7070fa739f35789ac88"

EXPECTED_CHANGED = {
    "AI_CONTEXT.md",
    "BUILD311_CHANGED_FILES.md",
    "BUILD311_VALIDATION.md",
    "admin/inventory-operations/index.html",
    "docs/architecture/BUILD311_INVENTORY_COST_READ_CONTRACT.md",
    "functions/api/admin/contracts/inventory-cost.js",
    "public/js/admin.js",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build311_inventory_cost_read_contract_test.py",
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


route = text("functions/api/admin/contracts/inventory-cost.js")
contracts = text("public/js/core/dd-module-contracts.mjs")
adapters = text("public/js/core/dd-module-service-adapters.mjs")
groups = text("public/js/core/dd-application-module-groups.mjs")
runtime = text("public/js/modules/commerce-operations/runtime.mjs")
admin = text("public/js/admin.js")
inventory_page = text("admin/inventory-operations/index.html")
validation = text("BUILD311_VALIDATION.md") if (ROOT / "BUILD311_VALIDATION.md").exists() else ""
architecture = text("docs/architecture/BUILD311_INVENTORY_COST_READ_CONTRACT.md") if (ROOT / "docs/architecture/BUILD311_INVENTORY_COST_READ_CONTRACT.md").exists() else ""

for rel in [
    "functions/api/admin/contracts/inventory-cost.js",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "public/js/admin.js",
]:
    ok, detail = node_check(rel)
    check(ok, f"Build 311 JavaScript syntax: {rel}" + (f" ({detail})" if detail and not ok else ""))

check("export const BUILD = 311" in route and "export const CONTRACT_ID = 'inventory-cost'" in route,
      "Inventory owns a dedicated Build 311 inventory-cost route")
check("authority_field: 'site_item_inventory.unit_cost_cents'" in route and "mode: 'read-only-current-cost'" in route,
      "current Inventory unit cost is the explicit read authority")
check("cost_per_usage_unit_cents" in route and "inventory_value_cents" in route,
      "cost contract exposes normalized usage cost and current inventory value")
check("site_item_inventory_cost_history" in route and "history_available" in route,
      "existing cost history is optional evidence rather than a new authority")

for forbidden in [
    "INSERT INTO site_item_inventory",
    "UPDATE site_item_inventory",
    "DELETE FROM site_item_inventory",
    "CREATE TABLE",
    "DROP TABLE",
    "ALTER TABLE",
]:
    check(forbidden not in route, f"inventory-cost route contains no mutation/schema statement: {forbidden}")

check("contract('inventory-cost', 'inventory', ['catalog', 'accounting']" in contracts,
      "contract catalog preserves Inventory ownership with Catalog and Accounting consumers")
check("status: 'implemented'" in contracts and "route: '/api/admin/contracts/inventory-cost'" in contracts and "implemented-read-only-current-cost" in contracts,
      "inventory-cost is implemented as a dedicated read-only contract")

check("'inventory-cost': '/api/admin/contracts/inventory-cost'" in adapters,
      "browser service registry contains the Inventory cost route")
check("'inventory-cost': service('inventory-cost', 'inventory'" in adapters,
      "Inventory cost service registration is passive and Inventory-owned")
check("mode: 'read-only-http'" in adapters and "fetchContract" in adapters,
      "read service uses the existing authenticated passive HTTP adapter pattern")

check("export const BUILD = 302;" in groups and "export const INVENTORY_COST_CONTRACT_BUILD = 311;" in groups,
      "architecture remains Build 302 while exposing Build 311 cost-boundary identity")
check("runtimeDomains: Object.freeze(['catalog', 'inventory'])" in groups and "operationsRuntimeDomainActive: false" in groups,
      "Operations remains outside the active Commerce runtime")
check("../modules/commerce-operations/runtime.mjs?v=311" in groups,
      "Commerce runtime entry is explicitly cache-busted to Build 311")

check("const BUILD = 311;" in runtime,
      "Commerce runtime exposes Build 311 cost-boundary state")
check("catalog: Object.freeze(['catalog-read', 'inventory-cost'])" in runtime,
      "Catalog explicitly requires the Inventory cost read service")
check("inventory: Object.freeze(['inventory-read'])" in runtime,
      "Inventory runtime requirements remain read-only and unchanged")
check("const SUPPORTED_DOMAINS = Object.freeze(['catalog', 'inventory'])" in runtime,
      "Operations/Public are not activated in Build 311")
check("ownsInventoryMutations: false" in runtime and "operationsRuntimeActive: false" in runtime,
      "Commerce remains non-mutating and Operations remains inactive")

check("dd-admin-module-runtime.mjs?v=311" in admin,
      "shared Admin loader requests the Build 311 runtime graph")
check("/public/js/admin.js?v=311" in inventory_page,
      "Inventory validation page pins the Build 311 shared loader")

try:
    compat_now = (ROOT / "functions/api/admin/creative-process-compat.js").read_bytes()
    compat_base = subprocess.check_output(
        ["git", "show", f"{BASE}:functions/api/admin/creative-process-compat.js"], cwd=ROOT
    )
    check(compat_now == compat_base,
          "Creative compatibility implementation remains byte-for-byte frozen from completed Build 310")
except Exception as exc:
    check(False, f"could not verify Creative compatibility historical pin: {exc}")

for rel in [
    "functions/api/_lib/inventoryPostService.js",
    "functions/api/admin/contracts/inventory-post.js",
    "functions/api/_lib/inventoryReversalService.js",
    "functions/api/admin/contracts/inventory-reverse.js",
    "functions/api/_lib/creativeInventoryPostConsumer.js",
    "functions/api/_lib/creativeInventoryReversalConsumer.js",
]:
    try:
        current = (ROOT / rel).read_bytes()
        historic = subprocess.check_output(["git", "show", f"{BASE}:{rel}"], cwd=ROOT)
        check(current == historic, f"completed write authority/consumer remains historically pinned: {rel}")
    except Exception as exc:
        check(False, f"could not verify historical pin for {rel}: {exc}")

check("compatibility copy cannot be retired" in architecture.lower() or "cannot be retired" in architecture.lower(),
      "Build 311 records the compatibility-retirement decision")
check("Operations remains" in validation or "Operations" in validation,
      "Build 311 validation keeps Operations out of scope")

try:
    changed = {line for line in git("diff", "--name-only", f"{BASE}..HEAD").splitlines() if line}
    check(changed == EXPECTED_CHANGED,
          "exact Build 311 Inventory cost read-contract changed-file boundary")
except Exception as exc:
    check(False, f"could not evaluate Build 311 changed-file boundary: {exc}")

try:
    changed = {line for line in git("diff", "--name-only", f"{BASE}..HEAD").splitlines() if line}
    forbidden = [
        p for p in changed
        if p.endswith(".sql")
        or p in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"}
        or p.startswith("functions/api/admin/operations")
        or p.startswith("functions/api/admin/orders")
        or p.startswith("functions/api/admin/accounting")
    ]
    check(not forbidden,
          "Build 311 adds no SQL/schema, Cloudflare binding/config, Operations implementation, Accounting implementation, or real Production change")
except Exception as exc:
    check(False, f"could not evaluate Build 311 exclusions: {exc}")

if failures:
    print("BUILD 311 INVENTORY COST READ CONTRACT: FAIL")
    for failure in failures:
        print(" -", failure)
    sys.exit(1)

print("BUILD 311 INVENTORY COST READ CONTRACT: PASS")
print("No Cloudflare resource was contacted.")
