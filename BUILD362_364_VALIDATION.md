# Builds 362–364 Validation — Operations Membership Runtime

## Status — RUNTIME BROWSER-PROVEN / BUILD 362 READ FAILED / BUILD 365 PATCH REQUIRED

```text
Build 362  Operations-owned Membership startup read contract
Build 363  Commerce & Operations runtime adds page-specific Membership service gate
Build 364  /admin/membership/ top-level activation + Tier Policy mount correction
Build 365  staged read-resilience correction after browser 500
```

Membership mutation ownership remains unchanged.

## Browser evidence — 2026-08-25

The top-level runtime activated correctly on `/admin/membership/`, but both the direct Tier Policy GET and aggregate Membership read returned 500 before Build 362 metadata could be parsed.

Observed runtime proof:

```text
membership_contract_status              500
membership_contract_build               null
membership_contract_owner               null
membership_contract_id                  null
tier_policy_status                      500
tier_policy_build                       null
membership_service_registered           true
application_module                      commerce-operations
application_mode                        active
active_application_module               commerce-operations
operations_domain                       operations
runtime_entry                           ../modules/commerce-operations/runtime.mjs?v=363
runtime_build                           363
activation_build                        364
runtime_state                           active
current_domain                          operations
last_pathname                           /admin/membership/
services_ready                          true
required_service_count                  1
required_services                       ["operations-membership-read"]
membership_read_contract_build          362
membership_page_proven                  true
creates_network_transport               false
operations_mutation_ownership           false
membership_mutation_ownership           false
contracts_ok                            true
services_ok                             true
```

Interpretation: Builds 363/364 loader/runtime wiring is browser-proven. Build 362 read implementation is not validated because the endpoint threw before returning its contract metadata. This is not the expected missing-table readiness path; a missing table should have returned HTTP 200 with `schema_ready=false`.

## Build 365 correction

Build 365 preserves Build 362 as the public contract identity while hardening the implementation:

- Tier Policy read no longer depends on `sqlite_master` or a fixed explicit legacy column list.
- It reads the bounded `membership_tier_policies` table with `SELECT *` and maps known legacy aliases defensively.
- A genuine missing-table error still returns in-memory defaults with `schema_ready=false` and no schema mutation.
- Unexpected Tier Policy read errors now return structured JSON containing Build 362 / implementation Build 365 metadata.
- The aggregate `operations-membership-read` contract catches thrown child reads and reports `failed_read` instead of collapsing into an opaque platform 500.
- No GET path creates/seeds schema. Existing POST compatibility remains unchanged.

## Local regressions

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build362_364_operations_membership_runtime_test.py
python scripts/build365_membership_read_resilience_test.py
git status --short
```

Expected:

```text
BUILDS 362-364 OPERATIONS MEMBERSHIP RUNTIME: PASS
No Cloudflare resource was contacted.
BUILD 365 MEMBERSHIP READ RESILIENCE: PASS
No Cloudflare resource was contacted.
```

## Firefox revalidation gate

After Build 365 deploys, rerun the read-only Membership proof. Expected:

```text
membership_contract_status                 200
membership_contract_build                  362
membership_contract_implementation_build   365
membership_contract_owner                  operations
membership_contract_id                     operations-membership-read
membership_contract_schema_mutation        false
membership_contract_mutation_moved         false
membership_contract_schema_ready           true|false
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

If `schema_ready=false`, preserve `membership_tier_policies` as schema-parity evidence. Do not restore CREATE/INSERT to GET.

If either endpoint still returns 500, Build 365 should now expose a structured `error_code`, `failed_read`, and/or underlying `error` message so the remaining schema drift can be fixed precisely without guessing.

Do not assign/remove a tier or save a Tier Policy during this proof.
