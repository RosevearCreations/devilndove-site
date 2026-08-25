# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Build 324.

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

Core owns only shared infrastructure: auth/session/current-user context, module registry/lifecycle, route/domain/application-module resolution, passive contract/service registration, common runtime/error helpers, availability and diagnostics.

Core must not own Catalog, Inventory, Creative, Packaging, Content, Marketing, Accounting, order, payment, gift-card, membership, or other business rules.

Current identities:

```text
Core architecture            302
Core runtime implementation  305
Contract catalog             324
Passive service adapters     324
Commerce runtime             315
```

Advancing the contract catalog does not imply Core absorbed Accounting logic. Accounting read implementations remain owner=`accounting`.

## Source-control state

Permanent branch model:

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Development has already been proven to contain the old `main` baseline with zero missing `main` commits. Application modules are not permanent Git branches. See `docs/architecture/SOURCE_CONTROL_BRANCHING.md`.

Cleanup-only refs still include:

```text
build291-candidate
build292-candidate
build293-candidate
build294-candidate
build317-accounting-writeoffs
```

These are historical or temporary checkpoints, not active development lines.

## Current application-module state

### Commerce & Operations

Proven Operations pages:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

Commerce runtime remains Build 315 and Operations mutation ownership remains false.

Remaining loader/runtime coverage includes:

```text
/admin/gift-cards/
/admin/members/
/admin/membership/
/admin/custom-request/
/admin/today-tasks/
```

Loader coverage must remain separate from mutation-authority extraction.

### Creative & Production

Packaging has a proven domain runtime/compatibility checkpoint. Creative inventory post/reversal consumers already use Inventory-owned authorities.

Still open:

- activate the top-level `creative-production` application runtime on a bounded proven page;
- retire `creative-process-compat.js` only after every remaining action has an owned destination;
- preserve the historical Build 308 local-signoff caveat;
- extract CAIP and Content services/contracts;
- keep Packaging logic domain-owned and out of Core.

### Business & Administration

Business & Administration is not yet top-level runtime-active.

Build 323 validated the first bounded `/admin/accounting/` dependency audit and verified Core module bridge. Browser proof confirmed the page resolves to:

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
accounting-profit-loss-read                   Build 324 STAGED
```

The Accounting page still auto-loads legacy reads including item costing, journal, GIFI, reconciliation, attachments/imports, close workflow and evidence checks. `accounting-journal` GET remains a confirmed blocker because it calls schema-creation/repair logic before reading.

Marketing, Platform and Administration still need bounded service/runtime work before broader top-level activation.

## Accounting read-time schema mutation retirement

Rule:

> GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema.

Validated/proven before Build 324:

```text
/api/admin/accounting-expenses
/api/admin/accounting-writeoffs
/api/admin/general-ledger-accounts
/api/admin/accounting-summary
/api/admin/accounting-overhead-allocations
/api/admin/accounting-overhead-product-allocations
/api/admin/product-costs
```

Build 324 stages:

```text
/api/admin/accounting-profit-loss
  -> accounting-profit-loss-read Build 324
  -> Accounting-owned service
  -> request_time_schema_mutation=false
```

Confirmed remaining read-time DDL blocker:

```text
/api/admin/accounting-journal
  GET -> fetchJournal() -> ensureJournalSchema()
  creates/repairs journal tables, columns and indexes at request time
```

See `docs/architecture/BUILD323_ACCOUNTING_PAGE_RUNTIME_AUDIT.md` for the full page dependency inventory.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include:

- Orders status changes;
- payment recording/payment actions;
- refunds/disputes;
- gift-card issuance/redemption;
- membership lifecycle changes;
- Customer Documents issue/void;
- Accounting expense/write-off/overhead/product-cost writes;
- General Ledger writes/GIFI finalization;
- broader Accounting journal/post/close actions.

A loader or read-contract migration never implies mutation ownership.

## Next bounded sequence after Build 324

1. Validate Build 324 locally and in Development.
2. Build 325 — extract the automatic Accounting item-costing read into an Accounting-owned non-mutating contract/service.
3. Build 326 — remove request-time schema mutation from Accounting journal GET and expose a dedicated Accounting-owned journal read.
4. Continue only the remaining automatic `/admin/accounting/` read blockers needed for safe runtime activation; do not extract unrelated GETs for build count.
5. When all automatic page reads are owned/non-mutating, activate `/admin/accounting/` as the first read-only `business-administration` runtime page with mutation ownership still false.
6. Separately continue remaining Commerce & Operations route coverage and begin a bounded Creative & Production top-level runtime activation.

## Separate fresh-install schema/data parity track

This remains separate from module extraction.

Priority remains:

```text
fresh-install schema parity
then Development business-data copy/migration
```

Do not copy Production business data into Development until schema parity is independently repaired and validated.

## Production safety

Real Devil n Dove Production remains frozen until a deliberate promotion through the separate Production workflow.

No module-extraction build should implicitly promote `dev`, mutate Production D1/R2, or infer deployment state from a Git branch name.
