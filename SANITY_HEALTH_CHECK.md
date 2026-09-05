# Devil n Dove — Sanity / Health Check

**Release 467 Build 59 — Storefront Media Availability & Merchandising Recovery is the current Development closure candidate.**

Last fully verified Development checkpoint is Build 58:
- SHA `91106c2156e209045ed49cfd48220550c7afca57`
- tree `ab8d5dae6bba682dad438937ca63c38955e0ff8a`
- System Gate `33968914405`: SUCCESS
- Current Application Quality `33968914416`: SUCCESS
- I.T. Admin Runtime Proof `33968914417`: SUCCESS
- Repository Branch Hygiene `33968914412`: SUCCESS
- exact Development Preview deployment, canonical D1 proof, read-only data authority, bindings, smoke and regression evidence: SUCCESS.

Current Production is Build 55:
- `main` `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477`: SUCCESS.

Production acceptance proved business-data snapshot/preservation, canonical Production D1, foreign-key/isolation integrity, exact-main deployment, Production bindings, public smoke and promotion proof. Development is intentionally ahead of Production.

## Current Build 59 incident boundary

- Live Production `GET /api/storefront-merchandising` returns HTTP 500.
- Live Product image requests to `https://assets.devilndove.com/products/...` fail with `NS_ERROR_DOM_NETWORK_ERR`, causing Product photography to disappear from the Store.
- Storefront merchandising now inspects the actual `products` columns and supplies safe defaults for optional fields rather than using one brittle fixed-column SELECT.
- A new read-only same-origin `/api/product-media` path reads only validated `products/*` objects from `PRODUCT_MEDIA_BUCKET`.
- Shop installs a browser recovery listener before Product rendering; failed public R2 custom-host URLs retry the exact Product object through the same-origin endpoint.
- The fallback cannot list, upload, overwrite, delete or multipart-mutate R2.
- Build 59 includes a current source gate plus an executable runtime test for the restricted R2 read path.

Build 58’s account-administration hardening is fully GREEN in Development. The live Production Create User/Password JSON.parse symptom will remain on Build 55 Production until a separately authorized Production promotion occurs.

## Current safety boundary

- Generated deliverables cannot originate `ready_for_render`; Build 52's fail-closed transition remains authoritative.
- Canonical migrations remain exactly `0001`–`0004`; Build 59 adds no migration.
- No D1 business-data mutation, R2 mutation, renderer/provider execution, publication, social queue expansion or Cloudflare Access mutation.
- No Development-to-Production business-data overwrite.
- Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain HOLD/evidence-dependent.
- Restart integrity remains `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` and requires the exact merged-Development four-proof plus Preview cycle.
- The current pointer must not remain behind a newer Release 467 build authority.

**Verdict:** Build 58 Development is GREEN. Build 55 Production source/deployment proof is GREEN but live Storefront runtime currently has a reported media/merchandising incident. Build 59 is the active recovery candidate and must receive its own exact merged-head Development proofs before it can be called GREEN or considered for Production promotion.
