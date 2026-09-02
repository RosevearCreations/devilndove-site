# Devil n Dove — Sanity / Health Check

## Current authority

**Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction** is the active Development source candidate.

The exact green predecessor is **Release 467 Build 8 — Authority Convergence and Restart Safety** at `94a891d3cb0608a91550c90fb04acea05cff75b3` with tree `09d9f822c9987d3422921e819c913427af664184`.

- [x] Build 8 System Gate `33631757568` — SUCCESS.
- [x] Build 8 Proof `33631758140` — SUCCESS.
- [x] `current-development-authority.json` identifies Build 9 and preserves Build 8 as last-green.
- [x] `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY**.

Build 8 retained its locked predecessor evidence: Release 467 Build 7 `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, System Gate `33591744817`, Build 7 Proof `33591744787`.

## Build 9 historical CI retirement

- [x] Release 466 Build 1 Proof is `workflow_dispatch` only.
- [x] Release 466 Build 2 Proof is `workflow_dispatch` only.
- [x] Release 466 Build 3 Proof is `workflow_dispatch` only.
- [x] Release 466 Build 4 Proof is `workflow_dispatch` only.
- [x] Release 466 Build 5 Proof is `workflow_dispatch` only.
- [x] Release 466 Build 6 Proof is `workflow_dispatch` only.
- [x] Historical `scripts/release466_build1_gate.py` through `release466_build6_gate.py` remain in source.
- [x] Historical Git/Actions history remains available.
- [x] Current Release 467/System Gate workflows remain active.
- [x] Build 8 gate is forward-compatible with Build 9+ pointers without changing locked Build 8 manifest evidence.

## Environment boundary

- [x] Source authority remains `dev`.
- [x] Development Preview remains `https://dev.devilndove-site.pages.dev`.
- [x] Development D1 remains `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product R2 remains `devilndove-toolshed-images-dev`.
- [x] Development CAIP R2 remains `devilndove-caip-media-dev`.
- [x] Build 9 authorizes no D1/R2 mutation.
- [x] Build 9 authorizes no Cloudflare Access mutation.
- [x] Build 9 authorizes no `main` mutation.
- [x] Build 9 authorizes no Production mutation.

## D1 / schema sanity

- [x] Canonical migration stream remains exactly `0001`–`0004`.
- [x] Build 9 adds no migration.
- [x] Request-time schema DDL remains forbidden.
- [x] A new chat/workstation/deployment is not a migration event.

## External acceptance sanity

Build 9 source state and external acceptance are intentionally independent.

- [ ] Cloudflare Access service-token acceptance — `HOLD_EXTERNAL` until deliberate Build 6 evidence succeeds.
- [ ] Stripe Development acceptance — `HOLD_EXTERNAL` until deliberate test-mode evidence succeeds.
- [ ] PayPal sandbox acceptance — `HOLD_EXTERNAL` until deliberate sandbox evidence succeeds.
- [ ] Social/OAuth controlled acceptance — `HOLD_EXTERNAL` until deliberate intended-account evidence succeeds.
- [ ] CAIP private-media current state — use fresh Build 7 runtime evidence.

- [x] Provider execution from Build 9: NONE.
- [x] Provider publication from Build 9: NONE.
- [x] Payment/refund execution from Build 9: NONE.
- [x] OAuth connect/revoke from Build 9: NONE.
- [x] Secret values inspected/emitted by Build 9: NONE.

## Main / Production sanity

The carried-forward source-head observation for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`; this is not proof of the currently deployed Production release.

- [x] Build 9 does not update `main`.
- [x] Build 9 does not contact Production resources.
- [x] Build 9 does not copy Development business data to Production.
- [x] Production promotion remains a separate exact-candidate review under Release 467 Build 5 Production Promotion Readiness.

## Current verdict

Release 467 Build 8 is the exact proven Development predecessor. Release 467 Build 9 is a bounded CI/release-mechanics candidate that removes obsolete Release 466 automatic fanout while retaining historical provenance. External lanes remain truthfully `HOLD_EXTERNAL`.
