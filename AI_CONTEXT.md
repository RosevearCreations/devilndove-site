# Devil n Dove AI Context — Gift Cards Browser-Proven / Build 384 D1 Parity Passed / 383–392 Local Closure Pending

Read `AI_HANDOFF.md` for retained business/data safety history. Modular authorities:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`
- `docs/architecture/NEXT_20_BUILDS.md`
- validation files through `BUILD383_392_VALIDATION.md`

## Production / source control

```text
main = retained Production/legacy release line — frozen unless deliberately promoted
dev  = active modularization and Development integration line
```

Exactly one Core + three top-level modules:

```text
Core
├─ Commerce & Operations
├─ Creative & Production
└─ Business & Administration
```

Domains remain ownership/service boundaries beneath those modules. Top-level activation never implies mutation ownership.

## Cadence

Work in **10-build execution batches**. Maintain two full future batches (next 20 builds) in `docs/architecture/NEXT_20_BUILDS.md`. Validation failures may insert bounded correction builds and shift later numbering.

## Read/schema invariant

GET/read paths report or verify schema readiness. Migrations/readiness tooling creates or repairs schema. Never add request-time DDL/default seeding to an owned read to mask parity problems.

## Current validation state

```text
through 365       fully validated through recorded checkpoints
366–368           browser-proven after 369 / local regression pending
369               browser-proven / local regression pending
370–372           browser-proven / local regression pending
373–382           browser-proven 2026-08-25 / local regression pending
383–392           Gift Card browser + Build 384 Development D1 passed; only refreshed 383–392 local regression remains
```

All Creative & Production top-level read/loader boundaries are fully validated and closed:

```text
packaging  /admin/packaging-studio/
creative   /admin/creative-process/
content    /admin/content-studio/
caip       /admin/creative-assets/
```

Do not expand that loader merely to create activity.

## Commerce & Operations current runtime

```text
runtime Build      386
activation Build   386
```

Explicit Operations pages now include:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
/admin/membership/
/admin/today-tasks/
/admin/custom-request/
/admin/gift-cards/
```

Page-specific owned reads:

```text
Membership       operations-membership-read        Build 362
Today Tasks      operations-today-tasks-read       Build 366 / implementation 369
Custom Requests  operations-custom-requests-read   Build 370
Gift Cards       operations-gift-cards-read         Build 385
```

Commerce runtime creates no network transport and owns no Membership, Today Tasks, Custom Requests, or Gift Card mutations.

## Today Tasks — 366–369

Browser proof passed after Build 369:

```text
contract 366 / implementation 369
schema_ready true
missing_tables []
query_errors []
runtime 367 / activation 368
today_tasks_page_proven true
mutation ownership false
```

Build 369 aligned stale reads to `site_item_inventory`, `accounting_hst_gst_reviews`, and current runtime incident columns. Historical Build 339 `hst_gst_review_records` parity remains separate.

Build 392 stages owned mutation authority `operations-today-task-action-write`, delegating the existing completed/ignored/snoozed implementation. Consumer migration and action-time schema removal wait for Build 393.

## Custom Requests — 370–382

Builds 370–372 browser proof passed with all 23 startup tables ready, one required read service, runtime 371/activation 372, and no mutation ownership.

Builds 373–382 browser proof passed exactly:

```text
startup contract 370      schema_ready true / 23 tables
export readiness 374      schema_ready true
safe export 373           HTTP 200 / no schema mutation
safe export links         5
unsafe legacy links       0
page tools                380
runtime                   371 / activation 372
custom_requests_page_proven true
mutation ownership        false
```

The mature legacy `?format=marketplace_csv` branch still exists on `/api/admin/custom-requests`, but the dedicated page uses the safe Build 373 export and guards against legacy links.

## Builds 383–387 — Gift Cards

### 383 audit

Automatic Gift Card UI startup previously called three GETs that created schema:

```text
/api/admin/gift-card-delivery-templates
/api/admin/gift-card-abuse
/api/admin/gift-card-delivery-send
```

The audit also found incompatible historical `notification_outbox` shapes between Gift Card writers and the current shared notification schema.

