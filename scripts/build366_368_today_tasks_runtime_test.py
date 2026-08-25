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
actions = read('functions/api/admin/today-task-actions.js')
client_service = read('public/js/modules/commerce-operations/operations-today-tasks-read-service.mjs')
runtime = read('public/js/modules/commerce-operations/runtime.mjs')
groups = read('public/js/core/dd-application-module-groups.mjs')
admin_js = read('public/js/admin.js')
page = read('admin/today-tasks/index.html')
ui = read('public/js/admin-today-tasks.js')
definitions = read('public/js/core/dd-module-definitions.mjs')
custom_requests = read('functions/api/admin/custom-requests.js')

# Build 366 — readiness-aware Today Tasks read authority is GET-only/non-mutating.
assert 'export const BUILD = 366' in read_service
assert "export const CONTRACT_ID = 'operations-today-tasks-read'" in read_service
assert "export const OWNER = 'operations'" in read_service
assert 'request_time_schema_mutation: false' in read_service
assert 'mutation_ownership_moved: false' in read_service
assert 'schema_ready: issues.length === 0' in read_service
assert 'missing_tables: missingTables' in read_service
assert 'query_errors: issues' in read_service
assert 'hst_gst_review_records' in read_service
assert 'today_task_actions' in read_service
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in read_service

get_section = section(legacy_get, 'export async function onRequestGet')
assert 'readTodayTasks(db' in get_section
assert 'request_time_schema_mutation: false' in get_section
assert "error_code: 'today_tasks_read_failed'" in get_section
for forbidden in ['CREATE TABLE', 'ALTER TABLE', 'INSERT INTO', 'UPDATE ', 'DELETE FROM']:
    assert forbidden not in get_section

# Build 366 owned wrapper remains GET-only and explicitly preserves action authority.
assert 'export const BUILD = 366' in contract
assert "export const CONTRACT_ID = 'operations-today-tasks-read'" in contract
assert "export const OWNER = 'operations'" in contract
assert "import { onRequestGet as legacyGet } from '../today-tasks.js';" in contract
assert 'request_time_schema_mutation: false' in contract
assert 'mutation_ownership_moved: false' in contract
assert "action_authority: '/api/admin/today-task-actions'" in contract
assert 'action_mutation_ownership_moved: false' in contract
assert 'onRequestPost' not in contract

# Done/Ignore/Snooze mutation authority remains the retained POST endpoint.
assert 'export async function onRequestPost' in actions
assert 'today_task_actions' in actions
assert 'CREATE TABLE IF NOT EXISTS today_task_actions' in actions
assert "['completed','ignored','snoozed']" in actions

# Build 367 passive browser service: registration itself performs no request.
assert 'export const BUILD = 367' in client_service
assert 'export const CONTRACT_BUILD = 366' in client_service
assert "export const SERVICE_ID = 'operations-today-tasks-read'" in client_service
assert "export const OWNER = 'operations'" in client_service
assert "export const ROUTE = '/api/admin/contracts/operations-today-tasks-read'" in client_service
registration = section(client_service, 'export function ensureOperationsTodayTasksReadService')
assert 'apiFetch(' not in registration
assert 'fetch(' not in registration

# Build 367/368 shared Commerce runtime adds a page-specific Today Tasks gate.
assert 'const BUILD = 367;' in runtime
assert 'const ACTIVATION_BUILD = 368;' in runtime
assert "const TODAY_TASKS_RUNTIME_PAGE = '/admin/today-tasks/'" in runtime
assert "const TODAY_TASKS_REQUIRED_SERVICES = Object.freeze(['operations-today-tasks-read'])" in runtime
assert 'ensureOperationsTodayTasksReadService(registry)' in runtime
assert "const TODAY_TASKS_ACTION_AUTHORITY = '/api/admin/today-task-actions'" in runtime
assert 'todayTasksMutationOwnership: false' in runtime
assert 'ownsTodayTasksMutations: false' in runtime
assert 'todayTasksActionMutationOwnershipMoved: false' in runtime
assert 'createsNetworkTransport: false' in runtime
assert 'apiFetch(' not in runtime
assert 'fetch(' not in runtime
assert 'currentTodayTasksPageProven' in runtime

# Build 368 Core coverage includes the dedicated page and advances only the shared Commerce runtime.
commerce = section(groups, "id: 'commerce-operations'", "id: 'creative-production'")
assert "entry: '../modules/commerce-operations/runtime.mjs?v=367'" in commerce
assert "runtimeDomains: Object.freeze(['catalog', 'inventory', 'operations'])" in commerce
assert "'/admin/today-tasks/'" in groups
assert 'OPERATIONS_TODAY_TASKS_READ_CONTRACT_BUILD = 366' in groups
assert 'RUNTIME_OPERATIONS_BUILD = 367' in groups
assert 'OPERATIONS_RUNTIME_COVERAGE_BUILD = 368' in groups
assert 'todayTasksMutationOwnershipMovedByTopLevelRuntime: false' in groups
assert 'dd-admin-module-runtime.mjs?v=368' in admin_js

# The route was already classified as Operations; Build 368 supplies the missing real page.
operations_definition = section(definitions, "id: 'operations'", "id: 'creative'")
assert "'/admin/today-tasks'" in operations_definition
assert '/public/js/admin.js?v=368' in page
assert '/public/js/admin-today-tasks.js?v=368' in page
assert page.index('/public/js/admin.js?v=368') < page.index('/public/js/admin-today-tasks.js?v=368')
assert 'id="todayTasksAdminMount"' in page
assert '/api/admin/contracts/operations-today-tasks-read' in ui
assert '/api/admin/today-task-actions' in ui

# Custom Requests remains intentionally outside this batch because its GET is still schema-coupled.
assert 'async function ensureSchema(db)' in custom_requests
assert 'CREATE TABLE IF NOT EXISTS custom_requests' in custom_requests
assert 'ALTER TABLE' in custom_requests

print('BUILDS 366-368 TODAY TASKS RUNTIME: PASS')
print('No Cloudflare resource was contacted.')
