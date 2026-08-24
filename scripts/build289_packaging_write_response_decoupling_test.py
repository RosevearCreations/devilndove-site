#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BASE = "c47ff9b8ac08282d44f8cb192219a1b5c2f62917"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD289_CHANGED_FILES.md",
    "BUILD289_VALIDATION.md",
    "docs/architecture/BUILD289_PACKAGING_WRITE_RESPONSE_DECOUPLING.md",
    "functions/api/_lib/packagingWriteBoundary.mjs",
    "functions/api/admin/packaging-write.js",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/runtime.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "scripts/build289_packaging_write_response_decoupling_test.py",
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
    "public/js/modules/packaging/runtime.mjs",
    "public/js/modules/packaging/write-response.mjs",
    "functions/api/_lib/packagingWriteBoundary.mjs",
    "functions/api/admin/packaging-write.js",
]
for name in js_files:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 289 JavaScript syntax")

result = run([
    "node", "--input-type=module", "-e",
    "import('./public/js/modules/packaging/runtime.mjs').then(m=>{if(m.metadata?.build!==289)process.exit(2)}).catch(e=>{console.error(e);process.exit(1)})"
])
if result.returncode:
    fail(f"Build 289 module import failed: {result.stderr.strip() or result.stdout.strip()}")
print("PASS: Build 289 module imports resolve")

boundary_path = ROOT / "functions/api/_lib/packagingWriteBoundary.mjs"
boundary_harness = r"""
import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL(process.argv[2]).href + `?test=${Date.now()}`);
const prepared = [];
function normalStatement() {
  return {
    bind() { return this; },
    async all() { return { success: true, results: [{ ok: 1 }] }; },
    async first() { return { ok: 1 }; },
    async run() { return { success: true }; },
    async raw() { return [[1]]; },
  };
}
const db = {
  prepare(sql) { prepared.push(String(sql)); return normalStatement(); },
  async batch() { return []; },
};
const counters = { catalog: 0, inventory: 0 };
const filtered = mod.createPackagingResponseFilteredDb(db, counters);

const productSql = `SELECT product_id,product_number,sku,name,slug,status,product_category,short_description,description,weight_grams,featured_image_url FROM products WHERE COALESCE(status,'draft')<>'archived' ORDER BY LOWER(name),product_id DESC LIMIT 500`;
const inventorySql = `SELECT sii.site_item_inventory_id,sii.item_name FROM site_item_inventory sii LEFT JOIN catalog_items ci ON ci.item_kind=sii.source_type WHERE COALESCE(sii.is_active,1)=1 ORDER BY LOWER(sii.item_name) LIMIT 1000`;
const inventoryFallbackSql = `SELECT site_item_inventory_id,source_type,external_key,item_name FROM site_item_inventory WHERE COALESCE(is_active,1)=1 AND LOWER(COALESCE(source_type,''))<>'tool' ORDER BY LOWER(item_name) LIMIT 1000`;
const packagingSql = `SELECT * FROM packaging_templates WHERE is_active=1 ORDER BY LOWER(template_name)`;

const productResult = await filtered.prepare(productSql).all();
const inventoryResult = await filtered.prepare(inventorySql).all();
const inventoryFallbackResult = await filtered.prepare(inventoryFallbackSql).all();
await filtered.prepare(packagingSql).all();

if (productResult.results.length || inventoryResult.results.length || inventoryFallbackResult.results.length) throw new Error('blocked response enumeration returned rows');
if (prepared.length !== 1 || !prepared[0].includes('packaging_templates')) throw new Error(`unexpected underlying prepare calls: ${JSON.stringify(prepared)}`);
if (counters.catalog !== 1 || counters.inventory !== 2) throw new Error(`unexpected counters ${JSON.stringify(counters)}`);

const payload = mod.decouplePackagingWritePayload({
  ok: true,
  message: 'saved',
  projects: [{ packaging_project_id: 1 }],
  products: [{ product_id: 4 }],
  inventory: [{ site_item_inventory_id: 8 }],
}, counters);
if ('products' in payload || 'inventory' in payload) throw new Error('cross-domain collections were not omitted');
if (payload.projects?.[0]?.packaging_project_id !== 1) throw new Error('Packaging-owned response state was lost');
if (payload.write_boundary?.build !== 289) throw new Error('write boundary build missing');
if (payload.write_boundary?.broad_catalog_queries_skipped !== 1 || payload.write_boundary?.broad_inventory_queries_skipped !== 2) throw new Error('write boundary counters incorrect');
console.log(JSON.stringify({ ok: true, counters, payload }));
"""
with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as tmp:
    tmp.write(boundary_harness)
    boundary_harness_path = tmp.name
