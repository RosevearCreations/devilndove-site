# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 370–372 on 2026-08-25.

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
main = retained Production/legacy release line
dev  = active modularization and Development integration line
```

Application modules are not permanent Git branches.

## Current identities

```text
Core architecture                         302
Core runtime implementation               305
Commerce runtime                          371 staged
Operations Membership read contract       362 validated
Operations Membership activation          364 validated
Membership read hardening                 365 validated
Operations Today Tasks read contract      366 browser-proven
Operations Today Tasks activation         368 browser-proven
Today Tasks schema alignment              369 browser-proven / local pending
Operations Custom Requests read contract  370 staged
Operations Custom Requests activation     372 staged
Business Accounting activation            348 validated
Packaging baseline                        301 validated
Creative Packaging activation             351 validated
Creative Process read/runtime              352–354 validated
Creative dependency gate fix              358 validated
Content Studio read/runtime                355–357 validated
CAIP read/runtime                          359–361 validated
Accounting mutation ownership moved       false
Operations mutation ownership moved       false
Membership mutation ownership moved       false
Today Tasks mutation ownership moved      false
Custom Requests mutation ownership moved  false
Creative mutation ownership moved         false
Content mutation ownership moved          false
CAIP mutation ownership moved             false
```

Everything through Build 365 is fully validated.

## Commerce & Operations

Explicit Operations coverage is staged as:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
/admin/today-tasks/         operations-today-tasks-read
/admin/custom-request/      operations-custom-requests-read
```

### Today Tasks — Builds 366–369

Build 366 added readiness-aware `operations-today-tasks-read`. Build 367 registered it passively; Build 368 added `/admin/today-tasks/`. Initial browser proof proved the loader but exposed stale query names. Build 369 aligned them to current schema.

Browser revalidation passed on 2026-08-25:

```text
contract_build                 366
contract_implementation_build  369
schema_ready                   true
missing_tables                 []
query_error_count              0
runtime_build                  367
activation_build               368
today_tasks_page_proven        true
today_tasks_mutation_ownership false
```

Browser side is closed; corrected local regressions remain pending.

The historical Build 339 `hst_gst_review_records` parity finding remains separate.

### Custom Requests audit — Builds 370–372

The audit corrected an earlier overstatement. The automatic Custom Requests dashboard read has already avoided `ensureSchema()` since Build 197:

```text
normal GET -> listPayload(db)
```

Its problem is silent degradation: each missing-table query is caught and represented as an empty array, so the UI cannot distinguish missing schema from no data.

The same legacy endpoint also retains:

```text
POST workflow mutations -> ensureSchema(db) + mutation actions
GET ?format=marketplace_csv -> ensureSchema(db) + marketplace preset seed + CSV
```

The marketplace CSV GET therefore remains a legacy compatibility cleanup item and is deliberately outside the owned startup-read boundary.

#### Build 370

Adds:

```text
GET /api/admin/contracts/operations-custom-requests-read
```

The contract:

- rewrites the child request to `/api/admin/custom-requests` with an empty query string;
- cannot enter marketplace CSV mode;
- invokes the mature normal list GET;
- performs read-only readiness checks for all 23 `listPayload` tables;
- reports `schema_ready`, `missing_tables`, `checked_tables`;
- reports `request_time_schema_mutation=false` and `mutation_ownership_moved=false`;
- preserves `/api/admin/custom-requests` as compatibility POST authority.

#### Build 371

Registers passive `operations-custom-requests-read` and advances the shared Commerce runtime. The broad `/admin/operations/` gate stays unchanged.

#### Build 372

Adds dedicated `/admin/custom-request/` page, with Core loaded before the existing mature `admin-custom-requests.js` UI.

No quote, job, product-plan, reply, payment, order, fulfillment, consent, marketplace, or review mutation moves to the top-level runtime.

## Business & Administration

`/admin/accounting/` remains the validated Business & Administration runtime page. Accounting mutations remain compatibility authorities.

## Creative & Production

All four Creative & Production domains remain fully validated:

```text
packaging -> /admin/packaging-studio/
creative  -> /admin/creative-process/
content   -> /admin/content-studio/
caip      -> /admin/creative-assets/
```

Do not expand that loader merely to create more proof.

## Read-time schema rule

> Owned startup GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema.

Legacy compatibility paths that still violate this rule must be explicitly identified and extracted separately; top-level activation never grants permission to move mutation/schema authority silently.

## Development schema-parity track — separate from extraction

```text
orders.total_amount|total                     missing logical revenue column alternative (Build 324)
accounting_fixed_assets.location_note         missing column (Build 338)
hst_gst_review_records                        missing table (Build 339)
accountant_export_manifests                   missing table (Build 339)
user_profiles.profile_id                      missing expected column (Build 341)
access_tiers.tier_id                          missing expected column (Build 341)
payment_disputes.payment_dispute_id           missing expected column (Build 341)
```

Fresh-install schema parity still takes priority over Production business-data copy. Prior audit also found Production-only active tables such as `accounting_order_records`, `gift_cards`, Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy.

## Validation state

```text
Builds 325–365   fully validated through recorded checkpoints
Builds 366–368   browser-proven after Build 369 / local pending
Build 369        browser-proven / local pending
Builds 370–372   staged / local + browser validation required
```

## Validation-harness rule

Historical regressions verify durable executable boundaries. They must not freeze later shared runtime/cache/read implementations, require later domains/pages to remain inactive, confuse retained mutation authorities with passive activation services, or fail because explanatory comments contain names of removed legacy mechanisms.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, Membership assignment/policy lifecycle, Today Tasks actions, Custom Requests workflow + marketplace CSV compatibility, Customer Documents actions, Accounting writes, Creative Process project/timeline/content/CAIP/cost edits, CAIP governance/media operations, and Content Studio project/media/deliverable/social-queue actions.

A loader/read-contract migration or top-level runtime activation never implies mutation ownership.

## Next sequence

1. Pull current `dev` and run Membership/365 plus corrected Today Tasks 366–369 and Custom Requests 370–372 local regressions.
2. Do not repeat the successful Today Tasks browser proof.
3. Browser-validate `/admin/custom-request/` using the Build 370 read contract/runtime only; do not execute workflow POSTs or marketplace CSV export.
4. If Build 370 reports missing tables, record them exactly and keep repair on the schema-parity/migration track.
5. After 370–372 closes, extract the legacy marketplace CSV GET-time ensure/seeding before calling the full Custom Requests GET surface conformant.
6. Avoid Gift Cards unless schema parity is deliberately the batch target.
7. Continue fresh-install schema parity before Production business-data copy.

## Production safety

Real Production remains frozen until deliberate promotion through the separate Production workflow. No modularization build should implicitly advance `main` or mutate Production D1/R2.
