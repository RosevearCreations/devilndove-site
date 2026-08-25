# Builds 362–364 Validation — Operations Membership Runtime

## Status — STAGED / LOCAL + BROWSER VALIDATION REQUIRED

```text
Build 362  Operations-owned Membership startup read contract
Build 363  Commerce & Operations runtime adds page-specific Membership service gate
Build 364  /admin/membership/ top-level activation + Tier Policy mount correction
```

Membership mutation ownership remains unchanged.

## Local regression

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build362_364_operations_membership_runtime_test.py
git status --short
```

Expected:

```text
BUILDS 362-364 OPERATIONS MEMBERSHIP RUNTIME: PASS
No Cloudflare resource was contacted.
```

## Firefox activation gate

After Development deploys, open `/admin/membership/`, allow Access Tiers and Tier Policy to load, then run the GET/runtime proof supplied in the validation handoff.

Expected structural result:

```text
membership_contract_status                 200
membership_contract_build                  362
membership_contract_owner                  operations
membership_contract_id                     operations-membership-read
membership_contract_schema_mutation        false
membership_contract_mutation_moved         false
membership_contract_schema_ready           true
membership_contract_missing_tables         []
membership_service_registered              true
membership_service_contract_build          362
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

If `schema_ready=false`, preserve the reported `membership_tier_policies` deficit as fresh-install/schema-parity evidence. Do not restore CREATE/INSERT to GET.

Do not assign/remove a tier or save a Tier Policy during this proof.
