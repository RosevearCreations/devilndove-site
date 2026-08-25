# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 325–327.

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

Domains remain ownership/service boundaries beneath those modules. They are not additional top-level applications.

## Core rule

Core owns only shared infrastructure: auth/session/current-user context, module registry/lifecycle, route/domain/application-module resolution, passive contract/service registration, common runtime/error helpers, availability and diagnostics. Core must not own business rules.

Current identities:

```text
Core architecture            302
Core runtime implementation  305
Contract catalog             327
Passive service adapters     327
Commerce runtime             315
```

Advancing the contract catalog does not imply Core absorbed Accounting logic. Accounting read implementations remain owner=`accounting`.

## Source-control state

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Development already contains the old `main` baseline. Application modules are not permanent Git branches.

## Current application-module state

### Commerce & Operations

Proven Operations pages:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

Commerce runtime remains Build 315 and Operations mutation ownership remains false. Remaining loader/runtime coverage still includes gift cards, members/membership, custom requests and today-tasks.

### Creative & Production

Still open: bounded top-level `creative-production` runtime activation, CAIP/Content contract extraction, and eventual compatibility retirement only after owned destinations exist. Packaging remains domain-owned.

### Business & Administration

Business & Administration is not yet top-level runtime-active. Build 323 proved `/admin/accounting/` resolves as:

```text
domain                      accounting
application_module          business-administration
application_mode            domain-bridge
active_application_module   null
```

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
accounting-item-costing-read                  Build 325 STAGED
accounting-journal-read                       Build 326 STAGED
accounting-gifi-notes-read                    Build 327 STAGED
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

Build 326 removes the known journal GET DDL path. `ensureJournalSchema()` remains write-side compatibility for explicit POST actions only.

Build 327 removes GIFI-notes GET table/index creation. Its POST save path retains write-side ensure behavior.

Confirmed next read-time DDL blocker:

```text
/api/admin/accounting-gifi-summary
  GET -> ensureGlSchema()
  CREATE TABLE / ALTER TABLE general_ledger_accounts
```

The Accounting page also has other automatic legacy reads (period locks, vendors/rules, attachments, reconciliation, year-end close, statement imports/profiles, tax filing, fixed assets, vendor statements, close workflow and evidence checks) that still need bounded source audits before top-level runtime activation.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, membership lifecycle, Customer Documents actions, Accounting expense/write-off/overhead/product-cost writes, GL/GIFI writes, journal posting and close actions.

A loader or read-contract migration never implies mutation ownership.

## Next batched sequence after 325–327 validation

Rather than requiring one validation cycle per tiny read, batch a few closely related changes while preserving individual build identities.

Suggested next batch:

1. Build 328 — GIFI summary GET schema-mutation retirement + read extraction.
2. Build 329 — audit/extract the next automatic Accounting page readiness-oriented GET (likely period locks or DB sanity depending on source mutation behavior).
3. Build 330 — one additional automatic Accounting read blocker selected only after source audit.
4. Validate the batch together.
5. Continue until all automatic `/admin/accounting/` reads are owned/non-mutating, then activate the first read-only `business-administration` runtime page with mutation ownership still false.

## Separate fresh-install schema/data parity track

Priority remains:

```text
fresh-install schema parity
then Development business-data copy/migration
```

Do not copy Production business data into Development until schema parity is independently repaired and validated.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction build should implicitly promote `dev` or mutate Production D1/R2.
