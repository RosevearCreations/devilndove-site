# Release 467 Build 78 — Cart & Checkout Reliability

Build 78 starts from the exact fully-green Build 77 Production/Development checkpoint:

- Source SHA: `0cf5900464d99328398dd07dca6131cfe9772d4d`
- Source tree: `6c406d2e1df9a8d5fd600852c506ec7a43282c6d`
- Build 77 Development System Gate: `34236831772` — SUCCESS
- Build 77 Current Application Quality Proof: `34236831687` — SUCCESS
- Build 77 I.T. Admin Runtime Proof: `34236831742` — SUCCESS
- Build 77 Repository Branch Hygiene: `34236831927` — SUCCESS
- Build 77 Production Pages Deploy: `34237357905` — SUCCESS
- Build 77 Production Live Resource Integrity Proof: `34237455947` — SUCCESS
- Canonical D1 migrations remain exactly `0001`–`0004`

## Purpose

Build 78 hardens the buyer path from Cart through order creation and payment handoff without opening payment-provider acceptance. The build protects cart persistence, checkout retries, stock/price revalidation, shipping versus pickup, browser/server total authority, abandoned-checkout recovery, failure handling, and idempotent order creation.

## Cart persistence

`public/js/cart.js` now normalizes persisted rows every time the cart is read or written. Invalid Product IDs and quantities are dropped, duplicate Product rows are merged, quantity is bounded at 99, currency is normalized, and an in-memory copy remains available when browser storage is unavailable.

The cart storage key remains `dd_cart`, so current carts are forward-compatible rather than being discarded by the build.

## Checkout attempt authority

`public/js/checkout-reliability-core.js` is a pure browser helper with version `R467B78_V1`. It owns deterministic cart normalization/signatures, explicit `shipping` / `pickup` / `digital` fulfilment selection, the carried CAD $15 browser shipping estimate, and the carried 13% browser tax estimate.

The core performs no network request, D1/R2 access, provider call, storage write, order creation or publication action.

`public/js/checkout.js` persists one checkout-attempt record under `dd_checkout_attempt_v78`. The record contains a random checkout request key plus the current cart signature. Changing the cart invalidates an uncommitted attempt. Once an order has been created, its `order_id` and `order_number` are retained so a payment-preparation failure or page reload resumes the existing order rather than creating a second one.

The cart is not cleared until payment preparation succeeds and a confirmation snapshot has been saved.

## Idempotent order creation

`functions/api/checkout-create-order.js` accepts the browser's bounded `checkout_request_key` and derives a stable Build-78 order number from it. Before doing new order work it looks for that order number and returns the existing order as `idempotent_replay: true` when the same checkout attempt is repeated.

The actual insert uses a single SQLite `INSERT ... SELECT ... WHERE NOT EXISTS` statement keyed by that stable order number. D1/SQLite serializes the write statement, so normal retry/concurrency paths converge on one order without adding a new schema column or request-time DDL.

If the same request key is ever associated with another customer email, the request fails closed with `checkout_request_key_conflict`.

## Server-authoritative cart validation

The browser sends only Product IDs and quantities as cart authority. The order API re-reads current Products, status, price, bundle availability and tracked inventory before creating the order. Quantity is bounded to 1–99.

The carried Build 440 finished-inventory trigger remains the final write-time oversell guard. If availability changes between the read and item insertion, middleware still maps the trigger to a safe 409 conflict and the incomplete order is cancelled by the existing database authority.

The order response explicitly declares:

- `server_totals_authoritative: true`
- `inventory_revalidated: true`
- `pricing_revalidated: true`

## Shipping, pickup and totals

Build 77's Canada-only boundary remains authoritative.

For a cart with physical items the buyer can choose:

- `shipping`: Canadian shipping address required and server shipping is the carried CAD $15 flat estimate;
- `pickup`: no shipping address or shipping charge required.

Digital-only carts resolve to `digital` regardless of the visual selection and have no shipping charge.

Shipping cents supplied by the browser are no longer trusted by order creation; the server derives shipping from the resolved fulfilment type. Tax is also calculated by the server from its own subtotal/discount/shipping values using the existing 13% estimate. Build 78 hardens authority and retry behaviour; it does not claim final province-specific Canadian tax-accounting convergence.

## Canada policy compatibility

`public/js/commerce-policy-runtime.js` and `functions/api/_middleware.js` continue to use the Build 77 shared Canada policy. They now skip shipping-address requirements only when explicit local pickup is selected. Billing remains Canada-only and a started billing address must still pass the Canadian province/postal authority.

Payment preparation still checks stored orders and only requires shipping address data for `shipping` / `mixed` fulfilment. Pickup does not weaken the Canada-only billing or CAD boundary.

## Abandoned checkout and payment failure

The existing checkout-recovery lead is retained and remains throttled. Form values and cart state remain in browser storage during ordinary failure.

If order creation succeeds but payment preparation fails, the page shows the saved order number. Retrying uses the stored `order_id`, and `checkout-prepare-payment` already reuses an existing pending/authorized payment record for the same order/provider before creating another one.

Stripe and PayPal remote execution remain closed except for their separately controlled Development acceptance lanes in later Builds 79 and 80.

## Safety boundary

- new canonical D1 migration: **NONE**
- request-time schema DDL: **NONE**
- Production business-data rewrite: **NONE**
- R2 copy/move/delete: **NONE**
- automatic payment-provider execution added: **NONE**
- automatic purchase action: **NONE**
- social/OAuth publication: **NONE**
- polling loop: **NONE**
- canonical migrations: **`0001`–`0004` unchanged**

## Acceptance

Build 78 is complete only when the exact Development SHA proves:

1. bounded/deterministic cart normalization;
2. checkout attempt signatures change when cart quantities change;
3. shipping, pickup and digital fulfilment behave deterministically;
4. browser shipping/tax calculations are presentation estimates only;
5. checkout request keys are bounded and invalid keys fail closed;
6. repeated request keys resolve to the same order-number authority;
7. order creation uses `WHERE NOT EXISTS` rather than request-time schema mutation;
8. current Product price and stock are re-read by the server;
9. the Build 440 write-time oversell guard remains intact;
10. shipping cents are server-derived from fulfilment rather than trusted from the browser;
11. checkout keeps a created order for payment retry instead of starting a second order;
12. cart clearing occurs only after payment preparation succeeds;
13. Build 77 Canada-only commerce rules remain green with pickup compatibility;
14. canonical migrations remain exactly `0001`–`0004`;
15. Current System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene all pass on the exact Development SHA;
16. exact Development D1/Preview/bindings/smoke proof succeeds;
17. `main` is promoted only by non-force fast-forward;
18. exact Production Pages Deploy and Production Live Resource Integrity Proof both succeed.

## Next planned build

**Release 467 Build 79 — Stripe Development Acceptance**: close the controlled test-credential checkout, signed webhook, provider-synchronized test refund, reconciliation and idempotent replay dimensions without opening live Production Stripe execution.
