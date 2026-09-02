# Release 467 Build 8 — Authority Convergence & Restart Safety

## Purpose

Release 467 Build 8 removes restart ambiguity after the Development-green Build 7 merge. The current restart authority is now `current-development-authority.json`, followed by `AI_HANDOFF.md`.

Build 8 is documentation/release-mechanics work only. It does not change schema, mutate D1/R2, execute or publish through providers, change Cloudflare Access, update `main`, contact Production resources, or authorize Production promotion.

## Proven predecessor

Release 467 Build 7 is the exact predecessor:

- merged Development commit: `5eef764a67466dc2989a4681c6a7cc782b9d4df9`
- tree: `f7327733dc423982016829d717521ceab2029f35`
- System Gate: `33591744817` — SUCCESS
- Build 7 proof: `33591744787` — SUCCESS

Build 8 must preserve those facts until its own exact merged Development closure is proven.

## Current authority contract

Read in this order on a new chat/workstation/restart:

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build8-authority-convergence.json`
4. `PROJECT_STATUS_AND_ROADMAP.md`
5. `SANITY_HEALTH_CHECK.md`
6. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`

The current pointer makes Release 467 explicit and keeps the Build 5 Production Promotion Readiness, Build 6 Cloudflare Access acceptance, and Build 7 external-commercial acceptance lanes separate.

## Why `development-release.json` remains Release 466

`development-release.json` is retained as **INHERITED_REGRESSION_COMPATIBILITY** evidence. Several still-valid Release 466 regression gates intentionally assert its historical convergence fields. Rewriting it to Release 467 would break those inherited proofs without improving runtime safety.

Therefore:

- it is not the first restart file;
- it does not override `current-development-authority.json`;
- its top-level Release 466 compatibility fields remain intact until inherited gates are deliberately migrated away from them;
- historical compatibility evidence must not be mistaken for the current Development release.

## External acceptance

Build 8 does not manufacture external evidence. These remain separately controlled:

- Cloudflare Access service-token acceptance — `HOLD_EXTERNAL` unless the Build 6 deliberate Development-only workflow succeeds;
- Stripe Development acceptance — `HOLD_EXTERNAL` until deliberate test-mode evidence succeeds;
- PayPal sandbox acceptance — `HOLD_EXTERNAL` until deliberate sandbox evidence succeeds;
- Social/OAuth acceptance — `HOLD_EXTERNAL` until controlled intended-account lifecycle evidence succeeds;
- CAIP private media — use fresh Build 7 runtime evidence rather than stale historical release wording;
- native GitHub rulesets — external repository-setting authority remains separate.

## Safety boundary

Build 8 authorizes none of the following:

- schema or request-time DDL;
- D1 or R2 mutation;
- payment/provider execution or publication;
- Cloudflare Access policy/token mutation;
- `main` mutation;
- Production mutation or data copying;
- secret-value display or persistence.

Production promotion remains governed by `release467-build5-production-promotion-readiness.json` and requires a separately reviewed exact-green Development candidate.

## Source proof

The fail-closed source gate is `scripts/release467_build8_gate.py`. It proves that the current pointer, restart documents and Build 8 manifest agree; that Build 7 remains the predecessor; that canonical migrations remain exactly `0001`–`0004`; and that `development-release.json` remains compatibility evidence rather than current authority.

The CI proof is `.github/workflows/release467-build8-proof.yml`.
