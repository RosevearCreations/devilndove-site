# Builds 370–372 Validation — Operations Custom Requests Runtime

## Status — BROWSER PROVEN / LOCAL REGRESSION REQUIRED

```text
Build 370  Custom Requests startup-read contract/readiness
Build 371  passive Commerce & Operations Custom Requests service
Build 372  /admin/custom-request/ activation
```

Custom Requests mutation ownership remains unchanged.

## Firefox proof — 2026-08-25

Development `/admin/custom-request/` returned the exact target state:

```text
contract_status                       200
contract_build                        370
contract_owner                        operations
contract_id                           operations-custom-requests-read
schema_ready                          true
missing_tables                        []
checked_table_count                   23
request_time_schema_mutation          false
mutation_ownership_moved              false
compatibility_post_authority          /api/admin/custom-requests
compatibility_post_mutation_moved     false
marketplace_csv_legacy_outside_read   true
request_count                         0
service_registered                    true
service_build                         370
service_schema_ready                  true
service_missing_tables                []
application_module                    commerce-operations
application_mode                      active
active_application_module             commerce-operations
operations_domain                     operations
runtime_definition                    commerce-operations
runtime_entry                         ../modules/commerce-operations/runtime.mjs?v=371
runtime_build                         371
activation_build                      372
runtime_state                         active
current_domain                        operations
last_pathname                         /admin/custom-request/
services_ready                        true
required_service_count                1
required_services                     ["operations-custom-requests-read"]
custom_requests_contract_build        370
custom_requests_page_proven           true
creates_network_transport             false
operations_mutation_ownership         false
custom_requests_mutation_ownership    false
custom_requests_mutation_moved        false
marketplace_csv_outside_contract      true
contracts_ok                          true
services_ok                           true
```

This closes the browser side of Builds 370–372. The 23-table startup read was fully schema-ready in Development and no Custom Requests mutation ownership moved.

## Remaining local regression

```bash
git -c gc.auto=0 pull --ff-only origin dev

python scripts/build362_364_operations_membership_runtime_test.py
python scripts/build365_membership_read_resilience_test.py
python scripts/build366_368_today_tasks_runtime_test.py
python scripts/build369_today_tasks_schema_alignment_test.py
python scripts/build370_372_custom_requests_runtime_test.py

git status --short
```

Expected five PASS results and a clean tree.

The first four are rerun because Builds 371/372 advance the shared Commerce runtime/cache. Their regressions preserve the already proven Membership and Today Tasks boundaries without freezing shared runtime versions.

## Boundary note

The original mature Custom Requests UI still uses compatibility POST `/api/admin/custom-requests` for workflow actions. The legacy `?format=marketplace_csv` GET was explicitly outside the Build 370 startup-read boundary; Builds 373–382 now add a safe non-mutating export authority and page-level rewrite/guard without moving workflow mutations.
