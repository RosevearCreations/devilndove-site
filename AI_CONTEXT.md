# Devil n Dove AI Context — Fully Validated Through Build 365 / Builds 366–368 Staged

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`, architecture notes through Build 368, and validation files through `BUILD366_368_VALIDATION.md`.

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

## Source-control rule

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Application modules are not permanent Git branches.

## Current modular state

```text
Core architecture                              302
Core runtime implementation                    305
Commerce & Operations runtime                  367 staged
Operations Membership read contract            362 validated
Operations Membership activation               364 validated
Membership read implementation hardening       365 validated
Operations Today Tasks read contract            366 staged
Operations Today Tasks activation               368 staged
Business & Administration Accounting runtime   348 validated
Packaging compatibility baseline               301 validated
Creative Packaging runtime                     351 validated
Creative Process read/runtime                   352–354 validated
Content Studio read/runtime                     355–357 validated
Creative dependency correction                 358 validated
CAIP read/runtime                               359–361 validated
Contract catalog                               345
Default passive service adapters               345
Accounting mutation ownership moved            false
Operations/Membership mutation ownership moved false
Today Tasks mutation ownership moved           false
Creative/Packaging mutation ownership moved    false
Content mutation ownership moved               false
CAIP mutation ownership moved                  false
```

Everything through Build 365 is fully validated. All four Creative & Production domains are fully validated at the top-level loader/read boundary. Do not expand or rework that loader merely to create more evidence.

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
Builds 366–368   staged / local + browser validation required
```

Latest user-run local checkpoint:

```text
BUILD 365 MEMBERSHIP READ RESILIENCE: PASS
No Cloudflare resource was contacted.
9a999d33
```

## Creative & Production — closed loader/read boundary

```text
packaging -> /admin/packaging-studio/   validated
creative  -> /admin/creative-process/   validated
content   -> /admin/content-studio/      validated
caip      -> /admin/creative-assets/     validated
```

The Creative top-level runtime creates no network transport and owns no Packaging, Creative, Content, or CAIP mutations.

## Operations Membership — Builds 362–365

Membership is fully validated. Build 362 removed Tier Policy GET-time schema creation, Build 363 registered the passive Membership read service, Build 364 activated `/admin/membership/`, and Build 365 hardened the legacy table read after an initial browser 500.

Development returned database-backed Bronze/Silver/Gold policies with `schema_ready=true`; no Membership table parity deficit was observed.

## Today Tasks audit — why it was chosen next

The Commerce audit compared Today Tasks with Custom Requests.

Today Tasks:

- `GET /api/admin/today-tasks` was already SELECT-only;
- read failures were silently caught and converted to zero counts;
- `/admin/today-tasks` was already classified as Operations but had no real page;
- mutations were already separate at `POST /api/admin/today-task-actions`.

Custom Requests:

- is embedded in the already-large `/admin/operations/` workspace;
- `functions/api/admin/custom-requests.js` still owns a large `ensureSchema()` path containing CREATE/ALTER/INDEX work;
- therefore requires a broader read-model extraction before it should become a new top-level read boundary.

Custom Requests is intentionally excluded from Builds 366–368.

## Builds 366–368 — Today Tasks

### Build 366

Adds a readiness-aware non-mutating read service and GET-only contract:

```text
/api/admin/contracts/operations-today-tasks-read
```

The read now exposes:

```text
schema_ready
missing_tables
query_errors
request_time_schema_mutation=false
mutation_ownership_moved=false
```

Available task counts still render even if one source read fails. Missing-table/query errors are no longer silently represented as zero.

Known parity findings such as `hst_gst_review_records` may therefore appear during browser proof. That is valid parity evidence, not permission to add GET-time DDL.

### Build 367

Registers passive runtime-local service:

```text
operations-today-tasks-read
```

Operations service gates are now:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
/admin/today-tasks/         operations-today-tasks-read
```

The shared Commerce runtime remains transport-free and reports `todayTasksMutationOwnership=false`.

### Build 368

Adds real page:

```text
/admin/today-tasks/
```

The page loads Core before `admin-today-tasks.js`. Automatic load uses the Build 366 GET contract. Done/Ignore/Snooze remains on retained compatibility POST `/api/admin/today-task-actions` and only runs after explicit administrator action.

Historical Membership/Build 365 regressions were made future-compatible with later Commerce runtime/cache versions before staging this batch.

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

Historical regression scripts verify durable executable boundaries. They must not freeze later shared runtime/cache/read implementations, require later domains/pages to remain inactive, confuse retained mutation authorities with passive activation services, or match explanatory comments instead of executable behavior.

## Next direction

1. Pull current `dev` with automatic Git GC disabled if needed.
2. Run the future-compatible Membership regression, Build 365 regression, and new Builds 366–368 Today Tasks regression.
3. Browser-validate `/admin/today-tasks/` using GET/runtime checks only; do not click Done/Ignore/Snooze during the proof.
4. Accept either `schema_ready=true` or explicit `schema_ready=false` with `missing_tables/query_errors`; the latter is parity evidence.
5. If local + browser gates pass, close Builds 366–368.
6. Then return to Custom Requests for a bounded read-model/schema-authority audit; do not activate its current schema-coupled GET unchanged.
7. Avoid Gift Cards unless schema parity is deliberately the batch target.
8. Continue fresh-install schema parity before Production business-data copy.

## Validation preference

Batch related builds and provide one Git Bash block plus Firefox-safe browser blocks whenever practical.
