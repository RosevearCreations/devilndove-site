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

## Current Cloudflare Access CI boundary

The canonical Preview is intentionally protected by Cloudflare Access. Current Release 467 evidence proves anonymous requests to `dev.devilndove-site.pages.dev` redirect to the Pages-managed Access tenant `devilndove-site-pages.cloudflareaccess.com`. The Access audience is known and matched from signed redirect metadata; this is evidence only and is not used to bypass Access.

The existing masked `CLOUDFLARE_API_TOKEN` can read Access service-token/application inventory, but the current account inventory exposes zero service tokens and zero standard Access applications. A bounded ephemeral service-token creation probe was refused with HTTP 403 / Cloudflare code 1010, so **no service token was created**. The same credential is also refused by the Pages project API with HTTP 403 / code 10000. No Access policy was modified.

Therefore authenticated HTTP acceptance through CI is currently **AMBER_EXTERNAL_ACCESS**, not RED application failure and not GREEN runtime acceptance. The application-side prerequisites are independently proven: Development D1 identity is exact, an active admin session can be resolved read-only, Application Modules profiles load from the current source contract, and the root administrator has effective manage authority across all five modules.

To close this boundary, provision the automation path with the least privilege needed to create/use a Cloudflare Access service token (currently `Access: Service Tokens Write` for token creation) and configure the resulting values only as masked GitHub Actions secrets `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`. If the Pages-managed policy then requires an explicit Service Auth policy, that policy change must be separately reviewed and proven. **Do not disable or weaken Preview Access for testing.**

The canonical runtime workflow treats this known outer-Access condition as `AMBER_EXTERNAL_ACCESS`. Any unrelated runtime error, a partially configured service token, or configured service-token credentials that Access refuses remains a real workflow failure.

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

Cloudflare Access is never weakened for testing. If Access protects the Preview, CI may pass an already-configured service token through `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`. If those references are absent and the only refusal is the proven outer Access boundary, the workflow records sanitized `AMBER_EXTERNAL_ACCESS` evidence. It does not call the application runtime GREEN. Unexpected runtime failures still fail the job.

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
