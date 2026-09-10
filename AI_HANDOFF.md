# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 92 — **Prelaunch Action Queue Completeness & Ownership** is the active Development closure candidate. It consumes the externally proven Build 91 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 91 — **Prelaunch Authority & Go-Live Decision Convergence**:
- `dev` `1d5519b976d108e7d4a558876863be5559a67e35`
- tree `6a62d01c1be002b78c3c8d05993c40676e41e208`
- System Gate `34486729268` SUCCESS
- Current Application Quality `34486729227` SUCCESS
- I.T. Admin Runtime Proof `34486729225` SUCCESS
- Repository Branch Hygiene `34486729311` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, binding/control-plane proof, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 91:
- `main` `1d5519b976d108e7d4a558876863be5559a67e35`
- tree `6a62d01c1be002b78c3c8d05993c40676e41e208`
- Production Pages Deploy `34488492622` SUCCESS
- Production Live Resource Integrity `34488622668` SUCCESS.

## Build 92 scope

Build 92 keeps Build 91's fail-closed launch decision but fixes its incomplete action queue:
1. every Startup Readiness row not `passed` or `not_applicable` is actionable on `/admin/prelaunch/`;
2. explicit status priority is Blocked/Failed, Needs Review, In Progress, Not Started, then other open states;
3. recorded owner and due date are displayed, while missing values are shown as unassigned/no due date rather than invented;
4. all unresolved Startup Readiness actions are listed, so an item cannot hold launch while disappearing from the queue;
5. external acceptance actions remain a separate five-lane queue under their own evidence authority;
6. Startup Readiness degradation or unavailable evidence still fails closed;
7. technical GREEN remains distinct from unrestricted launch readiness;
8. the surface stays GET/read-only and manual-refresh only.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Start from `current-development-authority.json`, which records Build 91 as the last fully verified Development/Production checkpoint and Build 92 as the closure candidate. Build 92 must pass the exact merged `dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported. Provider configuration never authorizes Production execution or publication.
