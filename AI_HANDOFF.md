# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 102 — **Product Work Manual Reorder & Accessibility** is the active Development closure candidate. It consumes the externally proven Build 101 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 101 — **Product Work Priority & Next-Action Ordering**:
- `dev` `73cd0d56071a60c562000d5804f819f6dde10a13`
- tree `2ef06219e4b1eeb1e525680fc45107eb6ebc5226`
- System Gate `34603707283` SUCCESS
- Current Application Quality `34603707270` SUCCESS
- I.T. Admin Runtime Proof `34603707267` SUCCESS
- Repository Branch Hygiene `34603707269` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, smoke and regression evidence: SUCCESS.

Current Production is also Build 101:
- `main` `73cd0d56071a60c562000d5804f819f6dde10a13`
- tree `2ef06219e4b1eeb1e525680fc45107eb6ebc5226`
- Production Pages Deploy `34603913028` SUCCESS
- Production Live Resource Integrity `34604002146` SUCCESS.

## Build 102 scope

Build 102 closes the remaining gap in Build 101 Manual session ordering. When Manual is selected, every pinned Product now has keyboard-accessible **Move Up** and **Move Down** controls. The sequence is stored only inside the existing browser-local `dd_catalog_work_session_v1` state. First/last boundary moves are disabled, and move controls are disabled outside Manual mode.

The selected manual sequence is the same sequence used by **Locate next Product** and **Open next blocker**. Priority, completion, blocker/readiness state, Build 101 ordering modes, Build 100 work sessions, Build 99 saved work views/sort, Build 98 readiness triage and earlier Product ergonomics remain active.

Build 102 reuses already-rendered Product rows, `dd_admin_products_snapshot_v2`, and already-rendered readiness evidence. It adds no Product/readiness API/database read and performs no Product, Inventory, D1 or R2 mutation.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 102 must pass exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion. Build 103 must ingest Build 102's final external closure.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.