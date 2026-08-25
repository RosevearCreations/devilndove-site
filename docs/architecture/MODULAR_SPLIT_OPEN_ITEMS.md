# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 373–382 on 2026-08-25.

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

## Execution cadence

As of 2026-08-25, use **10-build execution batches** when work remains coherent and bounded.

Maintain the rolling next 20 builds in:

```text
docs/architecture/NEXT_20_BUILDS.md
```

Validation evidence can insert correction builds and shift later numbers; safety and accurate validation labels override the planned numbering.

## Current identities

```text
Core architecture                       302
Core runtime implementation             305
Commerce runtime                        371 browser-proven
Operations Membership read contract     362 validated
Operations Membership activation        364 validated
Membership read hardening               365 validated
Operations Today Tasks read contract    366 browser-proven
Operations Today Tasks activation       368 browser-proven
Today Tasks schema alignment            369 browser-proven / local pending
Operations Custom Requests read         370 browser-proven
Operations Custom Requests activation   372 browser-proven / local pending
Custom Requests read-surface cleanup    373–382 staged
Business Accounting activation          348 validated
Packaging baseline                      301 validated
Creative Packaging activation           351 validated
Creative Process read/runtime            352–354 validated
Creative dependency gate fix            358 validated
Content Studio read/runtime              355–357 validated
CAIP read/runtime                        359–361 validated
Accounting mutation ownership moved     false
Operations mutation ownership moved     false
Membership mutation ownership moved     false
Today Tasks mutation ownership moved    false
Custom Requests mutation ownership      false
Creative mutation ownership moved       false
Content mutation ownership moved        false
CAIP mutation ownership moved           false
```

Everything through Build 365 is fully validated.

## Commerce & Operations

Explicit Operations runtime pages are now:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
/admin/membership/
/admin/today-tasks/
/admin/custom-request/
```

The broad first three pages retain the proven legacy Operations read-service gate. Membership, Today Tasks, and Custom Requests use page-specific read services.

### Membership — closed through Build 365

Membership is fully validated. Build 362 established a non-mutating Tier Policy read authority; Build 363 registered it passively; Build 364 activated `/admin/membership/`; Build 365 hardened the read after an initial browser 500.

Development returned database-backed Bronze/Silver/Gold policies with `schema_ready=true`.

### Today Tasks — Builds 366–369

Build 366 added readiness-aware `operations-today-tasks-read`; Build 367 registered it passively; Build 368 added `/admin/today-tasks/`; Build 369 aligned the read to current Inventory/Accounting/runtime-incident schema names.

Final Firefox revalidation returned:

```text
contract Build 366 / implementation 369
schema_ready=true
missing_tables=[]
query_errors=[]
runtime 367 / activation 368
required service operations-today-tasks-read
page proven true
mutation ownership false
```

Browser side is closed. Local regressions remain pending.

The separate Build 339 `hst_gst_review_records` fresh-install parity finding remains open; Today Tasks simply no longer queries that obsolete name.

### Custom Requests — Builds 370–372

Build 370 adds readiness-aware startup contract:

```text
GET /api/admin/contracts/operations-custom-requests-read
```

It verifies all 23 tables used by the mature list payload with read-only checks and forces the normal list path so it cannot enter marketplace CSV mode.

Build 371 registers the passive service. Build 372 adds `/admin/custom-request/` under Commerce & Operations.

Firefox proof passed exactly on 2026-08-25:

```text
contract_status                     200
contract_build                      370
schema_ready                        true
missing_tables                      []
checked_table_count                 23
service_registered                  true
runtime_build                       371
activation_build                    372
required_services                   ["operations-custom-requests-read"]
custom_requests_page_proven         true
creates_network_transport           false
custom_requests_mutation_ownership  false
```

Browser side is closed. Local regression remains pending.

### Builds 373–382 — complete the dedicated Custom Requests read surface

The mature Custom Requests UI still renders marketplace CSV links that historically targeted:

```text
/api/admin/custom-requests?format=marketplace_csv
```

That compatibility branch calls the large legacy schema/preset ensure authority. Rather than modifying the huge mature workflow implementation in this batch, the dedicated page now receives owned non-mutating export/read tools.

Ten-update batch:

```text
373  non-mutating marketplace CSV export
374  marketplace export readiness read
375  dedicated-page owned-read diagnostics bootstrap
376  safe export toolbar
377  legacy CSV-link rewrite
378  startup schema visibility
379  export schema visibility
380  dedicated-page legacy-export guard
381  regression harness
382  rolling next-20 roadmap / 10-build cadence
```

Safe export:

```text
GET /api/admin/contracts/operations-custom-requests-marketplace-export
```

It reads already-prepared `custom_request_marketplace_export_packs` only and never creates schema, seeds presets, creates packs, or publishes anything.

Export readiness:

```text
GET /api/admin/contracts/operations-custom-requests-marketplace-export-read
```

It reports required/optional schema readiness, pack/preset counts, and safe export routes using read-only checks.

Dedicated page tools:

```text
/public/js/modules/commerce-operations/custom-requests-page-tools.mjs?v=380
```

They render diagnostics and safe exports, rewrite the older CSV links as they appear, and use a MutationObserver/capture guard on `/admin/custom-request/`. There is no polling.

Builds 373–382 do not advance shared Commerce runtime 371 / activation 372 and do not move any Custom Requests mutation authority.

## Business & Administration

`/admin/accounting/` remains the validated Business & Administration runtime page. Builds 343–348 are fully validated. Accounting mutations remain compatibility authorities.

## Creative & Production

All four Creative & Production domains remain fully validated:

```text
packaging -> /admin/packaging-studio/
creative  -> /admin/creative-process/
content   -> /admin/content-studio/
caip      -> /admin/creative-assets/
```

Do not expand or rework that loader merely to create activity.

## Read-time schema rule

> GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema.

Never use top-level activation as permission to add request-time DDL/default seeding or move mutations.

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
Builds 366–368   browser-proven after Build 369 / local regression pending
Build 369        browser-proven / local regression pending
Builds 370–372   browser-proven / local regression pending
Builds 373–382   staged / local + browser validation required
```

