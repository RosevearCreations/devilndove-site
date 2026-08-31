# Devil n Dove — Project Status & Roadmap

## Current Development release

**Release 465 — Business Intelligence and Release Hardening — is current. Build 1 is Development green.** Release 464 is the completed prior application release. Release 463 remains the environment/cutover authority: one Cloudflare Pages project (`devilndove-site`), `dev` → Preview/Development and `main` → Production/Live, with isolated D1/R2 resources.

## Three-build plan

| Build | Items | Theme | State |
|---|---:|---|---|
| Build 1 | 1–7 | Storefront & SEO Quality | Complete / Development green |
| Build 2 | 8–13 | Inventory & Creator Intelligence | Next / not started |
| Build 3 | 14–20 | Financial, I.T. & Release Hardening | Planned after Build 2 green |

## Build 1 — items 1–7

1. Storefront merchandising simulator — read-only date/time projection over existing Storefront authority.
2. Product readiness/completeness intelligence — uses existing Product, SEO and media signals.
3. Fail-closed Product publication readiness — hard requirements are database-protected and non-overrideable.
4. SEO quality cockpit — read-only structured-data/Product/public-page diagnostics.
5. Internal-link intelligence — explainable suggestions only; no automatic rewriting.
6. Product image-quality visibility — existing image scoring/annotation/alt/context evidence.
7. Storefront typo recovery — suggestions over existing Products; no Product mutation.

## Database authority

Release 461 remains the historical verified baseline only and is not replayed. The canonical forward stream proven on Development is:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

Build 1 Development proof: **583 tables, 4 native migration ledger rows, 4 migration proof rows, 4 Release 465 publication triggers, 0 foreign-key violations.**

Permanent order: **Dev migration + Dev proof → exact green Dev tree → Production migration + Production proof → dependent Production code.** Production business/transactional data remains Production-owned and is never overwritten wholesale from Development.

## Exact first Build 1 Development-green evidence

- technical-green source SHA: `4359862e1d7a9d8dfc53841d0d25c6a219f134c3`
- System Gate: `33428268265`
- source-gate job: `99607087240` — PASS
- deploy-development job: `99607189007` — PASS
- exact Preview: `https://57cfbd12.devilndove-site.pages.dev`
- D1: `583` tables / `4` native migration rows / `4` proof rows / `4` Release 465 triggers / `0` FK violations
- migration manifest SHA-256: `d9a0f294765543e6f09696f54dfc58453d201fd4a6a84c1f11cd62e56ffa1642`
- proof artifact: `9771613193`
- Preview smoke: `CLOUDFLARE_ACCESS_PROTECTED` — PASS
- authentication headers used by smoke: `ZERO`
- Cloudflare Access weakened: `NO`
- provider execution/publication: `ZERO`
- Production mutation: `ZERO`

## Build 2 — next bounded work, items 8–13

8. Related-product intelligence with explainable reasons.
9. Inventory availability intelligence: can-make / limited / unavailable without consuming stock.
10. Material-shortage forecasting from existing recipes, lots, on-hand quantities and planned work.
11. Genealogy exception cockpit over the existing lot/production/finished-lot/sale authority.
12. Creative project readiness score across materials, cost, evidence, Product linkage and content readiness.
13. Pipeline Next Action engine that explains blockers and the next safe step without executing providers, Inventory mutations or Accounting posting.

Build 2 must start from the final Build 1 documentation-closure SHA after its idempotent System Gate succeeds.

## Build 3 — planned only, items 14–20

Build 3 remains closed until Build 2 is Development green. It covers cost/profitability intelligence, Financial anomaly detection, month-end readiness, I.T. health, regression evidence, performance budgets, and Release 465 final acceptance.

## Release gates

A build is Development green only when the same `dev` tree has canonical source gates, migration policy/firewall, build-specific gates, SEO/accessibility where applicable, Development D1 apply/proof, exact Preview deployment/control-plane binding proof and Access-safe non-secret smoke all passing.

Production is a separate deliberate promotion boundary and is not required to call a Development build green.

## Deliberately separate future acceptance

Stripe Development test acceptance, PayPal sandbox acceptance, CAIP private-media browser/range-streaming evidence, Social/OAuth controlled acceptance, live provider authorization, and deliberate Production promotion remain separate operator/provider boundaries. Credentials never imply execution authorization.
