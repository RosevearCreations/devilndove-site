# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 90 — **External Acceptance Evidence Depth & Cross-Lane Guidance** is the active Development closure candidate. It consumes the externally proven Build 89 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 89 — **External Acceptance Environment Isolation & Guided Recovery**:
- `dev` `68ac415302bceddb81e6faea15fbbebb3a76f24a`
- tree `1a7cccf46b29718ea63d532c8c22322bcca98ffd`
- System Gate `34425720516` SUCCESS
- Current Application Quality `34425720539` SUCCESS
- I.T. Admin Runtime Proof `34425720559` SUCCESS
- Repository Branch Hygiene `34425720537` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, binding/control-plane proof, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 89:
- `main` `68ac415302bceddb81e6faea15fbbebb3a76f24a`
- tree `1a7cccf46b29718ea63d532c8c22322bcca98ffd`
- Production Pages Deploy `34425875315` SUCCESS
- Production Live Resource Integrity `34425949898` SUCCESS
- Production business-data preservation, canonical D1/isolation/FK, exact deployment/bindings, public smoke, live account/D1 compatibility, same-origin Product R2 bytes, Product API photography and Production D1 diagnostic: SUCCESS.

## Build 90 scope

Build 90 preserves Build 89 environment isolation and makes all five external acceptance lanes use a consistent evidence model:
1. Stripe Development remains six real evidence dimensions with guided Development-only actions.
2. PayPal sandbox remains six real evidence dimensions with guided Development-only actions.
3. Social OAuth now exposes provider selection, readiness, intended-account identity, controlled lifecycle and publication-closed checks.
4. CAIP private media now exposes schema, authenticated review-proxy serve, ranged streaming, no-copy and no-cache checks, plus informational object-key evidence.
5. Cloudflare Access now exposes the dispatch contract as five structured checks while correctly leaving exact-SHA dispatch, secret availability, workflow success and expected application `401` as external evidence.
6. Each lane reports required/passed check counts and one next action.
7. Evidence timestamps are displayed when available, but age alone never creates acceptance and the application never self-attests external workflow evidence.
8. Build 89 Production read-only isolation remains intact; the retained provider runner is still invoked only on Development.

The current status endpoint remains GET-only and performs no schema, D1, R2, binding, provider, publication or Production mutation.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Start from `current-development-authority.json`, which records Build 89 as the last fully verified Development/Production checkpoint and Build 90 as the closure candidate. Build 90 must pass the exact merged `dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media acceptance remains evidence-dependent until fresh external/current evidence says otherwise. Provider configuration never authorizes Production execution or publication.
