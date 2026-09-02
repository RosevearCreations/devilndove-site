# Devil n Dove — Project Status & Roadmap

## Current release

**Release 467 Build 8 — Authority Convergence and Restart Safety** is the active Development source candidate.

Its exact green predecessor is Release 467 Build 7, merged to `dev` at `5eef764a67466dc2989a4681c6a7cc782b9d4df9`. Build 7 passed System Gate `33591744817` and Release 467 Build 7 Proof `33591744787`.

The current restart pointer is `current-development-authority.json`. `development-release.json` remains inherited Release 466 regression compatibility and must not be treated as the current Release 467 selector.

## Release 467 progression

| Build | Theme | Current state |
|---|---|---|
| 1 | I.T. readiness control tower and root-admin/module authority | Development source merged |
| 2 | Readiness actions and recovery queue | Development source merged |
| 3 | Same-origin authenticated browser runtime acceptance | Development source merged |
| 4 | Sanitized evidence and acceptance ledger | Development source merged |
| 5 | CI/Cloudflare Access readiness plus separate Production Promotion Readiness | Source green; external/promotion decisions remain separate |
| 6 | Development Cloudflare Access service-token acceptance harness | Development-proven harness; real Access acceptance `HOLD_EXTERNAL` |
| 7 | External Commercial Acceptance Bridge | Merged and source green on `5eef764a…`; real external lanes remain bounded |
| 8 | Authority Convergence and Restart Safety | Active Development candidate |

Build 8 closes a release-management defect rather than adding business functionality: the project roadmap, sanity file, Markdown index and startup guide still contained Release 462/466-era “current release” wording after Release 467 was already active. Build 8 creates one current pointer and a fail-closed gate so future restarts cannot silently regress to stale authority.

## Build 8 scope

Build 8 adds and converges:

- `current-development-authority.json` as the current Release 467 restart pointer;
- `release467-build8-authority-convergence.json` as the Build 8 contract;
- `scripts/release467_build8_gate.py` as the source authority-drift gate;
- `.github/workflows/release467-build8-proof.yml` as the independent proof;
- current handoff, roadmap, sanity, Markdown index and I.T. preflight wording;
- explicit preservation of `development-release.json` as inherited regression compatibility until dependent old gates are deliberately migrated.

Build 8 is schema-neutral. Canonical migrations remain exactly `0001`–`0004`.

## External acceptance remains separate

A source-green Build 8 does not make external evidence green. Current external boundaries remain:

- Cloudflare Access service-token lane — `HOLD_EXTERNAL` until the deliberate Build 6 Development-only acceptance succeeds;
- Stripe Development — `HOLD_EXTERNAL` until test-mode checkout/webhook/reconciliation/idempotent refund evidence is deliberately completed;
- PayPal sandbox — `HOLD_EXTERNAL` until sandbox approval/capture/webhook/reconciliation/idempotent refund evidence is deliberately completed;
- Social/OAuth — `HOLD_EXTERNAL` until intended-provider/account lifecycle evidence is deliberately completed with publication closed;
- native GitHub rulesets — external repository-setting authority remains separate;
- CAIP private media — evaluate from fresh current Build 7 runtime evidence; do not promote stale historical wording into current acceptance.

No credential or provider action is executed merely to make a dashboard green.

## Development boundary

- Source branch: `dev`.
- Canonical Development target: `https://dev.devilndove-site.pages.dev`.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Product R2: `devilndove-toolshed-images-dev`.
- CAIP private R2: `devilndove-caip-media-dev`.
- Canonical migrations: `0001`–`0004`; Build 8 adds none.

## Main / Production boundary

The last source-head verification performed before Build 8 found `main` at `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`. That is a **source-head fact only**; the exact deployed Production release must be verified independently before any future promotion decision.

Build 8 does not update `main`, contact Production resources, mutate Production D1/R2/business data, execute Production providers, or authorize deployment. Production promotion remains governed by `release467-build5-production-promotion-readiness.json` for one separately reviewed exact-green Development candidate.

## Next bounded work

First make Build 8 source/proof/System Gate green on its feature branch, merge it to `dev`, and re-prove the exact merged Development SHA.

After Build 8 closure, choose the highest-priority external lane only when the required operator authorization/credentials are deliberately available. If they are not available, keep that lane at `HOLD_EXTERNAL` and continue with another non-provider release-mechanics or application improvement rather than manufacturing acceptance evidence.

## Permanent boundaries

Development first. Production transactional/business data remain Production-owned. Historical migrations are not replayed on chat/workstation startup. Request-time DDL, raw R2 deletion, automatic business-data restore, automatic schema reversal, unbounded provider execution/publication, main-only application patches, secret-value exposure and automatic Production promotion remain closed.
