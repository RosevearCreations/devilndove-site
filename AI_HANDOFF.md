# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 33 — I.T. Current Release & Production Truth Convergence is a FEATURE CANDIDATE.**

Build 32 is fully closed in Production:
- final Development SHA `79c9a6c4af0f5c82f474964485e2cde535f85045`
- exact tree `2c1b4a3694779996e1bdb094be5e9e043834276e`
- System Gate `33829550860` SUCCESS
- Current Application Quality `33829550795` SUCCESS
- I.T. Admin Runtime Proof `33829550834` SUCCESS
- Repository Branch Hygiene `33829550749` SUCCESS
- Production `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`
- Production Pages Deploy `33866964958` SUCCESS on the same exact tree.

## Build 33 scope

Build 33 corrects stale I.T. release truth that still described Build 22 as current operator authority and Build 20 as Production. The read-only I.T. Operations Control Tower now separates:
- current Build 33 operator state;
- accepted Build 32 Development baseline;
- exact Build 32 Production-GREEN authority;
- live Development ancestry/readiness; and
- external HOLD lanes that still require their own evidence.

A new `current_it_release_truth_gate.py` is part of the release-neutral Current Application Quality Proof. Future builds must keep the I.T. current-build pointer and Production baseline synchronized or quality fails.

No schema change, D1/R2 business-data mutation, provider execution/publication, Cloudflare Access mutation or Production mutation is authorized by Build 33.

## Acceptance rule

Build 33 is not GREEN yet. Merge its feature PR through GitHub to `dev`, then require push-triggered System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene on the exact merged SHA. Only after those proofs succeed may Build 33 be marked Development GREEN.

External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access lanes remain HOLD unless fresh evidence explicitly accepts them.