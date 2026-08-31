# Devil n Dove — AI Handoff

## Current authority

**Release 465 — Business Intelligence and Release Hardening — is current. Builds 1 and 2 are Development green.** Release 464 remains the completed prior application release. Release 463 remains the environment authority: one Cloudflare Pages project (`devilndove-site`), `dev` → Preview/Development and `main` → Production/Live. Release 461 is historical D1 provenance only and is never replayed because a chat, workstation, branch or deployment changes.

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

## Release 464 inherited green baseline

Release 464 Updates 1–3 remain closed and Development green. They established canonical forward migrations, request-time D1 schema firewall, operational recovery/retention, Access-safe Preview smoke, accessibility, Storefront merchandising, Product SEO/structured data, read-only genealogy, Month-End Cockpit, Creative business pipeline, and I.T. Operations Dashboard. Do not reopen them unless a current gate proves drift.

## Release 465 Build 1 — Development green

Items 1–7 are complete: Storefront merchandising simulation; Product readiness/completeness; fail-closed publication readiness; SEO quality cockpit; internal-link intelligence; Product image-quality visibility; and Storefront typo recovery.

Final Build 1 restart checkpoint recorded previously: `c2728be72b9c416536252e7cdbdaf39d1226a095`, System Gate `33429507939`, Preview `https://99705dfc.devilndove-site.pages.dev`, D1 `583` tables / `4` migrations / `4` proofs / `4` Release 465 triggers / `0` FK violations.

## Release 465 Build 2 — Inventory & Creator Intelligence — Development green

Items 8–13 are complete:

8. **Related-product intelligence** — explainable relationship reasons only; no relationship rows are written automatically.
9. **Inventory availability intelligence** — reports available-now / can-make / limited / unavailable from existing Product resources, on-hand stock and lot authority without consuming Inventory.
10. **Material shortage forecasting** — scenario-based forecast from Product resource recipes, purchase lots, on-hand quantities and operator-entered planned units. Scenario quantity is never claimed to be an actual production order.
11. **Genealogy exception cockpit** — identifies real forward-provenance gaps while keeping legitimate pre-cutover opening-stock boundaries separate; historical genealogy is never fabricated.
12. **Creative readiness score** — combines Product linkage, materials/cost coverage, reviewed CAIP evidence, governance and Content Studio readiness using existing authorities.
13. **Next Safe Action engine** — explains the next safe step and blockers; it never executes providers, publishes, consumes Inventory, posts production, or posts Accounting.

### First Build 2 technical-green evidence

- source SHA: `658613a9775c248e959c04113ea138e85d32bac1`
- System Gate: `33431890551`
- source-gate job: `99618968755` — PASS
- deploy-development job: `99619087413` — PASS
- exact Preview: `https://def3bd0b.devilndove-site.pages.dev`
- proof artifact: `9772962684`
- D1: `583` tables / `4` native migration rows / `4` proof rows / `4` Release 465 triggers / `18` required Build 2 authority tables / `0` FK violations
- migration result: `No migrations to apply!`
- Build 2 schema change: **NONE**
- Preview mode: `CLOUDFLARE_ACCESS_PROTECTED`
- smoke auth headers: `0`
- Cloudflare Access weakened: **NO**
- provider execution/publication: **ZERO**
- Inventory mutation / production posting / Accounting posting: **ZERO**
- Production mutation: **ZERO**
- raw CAIP R2 delete: **ZERO**

The final Build 2 restart checkpoint is the current `dev` head only after its final idempotent System Gate succeeds. The closure commit intentionally does not self-embed a future SHA or workflow-run ID.

## Canonical D1 stream

Development remains exactly:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

Build 2 is intentionally schema-neutral. Missing future schema must be repaired with a new numbered migration; request-time DDL remains forbidden.

## Permanent promotion/provider rules

Production promotion remains exact green Development tree only: Development migration/proof → exact Dev Preview proof → same tree on `main` → Production migration/proof → dependent Production deployment. Main-only application patches are forbidden. Native Git-triggered Pages deployments remain frozen.

Stripe/PayPal/provider execution and publication remain closed unless a deliberate test/live authorization explicitly opens them. Configuration presence alone never authorizes transactions or publication. Raw CAIP R2 deletion remains closed. Cloudflare Access must never be weakened to make Preview smoke pass.

## Next bounded work

After the Build 2 closure SHA passes its final idempotent System Gate, proceed to **Release 465 Build 3 — Financial, I.T. & Release Hardening — items 14–20 only**. Do not reopen Builds 1 or 2 unless a current gate proves drift.

## Canonical reading order

1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `SANITY_HEALTH_CHECK.md`
5. `docs/operations/RELEASE_465_THREE_BUILD_ROADMAP.md`
6. `release465-build1-storefront-quality.json`
7. `release465-build2-inventory-creator-intelligence.json`
8. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
9. `release463-environment.json`

Older Build/Release material is provenance only and must not override these authorities.
