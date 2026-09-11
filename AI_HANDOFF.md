# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 100 — **Product Work Session & Progress** is the active Development closure candidate. It consumes the externally proven Build 99 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 99 — **Product Work Views & Browser Sort**:
- `dev` `5cb212feda63ce198a12b9fb6ae8ac5cc3e926a2`
- tree `4a3a6f6e1c187531c254187a08edd4bd4723a937`
- System Gate `34553759863` SUCCESS
- Current Application Quality `34553759843` SUCCESS
- I.T. Admin Runtime Proof `34553759876` SUCCESS
- Repository Branch Hygiene `34553759871` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, binding/control-plane proof, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 99:
- `main` `5cb212feda63ce198a12b9fb6ae8ac5cc3e926a2`
- tree `4a3a6f6e1c187531c254187a08edd4bd4723a937`
- Production Pages Deploy `34553869891` SUCCESS
- Production Live Resource Integrity `34553931594` SUCCESS.

## Build 100 scope

Build 100 adds a browser-local Product work session over the existing Product browser. Operators can pin individual Products or the Products currently visible under their search/focus/work-view filters, see completion progress, locate the next Product, and explicitly open the next existing readiness blocker.

The planner stores Product IDs and completion timestamps only in `dd_catalog_work_session_v1`, capped at 60 Products. It reuses the shared Product snapshot and readiness already rendered by the primary Products loader; it adds no Product/readiness API/database read and performs no Product, Inventory, D1 or R2 mutation. Hidden Products do not silently clear browser filters.

Build 99 saved work views/sort, Build 98 readiness triage, Build 97 readiness queue, Build 96 Product search/focus, Build 95 current Product context/table ergonomics, Build 94 responsive workspace navigation and Build 93 centered-shell/right-side reachability remain active.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Start from `current-development-authority.json`, which records Build 99 as the last fully verified Development/Production checkpoint and Build 100 as the current closure candidate. Build 100 must pass the exact merged `dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion. Build 101 must ingest Build 100's final external closure.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported. Provider configuration never authorizes Production execution or publication.