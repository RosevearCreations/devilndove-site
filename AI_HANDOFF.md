# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 19 — Inventory Replenishment & Procurement Readiness Command Center** is the active Development source candidate.

Read `current-development-authority.json` first, then this file, then `docs/operations/RELEASE_467_BUILD_19_INVENTORY_REPLENISHMENT_PROCUREMENT_READINESS.md`. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** and the middleware Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

Exact Development-green predecessor: **Release 467 Build 18 — Order Fulfillment & Customer Care Command Center**:

- merged `dev`: `ce01014e201df9a8a8496945bd71212bd688c6f6`
- tree: `131948dc58cc455ab4e7a6f5e883edf47adfb00f`
- System Gate `33669162936` — SUCCESS
- Build 18 Proof `33669163159` — SUCCESS

The original autonomous 20-item sequence remains complete through Build 17. Build 18 closed post-sale fulfillment/customer-care visibility. Build 19 continues the bounded internal-operations sequence without reopening external provider lanes.

## Build 19 scope

Build 19 adds one **read-only** Inventory Replenishment & Procurement Readiness command center:

1. existing inventory reorder-threshold and reorder-list attention;
2. do-not-reorder conflicts and missing supplier facts;
3. purchase-order draft/open/partial-receipt readiness;
4. receiving attention based on existing ordered and received quantities;
5. stale physical-count confidence for items already in replenishment attention;
6. recent audited receiving evidence; and
7. supplier-level inventory, incoming quantity and open purchase-order context.

The 10-day ordered purchase-order review is only stale-record review; it is not represented as a supplier due date or late-delivery fact.

Build 19 performs no automatic purchase-order creation/submission/mutation, inventory adjustment, receiving action, supplier message or provider call. The endpoint exposes no POST handler and contains no request-time DDL/DML.

Primary Build 19 authorities:

- `release467-build19-inventory-replenishment-procurement-readiness.json`
- `scripts/release467_build19_gate.py`
- `.github/workflows/release467-build19-proof.yml`
- `docs/operations/RELEASE_467_BUILD_19_INVENTORY_REPLENISHMENT_PROCUREMENT_READINESS.md`
- `/admin/inventory-replenishment/`
- `/api/admin/inventory-replenishment`

## Retained Build 18 / Release 467 authority

**Release 467 Build 18 — Order Fulfillment & Customer Care Command Center** remains exact green predecessor authority and stays read-only over Orders, Custom Requests, Customers and Accounting.

**Release 467 Build 17 — Creator & Content Completeness** remains retained. **Release 467 Build 16 — Custom Request & Made Today Journey** remains the customer-safe Custom Request / Made Today authority. **Release 467 Build 15 — Storefront / SEO Parity** remains the visible-fact SEO/shipping authority. **Release 467 Build 14 — Product Release Quality Command Center** remains the Product quality owner and retains exact green **Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** SHA `794fd5b36191fff4c9e8376197f968d9c6d6da80`. Build 13 remains retained with exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f`. **Release 467 Build 12 — Finance Operations Command Center** remains read-only with exact Build 11 source base `ce42f3b2ea553b69085705f500a9e2bd2f689818`. External lanes remain `HOLD_EXTERNAL`.

**Release 467 Build 6 — Development Cloudflare Access Acceptance Harness** remains retained as source-only Access acceptance authority; real service-token acceptance remains `HOLD_EXTERNAL` until deliberately dispatched and proven.

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains locked provenance with Build 7 predecessor `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, System Gate `33591744817`, Build 7 Proof `33591744787`, external state `HOLD_EXTERNAL`. Current Release 467 authority remains intentionally separate from inherited Release 466 regression/runtime compatibility.

**Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics** remains the technical first stop. Release 467 Build 11 — Admin Operations Command Center remains the daily business first stop. Build 5 — CI / Cloudflare Access readiness remains separate from Production Promotion Readiness. Masked references `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are names only; secret values never belong in source, UI, logs or evidence.

## Environment / safety boundary

- source: `dev`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 19 schema migration/request-time DDL: NONE
- Build 19 D1/R2 mutation authority: NONE
- automatic purchase-order/inventory/receiving/supplier-message action: NONE
- provider execution/publication: NONE
- Cloudflare Access policy mutation: NONE
- `main` / Production mutation: NONE

External lanes remain **`HOLD_EXTERNAL`**: Cloudflare Access service token, Stripe Development, PayPal sandbox, Social/OAuth. CAIP private-media status uses fresh Build 7 evidence.

Canada-only fulfillment and the existing U.S. sales/shipping suspension remain intact.

## Main / Production boundary

`main` / Production remain separately verified at **Release 467 Build 15** SHA `296e53b079bba53126c80902be36a9271d82cea4`; Production Pages Deploy `33655223149` succeeded there. Builds 16–19 remain Development-only until a separate deliberate promotion.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build19-inventory-replenishment-procurement-readiness.json`
4. `docs/operations/RELEASE_467_BUILD_19_INVENTORY_REPLENISHMENT_PROCUREMENT_READINESS.md`
5. `PROJECT_STATUS_AND_ROADMAP.md`
6. `SANITY_HEALTH_CHECK.md`
7. `release467-build18-order-fulfillment-customer-care.json`
8. `release467-build17-creator-content-completeness.json`
9. `release467-build16-custom-request-made-today-journey.json`
10. `release467-build15-storefront-seo-parity.json`
11. `release467-build14-product-release-quality.json`
12. `release467-build13-repository-hygiene-cleanup.json`
13. `release467-build12-finance-operations-command-center.json`
14. `release467-build11-admin-operations-command-center.json`
15. `release467-build10-it-control-tower-consolidation.json`
16. `release467-build9-historical-ci-retirement.json`
17. `release467-build8-authority-convergence.json`
18. `release467-build7-external-commercial-acceptance.json`
19. `release467-build6-access-acceptance-harness.json`
20. `release467-build5-production-promotion-readiness.json`
21. `development-release.json` — compatibility evidence only

## Restart point

Continue Build 19 on `release467-build19-inventory-replenishment-procurement-readiness` from exact green Build 18 base `ce01014e201df9a8a8496945bd71212bd688c6f6`. Prove the exact feature SHA, require the complete current/historical PR fanout green, merge only the unchanged green head, then require exact merged Build 19 proof and canonical System Gate Development deployment before calling Build 19 complete.
