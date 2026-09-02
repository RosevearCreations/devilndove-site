# Devil n Dove — Project Status & Roadmap

## Current release

**Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics** is the active Development source candidate.

Its exact Development-green predecessor is **Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction**, merged to `dev` at `d8a9ffba03f980b9632643d91d9aa69b25bd94fd`, tree `949f2523d31e0f47ed1e19ff7655de2762fbc1df`, with System Gate `33633043297` and Build 9 proof `33633043229` both successful.

The current restart pointer is `current-development-authority.json`. `development-release.json` remains inherited Release 466 regression compatibility and the middleware Release 466 header remains explicit runtime compatibility; neither is the current Release 467 selector.

## Release 467 progression

| Build | Theme | Current state |
|---|---|---|
| 1 | I.T. readiness control tower and root-admin/module authority | Development source merged |
| 2 | Readiness actions and recovery queue | Development source merged |
| 3 | Same-origin authenticated browser runtime acceptance | Development source merged |
| 4 | Sanitized evidence and acceptance ledger | Development source merged |
| 5 | CI/Cloudflare Access readiness plus separate Production Promotion Readiness | Source green; external/promotion decisions separate |
| 6 | Development Cloudflare Access service-token acceptance harness | Harness green; real Access `HOLD_EXTERNAL` |
| 7 | External Commercial Acceptance Bridge | Source green; real external lanes bounded |
| 8 | Authority Convergence and Restart Safety | Development green |
| 9 | Historical CI Retirement & Gate Fanout Reduction | Development green at `d8a9ffba…` |
| 10 | I.T. Control Tower Consolidation and Self-Diagnostics | Active Development candidate |

## Build 10 scope

Build 10 makes `/admin/it/` the operational first stop instead of requiring the operator to interpret multiple older Build 1–7 panels before knowing what matters now.

It adds:

- `/api/admin/it-operations-control-tower` as a read-only wrapper around the existing subsystem preflight engine;
- current Release 467 Build 10 and exact last-green Build 9 evidence;
- Development target, D1/R2 and runtime SHA/host summary;
- root-admin, profile, module, D1 migration/proof and foreign-key headline metrics;
- one severity-sorted recovery queue generated from existing subsystem findings;
- explicit external acceptance policy states that remain separate from runtime evidence;
- explicit labeling of Release 466 runtime/regression metadata as inherited compatibility rather than current authority.

The endpoint performs no automatic permission repair, schema work, data mutation or provider action. Build 10 is schema-neutral and canonical migrations remain exactly `0001`–`0004`.

## Current I.T. operating model

The top I.T. Control Tower answers four questions first:

1. **What exact release/build are we working on, and what was the last proven Development predecessor?**
2. **Are Development D1/R2, root-admin/module authority and runtime ancestry healthy?**
3. **What is blocking or needs attention next?**
4. **Which external lanes remain policy HOLDs even if source/runtime checks are green?**

Builds 2–7 remain visible below as bounded specialist evidence lanes. Build 10 does not collapse or falsely promote those authorities.

## External acceptance remains separate

- Cloudflare Access service-token lane — `HOLD_EXTERNAL` until deliberate Build 6 evidence succeeds.
- Stripe Development — `HOLD_EXTERNAL` until deliberate test evidence succeeds.
- PayPal sandbox — `HOLD_EXTERNAL` until deliberate sandbox evidence succeeds.
- Social/OAuth — `HOLD_EXTERNAL` until deliberate intended-account lifecycle evidence succeeds with publication closed.
- CAIP private media — use fresh Build 7 runtime evidence.

No credential or provider action is executed merely to make the I.T. dashboard green.

## Development boundary

- Source branch: `dev`.
- Canonical Development target: `https://dev.devilndove-site.pages.dev`.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Product R2: `devilndove-toolshed-images-dev`.
- CAIP private R2: `devilndove-caip-media-dev`.
- Canonical migrations: `0001`–`0004`; Build 10 adds none.

## Main / Production boundary

The carried-forward source-head observation for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`. The exact deployed Production release must still be verified independently before any future promotion decision.

Build 10 does not update `main`, contact Production resources, mutate Production D1/R2/business data, execute Production providers, change Cloudflare Access policy, or authorize deployment. Production promotion remains governed separately by `release467-build5-production-promotion-readiness.json` for one exact reviewed Development candidate.

## Next bounded work

First make Build 10 proof and current Release 467/System gates green, merge to `dev`, and prove/deploy the exact merged Development SHA.

After Build 10 closure, use the consolidated I.T. recovery queue to select the next non-provider application improvement. External `HOLD_EXTERNAL` lanes remain deliberate acceptance work, not a reason to manufacture green status.

## Permanent boundaries

Development first. Production transactional/business data remain Production-owned. Historical migrations are not replayed on restart. Request-time DDL, raw R2 deletion, automatic business-data restore, automatic schema reversal, unbounded provider execution/publication, main-only application patches, secret-value exposure and automatic Production promotion remain closed.
