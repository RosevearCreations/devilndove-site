# Devil n Dove AI Context — Fully Validated Through Build 365 / Today Tasks Browser-Proven Through 369 / Custom Requests Staged 370–372

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, architecture notes through Build 372, and validation files through `BUILD370_372_VALIDATION.md`.

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

## Current modular state

```text
Core architecture                              302
Core runtime implementation                    305
Commerce & Operations runtime                  371 staged
Operations Membership read contract            362 validated
Operations Membership activation               364 validated
Membership read implementation hardening       365 validated
Operations Today Tasks read contract            366 browser-proven
Operations Today Tasks activation               368 browser-proven
Today Tasks read schema alignment               369 browser-proven / local pending
Operations Custom Requests read contract        370 staged
Operations Custom Requests activation           372 staged
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

Everything through Build 365 is fully validated. All four Creative & Production domains are fully validated at the top-level loader/read boundary; do not expand that loader merely to create more evidence.

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
Builds 370–372   staged / local + browser validation required
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

Initial browser diagnostics exposed:

```text
site_items                       obsolete for this read
hst_gst_review_records           obsolete for this read
runtime_incidents.status         obsolete column
runtime_incidents.incident_id    obsolete column
runtime_incidents.request_path   obsolete column
```

Build 369 aligned to:

```text
site_item_inventory
accounting_hst_gst_reviews
runtime_incident_id
review_status
endpoint_path
```

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

Browser side is closed. Remaining closure is the corrected local regression. The historical Build 339 `hst_gst_review_records` parity finding remains separate and is not erased by Build 369.

## Custom Requests audit — Builds 370–372

The audit corrected an earlier overstatement: the automatic Custom Requests dashboard list GET has already avoided `ensureSchema()` since Build 197. Its real startup-read problem is that every missing-table query is caught and silently converted to an empty list.

The legacy endpoint still has a large `ensureSchema()` authority for POST workflow actions. Its explicit `?format=marketplace_csv` GET also calls `ensureSchema()` and seeds marketplace presets. That export GET is not part of the owned startup-read boundary and remains a later compatibility cleanup target.

### Build 370

Adds GET-only owned contract:

```text
/api/admin/contracts/operations-custom-requests-read
```

The contract:

- forces `/api/admin/custom-requests` with an empty query string, so it cannot enter marketplace CSV mode;
- invokes the mature normal list GET;
- performs read-only `PRAGMA table_info` readiness checks for all 23 tables used by `listPayload`;
- returns `schema_ready`, `missing_tables`, `checked_tables`;
- reports `request_time_schema_mutation=false`;
- reports `mutation_ownership_moved=false`;
- leaves `/api/admin/custom-requests` as compatibility POST authority;
- explicitly reports `marketplace_csv_legacy_get_outside_contract=true`.

### Build 371

Registers passive service:

```text
operations-custom-requests-read
```

Commerce runtime advances to Build 371 / activation Build 372. The broad `/admin/operations/` page keeps its existing `catalog-read`, `inventory-read`, `accounting-read` gate.

### Build 372

Adds dedicated page:

```text
/admin/custom-request/
```

It loads Core before the mature `admin-custom-requests.js` UI. The UI still uses compatibility GET/POST paths; the top-level runtime separately proves the owned read boundary. No quote, job, product-plan, reply, payment, order, fulfillment, consent, marketplace, or review mutation moves.

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

## Historical regression rule

Historical regressions verify durable executable boundaries. They must not freeze later shared runtime/cache/read implementations, require later domains/pages to remain inactive, confuse retained mutation authorities with passive activation services, or match explanatory comments instead of executable behavior.

## Next direction

1. Pull current `dev` with automatic Git GC disabled if needed.
2. Run Membership/365 regressions plus corrected Today Tasks 366–369 and new Custom Requests 370–372 regression.
3. Do not repeat the Today Tasks browser proof; it has already passed after Build 369.
4. Browser-validate `/admin/custom-request/` using the Build 370 read contract/runtime only. Do not execute workflow mutations or marketplace CSV export during proof.
5. If the Build 370 contract reports missing tables, record them as schema-readiness evidence; do not repair schema in GET.
6. After 370–372 closes, separately extract/retire the legacy marketplace CSV GET-time schema ensure/seeding before calling the entire Custom Requests GET surface conformant.
7. Avoid Gift Cards unless schema parity is deliberately the batch target.
8. Continue fresh-install schema parity before Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus Firefox-safe browser blocks whenever practical.
