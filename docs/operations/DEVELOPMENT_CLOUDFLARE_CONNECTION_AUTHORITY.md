# Development Cloudflare Connection Authority

## Current authority — Release 463 live operating model

This file defines the only Cloudflare boundary for ongoing Devil n Dove work.

## One Pages project

There is one canonical Cloudflare Pages project:

- project: `devilndove-site`
- `dev` → **Preview / Development**
- `main` → **Production / Live**
- live customer domain: `https://devilndove.com`

The retired `devilndove-site-dev` project is legacy cleanup only. It is not an application target and must not receive new Development work.

Native Git-triggered Pages deployments remain frozen. Environment-aware GitHub Actions deploy the exact approved SHA so branch, resource bindings and deployment evidence remain explicit.

## Cloudflare account

- approved tooling/CI account ID: `c0d5bc25df16ae5b7d47c985c4b7b787`
- account selection belongs in local tooling/GitHub Actions environment
- `wrangler.toml` must never contain `account_id`

The tracked `wrangler.toml` is Development-safe and points only to Development resources. The Production deployment workflow generates Production bindings ephemerally in the runner and restores the tracked Development configuration before exit.

## Development authority

### Source / Pages

- branch: `dev`
- project: `devilndove-site`
- Pages environment: Preview
- exact Preview URL changes per deployment

### D1

- binding: `DB`
- database: `devilndove-dev`
- UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`

### R2

- `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`

Development is where new code and schema changes are proven before promotion.

## Production authority

### Source / Pages

- branch: `main`
- project: `devilndove-site`
- Pages environment: Production
- live domain: `https://devilndove.com`

### D1

- binding: `DB`
- database: `devilndove-prod-r462`
- UUID: `f34a741b-0000-45b0-9a96-6be08754d563`

### R2

- `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images`
- `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media`

Release 463 live cutover runtime proof passed on workflow run `33396235808`. Proof artifact `9759432735` is retained for 90 days. D1 baseline clone/parity proof is run `33354477153`, artifact `9744697793`.

## Live D1 operating rule

Production is now an independent, live data authority.

- Business and transactional rows created in Production stay Production-owned.
- Never clone/synchronize Development over Production as an ordinary release action.
- Never use a fresh-install schema or historical migration replay as a startup action.
- Request-time schema DDL is forbidden.
- Runtime handlers must fail closed if required schema is missing; they must not create/repair it.

For every **future schema change**:

1. add a versioned SQL migration to the repository;
2. apply and verify it against `devilndove-dev` first;
3. run System Gate and Development Preview acceptance;
4. promote the exact approved tree to `main`;
5. apply the **same migration** to `devilndove-prod-r462` before code depending on it is allowed to deploy;
6. verify required objects, foreign keys and any migration-specific invariants;
7. deploy exact `main` SHA with Production bindings;
8. verify authenticated runtime through `devilndove.com`.

Migration files are forward history. Once Production has accepted a migration, do not edit that migration in place; add a new migration for later changes. Every Production migration must have either a rollback plan or a documented forward-only recovery path.

## Upgrade rule

Normal application upgrades should be additive/backwards-compatible where practical:

- add columns/tables first;
- deploy code that can tolerate old/new state during transition when feasible;
- backfill explicitly when required;
- only remove old schema after dependent code/data has already moved;
- keep Production data intact during branch promotion.

This prevents a code promotion from becoming a destructive database replacement.

## Startup rule

1. Read `development-release.json`, `AI_HANDOFF.md`, and `release463-environment.json`.
2. Verify the `dev` branch and exact Development D1/R2 identities before Development mutation.
3. Use only `devilndove-site` Preview for Development.
4. Use only `devilndove-site` Production / `main` for Live.
5. Do not replay old Release 448–463 migration/recovery workflows as startup actions.
6. A new chat, workstation, deployment or source commit is not a migration event.
7. Resume feature/runtime work from the current roadmap rather than reopening environment consolidation.

## Secret/configuration boundary

Actual provider values belong in Cloudflare project environment settings/secrets and GitHub Actions secrets where required. Source, Markdown, D1 and browser output may contain safe reference names only, never secret/token values.

## Provider boundary

Stripe, PayPal, OAuth/social publication and other provider execution remain deliberate acceptance boundaries. A live Pages/D1 environment does not automatically authorize financial/provider execution.

Do not weaken Cloudflare Access, D1/R2 isolation or provider locks just to make an acceptance test easier.
