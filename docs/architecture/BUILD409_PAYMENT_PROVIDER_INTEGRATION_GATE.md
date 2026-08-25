# Build 409 — Payment / Refund Provider Integration Gate

## Decision

The mature `/api/admin/payment-actions` implementation can call Stripe and PayPal during a refund. The Orders UI previously reached that implementation directly, and the compatibility implementation historically treated a missing `sync_provider` field as provider sync enabled.

Build 409 moves the Orders consumer behind:

```text
/api/admin/contracts/operations-payment-action-write
```

and reverses that default at the Operations boundary.

## Fail-closed provider rule

Refund/dispute mutations remain available locally, but external provider mutation requires **both**:

```text
PAYMENT_PROVIDER_MUTATIONS_ENABLED=1
provider_sync_confirmed=true
```

If a caller asks for provider sync without both gates, the contract returns `409 provider_mutation_gate_closed` before invoking the mature implementation.

If neither provider gate is requested, the contract forces:

```text
sync_provider=0
```

so the existing Orders admin UI is local-only by default in Development.

## What Build 409 does not do

- does not change Stripe API implementation;
- does not change PayPal API implementation;
- does not invent provider credentials;
- does not execute a provider refund as validation;
- does not move payment schema ownership implicitly;
- does not make the top-level Commerce runtime own payment mutations.

## Consumer routing

`public/js/admin-order-contract-bridge.js` routes explicit POST calls from the mature Orders detail UI:

```text
/api/admin/update-order-status
    -> operations-order-status-write
    -> operations-order-fulfillment-write when status=fulfilled

/api/admin/payment-actions
    -> operations-payment-action-write
```

The bridge creates no network transport of its own; it only selects the reviewed contract route before delegating to the existing authenticated `DDAuth.apiFetch` transport.

## Next provider gate

Before enabling provider mutations in Development, verify:

1. `payment_refunds` / `payment_disputes` current columns;
2. notification Build 403 parity is applied;
3. Stripe/PayPal credentials are test/sandbox credentials only;
4. provider-specific idempotency/retry behavior is reviewed;
5. one explicit provider integration test is deliberately authorized.

Until then, keep `PAYMENT_PROVIDER_MUTATIONS_ENABLED` unset/disabled.
