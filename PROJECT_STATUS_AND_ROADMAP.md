# Devil n Dove — Project Status & Roadmap

## Current release

**Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction** is the active Development source candidate.

Its exact Development-green predecessor is **Release 467 Build 8 — Authority Convergence and Restart Safety**, merged to `dev` at `94a891d3cb0608a91550c90fb04acea05cff75b3`, with System Gate `33631757568` and Build 8 proof `33631758140` both successful.

Build 8 itself preserved Release 467 Build 7 predecessor evidence at `5eef764a67466dc2989a4681c6a7cc782b9d4df9`; real external lanes remain `HOLD_EXTERNAL`.

The current restart pointer is `current-development-authority.json`. `development-release.json` remains inherited Release 466 regression compatibility and must not be treated as the current Release 467 selector.

## Release 467 progression

| Build | Theme | Current state |
|---|---|---|
| 1 | I.T. readiness control tower and root-admin/module authority | Development source merged |
| 2 | Readiness actions and recovery queue | Development source merged |
| 3 | Same-origin authenticated browser runtime acceptance | Development source merged |
| 4 | Sanitized evidence and acceptance ledger | Development source merged |
| 5 | CI/Cloudflare Access readiness plus separate Production Promotion Readiness | Source green; external/promotion decisions separate |
| 6 | Development Cloudflare Access service-token acceptance harness | Development-proven harness; real Access `HOLD_EXTERNAL` |
| 7 | External Commercial Acceptance Bridge | Merged/source green; real external lanes bounded |
| 8 | Authority Convergence and Restart Safety | Development green at `94a891d3…` |
| 9 | Historical CI Retirement & Gate Fanout Reduction | Active Development candidate |

## Build 9 scope

Build 9 removes obsolete automatic Release 466 Build 1–6 workflow fanout from current `dev` pushes and pull requests. Those workflow files become `workflow_dispatch`-only provenance; their proof scripts and historical GitHub Actions evidence remain available.

This addresses the concrete Build 8 merge symptom: all current Release 467 gates were green while several inherited Release 466 workflows produced false-red checks solely because their handoff assertions belonged to an older authority model.

Build 9 also makes the Build 8 authority gate forward-compatible with newer Release 467 pointers while keeping the original Build 8 manifest and predecessor evidence locked.

Build 9 is schema-neutral. Canonical migrations remain exactly `0001`–`0004`.

## Current CI authority

Automatic current-development CI remains centered on:

- canonical `System Gate`;
- Release 467 proof workflows;
- current I.T./Admin runtime source authority;
- any deliberately scoped current-release workflow.

Release 466 Build 1–6 workflows are historical/manual evidence only and no longer determine whether new Release 467 work is green.

## External acceptance remains separate

- Cloudflare Access service-token lane — `HOLD_EXTERNAL` until deliberate Build 6 evidence succeeds.
- Stripe Development — `HOLD_EXTERNAL` until deliberate test evidence succeeds.
- PayPal sandbox — `HOLD_EXTERNAL` until deliberate sandbox evidence succeeds.
- Social/OAuth — `HOLD_EXTERNAL` until deliberate intended-account lifecycle evidence succeeds with publication closed.
- CAIP private media — use fresh Build 7 runtime evidence.

No credential or provider action is executed merely to make a dashboard green.

## Development boundary

- Source branch: `dev`.
- Canonical Development target: `https://dev.devilndove-site.pages.dev`.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Product R2: `devilndove-toolshed-images-dev`.
- CAIP private R2: `devilndove-caip-media-dev`.
- Canonical migrations: `0001`–`0004`; Build 9 adds none.

## Main / Production boundary

The carried-forward source-head observation for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`. The exact deployed Production release must still be verified independently before any future promotion decision.

Build 9 does not update `main`, contact Production resources, mutate Production D1/R2/business data, execute Production providers, change Cloudflare Access policy, or authorize deployment. Production promotion remains governed separately by `release467-build5-production-promotion-readiness.json` for one exact reviewed Development candidate.

## Next bounded work

Make Build 9 source proof and canonical System Gate green, merge to `dev`, then verify the exact merged SHA. Once Build 9 is closed, move to the next non-provider application/release improvement unless an external `HOLD_EXTERNAL` lane is deliberately authorized for acceptance.

## Permanent boundaries

Development first. Production transactional/business data remain Production-owned. Historical migrations are not replayed on restart. Request-time DDL, raw R2 deletion, automatic business-data restore, automatic schema reversal, unbounded provider execution/publication, main-only application patches, secret-value exposure and automatic Production promotion remain closed.
