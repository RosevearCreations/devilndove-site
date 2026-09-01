# Devil n Dove — AI Handoff

## Current authority

**Release 466 — Operational Resilience and Commercial Readiness — Build 3 is Development green.** Builds 1 and 2 remain Development green. Build 1 has one external repository-governance boundary: native GitHub `dev`/`main` ruleset application remains pending because the connected GitHub integration can read rulesets but cannot write them.

Release 465 remains fully GREEN on Production and must not be reopened unless a current gate proves drift.

## Exact environment boundary

### Development
- branch: `dev`
- Pages: `devilndove-site` / Preview
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`

### Production
- branch: `main`
- current Production release: **465**
- current Production source: `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`
- live: `https://devilndove.com`
- D1: `devilndove-prod-r462` (`f34a741b-0000-45b0-9a96-6be08754d563`)
- Product R2: `devilndove-toolshed-images`
- CAIP R2: `devilndove-caip-media`

Production business/transactional data remain Production-owned. Release 466 has **not** been promoted to Production.

## Release 466 Build 1 closure

Final closure SHA: `3ac3e249f1dfd45bb7b9d20aeb2cdcb16f178a1e`.

- canonical System Gate `33464419372` — PASS
- Release 466 Build 1 Proof `33464419380` — PASS
- items 2–5 Development green
- item 1 in-repository fail-closed policy Development green; native GitHub ruleset application external/pending
- Production reliability snapshot remains read-only `100/100 GREEN`
- recovery export remains serialized after exact-SHA System Gate

## Release 466 Build 2 closure

Final closure SHA: `855171430c6b14c4f4a6ff24a120bcce722294f9`.

- final canonical System Gate `33466171233` — PASS
- final Release 466 Build 2 Proof `33466171290` — PASS
- synthetic Production monitor remains GET-only and GREEN
- corrected Production SEO baseline remains `46` public HTML pages / `38` sitemap URLs / `6` errors / `8` warnings

The six retained live SEO errors are sitemap/noindex conflicts on `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`. Build 2 never mutated Release 465 Production to make Development pass.

## Release 466 Build 3 technical-green evidence

Technical-green source SHA: `5ca09eab9e2a3441ffbdf76c46e35b3a6fcd52a6`.

Canonical System Gate:
- run `33466655732`
- source job `99727807616`
- deploy-development job `99727877699`
- exact Preview `https://732f6430.devilndove-site.pages.dev`
- Development deploy proof artifact `9785113788`
- regression evidence artifact `9785114215`
- canonical D1: exactly `4` migrations / `4` proofs / `0` newly applied / `0` FK violations
- `No migrations to apply!`
- Preview remained Cloudflare Access protected; authentication headers ZERO; Access weakened NO.

Release 466 Build 3 Proof:
- run `33466655735`
- source-proof job `99727807035`
- runtime-proof job `99727862065`
- artifact `9785121048`
- artifact SHA-256 `92af7c472900d89cf4d9a01a44d4abc5ba4a10ef698de2cac7df44011b525b56`
- all `11` required Development business-intelligence authority tables present
- observed Development rows: page views `33`, Products `45`, Inventory `1041`, Creative projects `5`, cart/order/search/profitability `0/0/0/0`
- zero observed rows are coverage evidence only and are not claims of zero demand or zero Production activity
- Development D1 operation SELECT only
- Production business rows read ZERO; Production mutation ZERO
- automatic price/reorder/project execution ZERO
- Inventory/Accounting mutation and provider/payment execution ZERO

## Build 3 status

11. Storefront conversion-funnel analytics — **Development green**. Existing page-view/cart/order authorities, read-only.
12. Zero-result and abandoned-search intelligence — **Development green**. Existing search/session/cart evidence with explicit abandonment semantics.
13. Explainable Product opportunity score — **Development green**. Visible component scores/reasons; recommendation only.
14. Inventory reorder economics — **Development green**. Existing Inventory/replenishment/source evidence; never places an order.
15. Creative-project priority engine — **Development green**. Recommendation only; cannot start/publish projects, consume Inventory or post Accounting.

Build 3 is schema-neutral. Canonical migrations remain exactly `0001`–`0004`.

## Permanent safety rules

- Exact green Development tree only may move to `main`.
- Main-only application patches are forbidden.
- Production transactional data are never overwritten from Development.
- Request-time schema DDL remains forbidden.
- Schema migrations are forward-only; rollback does not automatically reverse schema.
- Business-data restore is never automatic.
- Native Git-triggered Cloudflare Pages deployment remains frozen.
- Provider execution/publication remain closed unless separately authorized and bounded to the intended Development/sandbox acceptance.
- Raw CAIP R2 deletion remains closed.
- Cloudflare Access is never weakened for Preview smoke.
- Build 3 scores are recommendation-only; automatic price changes, reorders and project starts remain closed.

## Next bounded work

After the final Build 3 closure tree re-passes the canonical System Gate and Release 466 Build 3 Proof on `dev`, proceed to **Release 466 Build 4 — External Acceptance & Commercial Readiness, items 16–20**:

16. CAIP private-media authenticated browser/range-streaming acceptance.
17. Stripe Development payment/webhook/refund/reconciliation/idempotency acceptance.
18. PayPal sandbox payment/webhook/refund/reconciliation/idempotency acceptance.
19. Social/OAuth connect/refresh/expiry/revoke/outage/reconnect acceptance with publication still closed.
20. Production-launch readiness cockpit combining source, recovery, providers, SEO, performance and incident evidence.

Build 4 acceptance does not authorize live Production charging/publication or Release 466 Production promotion. Do not touch `main` until a later deliberate Production promotion is explicitly requested.

## Canonical reading order

1. `development-release.json`
2. `release466-build3-revenue-business-intelligence.json`
3. `docs/operations/RELEASE_466_FOUR_BUILD_ROADMAP.md`
4. `AI_HANDOFF.md`
5. `PROJECT_STATUS_AND_ROADMAP.md`
6. `SANITY_HEALTH_CHECK.md`
7. `release466-build2-runtime-storefront-intelligence.json`
8. `release466-build1-governance-recovery-reliability.json`
9. `.github/RELEASE466_BRANCH_PROTECTION_POLICY.md`
10. `release463-environment.json`

Release 465 files remain immutable historical acceptance authorities and must continue to pass their append-safe gates.
