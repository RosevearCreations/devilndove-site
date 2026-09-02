# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 15 — Storefront / SEO Parity** is the active Development source candidate.

Read `current-development-authority.json` first, then this file, then `docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md`. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** and the middleware Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

Exact Development-green predecessor: **Release 467 Build 14 — Product Release Quality Command Center**:

- merged `dev`: `dd92a10799f0f7656fe9508a25a983839117a1d0`
- tree: `dbe3ed8e1be82c02223a346f58a626654f8d5382`
- System Gate `33649971571` — SUCCESS
- Build 14 Proof `33649971525` — SUCCESS

Build 14 retained Release 467 Build 13 — **Repository Hygiene and Historical CI Cleanup** at `794fd5b36191fff4c9e8376197f968d9c6d6da80`; Build 13 retained exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f`.

## Build 15 scope — autonomous items 6–10

Build 15 is schema-neutral Storefront quality work:

1. Product/Offer/Breadcrumb structured-data parity with visible Product facts.
2. Full checked-in indexable public SEO quality audit: one H1, useful title/meta, canonical, internal links, image/alt quality and applicable structured data.
3. Normalized buyer facts across Product Detail, Shop and schema; missing materials, finish/condition, dimensions, care, personalization limits or availability become Product Quality remediation rather than invented public copy.
4. Stronger Shop/Product/Collection relationships by material, process, type, origin and category.
5. Shipping/pickup/policy convergence around the existing Canada-only server authority while preserving the U.S. sales/shipping suspension.

Primary Build 15 authorities:

- `release467-build15-storefront-seo-parity.json`
- `scripts/release467_build15_gate.py`
- `scripts/release467_build15_public_seo_gate.py`
- `.github/workflows/release467-build15-proof.yml`
- `public/js/storefront-parity.js`
- `public/js/seo-page-overrides.js` — retained Release 465 bootstrap extended, not replaced
- `public/js/product-detail-parity.js`
- `public/js/shop-parity.js`
- `public/js/storefront-shipping-policy.js`
- `functions/api/product-buyer-facts.js` — read-only public-safe approved facts
- `public/js/admin-product-quality-command-center.js` — retained Build 14 Product Quality owner, extended with buyer-fact remediation
- `functions/api/checkout-create-order.js` — retained real Canada-only shipping enforcement
- `functions/api/_lib/marketplaceReadiness.js` — retained local marketplace preparation authority

## Shipping / U.S. policy

The existing checkout server rejects non-Canada shipping before local order mutation and before provider network activity using `shipping_country_not_supported`, `allowed_countries: ['CA']`, `local_order_mutation_performed: false`, and `provider_network_call_performed: false`.

Build 15 surfaces that same policy on Shop, Product, Cart and Checkout. **Existing U.S. sales/shipping suspension remains intact.** Build 15 does not add U.S. checkout or provider execution.

## Release 467 retained authority separation

Builds 1–4 retain I.T. readiness, recovery actions, **same-origin authenticated browser runtime acceptance**, and sanitized evidence. **Build 4 consolidates source-proof authorities into its same-session evidence and acceptance ledger; Build 10 preserves that ledger rather than replacing it.**

**Build 5 — CI / Cloudflare Access readiness** remains separate from **Production Promotion Readiness**. Masked references `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are names only; secret values never belong in source, UI, logs or evidence.

Release 467 Build 6 — Development Cloudflare Access acceptance harness remains dispatch-only. Release 467 Build 7 — **External Commercial Acceptance Bridge** owns visibility for CAIP private media, Stripe Development, PayPal sandbox and Social/OAuth. Release 467 Build 8 — Authority Convergence and Restart Safety retains current-vs-compatibility separation. Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction remains retained. Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics remains the technical first stop. Release 467 Build 11 — Admin Operations Command Center remains the daily business first stop.

**Release 467 Build 12 — Finance Operations Command Center** remains read-only with exact Build 11 source base `ce42f3b2ea553b69085705f500a9e2bd2f689818`. **Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** remains retained with exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f`. **Release 467 Build 14 — Product Release Quality Command Center** remains the Product quality authority and is extended, not replaced, by Build 15.

## Environment / safety boundary

- source: `dev`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 15 migration/request-time DDL/new D1/R2 mutation: NONE
- provider execution/publication: NONE
- Cloudflare Access policy mutation: NONE
- `main` / Production mutation: NONE

External lanes remain **`HOLD_EXTERNAL`**: Cloudflare Access service token, Stripe Development, PayPal sandbox, Social/OAuth. CAIP private-media status uses fresh Build 7 evidence.

## Main / Production boundary

`main` remains verified at Build 11 `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`; Production Pages Deploy `33640133776` succeeded there. Builds 12–15 remain Development-only until separate deliberate promotion.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build15-storefront-seo-parity.json`
4. `docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md`
5. `PROJECT_STATUS_AND_ROADMAP.md`
6. `SANITY_HEALTH_CHECK.md`
7. `docs/operations/RELEASE_467_BUILD_15_STOREFRONT_SEO_PARITY.md`
8. `release467-build14-product-release-quality.json`
9. `docs/operations/RELEASE_467_BUILD_14_PRODUCT_RELEASE_QUALITY.md`
10. `release467-build13-repository-hygiene-cleanup.json`
11. `release467-build12-finance-operations-command-center.json`
12. `release467-build11-admin-operations-command-center.json`
13. `release467-build10-it-control-tower-consolidation.json`
14. `release467-build9-historical-ci-retirement.json`
15. `release467-build8-authority-convergence.json`
16. `release467-build7-external-commercial-acceptance.json`
17. `release467-build6-access-acceptance-harness.json`
18. `release467-build5-production-promotion-readiness.json`
19. `development-release.json` — compatibility evidence only

## Restart point

Do not redo Build 14. Continue Build 15 from `release467-build15-storefront-seo-parity`, prove the exact feature SHA, require all current Release 467/System PR checks green, merge only the unchanged green head, then require exact merged Build 15 proof and canonical System Gate Development deployment before calling Build 15 complete.
