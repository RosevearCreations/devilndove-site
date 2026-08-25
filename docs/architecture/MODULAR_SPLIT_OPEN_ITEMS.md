# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 349–351 on 2026-08-24.

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
Packaging compatibility baseline     301 validated
Packaging top-level audit            349 staged
Creative runtime implementation      350 staged
Creative Packaging activation        351 staged
Accounting mutation ownership        false
Creative/Packaging mutation moved    false
```

### Commerce & Operations

Proven pages remain `/admin/operations/`, `/admin/customer-documents/`, and `/admin/orders/`. Remaining loader/runtime coverage includes gift cards, members/membership, custom requests and today-tasks. Loader coverage remains separate from mutation authority.

### Creative & Production

Build 349 audits the completed Build 301 Packaging compatibility checkpoint as the safest first top-level Creative & Production page. Build 350 adds a passive `creative-production` runtime requiring only the three services the Packaging domain runtime already consumes. Build 351 enables only `/admin/packaging-studio/`.

Staged Creative runtime scope:

```text
runtime module:       creative-production
runtime domain:       packaging only
runtime page:         /admin/packaging-studio/ only
required services:    inventory-read, catalog-read, content-media
network transport:    none created by top-level runtime
mutation ownership:   unchanged / false at top-level wrapper
Packaging baseline:   Build 301 COMPLETE IN DEVELOPMENT
other Creative pages: no top-level runtime coverage
```

The Packaging domain runtime and Build 297/298/300/301 browser stack remain the actual Packaging implementation. Build 351 does not modify Build 293/286 read authority or Build 292/291 write authority.

Still open after this batch: Creative Projects, CAIP and Content top-level coverage, plus any additional contract extraction those pages require.

### Business & Administration

Build 323 proved `/admin/accounting/` resolves as the `accounting` domain under `business-administration` while the top-level Business runtime was inactive.

Builds 324–345 extracted/audited the Accounting page reads. Builds 331–342 are fully validated. Builds 343–345 are browser proven and schema-ready; their first local run failed only because the historical test asserted pre-348 Business inactivity. That assertion was removed; corrected local rerun remains required.

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

Builds 326–345 retired or formalized the remaining Accounting read boundaries. Build 346 closes the Accounting startup-read audit.

Packaging uses a different proven pattern: Build 297 removes the physical legacy GET fallback, while the mature editor's compatibility trigger is gated until the Packaging domain runtime and native client transport are active. Build 351 does not change that pattern.

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
Build 301         Packaging compatibility baseline fully validated
Builds 349–351   staged / validation required
```

## Validation-harness rule

Historical regression scripts verify durable boundaries introduced by their build. They must not freeze later architectural state. Build 343–345 specifically must not require Business & Administration to remain inactive after Build 348. Build 349–351 must pin the existing Packaging authority without freezing unrelated future Creative route coverage.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting writes, and future Creative/CAIP/Content writes. Packaging's existing native Build 292 -> 291 write authority is already domain-owned and remains unchanged by the top-level Creative wrapper.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Pull current `dev` and run the corrected `build343_345_accounting_read_batch_test.py` plus `build349_351_creative_production_runtime_test.py`.
2. Browser-validate Build 351 on `/admin/packaging-studio/` after Packaging projects load.
3. If clean, mark Builds 343–345 and 349–351 validated.
4. Keep Packaging/Creative mutation ownership unchanged.
5. Continue fresh-install schema parity separately, then source-audit the next bounded modular target from Creative Projects/CAIP/Content or remaining Commerce/Business route coverage.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction or runtime-activation build should implicitly promote `dev` or mutate Production D1/R2.
