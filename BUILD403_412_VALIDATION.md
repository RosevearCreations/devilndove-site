# Builds 403–412 Validation — Commerce Mutation Boundaries + Development RC

## Status — LOCAL RC PASS / DEVELOPMENT D1 AUTH RECOVERED / PARITY APPLICATION + READ-ONLY BROWSER PROOF REQUIRED

```text
403  Canonical shared notification schema/readiness authority
404  Gift Card card-state mutation schema cleanup + owned contract
405  Gift Card template/resend schema cleanup + owned contract
406  Gift Card provider/outbox canonicalization + owned contract
407  Gift Card abuse stable-ID authority + real UI consumer migration
408  Orders status/fulfillment schema cleanup + real consumer bridge
409  Payment/refund provider mutation fail-closed gate
410  Commerce modularity sanity + Development parity overlay applicator
411  Modular documentation consolidation
412  Development release-candidate local gate
```

## What materially changed

### Notification authority

`database_notification_runtime_parity.sql` is the canonical shared notification authority for:

```text
notification_outbox
notification_dispatch_log
notification_exclusions
notification_cooldown_rules
customer_engagement_runs
notification_automation_settings
gift_card_delivery_audit
```

The older plural `notification_dispatch_logs` job-attempt ledger remains distinct and is not collapsed into the singular outbox-delivery ledger.

### Gift Cards

Explicit Gift Card writes now use owned Operations contracts:

```text
operations-gift-card-action-write
operations-gift-card-template-write
operations-gift-card-provider-send-write
operations-gift-card-abuse-write
```

The corresponding implementations perform no request-time CREATE/ALTER/default seeding. Provider queueing writes the canonical Build 403 notification-outbox shape. The admin UI is migrated to those contracts and stable `gift_card_lookup_lockout_id` unlock semantics.

### Orders / payments

The mature Orders UI is retained. `admin-order-contract-bridge.js` routes its explicit writes through:

```text
operations-order-status-write
operations-order-fulfillment-write
operations-payment-action-write
```

Order status no longer creates Gift Card history tables when an order becomes paid. Provider-aware refund code is preserved, but Build 409 makes provider mutation local-only by default. External provider mutation requires both:

```text
PAYMENT_PROVIDER_MUTATIONS_ENABLED=1
provider_sync_confirmed=true
```

No provider write is required for validation.

## Local validation — PASS

The 2026-08-25 Development RC run completed:

```text
BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS
BUILD 401 ACTIVE RUNTIME TABLE PARITY AUDIT: PASS
BUILD 402 FRESH INSTALL PARITY SMOKE: PASS
BUILDS 393-402 MODULARITY + PARITY BATCH: PASS
BUILDS 403-410 COMMERCE MODULARITY: PASS
BUILD 412 DEVELOPMENT RC LOCAL GATE: PASS
No Cloudflare resource was contacted.
PRODUCTION PROMOTION: CLOSED — Development D1/browser/live parity gates are still required.
```

Build 402 also proved the current clean-install composition with 512 tables, 25 overlay-owned tables, current parity seeds, and a passing `PRAGMA foreign_key_check`.

## Development D1 authentication — RECOVERED

The first post-RC Build 410 Development D1 attempt stopped during its read-only preflight before any migration statement executed:

```text
The given account is not valid or is not authorized to access this service [code: 7403]
```

That stop was authentication/account authorization only; no schema SQL executed.

The follow-up auth-only diagnostic on 2026-08-25 proved:

```text
Cloudflare auth/account environment overrides: none
Wrangler authentication: OAuth
Authenticated account: Devilndovelive@gmail.com's Account
OAuth D1 permission: d1 (write)
Development D1 read-only auth probe: PASS
SELECT 1 AS auth_probe -> 1
```

The committed `wrangler.toml` remains pinned to the Development project/database, and the direct read-only probe against `devilndove-dev` succeeded. Authentication is therefore no longer blocking Build 410. Do not rerun the already-green local RC suite merely because of the earlier 7403.

## Development D1 parity application — NEXT GATE

Rerun:

```bash
python scripts/build410_apply_development_parity_overlays.py
```

The helper is hard-pinned to:

```text
branch        dev
Pages project devilndove-site-dev
D1 database   devilndove-dev
```

It uses Windows-safe one-statement `wrangler d1 execute --command` calls. It aligns legacy `notification_outbox` columns immediately after materializing/no-oping that table and before dependent notification indexes.

Expected final line:

```text
BUILD 410 DEVELOPMENT PARITY OVERLAY APPLICATOR: COMPLETE
```

If a migration now stops, preserve the exact statement output. At this point the failure is likely real Development schema drift rather than authentication or local harness behavior. Repair the exact parity gap; do not move DDL back into request handlers.

## Read-only browser gates

### Customer Documents

Open `/admin/customer-documents/` and prove Build 397 read/runtime activation with one required service and no runtime mutation ownership.

### Gift Cards post-mutation-extraction sanity

Open `/admin/gift-cards/`. Do not click mutation controls. Confirm:

```text
startup read Build        385
mutation authority build  407
schema ready              true
owned mutation routes     Builds 404-407 contracts
runtime active            true
runtime mutation owner    false
UI mutation build         407
```

### Orders bridge / provider gate

Open `/admin/orders/`. Do not submit a status/refund/provider action. Confirm the page loaded `DDOrderContractBridge` Build 408 with status, fulfillment, and payment contract routes. Provider mutation remains disabled unless explicitly enabled and confirmed.

## Production

`main` remains frozen. Build 412 is a Development RC gate, not a Production promotion. Production business-data copy and Production promotion remain closed until live read-only schema/data mapping and the Development browser/D1 gates are complete.
