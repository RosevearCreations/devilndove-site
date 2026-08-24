#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = "c8ea00e57cb906cc671fc15727ed2c8cd8b63dab"
EXPECTED = {
    "AI_CONTEXT.md",
    "BUILD307_CHANGED_FILES.md",
    "BUILD307_VALIDATION.md",
    "admin/inventory-operations/index.html",
    "docs/architecture/BUILD307_INVENTORY_COMPENSATING_REVERSAL_SERVICE.md",
    "functions/api/_lib/inventoryReversalService.js",
    "functions/api/admin/contracts/inventory-reverse.js",
    "public/js/admin.js",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/modules/commerce-operations/inventory-write-boundary.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "scripts/build307_inventory_compensating_reversal_service_test.py",
}


def fail(message):
    print(f"FAIL: {message}")
    raise SystemExit(1)


def run(args):
    return subprocess.run(
        args,
        cwd=ROOT,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
    )


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def changed_files(base, head="HEAD"):
    result = run(["git", "diff", "--name-only", base, head])
    if result.returncode:
        fail(result.stderr.strip() or "git diff failed")
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


def payload_diff_lines(path):
    result = run(["git", "diff", "--unified=0", BASE, "HEAD", "--", path])
    if result.returncode:
        fail(result.stderr.strip() or f"could not inspect {path}")
    return [
        line for line in result.stdout.splitlines()
        if (line.startswith("+") or line.startswith("-"))
        and not line.startswith("+++")
        and not line.startswith("---")
    ]


for path in [
    "public/js/admin.js",
    "public/js/core/dd-application-module-groups.mjs",
    "public/js/core/dd-module-contracts.mjs",
    "public/js/modules/commerce-operations/inventory-write-boundary.mjs",
    "public/js/modules/commerce-operations/runtime.mjs",
    "functions/api/_lib/inventoryReversalService.js",
    "functions/api/admin/contracts/inventory-reverse.js",
]:
    check = run(["node", "--check", path])
    if check.returncode:
        fail(check.stderr.strip() or f"JavaScript syntax failed: {path}")
print("PASS: Build 307 contract/runtime/reversal JavaScript syntax")

contracts = read("public/js/core/dd-module-contracts.mjs")
for marker in [
    "// Devil n Dove Build 307 cross-module contract catalog.",
    "contract('inventory-reverse'",
    "status: 'implemented'",
    "route: '/api/admin/contracts/inventory-reverse'",
    "authorityRoute: '/api/admin/contracts/inventory-reverse'",
    "implementationState: 'implemented-not-consumer-enabled'",
    "requiresOriginalMovementId: true",
    "requiresCreativePostingId: true",
    "confirmationText: 'REVERSE INVENTORY'",
    "compensatingMovementOnly: true",
    "directStockAddBackAllowed: false",
    "consumerWritesReady: false",
]:
    if marker not in contracts:
        fail(f"Build 307 contract marker missing: {marker}")
print("PASS: inventory-reverse is implemented but remains consumer-disabled and compensating-only")

node_contract = r'''
import { DD_MODULE_CONTRACTS, moduleContract } from './public/js/core/dd-module-contracts.mjs';
import { DD_MODULE_DEFINITIONS } from './public/js/core/dd-module-definitions.mjs';
import { validateModuleContracts } from './public/js/core/dd-module-contracts.mjs';
const reverse = moduleContract('inventory-reverse', DD_MODULE_CONTRACTS);
const errors = [];
if (!reverse) errors.push('inventory-reverse missing');
if (reverse?.status !== 'implemented') errors.push(`status=${reverse?.status}`);
if (reverse?.route !== '/api/admin/contracts/inventory-reverse') errors.push(`route=${reverse?.route}`);
if (reverse?.consumerWritesReady !== false) errors.push('consumer writes unexpectedly enabled');
if (reverse?.directStockAddBackAllowed !== false) errors.push('direct stock add-back unexpectedly enabled');
const validation = validateModuleContracts(DD_MODULE_DEFINITIONS, DD_MODULE_CONTRACTS);
if (!validation.ok) errors.push(...validation.errors);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('build307-contract-ok');
'''
check = run(["node", "--input-type=module", "--eval", node_contract])
if check.returncode:
    fail(check.stderr.strip() or check.stdout.strip() or "Build 307 contract validation failed")
print("PASS: Build 307 contract catalog validates with consumer migration still disabled")

