# I.T. Preflight / Startup Release Guide — Current Authority

This is the short operator guide for the canonical Devil n Dove Development environment. The source-of-truth environment and release details live in `development-release.json`, `release463-environment.json`, and `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`.

## Startup sequence

1. Read `development-release.json` and confirm the intended source branch is `dev`.
2. Read `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`.
3. Confirm the one canonical Pages project is `devilndove-site`; Development is the `dev` **Preview** environment and Production is the `main` **Production** environment.
4. Confirm tracked `wrangler.toml` is Development-safe and has no `account_id`.
5. Resolve the exact current `dev` SHA.
6. Run current source/System gates.
7. Check D1/R2 identity/readiness **read-only** before deciding whether a migration is needed.
8. Never replay historical migrations merely because a new chat, workstation or deployment starts.
9. Future schema changes must be added only to `migrations/canonical` and proven on Development first.
10. Apply only pending canonical migrations through `scripts/d1_migrate.py` / the guarded Development workflow.
11. Run a separate read-only remote verifier afterward.
12. Verify Application Modules returns account profiles and that the active root administrator has effective `manage` access to all five modules. I.T. remains an explicit-user grant.
13. Use the I.T. Control Tower for readiness/preflight status; unresolved external/provider evidence remains amber/HOLD rather than being inferred green.
14. Keep provider execution/publication closed unless a separate controlled acceptance step explicitly opens it.
15. Promote only an exact System-Gate-green Development tree to `main`; never overwrite Production business data wholesale from Development.

## Canonical Development connection

- Cloudflare account ID pinned by tooling: `c0d5bc25df16ae5b7d47c985c4b7b787`
- Pages project: `devilndove-site`
- Pages environment: Preview
- Source branch: `dev`
- Canonical Preview alias: `https://dev.devilndove-site.pages.dev`
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- GitHub Actions Cloudflare credential reference: `CLOUDFLARE_API_TOKEN`
- Local read-only Cloudflare helper: `python scripts/cloudflare_development_access.py --auth-only`
- Authenticated runtime harness: `python scripts/development_runtime_acceptance.py --base-url https://dev.devilndove-site.pages.dev`
- Optional Cloudflare Access service-token references used by CI: `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET`

Credential values must never be printed, committed or pasted into release evidence.

## Canonical Production boundary

- Pages project: `devilndove-site`
- Pages environment: Production
- Source branch: `main`
- Live domain: `https://devilndove.com`
- D1: `devilndove-prod-r462` / `f34a741b-0000-45b0-9a96-6be08754d563`
- Product R2: `devilndove-toolshed-images`
- CAIP private R2: `devilndove-caip-media`

Production transactional/business data are Production-owned. Development migrations are proven first, then the same pending canonical migration is applied to Production before dependent code. Development data are never copied wholesale over Production.

## Module and root-admin recovery authority

The canonical runtime modules are:

- Storefront
- Creators
- Socials / CAIP
- Financials
- I.T.

The `admin` role must retain `manage` defaults for Storefront, Creators, Socials and Financials. I.T. intentionally remains explicit-user-only. The active root administrator must have an explicit `it-platform/manage` grant so the recovery/control surface cannot become inaccessible.

Use `python scripts/release467_root_admin_access.py --verify-only` for read-only Development verification. A deliberate `--repair` may restore only the root administrator's missing I.T. manage grant; it cannot repair broader permission drift and has no Production target capability.

## Authenticated Development runtime acceptance

The canonical workflow is `.github/workflows/development-runtime-acceptance.yml`. It is GET-only over HTTP and uses only an existing unexpired Development admin session, resolved read-only from Development D1 when necessary.

Cloudflare Access is never weakened for testing. If Access protects the Preview, CI may pass an already-configured service token through `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`. If those references are absent, authenticated runtime acceptance must report the Access boundary as unresolved rather than bypass it.

Runtime acceptance verifies, among other carried-forward contracts:

- Application Modules returns all five modules and account profiles;
- the root administrator has full effective manage authority;
- the I.T. Control Tower is reachable and reports Development readiness honestly;
- inventory base-unit authority remains intact;
- product-media quality thresholds remain intact;
- CAIP provider execution/publication/raw-delete paths remain closed.

## Stop conditions

Stop mutation or promotion when:

- the exact `dev` SHA is unknown or not System-Gate green;
- the Pages project is anything other than `devilndove-site`;
- the environment is not the intended `dev` Preview;
- D1 identity does not exactly match both expected Development name and ID;
- an inherited Cloudflare credential targets/authorizes the wrong account;
- `account_id` has been restored to tracked `wrangler.toml`;
- current migration state is uncertain;
- a historical migration is being proposed only because the chat/workstation changed;
- Application Modules cannot load account profiles;
- the root administrator lacks full effective manage access;
- request-time code attempts schema DDL;
- provider execution/publication becomes enabled outside controlled acceptance;
- a command could touch Production unintentionally;
- Production business data would be replaced wholesale from Development.
