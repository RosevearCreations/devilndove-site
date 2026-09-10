# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 91 — **Prelaunch Authority & Go-Live Decision Convergence** is the active Development closure candidate. It consumes the externally proven Build 90 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 90 — **External Acceptance Evidence Depth & Cross-Lane Guidance**:
- `dev` `ab23457370ced9224facc2a09c1cca7b1ff20968`
- tree `54f069f37e09e6f48e035f98656423ed28aa85f4`
- System Gate `34434124113` SUCCESS
- Current Application Quality `34434123999` SUCCESS
- I.T. Admin Runtime Proof `34434124058` SUCCESS
- Repository Branch Hygiene `34434124046` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, binding/control-plane proof, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 90:
- `main` `ab23457370ced9224facc2a09c1cca7b1ff20968`
- tree `54f069f37e09e6f48e035f98656423ed28aa85f4`
- Production Pages Deploy `34434296247` SUCCESS
- Production Live Resource Integrity `34434356959` SUCCESS.

## Build 91 scope

Build 91 converges the existing `/admin/prelaunch/` surface into the current Release 467 launch-decision authority instead of creating another duplicate dashboard:
1. the stale Build 229/230 current identity and hard-coded 43-gate wording are removed;
2. Startup Readiness remains the D1-backed status owner and its current `expected_total` is consumed dynamically;
3. degraded or unavailable Startup Readiness fails closed rather than implying readiness;
4. the current Build 90 external-acceptance endpoint supplies all five external lanes, passed/required counts and next actions;
5. technical Development/Production GREEN is explicitly distinct from unrestricted launch readiness;
6. Canada-only commerce remains visible: CA/CAD, U.S. sales/shipping disabled, existing local pickup supported;
7. the prelaunch projection is GET/read-only and manual-refresh only; it performs no readiness write, provider execution/publication, Cloudflare Access mutation or automatic Production promotion.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Start from `current-development-authority.json`, which records Build 90 as the last fully verified Development/Production checkpoint and Build 91 as the closure candidate. Build 91 must pass the exact merged `dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. U.S. sales/shipping remain disabled. Provider configuration never authorizes Production execution or publication.
