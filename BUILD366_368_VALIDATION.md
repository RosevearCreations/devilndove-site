# Builds 366–368 Validation — Operations Today Tasks Runtime

## Status — BROWSER RUNTIME PROVEN / BUILD 366 READ REQUIRES BUILD 369 ALIGNMENT / LOCAL REQUIRED

```text
Build 366  readiness-aware Today Tasks GET/read contract
Build 367  passive Commerce & Operations Today Tasks service
Build 368  /admin/today-tasks/ activation and dedicated workspace
Build 369  read-schema alignment after browser diagnostics
```

Today Tasks mutation ownership remains unchanged.

## Firefox proof — 2026-08-25

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

The Build 366 readiness diagnostics correctly surfaced four failed reads instead of silently reporting zero:

```text
inventory                 no such table: site_items
accounting                no such table: hst_gst_review_records
failed_api                no such column: status
runtime_incident_details  no such column: incident_id
```

The original missing-table parser also retained the punctuation suffix, producing `site_items:` and `hst_gst_review_records:`.

These diagnostics exposed query/schema-name drift rather than four true missing authorities:

- current Inventory authority is `site_item_inventory`, not `site_items`;
- current HST/GST review authority is `accounting_hst_gst_reviews`, not `hst_gst_review_records`;
- current runtime incident columns use `runtime_incident_id`, `review_status`, and `endpoint_path`.

The separate historical Build 339 `hst_gst_review_records` parity finding remains on the schema-parity track; Today Tasks simply should not query that legacy name.

## Build 369 correction

Build 369 preserves the public Build 366 contract and Build 367/368 loader identities while aligning the read implementation to current schema:

```text
public contract build       366
implementation build        369
runtime build               367
activation build            368
```

It also normalizes D1 missing-table extraction so punctuation before `SQLITE_ERROR` is not treated as part of the table name.

No GET-time CREATE/ALTER/INSERT is introduced. Done/Ignore/Snooze remains retained POST authority at `/api/admin/today-task-actions`.

## Remaining local gates

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build362_364_operations_membership_runtime_test.py
python scripts/build365_membership_read_resilience_test.py
python scripts/build366_368_today_tasks_runtime_test.py
python scripts/build369_today_tasks_schema_alignment_test.py
git status --short
```

Expected four PASS results and a clean tree.

## Browser revalidation after Build 369

Re-run the read-only Today Tasks contract/runtime proof. Expected:

```text
contract_status              200
contract_build               366
contract_implementation_build 369
query_error_count            0
missing_tables               []
schema_ready                 true
runtime_build                367
activation_build             368
today_tasks_page_proven      true
```

If any diagnostic remains, use its exact `key`, `message`, and `missing_table` field. Do not click Done, Ignore, or Snooze as part of this proof.
