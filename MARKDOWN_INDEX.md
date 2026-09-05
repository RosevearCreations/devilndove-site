# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 58

Build 58 — **Account Administration JSON Response Hardening** is the current Development closure candidate.

Last fully verified Development is Build 57:
- `dev` `8dc267594534bc51797f5cf4e59fc6dec6e8d9b6`
- tree `c2f31450d59477fc313c9c0b25637f7bc9bc35e0`
- System `33967307608` SUCCESS
- Quality `33967307714` SUCCESS
- I.T. `33967307740` SUCCESS
- Hygiene `33967307653` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, bindings, smoke and regression evidence passed.

Current Production is Build 55:
- `main` `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477` SUCCESS.

## Current reading order

1. `current-development-authority.json` — machine pointer for current Development/Production truth
2. `release467-build58-account-administration-json-response-hardening.json` — Build 58 current bounded account-writing candidate
3. `release467-build57-current-authority-restart-truth-convergence.json` — Build 57 final Development closure
4. `release467-build56-product-photo-guidance-packaging-onboarding.json` — Build 56 final Development closure
5. `release467-build55-inventory-intelligence-manufacturer-link-schema-compatibility.json` — Build 55 final Development/Production hotfix authority
6. `release467-build54-production-authority-synchronization.json`
7. `release467-build53-generated-deliverable-review-state-convergence.json`
8. Builds 52–50 Content Studio / CAIP authorities
9. Build 49 restart-integrity foundation
10. Builds 48–45 Grey Hair / CAIP authorities
11. Builds 44–41 Packaging authorities
12. Builds 40–36 historical bounded authorities
13. `AI_HANDOFF.md`
14. `PROJECT_STATUS_AND_ROADMAP.md`
15. `SANITY_HEALTH_CHECK.md`
16. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`

Build 58 addresses the live Production account-admin HTTP 500/non-JSON failure class. Create User and Reset Password use safe shared response parsing; Create User, Reset Password and member Change Password now return structured JSON for unexpected runtime/D1 errors; wrong-current-password no longer invalidates a valid session. No canonical migration is added.

The `business-administration` runtime-suppression console warning is a separate legacy three-module versus canonical five-module mapping issue and is not treated as the cause of the Create User HTTP 500.

Canonical migrations remain exactly `0001`–`0004`. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain HOLD/evidence-dependent. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active. Build 59 must not start until Build 58's exact merged `dev` closure is externally verified and then ingested as Build 59's first source mutation.
