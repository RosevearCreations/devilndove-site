#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASE = "70902c5144e91964e42dbf113931bcd5edcde2f8"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD288_CHANGED_FILES.md",
    "BUILD288_VALIDATION.md",
    "docs/architecture/BUILD288_PACKAGING_LEGACY_GET_RETIREMENT.md",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "scripts/build287_packaging_artwork_picker_test.py",
    "scripts/build288_packaging_legacy_get_retirement_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True)


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


js_files = [
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "public/js/modules/packaging/runtime.mjs",
]
for name in js_files:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 288 JavaScript syntax")

result = run([
    "node", "--input-type=module", "-e",
    "import('./public/js/modules/packaging/runtime.mjs').then(m=>{if(m.metadata?.build!==288)process.exit(2)}).catch(e=>{console.error(e);process.exit(1)})"
])
if result.returncode:
    fail(f"Build 288 module import failed: {result.stderr.strip() or result.stdout.strip()}")
print("PASS: Build 288 module imports resolve")

runtime_path = ROOT / "public/js/modules/packaging/runtime.mjs"
harness = r"""
import { pathToFileURL } from 'node:url';

const calls = [];
let failNarrow = false;
const narrowPayload = {
  ok: true,
  build: 286,
  templates: [{ packaging_template_id: 1 }],
  projects: [{ packaging_project_id: 2 }],
  printers: [],
  printers_schema_ready: true,
  reference_sources: [],
  formula_library: [],
  content_library: [],
  source_material_library: [],
  library_schema_ready: true,
  source_material_schema_ready: true,
  source_material_metadata_ready: true,
  detail: null,
  module_boundary: {
    build: 286,
    bootstrap: 'packaging-owned',
    bulk_catalog_rows: 0,
    bulk_inventory_rows: 0,
    legacy_broad_get_bypassed: true
  }
};

globalThis.location = { origin: 'https://dev.example', pathname: '/admin/packaging-studio/' };
globalThis.CustomEvent = class CustomEvent {
  constructor(name, init = {}) { this.type = name; this.detail = init.detail; }
};
const messageNode = {
  textContent: 'Labeling & Packaging System loaded with 0 adopted source references.',
  insertAdjacentElement() {},
};
const refreshButton = { click() {} };
const body = { dataset: {} };
globalThis.document = {
  documentElement: { dataset: {} },
  body,
  readyState: 'complete',
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
  querySelectorAll() { return []; },
  createElement() { return { setAttribute() {}, textContent: '', className: '', id: '' }; },
  getElementById(id) {
    if (id === 'packagingStudioMessage') return messageNode;
    if (id === 'refreshPackagingStudio') return refreshButton;
    return null;
  }
};
globalThis.window = globalThis;
globalThis.MutationObserver = class MutationObserver {
  constructor(cb) { this.cb = cb; }
  observe() {}
  disconnect() {}
};

globalThis.DDAuth = {};
const originalApiFetch = async (input, init = {}) => {
  const url = String(input?.url || input || '');
  const method = String(init?.method || input?.method || 'GET').toUpperCase();
  calls.push({ url, method });

  if (url.startsWith('/api/admin/packaging-bootstrap')) {
    if (failNarrow) {
      return new Response(JSON.stringify({ ok: false, error: 'simulated narrow failure' }), {
        status: 503,
        headers: { 'content-type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(narrowPayload), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (url.startsWith('/api/admin/packaging-studio') && method === 'GET') {
    throw new Error('BROAD LEGACY GET REACHED ORIGINAL NETWORK');
  }

  if (url.startsWith('/api/admin/packaging-studio') && method === 'POST') {
    return new Response(JSON.stringify({ ok: true, message: 'write preserved' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: false }), {
    status: 404,
    headers: { 'content-type': 'application/json' }
  });
};
globalThis.DDAuth.apiFetch = originalApiFetch;

const services = {
  'catalog-read': { list: async () => ({ rows: [{ product_id: 1, name: 'contract product' }], count: 1, contract: 'catalog-read' }) },
  'inventory-read': { list: async () => ({ rows: [{ site_item_inventory_id: 1, item_name: 'contract inventory' }], count: 1, contract: 'inventory-read' }) },
  'content-media': { list: async () => ({ rows: [{ media_asset_id: 1, public_url: '/media/art.webp?v=1', display_name: 'contract art' }], count: 1, contract: 'content-media' }) },
};
const registry = { service: (id) => services[id] || null };
const definition = { id: 'packaging' };

const mod = await import(pathToFileURL(process.argv[2]).href + `?test=${Date.now()}`);
await mod.onLoad({ registry, definition });
await mod.onActivate({
  registry,
  definition,
  user: { role: 'admin', user_id: 7 },
  pathname: '/admin/packaging-studio/'
});

const healthyResponse = await globalThis.DDAuth.apiFetch('/api/admin/packaging-studio?packaging_project_id=7');
const healthy = await healthyResponse.json();
if (!healthyResponse.ok || !healthy.ok) throw new Error('healthy contractized GET not ok');
if (healthy.products?.[0]?.product_id !== 1) throw new Error('Catalog contract did not replace products');
if (healthy.inventory?.[0]?.site_item_inventory_id !== 1) throw new Error('Inventory contract did not replace inventory');
if (healthy.content_media?.[0]?.media_asset_id !== 1) throw new Error('Content contract did not attach media');
const originalLegacyGetsAfterHealthy = calls.filter((row) => row.method === 'GET' && row.url.startsWith('/api/admin/packaging-studio'));
if (originalLegacyGetsAfterHealthy.length !== 0) throw new Error('healthy GET reached broad legacy network');
const healthyBootstrap = globalThis.DDPackagingContracts.getBootstrapStatus();
if (healthyBootstrap.serverBootstrapSource !== 'packaging-bootstrap') throw new Error(`unexpected healthy source ${healthyBootstrap.serverBootstrapSource}`);
if (healthyBootstrap.legacyEndpointBypassed !== true) throw new Error('healthy legacy endpoint not marked bypassed');
if (healthyBootstrap.catalogSource !== 'contract' || healthyBootstrap.inventorySource !== 'contract' || healthyBootstrap.contentMediaSource !== 'contract') throw new Error('healthy owner contract sources incorrect');

failNarrow = true;
const failedResponse = await globalThis.DDAuth.apiFetch('/api/admin/packaging-studio?packaging_project_id=7');
const failed = await failedResponse.json();
if (failedResponse.status !== 410) throw new Error(`expected retired GET 410, got ${failedResponse.status}`);
if (failed.error_code !== 'packaging_legacy_get_retired') throw new Error(`unexpected retired error code ${failed.error_code}`);
const originalLegacyGetsAfterFailure = calls.filter((row) => row.method === 'GET' && row.url.startsWith('/api/admin/packaging-studio'));
if (originalLegacyGetsAfterFailure.length !== 0) throw new Error('failure path reached broad legacy network');

const retirement = globalThis.DDPackagingContracts.getLegacyGetRetirementStatus();
if (!retirement.armed || !retirement.legacyGetRetired) throw new Error('retirement guard is not armed');
if (retirement.activeRuntimeBroadLegacyGetReachable !== false) throw new Error('runtime reports broad legacy GET reachable');
if (Number(retirement.blockedLegacyGetCount || 0) < 1) throw new Error('retirement guard did not record blocked rollback GET');

const postResponse = await globalThis.DDAuth.apiFetch('/api/admin/packaging-studio', {
  method: 'POST',
  body: JSON.stringify({ action: 'save_project' })
});
const postData = await postResponse.json();
if (!postResponse.ok || !postData.ok || postData.message !== 'write preserved') throw new Error('Packaging write path changed');
const posts = calls.filter((row) => row.method === 'POST' && row.url.startsWith('/api/admin/packaging-studio'));
if (posts.length !== 1) throw new Error(`expected one Packaging POST at original transport, saw ${posts.length}`);

const status = mod.getStatus();
if (status.build !== 288 || status.baseBuild !== 286) throw new Error('combined runtime build markers incorrect');
if (status.legacyGetRetired !== true || status.activeRuntimeBroadLegacyGetReachable !== false || status.legacyGetGuardArmed !== true) throw new Error('combined retirement status incorrect');
if (status.artworkPickerStarted !== true) throw new Error('Build 287 artwork picker did not remain started');

await mod.onDeactivate({ reason: 'test' });
if (globalThis.DDAuth.apiFetch !== originalApiFetch) throw new Error('DDAuth.apiFetch was not fully restored after deactivation');

console.log(JSON.stringify({
  ok: true,
  calls,
  healthyBootstrap,
  retirement,
  postCount: posts.length
}));
"""
with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as tmp:
    tmp.write(harness)
    harness_path = tmp.name
