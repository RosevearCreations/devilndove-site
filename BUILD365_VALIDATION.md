# Build 365 Validation — Membership Read Resilience

## Status — BROWSER PASSED / CORRECTED LOCAL REGRESSION REQUIRED

Build 365 hardens the Build 362 Membership read implementation after the first browser proof returned HTTP 500 from both `/api/admin/tier-policies` and `/api/admin/contracts/operations-membership-read` while the Build 363/364 Commerce runtime itself activated successfully.

## Boundary

Build 365 does not change loader coverage or mutation ownership.

```text
public contract build                  362
implementation build                   365
Commerce runtime                       363
Membership activation                  364
request-time schema mutation           false
membership mutation ownership moved    false
```

The Tier Policy reader now tolerates legacy column shapes with a bounded `SELECT * FROM membership_tier_policies`, maps known aliases defensively, returns in-memory defaults for a genuine missing table, and returns structured errors for unexpected read failures. The aggregate Membership contract catches thrown child reads and reports the failed child.

## Firefox proof — PASSED 2026-08-25

Observed on `/admin/membership/`:

```text
membership_contract_status                 200
membership_contract_build                  362
membership_contract_implementation_build   365
membership_contract_owner                  operations
membership_contract_id                     operations-membership-read
membership_contract_schema_mutation        false
membership_contract_mutation_moved         false
membership_contract_schema_ready           true
membership_contract_missing_tables         []
membership_contract_failed_read             null
membership_contract_error_code              null
membership_contract_child_error_code        null
membership_contract_error                   null

tier_policy_status                         200
tier_policy_build                          362
tier_policy_implementation_build           365
tier_policy_owner                          operations
tier_policy_schema_ready                   true
tier_policy_missing_tables                 []
tier_policy_schema_mutation                false
tier_policy_source                         database
tier_policy_defaults_materialized          true
tier_policy_item_count                     3
tier_policy_codes                          bronze,silver,gold
tier_policy_error_code                     null
tier_policy_error                          null

membership_service_registered              true
application_module                         commerce-operations
application_mode                           active
active_application_module                  commerce-operations
operations_domain                          operations
runtime_entry                              ../modules/commerce-operations/runtime.mjs?v=363
runtime_build                              363
activation_build                           364
runtime_state                              active
services_ready                             true
required_service_count                     1
required_services                          ["operations-membership-read"]
membership_page_proven                     true
creates_network_transport                  false
operations_mutation_ownership              false
membership_mutation_ownership              false
contracts_ok                               true
services_ok                                true
```

## Local regression history

The first Build 365 local run failed only because the regression asserted the literal string `sqlite_master` was absent from the entire source file. The term remained solely in a comment describing the old implementation. The executable `readStoredRows` section did not use `sqlite_master`.

The regression has been corrected to inspect the executable read section instead of matching explanatory comments.

## Remaining gate

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build365_membership_read_resilience_test.py
git rev-parse --short HEAD
git status --short
```

Expected:

```text
BUILD 365 MEMBERSHIP READ RESILIENCE: PASS
No Cloudflare resource was contacted.
```

A clean `git status --short` plus that pass closes Build 365. No additional Firefox proof is required unless the implementation changes again.
