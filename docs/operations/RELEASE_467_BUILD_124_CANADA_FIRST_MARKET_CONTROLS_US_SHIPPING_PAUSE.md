# Release 467 Build 124 — Canada-First Market Controls & U.S. Shipping Pause

Build 124 starts from the fully proven Build 123 Development and Production checkpoint at SHA `d0485a9892331e8da2cec42ed54850893b4a7ab1` / tree `e5c15b8c2d1c1a9f091a688b9f525e8b7ce73e20`.

Build 123 Development proofs: System Gate `34719387920`, Current Application Quality `34719387904`, I.T. Admin Runtime `34719387901`, Repository Branch Hygiene `34719387931`. Production proofs: Pages Deploy `34719482161`, Live Resource Integrity `34719519418`.

## Customer-facing message

The front page now presents a Canada First banner with this meaning:

> **Canada First — U.S. shipping temporarily paused.** Due to current 50% tariffs affecting our products, we cannot viably absorb the cost or pass it on to our customers. For now, we are focusing on Canada first while we review other markets. We hope these tariffs will not last long and that we can get back to shipping to our great American customers soon.

The banner is informational. It does not itself grant or remove checkout authority.

## Commerce authority

- Storefront currency remains **CAD**.
- Billing country remains **Canada only**.
- Physical shipping remains **Canada only**.
- Local pickup remains supported.
- U.S. sales are explicitly blocked through `blocked_sales_country_codes: ['US']`.
- U.S. shipping is explicitly blocked through `blocked_shipping_country_codes: ['US']`.
- The U.S. block reason is `TEMPORARY_TARIFF_RESTRICTION`.
- `United States`, `US`, `USA`, and `U.S.` normalize to `US`.
- Other countries are **not** silently enabled. They remain unsupported until a future reviewed build adds them to the allowed-country authority.
- Future market expansion is `REVIEW_BEFORE_ENABLE`.

## Enforcement

`public/js/commerce-policy-core.js` remains the shared browser/server policy authority. The API middleware imports that same core before payment-provider execution. Build 124 therefore preserves the Build 77 fail-closed Canada-only checkout and adds explicit U.S. blocked-country semantics rather than weakening the existing allow-list.

The public runtime presents the Canada First banner on `/` and the Canada-only commerce policy on Shop, Cart and Checkout. Checkout country fields remain locked to Canada.

## Safety boundary

Build 124 adds no D1 schema migration, request-time DDL, D1 business-data mutation, R2 mutation, binding mutation, Accounting posting, period close, Inventory/Creative/price mutation, payment-provider execution, provider publication, or Production business-data overwrite.

Canonical D1 migrations remain exactly `0001`–`0004`.

Build 124 remains a closure candidate until the external exact-head four-proof Development chain and subsequent Production Pages + Live Resource Integrity proofs succeed. Build 125 must ingest Build 124's later external closure; Build 124 must not self-record those later proofs.