try:
    result = subprocess.run(
        ["node", harness_path, str(runtime_path)],
        cwd=ROOT, text=True, capture_output=True
    )
finally:
    Path(harness_path).unlink(missing_ok=True)

if result.returncode:
    fail(f"Build 288 runtime harness failed: {result.stderr.strip() or result.stdout.strip()}")
payload = json.loads(result.stdout.strip().splitlines()[-1])
if not payload.get("ok"):
    fail("Build 288 runtime harness returned false")
print("PASS: healthy Packaging GET still uses narrow bootstrap + owner contracts")
print("PASS: narrow-bootstrap failure cannot reach legacy broad GET")
print("PASS: Packaging POST remains on the existing write endpoint")

runtime = read("public/js/modules/packaging/runtime.mjs")
retirement_module = read("public/js/modules/packaging/read-retirement.mjs")
picker = read("public/js/modules/packaging/artwork-picker.mjs")
base = read("public/js/modules/packaging/index.mjs")
if "import * as base from './index.mjs';" not in runtime:
    fail("Build 288 runtime no longer composes the Build 286 bridge")
if "import { createPackagingArtworkPicker, normalizeContentArtworkRows } from './artwork-picker.mjs';" not in runtime:
    fail("Build 288 runtime no longer composes the Build 287 artwork picker")
