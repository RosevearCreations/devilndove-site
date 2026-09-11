# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 105

Build 105 — **Product Work Session Completion & Handoff** is the current Development closure candidate.

Last fully verified Development is Build 104:
- `dev` `0a308b4fd0b6bd50c1dde4627bd61d1d76b84891`
- tree `399d16c99bb54c16247fb8c44d5a054286650e30`
- System `34622757518` SUCCESS
- Quality `34622757414` SUCCESS
- I.T. `34622757394` SUCCESS
- Hygiene `34622757555` SUCCESS.

Current Production is Build 104:
- `main` `0a308b4fd0b6bd50c1dde4627bd61d1d76b84891`
- tree `399d16c99bb54c16247fb8c44d5a054286650e30`
- Production Pages Deploy `34623045557` SUCCESS
- Production Live Resource Integrity `34623145483` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build105-product-work-session-handoff.json`
3. `release467-build104-product-work-session-focus.json`
4. `docs/operations/RELEASE_467_BUILD_105_PRODUCT_WORK_SESSION_HANDOFF.md`
5. `PROJECT_STATUS_AND_ROADMAP.md` — includes the autonomous Build 105–113 layout.
6. `AI_HANDOFF.md`
7. `SANITY_HEALTH_CHECK.md`
8. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
9. `migrations/canonical/manifest.json`

## Build 105 authority contract

Build 105 consumes exact Build 104 Development and Production closure and adds browser-local summary/blocker/copy/download handoff over the existing Product work session. It reuses `dd_catalog_work_session_v1`, `dd_admin_products_snapshot_v2` and already-rendered Product/readiness evidence, adds no Product/readiness network/database read, and performs no Product/Inventory mutation.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
