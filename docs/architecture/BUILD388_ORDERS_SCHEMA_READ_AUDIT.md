# Build 388 — Orders Schema / Read Audit

Date: 2026-08-25

## Startup read

`/admin/orders/` automatically reads `GET /api/admin/orders` through `public/js/admin-orders.js`.

The current endpoint is GET-only and performs no request-time DDL/DML. Its primary query reads `orders` plus aggregated `payments`; on failure it falls back to a basic `orders` SELECT and finally a safe empty list with runtime diagnostics.

The current executable model uses monetary columns such as:

```text
subtotal_cents
discount_cents
shipping_cents
tax_cents
total_cents
```

Therefore the historical Build 324 `orders.total_amount|total` finding is not a blocker for the current Orders admin list. Keep that old parity record scoped to the historical consumer that reported it rather than changing the current read back to obsolete names.

## Mutation surface

The Orders detail UI currently writes through separate compatibility authorities including:

```text
POST /api/admin/update-order-status
POST /api/admin/record-payment
payment refund/dispute actions
```

`update-order-status` is mostly clean but still performs `CREATE TABLE IF NOT EXISTS gift_card_admin_events` when a paid order activates connected Gift Cards. Build 384 now defines that table through Gift Card migration authority; remove the mutation-time fallback only after migration application is proven.

## Build 389–391 boundary

- Build 389 formalizes an Operations-owned reviewed order-status contract around the existing implementation.
- Build 390 audits payment/refund/dispute authority; provider behavior remains unchanged.
- Build 391 formalizes a narrow fulfillment transition contract without turning the top-level runtime into a mutation owner.

No write is required to validate the new authority metadata.