try:
    result = subprocess.run(
        ["node", boundary_harness_path, str(boundary_path)],
        cwd=ROOT, text=True, capture_output=True
    )
finally:
    Path(boundary_harness_path).unlink(missing_ok=True)
if result.returncode:
    fail(f"write-response boundary harness failed: {result.stderr.strip() or result.stdout.strip()}")
if not json.loads(result.stdout.strip().splitlines()[-1]).get("ok"):
    fail("write-response boundary harness returned false")
print("PASS: broad response enumeration is filtered without blocking Packaging SQL")
print("PASS: successful write payload omits Catalog and Inventory collections")

runtime_path = ROOT / "public/js/modules/packaging/runtime.mjs"
runtime_harness = r"""
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
    throw new Error('LEGACY PACKAGING POST REACHED ORIGINAL NETWORK');
  }

  if (url.startsWith('/api/admin/packaging-write') && method === 'POST') {
    return new Response(JSON.stringify({
      ok: true,
      message: 'write preserved',
      projects: [{ packaging_project_id: 2 }],
      detail: null,
      write_boundary: {
        build: 289,
        gateway_build: 289,
        packaging_owned_response: true,
        broad_catalog_queries_skipped: 1,
        broad_inventory_queries_skipped: 1
      }
    }), {
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
await mod.onActivate({ registry, definition, user: { role: 'admin', user_id: 7 }, pathname: '/admin/packaging-studio/' });

const healthyResponse = await globalThis.DDAuth.apiFetch('/api/admin/packaging-studio?packaging_project_id=7');
const healthy = await healthyResponse.json();
if (!healthyResponse.ok || !healthy.ok) throw new Error('healthy contractized GET not ok');
if (healthy.products?.[0]?.product_id !== 1 || healthy.inventory?.[0]?.site_item_inventory_id !== 1) throw new Error('owner contracts did not populate healthy GET');
if (calls.some((row) => row.method === 'GET' && row.url.startsWith('/api/admin/packaging-studio'))) throw new Error('healthy GET reached broad legacy transport');

const writeResponse = await globalThis.DDAuth.apiFetch('/api/admin/packaging-studio', {
  method: 'POST', body: JSON.stringify({ action: 'save_project' })
});
const write = await writeResponse.json();
if (!writeResponse.ok || !write.ok || write.message !== 'write preserved') throw new Error('decoupled write failed');
if (write.write_boundary?.build !== 289) throw new Error('write boundary missing');
const gatewayPosts = calls.filter((row) => row.method === 'POST' && row.url.startsWith('/api/admin/packaging-write'));
const directPosts = calls.filter((row) => row.method === 'POST' && row.url.startsWith('/api/admin/packaging-studio'));
if (gatewayPosts.length !== 1 || directPosts.length !== 0) throw new Error(`unexpected POST transport gateway=${gatewayPosts.length} direct=${directPosts.length}`);

const writeStatus = globalThis.DDPackagingContracts.getWriteResponseStatus();
if (!writeStatus.armed || !writeStatus.writeResponseDecoupled || writeStatus.interceptedWriteCount !== 1) throw new Error('write bridge status incorrect');
if (writeStatus.lastBoundary?.build !== 289) throw new Error('last write boundary not captured');

failNarrow = true;
const failedResponse = await globalThis.DDAuth.apiFetch('/api/admin/packaging-studio?packaging_project_id=7');
const failed = await failedResponse.json();
if (failedResponse.status !== 410 || failed.error_code !== 'packaging_legacy_get_retired') throw new Error('Build 288 retired GET behavior regressed');
if (calls.some((row) => row.method === 'GET' && row.url.startsWith('/api/admin/packaging-studio'))) throw new Error('failure GET reached broad legacy transport');

const status = mod.getStatus();
if (status.build !== 289 || status.baseBuild !== 286 || status.artworkPickerBuild !== 287 || status.legacyGetRetirementBuild !== 288) throw new Error('combined build markers incorrect');
if (!status.writeResponseDecoupled || !status.writeResponseBridgeArmed || status.interceptedWriteCount !== 1) throw new Error('combined write status incorrect');
if (!status.legacyGetRetired || status.activeRuntimeBroadLegacyGetReachable !== false) throw new Error('GET retirement regressed');
if (!status.artworkPickerStarted) throw new Error('Build 287 artwork picker did not remain started');

await mod.onDeactivate({ reason: 'test' });
if (globalThis.DDAuth.apiFetch !== originalApiFetch) throw new Error('DDAuth.apiFetch was not fully restored after deactivation');

console.log(JSON.stringify({ ok: true, calls, writeStatus, status }));
"""
with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as tmp:
    tmp.write(runtime_harness)
    runtime_harness_path = tmp.name
