# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Build 322.

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
Contract catalog             322
Passive service adapters     322
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

Business & Administration is not yet top-level runtime-active, but Accounting extraction is now broad enough for a bounded runtime audit.

Owned Accounting reads now include:

```text
accounting-read                               Build 312 COMPLETE
accounting-expenses-read                      Build 316 COMPLETE
accounting-writeoffs-read                     Build 317 COMPLETE
accounting-general-ledger-read                Build 318 COMPLETE
accounting-summary-read                       Build 319 COMPLETE
accounting-overhead-allocations-read          Build 320 STAGED
accounting-overhead-product-allocations-read  Build 321 STAGED
accounting-product-costs-read                 Build 322 STAGED
```

Marketing, Platform and Administration still need bounded service/runtime work before broader top-level activation.

## Accounting read-time schema mutation retirement

Rule:

> GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema.

Completed/proven before this pass:

```text
/api/admin/accounting-expenses
/api/admin/accounting-writeoffs
/api/admin/general-ledger-accounts
/api/admin/accounting-summary
```

Staged in Builds 320–322:

```text
/api/admin/accounting-overhead-allocations
  -> accounting-overhead-allocations-read Build 320

/api/admin/accounting-overhead-product-allocations
  -> accounting-overhead-product-allocations-read Build 321

/api/admin/product-costs
  -> accounting-product-costs-read Build 322
```

Each corresponding GET is schema-aware and non-mutating. Existing POST/write behavior remains separate.

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

## Next bounded sequence after Builds 320–322 validate

1. Audit `/admin/accounting/` page, loader, scripts and API dependencies.
2. If its current read dependencies are covered by Accounting-owned contracts, activate the first read-only `business-administration` runtime page.
3. Keep mutation ownership false until dedicated Accounting write contracts are extracted.
4. Separately continue remaining Commerce & Operations route coverage.
5. Begin a bounded Creative & Production top-level runtime activation using already-owned Packaging/Creative/Inventory boundaries.
6. Audit remaining Accounting reports/exports for hidden read-time DDL only where that blocks Business & Administration activation.

Do not continue extracting every Accounting GET merely for build count if runtime activation is now safe.

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
