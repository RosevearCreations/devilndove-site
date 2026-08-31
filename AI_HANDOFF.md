# Devil n Dove — AI Handoff

## Current authority

**Release 465 — Business Intelligence and Release Hardening — Builds 1, 2 and 3 are Development green.** Release 464 is the completed prior application release. Release 463 remains the environment authority: one Cloudflare Pages project (`devilndove-site`), `dev` → Preview/Development and `main` → Production/Live. Release 461 is historical D1 provenance only and is never replayed because a chat, workstation, branch or deployment changes.

## Environment boundary

### Development
- branch: `dev`
- Pages: `devilndove-site` / Preview
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`

### Production
- branch: `main`
- Pages: `devilndove-site` / Production
- live domain: `https://devilndove.com`
- D1: `devilndove-prod-r462` (`f34a741b-0000-45b0-9a96-6be08754d563`)
- Product R2: `devilndove-toolshed-images`
- CAIP R2: `devilndove-caip-media`

Production business/transactional data is Production-owned. Never refresh or overwrite it wholesale from Development.

## Release 465 completed Development scope

### Build 1 — items 1–7 — Development green
Storefront merchandising simulation, Product readiness/completeness, fail-closed publication readiness, SEO quality cockpit, internal-link intelligence, Product image-quality visibility and Storefront typo recovery.

Final Build 1 checkpoint: `c2728be72b9c416536252e7cdbdaf39d1226a095`, System Gate `33429507939`, Preview `https://99705dfc.devilndove-site.pages.dev`.

### Build 2 — items 8–13 — Development green
Related-product intelligence, Inventory availability, scenario material-shortage forecasting, genealogy exceptions, Creative readiness and explainable Next Safe Action. Build 2 is read-only intelligence over existing authorities and introduced no migration.

Final Build 2 checkpoint: `2fc2a17be77a170852b4e11e3c88d59e16928e7b`, System Gate `33432641781`, Preview `https://6c476c17.devilndove-site.pages.dev`, proof artifact `9773238824`.

### Build 3 — items 14–20 — Development green
14. **Cost/profitability intelligence** — existing Creative Project cost, time/labour rate, packaging, overhead, fee, shipping and revenue authority; estimated content value is separate from storefront revenue margin.
15. **Financial anomaly detection** — read-only duplicate-payment, over-application, evidence-gap, tax-variance, outstanding-balance and locked-period checks.
16. **Month-end readiness score** — weighted read-only score over the existing Accounting close, HST/GST, evidence and accountant-export authority.
17. **I.T. health score** — D1 migration/proof count, Release 465 triggers, five-module authority, FK integrity, D1/R2 bindings and runtime incident posture. Expected canonical migrations are correctly `4`.
18. **Regression-evidence archive** — canonical System Gate emits machine-readable release evidence.
19. **Performance budget** — fail-closed runtime-source limits. Measured baseline: `874` runtime source files / `9,863,687` bytes / `567,271` inline data-URI estimate; inline budget is `650,000` bytes.
20. **Release 465 autonomous acceptance framework** — same-tree source, D1, Preview, binding, smoke, evidence and closure proof.

### First Build 3 technical-green evidence

- source SHA: `c0cf58ca79f1c4d3ac2844f49c143f16a1bc5f13`
- System Gate: `33447135123`
- source job: `99668632173` — PASS
- deploy job: `99668701612` — PASS
- exact Preview: `https://27bb1bcc.devilndove-site.pages.dev`
- D1: `583` tables / `4` native migrations / `4` proofs / `4` Release 465 triggers / `11` Build 3 required authority tables / `0` FK violations
- migration result: `No migrations to apply!` / `newly_applied: []`
- deploy-proof artifact: `9778464644`
- regression-evidence artifact: `9778465208`
- artifact retention: repository maximum `90` days
- Preview mode: `CLOUDFLARE_ACCESS_PROTECTED`
- smoke authentication headers: `ZERO`
- Cloudflare Access weakened: **NO**
- provider execution/publication: **ZERO**
- Inventory mutation / production posting / Accounting posting: **ZERO**
- automatic financial correction / price changes: **ZERO**
- Production mutation / raw CAIP R2 delete: **ZERO**

## Canonical D1 stream

Development remains exactly:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

Builds 2 and 3 are schema-neutral. Any future schema change requires the next numbered migration. Request-time DDL remains forbidden.

## Final Release 465 closure rule

The documented closure tree must pass the same canonical System Gate idempotently: no migrations to apply, 4 native rows / 4 proofs / 4 triggers / 11 Build 3 authorities / 0 FK violations, exact closure Preview, Development D1/R2 binding proof, Access-safe smoke and both proof/evidence artifacts. Git plus that successful run determines the authoritative final restart checkpoint; the closure commit does not self-embed a future SHA or run ID.

## Permanent promotion/provider rules

Production promotion remains exact green Development tree only: Development migration/proof → exact Dev Preview proof → same tree on `main` → Production migration/proof → dependent Production deployment. Main-only application patches are forbidden. Native Git-triggered Pages deployments remain frozen.

Stripe/PayPal/provider execution and publication remain closed unless a deliberate test/live authorization explicitly opens them. Configuration presence alone never authorizes transactions or publication. Raw CAIP R2 deletion remains closed. Cloudflare Access must never be weakened to make Preview smoke pass.

## Next work after final closure

Do not reopen Release 465 Builds 1–3 unless a current gate proves drift. External Stripe Development acceptance, PayPal sandbox acceptance, CAIP private-media browser/range-streaming evidence, Social/OAuth controlled acceptance and deliberate Production promotion remain separately bounded future work.

## Canonical reading order

1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `SANITY_HEALTH_CHECK.md`
5. `docs/operations/RELEASE_465_THREE_BUILD_ROADMAP.md`
6. `release465-build1-storefront-quality.json`
7. `release465-build2-inventory-creator-intelligence.json`
8. `release465-build3-financial-it-hardening.json`
9. `release465-performance-budget.json`
10. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
11. `release463-environment.json`

Older Build/Release material is provenance only and must not override these authorities.
