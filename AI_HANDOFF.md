# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 104 — **Product Work Session Focus Views** is the active Development closure candidate. It consumes the externally proven Build 103 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 103 — **Product Work Session Paging & Full Coverage**:
- `dev` `8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146`
- tree `f4e7b2071710c50cfdd3b33ca84bbb85650d86ee`
- System Gate `34617580379` SUCCESS
- Current Application Quality `34617580435` SUCCESS
- I.T. Admin Runtime Proof `34617580311` SUCCESS
- Repository Branch Hygiene `34617580348` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, smoke and regression evidence: SUCCESS.

Current Production is also Build 103:
- `main` `8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146`
- tree `f4e7b2071710c50cfdd3b33ca84bbb85650d86ee`
- Production Pages Deploy `34617779013` SUCCESS
- Production Live Resource Integrity `34617890313` SUCCESS.

## Build 104 scope

Build 104 adds browser-local **All / Active / Blocked / Ready / Done** focus views to the Product work session. The focus layer operates over the existing ordered session and reuses readiness already rendered by the primary Products loader.

Focused results keep Build 103's 20-item paging. Changing focus returns to page 1 and the page summary reports the focused range plus the total session size. Marking done, removing Products, or clearing completed Products automatically re-renders and clamps focused paging when needed.

Locate next Product and Open next blocker continue to scan the complete ordered work session, not only the active focus. Manual Move Up / Move Down remains available under **All** focus only so hidden filtered items cannot make the stored manual sequence ambiguous.

Build 104 reuses already-rendered Product rows, `dd_admin_products_snapshot_v2`, and already-rendered readiness evidence. It adds no Product/readiness API/database read and performs no Product, Inventory, D1 or R2 mutation.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 104 must pass exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion. Build 105 must ingest Build 104's final external closure.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.
