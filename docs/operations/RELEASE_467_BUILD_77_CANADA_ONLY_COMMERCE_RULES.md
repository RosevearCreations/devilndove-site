# Release 467 Build 77 — Canada-Only Commerce Rules

Build 77 starts from the exact fully-green Build 76 Production/Development checkpoint:

- Source SHA: `b0ec60ced99f7947168239f35929d5a52d6bb451`
- Source tree: `03a596a779379a52929fc46d80f555cb58b07bb0`
- Build 76 Development System Gate: `34231827123` — SUCCESS
- Build 76 Current Application Quality Proof: `34231826860` — SUCCESS
- Build 76 I.T. Admin Runtime Proof: `34231826814` — SUCCESS
- Build 76 Repository Branch Hygiene: `34231826820` — SUCCESS
- Build 76 Production Pages Deploy: `34232041878` — SUCCESS
- Build 76 Production Live Resource Integrity Proof: `34232161436` — SUCCESS
- Canonical D1 migrations remain exactly `0001`–`0004`

## Purpose

Build 77 centralizes the current Devil n Dove Canada-only storefront boundary so public Storefront messaging, Cart guidance, Checkout address validation and checkout APIs all derive from the same country/currency policy.

The current business rule is deliberately explicit:

- storefront currency is **CAD**;
- storefront billing country is **Canada only**;
- physical-order shipping country is **Canada only**;
- all 13 Canadian provinces and territories are recognized by one normalization authority;
- Canadian postal codes are validated before a physical order can proceed;
- U.S. storefront sales are **disabled**;
- U.S. storefront shipping is **disabled**.

Build 77 does not open or exercise Stripe, PayPal, Square, social, marketplace or publication providers. It does not alter Product, Inventory, Order or customer business data in Production as part of the build itself.

## Shared authority

`public/js/commerce-policy-core.js` is a pure ESM policy module intentionally usable by both browser code and Cloudflare Pages Functions.

It owns:

- `COMMERCE_POLICY_VERSION = R467B77_V1`;
- selling country `CA` / Canada;
- allowed shipping country `CA`;
- allowed billing country `CA`;
- storefront currency `CAD`;
- the 13-province/territory list;
- country normalization;
- province/territory normalization;
- Canadian postal-code formatting/validation;
- common buyer-facing Canada-only messaging;
- fail-closed commerce envelope validation.

The module performs **no network request, no storage write, no D1/R2 access, no provider call and no publication action**.

## API boundary

`functions/api/_middleware.js` imports the shared policy core directly and applies it before order/payment mutation or provider execution.

For `/api/checkout-create-order` it blocks, before the order handler runs:

1. non-CAD storefront currency;
2. missing/non-Canadian billing country;
3. a supplied non-Canadian shipping country;
4. a started shipping address whose province/territory or postal code is not Canadian;
5. a started billing address whose province/territory or postal code is not Canadian.

For `/api/checkout-prepare-payment` it reads only the requested order and blocks before pending-payment mutation/provider execution when the stored order violates the Canada-only country/currency boundary. Physical/mixed orders also require a valid Canadian shipping province/territory and postal code.

Every policy rejection declares that no local order/payment mutation and no provider network call was performed.

## Browser / Storefront boundary

The existing public module bootstrap loads `public/js/commerce-policy-runtime.js` on Shop, Product Detail, Cart and Checkout routes.

That runtime:

- shows the same Canada-only/CAD message on commerce surfaces;
- locks Checkout shipping and billing country to Canada;
- presents Canadian province/territory choices from the shared policy core;
- formats Canadian postal codes;
- validates physical shipping addresses before the existing Checkout submit handler runs;
- validates a started billing address against the same Canadian address authority;
- never creates an order, reserves inventory, starts payment or publishes content itself.

Cart trust copy is also explicit that billing is Canada-only, physical shipping is within Canada, and totals/payment preparation use CAD.

## Defence in depth

The older checkout-order handler still contains its carried Canada shipping guard. Build 77 does not weaken it. The new shared middleware authority executes first and adds the broader billing/currency/address contract. A source gate keeps the carried handler and Stripe `allowed_countries=CA` behavior from drifting away from the Build 77 policy.

## Address model

The shared policy recognizes all 13 provinces/territories:

`AB, BC, MB, NB, NL, NS, NT, NU, ON, PE, QC, SK, YT`.

Canadian postal codes are normalized to `A1A 1A1` form and validated using the Canadian alternating letter/digit structure. U.S.-style ZIP codes and non-Canadian state/province values do not pass this authority.

Build 77 is not an address-verification service and does not claim that a syntactically valid address physically exists. It establishes the country/province/postal boundary needed before Build 78 checkout/fulfilment reliability work.

## Safety boundary

- D1 schema mutation: **NONE**
- new canonical migration: **NONE**
- Production business-data rewrite: **NONE**
- R2 copy/move/delete: **NONE**
- automatic order creation by the policy runtime: **NONE**
- automatic inventory reservation by the policy runtime: **NONE**
- Stripe execution added: **NONE**
- PayPal execution added: **NONE**
- social/OAuth publication: **NONE**
- timer/polling loop: **NONE**
- canonical migrations: **`0001`–`0004` unchanged**

## Acceptance

Build 77 is complete only when the exact Development SHA proves:

1. the Build 77 shared policy runtime test;
2. Canada aliases normalize to CA and U.S. variants fail closed;
3. all 13 provinces/territories share one authority;
4. Canadian postal formatting/validation is deterministic;
5. non-Canadian billing fails even for a digital/no-shipping envelope;
6. non-CAD storefront currency fails closed;
7. API middleware imports and uses the same browser/server policy module;
8. commerce policy executes before payment-provider execution checks;
9. Checkout visibly locks country to Canada and uses Canadian labels;
10. Shop/Product/Cart/Checkout receive the common commerce runtime through the existing public bootstrap;
11. carried checkout and Stripe Canada guards remain compatible;
12. canonical migrations remain `0001`–`0004`;
13. Current System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene all pass on the exact Development SHA;
14. exact Development D1/Preview/bindings/smoke proof succeeds;
15. `main` is promoted only by non-force fast-forward;
16. exact Production Pages Deploy and Production Live Resource Integrity Proof both succeed.

## Next planned build

**Release 467 Build 78 — Cart & Checkout Reliability**: harden cart persistence, authoritative stock revalidation, shipping/pickup, tax, abandoned-checkout recovery, failure handling and idempotent order creation while preserving Build 77's Canada-only commerce boundary.