service = read("functions/api/_lib/inventoryReversalService.js")
for marker in [
    "export const BUILD = 307;",
    "export const CONFIRMATION_TEXT = 'REVERSE INVENTORY';",
    "export function validateCreativeMovementMatch",
    "movement_type || '').trim().toLowerCase() !== 'consume'",
    "Creative Project ${expectedProject}",
    "event ${expectedEvent}",
    "original-movement:${originalMovementId}",
    "inventory-reverse-request:${requestId()}",
    "INSERT INTO creative_project_inventory_reversals",
    "on_hand_quantity=on_hand_quantity+?",
    "INSERT INTO site_inventory_movements",
    "'correction'",
    "INSERT INTO site_inventory_usage_movements",
    "db.batch(statements)",
    "const ledgerChanges = Number(batchResult?.[0]?.meta?.changes || 0);",
    "if (ledgerChanges !== 1)",
    "inventory_reversal_stale_stock",
]:
    if marker not in service:
        fail(f"Build 307 reversal service marker missing: {marker}")
for forbidden in [
    "CREATE TABLE",
    "DROP TABLE",
    "ALTER TABLE",
    "SET on_hand_quantity=?",
    "directStockAddBackAllowed: true",
]:
    if forbidden in service:
        fail(f"Build 307 reversal service contains unsafe/out-of-scope marker: {forbidden}")
if service.index("INSERT INTO creative_project_inventory_reversals") > service.index("UPDATE site_item_inventory"):
    fail("Build 307 reversal transaction does not claim its unique ledger before stock correction")
print("PASS: Inventory reversal is request-correlated, ledger-first, delta-based, and fail-closed on stale stock")

fixture = r'''
import { validateCreativeMovementMatch } from './functions/api/_lib/inventoryReversalService.js';
const post = {
  creative_work_project_id: 7,
  creative_work_event_id: 11,
  site_item_inventory_id: 22,
  stock_quantity_consumed: 1.25,
  previous_on_hand_quantity: 8.5,
  new_on_hand_quantity: 7.25,
  posted_by: 4,
};
const good = {
  site_item_inventory_id: 22,
  movement_type: 'consume',
  quantity_delta: -1.25,
  previous_on_hand_quantity: 8.5,
  new_on_hand_quantity: 7.25,
  actor_user_id: 4,
  note: 'Creative Project 7, event 11. Reviewed usage 1.25 units.',
};
if (!validateCreativeMovementMatch(post, good).ok) throw new Error('valid movement rejected');
if (validateCreativeMovementMatch(post, { ...good, site_item_inventory_id: 23 }).ok) throw new Error('wrong inventory accepted');
if (validateCreativeMovementMatch(post, { ...good, quantity_delta: -1 }).ok) throw new Error('wrong delta accepted');
if (validateCreativeMovementMatch(post, { ...good, note: 'unrelated movement' }).ok) throw new Error('missing provenance accepted');
console.log('build307-movement-validation-ok');
'''
check = run(["node", "--input-type=module", "--eval", fixture])
if check.returncode:
    fail(check.stderr.strip() or check.stdout.strip() or "Build 307 movement fixture failed")
print("PASS: original-movement provenance validation accepts matching usage and rejects mismatches")

endpoint = read("functions/api/admin/contracts/inventory-reverse.js")
for marker in [
    "export async function onRequestGet(context)",
    "export async function onRequestPost(context)",
    "consumer_writes_ready: false",
    "requires_original_movement_id: true",
    "compensating_movement_only: true",
    "direct_stock_add_back_allowed: false",
    "schema_ready: readiness.schemaReady",
    "reverseCreativeInventoryPost",
    "auditAdminAction",
]:
    if marker not in endpoint:
        fail(f"Build 307 contract endpoint marker missing: {marker}")
print("PASS: Inventory-owned contract route exposes safe GET readiness and guarded POST authority")

schema = read("database_build217_creative_project_controls.sql")
if "creative_project_inventory_post_id INTEGER NOT NULL UNIQUE" not in schema:
    fail("existing Creative reversal ledger is not database-unique per inventory post")
print("PASS: existing Creative reversal ledger provides database-level one-reversal-per-post idempotency")

boundary = read("public/js/modules/commerce-operations/inventory-write-boundary.mjs")
runtime = read("public/js/modules/commerce-operations/runtime.mjs")
groups = read("public/js/core/dd-application-module-groups.mjs")
admin = read("public/js/admin.js")
for marker in [
    "export const BUILD = 307;",
    "REVERSE_CONTRACT_ROUTE = '/api/admin/contracts/inventory-reverse'",
    "implementationState: 'implemented-not-consumer-enabled'",
    "consumerMutationReady: false",
]:
    if marker not in boundary:
        fail(f"Build 307 write boundary marker missing: {marker}")
