# Builds 370–372 Validation — Operations Custom Requests Runtime

## Status — STAGED / LOCAL + BROWSER VALIDATION REQUIRED

```text
Build 370  Custom Requests startup-read contract/readiness
Build 371  passive Commerce & Operations Custom Requests service
Build 372  /admin/custom-request/ activation
```

Custom Requests mutation ownership remains unchanged.

## Local regression

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

The first four are rerun because Builds 371/372 advance the shared Commerce runtime/cache. Their regressions are intended to preserve the already proven Membership and Today Tasks boundaries without freezing shared runtime versions.

## Firefox gate

After Development deploys, open:

```text
/admin/custom-request/
```

Do not save a review, create quote/job/product/reply/payment/order records, run payment/provider actions, save marketplace presets, generate export packs, or use marketplace CSV links during proof.

Validate the Build 370 read contract plus Build 371/372 runtime state.

Expected structural state:

```text
contract_status                       200
contract_build                        370
contract_owner                        operations
contract_id                           operations-custom-requests-read
request_time_schema_mutation          false
mutation_ownership_moved              false
compatibility_post_authority          /api/admin/custom-requests
compatibility_post_mutation_moved     false
marketplace_csv_legacy_outside_read   true
service_registered                    true
service_build                         370
application_module                    commerce-operations
application_mode                      active
active_application_module             commerce-operations
operations_domain                     operations
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
contracts_ok                          true
services_ok                           true
```

`schema_ready=true` is ideal. If `schema_ready=false`, paste `missing_tables` exactly. The contract uses read-only table verification and must not repair schema during GET.

The legacy marketplace CSV GET is explicitly outside this validation boundary because it still has compatibility schema ensure/seeding behavior. Do not use it for proof.
