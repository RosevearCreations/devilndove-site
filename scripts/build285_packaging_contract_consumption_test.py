#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "1fa085ebbe9ecc2ea391e66fd070003d7a8a24ef"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD285_CHANGED_FILES.md",
    "BUILD285_VALIDATION.md",
    "docs/architecture/BUILD285_PACKAGING_CONTRACT_CONSUMPTION.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
    "scripts/build285_packaging_contract_consumption_test.py",
}
JS_FILES = [
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
]


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


for rel in JS_FILES:
    result = run("node", "--check", rel)
    require(result.returncode == 0, f"JavaScript syntax: {rel}\n{result.stderr}")
print("PASS: Build 285 JavaScript syntax")

admin = (ROOT / "public/js/admin.js").read_text(encoding="utf-8")
runtime = (ROOT / "public/js/core/dd-admin-module-runtime.mjs").read_text(encoding="utf-8")
definitions = (ROOT / "public/js/core/dd-module-definitions.mjs").read_text(encoding="utf-8")
packaging = (ROOT / "public/js/modules/packaging/index.mjs").read_text(encoding="utf-8")

require("dd-admin-module-runtime.mjs?v=285" in admin, "Admin does not load the Build 285 runtime")
require("build: 285" in runtime, "runtime build marker is not 285")
require("../modules/packaging/index.mjs?v=285" in definitions, "Packaging module definition is not Build 285")
require("behaviorMode: 'contract-consumer-bridge'" in packaging, "Packaging contract consumer bridge marker missing")
require("PACKAGING_BOOTSTRAP_PATH = '/api/admin/packaging-studio'" in packaging, "Packaging bootstrap target missing")
require("method === 'GET'" in packaging, "Packaging bridge is not constrained to GET")
require("module_contracts" in packaging, "contract source metadata missing from compatibility response")
require("products: catalog.rows" in packaging and "inventory: inventory.rows" in packaging, "contract rows do not replace legacy cross-domain arrays")
print("PASS: Packaging GET bootstrap contract consumer bridge")

require("legacy-fallback" in packaging, "legacy fallback marker missing")
require("originalApiFetch.call" in packaging, "original authenticated API path is not preserved")
require("bridgeAuthOwner.apiFetch = originalApiFetch" in packaging, "authenticated API bridge is not restored on deactivation")
require("state !== 'active' || !isPackagingBootstrapRequest" in packaging, "bridge does not pass unrelated/inactive requests through")
print("PASS: Packaging writes remain untouched and fallback remains available")

require("MutationObserver" in packaging, "one-shot event-driven refresh observer missing")
require("refreshTriggered" in packaging and "refreshObserver?.disconnect" in packaging, "refresh does not have one-shot cleanup")
require("setInterval(" not in packaging, "Packaging module introduced polling")
require("setTimeout(" not in packaging, "Packaging module introduced timer-based refresh")
print("PASS: one-shot event-driven contract refresh with no polling timer")

