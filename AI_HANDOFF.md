# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 8 — Authority Convergence and Restart Safety** is the active Development source candidate.

Start every new chat/workstation/restart by reading `current-development-authority.json`, then this file. Do **not** use `development-release.json` as the current Release 467 selector: its role is deliberately **INHERITED_REGRESSION_COMPATIBILITY** for still-valid Release 466 gates.

Release 467 Build 7 is the exact proven predecessor:

- merged `dev` commit: `5eef764a67466dc2989a4681c6a7cc782b9d4df9`
- tree: `f7327733dc423982016829d717521ceab2029f35`
- System Gate `33591744817` — SUCCESS
- Release 467 Build 7 Proof `33591744787` — SUCCESS

Build 8 repairs authority/restart drift only. It does not add schema, mutate D1/R2, execute providers, publish providers, change Cloudflare Access, update `main`, contact Production resources, expose secrets or authorize Production promotion.

## Build 8 technical authority

- current pointer: `current-development-authority.json`
- Build 8 manifest: `release467-build8-authority-convergence.json`
- source gate: `scripts/release467_build8_gate.py`
- source proof: `.github/workflows/release467-build8-proof.yml`
- operations authority: `docs/operations/RELEASE_467_BUILD_8_AUTHORITY_CONVERGENCE.md`
- canonical I.T. workspace: `/admin/it/`

The Build 8 gate also reruns the Release 467 Build 7 source gate and proves that the inherited Release 466 compatibility fields have not been silently rewritten.

## Why `development-release.json` still says Release 466

That file is consumed by inherited regression gates, including Release 466 Build 4, which intentionally asserts historical convergence and Production compatibility fields. Changing its top-level release merely to make the label look current would invalidate those proofs.

Therefore:

- `current-development-authority.json` is the current Release 467 restart pointer;
- `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY**;
- old compatibility assertions are retired only after their consuming gates are deliberately migrated;
- no new chat or deployment may infer that Release 466 is current merely because the compatibility file still contains Release 466 fields.

## Exact Development boundary

- source branch: `dev`
- canonical Development target: `https://dev.devilndove-site.pages.dev`
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 8 schema change: NONE

A chat, workstation, deployment or source commit is not a migration event. Historical migrations are never replayed merely because work resumed.

## Release 467 authority separation

### Builds 1–4

Builds 1–4 established the I.T. readiness control tower, recovery/readiness actions, authenticated browser runtime acceptance, and the sanitized evidence/acceptance ledger. Their source authority is merged and carried forward.

### Build 5 — CI / Access and Production Promotion Readiness

Build 5 preserves two separate concepts:

- CI/Cloudflare Access readiness; and
- Production Promotion Readiness for one exact Development candidate.

Production Promotion Readiness is the only current Release 467 HOLD/READY promotion review authority. It does not itself deploy Production.

### Build 6 — Development Access acceptance harness

Build 6 provides the dispatch-only outer Cloudflare Access service-token acceptance harness for the canonical Development Preview. It never creates an application-admin session.

The real service-token lane remains `HOLD_EXTERNAL` until the deliberate Development-only workflow succeeds with correctly provisioned masked credentials. Build 8 does not infer or alter that lane.

### Build 7 — External Commercial Acceptance Bridge

Build 7 is merged and source green. It bridges current operator visibility for:

1. CAIP private-media runtime evidence;
2. Stripe Development acceptance;
3. PayPal sandbox acceptance;
4. Social/OAuth controlled acceptance.

Build 7 performs none of those provider actions automatically.

### Build 8 — Authority Convergence and Restart Safety

Build 8 prevents current Release 467 work from being reopened or misdirected by stale Release 462/466 “current release” documents. Its proof fails closed if the current pointer, handoff, roadmap, sanity file, Markdown index, I.T. guide or inherited compatibility boundary disagree.

## External/provider acceptance remains bounded

External lanes remain truthfully **`HOLD_EXTERNAL`** unless separately and deliberately proven:

- Cloudflare Access CI service-token acceptance — separate Build 6 authority;
- Stripe Development/test acceptance — operator/provider controlled;
- PayPal sandbox acceptance — operator/provider controlled;
- Social/OAuth controlled acceptance — operator/provider controlled; publication remains closed;
- native GitHub rulesets — separate repository-setting authority;
- CAIP private media — determine current state from fresh Build 7 runtime evidence, not stale historical wording.

No real Stripe, PayPal, OAuth or Cloudflare Access execution is authorized merely because a source gate is green.

## Main / Production boundary

The last source-head verification before Build 8 found `main` at `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`. That is a repository source-head observation only. Before any future Production promotion, independently verify the exact deployed Production release; do not infer deployment from the branch head.

Build 8:

- does not update `main`;
- does not contact Production resources;
- does not mutate Production D1/R2 or business data;
- does not execute live provider/payment/OAuth actions;
- does not authorize a Production deployment.

## Permanent safety rules

- Development first; Production promotion requires a separately reviewed exact-green Development candidate.
- Main-only application patches are forbidden.
- Production transactional/business data are never overwritten wholesale from Development.
- Request-time schema DDL remains forbidden.
- Canonical migrations are forward-only under `migrations/canonical` and Development-first.
- Build 8 D1/R2 mutation is closed.
- Build 8 provider execution/publication is closed.
- Build 8 Cloudflare Access mutation is closed.
- Secret values must never appear in UI, logs, committed evidence or handoff documents.
- Browser acceptance, CI Access acceptance, commercial/provider acceptance and application-admin authentication are distinct authorities.
- Build 5 remains the promotion HOLD/READY authority.
- Build 6 remains the outer Access service-token authority.
- Build 7 remains the external-commercial visibility authority.
- Raw CAIP R2 deletion remains closed.

## Next bounded work

First prove Build 8 on its feature branch with the Build 8 proof and canonical System Gate, merge only when green, and then re-prove the exact merged `dev` SHA.

After Build 8 is Development-green, deliberately choose the highest-priority external acceptance lane only when the required operator authorization and credentials are available. Do not automatically execute Stripe, PayPal, OAuth or Cloudflare Access merely to make the dashboard green.

If operator authorization is unavailable, leave the lane at **`HOLD_EXTERNAL`** and continue to the next bounded non-provider application/release-mechanics improvement.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build8-authority-convergence.json`
4. `PROJECT_STATUS_AND_ROADMAP.md`
5. `SANITY_HEALTH_CHECK.md`
6. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
7. `docs/operations/RELEASE_467_BUILD_8_AUTHORITY_CONVERGENCE.md`
8. `release467-build7-external-commercial-acceptance.json`
9. `release467-build6-access-acceptance-harness.json`
10. `release467-build5-production-promotion-readiness.json`
11. `release467-build5-ci-access-readiness.json`
12. `release467-build4-evidence-acceptance-ledger.json`
13. `development-release.json` — compatibility evidence only

Release 466 and earlier release files remain historical/provenance/compatibility evidence and cannot override the current Release 467 authority above.
