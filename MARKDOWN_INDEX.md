# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 60

Build 60 — **Production Resource Binding & Account/Auth Recovery** is the current Production-incident hotfix candidate.

Last fully verified Development is Build 59:
- `dev` `44483117210e93ce7126cd19510b090d88f663a7`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- System `33969967713` SUCCESS
- Quality `33969967734` SUCCESS
- I.T. `33969967704` SUCCESS
- Hygiene `33969967656` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, bindings, smoke and regression evidence passed.

Current Production is Build 59:
- `main` `9411c0968d2f0cae57f25d36f0664729cd81c61f`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- Production Pages Deploy `33970506769` SUCCESS.

A residual Production incident is open: public Product images remain unavailable and authenticated Create User returns HTTP 503. Build 60 corrects the live account-schema assumptions and broadens the R2 recovery contract/site coverage; it adds no migration or storage mutation.

## Current reading order

1. `current-development-authority.json` — machine pointer for current Development/Production truth
2. `release467-build60-production-resource-binding-auth-recovery.json` — Build 60 current Production incident candidate
3. `release467-build59-storefront-media-availability-merchandising-recovery.json` — Build 59 final Development + Production closure and residual incident note
4. `release467-build58-account-administration-json-response-hardening.json`
5. `release467-build57-current-authority-restart-truth-convergence.json`
6. `release467-build56-product-photo-guidance-packaging-onboarding.json`
7. `release467-build55-inventory-intelligence-manufacturer-link-schema-compatibility.json`
8. `release467-build54-production-authority-synchronization.json`
9. `release467-build53-generated-deliverable-review-state-convergence.json`
10. Builds 52–50 Content Studio / CAIP authorities
11. Build 49 restart-integrity foundation
12. Builds 48–45 Grey Hair / CAIP authorities
13. Builds 44–41 Packaging authorities
14. Builds 40–36 historical bounded authorities
15. `AI_HANDOFF.md`
16. `PROJECT_STATUS_AND_ROADMAP.md`
17. `SANITY_HEALTH_CHECK.md`
18. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`

## Build 60 incident corrections

- Account administration now inspects the actual live `users`/`sessions` table columns read-only and does not assume both session token columns or optional timestamps exist.
- `/api/product-media` remains GET-only and supports current `products/` plus approved legacy public prefixes such as `Itemsforsale/`, `Toolshed/`, `Tools/` and `Supplies/`, including historical case differences.
- Shared HTML middleware injects Product-media recovery on every HTML page rather than only Shop.
- Production resource acceptance must prove the live account table shape and fetch a real known Product R2 object before this incident is closed.
- The `business-administration` runtime-suppression warning remains a separate legacy module-name cleanup issue.

Canonical migrations remain exactly `0001`–`0004`. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain HOLD/evidence-dependent. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
