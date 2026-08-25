# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 331–333 on 2026-08-24.

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
Contract catalog             333
Passive service adapters     333
Business runtime             inactive
```

### Commerce & Operations

Proven pages remain `/admin/operations/`, `/admin/customer-documents/`, and `/admin/orders/`. Remaining loader/runtime coverage includes gift cards, members/membership, custom requests and today-tasks. Loader coverage remains separate from mutation authority.

### Creative & Production

Still open: bounded top-level `creative-production` runtime activation, CAIP/Content contract extraction, and compatibility retirement only after owned destinations exist. Packaging remains domain-owned.

### Business & Administration

Build 323 proved `/admin/accounting/` resolves as `accounting` under `business-administration` with `application_mode=domain-bridge` and no active top-level runtime.

Owned Accounting reads now include:

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
accounting-vendors-read                       Build 331 STAGED
accounting-recurring-expense-rules-read       Build 332 STAGED
accounting-statement-provider-profiles-read   Build 333 STAGED
```

Build 324 exposed separate Development schema evidence:

```text
missing_tables   []
missing_columns  ["orders.total_amount|total"]
```

Do not repair this inside GET handlers.

## Accounting read-time schema mutation retirement

Rule:

> GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema.

Build 326 removed journal GET DDL while keeping write-side journal schema compatibility for explicit POST actions.
Build 327 removed GIFI-notes GET table/index creation while preserving POST save compatibility.
Build 328 removed GIFI-summary GET `ensureGlSchema()` CREATE/ALTER behavior.
Build 329 removed GET-time closure/attachment/import ensures from period-lock reads.
Build 330 removed GET-time attachment schema ensure/repair while preserving explicit uploads.
Build 331 removes vendor-table ensure from vendor GET while preserving vendor POST writes.
Build 332 removes vendor/rule/expense ensures from recurring-rule GET while preserving explicit save/generate writes.
Build 333 removes provider-profile GET seeding. Six built-in provider defaults are now returned in memory; explicit POST remains the materialization path.

The Accounting page still has automatic legacy reads requiring bounded source audits, including reconciliation, statement imports, year-end close, sales-tax filing, fixed assets, vendor statements, close workflow, evidence checks and DB sanity.

## Validation-harness rule

Historical regression scripts verify durable feature boundaries introduced by their build. They must not require the continued presence of a later blocker or freeze unrelated shared files forever.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting expense/write-off/overhead/product-cost writes, GL/GIFI writes, journal posting, vendor/recurring-rule/profile writes, attachment uploads and close/lock actions.

A loader or read-contract migration never implies mutation ownership.

## Next batched sequence

1. Validate Builds 331–333 with one local and one browser gate.
2. Source-audit another 2–3 automatic Accounting read blockers, prioritizing reconciliation/statement-import dependencies that currently hide ensure/write helpers.
3. Keep GET/read paths schema-aware and non-mutating.
4. When all automatic `/admin/accounting/` reads are owned/non-mutating, activate the first read-only `business-administration` runtime page with mutation ownership still false.
5. Separately continue Commerce route coverage and Creative & Production runtime work.

## Separate fresh-install schema/data parity track

Priority remains:

```text
fresh-install schema parity
then Development business-data copy/migration
```

Do not copy Production business data into Development until schema parity is independently repaired and validated.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction build should implicitly promote `dev` or mutate Production D1/R2.
