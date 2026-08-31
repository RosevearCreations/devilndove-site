# Devil n Dove — AI Handoff

## Current authority

**Release 464 — Platform Integrity and Migration Authority — is the current application release, and Updates 1–3 are Development green.**

Release 463 remains the environment authority: one Cloudflare Pages project, `devilndove-site`; `dev` deploys to Preview/Development and `main` deploys to Production/Live. Release 461 is historical D1 baseline provenance only and is never replayed because a chat, workstation, branch or deployment changes.

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

## Release 464 Update 1 — Development green

Items 1–7 established the canonical forward D1 migration stream, fail-closed source/deploy controls, exact green-Development-tree Production promotion rule, legacy authority cleanup, canonical documentation, Accounting statement-import fail-closed migration ownership, and the application-wide request-time schema-mutation blockade.

Forward migrations live only in `migrations/canonical/`. Cloudflare native `d1_migrations` is paired with `app_schema_migration_proofs`. Historical migrations are provenance only. Missing schema is repaired by a new repository migration, never request-time DDL.

## Release 464 Update 2 — Development green

Items 8–13 added operational thresholds/Today Needs Attention, archive + explicit approval before retention deletion, read-only orphan-storage diagnostics, audited allowlisted HEAD recovery probes, Access-safe non-secret Preview smoke, and keyboard/focus/caption/screen-reader acceptance.

Cloudflare Access is not weakened for smoke testing. The smoke sends zero authentication/service-token headers. Provider execution and raw R2 deletion remain closed.

## Release 464 Update 3 — Development green

Items 14–20 are complete:

14. **Storefront product experience** — customer product links use the real `/shop/product/?slug=<slug>` authority and retain one source H1.
15. **Public SEO depth** — Product + Offer + BreadcrumbList structured data, dynamic canonical/social metadata, related Collection links, and existing public SEO gates are carried together.
16. **Storefront merchandising** — reusable scheduled include/exclude rules with priorities and start/end windows are evaluated at read time; campaigns do not rewrite Product rows.
17. **Inventory material genealogy** — a GET-only trace exposes existing Build 440 purchase-lot → production-run material allocation → finished lot → order/sale provenance. No parallel stock ledger or historical reconstruction was introduced.
18. **Financials Month-End Cockpit** — a read-only executive view summarizes the existing accounting close/HST/evidence/export authority. Accounting mutation remains in the existing Accounting workspace.
19. **Creators + CAIP + Storefront pipeline** — `creative_business_pipelines` and event history connect existing Product/creative/content/Collection/accounting references and state without posting accounting, decrementing Inventory, publishing content, executing providers, or deleting R2.
20. **I.T. Operations Dashboard** — current release/environment/migration/provider/business-growth state is exposed as the Release 464 control centre without secrets or provider execution.

Canonical migration `0003_release464_business_growth.sql` owns only the new scheduled-merchandising and cross-module pipeline tables. Existing Product, Inventory, Accounting and CAIP tables remain their domain authorities.

### Exact first Update 3 Development-green evidence

- source SHA: `0edab02e5506dc74a37ad7e2ef03fbeb52b02398`
- System Gate: `33422881509`
- source-gate job: `99589311686` — PASS
- deploy-development job: `99589416714` — PASS
- exact Preview: `https://b6ac8e5a.devilndove-site.pages.dev`
- Development D1: `583` tables
- native canonical migration rows: `3`
- migration proof rows: `3`
- foreign-key violations: `0`
- manifest SHA-256: `9a230eda68494c197e41b2f268c4539638921e4bbaf77004c81ab972eb2a8f76`
- proof artifact ID: `9769640976`
- Preview mode: `CLOUDFLARE_ACCESS_PROTECTED`
- smoke authentication headers: `0`
- Cloudflare Access weakened: **NO**
- provider execution invoked: **ZERO**
- Production mutation: **ZERO**

The managed migrator applied only `0003_release464_business_growth.sql`; immutable 0001/0002 identities were preserved. The documentation closure SHA must pass the same managed gate idempotently before becoming the final restart checkpoint.

## Permanent promotion/provider rules

Production promotion remains exact green Development tree only: Development migration/proof → exact Dev Preview proof → same tree on `main` → Production migration/proof → dependent Production deployment. Main-only application patches are forbidden. Native Git-triggered Pages deployments remain frozen.

Stripe/PayPal/provider execution and publication remain closed unless a later deliberate test/live authorization explicitly opens them. Configuration presence alone never authorizes transactions or publication.

## Next work

Do **not** reopen Release 464 Updates 1–3 unless a current gate proves drift. The next work should be chosen from deliberately separate external acceptance or a new bounded business roadmap: Stripe test acceptance, PayPal sandbox acceptance, CAIP private-media browser/range-streaming evidence, Social/OAuth controlled acceptance, or deliberate Production promotion.

## Canonical reading order

1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `SANITY_HEALTH_CHECK.md`
5. `docs/operations/RELEASE_464_THREE_UPDATE_ROADMAP.md`
6. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
7. `release463-environment.json`

Older Build/Release material is provenance only and must not override these authorities.
