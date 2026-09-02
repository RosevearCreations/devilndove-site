# Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction

## Purpose

Build 9 removes obsolete Release 466 Build 1–6 automatic GitHub Actions fanout from current Release 467 development while retaining historical proof source and evidence.

The exact predecessor is Release 467 Build 8 merged to `dev` at `94a891d3cb0608a91550c90fb04acea05cff75b3` (tree `09d9f822c9987d3422921e819c913427af664184`). Build 8 System Gate `33631757568` and Build 8 Authority Convergence Proof `33631758140` are successful.

## Change

These historical workflows are now `workflow_dispatch` only:

- `.github/workflows/release466-build1-proof.yml`
- `.github/workflows/release466-build2-proof.yml`
- `.github/workflows/release466-build3-proof.yml`
- `.github/workflows/release466-build4-proof.yml`
- `.github/workflows/release466-build5-proof.yml`
- `.github/workflows/release466-build6-proof.yml`

They no longer auto-run on `dev` push or pull-request events.

## What remains

- Release 466 proof scripts remain in source for provenance/regression inspection.
- Existing Git commit history remains intact.
- Existing GitHub Actions runs and artifacts remain historical evidence.
- `development-release.json` remains `INHERITED_REGRESSION_COMPATIBILITY` where still consumed by historical assertions.
- Canonical `System Gate` and current Release 467 workflows remain active.
- Release 467 Build 8 gate is forward-compatible with newer Release 467 pointers while its locked Build 8 manifest/predecessor evidence remains unchanged.

## Safety boundary

Build 9 is schema-neutral and operationally non-invasive:

- canonical migrations remain exactly `0001`–`0004`;
- D1 mutation: NONE;
- R2 mutation: NONE;
- provider/payment/OAuth execution: NONE;
- provider publication: NONE;
- Cloudflare Access policy mutation: NONE;
- `main` mutation: NONE;
- Production mutation/contact: NONE;
- secret values inspected/emitted: NONE.

External acceptance remains `HOLD_EXTERNAL` unless separately and deliberately proven through its owning Release 467 acceptance lane.

## Acceptance

Build 9 is acceptable only when:

1. `scripts/release467_build9_gate.py` proves all six Release 466 workflow trigger headers are manual-only;
2. historical Release 466 gate scripts still exist;
3. Build 8 authority remains valid under the newer pointer;
4. no migration/SQL file changes exist;
5. Build 9 proof is green;
6. canonical System Gate is green on the exact candidate;
7. after merge, the exact merged `dev` SHA is re-proven without Release 466 automatic fanout.
