# Build 369 Validation — Today Tasks Schema Alignment

## Status — BROWSER PROVEN / LOCAL REGRESSION REQUIRED

Build 369 preserves the Build 366 Today Tasks public contract and Build 367/368 loader boundary while aligning the read implementation to current Development schema.

```text
contract build          366
implementation build    369
runtime build           367
activation build        368
```

## Initial browser defect evidence

The first Build 366 browser proof returned HTTP 200 and a fully active Commerce runtime, but readiness exposed four stale query assumptions:

```text
site_items missing
hst_gst_review_records missing
runtime_incidents.status missing
runtime_incidents.incident_id missing
```

Source/schema audit showed current authorities are `site_item_inventory`, `accounting_hst_gst_reviews`, and runtime incident columns `runtime_incident_id`, `review_status`, and `endpoint_path`. The missing-table parser also retained a trailing colon from D1 error text.

## Build 369 correction

Build 369 updates only the Today Tasks read layer and metadata:

- `site_items` -> `site_item_inventory` with current reorder fields;
- `hst_gst_review_records` -> `accounting_hst_gst_reviews`;
- `status` -> `review_status` for runtime incidents;
- `incident_id` -> `runtime_incident_id`;
- `request_path` -> `endpoint_path`;
- missing-table parser strips punctuation before `SQLITE_ERROR`.

The historical Build 339 `hst_gst_review_records` parity finding remains separate; Build 369 does not erase or repair that schema-parity record.

No loader, page activation, action POST, SQL migration, or mutation authority moved.

## Firefox revalidation — PASS 2026-08-25

User-run browser proof:

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

The browser side is closed.

## Remaining local regression

```bash
python scripts/build366_368_today_tasks_runtime_test.py
python scripts/build369_today_tasks_schema_alignment_test.py
```

Expected:

```text
BUILDS 366-368 TODAY TASKS RUNTIME: PASS
No Cloudflare resource was contacted.
BUILD 369 TODAY TASKS SCHEMA ALIGNMENT: PASS
No Cloudflare resource was contacted.
```

Do not mark Build 369 fully validated until the local regression is supplied.
