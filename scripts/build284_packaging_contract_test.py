#!/usr/bin/env python3
"""Local-only Build 284 Packaging contract integration checks."""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "1d6ca0be65b890866f269dae786807b87ca8aa4f"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD284_CHANGED_FILES.md",
    "BUILD284_VALIDATION.md",
    "docs/architecture/BUILD284_PACKAGING_CONTRACT_INTEGRATION.md",
    "functions/api/admin/contracts/catalog-read.js",
    "functions/api/admin/contracts/content-media.js",
    "functions/api/admin/contracts/inventory-read.js",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "public/js/modules/packaging/index.mjs",
    "scripts/build284_packaging_contract_test.py",
}

JS_FILES = [
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "public/js/modules/packaging/index.mjs",
    "functions/api/admin/contracts/catalog-read.js",
    "functions/api/admin/contracts/inventory-read.js",
    "functions/api/admin/contracts/content-media.js",
]


def run(*args: str) -> str:
    return subprocess.check_output(args, cwd=ROOT, text=True, stderr=subprocess.STDOUT).strip()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> int:
    for rel in JS_FILES:
        subprocess.check_call(["node", "--check", str(ROOT / rel)], cwd=ROOT)
    print("PASS: Build 284 JavaScript syntax")

    contracts = (ROOT / "public/js/core/dd-module-contracts.mjs").read_text(encoding="utf-8")
    for contract_id, route in (
        ("catalog-read", "/api/admin/contracts/catalog-read"),
        ("inventory-read", "/api/admin/contracts/inventory-read"),
        ("content-media", "/api/admin/contracts/content-media"),
    ):
        require(contract_id in contracts, f"Missing contract {contract_id}")
        require(route in contracts, f"Missing route {route}")
    require(contracts.count("status: 'implemented'") >= 1 or "status: options.status" in contracts, "Implemented contract status support missing")
    print("PASS: implemented contract catalog and routes")

    adapters = (ROOT / "public/js/core/dd-module-service-adapters.mjs").read_text(encoding="utf-8")
    runtime = (ROOT / "public/js/core/dd-admin-module-runtime.mjs").read_text(encoding="utf-8")
    require("registerDefaultModuleServices(registry)" in runtime, "Runtime does not register module services")
    require("activation-blocked-services" in runtime, "Missing runtime service activation gate")
    require("globalThis.DDAuth?.apiFetch" in adapters, "Contract adapter API client missing")
    require("Registration is passive" in adapters, "Lazy/passive adapter invariant missing")
    print("PASS: lazy module service registration and Packaging service gate")

    out_dir = ROOT / ".wrangler" / "build284"
    out_dir.mkdir(parents=True, exist_ok=True)
    harness = out_dir / "contract-harness.mjs"
    registry_uri = (ROOT / "public/js/core/dd-module-registry.mjs").as_uri()
    defs_uri = (ROOT / "public/js/core/dd-module-definitions.mjs").as_uri()
    adapters_uri = (ROOT / "public/js/core/dd-module-service-adapters.mjs").as_uri()
    harness.write_text(f"""
import {{ createModuleRegistry }} from {registry_uri!r};
import {{ DD_MODULE_DEFINITIONS }} from {defs_uri!r};
import {{ registerDefaultModuleServices }} from {adapters_uri!r};
const registry = createModuleRegistry(DD_MODULE_DEFINITIONS);
const registered = registerDefaultModuleServices(registry);
if (!registered.ok) throw new Error('service registration failed');
for (const id of ['catalog-read','inventory-read','content-media']) if (!registry.service(id)) throw new Error(`missing service ${{id}}`);
const definition = registry.get('packaging');
for (const id of definition.consumes) if (!registry.service(id)) throw new Error(`packaging missing ${{id}}`);
const ns = await registry.activate('packaging', {{ user: {{ role:'admin', user_id:1 }}, pathname:'/admin/packaging-studio/', verified:true }});
if (registry.state('packaging') !== 'active') throw new Error('packaging did not activate');
if (!ns.getStatus().servicesReady) throw new Error('packaging services not ready');
await registry.deactivate('packaging', {{ reason:'test' }});
let blocked = false;
try {{ await ns.readCatalog(); }} catch (error) {{ blocked = String(error?.message || error).includes('active Packaging module'); }}
if (!blocked) throw new Error('inactive Packaging contract read was not blocked');
console.log('ok');
""", encoding="utf-8")
    require(run("node", str(harness)) == "ok", "Packaging contract harness failed")
    print("PASS: Packaging contract consumer lifecycle")

    changed = set(filter(None, run("git", "diff", "--name-only", f"{BASE}..HEAD").splitlines()))
    require(changed == EXPECTED, f"Unexpected Build 284 changed-file boundary: {sorted(changed ^ EXPECTED)}")
    print("PASS: exact Build 284 changed-file boundary")

    forbidden = [
        path for path in changed
        if path == "wrangler.toml"
        or path.startswith("database_")
        or path.endswith(".sql")
        or "migration" in path.lower()
    ]
    require(not forbidden, f"Protected schema/config files changed: {forbidden}")
    allowed_functions = {
        "functions/api/admin/contracts/catalog-read.js",
        "functions/api/admin/contracts/inventory-read.js",
        "functions/api/admin/contracts/content-media.js",
    }
    function_changes = {path for path in changed if path.startswith("functions/")}
    require(function_changes == allowed_functions, f"Unexpected Functions changes: {sorted(function_changes ^ allowed_functions)}")
    print("PASS: no D1 migration or Cloudflare binding/config change")

    print("BUILD 284 PACKAGING CONTRACT INTEGRATION: PASS")
    print("No Cloudflare resource was contacted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
