# Release 467 Build 25 — Finance ↔ Product/Inventory Unit-Economics Readiness

Status: **DEVELOPMENT_CANDIDATE**

## Purpose

Build 24 answers whether a Product has Storefront publication readiness plus positive fulfillment evidence. Build 25 adds the missing operator bridge to existing Finance cost evidence without inventing another costing formula.

The new read-only endpoint and workspace reconcile:

- Build 24 current Product/Inventory sellability evidence;
- the Accounting-owned `accounting-item-costing-read` monthly contract;
- direct Product cost, linked-resource cost, allocated overhead, selected-period sales evidence, and estimated full unit cost;
- current Product price and the resulting estimated price headroom.

## Accounting semantics

`estimated_price_headroom_cents` is current Product price minus the Accounting-owned selected-period estimated full unit cost. It is **not accounting profit** and Build 25 does not define a target margin.

A Product with no positive cost evidence is `costing_unverified`; zero visible cost is not automatically treated as a genuine zero-cost Product. Missing linked-resource costs are `costing_incomplete`. A non-positive estimate is surfaced for review, not automatically repriced or unpublished.

`review_supported` means only that current sellability is supported, Finance costing evidence is present, and estimated price headroom is positive. It is not authorization to price, publish, sell, build, reserve, ship, or post accounting.

## Safety boundary

Build 25 performs no POST, DDL, DML, request-time schema mutation, Product mutation, price mutation, Inventory mutation, accounting posting, public-offer rule change, D1/R2 business-data mutation, provider execution/publication, Cloudflare Access mutation, `main` mutation, or Production mutation.

Canonical migrations remain exactly `0001` through `0004`. Production remains Release 467 Build 20. External acceptance lanes remain HOLD_EXTERNAL.

## Development provenance

Build 25 starts from final Build 24 closure:

- SHA `a08502e615aa5fdeb29deddec031223215ae1fa3`
- tree `4e6bc235382a9125f64ed15ecebf488fbfe0fbdd`
- System Gate `33703653554` SUCCESS
- Build 24 Proof `33703653563` SUCCESS
- Branch Hygiene `33703653564` SUCCESS

Build 25 must not be called GREEN until its exact merged Development SHA passes the current System Gate, Build 25 proof, exact Preview deployment/smoke, and branch hygiene.
