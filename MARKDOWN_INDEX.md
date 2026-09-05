# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 61

Build 61 — **Production Live Resource Proof Repair** is the current validation-only candidate.

Last fully verified Development is Build 60:
- `dev` `2f099d88b39a35a3bb8cf73798ba2c30b2b82083`
- tree `66bbd5b61e815b2bd9f2483eaa5161542c177e9a`
- System `33972673238` SUCCESS
- Quality `33972673246` SUCCESS
- I.T. `33972673266` SUCCESS
- Hygiene `33972673254` SUCCESS.

Current Production is Build 60:
- `main` `732bac55a4a43434a31090bb3b9c6b7b2c5a7939`
- same tree `66bbd5b61e815b2bd9f2483eaa5161542c177e9a`
- Production Pages Deploy `33972781588` SUCCESS.

Production Live Resource Integrity run `33972823412` failed before resource assertions because its new Wrangler D1 check omitted the canonical Cloudflare account context. Build 61 repairs that proof and adds Product API/image-byte validation.

## Current reading order

1. `current-development-authority.json`
2. `release467-build61-production-live-resource-proof-repair.json`
3. `release467-build60-production-resource-binding-auth-recovery.json`
4. `release467-build59-storefront-media-availability-merchandising-recovery.json`
5. `release467-build58-account-administration-json-response-hardening.json`
6. `release467-build57-current-authority-restart-truth-convergence.json`
7. `release467-build56-product-photo-guidance-packaging-onboarding.json`
8. `release467-build55-inventory-intelligence-manufacturer-link-schema-compatibility.json`
9. `release467-build54-production-authority-synchronization.json`
10. `release467-build53-generated-deliverable-review-state-convergence.json`
11. Builds 52–36 historical Release 467 authorities
12. `AI_HANDOFF.md`
13. `PROJECT_STATUS_AND_ROADMAP.md`
14. `SANITY_HEALTH_CHECK.md`
15. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`

## Build 61 proof contract

The repaired Production proof must establish all of the following read-only facts after a normal exact-main Production deployment:
- supported live `users`/`sessions` columns;
- known Product R2 object bytes through `/api/product-media`;
- nonempty `/api/products` output;
- at least one public Product image URL and fetched image bytes;
- healthy `/api/storefront-merchandising` JSON;
- Production D1 reachability through the auth diagnostic.

Build 61 changes no application runtime, canonical migration, D1 business data, R2 object, provider execution or Cloudflare Access policy. Canonical migrations remain exactly `0001`–`0004`. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain HOLD/evidence-dependent. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
