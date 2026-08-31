# Devil n Dove — Sanity / Health Check

## Current release

**Release 465 — Business Intelligence and Release Hardening — Build 1 is Development green.** Release 464 is the completed prior application release. Release 463 remains the environment authority; Release 461 is historical D1 baseline provenance only.

## Hard boundaries

- [x] `dev` → Preview/Development on `devilndove-site`.
- [x] Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product R2: `devilndove-toolshed-images-dev`.
- [x] Development CAIP R2: `devilndove-caip-media-dev`.
- [x] `main` → Production/Live on the same Pages project with isolated Production D1/R2.
- [x] Production business/transactional data are Production-owned.
- [x] Provider execution/publication remain closed.
- [x] Raw CAIP R2 deletion remains closed.
- [x] Request-time schema mutation remains blocked.
- [x] `wrangler.toml` remains Development-safe with no `account_id` or Production D1 id.
- [x] Cloudflare Access is never weakened for Preview smoke.

## Canonical database authority

- [x] Historical Release 461 migrations are never replayed automatically.
- [x] Forward migrations live only in `migrations/canonical/`.
- [x] `d1_migrations` is the native applied ledger.
- [x] `app_schema_migration_proofs` records checksum/source/environment/recovery evidence.
- [x] Applied canonical migration identities are immutable.
- [x] Development-first migration proof is mandatory.
- [x] Canonical 0001, 0002, 0003 and 0004 are applied and verified on Development.
- [x] Development D1 reports `583` tables, `4` native canonical rows, `4` proof rows and `0` FK violations.
- [x] Four Release 465 Product/SEO publication triggers exist.

## Release 465 Build 1 sanity

- [x] Storefront merchandising simulator is read-only and reuses the public merchandising evaluator.
- [x] Product readiness/completeness uses existing Product/SEO/media authorities.
- [x] Active Product publication hard requirements fail closed at D1.
- [x] Active Product SEO cannot be degraded or deleted underneath a published Product.
- [x] Soft quality override still requires step-up authorization and an explicit note.
- [x] Storefront Quality cockpit is read-only.
- [x] Internal-link intelligence only suggests relationships; it does not rewrite content.
- [x] Product image-quality visibility reuses existing annotations/scoring.
- [x] Typo recovery only suggests existing Product links; it does not mutate Product data.
- [x] Product links remain `/shop/product/?slug=<slug>`.
- [x] Product/Offer/Breadcrumb structured data and one-H1 SEO gates remain active.
- [x] Build 1 source gate is part of canonical System Gate.

## Exact first Build 1 green evidence

- technical-green source SHA: `4359862e1d7a9d8dfc53841d0d25c6a219f134c3`
- System Gate: `33428268265`
- source job: `99607087240` — PASS
- deploy job: `99607189007` — PASS
- exact Preview: `https://57cfbd12.devilndove-site.pages.dev`
- D1: `583` tables / `4` canonical migrations / `4` proof rows / `4` Release 465 triggers / `0` FK violations
- manifest SHA-256: `d9a0f294765543e6f09696f54dfc58453d201fd4a6a84c1f11cd62e56ffa1642`
- artifact ID: `9771613193`
- Preview mode: `CLOUDFLARE_ACCESS_PROTECTED`
- authentication headers used: `ZERO`
- Access weakened: `NO`
- provider execution/publication: `ZERO`
- Production mutation: `ZERO`
- raw CAIP R2 delete: `ZERO`

## Green definition

This documentation closure SHA must pass the same canonical System Gate idempotently. Its migration step must find no pending Development migration while preserving 4 native rows / 4 proof rows / 4 Release 465 triggers / 0 FK violations, then deploy that exact SHA with Development D1/R2 bindings and pass Access-safe smoke. That closure SHA becomes the final Build 1 restart checkpoint.

## Next boundary

After the final closure System Gate succeeds, begin **Release 465 Build 2 — Inventory & Creator Intelligence — items 8–13 only**. Do not begin Build 3 until Build 2 is Development green. Production promotion and external Stripe/PayPal/CAIP/Social provider acceptance remain separate deliberate boundaries.
