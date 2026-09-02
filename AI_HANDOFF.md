# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction** is the active Development source candidate.

Start every new chat/workstation/restart by reading `current-development-authority.json`, then this file. `development-release.json` is compatibility evidence and is not the current Release 467 selector.

The exact Development-green predecessor is **Release 467 Build 8 — Authority Convergence and Restart Safety**:

- merged `dev` commit: `94a891d3cb0608a91550c90fb04acea05cff75b3`
- tree: `09d9f822c9987d3422921e819c913427af664184`
- System Gate `33631757568` — SUCCESS
- Release 467 Build 8 Authority Convergence Proof `33631758140` — SUCCESS

Build 9 removes obsolete automatic Release 466 workflow fanout from current Release 467 pushes and pull requests. It does not delete the historical proof scripts or Git/Actions history.

## Build 9 technical authority

- current pointer: `current-development-authority.json`
- Build 9 manifest: `release467-build9-historical-ci-retirement.json`
- source gate: `scripts/release467_build9_gate.py`
- source proof: `.github/workflows/release467-build9-proof.yml`
- operations authority: `docs/operations/RELEASE_467_BUILD_9_HISTORICAL_CI_RETIREMENT.md`
- source base: exact merged Build 8 `94a891d3cb0608a91550c90fb04acea05cff75b3`

Release 466 Build 1–6 proof workflows are now **MANUAL_ONLY_PROVENANCE**. Their gate scripts remain in `scripts/`, and historical workflow runs/artifacts remain GitHub evidence. The canonical current `System Gate` and Release 467 gates remain active.

## Historical authority compatibility boundary

`development-release.json` deliberately remains **INHERITED_REGRESSION_COMPATIBILITY** for still-valid historical assertions. Release 467 Build 9 retires obsolete automatic workflow triggers; it does not rewrite historical convergence evidence merely to make old version fields look current.

Historical compatibility evidence never overrides `current-development-authority.json`.

## Release 467 authority separation

### Builds 1–4

Builds 1–4 established the I.T. readiness control tower, recovery/readiness actions, authenticated browser runtime acceptance, and sanitized evidence/acceptance ledger. Their current Release 467 source authority is carried forward.

### Build 5 — CI / Cloudflare Access readiness

Build 5 — CI / Cloudflare Access readiness remains separate from browser acceptance and application-admin authentication. Canonical masked GitHub Actions references are `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`; secret values must never appear in UI, logs, artifacts or committed evidence.

**Production Promotion Readiness** remains the separate Build 5 HOLD/READY review authority. It does not deploy Production automatically.

### Release 467 Build 6 — Development Cloudflare Access acceptance harness

Release 467 Build 6 remains the dispatch-only Development Cloudflare Access service-token acceptance authority. Real Access acceptance remains `HOLD_EXTERNAL` until deliberately proven.

### Release 467 Build 7 — External Commercial Acceptance Bridge

Release 467 Build 7 — **External Commercial Acceptance Bridge** — remains the current operator visibility bridge for CAIP private media, Stripe Development, PayPal sandbox and Social/OAuth acceptance. Build 7 performs no provider action automatically.

### Release 467 Build 8 — Authority Convergence and Restart Safety

Release 467 Build 8 established the current restart pointer and separated current Release 467 authority from inherited compatibility evidence. Build 8 is Development green at `94a891d3cb0608a91550c90fb04acea05cff75b3`.

### Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction

Build 9 makes Release 466 Build 1–6 workflow files manual-only so current Release 467 work no longer produces false-red legacy fanout. Proof scripts/history remain available.

## Exact environment boundary

- source authority: `dev`
- Development target: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 9 schema/D1/R2 mutation: NONE

A chat, workstation, deployment or source commit is not a migration event. Historical migrations are never replayed merely because work resumed.

## External/provider acceptance remains bounded

External lanes remain truthfully **`HOLD_EXTERNAL`** unless separately and deliberately proven:

- Cloudflare Access service-token acceptance — Build 6 authority;
- Stripe Development/test acceptance — operator/provider controlled;
- PayPal sandbox acceptance — operator/provider controlled;
- Social/OAuth controlled acceptance — operator/provider controlled, publication closed;
- native GitHub rulesets — separate repository-setting authority;
- CAIP private media — use fresh Build 7 runtime evidence.

No real Stripe, PayPal, OAuth or Cloudflare Access execution is authorized merely because source gates are green.

## Main / Production boundary

The last source-head verification carried forward for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`; this is a source-head observation only, not proof of the deployed Production release.

Build 9 does not update `main`, contact Production resources, mutate Production D1/R2/business data, execute provider/payment/OAuth actions, change Cloudflare Access policy, expose secrets or authorize Production promotion.

## Permanent safety rules

- Development first; Production promotion requires a separately reviewed exact-green Development candidate.
- Production transactional/business data remain Production-owned.
- Request-time schema DDL remains forbidden.
- Canonical migrations remain forward-only and Development-first.
- Raw CAIP R2 deletion remains closed.
- Provider execution/publication remains closed outside deliberate acceptance.
- Secret values never belong in UI, logs, artifacts or handoff documents.
- Build 5 remains Production Promotion Readiness authority.
- Build 6 remains outer Access service-token authority.
- Build 7 remains external-commercial visibility authority.

## Next bounded work

Prove Build 9 with its dedicated source proof and canonical System Gate, merge only when current Release 467 checks are green, then re-prove the exact merged `dev` SHA. Do not reactivate Release 466 automatic workflow fanout.

After Build 9 closure, continue with the next non-provider application/release improvement unless we deliberately choose and authorize one of the external `HOLD_EXTERNAL` acceptance lanes.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build9-historical-ci-retirement.json`
4. `PROJECT_STATUS_AND_ROADMAP.md`
5. `SANITY_HEALTH_CHECK.md`
6. `docs/operations/RELEASE_467_BUILD_9_HISTORICAL_CI_RETIREMENT.md`
7. `release467-build8-authority-convergence.json`
8. `docs/operations/RELEASE_467_BUILD_8_AUTHORITY_CONVERGENCE.md`
9. `release467-build7-external-commercial-acceptance.json`
10. `release467-build6-access-acceptance-harness.json`
11. `release467-build5-production-promotion-readiness.json`
12. `release467-build5-ci-access-readiness.json`
13. `development-release.json` — compatibility evidence only

## Historical authority

Release 466 and earlier release/build files remain provenance and compatibility evidence. Their Build 1–6 workflow definitions are manual-only under Build 9 and cannot override current Release 467 authority.
