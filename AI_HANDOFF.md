# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 18 — Order Fulfillment & Customer Care Command Center** is the active Development source candidate.

Read `current-development-authority.json` first, then this file, then `docs/operations/RELEASE_467_BUILD_18_ORDER_FULFILLMENT_CUSTOMER_CARE.md`. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** and the middleware Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

Exact Development-green predecessor: **Release 467 Build 17 — Creator & Content Completeness**:

- merged `dev`: `7f3363954434801e9226b29d83899ea795713525`
- tree: `0df69c0b24484536e6f50e21a523c915d101923a`
- System Gate `33665275366` — SUCCESS
- Build 17 Proof `33665275406` — SUCCESS

The original autonomous 20-item sequence is complete through Build 17. Build 18 begins the next bounded internal operations sequence; it does not reopen external provider lanes.

## Build 18 scope

Build 18 adds one **read-only** Order Fulfillment & Customer Care command center:

1. standard order/payment/refund attention derived from existing `orders`, `payments`, `payment_refunds`, and `order_status_history` facts;
2. custom-order progress derived from existing Custom Requests order drafts, reviewed stage events, fulfillment prompts and private order-status links;
3. Canada-only shipping-policy mismatch detection;
4. paid-but-stale fulfillment review;
5. customer-care and after-sale follow-up visibility;
6. explicit links back to Orders, Custom Requests, Customers and Accounting—the retained write owners.

Build 18 performs no automatic order mutation, payment/refund execution, customer message, stage advance, fulfillment action or provider call. The new endpoint exposes no POST handler and contains no request-time DDL/DML.

Primary Build 18 authorities:

- `release467-build18-order-fulfillment-customer-care.json`
- `scripts/release467_build18_gate.py`
- `.github/workflows/release467-build18-proof.yml`
- `docs/operations/RELEASE_467_BUILD_18_ORDER_FULFILLMENT_CUSTOMER_CARE.md`
- `/admin/order-fulfillment-care/`
- `/api/admin/order-fulfillment-care`

## Retained Build 17 / autonomous authority

**Release 467 Build 17 — Creator & Content Completeness** remains exact green predecessor authority. It closed autonomous items 16–20: Creative Project → Content Studio completeness, evidence-only CAIP ranking, Media assignment/orphan diagnostics, reviewed marketplace presets, and no-silent-placeholder governance.

**Release 467 Build 16 — Custom Request & Made Today Journey** remains the customer-safe Custom Request / Made Today authority. **Release 467 Build 15 — Storefront / SEO Parity** remains the visible-fact SEO/shipping authority. **Release 467 Build 14 — Product Release Quality Command Center** remains the Product quality owner and retains exact green **Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** SHA `794fd5b36191fff4c9e8376197f968d9c6d6da80`. Build 13 remains retained with exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f`. **Release 467 Build 12 — Finance Operations Command Center** remains read-only with exact Build 11 source base `ce42f3b2ea553b69085705f500a9e2bd2f689818`. External lanes remain `HOLD_EXTERNAL`.

## Release 467 retained authority separation

**Release 467 Build 6 — Development Cloudflare Access Acceptance Harness** remains the source-only Access acceptance harness; real service-token acceptance remains `HOLD_EXTERNAL` until deliberately dispatched and proven.

**Release 467 Build 7 — External Commercial Acceptance Bridge** remains the external commercial/CAIP visibility authority; external lanes remain `HOLD_EXTERNAL` unless separately proven.

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains locked provenance with Build 7 predecessor `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, System Gate `33591744817`, Build 7 Proof `33591744787`, external state `HOLD_EXTERNAL`. Current Release 467 authority remains intentionally separate from inherited Release 466 regression/runtime compatibility.

**Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction** remains retained.

**Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics** remains the technical first stop. Build 4 consolidates source-proof authorities into its same-session evidence and acceptance ledger; Build 10 preserves that ledger rather than replacing it.

Release 467 Build 11 — Admin Operations Command Center remains the daily business first stop. Build 5 — CI / Cloudflare Access readiness remains separate from Production Promotion Readiness. Masked references `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are names only; secret values never belong in source, UI, logs or evidence.

## Environment / safety boundary

- source: `dev`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 18 schema migration/request-time DDL: NONE
- Build 18 D1/R2 mutation authority: NONE
- automatic order/payment/refund/customer-message/stage/fulfillment action: NONE
- provider execution/publication: NONE
- Cloudflare Access policy mutation: NONE
- `main` / Production mutation: NONE

External lanes remain **`HOLD_EXTERNAL`**: Cloudflare Access service token, Stripe Development, PayPal sandbox, Social/OAuth. CAIP private-media status uses fresh Build 7 evidence.

Canada-only fulfillment and the existing U.S. sales/shipping suspension remain intact.

## Main / Production boundary

`main` / Production remain separately verified at **Release 467 Build 15** SHA `296e53b079bba53126c80902be36a9271d82cea4`; Production Pages Deploy `33655223149` succeeded there. Builds 16–18 remain Development-only until a separate deliberate promotion.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build18-order-fulfillment-customer-care.json`
4. `docs/operations/RELEASE_467_BUILD_18_ORDER_FULFILLMENT_CUSTOMER_CARE.md`
5. `PROJECT_STATUS_AND_ROADMAP.md`
6. `SANITY_HEALTH_CHECK.md`
7. `release467-build17-creator-content-completeness.json`
8. `docs/operations/RELEASE_467_BUILD_17_CREATOR_CONTENT_COMPLETENESS.md`
9. `release467-build17-placeholder-registry.json`
10. `docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md`
11. `release467-build16-custom-request-made-today-journey.json`
12. `release467-build15-storefront-seo-parity.json`
13. `release467-build14-product-release-quality.json`
14. `release467-build13-repository-hygiene-cleanup.json`
15. `release467-build12-finance-operations-command-center.json`
16. `release467-build11-admin-operations-command-center.json`
17. `release467-build10-it-control-tower-consolidation.json`
18. `release467-build9-historical-ci-retirement.json`
19. `release467-build8-authority-convergence.json`
20. `release467-build7-external-commercial-acceptance.json`
21. `release467-build6-access-acceptance-harness.json`
22. `release467-build5-production-promotion-readiness.json`
23. `development-release.json` — compatibility evidence only

## Restart point

Do not redo Builds 14–17. Continue Build 18 on `release467-build18-order-fulfillment-customer-care` from exact green Build 17 base `7f3363954434801e9226b29d83899ea795713525`. Prove the exact Build 18 feature SHA, require the complete current/historical PR fanout green, merge only the unchanged green head, then require exact merged Build 18 proof and canonical System Gate Development deployment before calling Build 18 complete.
