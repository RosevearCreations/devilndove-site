#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD286_CHANGED_FILES.md",
    "BUILD286_VALIDATION.md",
    "docs/architecture/BUILD286_PACKAGING_API_BOUNDARY_CLEANUP.md",
    "functions/api/admin/packaging-bootstrap.js",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
    "scripts/build286_packaging_boundary_test.py",
}

def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)

def run(args):
    return subprocess.run(args, cwd=ROOT, text=True, capture_output=True)

def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

js_files = [
    "functions/api/admin/packaging-bootstrap.js",
    "public/js/admin.js",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-definitions.mjs",
    "public/js/modules/packaging/index.mjs",
]
for name in js_files:
    result = run(["node", "--check", name])
    if result.returncode:
        fail(f"JavaScript syntax failed for {name}: {result.stderr.strip()}")
print("PASS: Build 286 JavaScript syntax")

bootstrap = read("functions/api/admin/packaging-bootstrap.js")
if "from '../_lib/adminAudit.js';" not in bootstrap:
    fail("Packaging bootstrap adminAudit import does not resolve from functions/api/admin")
if not (ROOT / "functions/api/_lib/adminAudit.js").is_file():
    fail("Packaging bootstrap adminAudit dependency is missing")
print("PASS: Packaging bootstrap Function import resolves")

if "module_boundary" not in bootstrap or "bulk_catalog_rows: 0" not in bootstrap or "bulk_inventory_rows: 0" not in bootstrap:
    fail("narrow bootstrap boundary markers are missing")
if "SELECT product_id,product_number,sku,name,slug,status,product_category" in bootstrap:
    fail("narrow bootstrap still contains bulk Catalog enumeration")
if "ORDER BY LOWER(sii.item_name) LIMIT 1000" in bootstrap or "ORDER BY LOWER(item_name) LIMIT 1000" in bootstrap:
    fail("narrow bootstrap still contains bulk Inventory enumeration")
if "Linked Catalog context only" not in bootstrap or "Linked Inventory context only" not in bootstrap:
    fail("linked-context boundary is not documented in the narrow bootstrap")
print("PASS: narrow Packaging bootstrap excludes bulk Catalog and Inventory enumeration")

module = read("public/js/modules/packaging/index.mjs")
required_markers = [
    "NARROW_PACKAGING_BOOTSTRAP_PATH = '/api/admin/packaging-bootstrap'",
    "narrowBootstrapUrl(input)",
    "legacyEndpointBypassed",
    "serverBootstrapSource",
    "apiBoundaryCleanupBridge: true",
]
for marker in required_markers:
    if marker not in module:
        fail(f"Packaging boundary marker missing: {marker}")

