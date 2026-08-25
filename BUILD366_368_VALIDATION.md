# Builds 366–368 Validation — Operations Today Tasks Runtime

## Status — STAGED / LOCAL + BROWSER VALIDATION REQUIRED

```text
Build 366  readiness-aware Today Tasks GET/read contract
Build 367  passive Commerce & Operations Today Tasks service
Build 368  /admin/today-tasks/ activation and dedicated workspace
```

Today Tasks mutation ownership remains unchanged.

## Local regression

```bash
git -c gc.auto=0 pull --ff-only origin dev

python scripts/build362_364_operations_membership_runtime_test.py
python scripts/build365_membership_read_resilience_test.py
python scripts/build366_368_today_tasks_runtime_test.py

git status --short
```

Expected:

```text
BUILDS 362-364 OPERATIONS MEMBERSHIP RUNTIME: PASS
No Cloudflare resource was contacted.
BUILD 365 MEMBERSHIP READ RESILIENCE: PASS
No Cloudflare resource was contacted.
BUILDS 366-368 TODAY TASKS RUNTIME: PASS
No Cloudflare resource was contacted.
```

The first two are rerun only because Builds 367/368 advance the same shared Commerce runtime. Their regressions are now future-compatible and should preserve the already validated Membership boundary.

## Firefox gate

After Development deploys, open:

```text
/admin/today-tasks/
```

Do not click Done, Ignore, or Snooze during validation.

Validate the Build 366 read contract and Build 367/368 runtime state. Either of these readiness states is architecturally valid:

```text
schema_ready=true
```

or:

```text
schema_ready=false
missing_tables=[...]
query_errors=[...]
```

A false readiness value is schema-parity evidence; do not add CREATE/ALTER/INSERT to GET.

Expected structural runtime state:

```text
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
today_tasks_page_proven            true
creates_network_transport          false
operations_mutation_ownership      false
today_tasks_mutation_ownership     false
action_mutation_ownership_moved    false
contracts_ok                       true
services_ok                        true
```

No POST action is required to prove this loader/read boundary.
