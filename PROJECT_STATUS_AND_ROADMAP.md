# Devil n Dove — Project Status & Roadmap

## Current release

**Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** is the active Development source candidate.

Exact Development-green predecessor: **Release 467 Build 12 — Finance Operations Command Center**, merged `dev` `374983f68fb16172fb357b1755293a29e5d2953f`, tree `339f13b5a6e6ba5cc4a9c64ea3b04b70ad8aef91`, System Gate `33642231716` SUCCESS, Build 12 Proof `33642231794` SUCCESS.

Build 12 retains its exact Build 11 source base `ce42f3b2ea553b69085705f500a9e2bd2f689818`. `current-development-authority.json` remains the restart selector. `development-release.json` remains Release 466 **INHERITED_REGRESSION_COMPATIBILITY** and the runtime Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

## Release 467 progression

| Build | Theme | State |
|---|---|---|
| 1–4 | I.T. readiness, recovery, runtime acceptance, evidence ledger | Development merged |
| 5 | CI/Access readiness + Production Promotion Readiness | Source green; external/promotion separate |
| 6 | Development Access acceptance harness | Harness green; real Access `HOLD_EXTERNAL` |
| 7 | External Commercial Acceptance Bridge | Source green; external lanes bounded |
| 8 | Authority Convergence and Restart Safety | Development green |
| 9 | Historical CI Retirement & Gate Fanout Reduction | Development green |
| 10 | I.T. Control Tower Consolidation | Development green |
| 11 | Admin Operations Command Center | Development + Production green at `ce42f3b2…` |
| 12 | Finance Operations Command Center | Development green at `374983f6…` |
| 13 | Repository Hygiene and Historical CI Cleanup | Active Development candidate |

## Locked Build 8 provenance

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains retained provenance. Its locked predecessor was Release 467 Build 7 at `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, with System Gate `33591744817` and Build 7 Proof `33591744787` both successful. Real external acceptance remained `HOLD_EXTERNAL`; these historical facts remain regression evidence and do not override current Build 13 authority.

## Build 13 scope

Build 13 is repository-only maintenance. It removes 39 obsolete Release 448–461 GitHub Actions workflow definitions from the live source tree after confirming the current application is governed by the canonical System Gate, Release 463 environment authorities, Release 466 compatibility/acceptance authorities and Release 467 current proof workflows.

The cleanup deliberately retains:

- `system-gate.yml`;
- Development runtime acceptance;
- Production Pages deploy and rollback readiness;
- Release 463 Cloudflare/D1/R2 infrastructure workflows;
- Release 466 Build 1–6 manual-only proof workflows required by Build 9 historical provenance;
- Release 466 provider/payment acceptance tooling still used for bounded external lanes;
- all current Release 467 proof/acceptance workflows and source gates;
- historical scripts, commits and authority documents still referenced by current regression contracts.

`scripts/repository_hygiene_gate.py` now permanently rejects the retired workflow names if they are reintroduced.

## File-audit result

The existing repository hygiene gate already proves that `.bak`, `.old`, `.tmp`, `.orig`, `.rej`, editor backup files, `tmp/`, `docs/archive/`, `docs/releases/` and obsolete root Build verification artifacts are absent. Build 13 therefore removes only stale material with a clear current-authority replacement rather than deleting historical evidence indiscriminately.

## Branch cleanup model

Preserve `main`, `dev`, and `backup-main-before-dev-replacement-20260830`. Merged/superseded Release 467 feature branches are prune candidates once their commits are reachable from `dev`. The source cleanup does not rewrite or force branch refs.

## Development boundary

- Source: `dev`.
- Preview: `https://dev.devilndove-site.pages.dev`.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Product R2: `devilndove-toolshed-images-dev`.
- CAIP R2: `devilndove-caip-media-dev`.
- Canonical migrations: exactly `0001`–`0004`.
- Build 13 migration: NONE.
- Application runtime changes: NONE.
- New D1/R2 mutation authority: NONE.

## External acceptance

Cloudflare Access service-token, Stripe Development, PayPal sandbox and Social/OAuth remain **`HOLD_EXTERNAL`** until deliberate acceptance. CAIP private-media status uses fresh Build 7 evidence. Repository cleanup does not authorize provider execution.

## Main / Production boundary

`main` remains exact Build 11 `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`. Production Pages Deploy `33640133776` succeeded on that SHA. Build 12 and Build 13 remain Development-only. Build 13 does not update `main`, contact Production resources, mutate Production data or authorize promotion.

## Next bounded work

Prove Build 13 and merge it only after all current Release 467/System checks are green. Re-prove the exact merged Development SHA. After cleanup, return to substantive Storefront/Creator work; do not turn historical cleanup into a reason to remove still-referenced compatibility authorities.

## Permanent boundaries

Development first. Production data remain Production-owned. Request-time DDL, historical-migration replay on restart, raw R2 deletion, automatic provider execution/publication, secret-value exposure and automatic Production promotion remain closed. Production Promotion Readiness remains Build 5 authority. External lanes remain `HOLD_EXTERNAL` until deliberately proven.