if "artworkPickerBuild: 287" not in runtime or "Use selected artwork" not in picker:
    fail("Build 287 artwork behavior marker missing")
if "apiBoundaryCleanupBridge: true" not in base or "build: 286" not in base:
    fail("proven Build 286 base bridge markers missing")
print("PASS: Build 287 artwork picker remains composed")

required_retirement_markers = [
    "packaging_legacy_get_retired",
    "activeRuntimeBroadLegacyGetReachable: false",
    "requestMethod(input, init) === 'GET'",
    "previousApiFetch.call(authOwner, input, init)",
]
for marker in required_retirement_markers:
    if marker not in retirement_module:
        fail(f"retirement guard marker missing: {marker}")
if "setInterval(" in retirement_module or "setTimeout(" in retirement_module:
    fail("retirement guard introduced timer-based polling")

admin = read("public/js/admin.js")
module_runtime = read("public/js/core/dd-admin-module-runtime.mjs")
definitions = read("public/js/core/dd-module-definitions.mjs")
if "dd-admin-module-runtime.mjs?v=288" not in admin:
    fail("Admin does not load Build 288 runtime")
if "build: 288" not in module_runtime:
    fail("module runtime does not report Build 288")
if "entry: '../modules/packaging/runtime.mjs?v=288'" not in definitions:
    fail("Packaging definition does not load Build 288 runtime")
if "behaviorMode: 'legacy-get-retired-content-artwork-runtime'" not in runtime:
    fail("Build 288 Packaging runtime behavior marker missing")
print("PASS: Build 288 routing/version markers")

build287_test = read("scripts/build287_packaging_artwork_picker_test.py")
if 'FINAL = "70902c5144e91964e42dbf113931bcd5edcde2f8"' not in build287_test:
    fail("Build 287 historical changed-file audit is not pinned to final Build 287")
if '["git", "diff", "--name-only", BASE, "HEAD"]' in build287_test:
    fail("Build 287 regression still compares its historical boundary to future HEAD")
print("PASS: Build 287 historical regression boundary is pinned")

result = run(["git", "diff", "--name-only", BASE, "HEAD"])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 288 changed-file boundary")

if any(name.startswith("functions/") for name in actual):
    fail("Build 288 changed a Function")
if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 288 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 288 changed Cloudflare binding/config")
for forbidden in {
    "public/js/admin-packaging-studio.js",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/artwork-picker.mjs",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/packaging-bootstrap.js",
}:
    if forbidden in actual:
        fail(f"Build 288 modified protected compatibility boundary file: {forbidden}")
print("PASS: no Function, SQL/schema, Cloudflare binding/config, legacy Packaging UI, Build 286 bridge, or Build 287 picker change")

print("BUILD 288 PACKAGING LEGACY GET RETIREMENT: PASS")
print("No Cloudflare resource was contacted.")
