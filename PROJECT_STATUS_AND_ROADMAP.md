# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 91 — Prelaunch Authority & Go-Live Decision Convergence** is the current Development closure candidate.

Last fully verified Development is Build 90 — External Acceptance Evidence Depth & Cross-Lane Guidance:
- `dev` `ab23457370ced9224facc2a09c1cca7b1ff20968`
- tree `54f069f37e09e6f48e035f98656423ed28aa85f4`
- System Gate `34434124113` SUCCESS
- Current Application Quality `34434123999` SUCCESS
- I.T. Admin Runtime Proof `34434124058` SUCCESS
- Repository Branch Hygiene `34434124046` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 90:
- `main` `ab23457370ced9224facc2a09c1cca7b1ff20968`
- tree `54f069f37e09e6f48e035f98656423ed28aa85f4`
- Production Pages Deploy `34434296247` SUCCESS
- Production Live Resource Integrity `34434356959` SUCCESS.

## Build 91 scope

Build 91 modernizes the existing prelaunch operating surface rather than adding another launch tool:
- current identity moves from historical Build 229/230 to Release 467 Build 91;
- Startup Readiness `expected_total` is consumed dynamically instead of hard-coding 43 gates; the active contract currently expects 46;
- degraded or unavailable readiness evidence keeps the launch decision on HOLD;
- all five current external-acceptance lanes are summarized with passed/required evidence counts and next actions;
- verified Build 90 Development/Production GREEN is shown separately from unrestricted go-live readiness;
- Canada-only CA/CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and existing local pickup remains supported;
- prelaunch status composition is read-only and manual-refresh only;
- no provider execution/publication, readiness auto-write, schema mutation, Cloudflare Access mutation or automatic Production promotion is added.

## Current external acceptance

These remain independent of source/deployment health unless their own evidence proves otherwise:
- Stripe Development: `HOLD_EXTERNAL`
- PayPal sandbox: `HOLD_EXTERNAL`
- Social OAuth selected-provider acceptance: `HOLD_EXTERNAL`
- CAIP private-media acceptance: `EVIDENCE_DEPENDENT`
- Cloudflare Access service-token acceptance: `HOLD_EXTERNAL`

Configuration booleans, known secret names, source harnesses and GREEN deployment status never imply external acceptance or unrestricted launch readiness.

## Build 91 closure sequence

1. Ingest Build 90 exact Development/Production closure into current restart authority.
2. Complete prelaunch/go-live decision convergence and the Build 91 fail-closed source gate.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production business-data preservation, canonical Production D1/FK/binding proof, exact Pages deployment, public smoke and promotion proof.
7. Require Production Live Resource Integrity to re-prove live D1, same-origin Product R2, Product API photography and account diagnostic.
8. Only then call Build 91 complete externally; the next build must ingest Build 91's final external closure evidence.

Canonical migrations remain exactly `0001`–`0004`. Build 91 does not change checkout/payment execution or the U.S. sales/shipping suspension.
