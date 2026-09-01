# Devil n Dove — Project Status & Roadmap

## Current release

**Release 466 — Operational Resilience and Commercial Readiness** is the current Development release. Builds 1 and 2 are Development green. Build 1 native GitHub ruleset application remains the only external repository-setting boundary pending. Release 465 remains fully Production green on `main` at `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`.

## Four-build plan

| Build | Items | Theme | State |
|---|---:|---|---|
| Build 1 | 1–5 | Governance, Recovery & Production Reliability | Development green / native GitHub ruleset external pending |
| Build 2 | 6–10 | Runtime & Storefront Intelligence | Development green |
| Build 3 | 11–15 | Revenue & Business Intelligence | Next |
| Build 4 | 16–20 | External Acceptance & Commercial Readiness | Planned |

## Build 1 — Governance, Recovery & Production Reliability

1. Native GitHub `dev`/`main` ruleset policy — in-repository fail-closed policy complete; native GitHub setting remains external/pending.
2. Production rollback readiness — forward-schema compatible, prior-deployment proof, no automatic rollback execution.
3. Disaster-recovery rehearsal — Development D1 export restored into ephemeral local SQLite, integrity/FK and application-table equality proven, raw data deleted afterward.
4. Development/Production structural drift detector — schema/trigger and canonical migration/proof identity only; Production business rows are not read.
5. Production reliability/SLO snapshot — current read-only health score across migration authority, FK integrity, D1/R2 bindings and runtime incidents.

Final Build 1 closure source: `3ac3e249f1dfd45bb7b9d20aeb2cdcb16f178a1e`.

- canonical System Gate `33464419372` — PASS
- Release 466 Build 1 Proof `33464419380` — PASS
- Production reliability: **100/100 GREEN**, open critical `0`, open error `0`, bindings proven, Production mutation ZERO

## Build 2 — Runtime & Storefront Intelligence

6. Synthetic storefront monitoring — read-only live Production GET monitor, `8` routes, GREEN, `0` warnings, `0` failures.
7. Production JavaScript/runtime error capture — bounded same-origin client collector and read-only admin intelligence over existing `runtime_incidents`.
8. Real-user performance telemetry — sampled LCP/INP/CLS/FCP/TTFB collection with p75 reporting; Release 465 source-size budget remains a separate comparison authority.
9. Full Production SEO crawler — public-only, read-only crawler with later optional promotion-failing mode.
10. Search Console/indexing intelligence — staged-import freshness, totals, striking-distance queries and low-CTR page analysis over existing authority tables.

Technical-green source: `68f1dae3a0b56de5b631603bf7191388a8f8f219`.

- canonical System Gate `33465451865` — PASS
- exact Development Preview `https://8a41ed9d.devilndove-site.pages.dev`
- Release 466 Build 2 Proof `33465451850` — PASS
- Build 2 proof artifact `9784701212`
- Development intelligence authority tables present; client-runtime/RUM/Search Console observed rows `0/0/0`
- synthetic Production monitor `8/8` healthy; Production mutation ZERO
- corrected Production SEO crawl `46` public HTML pages / `38` sitemap URLs / `6` errors / `8` warnings
- Preview remains Cloudflare Access protected; auth headers ZERO; Access weakened NO

The six live SEO errors are sitemap/noindex conflicts for `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`. They remain actionable intelligence and are not hidden by the Build 2 GREEN status.

Because Release 465 remains live Production, the Release 466 browser collector has not yet generated live client-error or RUM samples. Therefore observed row counts of zero are readiness evidence, not a claim of zero Production errors or perfect Core Web Vitals. Search Console rows are likewise currently zero because no current dataset has been imported; direct Google API authorization is not part of Build 2 closure.

Builds 1 and 2 introduce no D1 migration. Canonical migrations remain exactly `0001`–`0004` on both Development and Production.

## Production boundary

Release 466 has **not** been promoted. Production remains Release 465 at exact SHA `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`. Production business data remain Production-owned.

## Build 3 — Revenue & Business Intelligence — next

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
