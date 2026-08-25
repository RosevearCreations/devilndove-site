# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through Builds 328–330 validation progress on 2026-08-24.

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
Contract catalog             330
Passive service adapters     330
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
accounting-item-costing-read                  Build 325 BROWSER PROVEN; CORRECTED LOCAL REQUIRED
accounting-journal-read                       Build 326 BROWSER PROVEN; CORRECTED LOCAL REQUIRED
accounting-gifi-notes-read                    Build 327 BROWSER PROVEN; CORRECTED LOCAL REQUIRED
accounting-gifi-summary-read                  Build 328 LOCAL PASSED; BROWSER REQUIRED
accounting-period-locks-read                  Build 329 LOCAL PASSED; BROWSER REQUIRED
accounting-attachments-read                   Build 330 LOCAL PASSED; BROWSER REQUIRED
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

Build 328 removes GIFI-summary GET `ensureGlSchema()` CREATE/ALTER behavior.

Build 329 removes GET-time closure/attachment/import ensures from period-lock reads; the read now needs only existing closure state.

Build 330 removes GET-time attachment schema ensure/repair while preserving explicit upload writes.

The Accounting page still has automatic legacy reads that require bounded source audits, including vendors/recurring rules, reconciliation, statement imports/profiles, year-end close, sales-tax filing, fixed assets, vendor statements, close workflow, evidence checks and DB sanity.

## Validation-harness rule learned from Build 328

Historical regression scripts must verify the durable feature boundary introduced by their build, not require the continued presence of a later blocker or freeze unrelated shared files forever.

The original Builds 325–327 regression required `await ensureGlSchema(db)` to remain in the GIFI-summary endpoint because that was the known *next* blocker at Build 327. Build 328 correctly removed it, making the older test falsely fail. The corrected regression now tests only the three owned read extractions and their non-mutating GET behavior.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting expense/write-off/overhead/product-cost writes, GL/GIFI writes, journal posting, attachment uploads and close/lock actions.

A loader or read-contract migration never implies mutation ownership.

## Next batched sequence

1. Rerun the corrected Builds 325–327 local regression and confirm clean `git status --short`.
2. Complete the Builds 328–330 browser proof.
3. Source-audit the next automatic Accounting reads and select another 2–3 closely related blockers.
4. Keep GET/read paths schema-aware and non-mutating.
5. When all automatic `/admin/accounting/` reads are owned/non-mutating, activate the first read-only `business-administration` runtime page with mutation ownership still false.
6. Separately continue Commerce route coverage and Creative & Production runtime work.

## Separate fresh-install schema/data parity track

Priority remains:

```text
fresh-install schema parity
then Development business-data copy/migration
```

Do not copy Production business data into Development until schema parity is independently repaired and validated.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction build should implicitly promote `dev` or mutate Production D1/R2.
