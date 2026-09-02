# Devil n Dove — Sanity / Health Check

## Current authority

**Release 467 Build 15 — Storefront / SEO Parity** is the active Development source candidate.

Exact green predecessor: **Release 467 Build 14 — Product Release Quality Command Center** at `dd92a10799f0f7656fe9508a25a983839117a1d0`, tree `dbe3ed8e1be82c02223a346f58a626654f8d5382`.

- [x] Build 14 System Gate `33649971571` — SUCCESS.
- [x] Build 14 Proof `33649971525` — SUCCESS.
- [x] Build 14 exact Build 13 predecessor `794fd5b36191fff4c9e8376197f968d9c6d6da80` remains retained.
- [x] Build 13 exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f` remains retained.
- [x] `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY**.
- [x] Runtime Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

## Retained historical authority sanity

- [x] **Release 467 Build 8 — Authority Convergence and Restart Safety** remains locked provenance. Its exact Build 7 predecessor is `5eef764a67466dc2989a4681c6a7cc782b9d4df9`; System Gate `33591744817` and Build 7 Proof `33591744787` remain the retained successful evidence, with external acceptance `HOLD_EXTERNAL`.
- [x] **Release 467 Build 12 — Finance Operations Command Center** remains read-only with exact Build 11 source base `ce42f3b2ea553b69085705f500a9e2bd2f689818` and `HOLD_EXTERNAL` provider state.
- [x] **Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** remains retained; 39 obsolete Release 448–461 workflows remain retired and repository hygiene remains guarded.
- [x] **Release 467 Build 14 — Product Release Quality Command Center** remains the Product quality owner; Build 15 extends rather than duplicates it.
- [x] Build 4 same-session evidence and acceptance ledger remains retained; Build 10 preserves that ledger rather than replacing it.
- [x] Build 5 — CI / Cloudflare Access readiness remains separate from Production Promotion Readiness.
- [x] `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` remain masked names only.

## Build 15 structured-data parity sanity

- [x] Shared `storefront-parity.js` derives Product, Offer and BreadcrumbList from visible Product facts.
- [x] Price, currency, SKU, inventory availability, Product images, category and canonical URL share the visible Product authority.
- [x] Canada shipping schema uses `OfferShippingDetails` / `shippingDestination` only for products that require shipping.
- [x] Schema-only marketing facts are not generated.
- [x] Retained Release 465 `seo-page-overrides.js` loads/converges on the Build 15 visible-fact model.

## Build 15 public SEO sanity

- [x] Full checked-in indexable public HTML audit is a release proof input.
- [x] Exactly one H1 is required on each audited public page.
- [x] Useful title/meta description, canonical, crawlable internal links, valid images/alt text and applicable JSON-LD are required.
- [x] Dynamic Product visible-fact Product/Offer/Breadcrumb parity has an explicit source assertion.

## Build 15 buyer-fact sanity

- [x] `/api/product-buyer-facts` is read-only and request-time-schema-read-only.
- [x] Only active Products and approved/published supporting facts are exposed.
- [x] Public-safe story-note privacy status remains required.
- [x] Materials, process, finish/condition, dimensions, care, personalization limits, availability, shipping/pickup and handmade limitations use one normalization model.
- [x] Missing approved facts become explicit Product Release Quality remediation.
- [x] Missing facts are not silently manufactured for public display.

## Build 15 Shop / Collection linking sanity

- [x] Product Detail retains existing proof-related Product results and curated collection links.
- [x] Shop/Product navigation can expose material, process, type, origin and category relationships.
- [x] Supplemental relationship/fact reads fail open to the existing Shop/Product experience; they never replace Product authority.

## Shipping / pickup / U.S. policy sanity

- [x] Existing server checkout authority rejects non-Canada shipping with `shipping_country_not_supported`.
- [x] Server reports `allowed_countries: ['CA']`.
- [x] Unsupported shipping country performs no local order mutation and no provider network call.
- [x] Shop, Product, Cart and Checkout visibly surface the same Canada-only policy.
- [x] Checkout pins buyer shipping country to Canada before submission; the server remains the authoritative enforcement boundary.
- [x] Existing U.S. sales/shipping suspension remains intact.
- [x] Marketplace preparation remains local/export-only; no provider execution/publication is added.

## Environment / schema sanity

- [x] Source authority: `dev`.
- [x] Preview: `https://dev.devilndove-site.pages.dev`.
- [x] D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Product R2: `devilndove-toolshed-images-dev`.
- [x] CAIP R2: `devilndove-caip-media-dev`.
- [x] Canonical migrations remain exactly `0001`–`0004`.
- [x] Build 15 adds no migration or request-time DDL.
- [x] Build 15 authorizes no new D1/R2 mutation.

## External acceptance sanity

- [ ] Cloudflare Access service token — `HOLD_EXTERNAL`.
- [ ] Stripe Development — `HOLD_EXTERNAL`.
- [ ] PayPal sandbox — `HOLD_EXTERNAL`.
- [ ] Social/OAuth — `HOLD_EXTERNAL`.
- [ ] CAIP private media — use fresh Build 7 evidence.

- [x] Provider/payment/refund/OAuth execution from Build 15: NONE.
- [x] Cloudflare Access policy mutation from Build 15: NONE.
- [x] Secret values emitted by Build 15: NONE.

## Main / Production sanity

- [x] `main` remains Build 11 SHA `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`.
- [x] Production Pages Deploy `33640133776` — SUCCESS.
- [x] Builds 12–15 remain Development-only.
- [x] Build 15 does not contact or mutate Production.

## Current verdict

Release 467 Build 14 is the exact proven Development predecessor. Release 467 Build 15 is a schema-neutral Storefront / SEO parity candidate: visible Product facts, schema, Shop relationships and fulfillment policy converge while missing evidence becomes admin remediation and all provider/Production lanes remain closed. External lanes remain truthfully `HOLD_EXTERNAL`.
