# Devil n Dove Modular Split — Open Items and Source-Control Rules

Updated through staged Builds 383–392 on 2026-08-25.

## Invariant

Exactly one shared Core and three top-level application modules:

```text
Core
├─ Commerce & Operations
├─ Creative & Production
└─ Business & Administration
```

Domains remain ownership/service boundaries below those modules. Core owns shared infrastructure only. Top-level activation never implies mutation ownership.

```text
main = frozen Production/legacy line
dev  = active Development/modularization line
```

## Cadence

Use coherent **10-build execution batches** and keep the next **20 builds** in `docs/architecture/NEXT_20_BUILDS.md`. Validation failures may insert correction builds and shift later numbers.

## Validation state

```text
through 365       fully validated through recorded checkpoints
366–368           browser-proven after 369 / local pending
369               browser-proven / local pending
370–372           browser-proven / local pending
373–382           browser-proven / local pending
383–392           staged / local + Gift Card browser proof required
```

## Commerce & Operations

Current shared Commerce runtime / activation: **386 / 386**.

Explicit Operations pages:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
/admin/membership/
/admin/today-tasks/
/admin/custom-request/
/admin/gift-cards/
```

Page-specific reads:

```text
Membership       operations-membership-read        362
Today Tasks      operations-today-tasks-read       366 / implementation 369
Custom Requests  operations-custom-requests-read   370
Gift Cards       operations-gift-cards-read         385 staged
```

The runtime creates no network transport and owns none of the page mutations above.

### Membership

Fully validated through Build 365. Do not disturb its Build 362 read boundary when extracting assignment/policy mutations in 394–395.

### Today Tasks

Build 369 browser proof returned `schema_ready=true`, no missing tables/query errors, runtime 367/activation 368, one read service, and no mutation ownership. Local closure remains pending.

Build 392 adds source authority `operations-today-task-action-write` over the existing completed/ignored/snoozed POST. Build 393 must move `today_task_actions` table/column creation to migration authority before consumer migration.

### Custom Requests

Builds 370–372 browser proof passed with all 23 startup tables ready and no mutation ownership. Builds 373–382 browser proof also passed:

```text
safe export Build 373       200 / no schema mutation
export readiness Build 374  schema_ready=true
safe links                   5
unsafe legacy links          0
page tools                   380
runtime                      371 / activation 372
```

Local regressions remain pending. The dedicated page now guards against the legacy self-ensuring marketplace CSV GET.

### Gift Cards — 383–387 staged

Build 383 found three automatic startup GETs that created schema and multiple request-time Gift Card table creators.

Build 384 adds `database_gift_card_runtime_parity.sql` for Gift Card-owned tables:

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

Default activation/reissue templates are migration-owned. Shared `notification_outbox` is deliberately excluded because current Gift Card writers assume incompatible historical shapes.

Build 385 adds non-mutating/readiness-aware `operations-gift-cards-read`. Build 386 changes `/admin/gift-cards/` automatic startup to that one contract and activates the page under Commerce with exactly one read service. All Gift Card writes remain compatibility-owned.

Build 387 removes request-time table creation from Gift Card delivery-history GET and records mutation blockers:

- card POST still self-ensures schema until migration proof;
- provider/outbox writes need shared notification reconciliation;
- old abuse release UI/API semantics disagree (key/action vs stable lockout ID), so the unsafe control is not exposed by the Build 386 UI.

### Orders — 388–391 staged

Build 388 confirms `GET /api/admin/orders` is non-mutating and uses the current cents model (`total_cents`, etc.). Historical Build 324 `total_amount|total` must remain scoped to its old consumer rather than being imposed on this read.

Build 389 adds `operations-order-status-write`, delegating the mature status implementation. That implementation still has a paid-order Gift Card history table fallback; do not remove it until Build 384 migration application is proven.

Build 390 holds provider-aware refund/dispute consumer migration because the path can call Stripe/PayPal and crosses payments, orders, refunds/disputes, status history, notifications, and audit.

Build 391 adds `operations-order-fulfillment-write`, restricted to `fulfilled`; consumer migration remains false.

## Business & Administration

`/admin/accounting/` remains the validated Business & Administration runtime page. Accounting writes remain compatibility-owned. Accounting/fresh-install parity work is queued for 399–402.

## Creative & Production

All four top-level read/loader boundaries remain fully validated and closed:

```text
packaging  /admin/packaging-studio/
creative   /admin/creative-process/
content    /admin/content-studio/
caip       /admin/creative-assets/
```

Do not expand this loader merely to create activity.

## Read/schema rule

> GET/read paths report or verify readiness; migrations/readiness tooling creates/repairs schema.

Never use page activation as permission for GET-time DDL/seeding or implicit mutation transfer.

## Schema-parity track — separate

Historical known items include:

```text
Build 324  orders.total_amount|total (historical consumer; current Orders list uses total_cents)
Build 338  accounting_fixed_assets.location_note
Build 339  hst_gst_review_records
Build 339  accountant_export_manifests
Build 341  user_profiles.profile_id
Build 341  access_tiers.tier_id
Build 341  payment_disputes.payment_dispute_id
```

Prior audit also found `accounting_order_records`, Gift Card schema, Command Center tables, and `notification_dispatch_log(s)` aggregate execution drift. Build 384 begins resolving Gift Card parity, but fresh-install execution proof remains required.

Do not copy Production business data until fresh-install schema parity is proven.

## Rolling next 20

See `docs/architecture/NEXT_20_BUILDS.md`:

```text
393–402  Today Tasks schema ownership, Membership writes, Customer Documents, accounting/aggregate/Production parity, fresh-install gate
403–412  shared notification reconciliation, Gift Card mutation contracts, Orders consumer migration, payment integration, Commerce sanity, documentation/RC gates
```

## Historical regression rule

Historical tests verify durable boundaries. They must not freeze later shared runtime/cache versions, require later pages to stay inactive, confuse write authorities with passive activation services, or match explanatory comments instead of executable behavior.

## Immediate validation

Run accumulated Commerce local regressions through `build383_392_commerce_operations_batch_test.py`, then browser-validate only the Build 385/386 Gift Card read/runtime state. Do not execute Gift Card, Orders, provider/refund, fulfillment, or Today Tasks writes merely to prove the new source contracts.
