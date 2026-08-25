# Builds 362–364 Validation — Operations Membership Runtime

## Status — FULLY VALIDATED IN DEVELOPMENT 2026-08-25 AFTER BUILD 365 READ-RESILIENCE CORRECTION

```text
Build 362  Operations-owned Membership startup read contract
Build 363  Commerce & Operations runtime adds page-specific Membership service gate
Build 364  /admin/membership/ top-level activation + Tier Policy mount correction
Build 365  read-resilience implementation correction for the Build 362 read boundary
```

Membership mutation ownership remains unchanged.

## Local regression — PASSED 2026-08-25

```text
BUILDS 362-364 OPERATIONS MEMBERSHIP RUNTIME: PASS
No Cloudflare resource was contacted.
```

## Initial browser proof — READ FAILED / RUNTIME PASSED

The first `/admin/membership/` proof showed the Build 363/364 runtime activating correctly, but both the direct Tier Policy GET and aggregate Membership contract returned HTTP 500 before Build 362 metadata could be parsed.

That proved the loader/runtime boundary while exposing a real Build 362 read-implementation defect. It was not the expected missing-table readiness path.

## Build 365 read correction

Build 365 preserves Build 362 as the public contract identity while hardening the implementation:

- bounded Tier Policy reads no longer depend on `sqlite_master` or a fixed legacy selected-column list;
- known legacy column aliases are mapped defensively;
- a genuine missing table still returns in-memory defaults with `schema_ready=false` and no GET mutation;
- unexpected direct-read errors return structured Build 362 / implementation Build 365 metadata;
- the aggregate contract catches thrown child reads and reports the failed child instead of collapsing into an opaque platform 500;
- no GET path creates or seeds schema;
- retained POST compatibility remains unchanged.

## Firefox revalidation — PASSED 2026-08-25

Observed Development proof:

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
runtime_definition                         commerce-operations
runtime_entry                              ../modules/commerce-operations/runtime.mjs?v=363
runtime_build                              363
activation_build                           364
runtime_state                              active
current_domain                             operations
last_pathname                              /admin/membership/
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

This proves the Development database already has a usable `membership_tier_policies` table containing the three Bronze/Silver/Gold policies. No schema-parity deficit was observed for this table in this Development environment.

Builds 362–364 are fully validated. Build 365 itself still requires its corrected local regression rerun before Build 365 can be marked fully validated.

Do not infer mutation ownership from this read/runtime closure. Tier assignment/removal and Tier Policy POST remain compatibility authorities.
