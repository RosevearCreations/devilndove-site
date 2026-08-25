from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def section(text, start, end=None):
    i = text.index(start)
    j = text.index(end, i) if end else len(text)
    return text[i:j]


read_service = read('functions/api/_lib/todayTasksReadService.js')
legacy_get = read('functions/api/admin/today-tasks.js')
contract = read('functions/api/admin/contracts/operations-today-tasks-read.js')
client_service = read('public/js/modules/commerce-operations/operations-today-tasks-read-service.mjs')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
schema = read('database_full_schema.sql')

# Build 369 hardens the Build 366 read implementation without changing loader identity.
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

# Build 369 does not advance or alter the proven Build 367/368 loader boundary.
assert 'const BUILD = 367;' in runtime
assert 'const ACTIVATION_BUILD = 368;' in runtime
assert 'todayTasksMutationOwnership: false' in runtime
assert 'createsNetworkTransport: false' in runtime
assert "entry: '../modules/commerce-operations/runtime.mjs?v=367'" in groups
assert 'OPERATIONS_RUNTIME_COVERAGE_BUILD = 368' in groups
assert 'todayTasksMutationOwnershipMovedByTopLevelRuntime: false' in groups

print('BUILD 369 TODAY TASKS SCHEMA ALIGNMENT: PASS')
print('No Cloudflare resource was contacted.')
