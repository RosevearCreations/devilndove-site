# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

This guide defines the safe restart sequence for the canonical Devil n Dove Development environment.

`current-development-authority.json` is the current Release 467 machine-readable restart pointer. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** and the middleware Release 466 header remains explicit **INHERITED_RUNTIME_COMPATIBILITY**; neither is the current release selector.

## Startup sequence

1. Read `current-development-authority.json` and confirm the current Release 467 build, exact green predecessor and safety boundaries.
2. Read `AI_HANDOFF.md` for the current restart point, authority separation and next bounded work.
3. Read the current Release 467 build manifest; Release 467 Build 8 — Authority Convergence and Restart Safety remains the authority that established this reading order.
4. Confirm the intended source branch is `dev` and resolve its exact current commit SHA.
5. Open `/admin/it/` after authenticated access. Build 10 makes its consolidated Control Tower the current read-only operational first stop.
6. Confirm the canonical Pages project is `devilndove-site`; Development is the `dev` Preview environment and Production is the `main` Production environment.
7. Confirm tracked `wrangler.toml` remains Development-safe and contains no `account_id`.
8. Run current source/System gates before making a release claim.
9. Check Development D1/R2 identity/readiness read-only before deciding whether a migration is required.
10. Never replay historical migrations merely because a chat, workstation, deployment or source commit changed.
11. Future schema changes must be added only to `migrations/canonical`, proven on Development first, and applied to Production only before dependent Production code when separately authorized.
12. Apply only genuinely pending canonical migrations through guarded migration tooling; run a separate read-only verifier afterward.
13. Verify Application Modules returns account profiles and the root administrator retains effective `manage` access to all five modules. I.T. remains an explicit-user grant.
14. Use the Build 10 prioritized I.T. recovery queue to identify the next corrective workspace. The queue is guidance only and never performs automatic repair.
15. Keep external provider/Access policy states separate from runtime/source health. Amber/HOLD remains truthful until independently proven.
16. Keep provider execution/publication closed unless a separate controlled acceptance step explicitly opens a Development/test/sandbox lane.
17. Promote only a separately reviewed exact System-Gate-green Development candidate through Release 467 Production Promotion Readiness; never overwrite Production business data from Development.

## Canonical Development connection

- Source branch: `dev`
- Pages project: `devilndove-site`
- Pages environment: Preview
- Canonical Preview alias: `https://dev.devilndove-site.pages.dev`
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- Canonical migration directory: `migrations/canonical`
- Canonical migration stream at Build 10: exactly `0001`–`0004`
- GitHub Actions Cloudflare credential reference: `CLOUDFLARE_API_TOKEN`
- Optional outer Access service-token references: `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET`

Credential **values** must never be printed, committed, serialized into evidence or pasted into release documents.

## Current exact predecessor evidence

Release 467 Build 9 is the exact Build 10 predecessor:

- merged Development commit: `d8a9ffba03f980b9632643d91d9aa69b25bd94fd`
- tree: `949f2523d31e0f47ed1e19ff7655de2762fbc1df`
- System Gate: `33633043297` — SUCCESS
- Build 9 Proof: `33633043229` — SUCCESS

Build 10 must not rewrite those facts until Build 10 itself is merged and re-proven on a new exact `dev` SHA.

## Build 10 I.T. first-stop mechanics

`/api/admin/it-operations-control-tower` wraps the existing read-only `/api/admin/it-control-tower` subsystem engine and adds current operator context.

The top Control Tower must show:

- current Release 467 build and last-green predecessor;
- runtime source SHA/host when trusted runtime ancestry is available;
- Development D1/R2 target authority;
- root-admin/profile/module metrics;
- canonical migration/proof and foreign-key metrics;
- blocking vs attention recovery counts;
- one severity-sorted recovery queue with correction text and workspace links;
- external policy HOLDs separately from runtime evidence.

The Build 10 endpoint never performs permission repair, schema mutation, D1/R2 writes, provider execution, Access policy mutation, `main` mutation or Production mutation.

## Current-vs-compatibility authority

The Release 467 restart chain is:

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. current Release 467 build manifest
4. current roadmap/sanity/operations authority

`development-release.json` intentionally stays on its inherited Release 466 regression contract. The middleware `X-DND-Release` compatibility value also remains 466 until that separate runtime contract is deliberately migrated. Build 10 surfaces this split clearly so compatibility metadata cannot silently override current Release 467 authority.

Release 467 Build 8 — Authority Convergence and Restart Safety remains the governing rationale for this separation.

## Cloudflare Access boundary

The canonical Preview remains protected by Cloudflare Access. Release 467 Build 6 owns the separate Development Access service-token acceptance harness. A browser/application-admin success is not CI Access success, and outer Access success is not application-admin authentication.

The service-token acceptance lane remains `HOLD_EXTERNAL` until its deliberate Development-only workflow succeeds with masked `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` references.

Do not disable, bypass or weaken Preview Access to make tests green. Build 10 performs no Access policy/token mutation.

## Root administrator / module recovery authority

The canonical modules are Storefront, Creators, Socials/CAIP, Financials and I.T. The `admin` role retains `manage` defaults for the first four; I.T. intentionally remains explicit-user-only. The active root administrator must retain an explicit `it-platform/manage` grant.

The Control Tower may report a permission problem and link to Application Modules, but it does not repair it automatically. Use bounded existing verification/repair authority only when deliberately required.

## External commercial/provider boundary

Release 467 Build 7 owns the external-commercial visibility bridge. Build 10 only displays policy/evidence status.

Keep these separate and truthful:

- Stripe Development — `HOLD_EXTERNAL` until deliberate test-mode acceptance evidence exists;
- PayPal sandbox — `HOLD_EXTERNAL` until deliberate sandbox acceptance evidence exists;
- Social/OAuth — `HOLD_EXTERNAL` until controlled intended-provider/account lifecycle evidence exists; publication remains closed;
- CAIP private media — use fresh current Build 7 runtime evidence;
- native GitHub rulesets — separate external repository-setting authority.

Do not create provider activity merely to turn an I.T. card green.

## Canonical Production boundary

- Source branch: `main`
- Pages project: `devilndove-site`
- Pages environment: Production
- Live domain: `https://devilndove.com`
- Production D1/R2 remain Production-owned authorities.

The carried-forward source-head observation for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`. This is not sufficient to assert the exact deployed Production release. Verify Production deployment independently before any promotion decision.

Build 10 does not update `main`, contact Production, mutate Production D1/R2/business data or authorize deployment.

## Stop conditions

Stop mutation/promotion when:

- `current-development-authority.json` is missing, invalid or disagrees with `AI_HANDOFF.md`;
- the exact `dev` SHA is unknown or not proven by the required gates;
- the Pages project/environment is not the intended `devilndove-site` Preview;
- D1 identity does not match `devilndove-dev` and its exact ID;
- `account_id` has been restored to tracked `wrangler.toml`;
- current migration state is uncertain;
- a historical migration is proposed only because work resumed;
- compatibility Release 466 metadata is being used to override current Release 467 authority;
- Application Modules cannot load profiles or root-admin authority is broken;
- request-time code attempts schema DDL;
- provider execution/publication is enabled outside separately controlled acceptance;
- Cloudflare Access would need to be weakened for a test;
- a command could touch `main` or Production unintentionally;
- Production business data would be replaced wholesale from Development;
- a secret value would be displayed, logged or committed.
