# Devil n Dove AI Context — Fully Validated Through Build 365 / Today Tasks Through Build 369

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, architecture notes through Build 369, and validation files through `BUILD369_VALIDATION.md`.

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
Commerce & Operations runtime                  367 browser-proven on Today Tasks
Operations Membership read contract            362 validated
Operations Membership activation               364 validated
Membership read implementation hardening       365 validated
Operations Today Tasks read contract            366 browser structure proven
Operations Today Tasks activation               368 browser-proven
Today Tasks read schema alignment               369 staged
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
Creative/Packaging mutation ownership moved    false
Content mutation ownership moved               false
CAIP mutation ownership moved                  false
```

Everything through Build 365 is fully validated. All four Creative & Production domains are fully validated at the top-level loader/read boundary; do not expand that loader merely to create more evidence.

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read/runtime boundary rule

GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema. Never restore request-time DDL/default seeding to a read because Development reports a schema deficit.

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
Builds 366–368   browser runtime proven; read alignment + local gates pending
Build 369        staged / local + browser revalidation required
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

Today Tasks was chosen ahead of Custom Requests because its GET was already SELECT-only, its mutations were already separate at `POST /api/admin/today-task-actions`, and `/admin/today-tasks` was already classified Operations but had no real page. Custom Requests remains excluded because `functions/api/admin/custom-requests.js` still owns a large CREATE/ALTER `ensureSchema()` path.

### Build 366

Adds readiness-aware non-mutating read contract:

```text
GET /api/admin/contracts/operations-today-tasks-read
```

It reports `schema_ready`, `missing_tables`, and `query_errors` instead of silently converting failed reads to zero.

### Build 367/368

Registers passive service `operations-today-tasks-read`, adds `/admin/today-tasks/`, and activates it under `commerce-operations` with exactly one read service. Done/Ignore/Snooze remains `/api/admin/today-task-actions`; top-level mutation ownership remains false.

### Initial browser proof — 2026-08-25

Runtime structure passed exactly:

```text
contract_status                    200
contract_build                     366
service_registered                 true
application_module                 commerce-operations
application_mode                   active
active_application_module          commerce-operations
operations_domain                  operations
runtime_entry                      ../modules/commerce-operations/runtime.mjs?v=367
runtime_build                      367
activation_build                   368
runtime_state                      active
current_domain                     operations
last_pathname                      /admin/today-tasks/
services_ready                     true
required_service_count             1
required_services                  ["operations-today-tasks-read"]
today_tasks_page_proven            true
creates_network_transport          false
operations_mutation_ownership      false
today_tasks_mutation_ownership     false
contracts_ok                       true
services_ok                        true
```

Read diagnostics exposed four drifted assumptions:

```text
inventory                 D1_ERROR no such table: site_items
accounting                D1_ERROR no such table: hst_gst_review_records
failed_api                D1_ERROR no such column: status
runtime_incident_details  D1_ERROR no such column: incident_id
```

The parser also returned `site_items:` and `hst_gst_review_records:` with trailing punctuation.

### Build 369

Build 369 preserves public contract Build 366 and runtime/activation 367/368, but aligns the read implementation to current schema:

```text
site_items                       -> site_item_inventory
reorder_status/reorder_threshold -> is_on_reorder_list/reorder_level/do_not_reorder
hst_gst_review_records           -> accounting_hst_gst_reviews
runtime_incidents.status         -> review_status
runtime_incidents.incident_id    -> runtime_incident_id
runtime_incidents.request_path   -> endpoint_path
```

Missing-table parsing now excludes punctuation before `SQLITE_ERROR`. The contract/service surface `implementation_build=369` / `implementationBuild=369`.

No GET-time DDL/DML was added. Today Tasks action mutation ownership remains retained compatibility.

Important: the historical Build 339 `hst_gst_review_records` missing-table parity finding remains separate. Build 369 does not erase or repair that older parity item; it only stops Today Tasks from querying the obsolete name when the current accounting authority is `accounting_hst_gst_reviews`.

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
2. Run future-compatible Membership/365 regressions plus Builds 366–368 and Build 369 regressions.
3. Browser-revalidate `/admin/today-tasks/` with GET/runtime checks only. Do not click Done/Ignore/Snooze.
4. Expected after Build 369: contract Build 366, implementation Build 369, runtime 367/activation 368, `schema_ready=true`, `missing_tables=[]`, `query_errors=[]`.
5. If any diagnostic remains, use its exact key/message/table; do not add DDL to GET.
6. After Today Tasks closes, return to Custom Requests for a real read-model/schema-authority extraction; do not activate its current schema-coupled GET unchanged.
7. Avoid Gift Cards unless schema parity is deliberately the batch target.
8. Continue fresh-install schema parity before Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus Firefox-safe browser blocks whenever practical.
