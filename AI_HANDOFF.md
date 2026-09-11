# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 99 — **Product Work Views & Browser Sort** is the active Development closure candidate. It consumes the externally proven Build 98 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 98 — **Product Readiness Triage & Blocker Groups**:
- `dev` `81d6ed5cdd55c959611f538de8c90bcf21f5b302`
- tree `d19224681ade25301c07d96854c0b6c7a6abd762`
- System Gate `34550999431` SUCCESS
- Current Application Quality `34550999419` SUCCESS
- I.T. Admin Runtime Proof `34550999479` SUCCESS
- Repository Branch Hygiene `34550999409` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, binding/control-plane proof, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 98:
- `main` `81d6ed5cdd55c959611f538de8c90bcf21f5b302`
- tree `d19224681ade25301c07d96854c0b6c7a6abd762`
- Production Pages Deploy `34551114694` SUCCESS
- Production Live Resource Integrity `34551173009` SUCCESS.

## Build 99 scope

Build 99 adds a browser-local Product work-view layer over the existing Product browser. An operator can save the current Product search, focus filter, readiness triage group, visible-column preferences and browser row order as a reusable named view. Up to eight views are retained in this browser and may be updated, applied or deleted without changing Product records.

Browser row sorting supports original Product order, Product/System number ascending or descending, name A–Z or Z–A, readiness lowest or highest first, inventory lowest first, and recently updated newest first. Sorting reuses the shared Product snapshot and the readiness already rendered by the primary Products loader; the new work-view layer makes no Product/readiness API call and performs no Product, Inventory, D1 or R2 mutation.

Build 98 readiness triage, Build 97 readiness queue, Build 96 Product search/focus, Build 95 current Product context/sticky table/column views, Build 94 responsive workspace navigation and Build 93 centered-shell/right-side reachability remain active.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Start from `current-development-authority.json`, which records Build 98 as the last fully verified Development/Production checkpoint and Build 99 as the current closure candidate. Build 99 must pass the exact merged `dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion. Build 100 must ingest Build 99's final external closure.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported. Provider configuration never authorizes Production execution or publication.
