# Devil n Dove — Sanity / Health Check

## Current release

**Release 464 — Platform Integrity and Migration Authority.**

Release 463 remains the environment authority: one Cloudflare Pages project (`devilndove-site`), `dev` → Preview/Development, `main` → Production/Live. Release 461 is historical D1 baseline provenance only.

## Hard boundaries

- [x] Development source branch is `dev`.
- [x] Development Pages target is Preview on `devilndove-site`.
- [x] Development D1 is `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product R2 is `devilndove-toolshed-images-dev`.
- [x] Development CAIP R2 is `devilndove-caip-media-dev`.
- [x] Production source is `main` and live target is Production on the same Pages project.
- [x] Production D1/R2 remain isolated from Development.
- [x] Production transactional/business data are Production-owned.
- [x] Provider/payment execution and publication remain closed.
- [x] Raw CAIP R2 deletion remains closed.
- [x] `wrangler.toml` contains no `account_id` and remains Development-safe.

## Release 464 database authority

- [x] Historical Release 461 migrations are never replayed automatically.
- [x] Forward migrations live only in `migrations/canonical/`.
- [x] Cloudflare native `d1_migrations` is the applied ledger.
- [x] `app_schema_migration_proofs` records checksum/source/recovery evidence.
- [x] Development migration proof is mandatory before Production apply.
- [x] Production migration runs before code that depends on it.
- [x] Accounting statement imports contain no request-time DDL authority.
- [x] Manual runtime migration/bootstrap/schema-repair endpoints are retired or read-only.
- [x] Shared runtime D1 firewall blocks request-time schema mutation authority.
- [x] Source gate requires zero raw D1 bypasses carrying schema DDL.

## Promotion sanity

- [x] Main-only application patches are forbidden by release policy.
- [x] Production deployment checks that the `main` tree already exists on `dev`.
- [x] The matching Development tree must have a successful canonical System Gate.
- [x] Production canonical migrations must already be Development-proven.
- [x] Native Git-triggered Cloudflare Pages deployments remain frozen.
- [x] GitHub Actions deploys explicit exact SHAs.
- [ ] Native GitHub branch-protection/ruleset state is separately verified from repository settings; source controls never falsely claim this setting is enabled.

## Repository sanity

- [x] Canonical System Gate owns ordinary Development source/deploy acceptance.
- [x] Temporary Release 464 codemod/source workflows are removed after use.
- [x] Storefront one-H1/canonical/OpenGraph/Twitter/JSON-LD gates remain carried forward.
- [x] Private admin pages remain noindex/nofollow.
- [x] Five canonical modules remain Storefront, Creators, Socials/CAIP, Financials/Accounting and I.T.
- [x] Canonical current-authority documents identify Release 464 / environment Release 463.

## Green definition

Release 464 Update 1 is Development green only when one exact `dev` SHA has both:

1. canonical System Gate source job PASS; and
2. Development job PASS after canonical D1 migration apply/proof and exact Preview deployment/control-plane verification.

Production promotion, CAIP private-media browser proof, Stripe test acceptance, PayPal sandbox acceptance and live provider authorization remain later deliberate boundaries; they are not prerequisites for Development green.
