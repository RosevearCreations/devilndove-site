# Devil n Dove — Project Status & Roadmap

## Current release

**Release 467 Build 15 — Storefront / SEO Parity** is the active Development source candidate.

Exact Development-green predecessor: **Release 467 Build 14 — Product Release Quality Command Center**, merged `dev` `dd92a10799f0f7656fe9508a25a983839117a1d0`, tree `dbe3ed8e1be82c02223a346f58a626654f8d5382`, System Gate `33649971571` SUCCESS, Build 14 Proof `33649971525` SUCCESS.

`current-development-authority.json` remains the restart selector. `development-release.json` remains Release 466 **INHERITED_REGRESSION_COMPATIBILITY** and the runtime Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

## Release 467 progression

| Build | Theme | State |
|---|---|---|
| 1–4 | I.T. readiness, recovery, same-origin authenticated browser runtime acceptance, evidence ledger | Development merged |
| 5 | CI / Cloudflare Access readiness + Production Promotion Readiness | Source green; external/promotion separate |
| 6 | Development Cloudflare Access acceptance harness | Harness green; real Access `HOLD_EXTERNAL` |
| 7 | External Commercial Acceptance Bridge | Source green; external lanes bounded |
| 8 | Authority Convergence and Restart Safety | Development green |
| 9 | Historical CI Retirement & Gate Fanout Reduction | Development green |
| 10 | I.T. Control Tower Consolidation and Self-Diagnostics | Development green |
| 11 | Admin Operations Command Center | Development + Production green at `ce42f3b2…` |
| 12 | Finance Operations Command Center | Development green at `374983f6…` |
| 13 | Repository Hygiene and Historical CI Cleanup | Development green at `794fd5b3…` |
| 14 | Product Release Quality Command Center | Development green at `dd92a107…` |
| 15 | Storefront / SEO Parity | Active Development candidate |

## Build 15 — autonomous backlog items 6–10

Build 15 consolidates existing Storefront authorities rather than creating parallel SEO, Product or shipping systems.

### 6. Product structured-data parity

`public/js/storefront-parity.js` derives Product, Offer and BreadcrumbList JSON-LD from the same visible Product/listing-profile/story facts used on the page. Price, currency, SKU, availability, canonical URL, images and Canada-only shipping facts must agree with visible buyer information. Schema-only marketing facts are forbidden.

### 7. Full public SEO quality

`scripts/release467_build15_public_seo_gate.py` audits checked-in indexable public HTML for exactly one H1, useful title/meta description, canonical, crawlable internal links, image sources/alt text and applicable structured data. Dynamic Product schema parity is also asserted through the retained Release 465 `seo-page-overrides.js` bootstrap.

### 8. Buyer-fact normalization

Approved facts are normalized across Product Detail, Shop and schema: material, process, finish/condition, size/dimensions, care, personalization limits, availability, shipping/pickup and handmade limitations. `/api/product-buyer-facts` reads only active Products plus approved/published public-safe supporting records and remains request-time-schema-read-only.

The existing **Release 467 Build 14 — Product Release Quality Command Center** remains the single Product quality queue. Build 15 extends it with explicit buyer-fact remediation instead of silently omitting or inventing missing facts.

### 9. Shop / Collection internal linking

Product Detail already owned proof-related Product results and curated collection links. Build 15 reuses material/process/type/origin/category relationships on Shop cards and Product navigation to deepen crawlable, buyer-useful relationships without creating a recommendation authority disconnected from Product facts.

### 10. Shipping / pickup / policy consistency

`functions/api/checkout-create-order.js` already fails closed to Canada-only shipping before order mutation/provider activity. Build 15 surfaces the same policy on Shop, Product, Cart and Checkout. The existing U.S. sales/shipping suspension remains intact. Marketplace shipping-profile preparation remains local-only and provider execution/publication remains disabled.

## Retained provenance

**Release 467 Build 12 — Finance Operations Command Center** remains a closed read-only authority with exact Build 11 source base `ce42f3b2ea553b69085705f500a9e2bd2f689818` and external state `HOLD_EXTERNAL`.

**Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** remains retained at exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f`; 39 obsolete Release 448–461 workflow definitions remain retired and the repository hygiene fence remains active.

**Release 467 Build 14 — Product Release Quality Command Center** remains retained with its exact Build 13 predecessor `794fd5b36191fff4c9e8376197f968d9c6d6da80`. Build 15 extends that read-only Product quality operator surface but does not replace its Product/Media/Marketplace authorities.

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains locked provenance with Build 7 predecessor `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, System Gate `33591744817`, Build 7 Proof `33591744787`, external state `HOLD_EXTERNAL`.

Build 4 retains the same-session evidence and acceptance ledger; Build 10 preserves that ledger rather than replacing it. Build 5 — CI / Cloudflare Access readiness remains separate from Production Promotion Readiness. Masked names `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are never secret-value evidence.

## Development boundary

- Source: `dev`.
- Preview: `https://dev.devilndove-site.pages.dev`.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Product R2: `devilndove-toolshed-images-dev`.
- CAIP R2: `devilndove-caip-media-dev`.
- Canonical migrations: exactly `0001`–`0004`.
- Build 15 migration/request-time DDL/new D1/R2 mutation authority: NONE.

## External acceptance

Cloudflare Access service-token, Stripe Development, PayPal sandbox and Social/OAuth remain **`HOLD_EXTERNAL`**. CAIP private-media status uses fresh Build 7 evidence. Build 15 performs no provider/payment/refund/OAuth execution or publication.

## Main / Production boundary

`main` remains exact Build 11 `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`. Production Pages Deploy `33640133776` succeeded there. Builds 12–15 remain Development-only; Build 15 does not mutate/contact Production or change Cloudflare Access policy.

## Next bounded work

Close Build 15 through exact feature source proof, full current Release 467/System PR fanout, unchanged-head merge, and exact merged Build 15 proof plus canonical Development System Gate deployment. After Build 15 closes, proceed to **Build 16 — autonomous backlog items 11–15** covering custom-request journey, private stage messaging, approved candle/soap examples, consent-approved customer proof and mobile Made Today capture.

## Permanent boundaries

Development first. Production data remain Production-owned. Request-time DDL, migration replay on restart, raw R2 deletion, automatic provider execution/publication, secret exposure and automatic Production promotion remain closed. Existing U.S. sales/shipping suspension remains intact. External lanes remain `HOLD_EXTERNAL` until deliberately proven.
