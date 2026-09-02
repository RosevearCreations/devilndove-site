# Devil n Dove — Sanity / Health Check

## Current authority

**Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** is the active Development source candidate.

Exact green predecessor: Release 467 Build 12 at `374983f68fb16172fb357b1755293a29e5d2953f`, tree `339f13b5a6e6ba5cc4a9c64ea3b04b70ad8aef91`.

- [x] Build 12 System Gate `33642231716` — SUCCESS.
- [x] Build 12 Proof `33642231794` — SUCCESS.
- [x] Build 12 exact Build 11 source base `ce42f3b2ea553b69085705f500a9e2bd2f689818` remains retained.
- [x] `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY**.
- [x] Runtime Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

## Locked Build 8 provenance sanity

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains locked historical provenance. Its exact Build 7 predecessor was `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, with System Gate `33591744817` and Build 7 Proof `33591744787` both SUCCESS. External acceptance remained `HOLD_EXTERNAL`.

## Build 13 repository cleanup

- [x] Exactly 39 obsolete Release 448–461 workflow definitions are designated for retirement.
- [x] Historical commits/scripts remain available in Git history.
- [x] Current `system-gate.yml` remains.
- [x] Development runtime acceptance remains.
- [x] Production Pages deploy and rollback readiness remain.
- [x] Release 463 environment/Cloudflare/D1/R2 infrastructure workflows remain.
- [x] Release 466 Build 1–6 manual-only proof workflows remain as required by Build 9 provenance.
- [x] Release 466 external provider/payment acceptance tooling remains bounded.
- [x] Release 467 current proof and acceptance workflows remain.
- [x] `scripts/repository_hygiene_gate.py` permanently rejects the retired workflow names.
- [x] Build 12 gate is forward-compatible with Build 13.
- [x] Build 13 changes no `functions/`, `public/` or `admin/` runtime source.

## Existing hygiene sanity

- [x] No `.bak`, `.old`, `.tmp`, `.orig`, `.rej` or editor-backup files ship.
- [x] No `tmp/`, `docs/archive/` or `docs/releases/` directory ships.
- [x] Obsolete root Build verification SQL artifacts are absent.
- [x] Storefront SEO/one-H1/structured-data checks remain in the canonical hygiene gate.
- [x] Private admin noindex checks remain guarded.

## Environment / schema sanity

- [x] Source authority: `dev`.
- [x] Preview: `https://dev.devilndove-site.pages.dev`.
- [x] D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Product R2: `devilndove-toolshed-images-dev`.
- [x] CAIP R2: `devilndove-caip-media-dev`.
- [x] Canonical migrations remain exactly `0001`–`0004`.
- [x] Build 13 adds no migration and no request-time DDL.
- [x] Build 13 authorizes no D1/R2 mutation.

## Branch cleanup sanity

- [x] Preserve `main`.
- [x] Preserve `dev`.
- [x] Preserve `backup-main-before-dev-replacement-20260830` as rollback/safety history.
- [x] Merged/superseded Release 467 feature branches are safe prune candidates only after reachability from `dev` is verified.
- [x] No force update or branch-history rewrite is part of Build 13.

## External acceptance sanity

- [ ] Cloudflare Access service token — `HOLD_EXTERNAL`.
- [ ] Stripe Development — `HOLD_EXTERNAL`.
- [ ] PayPal sandbox — `HOLD_EXTERNAL`.
- [ ] Social/OAuth — `HOLD_EXTERNAL`.
- [ ] CAIP private media — use fresh Build 7 evidence.

- [x] Provider/payment/refund/OAuth execution from Build 13: NONE.
- [x] Cloudflare Access policy mutation from Build 13: NONE.
- [x] Secret values emitted by Build 13: NONE.

## Main / Production sanity

- [x] `main` remains Build 11 SHA `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`.
- [x] Production Pages Deploy `33640133776` — SUCCESS.
- [x] Build 12 and Build 13 remain Development-only.
- [x] Build 13 does not contact or mutate Production.

## Current verdict

Release 467 Build 12 is the exact proven Development predecessor. Release 467 Build 13 is a runtime-neutral Repository Hygiene candidate that removes stale live CI definitions only where a newer canonical authority exists, while preserving required history, compatibility evidence and safety tooling. External lanes remain truthfully `HOLD_EXTERNAL`.
