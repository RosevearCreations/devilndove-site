# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 109

Build 109 — **Customer Proof & Fulfilment Follow-through** is the current Development closure candidate.

Last fully verified Development is Build 108:
- `dev` `f9d68ea87a8c2622e8ec05e09e64f3a0672ba2b8`
- tree `6d2e524ceb06b90dad9e01e94297cdedde61920c`
- System `34663299696` SUCCESS
- Quality `34663299662` SUCCESS
- I.T. `34663299580` SUCCESS
- Hygiene `34663299597` SUCCESS.

Current Production is Build 108:
- `main` `f9d68ea87a8c2622e8ec05e09e64f3a0672ba2b8`
- tree `6d2e524ceb06b90dad9e01e94297cdedde61920c`
- Production Pages Deploy `34663390560` SUCCESS
- Production Live Resource Integrity `34663433029` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build109-customer-proof-fulfilment.json`
3. `release467-build108-mobile-workshop-assistant.json`
4. `docs/operations/RELEASE_467_BUILD_109_CUSTOMER_PROOF_FULFILMENT.md`
5. `PROJECT_STATUS_AND_ROADMAP.md` — includes the autonomous Build 109–113 layout.
6. `AI_HANDOFF.md`
7. `SANITY_HEALTH_CHECK.md`
8. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
9. `migrations/canonical/manifest.json`

## Build 109 authority contract

Build 109 consumes exact Build 108 Development and Production closure and enhances the existing private custom-order status flow with reviewed stage-specific next steps, local-pickup/Canada-shipping follow-through, customer-visible proof-consent status, and optional completion review/photo prompts.

It reuses existing order/status/stage/photo/spec reads, adds no extra database query, creates no customer submission or public-proof publication endpoint, and preserves the existing internal-note exclusion. Customer-private proof remains private. Public-use permission is reported separately from publication authority, which stays false until specialist moderation/review.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
