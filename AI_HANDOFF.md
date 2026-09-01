# Devil n Dove — AI Handoff

## Current authority

**Release 466 — Operational Resilience and Commercial Readiness — Build 2 is Development green.** Build 1 remains Development green with one external repository-governance boundary: native GitHub `dev`/`main` ruleset application remains pending because the connected GitHub integration can read rulesets but cannot write them.

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

## Release 466 Build 2 technical-green evidence

Technical-green source SHA: `68f1dae3a0b56de5b631603bf7191388a8f8f219`.

Canonical System Gate:
- run `33465451865`
- source job `99724237977`
- deploy-development job `99724289502`
- exact Preview `https://8a41ed9d.devilndove-site.pages.dev`
- Development D1: `583` total non-sqlite tables / `4` canonical migrations / `4` proofs / `4` Release 465 guards / `11` inherited Build 3 authorities / `0` FK violations
- `No migrations to apply!`
- Access-safe Preview smoke passed; auth headers ZERO; Access weakened NO.

Release 466 Build 2 Proof:
- run `33465451850`
- source-proof job `99724237928`
- runtime-proof job `99724276899`
- artifact `9784701212`
- artifact SHA-256 `3c46694f1675a19d237475b4207224a8c834820b62db27cb1a0e3f873b91b63e`
- Development intelligence tables present: `runtime_incidents`, `search_console_import_batches`, `search_console_page_queries`
- observed rows: client runtime `0`, RUM `0`, Search Console `0`
- live Production synthetic monitor: `8` routes / GREEN / `0` warnings / `0` failures / GET only
- corrected Production SEO crawl: `46` public HTML pages / `38` sitemap URLs / `6` errors / `8` warnings / Production mutation ZERO

The six current live SEO errors are sitemap/noindex conflicts on:
- `/cart/`
- `/checkout/`
- `/checkout/confirmation/`
- `/supplies/health/`
- `/tools/health/`
- `/toolshed/duplicates/`

These findings are retained as intelligence. Build 2 does not modify Release 465 Production to make the Development proof pass.

## Build 2 status

6. Synthetic storefront monitoring — **Development green**. Read-only Production GET monitor.
7. Production JavaScript/runtime error capture — **Development green**. Collector and I.T. aggregation are ready in Release 466 Development.
8. Real-user performance telemetry — **Development green**. LCP/INP/CLS/FCP/TTFB field collection and p75 aggregation are ready; source-size budget and field metrics remain separate authorities.
9. Full Production SEO crawler — **Development green**. Public-only crawler produces retained live evidence and can later be made promotion-failing with `--fail-on-seo-errors`.
10. Search Console/indexing intelligence — **Development green**. Staged-import and analysis layer is ready; no current imported dataset is claimed and direct Google API authorization is not configured or required for this closure.

The `0` client-runtime and RUM rows are **not** evidence that live Production has zero errors or perfect Web Vitals. Release 465 is still the live code, so the Release 466 client collector is not expected to create live field samples until deliberate Production promotion. Likewise, `0` Search Console rows means no current imported dataset is present, not that search traffic is zero.

Build 2 is schema-neutral. Canonical migrations remain exactly `0001`–`0004`.

## Permanent safety rules

- Exact green Development tree only may move to `main`.
- Main-only application patches are forbidden.
- Production transactional data are never overwritten from Development.
- Request-time schema DDL remains forbidden.
- Schema migrations are forward-only; rollback does not automatically reverse schema.
- Business-data restore is never automatic.
- Native Git-triggered Cloudflare Pages deployment remains frozen.
- Provider execution/publication remain closed unless separately authorized.
- Raw CAIP R2 deletion remains closed.
- Cloudflare Access is never weakened for Preview smoke.

## Next bounded work

After the final Build 2 closure tree re-passes the canonical System Gate and Release 466 Build 2 Proof on `dev`, proceed to **Release 466 Build 3 — Revenue & Business Intelligence, items 11–15**:

11. Storefront conversion-funnel analytics.
12. Zero-result and abandoned-search intelligence.
13. Explainable Product opportunity score.
14. Inventory reorder economics.
15. Creative-project priority engine — recommendation only.

Do not touch `main` for Release 466 until a later deliberate Production promotion is explicitly requested.

## Canonical reading order

1. `development-release.json`
2. `release466-build2-runtime-storefront-intelligence.json`
3. `docs/operations/RELEASE_466_FOUR_BUILD_ROADMAP.md`
4. `AI_HANDOFF.md`
5. `PROJECT_STATUS_AND_ROADMAP.md`
6. `SANITY_HEALTH_CHECK.md`
7. `release466-build1-governance-recovery-reliability.json`
8. `.github/RELEASE466_BRANCH_PROTECTION_POLICY.md`
9. `release463-environment.json`

Release 465 files remain immutable historical acceptance authorities and must continue to pass their append-safe gates.
