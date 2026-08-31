# Devil n Dove — Sanity / Health Check

## Current release

**Release 462 — Autonomous Quality, Workflow & Gate Consolidation — Development green.**

## Exact green evidence

- [x] Preclosure source SHA: `71b58c548e953edbdede1be85e12acd7e30e3422`.
- [x] System Gate run `33348770688` (#526), job `99357890735`: PASS.
- [x] Cloudflare Pages check `99358032459`: PASS.
- [x] Development deployment `3e03d1ee-a427-4d14-b561-59b2980fdf1c`: deployed successfully.
- [x] Preview: `https://3e03d1ee.devilndove-site-dev.pages.dev`.
- [x] Ordinary Actions fanout reduced from 11 workflows on the first landing to exactly 1 current System Gate on the corrected green head.

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

## Release 462 full-dozen sanity

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
- [x] Canonical documentation convergence.

## GitHub sanity

- [x] System Gate is the only ordinary push-time GitHub Actions source authority.
- [x] Historical `release4*-source-gate` workflows are manual snapshots only.
- [x] Historical remote-verification workflows are archived/manual and do not replay remote procedures.
- [x] Canonical System Gate uses `actions/checkout@v7`, `actions/setup-python@v7`, and `actions/setup-node@v7`.
- [x] The prior System Gate #525 red entry was an intermediate brittle static assertion and is superseded by #526 PASS.

## Still deliberately open

CAIP private-media browser proof, Stripe test acceptance, PayPal sandbox acceptance, live provider authorization and Production promotion remain separate external evidence boundaries. They are not prerequisites for calling the autonomous Release 462 source release Development green.
