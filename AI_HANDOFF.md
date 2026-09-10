# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 87 — **Production Authority & Restart Convergence** is the active Development closure candidate. It consumes the externally proven Build 86 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 86 — **I.T. Operations & Self-Diagnostics**:
- `dev` `5fdbb5346e52f17072671274dc36e4d3527a7905`
- tree `f9037baf12bc3489b3a0df3df03eef5bdbe85e90`
- System Gate `34419070653` SUCCESS
- Current Application Quality `34419070636` SUCCESS
- I.T. Admin Runtime Proof `34419070642` SUCCESS
- Repository Branch Hygiene `34419070660` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, binding/control-plane proof, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 86:
- `main` `5fdbb5346e52f17072671274dc36e4d3527a7905`
- tree `f9037baf12bc3489b3a0df3df03eef5bdbe85e90`
- Production Pages Deploy `34419211512` SUCCESS
- Production Live Resource Integrity `34419284027` SUCCESS
- Production business-data preservation, canonical D1/isolation/FK, exact deployment/bindings, public smoke, live account/D1 compatibility, same-origin Product R2 bytes, Product API photography and Production D1 diagnostic: SUCCESS.

## Build 87 scope

Build 87 fixes the intentional post-Build-86 authority lag. It converges:
1. `current-development-authority.json` onto Build 86 as the verified restart baseline;
2. the Build 86 authority file onto its actual Development + Production final closure;
3. `/admin/it/` onto Build 86 verified Development/Production truth;
4. Reliability onto Build 86 verified Development/Production truth;
5. Deployment Preflight onto Build 86 verified Development/Production truth;
6. human handoff/restart documents onto the same exact SHA/tree/run set;
7. current System Gate provenance so Build 87 becomes a retained fail-closed contract.

Build 87 is truth convergence, not automatic repair. It performs no request-time schema work, D1/R2/binding mutation, deployment/restore execution, provider execution/publication or Production business-data overwrite.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Start from `current-development-authority.json`, which records Build 86 as the last fully verified Development/Production checkpoint and Build 87 as the closure candidate. Build 87 must pass the exact merged `dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media acceptance remains evidence-dependent. Provider configuration never authorizes execution or publication.
