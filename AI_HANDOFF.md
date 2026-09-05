# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 59 — **Storefront Media Availability & Merchandising Recovery** is the current Development closure candidate. It responds to live Production evidence that `/api/storefront-merchandising` returned HTTP 500 while product images from `assets.devilndove.com/products/...` failed with `NS_ERROR_DOM_NETWORK_ERR`, leaving Store product photography unavailable.

The last fully verified Development checkpoint is Build 58 — **Account Administration JSON Response Hardening**:
- `dev` SHA `91106c2156e209045ed49cfd48220550c7afca57`
- tree `ab8d5dae6bba682dad438937ca63c38955e0ff8a`
- System Gate `33968914405` SUCCESS
- Current Application Quality `33968914416` SUCCESS
- I.T. Admin Runtime Proof `33968914417` SUCCESS
- Repository Branch Hygiene `33968914412` SUCCESS
- exact Development Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production remains Build 55 — **Inventory Intelligence Manufacturer-Link Schema Compatibility**:
- `main` SHA `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477` SUCCESS
- Production business-data snapshot/preservation, canonical Production D1 proof, foreign-key/isolation proof, exact Pages deployment, Production bindings, public smoke and promotion proof: SUCCESS.

Development is intentionally ahead of Production.

## Build 59 scope

Build 59 is schema-neutral and read-only with respect to Product media storage:
- Storefront merchandising now inspects the actual `products` table columns and uses safe fallbacks for optional Product fields rather than a brittle fixed-column SELECT.
- A new public same-origin `/api/product-media` route reads only validated `products/*` objects from the existing `PRODUCT_MEDIA_BUCKET` R2 binding.
- The Shop loads a browser media-recovery listener before its Product renderers. If `https://assets.devilndove.com/products/...` fails, the exact object is retried through `/api/product-media` on the same site.
- The recovery endpoint has no R2 list, put, delete or multipart capability and rejects non-Product/traversal keys.
- Current quality/System regression protection executes a runtime unit proof of the Product-media read path and preserves the canonical four-migration stream.
- No D1 schema/business-data migration, R2 mutation, provider execution, Cloudflare Access change or automatic Production promotion.

Build 58 remains the account-administration fix that prevents raw `JSON.parse` errors and returns structured account-write failures. The separate `business-administration` module warning remains a legacy module-mapping cleanup item; it did not cause the Create User 500.

## Safety and restart rules

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 59 becomes the next restart checkpoint only after its exact merged `dev` head independently passes System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene and exact Preview acceptance. Do not add an evidence-only commit afterward; Build 60 must ingest those externally verified Build 59 values before its first source mutation.

Canonical D1 migrations remain exactly `0001`–`0004`. Renderer/provider execution, publication, social queue expansion, R2 mutation and Cloudflare Access mutation remain closed. Stripe Development, PayPal sandbox, CAIP private-media evidence, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes.
