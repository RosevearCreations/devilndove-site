# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Build 369 on 2026-08-25.

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
Core architecture                       302
Core runtime implementation             305
Commerce runtime                        367 Today Tasks browser-proven
Operations Membership read contract     362 validated
Operations Membership activation        364 validated
Membership read hardening               365 validated
Operations Today Tasks read contract    366 browser structure proven
Operations Today Tasks activation       368 browser-proven
Today Tasks schema alignment            369 staged
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
Creative mutation ownership moved       false
Content mutation ownership moved        false
CAIP mutation ownership moved           false
```

Everything through Build 365 is fully validated.

## Commerce & Operations

Validated pages through Build 365:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
/admin/membership/
```

Builds 366–368 add the fifth explicit Operations page:

```text
/admin/today-tasks/
```

### Today Tasks boundary

Build 366 replaced silent query-failure-to-zero behavior with an explicit non-mutating read contract:

```text
GET /api/admin/contracts/operations-today-tasks-read
```

Build 367 passively registers `operations-today-tasks-read`. Build 368 adds the dedicated page and activates it under `commerce-operations`. Done/Ignore/Snooze remains compatibility POST `/api/admin/today-task-actions` and is not owned by the top-level runtime.

Initial browser proof on 2026-08-25 proved the loader/runtime boundary but surfaced four read-schema drift errors:

```text
inventory                 no such table: site_items
accounting                no such table: hst_gst_review_records
failed_api                no such column: status
runtime_incident_details  no such column: incident_id
```

The contract still returned HTTP 200, `request_time_schema_mutation=false`, active runtime Build 367 / activation 368, one required read service, `today_tasks_page_proven=true`, and no Today Tasks mutation ownership.

### Build 369 — schema alignment

Source audit showed the errors were stale query assumptions rather than four true missing authorities. Build 369 preserves public contract Build 366 and loader 367/368 while aligning to current schema:

```text
site_items                       -> site_item_inventory
reorder_status/reorder_threshold -> is_on_reorder_list/reorder_level/do_not_reorder
hst_gst_review_records           -> accounting_hst_gst_reviews
runtime_incidents.status         -> review_status
runtime_incidents.incident_id    -> runtime_incident_id
runtime_incidents.request_path   -> endpoint_path
```

It also fixes D1 missing-table parsing so the colon before `SQLITE_ERROR` is not included in the table name.

Build 369 adds no GET-time DDL/DML and does not alter `/api/admin/today-task-actions` mutation authority.

Important: the separate Build 339 `hst_gst_review_records` fresh-install parity finding remains open on the parity track. Build 369 only corrects Today Tasks to use the current accounting authority `accounting_hst_gst_reviews`.

### Custom Requests remains next, but blocked from direct activation

`functions/api/admin/custom-requests.js` still owns a large `ensureSchema()` path containing CREATE/ALTER/INDEX work and is embedded in `/admin/operations/`. Do not activate a new Custom Requests read boundary until its GET/read model is separated from that schema authority.

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

Do not expand or rework that loader merely to create more evidence.

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
Builds 366–368   browser runtime proven; local + Build 369 read revalidation pending
Build 369        staged / local + browser revalidation required
```

## Validation-harness rule

Historical regressions verify durable executable boundaries. They must not freeze later shared runtime/cache/read implementations, require later domains/pages to remain inactive, confuse retained mutation authorities with passive activation services, or fail because explanatory comments contain names of removed legacy mechanisms.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, Membership assignment/policy lifecycle, Today Tasks actions, Custom Requests workflow, Customer Documents actions, Accounting writes, Creative Process project/timeline/content/CAIP/cost edits, CAIP governance/media operations, and Content Studio project/media/deliverable/social-queue actions. Inventory-reviewed material posting/reversal already uses Inventory-owned authorities.

A loader/read-contract migration or top-level runtime activation never implies mutation ownership.

## Next sequence

1. Pull current `dev` and run future-compatible Membership/365 regressions plus Builds 366–368 and Build 369 tests.
2. Browser-revalidate `/admin/today-tasks/` without clicking Done/Ignore/Snooze.
3. Expected after Build 369: Build 366 contract, implementation 369, runtime 367/activation 368, `schema_ready=true`, no missing tables/query errors.
4. If any diagnostic remains, use exact key/message/table and correct the read assumption; do not add DDL to GET.
5. After Today Tasks closes, source-extract Custom Requests read model from its large schema authority before any new activation.
6. Avoid Gift Cards unless schema parity is deliberately the batch target.
7. Continue fresh-install schema parity before Production business-data copy.

## Production safety

Real Production remains frozen until deliberate promotion through the separate Production workflow. No modularization build should implicitly advance `main` or mutate Production D1/R2.
