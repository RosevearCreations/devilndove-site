# Devil n Dove — Sanity / Health Check

## Current release

**Release 462 — Autonomous Quality, Workflow & Gate Consolidation.**

## Hard boundaries

- [x] Source is `dev`.
- [x] Development Pages is `devilndove-site-dev`.
- [x] D1 is exactly `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Product R2 is `devilndove-toolshed-images-dev`.
- [x] CAIP private R2 is `devilndove-caip-media-dev`.
- [x] Separate live Production is untouched.
- [x] Provider/payment execution and publication are closed.
- [x] Raw CAIP R2 deletion is closed.
- [x] `wrangler.toml` has no `account_id`.

## Database

- [x] Release 462 requires no new migration.
- [x] Release 461 remains the verified D1 schema baseline.
- [x] Release 461 proof: 77 tables / 93 indexes / 0 missing / 0 structural drift / 0 FK violations.
- [x] Historical migration replay remains forbidden.
- [x] Request-time schema DDL remains forbidden.

## Twelve-workstream Release 462 source sanity

- [x] Application-wide authority audit.
- [x] Finance/Accounting fail-closed schema ownership.
- [x] Inventory/Tools/Supplies base-unit clarity.
- [x] Product/Storefront quality reinforcement.
- [x] SEO structure/depth gates.
- [x] CAIP source-preserving workflow.
- [x] Creators/Content Studio reviewed handoff.
- [x] I.T. readiness/next-action guidance.
- [x] Stripe/PayPal source preparation without transactions.
- [x] Responsive/admin UX convergence.
- [x] Regression/GitHub gate consolidation.
- [x] Canonical Markdown convergence.

## GitHub sanity

- [x] System Gate is the ordinary push-time source authority.
- [x] Closed Release 461 source workflow is manual-only.
- [x] Current official GitHub setup actions use the Node-24-era `v7` major.
- [x] Historical red runs are not current-release status.

## Still deliberately open

CAIP private-media browser proof, Stripe test acceptance, PayPal sandbox acceptance, live provider authorization and Production promotion remain separate external evidence boundaries.
