# Devil n Dove AI Context — Browser-Proven Through 372 / Builds 373–382 Staged

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities now include:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`
- `docs/architecture/NEXT_20_BUILDS.md`
- architecture notes through Builds 373–382
- validation files through `BUILD373_382_VALIDATION.md`

## Production safety

Real Devil n Dove Production remains frozen unless deliberately promoted through the separate Production workflow. `main` must not advance merely because Development is ahead.

## Authoritative structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain ownership/service boundaries beneath exactly three top-level modules. Core owns shared infrastructure only; business rules remain domain-owned.

## Source control

```text
main = retained Production/legacy release line
dev  = active modularization and Development integration line
```

Application modules are not permanent Git branches.

## Execution cadence — changed 2026-08-25

Work in **10-build execution batches** instead of 3-build slices where the work remains coherent and bounded.

Maintain a rolling **next 20 builds** in:

```text
docs/architecture/NEXT_20_BUILDS.md
```

When a 10-build batch closes, promote the next 10 into active work and append another 10 so two future batches remain visible. Validation evidence may insert a bounded correction build and shift later numbers.

## Current modular state

```text
Core architecture                              302
Core runtime implementation                    305
Commerce & Operations runtime                  371 browser-proven
Operations Membership read contract            362 validated
Operations Membership activation               364 validated
Membership read implementation hardening       365 validated
Operations Today Tasks read contract            366 browser-proven
Operations Today Tasks activation               368 browser-proven
Today Tasks read schema alignment               369 browser-proven / local pending
Operations Custom Requests read contract        370 browser-proven
Operations Custom Requests activation           372 browser-proven / local pending
Custom Requests read-surface cleanup            373–382 staged
Business & Administration Accounting runtime   348 validated
Packaging compatibility baseline               301 validated
Creative Packaging runtime                     351 validated
Creative Process read/runtime                   352–354 validated
Content Studio read/runtime                     355–357 validated
Creative dependency correction                 358 validated
CAIP read/runtime                               359–361 validated
Accounting mutation ownership moved            false
Operations/Membership mutation ownership moved false
Today Tasks mutation ownership moved           false
Custom Requests mutation ownership moved       false
Creative/Packaging mutation ownership moved    false
Content mutation ownership moved               false
CAIP mutation ownership moved                  false
```

Everything through Build 365 is fully validated. All four Creative & Production domains are fully validated at the top-level loader/read boundary; do not expand that loader merely to create activity.

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read/runtime boundary rule

GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema. Never restore request-time DDL/default seeding to an owned startup read because Development reports a schema deficit.

A loader/read-contract migration or top-level runtime activation never implies mutation ownership. Existing compatibility POST/PUT/DELETE/upload/import paths remain legacy until dedicated mutation contracts are separately extracted.

## Validation state

```text
Builds 325–345   fully validated through existing checkpoints
Builds 346–348   fully validated
Builds 349–351   fully validated
Builds 352–354   fully validated 2026-08-25
Builds 355–357   fully validated 2026-08-25
Build 358        fully validated 2026-08-25
Builds 359–361   fully validated 2026-08-25
Builds 362–364   fully validated 2026-08-25 after Build 365 read correction
Build 365        fully validated 2026-08-25
Builds 366–368   browser-proven after Build 369 / local regression pending
Build 369        browser-proven / local regression pending
Builds 370–372   browser-proven / local regression pending
Builds 373–382   staged / local + browser validation required
```

## Creative & Production — closed loader/read boundary

```text
packaging -> /admin/packaging-studio/   validated
creative  -> /admin/creative-process/   validated
content   -> /admin/content-studio/      validated
caip      -> /admin/creative-assets/     validated
```

The Creative top-level runtime creates no network transport and owns no Packaging, Creative, Content, or CAIP mutations.

## Operations Membership — closed through Build 365

Membership is fully validated. Build 362 removed Tier Policy GET-time schema creation; Build 363 registered the passive Membership read service; Build 364 activated `/admin/membership/`; Build 365 hardened the read after an initial browser 500. Development returned database-backed Bronze/Silver/Gold policies with `schema_ready=true`.

## Today Tasks — Builds 366–369

Build 366 added readiness-aware GET contract `operations-today-tasks-read`. Build 367 registered it passively; Build 368 added `/admin/today-tasks/`. Build 369 aligned stale Today Tasks queries to current schema.

Browser revalidation passed exactly on 2026-08-25:

```text
contract_status                200
contract_build                 366
contract_implementation_build  369
schema_ready                   true
missing_tables                 []
query_error_count              0
query_errors                   []
task_count                     2
task_total                     4
service_registered             true
service_contract_build         366
service_implementation_build   369
application_mode               active
active_application_module      commerce-operations
runtime_build                  367
activation_build               368
runtime_state                  active
current_domain                 operations
last_pathname                  /admin/today-tasks/
services_ready                 true
required_services              ["operations-today-tasks-read"]
today_tasks_page_proven        true
creates_network_transport      false
today_tasks_mutation_ownership false
action_mutation_moved          false
contracts_ok                   true
services_ok                    true
```

Browser side is closed. Remaining closure is corrected local regression. The historical Build 339 `hst_gst_review_records` parity finding remains separate.

## Custom Requests — Builds 370–372 browser-proven

Build 370 adds startup-read contract:

```text
/api/admin/contracts/operations-custom-requests-read
```

It forces the mature normal list GET without query parameters, verifies all 23 list/read tables using read-only checks, and never enters the legacy marketplace CSV branch.

Build 371 registers passive service `operations-custom-requests-read`. Build 372 adds `/admin/custom-request/` under Commerce & Operations with exactly that one activation service.

Firefox proof on 2026-08-25 passed exactly:

```text
contract_status                       200
contract_build                        370
schema_ready                          true
missing_tables                        []
checked_table_count                   23
request_time_schema_mutation          false
mutation_ownership_moved              false
compatibility_post_authority          /api/admin/custom-requests
compatibility_post_mutation_moved     false
marketplace_csv_legacy_outside_read   true
request_count                         0
service_registered                    true
service_build                         370
service_schema_ready                  true
service_missing_tables                []
application_module                    commerce-operations
application_mode                      active
active_application_module             commerce-operations
operations_domain                     operations
runtime_entry                         ../modules/commerce-operations/runtime.mjs?v=371
runtime_build                         371
activation_build                      372
runtime_state                         active
current_domain                        operations
last_pathname                         /admin/custom-request/
services_ready                        true
required_service_count                1
required_services                     ["operations-custom-requests-read"]
custom_requests_page_proven           true
creates_network_transport             false
operations_mutation_ownership         false
custom_requests_mutation_ownership    false
custom_requests_mutation_moved        false
contracts_ok                          true
services_ok                           true
```

Browser side is closed. Local regression remains.

## Builds 373–382 — Custom Requests full dedicated-page read surface

The remaining dedicated-page read-side risk was the mature UI's legacy marketplace CSV links:

```text
/api/admin/custom-requests?format=marketplace_csv
```

That compatibility branch still calls the old schema/preset ensure path.

The 10-build batch stages:

```text
373  safe non-mutating marketplace CSV export
374  read-only marketplace export readiness
375  owned startup diagnostics bootstrap
376  safe export toolbar
377  legacy CSV-link rewrite
378  startup schema visibility
379  export schema visibility
380  dedicated-page legacy-export guard
381  regression harness
382  rolling next-20 roadmap / 10-build cadence
```

New safe export authority:

```text
GET /api/admin/contracts/operations-custom-requests-marketplace-export
```

It reads only already-prepared `custom_request_marketplace_export_packs`. It does not create tables, seed presets, create packs, or publish listings.

New readiness authority:

```text
GET /api/admin/contracts/operations-custom-requests-marketplace-export-read
```

It reports required/optional table readiness, pack/preset counts, safe export routes, `request_time_schema_mutation=false`, and `seeds_marketplace_presets=false`.

Dedicated page module:

```text
/public/js/modules/commerce-operations/custom-requests-page-tools.mjs?v=380
```

It:

- reads Build 370 startup readiness;
- reads Build 374 export readiness;
- renders safe all/Etsy/Facebook/Pinterest/manual export links;
- rewrites old `?format=marketplace_csv` links on `/admin/custom-request/`;
- uses MutationObserver + capture guard so later-rendered legacy links cannot call the self-ensuring CSV GET;
- uses no polling/timers;
- leaves every workflow POST on compatibility authority.

Builds 373–382 do not advance the already browser-proven Commerce runtime:

```text
runtime 371
activation 372
```

## Development schema-parity track — separate

```text
Build 324  orders.total_amount|total
Build 338  accounting_fixed_assets.location_note
Build 339  hst_gst_review_records
Build 339  accountant_export_manifests
Build 341  user_profiles.profile_id
Build 341  access_tiers.tier_id
Build 341  payment_disputes.payment_dispute_id
```

Prior parity audit also identified Production-only active tables including `accounting_order_records`, `gift_cards`, several Command Center tables, and the `notification_dispatch_log` aggregate-schema execution discrepancy.

Keep schema parity separate from module activation and resolve it before Production business-data copy.

## Rolling next 20 — Builds 383–402

Authoritative queue: `docs/architecture/NEXT_20_BUILDS.md`.

High-level order:

```text
383–387  Gift Cards schema/read/mutation boundary
388–391  Orders schema/status/payment/fulfillment boundaries
392–393  Today Tasks action authority + schema ownership
394–395  Membership assignment/policy mutation contracts
396–398  Customer Documents read/mutation boundaries
399–402  Accounting/aggregate/Production-only schema parity + fresh-install smoke/data-copy gate
```

Gift Cards intentionally begins with schema authority/parity because `gift_cards` was previously identified as an active runtime table missing from the aggregate fresh-install schema.

## Historical regression rule

Historical regressions verify durable executable boundaries. They must not freeze later shared runtime/cache/read implementations, require later domains/pages to remain inactive, confuse retained mutation authorities with passive activation services, or match explanatory comments instead of executable behavior.

## Next direction

1. Pull current `dev` with automatic Git GC disabled if needed.
2. Run the combined Commerce local block through `build373_382_custom_requests_read_surface_test.py`.
3. Do not repeat Today Tasks or Build 370–372 browser proofs; both already passed.
4. Browser-validate only the new Builds 373–382 safe export/read-surface behavior on `/admin/custom-request/`.
5. If local + browser gates pass, mark Builds 366–382 fully validated as applicable from the accumulated browser evidence.
6. Promote Builds 383–392 from `NEXT_20_BUILDS.md` into the active 10-build batch and append another 10 future rows.
7. Continue fresh-install schema parity before Production business-data copy.

## Validation preference

Use one Git Bash block plus one Firefox-safe browser block for each 10-build execution batch whenever practical.
