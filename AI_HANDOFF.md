# Devil n Dove — AI Handoff

## Current authority

**Release 463 — single-project Development/Production operation is now the canonical model.**

**Release 462 application provenance remains closed and green; Release 463 supersedes its old two-project environment assumptions.**

The application is now operated from one Cloudflare Pages project:

- Cloudflare Pages project: `devilndove-site`
- `dev` branch → **Preview / Development**
- `main` branch → **Production / Live**
- public Production domain: `https://devilndove.com`
- native Git-triggered Pages deployments remain frozen; GitHub Actions deploys the exact approved SHA.

Release 463 Production cutover runtime proof passed on workflow run `33396235808`; proof artifact `9759432735` is retained for 90 days. The exact Production deployment proved the isolated Production D1 and both Production R2 bindings through the Cloudflare control plane and through authenticated runtime on the customer-facing domain.

The old `devilndove-site-dev` project and obsolete pre-cutover D1 databases are legacy cleanup only. They are not Development authority and must never be used for new application work.

## Environment boundary

### Development

- source branch: `dev`
- Pages project: `devilndove-site`
- Pages environment: Preview
- D1 binding `DB` → `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2 → `devilndove-toolshed-images-dev`
- CAIP R2 → `devilndove-caip-media-dev`

### Production

- source branch: `main`
- Pages project: `devilndove-site`
- Pages environment: Production
- live domain: `https://devilndove.com`
- D1 binding `DB` → `devilndove-prod-r462` (`f34a741b-0000-45b0-9a96-6be08754d563`)
- Product R2 → `devilndove-toolshed-images`
- CAIP R2 → `devilndove-caip-media`

Development and Production code should differ only because `dev` contains work not yet promoted. We do **not** maintain main-only application/config patches. Production bindings are generated ephemerally by the Production deployment workflow.

## Database authority — live-system rule

Production is now a real data authority. From Release 463 forward:

1. **Production business/transactional data is Production-owned.** Never overwrite the live D1 from a Development clone or routine promotion.
2. **Schema changes are migration-owned.** No request-time `CREATE`, `ALTER`, `DROP`, repair DDL, or opportunistic schema mutation is allowed.
3. A schema change is developed as a versioned SQL migration in the repository, applied and verified on Development D1 first, then the **same migration** is applied to Production D1 as part of the `main` promotion gate.
4. Production code must not be deployed if its required D1 migration has not successfully applied and passed post-migration verification on the live Production D1.
5. Historical Release 461/463 baseline migrations are not replayed just because a chat, workstation, deployment, or branch changes.
6. Data/config seeding must be explicit and narrowly scoped. Production transactional rows are never refreshed wholesale from Development.
7. Every future D1 migration needs a rollback/recovery note or a documented forward-only recovery path before Production apply.

This is the upgrade model: **Dev feature + Dev migration + Dev proof → exact SHA promotion → Production migration + Production proof → Production app deployment + live runtime acceptance.**

## Release workflow

Normal development:

1. Work on `dev`.
2. Keep changes modular and backwards-compatible where practical.
3. If D1 changes, add a versioned migration; never hide schema creation/repair in request handlers.
4. System Gate passes.
5. Exact `dev` SHA deploys to `devilndove-site` Preview using Development D1/R2.
6. Verify Development runtime.

Promotion:

1. Promote the exact approved Development tree to `main`.
2. Apply any new approved migration to the isolated Production D1 before code that requires it goes live.
3. Prove Production D1 integrity/required objects/foreign keys.
4. Deploy exact `main` SHA to `devilndove-site` Production with Production D1/R2 bindings.
5. Verify Cloudflare control-plane binding identity and authenticated runtime through `devilndove.com`.
6. Preserve release evidence.

The intended cadence is ordinary work on `dev` and a deliberate `dev` → `main` promotion approximately once per day when Development is green; never a blind scheduled overwrite.

## Current application priorities

Continue application work without reopening the environment migration. The next confirmed runtime-schema offender remains:

`functions/api/admin/_accountingStatementImports.js`

It owns statement-import tables/rows, reconciliation exceptions, indexes, and request-time exception-column repair logic. Convert that bounded Accounting slice to migration-owned/fail-closed behavior, then continue the fresh admin/shared scan.

Canonical modules remain:

- Storefront
- Creators
- Socials / CAIP
- Financials / Accounting
- I.T.

Public work must continue to preserve SEO requirements, including one exposed H1 per public page.

## Provider boundary

Stripe/PayPal/provider execution remains a deliberate test/live-authorization boundary. Environment consolidation does not authorize provider transactions by itself.

## Canonical reading order

1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `SANITY_HEALTH_CHECK.md`
5. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
6. `release463-environment.json`

Older Release/Build material is provenance only and must not override this authority.
