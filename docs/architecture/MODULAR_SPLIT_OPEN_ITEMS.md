# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated during Build 316.

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

Core may own only shared infrastructure:

- authentication/session/current-user context;
- module registry and lifecycle;
- route/domain/application-module resolution;
- passive contract/service registration;
- common request/runtime/error helpers;
- module availability and diagnostics.

Core must not own Catalog, Inventory, Creative, Packaging, Content, Marketing, Accounting, order, payment, gift-card, membership, or other business rules.

Build 316 adds explicit build identities to the cross-module contract catalog and passive service-adapter registry. Core runtime implementation remains Build 305. The new `accounting-expenses-read` contract is owned by Accounting, not Core.

## Source-control rule: application modules are not Git branches

Repository branches observed during Build 316:

```text
main
dev
build291-candidate
build292-candidate
build293-candidate
build294-candidate
```

The four historical candidate branches are fully contained in `dev`:

```text
build291-candidate -> dev: behind_by 0
build292-candidate -> dev: behind_by 0
build293-candidate -> dev: behind_by 0
build294-candidate -> dev: behind_by 0
```

They may be retired later after explicit approval. Build 316 does not delete branches.

Do not create permanent Git branches named for Commerce & Operations, Creative & Production, or Business & Administration. Those are independently loadable application modules inside the same integrated codebase and must continue to compose through Core contracts.

`dev` remains the active modularization/integration branch. `main` remains separate from the Development work. A Git branch name alone must never be treated as proof of what Cloudflare has deployed; real Production remains governed by the separate release/promotion workflow.

## Current application-module state

### Commerce & Operations

Active runtime work is furthest along.

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

Packaging has a proven domain runtime/compatibility checkpoint, and Creative inventory post/reversal consumers have been cut over to Inventory-owned authorities.

Still open:

- top-level `creative-production` application runtime activation;
- retirement of broad `creative-process-compat.js` only after every unrelated action has an owned destination;
- standalone historical Build 308 local regression was not captured and must not be silently relabeled complete;
- CAIP and Content service/contract extraction remains incomplete;
- Packaging should remain domain-owned and must not be absorbed into Core.

### Business & Administration

This top-level module is still largely planned rather than runtime-active.

Accounting is the best current extraction path because read contracts already exist:

```text
accounting-read              Build 312
accounting-expenses-read     Build 316
```

Marketing, Platform and Administration still require their own bounded contracts/runtime work before the top-level Business & Administration runtime can be activated safely.

## Accounting read-time schema mutation retirement queue

Build 316 establishes the rule:

> GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema.

Completed in Build 316:

```text
/api/admin/accounting-expenses GET
  -> delegates to Accounting-owned read service
  -> no request-time DDL
  -> no ambiguous expense_id join
  -> legacy POST remains compatibility write behavior
```

Confirmed remaining legacy GET/schema-mutation areas include:

```text
functions/api/admin/accounting-summary.js
functions/api/admin/accounting-writeoffs.js
functions/api/admin/general-ledger-accounts.js
```

Repository audit/search also identifies these as the same follow-on class and they must be inspected before cutover:

```text
functions/api/admin/accounting-overhead-allocations.js
functions/api/admin/accounting-overhead-product-allocations.js
functions/api/admin/product-costs.js
```

Recommended order:

1. write-offs read contract/cutover;
2. overhead allocations read contract/cutover;
3. product-cost reads;
4. GL account reads;
5. remaining Accounting summaries/exports that still repair schema during GET.

Do not move the corresponding POST/write authority in the same build unless that write has a separately reviewed contract.

## Mutation-authority extraction still open

These areas remain compatibility behavior and require dedicated authority reviews:

- Orders status changes;
- payment recording and payment actions;
- refunds/disputes where applicable;
- gift-card issuance/redemption;
- membership lifecycle changes;
- Customer Documents issue/void actions;
- Accounting expense/write-off/overhead/product-cost writes;
- broader Accounting journal/post/close actions.

The runtime shell must not claim ownership merely because a page has been loader-migrated.

## Core/contract cleanup queue

1. Continue giving contract catalogs and passive adapter registries explicit build identities.
2. Add business services only with a non-Core owner.
3. Keep application-module runtime build identities separate from Core implementation build identity.
4. Do not place SQL/DDL in Core browser/runtime files.
5. Prefer compatibility wrappers that delegate reads to domain services while old writes remain isolated.
6. Retire compatibility files only when all actions they contain have owned destinations.

## Separate fresh-install schema/data parity track

This remains separate from module extraction.

Request-time DDL in legacy GET handlers is a symptom of incomplete schema lifecycle discipline, but Build 316 does not edit aggregate schema or migrations.

Priority remains:

```text
fresh-install schema parity
then Development business-data copy/migration
```

Do not copy Production business data into Development until schema parity is repaired and independently validated.

## Production safety

Real Devil n Dove Production remains frozen at Build 280 unless deliberately promoted through the separate Production workflow.

No module-extraction build should implicitly merge/promote `dev` to Production, mutate Production D1/R2, or infer Production state from Git branch names alone.
