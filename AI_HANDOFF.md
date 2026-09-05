# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 60 — **Production Resource Binding & Account/Auth Recovery** is the active Production-incident hotfix candidate.

The last fully verified Development checkpoint is Build 59 — **Storefront Media Availability & Merchandising Recovery**:
- `dev` SHA `44483117210e93ce7126cd19510b090d88f663a7`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- System Gate `33969967713` SUCCESS
- Current Application Quality `33969967734` SUCCESS
- I.T. Admin Runtime Proof `33969967704` SUCCESS
- Repository Branch Hygiene `33969967656` SUCCESS
- exact Development Preview deployment, canonical Development D1 proof, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 59:
- `main` SHA `9411c0968d2f0cae57f25d36f0664729cd81c61f`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- Production Pages Deploy `33970506769` SUCCESS
- Production business-data snapshot/preservation, canonical Production D1 proof, isolation/foreign-key proof, exact Pages deployment, Production bindings, public smoke and promotion proof: SUCCESS.

A residual live Production incident was reported after that promotion: product images remained unavailable across site surfaces and authenticated `POST /api/admin/create-user` returned HTTP 503 with `ADMIN_CREATE_USER_FAILED`. This proves the prior smoke coverage was incomplete even though the deployment/binding proofs were green.

## Build 60 scope

Build 60 is schema-neutral and storage-read-only:
- account administration uses read-only `PRAGMA table_info` inspection and dynamically supports the actual live `users`/`sessions` table shape instead of assuming both `sessions.session_token` and `sessions.token` or optional timestamp columns;
- Create User, Admin Reset Password and Member Change Password share the live account compatibility authority;
- no request-time DDL, emergency table creation, blind migration or Production data copy is permitted;
- `/api/product-media` remains R2 GET-only but now supports the current `products/` prefix plus existing public legacy prefixes including `Itemsforsale/`, `Toolshed/`, `Tools/` and `Supplies/`, with case-compatible lookup where historical URLs differ from R2 key case;
- the public media fallback is injected by the shared HTML middleware on every HTML page, not only Shop;
- regression protection must prove the fallback cannot list/write/delete R2 and that account routes cannot regress to fixed dual-token session SQL;
- Production acceptance must additionally prove the live account table shape and a real public R2 object read before the incident is called closed.

The console message `runtime activation suppressed for unavailable module business-administration` remains a separate legacy module-name cleanup item. It is not the source of the structured Create User 503.

## Safety and restart rules

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 60 must pass exact feature-head proofs, merge to `dev`, then pass the four exact merged-Development proofs and Preview acceptance before the explicitly authorized Production hotfix is promoted to `main`.

Canonical D1 migrations remain exactly `0001`–`0004`. Build 60 adds no migration and no D1 business-data or R2 mutation. Renderer/provider execution, publication, social queue expansion and Cloudflare Access mutation remain closed. Stripe Development, PayPal sandbox, CAIP private-media evidence, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes.