## Rolling next 20 — Builds 383–402

See `docs/architecture/NEXT_20_BUILDS.md` for the authoritative queue.

High-level order:

```text
383–387  Gift Cards schema/read/mutation boundary
388–391  Orders schema/status/payment/fulfillment boundaries
392–393  Today Tasks action authority/schema ownership
394–395  Membership assignment/policy mutation contracts
396–398  Customer Documents read/mutation boundaries
399–402  Accounting/aggregate/Production-only schema parity + fresh-install smoke/data-copy gate
```

Gift Cards begins with parity rather than activation because `gift_cards` was previously identified as an active table missing from the aggregate fresh-install schema.

## Validation-harness rule

Historical regressions verify durable executable boundaries. They must not freeze later shared runtime/cache/read implementations, require later domains/pages to remain inactive, confuse retained mutation authorities with passive activation services, or fail because explanatory comments contain names of removed legacy mechanisms.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, Membership assignment/policy lifecycle, Today Tasks actions, Custom Requests workflow, Customer Documents actions, Accounting writes, Creative Process project/timeline/content/CAIP/cost edits, CAIP governance/media operations, and Content Studio project/media/deliverable/social-queue actions.

Inventory-reviewed material posting/reversal already uses Inventory-owned authorities.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next sequence

1. Pull current `dev`.
2. Run the accumulated Commerce local regressions through `build373_382_custom_requests_read_surface_test.py`.
3. Do not repeat Today Tasks or Build 370–372 browser proof; both already passed.
4. Browser-validate only Builds 373–382 on `/admin/custom-request/` using owned read/export checks and no workflow mutations.
5. If the local + browser gates pass, close the accumulated 366–382 boundaries according to their recorded evidence.
6. Promote Builds 383–392 into the active 10-build batch and append another 10 future rows to `NEXT_20_BUILDS.md`.
7. Continue fresh-install schema parity before Production business-data copy.

## Production safety

Real Production remains frozen until deliberate promotion through the separate Production workflow. No modularization build should implicitly advance `main` or mutate Production D1/R2.
