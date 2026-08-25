from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


def numeric_constant(text, name):
    match = re.search(rf"(?:export\s+)?const\s+{re.escape(name)}\s*=\s*(\d+)", text)
    assert match, f'Missing numeric constant: {name}'
    return int(match.group(1))


def cache_version(text, pattern):
    match = re.search(pattern, text)
    assert match, f'Missing cache-busted path matching: {pattern}'
    return int(match.group(1))


read_service = read('functions/api/_lib/todayTasksReadService.js')
legacy_get = read('functions/api/admin/today-tasks.js')
contract = read('functions/api/admin/contracts/operations-today-tasks-read.js')
client_service = read('public/js/modules/commerce-operations/operations-today-tasks-read-service.mjs')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
schema = read('database_full_schema.sql')

# Build 369 hardens the Build 366 read implementation.
assert 'export const BUILD = 366' in read_service
assert 'export const IMPLEMENTATION_BUILD = 369' in read_service
assert "export const CONTRACT_ID = 'operations-today-tasks-read'" in read_service
assert 'implementation_build: IMPLEMENTATION_BUILD' in read_service

# D1 missing-table parser must not keep the punctuation before SQLITE_ERROR.
assert r"no such table:\s*([^\s:]+)" in read_service

# Inventory Today Tasks uses the current Inventory-owned table/columns.
assert 'FROM site_item_inventory' in read_service
assert 'is_on_reorder_list' in read_service
assert 'reorder_level' in read_service
assert 'do_not_reorder' in read_service
assert 'FROM site_items ' not in read_service
assert 'reorder_threshold' not in read_service
assert 'reorder_status' not in read_service

# Accounting evidence task uses the current aggregate schema authority.
assert 'FROM accounting_hst_gst_reviews' in read_service
assert 'remittance_evidence_url' in read_service
assert 'FROM hst_gst_review_records' not in read_service

# Runtime incident reads align to the current runtime_incidents schema.
assert 'runtime_incident_id AS incident_id' in read_service
assert 'endpoint_path AS request_path' in read_service
assert "COALESCE(review_status,'open')" in read_service
assert 'SELECT incident_id' not in read_service
assert "COALESCE(status,'open')" not in read_service

# Current aggregate schema supports the aligned names.
assert 'CREATE TABLE IF NOT EXISTS site_item_inventory (' in schema
assert 'is_on_reorder_list INTEGER' in schema
assert 'reorder_level REAL' in schema
assert 'CREATE TABLE IF NOT EXISTS accounting_hst_gst_reviews (' in schema
assert 'remittance_evidence_url TEXT' in schema
assert 'CREATE TABLE IF NOT EXISTS runtime_incidents (' in schema
assert 'runtime_incident_id INTEGER PRIMARY KEY AUTOINCREMENT' in schema
assert 'endpoint_path TEXT' in schema
assert "review_status TEXT DEFAULT 'open'" in schema

# Read path still performs no mutation.
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in read_service

# Direct GET and owned contract expose implementation build 369 while public contract stays 366.
assert 'IMPLEMENTATION_BUILD' in legacy_get
assert 'implementation_build: IMPLEMENTATION_BUILD' in legacy_get
assert 'export const BUILD = 366' in contract
assert 'export const IMPLEMENTATION_BUILD = 369' in contract
assert 'implementation_build: IMPLEMENTATION_BUILD' in contract
assert 'action_mutation_ownership_moved: false' in contract
assert 'onRequestPost' not in contract

# Passive service surfaces the implementation build; registration stays passive.
assert 'implementationBuild: Number(data.implementation_build || 0)' in client_service
registration = section(client_service, 'export function ensureOperationsTodayTasksReadService')
assert 'apiFetch(' not in registration
assert 'fetch(' not in registration

# Later Commerce expansion may advance the shared loader, but must preserve the proven Today Tasks boundary.
assert numeric_constant(runtime, 'BUILD') >= 367
assert numeric_constant(runtime, 'ACTIVATION_BUILD') >= 368
assert "const TODAY_TASKS_RUNTIME_PAGE = '/admin/today-tasks/'" in runtime
assert "const TODAY_TASKS_REQUIRED_SERVICES = Object.freeze(['operations-today-tasks-read'])" in runtime
assert 'todayTasksMutationOwnership: false' in runtime
assert 'createsNetworkTransport: false' in runtime
commerce = section(groups, "id: 'commerce-operations'", "id: 'creative-production'")
assert cache_version(commerce, r"entry:\s*'\.\./modules/commerce-operations/runtime\.mjs\?v=(\d+)'") >= 367
assert numeric_constant(groups, 'OPERATIONS_RUNTIME_COVERAGE_BUILD') >= 368
assert 'todayTasksMutationOwnershipMovedByTopLevelRuntime: false' in groups

print('BUILD 369 TODAY TASKS SCHEMA ALIGNMENT: PASS')
print('No Cloudflare resource was contacted.')
