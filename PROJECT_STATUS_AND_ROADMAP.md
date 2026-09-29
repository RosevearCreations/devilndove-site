# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Build 299 — D1 Query Efficiency + Canonical Runtime/Repository Cleanup** is active in Development.

Build 298 is the exact Development and Production GREEN baseline. Build 299 reduces D1 schema-read fan-out, removes selected redundant public schema preflights, keeps workstation memberships batched, measures query plans/rows-read against Development only, and removes only exact duplicate root API copies with canonical `functions/api/` ownership retained.

- Exact Build 298 Development: `2fae62c9b5f78e31d8325bd63d93c1674a11c3c6`
- Exact Build 298 Production main: `5da8e2457ec64a9a54523bd56eb523c9abd5ec8c`
- Shared predecessor tree: `396b3491620307b041cda8ac066f97ea44f2b0ef`
- Build 299 schema change: **NONE**
- Development D1 measurement: **READ ONLY**
- Production D1 measurement contact: **NONE**
- Historical release evidence deletion: **NONE**
- Next after Production GREEN: **Build 300 — CAIP Maker Content Outcomes Renewal & Automation Refinement**

## Next production queue — Builds 290–300

The queue **has not run out** and is **ready to start**.

**Active: Build 295 — Storefront Buyer Journey Simplification**

1. Build 290 — Inventory Multi-Station Read Integrity & Client-Native Memberships — **PRODUCTION GREEN**
2. Build 291 — Public Runtime Reliability & Broken-Surface Closure — **PRODUCTION GREEN**
3. Build 292 — Client Runtime Observer & Memory-Churn Hardening — **PRODUCTION GREEN**
4. Build 293 — CSS Design-System & Responsive Consolidation — **PRODUCTION GREEN**
5. Build 294 — CAIP Workshop Follies & Maker Story Foundation — **PRODUCTION GREEN**
6. Build 295 — Storefront Buyer Journey Simplification — **ACTIVE**
7. Build 297 — Search-First HTML, Product + Story SEO & Crawl Control
8. Build 298 — Merchant/Search Distribution + Public Content Discovery
9. Build 298 — Merchant/Search Distribution + Public Content Discovery
10. Build 299 — D1 Query Efficiency + Canonical Runtime/Repository Cleanup
11. Build 300 — CAIP Maker Content Outcomes Renewal & Automation Refinement

Canonical roadmap:
`docs/operations/RELEASE_467_UX_SEARCH_DATABASE_EFFICIENCY_BUILDS_290_300.md`

The sequence deliberately prioritizes Builds 290–293 as stabilization/refactoring. Build 294 extends the existing Creative Process → CAIP → Content Studio path for Workshop Follies/Maker Stories. Build 295 now exposes that work through a simpler customer journey without creating a parallel media, project, social-queue or publishing system.

## Permanent boundaries

Exact GREEN Development before protected-main promotion; Production-owned business data; forward-only canonical schema; no request-time DDL; no duplicate Product editor/readiness engine; no automatic publication/provider/payment/accounting action.

---

## Retained historical provenance — Release 467 Build 153

Build 153 — Layout Observer Performance Hotfix — remains closed GREEN historical provenance.

- Incident addressed: Firefox long-script / page responsiveness caused by excessive layout-observer churn.
- Historical Build 153 canonical migration prefix was `0001–0004`; later forward-only canonical migrations remain valid successors and preserve that immutable prefix.

## Retained historical provenance — Release 467 Build 171

Build 171 — Release & Restart Authority Convergence — remains immutable historical provenance.

## Retained historical provenance — Release 467 Builds 192–193

Builds 192–193 remain immutable historical release/restart provenance and do not supersede the current Release 467 authority.