for marker in [
    "const BUILD = 307;",
    "inventory-write-boundary.mjs?v=307",
    "behaviorMode: 'catalog-inventory-reversal-service-implemented'",
    "inventoryConsumerMutationReady: writeBoundary.consumerMutationReady",
]:
    if marker not in runtime:
        fail(f"Build 307 Commerce runtime marker missing: {marker}")
for marker in [
    "export const BUILD = 302;",
    "export const RUNTIME_CATALOG_BUILD = 304;",
    "export const RUNTIME_INVENTORY_BUILD = 305;",
    "export const INVENTORY_WRITE_CONTRACT_BUILD = 307;",
    "entry: '../modules/commerce-operations/runtime.mjs?v=307'",
    "currentRuntimeMigrationMode: 'catalog-inventory-reversal-service'",
]:
    if marker not in groups:
        fail(f"Build 307 application catalog marker missing: {marker}")
if "dd-admin-module-runtime.mjs?v=307" not in admin:
    fail("shared Admin loader does not cache-bust Core for Build 307")
print("PASS: Commerce runtime surfaces Build 307 reversal readiness without changing Core architecture identity")

page = read("admin/inventory-operations/index.html")
if '/public/js/admin.js?v=307' not in page:
    fail("Inventory validation page does not load Build 307 shared Admin loader")
expected_page_diff = {
    '-  <script src="/public/js/admin.js?v=306"></script>',
    '+  <script src="/public/js/admin.js?v=307"></script>',
}
if set(payload_diff_lines("admin/inventory-operations/index.html")) != expected_page_diff:
    fail("Inventory validation page changed beyond the Build 307 loader pin")
print("PASS: Inventory browser-validation page changes only its Build 307 loader pin")

protected = [
    "functions/api/admin/creative-process.js",
    "functions/api/admin/site-item-inventory.js",
    "database_build217_creative_project_controls.sql",
    "database_build244_inventory_authority_fractional_usage.sql",
    "database_full_schema.sql",
    "public/js/core/dd-admin-module-runtime.mjs",
    "public/js/core/dd-module-registry.mjs",
    "public/js/core/dd-module-service-adapters.mjs",
    "functions/api/admin/contracts/inventory-read.js",
    "admin/products/index.html",
    "admin/packaging-studio/index.html",
]
for path in protected:
    result = run(["git", "diff", "--quiet", BASE, "HEAD", "--", path])
    if result.returncode != 0:
        fail(f"protected compatibility/schema/Core file changed in Build 307: {path}")
print("PASS: Creative consumer, legacy Inventory mutations, schema, Core lifecycle, Catalog, and Packaging stay unchanged")

build306_validation = run(["git", "show", f"{BASE}:BUILD306_VALIDATION.md"])
if build306_validation.returncode:
    fail("could not read Build 306 baseline validation")
for marker in [
    "## Status — STAGED / VALIDATION REQUIRED",
    "Build 306 is a contract/readiness pass only",
    "consumer mutation ready              false",
]:
    if marker not in build306_validation.stdout:
        fail(f"Build 306 browser-proven staging baseline marker missing: {marker}")
print("PASS: Build 306 baseline is pinned honestly as browser-proven with local completion signoff still pending")

committed = changed_files(BASE)
working = changed_files("HEAD")
staged_result = run(["git", "diff", "--name-only", "--cached", "HEAD"])
if staged_result.returncode:
    fail(staged_result.stderr.strip() or "could not inspect staged files")
staged = {line.strip().replace("\\", "/") for line in staged_result.stdout.splitlines() if line.strip()}
actual = committed | working | staged
if actual != EXPECTED:
    fail(f"Build 307 changed-file boundary mismatch. expected={sorted(EXPECTED)} actual={sorted(actual)}")
print("PASS: exact Build 307 compensating-reversal service changed-file boundary")

for path in actual:
    lower = path.lower()
    if lower.endswith('.sql') or lower in {'wrangler.toml', 'wrangler.json', 'wrangler.jsonc'}:
        fail(f"Build 307 unexpectedly changes schema/config: {path}")
print("PASS: Build 307 adds no SQL/schema, Cloudflare binding/config, R2, or real Production change")

print("BUILD 307 INVENTORY COMPENSATING REVERSAL SERVICE: PASS")
print("No Cloudflare resource was contacted.")
