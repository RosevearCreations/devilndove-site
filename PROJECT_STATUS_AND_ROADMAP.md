# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 92 — Prelaunch Action Queue Completeness & Ownership** is the current Development closure candidate.

Last fully verified Development is Build 91 — Prelaunch Authority & Go-Live Decision Convergence:
- `dev` `1d5519b976d108e7d4a558876863be5559a67e35`
- tree `6a62d01c1be002b78c3c8d05993c40676e41e208`
- System Gate `34486729268` SUCCESS
- Current Application Quality `34486729227` SUCCESS
- I.T. Admin Runtime Proof `34486729225` SUCCESS
- Repository Branch Hygiene `34486729311` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 91:
- `main` `1d5519b976d108e7d4a558876863be5559a67e35`
- tree `6a62d01c1be002b78c3c8d05993c40676e41e208`
- Production Pages Deploy `34488492622` SUCCESS
- Production Live Resource Integrity `34488622668` SUCCESS.

## Build 92 scope

Build 92 fixes the first concrete operational gap exposed by Build 91's current prelaunch authority:
- the launch decision already treats every non-closed Startup Readiness row as unresolved;
- the action queue now uses that exact same unresolved set rather than only `blocked`/`failed` rows;
- explicit priority is Blocked/Failed, Needs Review, In Progress, Not Started, then other open states;
- all unresolved Startup Readiness rows are listed with their recorded owner and due date;
- blank ownership/due-date fields are shown as unassigned/no due date rather than inferred;
- a status summary reports how many unresolved rows exist in each state;
- external acceptance remains a separate five-lane action queue with its own evidence authority;
- degraded or unavailable readiness evidence still forces HOLD;
- technical GREEN remains separate from unrestricted go-live readiness;
- prelaunch composition stays GET/read-only and manual-refresh only.

## Current external acceptance

These remain independent of source/deployment health unless their own evidence proves otherwise:
- Stripe Development: `HOLD_EXTERNAL`
- PayPal sandbox: `HOLD_EXTERNAL`
- Social OAuth selected-provider acceptance: `HOLD_EXTERNAL`
- CAIP private-media acceptance: `EVIDENCE_DEPENDENT`
- Cloudflare Access service-token acceptance: `HOLD_EXTERNAL`

Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Build 92 closure sequence

1. Ingest Build 91 exact Development/Production closure into current restart authority.
2. Complete the action-queue completeness/ownership fix and Build 92 fail-closed source gate.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production business-data preservation, canonical Production D1/FK/binding proof, exact Pages deployment, public smoke and promotion proof.
7. Require Production Live Resource Integrity to re-prove live D1, same-origin Product R2, Product API photography and account diagnostic.
8. Only then call Build 92 complete externally; Build 93 must ingest Build 92's final external closure evidence.

Canonical migrations remain exactly `0001`–`0004`. Build 92 does not change checkout/payment execution or the U.S. sales/shipping suspension.
