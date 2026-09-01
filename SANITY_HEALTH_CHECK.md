# Devil n Dove — Sanity / Health Check

## Current release

**Release 466 — Operational Resilience and Commercial Readiness — Builds 1 and 2 are Development green.** Build 1 native GitHub ruleset application remains externally pending. Release 465 remains Production green and unchanged on `main`.

## Environment boundaries

- [x] `dev` → `devilndove-site` Preview/Development.
- [x] Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product/CAIP R2 remain isolated Development buckets.
- [x] `main` remains Release 465 at `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`.
- [x] Production D1/R2 remain isolated Production authorities.
- [x] Production business/transactional data remain Production-owned.
- [x] Request-time schema mutation, raw R2 deletion and provider execution/publication remain closed.
- [x] Cloudflare Access is not weakened for Preview acceptance.

## Canonical D1 authority

- [x] Canonical stream remains exactly `0001`–`0004`.
- [x] Release 466 Builds 1 and 2 introduced no migration `0005`.
- [x] Corrected Build 2 exact-SHA System Gate reported `No migrations to apply!`.
- [x] Development: `583` total non-sqlite tables / `4` migrations / `4` proofs / `4` Release 465 guards / `11` inherited Build 3 authorities / `0` FK violations.
- [x] Production: canonical `0001`–`0004` remain applied/proven from Release 465.

## Release 466 Build 1 closure

- [x] Final closure source SHA `3ac3e249f1dfd45bb7b9d20aeb2cdcb16f178a1e`.
- [x] Canonical System Gate `33464419372` passed.
- [x] Supplemental Build 1 Proof `33464419380` passed.
- [x] Rollback readiness, disaster recovery, structural drift and current Production reliability evidence remain green.
- [ ] Native GitHub `dev`/`main` ruleset application remains an external repository-setting action; in-repository controls are green.

## Release 466 Build 2 proof

- [x] Technical-green source SHA `68f1dae3a0b56de5b631603bf7191388a8f8f219`.
- [x] Canonical System Gate `33465451865` passed.
- [x] Exact Preview `https://8a41ed9d.devilndove-site.pages.dev` passed bindings and Access-safe smoke.
- [x] Release 466 Build 2 Proof `33465451850` passed.
- [x] Proof artifact `9784701212` retained with SHA-256 `3c46694f1675a19d237475b4207224a8c834820b62db27cb1a0e3f873b91b63e`.
- [x] Development intelligence tables `runtime_incidents`, `search_console_import_batches` and `search_console_page_queries` exist.
- [x] Synthetic storefront monitor checked `8` live Production routes: GREEN, `0` warnings, `0` failures, GET only.
- [x] Full Production SEO crawl is public-only and read-only: `46` HTML pages, `38` sitemap URLs, `6` errors, `8` warnings.
- [x] Crawler normalizes `index.html` aliases and excludes `/admin/`, `/api/` and `/cdn-cgi/` from public SEO scoring.
- [x] Production mutation by Build 2 monitoring/crawler: ZERO.
- [x] Preview authentication headers used: ZERO; Cloudflare Access weakened: NO.

## Item status

- [ ] Item 1 native GitHub `dev`/`main` ruleset application — **external repository setting pending**. In-repository policy and equivalent fail-closed controls are green.
- [x] Item 2 rollback readiness — Development green, execution disabled.
- [x] Item 3 disaster-recovery rehearsal — Development green.
- [x] Item 4 structural drift detector — Development green.
- [x] Item 5 Production reliability/SLO snapshot — Development green.
- [x] Item 6 synthetic storefront monitoring — Development green.
- [x] Item 7 JavaScript/runtime error capture — Development green collector/aggregation authority.
- [x] Item 8 real-user performance telemetry — Development green collector/p75 authority.
- [x] Item 9 full Production SEO crawler — Development green, live findings retained.
- [x] Item 10 Search Console/indexing intelligence — Development green staged-import/analysis authority.

## Current intelligence findings and interpretation

- [ ] Live Release 465 sitemap/noindex conflicts remain for `/cart/`, `/checkout/`, `/checkout/confirmation/`, `/supplies/health/`, `/tools/health/` and `/toolshed/duplicates/`.
- [x] Current Development-observed client-runtime rows: `0`. This is **not** a claim of zero live Production errors; Release 466 telemetry is not yet live on Production.
- [x] Current Development-observed RUM rows: `0`. This is **not** a claim of perfect live Core Web Vitals; field collection begins after deliberate Release 466 Production promotion.
- [x] Current Search Console rows: `0`. This means no current imported dataset is present; it does not mean search traffic is zero.
- [x] Direct Google Search Console API authorization was neither required nor used for Build 2 closure.

## Remaining amber boundaries

- [ ] Native GitHub ruleset application.
- [ ] Six current Production sitemap/noindex conflicts retained by Build 2 intelligence.
- [ ] Release 466 Builds 3–4.
- [ ] Stripe Development, PayPal sandbox, CAIP private-media and Social/OAuth acceptance remain deliberately deferred to Build 4.
- [ ] Release 466 Production promotion is not authorized.

## Current verdict

Release 466 Build 2 is technically **Development GREEN**. Build 1 native GitHub ruleset application remains the external governance action. Production remains safely on Release 465. After the final Build 2 closure tree re-passes the canonical System Gate and Build 2 Proof, the next bounded work is **Release 466 Build 3 — Revenue & Business Intelligence, items 11–15**.
