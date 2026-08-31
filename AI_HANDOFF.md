# Devil n Dove — AI Handoff

## Current authority

**Release 465 — Business Intelligence and Release Hardening — is the current application release. Build 1 (items 1–7, Storefront & SEO Quality) is Development green.**

Release 464 is the completed prior application release. Release 463 remains the environment authority: one Cloudflare Pages project, `devilndove-site`; `dev` deploys to Preview/Development and `main` deploys to Production/Live. Release 461 is historical D1 baseline provenance only and is never replayed because a chat, workstation, branch or deployment changes.

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

Release 464 Updates 1–3 remain closed and Development green. They established the forward-only canonical migration stream, request-time D1 schema firewall, operational recovery/retention acceptance, Access-safe Preview smoke, accessibility gate, Storefront merchandising, Product SEO/structured data, read-only genealogy, Month-End Cockpit, Creative business pipeline, and I.T. Operations Dashboard.

Do not reopen Release 464 work unless a current gate proves drift.

## Release 465 Build 1 — Storefront & SEO Quality — Development green

Items 1–7 are complete:

1. **Storefront merchandising simulator** — evaluates existing Collection/rule/membership authority at a selected date/time without rewriting Product rows.
2. **Product readiness/completeness intelligence** — consolidates the existing Product, SEO, media and readiness signals rather than creating a parallel Product record.
3. **Fail-closed Product publication readiness** — canonical migration `0004_release465_storefront_quality.sql` adds four database triggers so hard commerce/SEO readiness cannot be bypassed. Soft quality override remains explicit, step-up protected and audited.
4. **SEO quality cockpit** — one read-only Storefront Quality control centre combines Product readiness, structured-data health and public SEO diagnostics.
5. **Internal-link intelligence** — explainable Product/Collection relationship suggestions only; content is not rewritten automatically.
6. **Product image-quality visibility** — exposes existing image annotation, merchandising score, alt coverage and contextual-shot signals.
7. **Storefront search quality / typo recovery** — suggests likely existing Products after zero-result searches without mutating Product data.

### Exact first Build 1 Development-green evidence

- technical-green source SHA: `4359862e1d7a9d8dfc53841d0d25c6a219f134c3`
- System Gate run: `33428268265`
- source-gate job: `99607087240` — PASS
- deploy-development job: `99607189007` — PASS
- exact Preview: `https://57cfbd12.devilndove-site.pages.dev`
- Development D1: `583` non-SQLite tables
- native canonical migration rows: `4`
- migration proof rows: `4`
- Release 465 publication triggers: `4`
- foreign-key violations: `0`
- migration manifest SHA-256: `d9a0f294765543e6f09696f54dfc58453d201fd4a6a84c1f11cd62e56ffa1642`
- proof artifact ID: `9771613193`
- Preview mode: `CLOUDFLARE_ACCESS_PROTECTED`
- smoke authentication headers: `0`
- Cloudflare Access weakened: **NO**
- provider execution/publication: **ZERO**
- Production mutation: **ZERO**
- raw CAIP R2 delete: **ZERO**

The first 0004 attempt stopped before ledger application with Cloudflare D1 `incomplete input`. The migration was still unapplied, so its trigger bodies were simplified before the successful Development apply. Once 0004 applied, its identity became immutable.

## Canonical D1 stream now proven on Development

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

Cloudflare native `d1_migrations` and `app_schema_migration_proofs` both report four rows. Missing future schema must be repaired with a new numbered migration; request-time DDL remains forbidden.

## Permanent promotion/provider rules

Production promotion remains exact green Development tree only: Development migration/proof → exact Dev Preview proof → same tree on `main` → Production migration/proof → dependent Production deployment. Main-only application patches are forbidden. Native Git-triggered Pages deployments remain frozen.

Stripe/PayPal/provider execution and publication remain closed unless a later deliberate test/live authorization explicitly opens them. Configuration presence alone never authorizes transactions or publication. Raw CAIP R2 deletion remains closed. Cloudflare Access must never be weakened to make Preview smoke pass.

## Next work

**Do not begin Build 3.** After this documentation closure SHA passes the final idempotent System Gate, the next bounded work is:

**Release 465 Build 2 — Inventory & Creator Intelligence — items 8–13 only.**

Build 2 must itself become Development green before Build 3 starts.

## Canonical reading order

1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `SANITY_HEALTH_CHECK.md`
5. `docs/operations/RELEASE_465_THREE_BUILD_ROADMAP.md`
6. `release465-build1-storefront-quality.json`
7. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
8. `release463-environment.json`

Older Build/Release material is provenance only and must not override these authorities.
