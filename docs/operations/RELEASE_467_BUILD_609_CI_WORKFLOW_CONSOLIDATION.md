# Devil n Dove — Build 609: CI workflow consolidation and promotion queue reduction

## Scope and measured backlog

Build 608 emitted repeated historical GitHub Actions workflows (Build 407–425 and legacy Brand V3, Signature and Build 436 media proofs) on Development/Production promotions in addition to the four actual protected Development checks. These obsolete automatic triggers increase queue pressure without changing the independent deployment decision.

Build 609 makes **23 historical proof workflows manual-only** (workflow_dispatch), rather than deleting them. The original job definitions and on-demand diagnostic commands remain available. Their unique regression tests are now exercised in the required `Current Application Quality Proof` workflow by `scripts/release467_build609_ci_bundle.mjs`, with bounded two-test concurrency. The bundle fails closed on missing tests, broken syntax or an unexpected automatic historical trigger. The Quality workflow must pass before promotion.

## Protected promotion invariants (unchanged)

1. System Gate (including exact Development Preview deployment) — automatic Development proof.
2. Current Application Quality Proof (including consolidated legacy proofs) — automatic Development proof.
3. I.T. Admin Runtime Proof — automatic Development proof.
4. Repository Branch Hygiene — automatic Development proof.
5. Production Pages Deploy — only the exact fully-green Development tree is promoted to Cloudflare Pages by the existing source-aware protected pipeline.
6. Production Live Resource Integrity Proof — separate post-deployment workflow_run, zero-D1 read or mutation, exact deployed resource and binding proof.

No weakening of protected required contexts, no automatic retry/release bypass, and no replacement of the independent production proof. The inherited Build 608 issuer/witness/owner authorization HOLD remains unchanged. Build 609 is CI-only and introduces no provider calls, Etsy/Meta publication, new D1 migration or additional runtime JavaScript.

## Operational acceptance

- Validate 23 manual-only trigger stanzas and retention of six release triggers.
- Run the consolidated historical proof bundle in Current Application Quality.
- Confirm all four exact-SHA Development workflows GREEN; merge protected dev→main PR.
- Verify Production Pages Deploy succeeded; check live `release-version.json` reports Build 609 and the exact main commit; run independent Production Live Resource Integrity Proof.
- Compare actual Actions workflow run fan-out before and after to quantify the reduction. In a future follow-up, evaluate additional scoped workflows only when their required behavior and branch-protection references are audited.
- Preserve `dev` and `main` and the active `production-d1-0026-proof` branch (PR #377); do not delete original authority evidence or an unmerged database migration proof.

This consolidation groups historical tests inside an existing required gate; it does not create another per-push workflow.
