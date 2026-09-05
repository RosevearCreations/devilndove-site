# Devil n Dove — Sanity / Health Check

**Release 467 Build 60 — Production Resource Binding & Account/Auth Recovery is the current Production-incident hotfix candidate.**

Last fully verified Development checkpoint is Build 59:
- SHA `44483117210e93ce7126cd19510b090d88f663a7`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- System Gate `33969967713`: SUCCESS
- Current Application Quality `33969967734`: SUCCESS
- I.T. Admin Runtime Proof `33969967704`: SUCCESS
- Repository Branch Hygiene `33969967656`: SUCCESS
- exact Development Preview deployment, canonical D1 proof, read-only data authority, bindings, smoke and regression evidence: SUCCESS.

Current Production is Build 59:
- `main` `9411c0968d2f0cae57f25d36f0664729cd81c61f`
- tree `3523119d31bbde05ba98faa530acc3dae88920d2`
- Production Pages Deploy `33970506769`: SUCCESS.

Production acceptance proved business-data snapshot/preservation, canonical Production D1, isolation/foreign-key integrity, exact-main deployment, Production bindings, public smoke and promotion proof. A later user report proves that prior public smoke did not cover two critical runtime paths.

## Current Build 60 incident boundary

- Product images remain unavailable across live public site surfaces.
- Authenticated `POST /api/admin/create-user` returns HTTP 503 with a structured `ADMIN_CREATE_USER_FAILED` response.
- Build 59 recovery was too narrow: it covered only `/products/` media and was installed only on Shop, while existing public media includes case-sensitive R2 keys such as `Itemsforsale/DD215-216B.jpeg` and other legacy public prefixes.
- Build 60 broadens `/api/product-media` to approved public R2 prefixes while remaining GET-only and adds case-compatible lookup for historical URL/key differences.
- Shared HTML middleware injects the recovery client on every HTML page.
- Create User, Admin Reset Password and Member Change Password now resolve the live `users`/`sessions` schema with read-only `PRAGMA table_info` inspection instead of hard-coding both `sessions.session_token` and `sessions.token` plus optional user columns.
- No request-time DDL, table creation, blind migration, Development-to-Production data copy or R2 mutation is introduced.
- The Production workflow is confirmed to target live resources: D1 `devilndove-prod-r462` / `f34a741b-0000-45b0-9a96-6be08754d563`, Product R2 `devilndove-toolshed-images`, CAIP R2 `devilndove-caip-media`.
- Build 60 acceptance must prove the actual live account table shape and a real known Product R2 object read before the incident is called closed.

The console warning `runtime activation suppressed for unavailable module business-administration` remains a separate legacy module-name cleanup issue; it is not the structured Create User 503 source.

## Current safety boundary

- Canonical migrations remain exactly `0001`–`0004`; Build 60 adds no migration.
- No D1 business-data mutation, R2 mutation, renderer/provider execution, publication, social queue expansion or Cloudflare Access mutation.
- No Development-to-Production business-data overwrite.
- Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain HOLD/evidence-dependent.
- Restart integrity remains `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` and requires exact tested feature-head evidence followed by exact merged-Development four-proof + Preview acceptance.

**Verdict:** Build 59 Development and Production source/deployment proofs are GREEN, but the live Production account/media incident is OPEN. Build 60 is the bounded recovery candidate; it must prove both actual live resource contracts before Production is called GREEN for this incident.
