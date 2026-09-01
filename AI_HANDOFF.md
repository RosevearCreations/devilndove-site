# Devil n Dove — AI Handoff

## Current authority

**Release 465 — Business Intelligence and Release Hardening — is GREEN on both Development and Production.** Builds 1–3 are closed. Release 463 remains the environment authority: one Cloudflare Pages project (`devilndove-site`), `dev` → Preview/Development and `main` → Production/Live. Release 461 is historical D1 provenance only and is never replayed because a chat, workstation, branch or deployment changes.

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

## Release 465 scope

### Build 1 — items 1–7 — Development green
Storefront merchandising simulation, Product readiness/completeness, fail-closed publication readiness, SEO quality cockpit, internal-link intelligence, Product image-quality visibility and Storefront typo recovery.

### Build 2 — items 8–13 — Development green
Related-product intelligence, Inventory availability, scenario material-shortage forecasting, genealogy exceptions, Creative readiness and explainable Next Safe Action. Build 2 introduced no migration and remains read-only.

### Build 3 — Financial, I.T. & Release Hardening — Development green
14. Cost/profitability intelligence.
15. Read-only Financial anomaly detection.
16. Month-end readiness score.
17. I.T. health score.
18. Regression-evidence archive.
19. Fail-closed performance budget.
20. Release 465 same-tree acceptance framework.

Builds 2 and 3 are schema-neutral. The canonical migration stream remains exactly 0001–0004.

## Production promotion — GREEN

First Release 465 Production promotion source: `6f2bd42e99f8a92cc6f6aa3dad717fa6b9fc6677`.

- Development System Gate immediately before promotion: `33457936115` — PASS
- Development Preview: `https://569e651b.devilndove-site.pages.dev`
- Production workflow: `33458134514` — PASS
- Production job: `99702372383` — PASS
- exact Production Pages deployment: `https://4b352cde.devilndove-site.pages.dev`
- Production proof artifact: `9782207262`
- Production D1: `583` tables / `4` native migrations / `4` proof rows / `4` Release 465 triggers / `11` Build 3 authority tables / `0` FK violations
- Production business-count preservation: PASS — users `1`, products `45`, inventory rows `1041`, orders `0` before and after migration
- live smoke: `https://devilndove.com/`, `/shop/`, `/manifest.webmanifest`, and `/api/creations` all returned `200`
- Production D1/R2 control-plane binding proof: PASS
- tracked `wrangler.toml` remains Development-safe; Production bindings were ephemeral
- provider execution/publication remained closed

Canonical migrations 0001–0004 are now applied and verified on **both Development and Production**. Future schema work starts with the next numbered migration and follows Development proof → Production migration proof → dependent Production code.

## Permanent safety rules

- Exact green Development tree only may move to `main`.
- Main-only application patches are forbidden.
- Production transactional data is never overwritten from Development.
- Request-time schema DDL remains forbidden.
- Native Git-triggered Cloudflare Pages deployments remain frozen; controlled workflows own deployment.
- Stripe/PayPal/provider execution and publication remain closed unless separately authorized.
- Raw CAIP R2 deletion remains closed.
- Cloudflare Access is never weakened to make Preview smoke pass.

## Next bounded work

Do not reopen Release 465 unless a current gate proves drift. Remaining deliberate external acceptance is Stripe Development, PayPal sandbox, CAIP private-media browser/range-streaming evidence and Social/OAuth controlled acceptance. Native GitHub branch protection remains a separate repository-governance improvement.

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
