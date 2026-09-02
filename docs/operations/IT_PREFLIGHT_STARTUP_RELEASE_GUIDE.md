# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

This guide defines the safe restart sequence for the canonical Devil n Dove Development environment.

`current-development-authority.json` is the current Release 467 machine-readable restart pointer. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** for old gates and must not be used as the current release selector.

## Startup sequence

1. Read `current-development-authority.json` and confirm the current Release 467 build, exact green predecessor and safety boundaries.
2. Read `AI_HANDOFF.md` for the current restart point, authority separation and next bounded work.
3. Read `release467-build8-authority-convergence.json` when Build 8 is active.
4. Confirm the intended source branch is `dev` and resolve its exact current commit SHA.
5. Confirm the canonical Pages project is `devilndove-site`; Development is the `dev` Preview environment and Production is the `main` Production environment.
6. Confirm tracked `wrangler.toml` remains Development-safe and contains no `account_id`.
7. Run current source/System gates before making a release claim.
8. Check Development D1/R2 identity/readiness read-only before deciding whether a migration is required.
9. Never replay historical migrations merely because a chat, workstation, deployment or source commit changed.
10. Future schema changes must be added only to `migrations/canonical`, proven on Development first, and applied to Production only before dependent Production code when separately authorized.
11. Apply only genuinely pending canonical migrations through the guarded migration tooling; run a separate read-only verifier afterward.
12. Verify Application Modules returns account profiles and the root administrator retains effective `manage` access to all five modules. I.T. remains an explicit-user grant.
13. Use the I.T. Control Tower for current readiness. External/provider/Access evidence remains amber/HOLD until independently proven.
14. Keep provider execution/publication closed unless a separate controlled acceptance step explicitly opens a Development/test/sandbox lane.
15. Promote only a separately reviewed exact System-Gate-green Development candidate through the Release 467 Production Promotion Readiness process; never overwrite Production business data from Development.

## Canonical Development connection

- Source branch: `dev`
- Pages project: `devilndove-site`
- Pages environment: Preview
- Canonical Preview alias: `https://dev.devilndove-site.pages.dev`
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- Canonical migration directory: `migrations/canonical`
- Canonical migration stream at Build 8: exactly `0001`–`0004`
- GitHub Actions Cloudflare credential reference: `CLOUDFLARE_API_TOKEN`
- Optional outer Access service-token references: `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET`

Credential **values** must never be printed, committed, serialized into evidence or pasted into release documents.

## Current exact predecessor evidence

Release 467 Build 7 is the Build 8 predecessor:

- merged Development commit: `5eef764a67466dc2989a4681c6a7cc782b9d4df9`
- tree: `f7327733dc423982016829d717521ceab2029f35`
- System Gate: `33591744817` — SUCCESS
- Build 7 Proof: `33591744787` — SUCCESS

Build 8 must not rewrite those predecessor facts until Build 8 itself is merged and re-proven on an exact new `dev` SHA.

## Current-vs-compatibility authority

The Release 467 restart chain is:

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. current Release 467 build manifest
4. current roadmap/sanity/operations authority

`development-release.json` intentionally stays on its inherited Release 466 compatibility contract because still-valid Release 466 gates assert its historical convergence fields. Do not “modernize” that file independently. Migrate the consuming regression gates first, then retire historical compatibility fields deliberately.

The Build 8 gate fails if stale compatibility evidence is promoted back into current authority or if current restart files disagree.

## Cloudflare Access boundary

The canonical Preview remains protected by Cloudflare Access. Release 467 Build 6 owns the separate Development Access service-token acceptance harness. A browser/application-admin success is not CI Access success, and outer Access success is not application-admin authentication.

The service-token acceptance lane remains `HOLD_EXTERNAL` until its deliberate Development-only workflow succeeds with correctly provisioned masked `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` references.

Do not disable, bypass or weaken Preview Access to make smoke/runtime tests green. Build 8 performs no Access policy/token mutation.

## Root administrator / module recovery authority

The canonical modules are:

- Storefront
- Creators
- Socials / CAIP
- Financials
- I.T.

The `admin` role retains `manage` defaults for Storefront, Creators, Socials and Financials. I.T. intentionally remains explicit-user-only. The active root administrator must retain an explicit `it-platform/manage` grant.

Use `python scripts/release467_root_admin_access.py --verify-only` for read-only Development verification. A separately deliberate repair may restore only the bounded root-administrator I.T. grant; it is not authority for broad permission rewrites or Production mutation.

## External commercial/provider boundary

Release 467 Build 7 owns the current external-commercial visibility bridge. Build 8 does not execute providers.

Keep these separate and truthful:

- Stripe Development — `HOLD_EXTERNAL` until deliberate test-mode acceptance evidence exists;
- PayPal sandbox — `HOLD_EXTERNAL` until deliberate sandbox acceptance evidence exists;
- Social/OAuth — `HOLD_EXTERNAL` until controlled intended-provider/account lifecycle evidence exists; publication remains closed;
- CAIP private media — use fresh current Build 7 runtime evidence rather than stale historical wording;
- native GitHub rulesets — separate external repository-setting authority.

Do not create provider activity merely to turn an I.T. card green.

## Canonical Production boundary

- Source branch: `main`
- Pages project: `devilndove-site`
- Pages environment: Production
- Live domain: `https://devilndove.com`
- Production D1/R2 remain Production-owned authorities.

The last source-head verification before Build 8 found `main` at `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`. This is not sufficient to assert the exact deployed Production release. Verify Production deployment independently before any promotion decision.

Build 8 does not update `main`, contact Production, mutate Production D1/R2/business data or authorize deployment.

## Stop conditions

Stop mutation/promotion when:

- `current-development-authority.json` is missing, invalid or disagrees with `AI_HANDOFF.md`;
- the exact `dev` SHA is unknown or not proven by the required gates;
- the Pages project/environment is not the intended `devilndove-site` Preview;
- D1 identity does not match `devilndove-dev` and its exact ID;
- `account_id` has been restored to tracked `wrangler.toml`;
- current migration state is uncertain;
- a historical migration is proposed only because work resumed;
- stale Release 466 documentation is being used to override current Release 467 authority;
- Application Modules cannot load profiles or root-admin authority is broken;
- request-time code attempts schema DDL;
- provider execution/publication is enabled outside separately controlled acceptance;
- Cloudflare Access would need to be weakened for a test;
- a command could touch `main` or Production unintentionally;
- Production business data would be replaced wholesale from Development;
- a secret value would be displayed, logged or committed.
