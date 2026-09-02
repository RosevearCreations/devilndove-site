# Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup

## Purpose

Build 13 removes stale live CI definitions without rewriting application runtime or erasing historical Git evidence.

Exact predecessor: Release 467 Build 12 merged `dev` `374983f68fb16172fb357b1755293a29e5d2953f`, tree `339f13b5a6e6ba5cc4a9c64ea3b04b70ad8aef91`, System Gate `33642231716` SUCCESS, Build 12 Proof `33642231794` SUCCESS.

## Cleanup decision

The canonical repository hygiene gate already proves that backup/temp artifacts and obsolete root Build verification files are absent. The remaining stale live surface is primarily release-specific GitHub Actions definitions from Releases 448–461 that have been superseded by System Gate, Release 463 infrastructure authorities and current Release 467 proofs.

Build 13 retires exactly 39 such workflow files. Their commits remain in Git history.

## Retained authorities

Build 13 deliberately keeps:

- `system-gate.yml`;
- `development-runtime-acceptance.yml`;
- `production-pages-deploy-current.yml` and `production-rollback-readiness.yml`;
- Release 463 Cloudflare inventory, D1 consolidation/clone, native Pages freeze/prune and R2 consolidation workflows;
- Release 466 Build 1–6 proof workflows as manual-only provenance required by Release 467 Build 9;
- Release 466 bounded provider/payment acceptance workflows;
- Release 467 Build 1–13 proof/acceptance workflows and current source gates;
- historical authority documents/scripts that current regression contracts still reference.

## Permanent prevention

`scripts/repository_hygiene_gate.py` contains the Build 13 retired-workflow set and fails if any of those names return to `.github/workflows/`.

## Branch hygiene

Preserve `main`, `dev` and `backup-main-before-dev-replacement-20260830`. Merged or superseded Release 467 feature branches are prune candidates after reachability from `dev` is confirmed. Branch ref deletion is repository administration and is not simulated by moving refs.

## Safety boundary

- Application runtime changes: NONE.
- Schema migration: NONE; canonical migrations remain exactly `0001`–`0004`.
- D1/R2 mutation authority: NONE.
- Provider/payment/OAuth execution/publication: NONE.
- Cloudflare Access policy mutation: NONE.
- `main` mutation: NONE.
- Production contact/mutation: NONE.
- Secret values emitted: NONE.
- External acceptance: `HOLD_EXTERNAL` unless separately proven.

Production remains Build 11 at `ce42f3b2ea553b69085705f500a9e2bd2f689818`, Production Pages Deploy `33640133776` SUCCESS. Build 12 and Build 13 remain Development-only unless a separate Production promotion is explicitly authorized.

## Acceptance

Build 13 is complete only when its dedicated proof, all current Release 467/System PR checks, merged Build 13 proof, canonical System Gate, exact Development Preview binding proof and smoke acceptance are green on the same merged SHA.