try:
    result = subprocess.run(
        ["node", runtime_harness_path, str(runtime_path)],
        cwd=ROOT, text=True, capture_output=True
    )
finally:
    Path(runtime_harness_path).unlink(missing_ok=True)
if result.returncode:
    fail(f"Build 289 runtime harness failed: {result.stderr.strip() or result.stdout.strip()}")
if not json.loads(result.stdout.strip().splitlines()[-1]).get("ok"):
    fail("Build 289 runtime harness returned false")
print("PASS: active Packaging POST routes through the Build 289 write gateway")
print("PASS: Build 288 narrow GET retirement remains intact")
print("PASS: Build 287 artwork picker remains composed")

legacy_ui = read("public/js/admin-packaging-studio.js")
if legacy_ui.count("data.products") != 1 or "state.products = data.products || []" not in legacy_ui:
    fail("legacy UI has an unexpected POST dependency on Product collections")
if legacy_ui.count("state.inventory = data.inventory || state.inventory") < 2:
    fail("legacy UI no longer preserves Inventory state when POST omits inventory")
print("PASS: legacy Packaging UI safely retains contractized cross-domain state after POST")

gateway = read("functions/api/admin/packaging-write.js")
helper = read("functions/api/_lib/packagingWriteBoundary.mjs")
required_gateway_markers = [
    "onRequestPost as legacyPackagingPost",
    "createPackagingResponseFilteredDb",
    "decouplePackagingWritePayload",
    "legacyPackagingPost(delegatedContext)",
    "gateway_path: '/api/admin/packaging-write'",
]
for marker in required_gateway_markers:
    if marker not in gateway:
        fail(f"Packaging write gateway marker missing: {marker}")
if "delete next.products" not in helper or "delete next.inventory" not in helper:
    fail("write boundary does not omit cross-domain collections")
print("PASS: mature Packaging POST logic is delegated, not duplicated")

admin = read("public/js/admin.js")
module_runtime = read("public/js/core/dd-admin-module-runtime.mjs")
definitions = read("public/js/core/dd-module-definitions.mjs")
runtime = read("public/js/modules/packaging/runtime.mjs")
if "dd-admin-module-runtime.mjs?v=289" not in admin:
    fail("Admin does not load Build 289 runtime")
if "build: 289" not in module_runtime:
    fail("module runtime does not report Build 289")
if "entry: '../modules/packaging/runtime.mjs?v=289'" not in definitions:
    fail("Packaging definition does not load Build 289 runtime")
if "behaviorMode: 'write-response-decoupled-legacy-get-retired-content-artwork-runtime'" not in runtime:
    fail("Build 289 Packaging runtime behavior marker missing")
print("PASS: Build 289 routing/version markers")

result = run(["git", "diff", "--name-only", BASE, "HEAD"])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 289 changed-file boundary")

if any(name.endswith(".sql") or "/migrations/" in f"/{name}" for name in actual):
    fail("Build 289 changed SQL/schema")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Build 289 changed Cloudflare binding/config")
for forbidden in {
    "public/js/admin-packaging-studio.js",
    "public/js/modules/packaging/index.mjs",
    "public/js/modules/packaging/artwork-picker.mjs",
    "public/js/modules/packaging/read-retirement.mjs",
    "functions/api/admin/packaging-studio.js",
    "functions/api/admin/packaging-bootstrap.js",
}:
    if forbidden in actual:
        fail(f"Build 289 modified protected compatibility boundary file: {forbidden}")
print("PASS: no mature Packaging Function, legacy UI, SQL/schema, binding/config, Build 286 bridge, Build 287 picker, or Build 288 guard change")

print("BUILD 289 PACKAGING WRITE RESPONSE DECOUPLING: PASS")
print("No Cloudflare resource was contacted.")
