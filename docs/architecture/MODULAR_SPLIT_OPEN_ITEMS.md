# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 340–342 on 2026-08-24.

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
Core architecture            302
Core runtime implementation  305
Commerce runtime             315
Contract catalog             342
Passive service adapters     342
Business runtime             inactive
```

### Commerce & Operations

Proven pages remain `/admin/operations/`, `/admin/customer-documents/`, and `/admin/orders/`. Remaining loader/runtime coverage includes gift cards, members/membership, custom requests and today-tasks. Loader coverage remains separate from mutation authority.

### Creative & Production

Still open: bounded top-level `creative-production` runtime activation, CAIP/Content contract extraction, and compatibility retirement only after owned destinations exist. Packaging remains domain-owned.

### Business & Administration

Build 323 proved `/admin/accounting/` resolves as `accounting` under `business-administration` with `application_mode=domain-bridge` and no active top-level runtime.

Owned reads now include:

```text
accounting-read                               Build 312 COMPLETE
accounting-expenses-read                      Build 316 COMPLETE
accounting-writeoffs-read                     Build 317 COMPLETE
accounting-general-ledger-read                Build 318 COMPLETE
accounting-summary-read                       Build 319 COMPLETE
accounting-overhead-allocations-read          Build 320 VALIDATED
accounting-overhead-product-allocations-read  Build 321 VALIDATED
accounting-product-costs-read                 Build 322 VALIDATED
accounting-profit-loss-read                   Build 324 VALIDATED
accounting-item-costing-read                  Build 325 VALIDATED
accounting-journal-read                       Build 326 VALIDATED
accounting-gifi-notes-read                    Build 327 VALIDATED
accounting-gifi-summary-read                  Build 328 VALIDATED
accounting-period-locks-read                  Build 329 VALIDATED
accounting-attachments-read                   Build 330 VALIDATED
accounting-vendors-read                       Build 331 BROWSER PROVEN; LOCAL REQUIRED
accounting-recurring-expense-rules-read       Build 332 BROWSER PROVEN; LOCAL REQUIRED
accounting-statement-provider-profiles-read   Build 333 BROWSER PROVEN; LOCAL REQUIRED
accounting-statement-imports-read             Build 334 BROWSER PROVEN; LOCAL REQUIRED
accounting-reconciliation-exceptions-read     Build 335 BROWSER PROVEN; LOCAL REQUIRED
accounting-vendor-statements-read             Build 336 BROWSER PROVEN; LOCAL REQUIRED
accounting-sales-tax-filing-read              Build 337 BROWSER PROVEN; LOCAL REQUIRED
accounting-fixed-assets-read                  Build 338 BROWSER PROVEN; LOCAL + SCHEMA PARITY
accounting-evidence-check-read                Build 339 BROWSER PROVEN; LOCAL + SCHEMA PARITY
accounting-reconciliation-read                Build 340 STAGED
platform-db-sanity-read                       Build 341 STAGED (PLATFORM OWNED)
accounting-close-workflow-read                Build 342 STAGED
```

## Read-time schema mutation retirement

Rule:

> GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema.

Build 326 removed journal GET DDL while keeping explicit POST compatibility.
Build 327 removed GIFI-notes GET table/index creation while preserving POST save compatibility.
Build 328 removed GIFI-summary GET `ensureGlSchema()` behavior.
Build 329 removed GET-time closure/attachment/import ensures from period-lock reads.
Build 330 removed GET-time attachment schema ensure/repair while preserving explicit uploads.
Build 331 removed vendor-table ensure from vendor GET while preserving vendor writes.
Build 332 removed vendor/rule/expense ensures from recurring-rule GET while preserving save/generate writes.
Build 333 removed provider-profile GET seeding; defaults are returned in memory and POST remains materialization path.
Build 334 removed statement-import GET schema creation/default seeding while preserving CSV import POST compatibility.
Build 335 removed reconciliation-exception GET schema creation while preserving explicit exception updates.
Build 336 prevented vendor-statement GET from reaching the mutating attachment helper.
Build 337 removed sales-tax-filing GET reconciliation-table ensure.
Build 338 removed fixed-assets table creation from GET while preserving POST asset creation compatibility.
Build 339 added schema-aware ownership to an already non-mutating evidence-check GET.
Build 340 removes reconciliation GET ensures and moves read calculation behind the Accounting read boundary.
Build 341 formalizes DB sanity as a Platform-owned, non-mutating cross-application read contract.
Build 342 removes close-workflow GET `ensureSchema()` reachability while preserving explicit POST write compatibility.

## Development schema-parity track — separate from extraction

Current concrete findings from non-mutating read contracts:

```text
orders.total_amount|total                     missing logical revenue column alternative (Build 324)
accounting_fixed_assets.location_note         missing column (Build 338)
hst_gst_review_records                        missing table (Build 339)
accountant_export_manifests                   missing table (Build 339)
```

These findings must be repaired in fresh-install schema/migrations/readiness tooling, never by restoring DDL to GET.

Fresh-install schema parity still takes priority over any Production business-data copy. Prior audit also found Production-only active tables such as `accounting_order_records`, `gift_cards`, Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy. Keep that work independently tracked.

## Validation-harness rule

Historical regression scripts verify durable boundaries introduced by their build. They must not require the continued presence of a later blocker or freeze unrelated shared files forever.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting expense/write-off/overhead/product-cost writes, GL/GIFI writes, journal posting, vendor/recurring-rule/profile writes, CSV statement imports, reconciliation review/exception updates, fixed-asset writes, attachment uploads, close/lock actions and accountant export writes.

A loader or read-contract migration never implies mutation ownership.

## Next batched sequence

1. Complete local regressions for Builds 331–342 and browser validation for 340–342.
2. Capture schema deficits from Build 341 DB sanity and Build 342 close workflow without repairing them in GET.
3. Source-audit remaining automatic Accounting-page reads, especially year-end close and any remaining startup requests.
4. When all automatic `/admin/accounting/` reads are owned/non-mutating, activate the first read-only `business-administration` runtime page while keeping mutation ownership false.
5. Separately continue Commerce route coverage and Creative & Production runtime work.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction build should implicitly promote `dev` or mutate Production D1/R2.
