# Release 467 Build 171 — Release & Restart Authority Convergence

## Baseline

Build 171 starts from the fully GREEN Build 170 Development/Production checkpoint:

- SHA `879c8730040afaf6caec6374b5057b7261fdcfe2`
- tree `da5e3b249d6e14266da5e191cb22c06205947948`
- System Gate `35275441340`
- Current Application Quality `35275441446`
- I.T. Admin Runtime `35275441412`
- Repository Branch Hygiene `35275441448`
- Build 170 Development proof `35275441460`
- Production Pages `35275636873`
- Production Live Resource Integrity `35275711398`
- Products Browser Production proof `35275711387`
- Products Route Production proof `35275711471`
- Build 170 Production proof `35275636939`

## Purpose

The Product runtime moved safely through Builds 166–170, but several restart authorities still identified Build 154/158/166 as current. That repository-truth drift could cause a future chat or release pass to restart from obsolete architecture or repeat already-closed work.

Build 171 converges current machine authority, I.T. release truth and the primary human handoff documents on the exact Build 170 GREEN predecessor.

## Changes

- Adds `release467-build170-product-browser-explicit-image-recovery-closure.json` as the immutable Build 170 Production closure authority.
- Adds `release467-build171-release-restart-authority-convergence.json` as the Build 171 candidate authority.
- Advances `current-development-authority.json` to Build 171 while retaining Build 170 as the last fully verified Development and Production checkpoint.
- Advances the I.T. operations control-tower API/client/page to Build 171 over the exact Build 170 baseline.
- Replaces stale `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md` and `MARKDOWN_INDEX.md` restart truth.
- Adds a dedicated Build 171 gate that verifies the machine pointer, I.T. truth and human handoff documents agree.
- Defines the final candidate-SHA rule: resolve synchronized live `dev` / `main` refs after promotion instead of embedding a self-referential not-yet-created final SHA inside the candidate.

## Safety boundary

Build 171 is release/restart-truth only.

It makes no Product runtime change, no schema change, no canonical migration change, no request-time DDL, no D1/R2 business-data mutation, no R2 listing, no provider execution/publication, and no payment/refund/accounting mutation.

Canonical migrations remain exactly `0001`–`0005`.

## Acceptance

Development requires one exact Build 171 head to pass:

- `scripts/release467_build171_gate.py`
- retained `scripts/release467_build170_gate.py`
- `scripts/current_it_release_truth_gate.py`
- `scripts/repository_forward_sanity.py`
- System Gate / exact Development Preview
- Current Application Quality
- I.T. Admin Runtime
- Repository Branch Hygiene

Promotion to `main` is non-force and identical-tree only after exact Development GREEN.

Production then requires:

- Build 171 authority-convergence proof on `main`
- Production Pages Deploy
- Production Live Resource Integrity
- retained Products Production Browser Proof
- retained Products Route Production Proof

Only after all exact-SHA Production proofs complete successfully may Build 171 be called GREEN.
