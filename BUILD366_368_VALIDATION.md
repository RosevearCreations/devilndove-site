# Builds 366–368 Validation — Operations Today Tasks Runtime

## Status — BROWSER PROVEN AFTER BUILD 369 / LOCAL REGRESSION REQUIRED

```text
Build 366  readiness-aware Today Tasks GET/read contract
Build 367  passive Commerce & Operations Today Tasks service
Build 368  /admin/today-tasks/ activation and dedicated workspace
Build 369  read-schema alignment after browser diagnostics
```

Today Tasks mutation ownership remains unchanged.

## Initial Firefox proof — 2026-08-25

The top-level runtime and owned-read boundary activated correctly:

```text
contract_status                    200
contract_build                     366
contract_owner                     operations
contract_id                        operations-today-tasks-read
request_time_schema_mutation       false
mutation_ownership_moved           false
action_authority                   /api/admin/today-task-actions
action_mutation_ownership_moved    false
service_registered                 true
service_result_build               366
application_module                 commerce-operations
application_mode                   active
active_application_module          commerce-operations
operations_domain                  operations
runtime_entry                      ../modules/commerce-operations/runtime.mjs?v=367
runtime_build                      367
activation_build                   368
runtime_state                      active
current_domain                     operations
last_pathname                      /admin/today-tasks/
services_ready                     true
required_service_count             1
required_services                  ["operations-today-tasks-read"]
today_tasks_contract_build         366
today_tasks_page_proven            true
creates_network_transport          false
operations_mutation_ownership      false
today_tasks_mutation_ownership     false
contracts_ok                       true
services_ok                        true
```

That proof correctly exposed four stale read assumptions instead of silently converting them to zero:

```text
inventory                 no such table: site_items
accounting                no such table: hst_gst_review_records
failed_api                no such column: status
runtime_incident_details  no such column: incident_id
```

Source/schema audit showed these were query/schema-name drift, not four missing current authorities:

- current Inventory authority is `site_item_inventory`;
- current HST/GST review authority for this task is `accounting_hst_gst_reviews`;
- current runtime incident columns use `runtime_incident_id`, `review_status`, and `endpoint_path`;
- the trailing `:` in parsed missing-table names was parser noise.

The separate historical Build 339 `hst_gst_review_records` parity finding remains on the schema-parity track.

## Build 369 correction

Build 369 preserves the public Build 366 contract and Build 367/368 loader identities while aligning the read implementation to current schema:

```text
public contract build       366
implementation build        369
runtime build               367
activation build            368
```

No GET-time CREATE/ALTER/INSERT is introduced. Done/Ignore/Snooze remains retained POST authority at `/api/admin/today-task-actions`.

## Firefox revalidation — PASS 2026-08-25

User-run browser proof after Build 369:

```text
contract_status                200
contract_build                 366
contract_implementation_build  369
schema_ready                   true
missing_tables                 []
query_error_count              0
query_errors                   []
task_count                     2
task_total                     4
service_registered             true
service_contract_build         366
service_implementation_build   369
application_mode               active
active_application_module      commerce-operations
runtime_build                  367
activation_build               368
runtime_state                  active
current_domain                 operations
last_pathname                  /admin/today-tasks/
services_ready                 true
required_services              ["operations-today-tasks-read"]
today_tasks_page_proven        true
creates_network_transport      false
today_tasks_mutation_ownership false
action_mutation_moved          false
contracts_ok                   true
services_ok                    true
```

Browser side is closed. No Today Tasks action POST was required or executed for proof.

## Remaining local gates

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build362_364_operations_membership_runtime_test.py
python scripts/build365_membership_read_resilience_test.py
python scripts/build366_368_today_tasks_runtime_test.py
python scripts/build369_today_tasks_schema_alignment_test.py
git status --short
```

Expected four PASS results and a clean tree. Do not relabel Builds 366–369 fully validated until those local gates are actually run.
