# Release 467 Build 79 — Stripe Development Preparation

Build 79 preparation starts from the exact fully-green Build 78 checkpoint:

- Source SHA: `4057ca18c0e0d2f4a9966d4da28a61ecb4ea3e04`
- Source tree: `ad47f7e88bb5dd5678f62aa8cc157690a4836dee`
- `main` and `dev`: identical at the Build 78 checkpoint
- Build 78 exact-SHA checks: nine of nine successful
- Canonical D1 migrations: exactly `0001`–`0004`

## Authorized scope

This is preparation only. Stripe remains `HOLD_EXTERNAL`, and this build must not contact Stripe, add or change credentials, enable provider execution, create a Checkout Session, submit a refund, mutate Production data, or claim any real acceptance dimension.

## Preparation added

- Stripe requests pin API version `2026-07-29.dahlia`.
- Checkout Session creation uses a deterministic idempotency key owned by the existing local payment/order identities.
- Test refund submission namespaces its existing deterministic request identity as a Stripe refund idempotency key.
- Checkout Sessions receive a stable integration identifier with an eight-letter suffix derived from the payment/order identity, so an application retry cannot change the payload associated with its idempotency key.
- Pure runtime proof verifies these contracts without a network call or credential.
- The existing Development-host, explicit operator-switch and test-key controls remain unchanged.
- The existing signed-webhook verification and atomic replay authority remain unchanged.

## Credential guidance for later acceptance

When external acceptance is deliberately opened, prefer a least-privilege Stripe restricted test key (`rk_test_`) stored only in the Cloudflare Development/Preview secret environment. Never commit, log, paste into evidence, or place it in browser code. The publishable test key may remain a Development variable. Production keys and execution remain closed.

## Six real acceptance dimensions remain pending

1. `credentials`
2. `checkout`
3. `webhook-signature`
4. `refund`
5. `reconciliation`
6. `idempotent-replay`

Offline mock/source proof is preparation evidence only and cannot satisfy these dimensions.

## Safety boundary

- Stripe provider calls: **NONE**
- credentials read or changed: **NONE**
- execution switches changed: **NONE**
- external acceptance claimed: **0/6**
- new canonical D1 migration: **NONE**
- request-time DDL: **NONE**
- D1/R2 business-data mutation: **NONE**
- Production promotion may occur only as a source-only reliability deployment with Stripe still closed; it must not be represented as Stripe acceptance.

## Later controlled acceptance

Only a new explicit authorization may open the real Development test lane. That run must use the six-part checklist in `LIVE_TESTING_GUIDE.md`, retain Canada/CAD checkout authority, verify the signed webhook before processing, prove duplicate delivery has no duplicate effect, reconcile the order/payment/refund records, and complete one provider-synchronized test refund.

## Next planned build

**Release 467 Build 80 — PayPal Sandbox Acceptance** remains a separate external lane and must also remain on HOLD unless deliberately authorized.
