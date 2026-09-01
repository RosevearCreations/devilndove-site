# Devil n Dove — Project Status & Roadmap

## Current release

**Release 465 — Business Intelligence and Release Hardening — is complete and GREEN on Development and Production.** Release 463 remains the environment/cutover authority: one Cloudflare Pages project (`devilndove-site`), isolated Development and Production D1/R2 resources, `dev` → Preview and `main` → Production.

## Three-build plan

| Build | Items | Theme | State |
|---|---:|---|---|
| Build 1 | 1–7 | Storefront & SEO Quality | Complete / Development green |
| Build 2 | 8–13 | Inventory & Creator Intelligence | Complete / Development green |
| Build 3 | 14–20 | Financial, I.T. & Release Hardening | Complete / Development green |

## Build 1 — Storefront & SEO Quality — Development green

Storefront merchandising simulation, Product readiness/completeness, fail-closed Product publication readiness, SEO quality cockpit, internal-link intelligence, Product image-quality visibility and Storefront typo recovery.

## Build 2 — Inventory & Creator Intelligence

Related-product intelligence, Inventory availability, scenario material-shortage forecasting, genealogy exception review, Creative readiness scoring and Next Safe Action intelligence. No new D1 migration and no automatic relationship, Inventory, production, Accounting or provider execution.

## Build 3 — Financial, I.T. & Release Hardening

14. Cost/profitability intelligence over existing Creative cost/revenue authority.
15. Read-only Financial anomaly detection.
16. Month-end readiness scoring over existing close/HST/evidence/export authority.
17. I.T. health scoring across migrations/proofs, triggers, modules, FK integrity, D1/R2 and runtime incidents.
18. Machine-readable regression-evidence artifact from System Gate.
19. Fail-closed runtime-source performance budget.
20. Same-tree Release 465 acceptance and canonical convergence.

## Canonical database authority

The forward migration stream remains exactly:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

All four are applied and verified on both Development and Production. Both environments report `583` tables, `4` canonical migration rows, `4` proof rows, `4` Release 465 triggers and `0` FK violations. Builds 2 and 3 introduced no migration.

## Release 465 Production promotion

The first Production promotion used exact Development-green source `6f2bd42e99f8a92cc6f6aa3dad717fa6b9fc6677`.

- Development System Gate: `33457936115` — PASS
- Development exact Preview: `https://569e651b.devilndove-site.pages.dev`
- Production workflow: `33458134514` — PASS
- Production job: `99702372383` — PASS
- exact Production Pages deployment: `https://4b352cde.devilndove-site.pages.dev`
- Production proof artifact: `9782207262`
- Production D1: `583` tables / `4` migrations / `4` proofs / `4` Release 465 triggers / `11` Build 3 required authority tables / `0` FK violations
- business data preservation: PASS — `1` user, `45` products, `1041` inventory rows and `0` orders preserved across the migration
- live public smoke: home, shop, manifest and `/api/creations` all `200`
- Production D1/R2 control-plane bindings: PASS

Production transactional data remained Production-owned; no Development business-data replacement occurred.

## Forward roadmap

Release 465 should not be reopened unless a current gate proves drift. The next useful bounded work is external/runtime acceptance rather than another broad feature build:

- Stripe Development payment/webhook/refund/reconciliation acceptance.
- PayPal sandbox payment/webhook/refund/reconciliation acceptance.
- CAIP private-media browser/range-streaming/source-preservation acceptance.
- Social/OAuth controlled connect/revoke/error acceptance.
- Native GitHub branch/ruleset protection for `dev` and `main`.

Provider credentials/configuration never imply execution authorization.
