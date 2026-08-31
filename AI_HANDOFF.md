# Devil n Dove — AI Handoff

## Current authority

**Release 464 — Platform Integrity and Migration Authority — is the current application release.**

Release 463 remains the current **environment** authority: one Cloudflare Pages project, `devilndove-site`, with `dev` deploying to Preview/Development and `main` deploying to Production/Live. Release 461 remains historical D1 baseline provenance only; it is never replayed because a chat, workstation, branch or deployment changes.

## Environment boundary

### Development

- source branch: `dev`
- Pages project/environment: `devilndove-site` / Preview
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`

### Production

- source branch: `main`
- Pages project/environment: `devilndove-site` / Production
- live domain: `https://devilndove.com`
- D1: `devilndove-prod-r462` (`f34a741b-0000-45b0-9a96-6be08754d563`)
- Product R2: `devilndove-toolshed-images`
- CAIP R2: `devilndove-caip-media`

Production business/transactional data is Production-owned. Never refresh or overwrite it wholesale from Development.

## Release 464 Update 1 authority

Update 1 covers roadmap items 1–7:

1. canonical forward D1 migration ledger/applicator;
2. fail-closed `dev`/`main` release controls, with native GitHub protection separately observable;
3. exact green Development-tree promotion to `main`;
4. legacy temporary workflow/tool cleanup;
5. canonical documentation convergence;
6. Accounting statement-import migration ownership/fail-closed closure;
7. application-wide request-time schema mutation blockade.

Forward migrations live only in `migrations/canonical/`. `scripts/d1_migrate.py` owns apply/proof behavior. Cloudflare's native `d1_migrations` ledger is paired with `app_schema_migration_proofs` for SHA-256/source/recovery evidence. Every future schema change is Development-first, then the exact same migration is applied/proven on Production before code requiring it is deployed.

Request-time schema repair is no longer an authority. The shared D1 firewall makes legacy ensure-style CREATE/ALTER operations non-mutating and rejects destructive schema DDL. Missing schema must fail at the real business query and be repaired by a repository migration, not by a request.

The Accounting statement-import helper is already migration-owned/read-only/fail-closed and is **not** an outstanding runtime-schema offender.

## Promotion rule

Production promotion is **exact green Development tree only**:

1. work lands on `dev`;
2. canonical System Gate passes;
3. canonical migrations apply/prove on Development D1;
4. that exact `dev` SHA/tree deploys to Preview with Development bindings;
5. `main` must contain an exact tree already reachable on `dev` with a successful System Gate;
6. Production applies/proves the same canonical migrations before dependent code;
7. exact `main` SHA deploys with Production bindings and control-plane proof.

Main-only application patches are forbidden. Native Git-triggered Pages deployments remain frozen; GitHub Actions owns explicit deployment.

## Canonical modules

- Storefront
- Creators
- Socials / CAIP
- Financials / Accounting
- I.T.

Public pages continue to require SEO guardrails including one exposed H1, canonical metadata and structured-data checks.

## Provider boundary

Stripe/PayPal/provider execution and publication remain closed unless a later deliberate test/live authorization explicitly opens them. Configuration presence alone never authorizes transactions.

## Next work after Update 1

Proceed to **Update 2 — items 8–13, Operational Acceptance and Recovery** only after the Release 464 Development System Gate, canonical D1 migration proof and Preview deployment are green on the same `dev` SHA.

## Canonical reading order

1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `SANITY_HEALTH_CHECK.md`
5. `docs/operations/RELEASE_464_THREE_UPDATE_ROADMAP.md`
6. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
7. `release463-environment.json`

Older Build/Release material is provenance only and must not override these current authorities.
