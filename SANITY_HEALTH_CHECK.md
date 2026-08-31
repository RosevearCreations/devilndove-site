# Devil n Dove — Sanity / Health Check

## Current release

**Release 465 — Business Intelligence and Release Hardening — Builds 1 and 2 are Development green.** Release 464 is the completed prior application release. Release 463 remains the environment authority; Release 461 is historical D1 baseline provenance only.

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
- [x] Four Release 465 Product/SEO publication triggers remain present.
- [x] Build 2 is schema-neutral; there is no 0005 for Build 2.

## Release 465 Build 1 sanity

- [x] Storefront merchandising simulation is read-only.
- [x] Product readiness/completeness uses existing Product/SEO/media authorities.
- [x] Active Product publication hard requirements fail closed at D1.
- [x] Storefront Quality cockpit and relationship/search intelligence are non-mutating.
- [x] Product/Offer/Breadcrumb structured data and one-H1 SEO gates remain active.

## Release 465 Build 2 sanity

- [x] Related-product intelligence returns explainable reasons and does not write relationships.
- [x] Availability intelligence is read-only and never consumes stock.
- [x] Shortage forecasting is an operator scenario, not a claimed production order.
- [x] The same Product resource, Inventory and purchase-lot authority used by production release drives Build 2 material reasoning.
- [x] Genealogy exceptions distinguish forward-provenance gaps from legitimate pre-cutover opening stock.
- [x] Historical genealogy is never reconstructed or fabricated.
- [x] Creative readiness uses existing Product, CAIP evidence, Content Studio and pipeline authorities.
- [x] Next Safe Action is explanation-only: no provider execution, publication, Inventory mutation, production posting or Accounting posting.
- [x] Build 2 admin API is GET-only and the cockpit is read-only.
- [x] Build 2 source gate is part of the canonical System Gate.

## First Build 2 technical-green evidence

- source SHA: `658613a9775c248e959c04113ea138e85d32bac1`
- System Gate: `33431890551`
- source job: `99618968755` — PASS
- deploy job: `99619087413` — PASS
- exact Preview: `https://def3bd0b.devilndove-site.pages.dev`
- D1: `583` tables / `4` canonical migrations / `4` proof rows / `4` Release 465 triggers / `18` Build 2 required authority tables / `0` FK violations
- migration result: `No migrations to apply!`
- artifact ID: `9772962684`
- Preview mode: `CLOUDFLARE_ACCESS_PROTECTED`
- authentication headers used: `ZERO`
- Access weakened: `NO`
- provider execution/publication: `ZERO`
- Inventory mutation / production posting / Accounting posting: `ZERO`
- Production mutation: `ZERO`
- raw CAIP R2 delete: `ZERO`

## Green definition

The Build 2 documentation closure head must pass the same canonical System Gate idempotently. Its migration step must again find no pending Development migration while preserving 4 native rows / 4 proof rows / 4 Release 465 triggers / 18 Build 2 required authorities / 0 FK violations, then deploy that exact closure SHA with Development D1/R2 bindings and pass Access-safe smoke. Git plus that final successful workflow determines the final restart checkpoint; the commit does not self-embed a future SHA/run ID.

## Next boundary

After that final closure System Gate succeeds, begin **Release 465 Build 3 — Financial, I.T. & Release Hardening — items 14–20 only**. Do not reopen Builds 1 or 2 unless a current gate proves drift. Production promotion and external Stripe/PayPal/CAIP/Social provider acceptance remain separate deliberate boundaries.
