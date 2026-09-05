# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 59

Build 59 — **Storefront Media Availability & Merchandising Recovery** is the current Development closure candidate.

Last fully verified Development is Build 58:
- `dev` `91106c2156e209045ed49cfd48220550c7afca57`
- tree `ab8d5dae6bba682dad438937ca63c38955e0ff8a`
- System `33968914405` SUCCESS
- Quality `33968914416` SUCCESS
- I.T. `33968914417` SUCCESS
- Hygiene `33968914412` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, bindings, smoke and regression evidence passed.

Current Production is Build 55:
- `main` `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477` SUCCESS.

## Current reading order

1. `current-development-authority.json` — machine pointer for current Development/Production truth
2. `release467-build59-storefront-media-availability-merchandising-recovery.json` — Build 59 current Storefront recovery candidate
3. `release467-build58-account-administration-json-response-hardening.json` — Build 58 final Development closure
4. `release467-build57-current-authority-restart-truth-convergence.json`
5. `release467-build56-product-photo-guidance-packaging-onboarding.json`
6. `release467-build55-inventory-intelligence-manufacturer-link-schema-compatibility.json` — current Production authority
7. `release467-build54-production-authority-synchronization.json`
8. `release467-build53-generated-deliverable-review-state-convergence.json`
9. Builds 52–50 Content Studio / CAIP authorities
10. Build 49 restart-integrity foundation
11. Builds 48–45 Grey Hair / CAIP authorities
12. Builds 44–41 Packaging authorities
13. Builds 40–36 historical bounded authorities
14. `AI_HANDOFF.md`
15. `PROJECT_STATUS_AND_ROADMAP.md`
16. `SANITY_HEALTH_CHECK.md`
17. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`

Build 59 addresses the live Production Storefront availability incident: `/api/storefront-merchandising` returned HTTP 500 and product-image requests to `assets.devilndove.com/products/...` failed. The candidate adds schema-compatible merchandising reads and a restricted same-origin R2 Product-media fallback without mutating R2 or D1.

Build 58 is fully GREEN in Development and remains the account-administration JSON/HTTP failure hardening build. The `business-administration` runtime-suppression console warning remains a separate legacy three-module versus canonical five-module mapping issue.

Canonical migrations remain exactly `0001`–`0004`. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain HOLD/evidence-dependent. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active. Build 60 must ingest Build 59's externally verified exact merged-`dev` closure before Build 60's first source mutation.
