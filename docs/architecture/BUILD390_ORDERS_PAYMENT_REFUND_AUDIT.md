# Build 390 — Orders Payment / Refund Boundary Audit

Date: 2026-08-25

## Read authority

`GET /api/admin/order-payments?order_id=...` is non-mutating. It reads `payments`, `payment_refunds`, and `payment_disputes`, returning safe partial fallbacks when refund/dispute tables drift.

## Mutation authorities

The current Orders detail workflow uses separate write paths for manual payment recording and refund/dispute actions. Refund handling may call live Stripe or PayPal APIs when provider credentials and provider payment IDs are present.

`payment-actions.js` then writes local refund/dispute records, updates payment/order status, writes order history, queues a receipt to the shared `notification_outbox`, and records an admin audit event.

## Boundary decision

Do not wrap refund/provider mutation behind a new top-level runtime service in this batch. The write is externally consequential and crosses:

```text
payment provider API
payments
orders
payment_refunds/payment_disputes
order_status_history
notification_outbox
admin audit
```

The current read-only Commerce loader remains uninvolved.

Before extracting this mutation:

1. prove `payment_refunds` / `payment_disputes` fresh-install columns against the current implementation;
2. reconcile the shared `notification_outbox` schema identified again by the Gift Card audit;
3. preserve explicit provider-sync intent (`sync_provider`) and local-only fallback semantics;
4. add provider-specific integration tests before changing the consumer route.

Build 390 is therefore an authority audit, not a provider behavior change.
