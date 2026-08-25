# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through completed Build 319.

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

Core owns only shared infrastructure:

- authentication/session/current-user context;
- module registry and lifecycle;
- route/domain/application-module resolution;
- passive contract/service registration;
- common request/runtime/error helpers;
- module availability and diagnostics.

Core must not own Catalog, Inventory, Creative, Packaging, Content, Marketing, Accounting, order, payment, gift-card, membership, or other business rules.

Current identities after Build 319:

```text
Core architecture            302
Core runtime implementation  305
Contract catalog             319
Passive service adapters     319
Commerce runtime             315
```

Advancing the contract catalog does not imply Core absorbed Accounting logic. Accounting read implementations remain owner=`accounting`.

## Source-control state

Permanent branch model:

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Build 319 verification proved `dev` contains `main` with zero commits missing from `main`; Development has surpassed the old baseline.

Application modules are not permanent Git branches. See `docs/architecture/SOURCE_CONTROL_BRANCHING.md`.

Historical retirement candidates still present:

```text
build291-candidate
build292-candidate
build293-candidate
build294-candidate
build317-accounting-writeoffs
```

The historical candidate branches were previously proven fully contained in `dev`. The Build 317 branch was a temporary isolation checkpoint whose source was fast-forward integrated into `dev`. These are cleanup-only refs, not active development lines.

## Current application-module state

### Commerce & Operations

Proven Operations pages through Build 315:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

Commerce runtime remains Build 315 and Operations mutation ownership remains false.

Remaining Operations loader/runtime coverage:

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

Business & Administration is not yet top-level runtime-active, but Accounting extraction is now materially ahead of the old monolith.

Owned Accounting reads now include:

```text
accounting-read                   Build 312 COMPLETE
accounting-expenses-read          Build 316 COMPLETE
accounting-writeoffs-read         Build 317 COMPLETE
accounting-general-ledger-read    Build 318 COMPLETE
accounting-summary-read           Build 319 COMPLETE
```

Marketing, Platform and Administration still need bounded service/runtime work before broader top-level activation.

## Accounting read-time schema mutation retirement

Rule:

> GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema.

Completed/proven:

```text
/api/admin/accounting-expenses
  -> accounting-expenses-read Build 316

/api/admin/accounting-writeoffs
  -> accounting-writeoffs-read Build 317

/api/admin/general-ledger-accounts
  -> accounting-general-ledger-read Build 318

/api/admin/accounting-summary
  -> accounting-summary-read Build 319
```

Each corresponding GET is schema-aware and non-mutating. Existing POST/write behavior remains separate where present.

Remaining Accounting read-time DDL candidates to inspect next:

```text
functions/api/admin/accounting-overhead-allocations.js
functions/api/admin/accounting-overhead-product-allocations.js
functions/api/admin/product-costs.js
```

Additional Accounting reports/exports should be audited for hidden ensure/repair calls before Business & Administration runtime activation.

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

## Recommended next bounded sequence

1. Build 320 — Accounting overhead allocations read extraction.
2. Build 321 — Accounting overhead-product allocations read extraction.
3. Build 322 — Product-cost read extraction.
4. Audit `/admin/accounting/` loader and dependencies for a first read-only Business & Administration runtime activation.
5. Separately continue remaining Commerce & Operations route coverage.
6. Then begin a bounded Creative & Production top-level runtime activation using already-owned Packaging/Creative/Inventory boundaries.

## Separate fresh-install schema/data parity track

This remains separate from module extraction.

Request-time DDL is a symptom of weak schema lifecycle discipline, but these modular builds do not edit aggregate schema or migrations.

Priority remains:

```text
fresh-install schema parity
then Development business-data copy/migration
```

Do not copy Production business data into Development until schema parity is independently repaired and validated.

## Production safety

Real Devil n Dove Production remains frozen until a deliberate promotion through the separate Production workflow.

No module-extraction build should implicitly promote `dev`, mutate Production D1/R2, or infer deployment state from a Git branch name.
