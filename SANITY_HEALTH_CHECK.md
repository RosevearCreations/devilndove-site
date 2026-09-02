# Devil n Dove — Sanity / Health Check

## Current authority

**Release 467 Build 8 — Authority Convergence and Restart Safety** is the active Development source candidate.

The exact green predecessor is Release 467 Build 7 at `5eef764a67466dc2989a4681c6a7cc782b9d4df9` with tree `f7327733dc423982016829d717521ceab2029f35`.

- [x] Build 7 System Gate `33591744817` — SUCCESS.
- [x] Build 7 Proof `33591744787` — SUCCESS.
- [x] `current-development-authority.json` is the current Release 467 restart pointer.
- [x] `development-release.json` is retained as **INHERITED_REGRESSION_COMPATIBILITY**, not the current restart pointer.

## Build 8 authority convergence

- [x] Build 8 has a dedicated manifest: `release467-build8-authority-convergence.json`.
- [x] Build 8 has a fail-closed source gate: `scripts/release467_build8_gate.py`.
- [x] Build 8 has a dedicated source-proof workflow: `.github/workflows/release467-build8-proof.yml`.
- [x] The Markdown index now starts with the current Release 467 pointer.
- [x] The project roadmap no longer declares Release 466 current.
- [x] The sanity file no longer declares Release 466 current.
- [x] The I.T. startup guide reads current authority before compatibility evidence.
- [x] Inherited Release 466 compatibility fields remain intact for still-valid old regression gates.

## Environment boundary

- [x] Source authority remains `dev`.
- [x] Development Preview remains `https://dev.devilndove-site.pages.dev`.
- [x] Development D1 remains `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product R2 remains `devilndove-toolshed-images-dev`.
- [x] Development CAIP R2 remains `devilndove-caip-media-dev`.
- [x] Build 8 authorizes no D1/R2 mutation.
- [x] Build 8 authorizes no Cloudflare Access mutation.
- [x] Build 8 authorizes no `main` mutation.
- [x] Build 8 authorizes no Production mutation.

## D1 / schema sanity

- [x] Canonical migration stream remains exactly `0001`–`0004`.
- [x] Build 8 adds no migration.
- [x] Request-time schema DDL remains forbidden.
- [x] A new chat/workstation/deployment is not a migration event.
- [x] `development-release.json` Release 466 fields are preserved only because inherited regression gates still consume them.

## External acceptance sanity

Build 8 source green and external acceptance are intentionally independent.

- [ ] Cloudflare Access service-token acceptance — `HOLD_EXTERNAL` until deliberate Build 6 Development-only evidence succeeds.
- [ ] Stripe Development acceptance — `HOLD_EXTERNAL` until deliberate test-mode evidence succeeds.
- [ ] PayPal sandbox acceptance — `HOLD_EXTERNAL` until deliberate sandbox evidence succeeds.
- [ ] Social/OAuth controlled acceptance — `HOLD_EXTERNAL` until deliberate intended-account lifecycle evidence succeeds.
- [ ] Native GitHub rulesets — separate external repository-setting authority.
- [ ] CAIP private-media current state — use fresh Build 7 runtime evidence; do not infer it from historical release wording.

- [x] Provider execution from Build 8: NONE.
- [x] Provider publication from Build 8: NONE.
- [x] Payment/refund execution from Build 8: NONE.
- [x] OAuth connect/revoke from Build 8: NONE.
- [x] Secret values inspected/emitted by Build 8: NONE.

## Main / Production sanity

The last source-head verification before Build 8 found `main` at `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`. This is not proof of the currently deployed Production release.

- [x] Build 8 does not update `main`.
- [x] Build 8 does not contact Production resources.
- [x] Build 8 does not copy Development business data to Production.
- [x] Production promotion remains a separate exact-candidate review under Release 467 Build 5 Production Promotion Readiness.

## Current verdict

Release 467 Build 7 is the exact proven Development predecessor. Release 467 Build 8 is a bounded authority-convergence candidate that repairs stale restart documentation without changing application data, schema, providers, Access, `main` or Production. External lanes remain truthfully `HOLD_EXTERNAL` until independently accepted.
