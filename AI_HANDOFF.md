# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 61 — **Production Live Resource Proof Repair** is the active validation-only closure candidate.

Last fully verified Development is Build 60 — **Production Resource Binding & Account/Auth Recovery**:
- `dev` `2f099d88b39a35a3bb8cf73798ba2c30b2b82083`
- tree `66bbd5b61e815b2bd9f2483eaa5161542c177e9a`
- System Gate `33972673238` SUCCESS
- Current Application Quality `33972673246` SUCCESS
- I.T. Admin Runtime Proof `33972673266` SUCCESS
- Repository Branch Hygiene `33972673254` SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is Build 60:
- `main` `732bac55a4a43434a31090bb3b9c6b7b2c5a7939`
- same tree `66bbd5b61e815b2bd9f2483eaa5161542c177e9a`
- Production Pages Deploy `33972781588` SUCCESS
- exact green Development tree, Production business-data snapshot/preservation, canonical Production D1, isolation/FK, exact deployment, bindings, public smoke and promotion proof: SUCCESS.

Production Live Resource Integrity run `33972823412` did **not** prove a live D1/R2 failure. The new proof exited during its Wrangler D1 invocation before schema assertion output because it omitted the Cloudflare account context used by the successful Production deploy workflow; all later R2/API checks were skipped.

## Build 61 scope

Build 61 changes validation only. It restores `CLOUDFLARE_ACCOUNT_ID` to the live-resource proof and requires read-only evidence that:
- the Production `users` and `sessions` tables expose the supported account/session contract;
- the known `Itemsforsale/DD215-216B.jpeg` object returns real image bytes through `/api/product-media`;
- `/api/products` returns at least one live Product and at least one public Product image URL;
- a Product photograph can actually be fetched, using the same-origin fallback when the custom R2 hostname is unavailable;
- `/api/storefront-merchandising` returns healthy JSON;
- the public login diagnostic reaches Production D1.

No application runtime behavior, canonical migration, D1 business data, R2 objects, provider execution, publication or Cloudflare Access policy is changed by Build 61.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 61 must pass exact feature-head proofs, merge to `dev`, then pass the four exact merged-Development proofs before the same validation tree is promoted to `main` so the standard Production chain and repaired live-resource proof can execute. Do not add an evidence-only commit afterward; Build 62 must ingest Build 61 final closure values.

Canonical migrations remain exactly `0001`–`0004`. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access lanes remain separate HOLD/evidence-dependent authorities.
