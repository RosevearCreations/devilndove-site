# I.T. Preflight / Startup Release Guide — Release 450

This is the short operator guide. The exact Cloudflare/D1/R2 connection details live in `DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md` and should be read before database work.

## Startup sequence

1. Read `development-release.json` and confirm the intended branch is `dev`.
2. Read `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`.
3. Confirm target Pages project is `devilndove-site-dev`, never separate live `devilndove-site`.
4. Confirm `wrangler.toml` has no `account_id`.
5. Resolve the exact current `dev` SHA.
6. Run current source/System gates.
7. Check D1/R2 identity/readiness **read-only** before deciding whether any current migration is needed.
8. Never replay historical Release 447/448/449 migrations merely because a new chat or machine starts.
9. If the current release has a new additive migration, require source gates + exact Development D1 identity immediately before mutation.
10. Apply only that current migration through its guarded Development workflow.
11. Run a separate read-only remote verifier afterward.
12. Record verified state in `development-release.json`, `AI_HANDOFF.md` and the roadmap.
13. Keep marketplace/payment provider execution and separate live Production closed until explicit acceptance/promotion authority exists.

## Current Development connection

- Cloudflare account ID pinned by tooling: `c0d5bc25df16ae5b7d47c985c4b7b787`
- Pages: `devilndove-site-dev`
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- GitHub Actions credential reference: `CLOUDFLARE_API_TOKEN`
- Local read-only helper: `python scripts/cloudflare_development_access.py --auth-only`

Do not print or store credential values.

## Current release state

- Release 447 baseline: applied and verified Development.
- Release 448: retained regression/platform authority.
- Release 449: complete, applied and read-only remotely verified.
- Release 450: Marketplace & SEO Readiness; current additive migration is `migrations/dev/20260829_release450_marketplace_seo_readiness.sql`.
- Production promotion: closed.
- Marketplace provider publication: closed.

## Release 450 technical gates

Release 450 adds:

`python scripts/release450_marketplace_seo_gate.py`

It composes Release 449 + 450 locally and checks marketplace schema/policy, Etsy fail-closed limits, no request-time marketplace DDL, responsive admin structure, JavaScript syntax and the public SEO structural gate.

The canonical System Gate continues to run carried-forward platform, D1 transport, runtime-safety, SEO and PWA checks.

## Stop conditions

Stop mutation or promotion when:

- exact `dev` SHA is unknown;
- D1 identity does not exactly match both expected name and ID;
- an inherited Cloudflare credential targets/authorizes the wrong account;
- `account_id` has been restored to `wrangler.toml`;
- current migration state is uncertain;
- a historical migration is being proposed only because the chat/machine changed;
- request-time code attempts to create/alter current marketplace schema;
- provider execution/publication becomes enabled before provider acceptance;
- a command could touch separate live Production unintentionally.
