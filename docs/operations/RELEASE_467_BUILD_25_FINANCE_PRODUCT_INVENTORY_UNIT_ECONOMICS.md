# Release 467 Build 25 — Finance ↔ Product/Inventory Unit-Economics Readiness

Status: **DEVELOPMENT_GREEN**

## Purpose

Build 25 closes the operator gap between Build 24 current Storefront/Inventory sellability evidence and the existing Accounting-owned monthly item-costing authority. It does not create a second costing formula.

The read-only endpoint `/api/admin/finance-product-inventory-unit-economics` and workspace `/admin/finance-product-inventory-unit-economics/` reconcile Product price and sellability with direct Product cost, linked-resource cost, allocated overhead, selected-period sales evidence, and Accounting estimated full unit cost.

## Accounting semantics

`estimated_price_headroom_cents` is Product price minus the Accounting-owned selected-period estimated full unit cost. It is **not accounting profit**. Build 25 defines no target margin.

Zero visible cost remains `costing_unverified`, not an automatic zero-cost conclusion. Missing linked-resource costs are `costing_incomplete`. Non-positive estimated headroom is a review queue only. `review_supported` is evidence only and does not authorize price changes, publication, fulfillment, shipment, or accounting posting.

## Accepted Development runtime

- merged Dev SHA `a57f632898bebfd4bf3f6be39c99857a8a9da701`
- tree `33ff551739099ced69c12e826b5b4fbe477623ab`
- System Gate `33758969424`: SUCCESS
- Build 25 Proof `33758969830`: SUCCESS
- Branch Hygiene `33758969440`: SUCCESS
- canonical Development D1 convergence: SUCCESS
- Development data authority read-only proof: SUCCESS
- exact Development SHA Preview deployment: SUCCESS
- Preview control-plane binding proof: SUCCESS
- non-secret exact Preview smoke acceptance: SUCCESS
- regression evidence: SUCCESS

## Safety boundary

Build 25 performs no POST, DDL, DML, request-time schema mutation, price/Product/Inventory mutation, accounting posting, public-offer rule change, D1/R2 business-data mutation, provider execution/publication, Cloudflare Access mutation, `main` mutation, or Production mutation. Canonical migrations remain exactly `0001`–`0004`.

Production remains Release 467 Build 20 at `055cbc973c667b35a209c7ea207779089f6fed3a`, tree `550272841e764d77fc21297abede3d4cae1aaea0`, Production Pages Deploy `33688892602`. External lanes remain HOLD_EXTERNAL.
