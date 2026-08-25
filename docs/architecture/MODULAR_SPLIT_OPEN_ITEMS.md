# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 366–368 on 2026-08-25.

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
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Application modules are not permanent Git branches.

## Current identities

```text
Core architecture                       302
Core runtime implementation             305
Commerce runtime                        367 staged
Operations Membership read contract     362 validated
Operations Membership activation        364 validated
Membership read hardening               365 validated
Operations Today Tasks read contract    366 staged
Operations Today Tasks activation       368 staged
Contract catalog                        345
Default passive adapters                345
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

Validated Operations pages before the current batch:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
/admin/membership/
```

Builds 366–368 stage a fifth explicit Operations page:

```text
/admin/today-tasks/
```

### Membership boundary — Builds 362–365

Membership remains fully validated. Build 362 established a non-mutating Tier Policy read authority and GET-only `operations-membership-read`; Build 363 registered it passively; Build 364 activated `/admin/membership/`; Build 365 hardened the read against legacy table shapes after an initial browser 500.

Development browser + local validation ultimately returned database-backed Bronze/Silver/Gold policies, `schema_ready=true`, active Commerce runtime, one Membership service, and no Membership mutation ownership.

Historical Membership and Build 365 regressions are now future-compatible with later shared Commerce runtime/cache builds.

### Today Tasks audit

The audit compared Today Tasks with Custom Requests.

Today Tasks was chosen because:

- its GET was already SELECT-only;
- its read failures were silently caught and converted to zero counts;
- the route prefix `/admin/today-tasks` was already classified as Operations;
- no dedicated page existed yet;
- Done/Ignore/Snooze mutations were already separate at `POST /api/admin/today-task-actions`.

Custom Requests remains outside this batch because `functions/api/admin/custom-requests.js` still has a large `ensureSchema()` authority with CREATE/ALTER/INDEX work and is embedded in the broad `/admin/operations/` workspace.

### Build 366 — readiness-aware Today Tasks read

Build 366 adds non-mutating read service plus:

```text
GET /api/admin/contracts/operations-today-tasks-read
```

The read exposes:

```text
schema_ready
missing_tables
query_errors
request_time_schema_mutation=false
mutation_ownership_moved=false
```

Available task counts still render when one source query fails. Missing-table/query failures are no longer silently represented as zero.

Known schema-parity findings such as `hst_gst_review_records` may surface here. Do not add DDL to GET.

### Build 367 — passive Commerce service

Registers:

```text
operations-today-tasks-read
```

Operations prerequisites become:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
/admin/today-tasks/         operations-today-tasks-read
```

The runtime creates no network transport and owns no Today Tasks mutations.

### Build 368 — dedicated Today Tasks page

Adds `/admin/today-tasks/` and loads Core before `admin-today-tasks.js`.

Automatic page load uses the Build 366 GET contract. Done/Ignore/Snooze continues to use retained compatibility POST `/api/admin/today-task-actions` only after explicit administrator action.

No Custom Requests, Gift Cards, Membership, Accounting, Creative, SQL migration, or Cloudflare configuration authority is moved by this activation.

## Business & Administration

`/admin/accounting/` remains the validated Business & Administration runtime page. Builds 343–348 are fully validated. Accounting mutations remain compatibility authorities.

## Creative & Production

Build 301 remains the completed Packaging compatibility baseline. Builds 349–351 are fully validated.

All four Creative & Production domains are fully validated at the loader/read boundary:

```text
creative-production
  packaging -> /admin/packaging-studio/   validated
  creative  -> /admin/creative-process/   validated
  content   -> /admin/content-studio/      validated
  caip      -> /admin/creative-assets/     validated
```

Do not expand this loader further merely to create more proof.

## Read-time schema rule

> GET/read paths report or verify schema readiness; migrations/readiness tooling creates or repairs schema.

Never use top-level runtime activation as permission to add request-time DDL/default seeding or move mutations.

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
Builds 325–330   fully validated
Builds 331–336   fully validated 2026-08-24
Builds 337–339   fully validated 2026-08-24 (+ schema parity for 338/339)
Builds 340–342   fully validated 2026-08-24 (+ schema parity for 341)
Builds 343–345   fully validated 2026-08-24
Builds 346–348   fully validated 2026-08-24
Builds 349–351   fully validated 2026-08-24
Builds 352–354   fully validated 2026-08-25
Builds 355–357   fully validated 2026-08-25
Build 358        fully validated 2026-08-25
Builds 359–361   fully validated 2026-08-25
Builds 362–364   fully validated 2026-08-25 after Build 365 correction
Build 365        fully validated 2026-08-25
Builds 366–368   staged / local + browser validation required
```

## Validation-harness rule

Historical regressions verify durable executable boundaries. They must not freeze later shared runtime/cache/read implementations, require later domains/pages to remain inactive, confuse retained mutation authorities with passive activation services, or fail because explanatory comments contain names of removed legacy mechanisms.

## Mutation-authority extraction still open

Compatibility writes still requiring dedicated authority reviews include Orders/payment flows, gift cards, Membership assignment/policy lifecycle, Today Tasks actions, Custom Requests workflow, Customer Documents actions, Accounting writes, Creative Process project/timeline/content/CAIP/cost edits, CAIP governance/media operations, and Content Studio project/media/deliverable/social-queue actions. Inventory-reviewed material posting/reversal already uses Inventory-owned authorities.

A loader, read-contract migration, or top-level runtime activation never implies mutation ownership.

## Next batched sequence

1. Pull staged Builds 366–368 and run the future-compatible Membership/365 regressions plus the new Today Tasks regression.
2. Browser-validate `/admin/today-tasks/` without clicking Done/Ignore/Snooze.
3. Accept `schema_ready=true` or explicit `schema_ready=false` with `missing_tables/query_errors`; the latter is parity evidence.
4. If local + browser gates pass, close Builds 366–368.
5. Then source-audit Custom Requests for a real non-mutating read-model extraction; do not activate its current schema-coupled GET unchanged.
6. Avoid Gift Cards unless schema parity is deliberately the batch target.
7. Continue fresh-install schema parity separately before Production business-data copy.

## Production safety

Real Devil n Dove Production remains frozen until deliberate promotion through the separate Production workflow. No module-extraction/runtime build should implicitly promote `dev` or mutate Production D1/R2.
