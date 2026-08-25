# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through validated Build 348 on 2026-08-24.

## Architectural invariant

Devil n Dove has exactly one shared Core and three top-level application modules:

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain ownership/service boundaries beneath those modules. Core owns shared infrastructure only; business rules remain domain-owned.

## Source-control state

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Application modules are not permanent Git branches.

## Current identities

```text
Core architecture                    302
Core runtime implementation          305
Commerce runtime                     315
Contract catalog                     345
Passive service adapters             345
Accounting startup-read audit        346 validated
Business runtime implementation      347 validated
Business Accounting activation       348 validated
Accounting mutation ownership        false
```

### Commerce & Operations

Proven pages remain `/admin/operations/`, `/admin/customer-documents/`, and `/admin/orders/`. Remaining loader/runtime coverage includes gift cards, members/membership, custom requests and today-tasks. Loader coverage remains separate from mutation authority.

### Creative & Production

Still open: bounded top-level `creative-production` runtime activation, CAIP/Content contract extraction, and compatibility retirement only after owned destinations exist. Packaging remains domain-owned and is the preferred first source-audit candidate because it already has a domain runtime.

### Business & Administration

Build 323 proved `/admin/accounting/` resolves as the `accounting` domain under `business-administration` while the top-level Business runtime was inactive.

Builds 324–345 extracted/audited the Accounting page reads. Builds 331–342 are fully validated. Builds 343–345 are browser proven and schema-ready; their first local run failed only because the historical test still asserted the pre-348 state `business-administration.entry === null`. That assertion was removed in commit `d630c11f6241fb4cab1bc897bfc6396033961811`; the corrected local rerun remains required.

Build 346 confirms every automatic `/admin/accounting/` startup GET resolves to an owned non-mutating read boundary. Build 347 adds a passive Business runtime. Build 348 enables only the Accounting page. The Build 346–348 local regression and browser activation proof both passed on 2026-08-24.

Validated Business runtime scope:

```text
runtime module:       business-administration
runtime domain:       accounting only
runtime page:         /admin/accounting/ only
runtime services:     28 registered required services
mutation ownership:   false
network transport:    none created by runtime
other Business pages: domain-bridge only
```

## Read-time schema mutation retirement

Rule:

> GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema.

Builds 326–345 retired or formalized the remaining Accounting read boundaries, including journal, GIFI, locks, attachments, vendors, recurring rules, provider profiles, statement imports, reconciliation, fixed assets, evidence checks, DB sanity, close workflow, year-end close, and export readers.

Build 346 closes the startup-read audit: the Accounting page no longer has an automatic GET dependent on a legacy mutating schema helper.

## Development schema-parity track — separate from extraction

Concrete findings from non-mutating reads:

```text
orders.total_amount|total                     missing logical revenue column alternative (Build 324)
accounting_fixed_assets.location_note         missing column (Build 338)
hst_gst_review_records                        missing table (Build 339)
accountant_export_manifests                   missing table (Build 339)
user_profiles.profile_id                      missing expected column (Build 341)
access_tiers.tier_id                          missing expected column (Build 341)
payment_disputes.payment_dispute_id           missing expected column (Build 341)
```

These findings belong in fresh-install schema/migrations/readiness tooling, never in GET handlers or runtime activation code.

Fresh-install schema parity still takes priority over any Production business-data copy. Prior audit also found Production-only active tables such as `accounting_order_records`, `gift_cards`, Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy.

## Validation state

```text
Builds 325–330   fully validated
Builds 331–336   fully validated 2026-08-24
Builds 337–339   fully validated 2026-08-24 (+ schema parity for 338/339)
Builds 340–342   fully validated 2026-08-24 (+ schema parity for 341)
Builds 343–345   browser proven; corrected local rerun required; schemas ready
Builds 346–348   fully validated 2026-08-24
```

## Validation-harness rule

Historical regression scripts verify durable boundaries introduced by their build. They must not require the continued presence of a later blocker or freeze unrelated shared files forever. Build 343–345 specifically must not require Business & Administration to remain inactive after Build 348.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting expense/write-off/overhead/product-cost writes, GL/GIFI writes, journal posting, vendor/recurring-rule/profile writes, CSV statement imports, reconciliation review/exception updates, fixed-asset writes, attachment uploads, close/lock actions and accountant export writes.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Pull current `dev` and rerun only `scripts/build343_345_accounting_read_batch_test.py` to close the corrected historical local gate.
2. Source-audit the existing Packaging domain runtime and `/admin/packaging-studio/` loader as the preferred first `creative-production` activation candidate.
3. If clean, stage Builds 349–351 as Packaging runtime audit, passive Creative & Production runtime implementation, and Packaging-only top-level activation.
4. Keep Packaging/Creative mutation ownership unchanged during activation.
5. Continue fresh-install schema parity separately before Production business-data copy.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction or runtime-activation build should implicitly promote `dev` or mutate Production D1/R2.
