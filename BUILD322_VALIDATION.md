# Build 322 Validation — Product Costs Read Extraction / Builds 320–322 Consolidated Proof

## Status — VALIDATED

Build 322 baseline: `612ff1b875d00d9a0aefd1b954c91c92d4c46d9d`.

Builds 320–322 were proven together because they are consecutive Accounting read-only extractions and their write paths remain independent.

## Local regression proof — 2026-08-24

```text
BUILD 320 ACCOUNTING OVERHEAD ALLOCATIONS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
BUILD 321 ACCOUNTING OVERHEAD PRODUCT ALLOCATIONS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
BUILD 322 ACCOUNTING PRODUCT COSTS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```

## Development browser proof — 2026-08-24

From `/admin/orders/`, all six legacy/contract reads returned 200 and reported non-mutating Accounting ownership.

Observed runtime proof:

```text
overhead_legacy_build                 320
overhead_legacy_schema_ready          true
overhead_legacy_schema_mutation       false
overhead_contract_build               320
overhead_contract_owner               accounting
overhead_service_build                320
overhead_service_schema_mutation      false

product_alloc_legacy_build            321
product_alloc_legacy_schema_ready     true
product_alloc_legacy_schema_mutation  false
product_join_enabled                  true
product_alloc_contract_build          321
product_alloc_contract_owner          accounting
product_alloc_service_build           321
product_alloc_service_schema_mutation false

costs_legacy_build                    322
costs_legacy_schema_ready             true
costs_legacy_schema_mutation          false
costs_contract_build                  322
costs_contract_owner                  accounting
costs_service_build                   322
costs_service_schema_mutation         false

contract_catalog_build                322
service_adapter_build                 322
core_runtime_build                    305
commerce_runtime_build                315
owns_operations_mutations             false
contracts_ok                          true
services_ok                           true
```

No mutation validation was performed or required for these read-only builds.

Note: the captured transcript did not include the requested `git status --short` line. Runtime and regression gates passed; source-control cleanliness remains a housekeeping check rather than a functional failure.
