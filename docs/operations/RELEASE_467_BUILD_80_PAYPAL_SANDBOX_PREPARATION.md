# Release 467 Build 80 — PayPal Sandbox Preparation

Build 80 preparation starts from the exact fully-green Build 79 checkpoint:

- Source SHA: `f601264b805bb881db888343892be61fae7e93c6`
- Source tree: `e9ad3895d0f981fb37538d03cd9b7d8e744d02dd`
- `main` and `dev`: identical at the Build 79 checkpoint
- Build 79 exact-SHA checks: nine of nine successful
- Canonical D1 migrations: exactly `0001`–`0004`

## Authorized scope

This is preparation only. PayPal remains `HOLD_EXTERNAL`, and this build must not contact PayPal, add or change credentials, enable provider execution, create or capture an order, submit a refund, mutate Production data, or claim any real acceptance dimension.

## Preparation added

- PayPal create-order requests now send a deterministic `PayPal-Request-Id` owned by the existing local payment/order identities.
- Sandbox refund submission namespaces its existing deterministic request identity as a PayPal request ID.
- Request IDs are sanitized and bounded to PayPal's 108-character header limit.
- Pure runtime proof verifies retry stability, separation and bounds without a network call or credential.
- The existing Development-host, explicit operator-switch and sandbox-only controls remain unchanged.
- The existing PayPal webhook signature postback verification and atomic replay authority remain unchanged.

## Six real acceptance dimensions remain pending

1. `credentials`
2. `approval-capture`
3. `webhook-verification`
4. `refund`
5. `reconciliation`
6. `idempotent-replay`

Offline mock/source proof is preparation evidence only and cannot satisfy these dimensions.

## Safety boundary

- PayPal provider calls: **NONE**
- credentials read or changed: **NONE**
- execution switches changed: **NONE**
- external acceptance claimed: **0/6**
- new canonical D1 migration: **NONE**
- request-time DDL: **NONE**
- D1/R2 business-data mutation: **NONE**
- Production promotion may occur only as a source-only reliability deployment with PayPal still closed; it must not be represented as PayPal acceptance.

## Later controlled acceptance

Only a new explicit authorization may open the real Development sandbox lane. That run must use the six-part checklist in `LIVE_TESTING_GUIDE.md`, retain Canada/CAD checkout authority, complete buyer approval and server-side capture, verify the signed webhook before processing, prove duplicate delivery has no duplicate effect, reconcile order/payment/refund records, and complete one provider-synchronized sandbox refund.

## Next planned build

**Release 467 Build 81** remains unscoped. It must not begin until Build 80 is confirmed and the next scope is explicitly selected.