harness = r'''
const listeners = new Map();
const statusNode = { textContent: 'Labeling & Packaging System loaded with 1 adopted source reference.', insertAdjacentElement() {} };
let refreshClicks = 0;
const refreshButton = { click(){ refreshClicks += 1; } };
const html = { dataset: {} };
const body = { dataset: {} };
globalThis.document = {
  documentElement: html,
  body,
  getElementById(id){ if (id==='packagingStudioMessage') return statusNode; if (id==='refreshPackagingStudio') return refreshButton; return null; },
  createElement(){ return { setAttribute(){}, textContent:'', className:'', id:'' }; },
  dispatchEvent(event){ (listeners.get(event.type)||[]).forEach(fn=>fn(event)); },
  addEventListener(type, fn){ const a=listeners.get(type)||[]; a.push(fn); listeners.set(type,a); }
};
globalThis.window = { location: { pathname:'/admin/packaging-studio/' } };
globalThis.location = { origin:'https://dev.example' };
globalThis.CustomEvent = class CustomEvent { constructor(type,{detail}={}){ this.type=type; this.detail=detail; } };
globalThis.MutationObserver = class { observe(){} disconnect(){} };
const rawApiFetch = async (input) => {
  const path = new URL(String(input), location.origin).pathname;
  if (path === '/api/admin/packaging-studio') return new Response(JSON.stringify({ok:true, products:[{product_id:99,name:'legacy'}], inventory:[{site_item_inventory_id:99,item_name:'legacy'}]}), {status:200, headers:{'content-type':'application/json'}});
  throw new Error('unexpected raw API '+path);
};
globalThis.DDAuth = { apiFetch: rawApiFetch };
window.DDAuth = globalThis.DDAuth;
const services = new Map([
  ['catalog-read',{list:async()=>({rows:[{product_id:1,name:'Contract Product'}],count:1,contract:'catalog-read'})}],
  ['inventory-read',{list:async()=>({rows:[{site_item_inventory_id:2,item_name:'Contract Material'}],count:1,contract:'inventory-read'})}],
  ['content-media',{list:async()=>({rows:[{media_asset_id:3,display_name:'Contract Art'}],count:1,contract:'content-media'})}],
]);
const registry = { service:(id)=>services.get(id)||null };
const moduleUrl = process.argv[2];
const mod = await import(moduleUrl+'?build285-harness=1');
await mod.onLoad({registry,definition:{id:'packaging'}});
await mod.onActivate({registry,user:{role:'admin',user_id:1},pathname:'/admin/packaging-studio/'});
if (DDAuth.apiFetch === rawApiFetch) throw new Error('bridge not installed');
if (refreshClicks !== 1) throw new Error('expected one contract refresh click');
const response = await DDAuth.apiFetch('/api/admin/packaging-studio');
const data = await response.json();
if (data.products?.[0]?.product_id !== 1) throw new Error('catalog not contractized');
if (data.inventory?.[0]?.site_item_inventory_id !== 2) throw new Error('inventory not contractized');
if (data.content_media?.[0]?.media_asset_id !== 3) throw new Error('content media seam missing');
if (data.module_contracts?.catalog_read !== 'contract') throw new Error('contract metadata missing');
const status = window.DDPackagingContracts.getBootstrapStatus();
if (!status.contractized || status.catalogSource !== 'contract' || status.inventorySource !== 'contract') throw new Error('bootstrap contract status incorrect');
await mod.onDeactivate({reason:'test'});
if (DDAuth.apiFetch !== rawApiFetch) throw new Error('bridge not restored');
let blocked=false; try { await mod.readCatalog(); } catch { blocked=true; }
if (!blocked) throw new Error('inactive contract read should fail');
console.log('PASS');
'''
with tempfile.TemporaryDirectory() as temp_dir:
    harness_path = Path(temp_dir) / "build285-harness.mjs"
    harness_path.write_text(harness, encoding="utf-8")
    module_uri = (ROOT / "public/js/modules/packaging/index.mjs").resolve().as_uri()
    result = subprocess.run(["node", str(harness_path), module_uri], cwd=ROOT, text=True, capture_output=True)
    require(result.returncode == 0 and "PASS" in result.stdout, f"Packaging bridge harness failed\n{result.stdout}\n{result.stderr}")

changed = run("git", "diff", "--name-only", f"{BASE}..HEAD")
require(changed.returncode == 0, changed.stderr or "git diff failed")
actual = {line.strip().replace("\\", "/") for line in changed.stdout.splitlines() if line.strip()}
require(actual == EXPECTED, f"changed-file boundary mismatch\nexpected={sorted(EXPECTED)}\nactual={sorted(actual)}")
print("PASS: exact Build 285 changed-file boundary")

forbidden = [
    p for p in actual
    if p.startswith("functions/")
    or p.lower().endswith(".sql")
    or p == "wrangler.toml"
    or "wrangler" in p.lower()
    or "migration" in p.lower()
]
require(not forbidden, f"protected Functions/schema/config file changed: {forbidden}")
print("PASS: no Functions, D1 migration, or Cloudflare binding/config change")

print("BUILD 285 PACKAGING CONTRACT CONSUMPTION: PASS")
print("No Cloudflare resource was contacted.")
