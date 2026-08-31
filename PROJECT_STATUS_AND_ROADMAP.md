# Devil n Dove — Project Status & Roadmap

## Current Development release

**Release 465 — Business Intelligence and Release Hardening — is current. Builds 1 and 2 are Development green.** Release 464 is the completed prior application release. Release 463 remains the environment/cutover authority: one Cloudflare Pages project (`devilndove-site`), `dev` → Preview/Development and `main` → Production/Live, with isolated D1/R2 resources.

## Three-build plan

| Build | Items | Theme | State |
|---|---:|---|---|
| Build 1 | 1–7 | Storefront & SEO Quality | Complete / Development green |
| Build 2 | 8–13 | Inventory & Creator Intelligence | Complete / Development green |
| Build 3 | 14–20 | Financial, I.T. & Release Hardening | Next bounded work after final Build 2 closure gate |

## Build 1 — items 1–7

1. Storefront merchandising simulator.
2. Product readiness/completeness intelligence.
3. Fail-closed Product publication readiness.
4. SEO quality cockpit.
5. Internal-link intelligence.
6. Product image-quality visibility.
7. Storefront typo recovery.

Build 1 final checkpoint: `c2728be72b9c416536252e7cdbdaf39d1226a095`, System Gate `33429507939`, Preview `https://99705dfc.devilndove-site.pages.dev`.

## Build 2 — items 8–13

8. Related-product intelligence with explainable reasons and no automatic relationship writes.
9. Inventory availability intelligence: available-now / can-make / limited / unavailable without stock consumption.
10. Scenario-based material-shortage forecasting from existing recipes, purchase lots, on-hand quantities and operator-entered units.
11. Genealogy exception cockpit over existing lot → production → finished-lot → sale provenance, without historical reconstruction.
12. Creative readiness scoring across materials/cost coverage, reviewed evidence, Product linkage, Content Studio and governance.
13. Pipeline Next Safe Action intelligence that explains blockers without executing providers, Inventory mutations, production posting or Accounting posting.

### Build 2 technical-green evidence

- source SHA: `658613a9775c248e959c04113ea138e85d32bac1`
- System Gate: `33431890551`
- source job: `99618968755` — PASS
- deploy job: `99619087413` — PASS
- exact Preview: `https://def3bd0b.devilndove-site.pages.dev`
- proof artifact: `9772962684`
- D1: `583` tables / `4` native migrations / `4` proofs / `4` Release 465 triggers / `18` Build 2 authority tables / `0` FK violations
- migration result: no pending migration; Build 2 schema change = NONE
- Access-safe smoke: PASS / zero auth headers / Access not weakened
- provider execution/publication, Inventory mutation, Accounting posting, Production mutation and raw CAIP R2 delete: ZERO

The final Build 2 restart checkpoint is resolved from the current `dev` head after the final idempotent closure System Gate; it is not self-embedded in the closure commit.

## Database authority

Release 461 remains historical verified baseline only and is not replayed. The canonical forward stream proven on Development remains exactly:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

Build 2 introduced no new D1 migration. Permanent order remains **Dev migration/proof → exact green Dev tree → Production migration/proof → dependent Production code**. Production business/transactional data remains Production-owned and is never overwritten wholesale from Development.

## Build 3 — next bounded work, items 14–20

14. Cost/profitability intelligence using existing material cost, packaging/labour assumptions and fee models.
15. Read-only Financial anomaly detection for duplicate/unmatched/unusual accounting evidence.
16. Month-end readiness score over the existing close/HST/evidence authority.
17. I.T. health score spanning D1, R2, migrations, deployments, API incidents, SEO and provider configuration boundaries.
18. Regression-evidence archive for compact release-to-release comparison.
19. Performance-budget gate for excessive asset/page/runtime growth.
20. Release 465 autonomous acceptance framework and final canonical convergence.

Build 3 must start only from the final green Build 2 closure head.

## Release gates

A build is Development green only when the same `dev` tree has canonical source gates, migration policy/firewall, build-specific gates, SEO/accessibility where applicable, Development D1 apply/proof, exact Preview deployment/control-plane binding proof and Access-safe non-secret smoke all passing.

Production is a separate deliberate promotion boundary and is not required to call a Development build green.

## Deliberately separate future acceptance

Stripe Development test acceptance, PayPal sandbox acceptance, CAIP private-media browser/range-streaming evidence, Social/OAuth controlled acceptance, live provider authorization, and deliberate Production promotion remain separate operator/provider boundaries. Credentials never imply execution authorization.