### 384 migration authority — Development D1 PASSED

`database_gift_card_runtime_parity.sql` owns:

```text
gift_cards
gift_card_redemptions
gift_card_admin_events
gift_card_delivery_templates
gift_card_delivery_queue
gift_card_provider_send_logs
gift_card_lookup_attempts
gift_card_lookup_lockouts
```

and seeds activation/reissue templates. It deliberately does not redefine shared `notification_outbox`.

Development D1 release exposed and repaired legacy drift in `gift_card_lookup_attempts`. Final verification proved all eight Gift Card-owned tables, both default templates, and current lookup-attempt columns are present. The repo-owned direct-query helper reached `BUILD 384 DIRECT DEVELOPMENT D1 PARITY FALLBACK: COMPLETE`.

### 385/386 read + activation — BROWSER PASSED 2026-08-25

Read-only `/admin/gift-cards/` proof returned:

```text
contract 385
schema_ready true
missing_tables []
query_errors []
request_time_schema_mutation false
request_time_default_seeding false
service registration 386 / contract payload 385
runtime 386 / activation 386
required services [operations-gift-cards-read]
gift_cards_page_proven true
creates_network_transport false
gift_cards_mutation_ownership false
contracts_ok true
services_ok true
```

The Gift Card read/runtime boundary is browser-closed. All Gift Card writes remain compatibility-owned.

### 387 mutation audit

- card actions still self-ensure Gift Card tables until mutation consumer migration;
- delivery/template/send/abuse writes remain compatibility-owned;
- old abuse release UI/API semantics were mismatched, so Build 386 does not expose that unsafe action;
- `GET /api/admin/gift-card-delivery-history` is non-mutating/readiness-aware;
- shared notification schema must be reconciled before Gift Card delivery-send mutation extraction.

## Builds 388–391 — Orders staged

Build 388 confirms `GET /api/admin/orders` is SELECT-only and uses the current cents model (`total_cents`, etc.).

Build 389 adds `operations-order-status-write`, delegating the mature status implementation without changing provider behavior.

Build 390 audits refunds/disputes. Current refund action can call Stripe/PayPal and crosses payments, orders, refund/dispute tables, history, notifications, and audit. No provider consumer migration is allowed until schema/integration gates are proven.

Build 391 adds narrow `operations-order-fulfillment-write`, which can request only `fulfilled` and delegates the mature status implementation. Consumer migration remains false.

## Development schema-parity track — separate

Known historical findings include:

```text
Build 324  orders.total_amount|total (historical consumer; current admin list uses total_cents)
Build 338  accounting_fixed_assets.location_note
Build 339  hst_gst_review_records
Build 339  accountant_export_manifests
Build 341  user_profiles.profile_id
Build 341  access_tiers.tier_id
Build 341  payment_disputes.payment_dispute_id
```

Earlier audit also identified active Production-only/missing fresh-install tables such as `accounting_order_records`, Command Center tables, and the `notification_dispatch_log(s)` aggregate execution discrepancy. Gift Card-owned table parity is now proven in Development through Build 384; broader fresh-install verification remains required.

Schema parity must be resolved before Production business-data copy.

## Rolling next 20

Authoritative queue: `docs/architecture/NEXT_20_BUILDS.md`.

```text
393–402  Today Tasks schema ownership, Membership writes, Customer Documents, accounting/aggregate/Production parity, fresh-install data-copy gate
403–412  shared notification reconciliation, Gift Card mutation contracts, Orders consumer migration, payment integration gate, Commerce sanity, docs consolidation, Development RC gate
```

## Historical regression rule

Historical regressions verify durable boundaries. They must not freeze later shared runtime/cache versions, require later pages to remain inactive, confuse mutation authorities with passive activation services, or fail because explanatory comments mention retired mechanisms.

## Next validation

Only the strengthened `scripts/build383_392_commerce_operations_batch_test.py` local rerun remains before Builds 383–392 are fully validated. The Gift Card Development D1 and browser gates are already passed. Do not execute Gift Card, Orders, provider/refund, fulfillment, or Today Tasks writes merely to prove source authorities.
