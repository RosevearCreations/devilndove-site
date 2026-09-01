# Devil n Dove — Project Status & Roadmap

## Current release

**Release 466 — Operational Resilience and Commercial Readiness** is the current Development release. Build 1 is technically Development green; native GitHub ruleset application is the only external repository-setting boundary still pending. Release 465 remains fully Production green on `main` at `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`.

## Four-build plan

| Build | Items | Theme | State |
|---|---:|---|---|
| Build 1 | 1–5 | Governance, Recovery & Production Reliability | Development green / native GitHub ruleset external pending |
| Build 2 | 6–10 | Runtime & Storefront Intelligence | Planned |
| Build 3 | 11–15 | Revenue & Business Intelligence | Planned |
| Build 4 | 16–20 | External Acceptance & Commercial Readiness | Planned |

## Build 1 — Governance, Recovery & Production Reliability

1. Native GitHub `dev`/`main` ruleset policy — in-repository fail-closed policy complete; native GitHub setting remains external/pending.
2. Production rollback readiness — forward-schema compatible, prior-deployment proof, no automatic rollback execution.
3. Disaster-recovery rehearsal — Development D1 export restored into ephemeral local SQLite, integrity/FK and application-table equality proven, raw data deleted afterward.
4. Development/Production structural drift detector — schema/trigger and canonical migration/proof identity only; Production business rows are not read.
5. Production reliability/SLO snapshot — current read-only health score across migration authority, FK integrity, D1/R2 bindings and runtime incidents.

Technical-green source: `96c51f4f2f7ebeb8035b2d4db4c8c3aadf2ffe2c`.

- canonical System Gate `33463654502` — PASS
- Release 466 supplemental proof `33463654504` — PASS
- exact Development Preview `https://60d84da5.devilndove-site.pages.dev`
- Build 1 proof artifact `9784113538`
- Development D1: `583` total non-sqlite tables / `4` migrations / `4` proofs / `4` Release 465 guards / `11` Build 3 authorities / `0` FK
- recovery: `582/582` application tables excluding Cloudflare-reserved `_cf_%`, integrity `ok`, `0` FK, no raw dump retained
- structural drift: `603/603` identities; no missing/extra; migration/proof identities match
- Production reliability: **100/100 GREEN**, open critical `0`, open error `0`, bindings proven, Production mutation ZERO

Build 1 introduces no D1 migration. Canonical migrations remain exactly `0001`–`0004` on both Development and Production.

## Production boundary

Release 466 has **not** been promoted. Production remains Release 465 at exact SHA `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`. Production business data remain Production-owned.

## Build 2 — Runtime & Storefront Intelligence — next

6. Synthetic storefront monitoring.
7. Production JavaScript/runtime error capture.
8. Real-user performance telemetry versus the Release 465 performance budget.
9. Full Production SEO crawler.
10. Search Console/indexing intelligence.

## Build 3 — Revenue & Business Intelligence

11. Storefront conversion funnel analytics.
12. Zero-result/abandoned-search intelligence.
13. Explainable Product opportunity score.
14. Inventory reorder economics.
15. Creative-project priority engine — recommendation only.

## Build 4 — External Acceptance & Commercial Readiness

16. CAIP private-media browser/range-streaming acceptance.
17. Stripe Development acceptance.
18. PayPal sandbox acceptance.
19. Social/OAuth controlled acceptance.
20. Production-launch readiness cockpit.

## Permanent boundaries

Production data is never replaced wholesale from Development. Request-time DDL, schema reversal, automatic business-data restore, raw R2 deletion, provider execution/publication, automatic financial correction, and main-only application patches remain closed. Release 466 Production promotion requires a separate deliberate authorization after Development acceptance.
