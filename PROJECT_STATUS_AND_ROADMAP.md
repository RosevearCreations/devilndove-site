# Devil n Dove — Project Status & Roadmap

## Current release

**Release 466 — Operational Resilience and Commercial Readiness** is the current Development release. Builds 1, 2 and 3 are Development green. Build 1 native GitHub ruleset application remains the external repository-setting boundary pending. Release 465 remains fully Production green on `main` at `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`.

## Four-build plan

| Build | Items | Theme | State |
|---|---:|---|---|
| Build 1 | 1–5 | Governance, Recovery & Production Reliability | Development green / native GitHub ruleset external pending |
| Build 2 | 6–10 | Runtime & Storefront Intelligence | Development green |
| Build 3 | 11–15 | Revenue & Business Intelligence | Development green |
| Build 4 | 16–20 | External Acceptance & Commercial Readiness | Next |

## Build 1 — Governance, Recovery & Production Reliability

Items 2–5 remain Development green. Item 1's in-repository fail-closed policy is green; native GitHub `dev`/`main` ruleset application remains external/pending.

Final closure source `3ac3e249f1dfd45bb7b9d20aeb2cdcb16f178a1e`; System Gate `33464419372` PASS; Build 1 Proof `33464419380` PASS. Production reliability remains current read-only `100/100 GREEN`.

## Build 2 — Runtime & Storefront Intelligence

Items 6–10 are Development green. Final closure source `855171430c6b14c4f4a6ff24a120bcce722294f9`; final System Gate `33466171233` PASS; final Build 2 Proof `33466171290` PASS.

The corrected live Production SEO baseline remains `46` public HTML pages / `38` sitemap URLs / `6` errors / `8` warnings. The six retained sitemap/noindex conflicts are `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`. These are actionable intelligence, not hidden failures.

## Build 3 — Revenue & Business Intelligence

11. Storefront conversion funnel analytics — **Development green**, read-only over existing page-view/cart/order authorities.
12. Zero-result/abandoned-search intelligence — **Development green**, using existing search/session/cart evidence with explicit abandonment semantics.
13. Explainable Product opportunity score — **Development green**, recommendation-only with visible component scores/reasons.
14. Inventory reorder economics — **Development green**, using existing Inventory/replenishment/sourcing evidence; never places orders.
15. Creative-project priority engine — **Development green**, recommendation-only; never starts/publishes projects or posts Inventory/Accounting.

Technical-green source: `5ca09eab9e2a3441ffbdf76c46e35b3a6fcd52a6`.

- canonical System Gate `33466655732` — PASS
- exact Development Preview `https://732f6430.devilndove-site.pages.dev`
- Release 466 Build 3 Proof `33466655735` — PASS
- Build 3 proof artifact `9785121048`, SHA-256 `92af7c472900d89cf4d9a01a44d4abc5ba4a10ef698de2cac7df44011b525b56`
- all `11` required Development authority tables present
- observed Development rows: page views `33`, Products `45`, Inventory `1041`, Creative projects `5`, cart/order/search/profitability `0/0/0/0`
- zero observed rows mean no captured Development observations in those authorities, not zero demand or zero Production activity
- canonical migrations remain `0001`–`0004`; no Build 3 migration applied; FK violations `0`
- Preview remained Cloudflare Access protected; Production business rows read ZERO; Production mutation ZERO

Builds 1–3 introduce no new D1 migration.

## Production boundary

Release 466 has **not** been promoted. Production remains Release 465 at exact SHA `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`. Production business data remain Production-owned.

## Build 4 — External Acceptance & Commercial Readiness — next

16. CAIP private-media authenticated browser/range-streaming acceptance.
17. Stripe Development payment/webhook/refund/reconciliation/idempotency acceptance.
18. PayPal sandbox payment/webhook/refund/reconciliation/idempotency acceptance.
19. Social/OAuth controlled connect/refresh/expiry/revoke/outage/reconnect acceptance, with publication still closed.
20. Production-launch readiness cockpit combining source, recovery, provider, SEO, performance and incident evidence.

Build 4 must preserve sandbox/Development boundaries. Provider configuration or credentials do not authorize live charges, Production publication, or Release 466 Production promotion.

## Permanent boundaries

Production data is never replaced wholesale from Development. Request-time DDL, schema reversal, automatic business-data restore, raw R2 deletion, provider execution/publication, automatic financial correction, automatic price/reorder/project actions, and main-only application patches remain closed. Release 466 Production promotion requires a separate deliberate authorization after Development acceptance.
