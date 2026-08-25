# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 346–348 on 2026-08-24.

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
Accounting startup-read audit        346
Business runtime implementation      347
Business Accounting activation       348 staged
Accounting mutation ownership        false
```

### Commerce & Operations

Proven pages remain `/admin/operations/`, `/admin/customer-documents/`, and `/admin/orders/`. Remaining loader/runtime coverage includes gift cards, members/membership, custom requests and today-tasks. Loader coverage remains separate from mutation authority.

### Creative & Production

Still open: bounded top-level `creative-production` runtime activation, CAIP/Content contract extraction, and compatibility retirement only after owned destinations exist. Packaging remains domain-owned.

### Business & Administration

Build 323 proved `/admin/accounting/` resolves as the `accounting` domain under `business-administration` while the top-level Business runtime was inactive.

Builds 324–345 then extracted/audited the Accounting page reads. Builds 343–345 are browser proven with `schema_ready=true`; local regressions remain outstanding. Build 346 confirms every automatic `/admin/accounting/` startup GET now resolves to an owned non-mutating read boundary. Build 347 adds a passive Business runtime, and Build 348 enables only the Accounting page.

Business runtime scope after Build 348:

```text
runtime module:       business-administration
runtime domain:       accounting only
runtime page:         /admin/accounting/ only
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
Builds 331–336   browser proven; local required
Builds 337–339   browser proven; local required (+ schema parity for 338/339)
Builds 340–342   browser proven; local required (+ schema parity for 341)
Builds 343–345   browser proven; local required; schemas ready in browser proof
Builds 346–348   staged / validation required
```

## Validation-harness rule

Historical regression scripts verify durable boundaries introduced by their build. They must not require the continued presence of a later blocker or freeze unrelated shared files forever.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting expense/write-off/overhead/product-cost writes, GL/GIFI writes, journal posting, vendor/recurring-rule/profile writes, CSV statement imports, reconciliation review/exception updates, fixed-asset writes, attachment uploads, close/lock actions and accountant export writes.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Run the combined local regressions for Builds 331–348.
2. Browser-validate Build 348 application-module activation on `/admin/accounting/`.
3. If clean, mark the read sequence and first Business runtime activation validated while leaving Accounting mutations in compatibility paths.
4. Continue fresh-install schema parity separately before Production business-data copy.
5. Source-audit the next modular target rather than expanding Business runtime coverage by assumption.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction or runtime-activation build should implicitly promote `dev` or mutate Production D1/R2.
