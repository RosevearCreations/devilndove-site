# Devil n Dove — Project Status & Roadmap

## Current release

**Release 467 Build 19 — Inventory Replenishment & Procurement Readiness Command Center** is the active Development candidate.

Exact Development-green predecessor: **Release 467 Build 18 — Order Fulfillment & Customer Care Command Center**, merged `dev` `ce01014e201df9a8a8496945bd71212bd688c6f6`, tree `131948dc58cc455ab4e7a6f5e883edf47adfb00f`, System Gate `33669162936` SUCCESS, Build 18 Proof `33669163159` SUCCESS.

`current-development-authority.json` remains the restart selector. `development-release.json` remains Release 466 **INHERITED_REGRESSION_COMPATIBILITY** and the runtime Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

## Release 467 progression

| Build | Theme | State |
|---|---|---|
| 1–4 | I.T. readiness, recovery, runtime acceptance, evidence ledger | Development merged |
| 5 | CI / Cloudflare Access readiness + Production Promotion Readiness | Source green; external/promotion separate |
| 6 | Development Cloudflare Access acceptance harness | Harness green; real Access `HOLD_EXTERNAL` |
| 7 | External Commercial Acceptance Bridge | Source green; external lanes bounded |
| 8 | Authority Convergence and Restart Safety | Development green |
| 9 | Historical CI Retirement & Gate Fanout Reduction | Development green |
| 10 | I.T. Control Tower Consolidation and Self-Diagnostics | Development green |
| 11 | Admin Operations Command Center | Development green |
| 12 | Finance Operations Command Center | Development green |
| 13 | Repository Hygiene and Historical CI Cleanup | Development green |
| 14 | Product Release Quality Command Center | Development green |
| 15 | Storefront / SEO Parity | Development green + current Production checkpoint |
| 16 | Custom Request & Made Today Journey | Development green |
| 17 | Creator & Content Completeness | Development green |
| 18 | Order Fulfillment & Customer Care Command Center | Development green at `ce01014e…` |
| 19 | Inventory Replenishment & Procurement Readiness Command Center | Active Development candidate |

## Build 19 — replenishment and procurement readiness

Build 19 adds a read-only operator projection across existing inventory reorder facts, supplier completeness, purchase-order status and receiving evidence. Attention lanes are replenishment, supplier, procurement, receiving and inventory accuracy.

The projection does not create or submit purchase orders, change inventory, receive stock, contact suppliers or call providers. Inventory Operations and the audited Receiving workflow remain mutation owners. An ordered purchase-order record unchanged for 10 days is surfaced only as stale-record review; Build 19 does not invent a supplier due date.

## Retained provenance

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains locked provenance with Build 7 predecessor `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, System Gate `33591744817`, Build 7 Proof `33591744787`, external state `HOLD_EXTERNAL`. Current Release 467 authority remains separate from inherited Release 466 compatibility evidence.

**Release 467 Build 12 — Finance Operations Command Center** remains read-only with exact Build 11 source base `ce42f3b2ea553b69085705f500a9e2bd2f689818`; external acceptance remains `HOLD_EXTERNAL`.

**Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** retains exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f`; external acceptance remains `HOLD_EXTERNAL`.

**Release 467 Build 14 — Product Release Quality Command Center** retains exact green **Release 467 Build 13 — Repository Hygiene** SHA `794fd5b36191fff4c9e8376197f968d9c6d6da80` and exact retained predecessor `374983f68fb16172fb357b1755293a29e5d2953f`; external lanes remain `HOLD_EXTERNAL`.

**Release 467 Build 15 — Storefront / SEO Parity** retains **Release 467 Build 14 — Product Release Quality Command Center** and keeps external lanes `HOLD_EXTERNAL`. **Release 467 Build 16 — Custom Request & Made Today Journey**, **Release 467 Build 17 — Creator & Content Completeness**, and **Release 467 Build 18 — Order Fulfillment & Customer Care Command Center** remain retained Development-green authorities.

Build 4 consolidates source-proof authorities into its same-session evidence and acceptance ledger; Build 10 preserves that ledger rather than replacing it. Build 5 — CI / Cloudflare Access readiness remains separate from Production Promotion Readiness.

## Development boundary

- Source: `dev`.
- Preview: `https://dev.devilndove-site.pages.dev`.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Product R2: `devilndove-toolshed-images-dev`.
- CAIP R2: `devilndove-caip-media-dev`.
- Canonical migrations: exactly `0001`–`0004`.
- Build 19 migration/request-time DDL/new D1/R2 mutation authority: NONE.

## External acceptance

Cloudflare Access service-token, Stripe Development, PayPal sandbox and Social/OAuth remain **`HOLD_EXTERNAL`**. CAIP private-media status uses fresh Build 7 evidence. Build 19 performs no provider/payment/OAuth execution.

## Main / Production boundary

`main` remains exact Release 467 Build 15 `296e53b079bba53126c80902be36a9271d82cea4`. Production Pages Deploy `33655223149` succeeded there. Builds 16–19 remain Development-only; Build 19 does not contact or mutate Production.

## Next bounded work

Close Build 19 through exact feature proof, full current/historical PR fanout, unchanged-head merge, exact merged Build 19 proof, and canonical Development System Gate deployment. Only after that checkpoint select Build 20.