harness = r"""
import { pathToFileURL } from 'node:url';

const calls = [];
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
    bulk_catalog_rows: 0,
    bulk_inventory_rows: 0,
    legacy_broad_get_bypassed: true
  }
};

globalThis.location = { origin: 'https://dev.example', pathname: '/admin/packaging-studio/' };
globalThis.CustomEvent = class CustomEvent {
  constructor(name, init = {}) { this.type = name; this.detail = init.detail; }
};
const messageNode = { textContent: 'Labeling & Packaging System loaded with 0 adopted source references.' };
const refreshButton = { click() {} };
globalThis.document = {
  documentElement: { dataset: {} },
  body: { dataset: {} },
  readyState: 'complete',
  addEventListener() {},
  dispatchEvent() {},
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

const originalApiFetch = async (input, init = {}) => {
  const url = String(input?.url || input || '');
  const method = String(init?.method || input?.method || 'GET').toUpperCase();
  calls.push({ url, method });
  if (url.startsWith('/api/admin/packaging-bootstrap')) {
    return new Response(JSON.stringify(narrowPayload), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.startsWith('/api/admin/packaging-studio') && method === 'GET') {
    return new Response(JSON.stringify({
      ok: true,
      products: [{ product_id: 999, name: 'legacy product' }],
      inventory: [{ site_item_inventory_id: 999, item_name: 'legacy inventory' }]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.startsWith('/api/admin/packaging-studio') && method === 'POST') {
    return new Response(JSON.stringify({ ok: true, message: 'write preserved' }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify({ ok: false }), { status: 404, headers: { 'content-type': 'application/json' } });
};
globalThis.DDAuth = { apiFetch: originalApiFetch };

const services = {
  'catalog-read': { list: async () => ({ rows: [{ product_id: 1, name: 'contract product' }], count: 1 }) },
  'inventory-read': { list: async () => ({ rows: [{ site_item_inventory_id: 1, item_name: 'contract inventory' }], count: 1 }) },
  'content-media': { list: async () => ({ rows: [{ media_asset_id: 1, display_name: 'contract art' }], count: 1 }) },
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

const getResponse = await globalThis.DDAuth.apiFetch('/api/admin/packaging-studio?packaging_project_id=7');
const data = await getResponse.json();
if (!data.ok) throw new Error('contractized GET not ok');
if (data.products?.[0]?.product_id !== 1) throw new Error('Catalog contract did not replace products');
if (data.inventory?.[0]?.site_item_inventory_id !== 1) throw new Error('Inventory contract did not replace inventory');
if (data.content_media?.[0]?.media_asset_id !== 1) throw new Error('Content contract did not attach media');
if (data.module_boundary?.bulk_catalog_rows !== 0 || data.module_boundary?.bulk_inventory_rows !== 0) throw new Error('narrow boundary marker lost');
const legacyGets = calls.filter((row) => row.method === 'GET' && row.url.startsWith('/api/admin/packaging-studio'));
if (legacyGets.length !== 0) throw new Error(`healthy GET contacted legacy endpoint ${legacyGets.length} time(s)`);
const narrowGets = calls.filter((row) => row.method === 'GET' && row.url.startsWith('/api/admin/packaging-bootstrap'));
if (narrowGets.length !== 1) throw new Error(`expected one narrow GET, saw ${narrowGets.length}`);

const status = mod.getStatus();
const bootstrap = globalThis.DDPackagingContracts.getBootstrapStatus();
if (!status.bridgeInstalled || !status.bootstrapContractized) throw new Error('bridge/status not active');
if (bootstrap.serverBootstrapSource !== 'packaging-bootstrap') throw new Error(`unexpected bootstrap source ${bootstrap.serverBootstrapSource}`);
if (bootstrap.legacyEndpointBypassed !== true) throw new Error('legacy endpoint was not marked bypassed');
if (bootstrap.catalogSource !== 'contract' || bootstrap.inventorySource !== 'contract' || bootstrap.contentMediaSource !== 'contract') throw new Error('contract source status incorrect');

const postResponse = await globalThis.DDAuth.apiFetch('/api/admin/packaging-studio', {
  method: 'POST',
  body: JSON.stringify({ action: 'save_project' })
});
const postData = await postResponse.json();
if (!postData.ok || postData.message !== 'write preserved') throw new Error('Packaging write path changed');
const posts = calls.filter((row) => row.method === 'POST' && row.url.startsWith('/api/admin/packaging-studio'));
if (posts.length !== 1) throw new Error('Packaging POST did not remain on existing endpoint');

await mod.onDeactivate({ reason: 'test' });
if (globalThis.DDAuth.apiFetch !== originalApiFetch) throw new Error('apiFetch was not restored on deactivate');

console.log(JSON.stringify({ ok: true, calls, bootstrap }));
"""
with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as tmp:
    tmp.write(harness)
    harness_path = tmp.name
try:
    result = subprocess.run(
        ["node", harness_path, str(ROOT / "public/js/modules/packaging/index.mjs")],
        cwd=ROOT, text=True, capture_output=True
    )
finally:
    Path(harness_path).unlink(missing_ok=True)

if result.returncode:
    fail(f"Packaging boundary runtime harness failed: {result.stderr.strip() or result.stdout.strip()}")
payload = json.loads(result.stdout.strip().splitlines()[-1])
if not payload.get("ok"):
    fail("Packaging boundary runtime harness returned false")
print("PASS: healthy Packaging GET bypasses the legacy broad endpoint")
print("PASS: Packaging writes remain on the existing endpoint")

if "legacy-endpoint-fallback" not in module or "rollback GET" not in module:
    fail("explicit legacy rollback behavior is missing")
print("PASS: rollback GET remains explicit and observable")

result = run([
    "git", "diff", "--name-only",
    "125a4a6b77485b582d93ca30504b2333b7cb3476",
    "9a4dde6b974e0a4885b4fb91fa83e4cb6c666f20"
])
if result.returncode:
    fail(f"git changed-file check failed: {result.stderr.strip()}")
actual = {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}
if actual != EXPECTED:
    fail(f"changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 286 changed-file boundary")

if any(name.endswith(".sql") for name in actual):
    fail("SQL/schema file changed in Build 286")
if any(name in {"wrangler.toml", "wrangler.json", "wrangler.jsonc"} or name.startswith(".dev.vars") for name in actual):
    fail("Cloudflare binding/config file changed in Build 286")
if "functions/api/admin/packaging-studio.js" in actual:
    fail("legacy Packaging Function was modified instead of retained as rollback/write authority")
print("PASS: no D1 migration, SQL/schema, or Cloudflare binding/config change")

print("BUILD 286 PACKAGING API BOUNDARY CLEANUP: PASS")
print("No Cloudflare resource was contacted.")
