# Devil n Dove — AI Handoff

## Current authority
**Release 460 — Secure OAuth Lifecycle & Encrypted Token Authority** is the single current Development release.

- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development URL: `https://devilndove-site-dev.pages.dev`
- Separate live Production: `main` / `devilndove-site` — **do not mutate**
- D1 binding/database: `DB` → `devilndove-dev`
- D1 UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- CAIP private R2: `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`
- Never add `account_id` to `wrangler.toml`.
- A new chat/workstation is not a migration event. Never replay historical migrations because the session changed.

## Release 459 checkpoint carried forward
Release 459 remains the provider setup/authenticated-runtime preparation authority. Its migration `migrations/dev/20260829_release459_it_provider_setup_authority.sql` is historical and must not be replayed unless read-only verification proves actual drift.

Release 458 exact historical evidence remains:
- SHA `66b48f0445c74247972e14fbdaa0e215e3792fb7`
- Source Gate `33265953249`
- System Gate `33265953255`
- Pages check `99135984965`

## Release 460 security model
1. OAuth state is random and stored only as a SHA-256 hash.
2. Authorization state expires after ten minutes and is claimed atomically once before exchange; replay/expired/unknown/provider-mismatch state is rejected.
3. PKCE uses S256 where the provider contract requires/supports it. Verifiers are encrypted at rest and cleared at terminal completion/failure.
4. `OAUTH_TOKEN_ENCRYPTION_KEY_V1` is a 32-byte base64url Cloudflare secret reference. AES-GCM v1 envelopes with AAD protect PKCE verifiers and provider token material.
5. D1 has ciphertext fields only for access/refresh/ID tokens. Plaintext OAuth secret/token columns are forbidden by automated schema proof.
6. Contracts exist for Etsy, Pinterest, Meta, X, TikTok and YouTube/Google.
7. `GET /api/admin/oauth-start` requires an administrator and is fail-closed unless the exact Development host and `OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit` both agree.
8. **Do not set that operator switch yet.** Current canonical policy is unset/closed.
9. Real callback responses are rejected with no exchange while the gate is closed. Normal callback browsing remains a safe readiness page.
10. `/api/admin/oauth-connections` exposes redacted diagnostics and guarded refresh/disconnect. Disconnect destroys local encrypted token material even if remote revocation cannot/should not execute.
11. Provider publication is never granted by connection setup and remains closed.

## Release 460 D1
Current migration:
`migrations/dev/20260829_release460_secure_oauth_lifecycle.sql`

It adds only:
- `oauth_authorization_transactions`
- `oauth_provider_connections`
- `oauth_security_events`

Guarded Development D1 run **33273087894** passed. It verified the exact `devilndove-dev` identity, applied only Release 460, then proved three OAuth authority tables, zero forbidden plaintext OAuth columns and clean foreign keys.

## Release 460 automated proof
Focused Source Gate run **33273087878** passed:
- actual Release 460 source/schema gate;
- executable Web Crypto AES-GCM/PKCE proof;
- carried Release 459 provider/runtime authority;
- JavaScript syntax;
- explicit Production/provider closed-boundary proof.

Key authorities:
- `functions/api/_lib/oauthSecurity.js`
- `functions/api/_lib/oauthProviders.js`
- `functions/api/admin/oauth-start.js`
- `functions/api/admin/oauth-connections.js`
- `functions/api/social/oauth/_callback.js`
- `scripts/release460_secure_oauth_gate.py`
- `scripts/release460_oauth_crypto_proof.mjs`
- `.github/workflows/release460-source-gate.yml`
- `.github/workflows/development-d1-release460.yml`
- `docs/operations/RELEASE_460_SECURE_OAUTH_LIFECYCLE_AUTHORITY.md`

## What remains before live provider authorization
Continue automated work first:
- provider-specific mock token/refresh/revoke fixtures and failure-contract tests;
- intended-account identity verification/connection labeling;
- refresh-expiry health/scheduling authority without provider contact while closed;
- provider publish-payload validation and idempotency as a separate non-executing layer;
- Stripe/PayPal automated contract/replay/reconciliation preparation;
- Development-to-Production parity, transition and rollback tooling.

Do not request provider authorization merely because Release 460 source/D1 is green.

## Manual boundary later
Only after automated preparation is exhausted:
- authenticated Development runtime evidence;
- CAIP private-media browser proof;
- Stripe test checkout/webhook/reconciliation;
- PayPal sandbox approval/capture/webhook/reconciliation;
- Etsy authorization/draft acceptance;
- Pinterest/Meta/X/TikTok/YouTube authorization and controlled acceptance.

Live provider authorization, provider execution/publication, and separate live Production remain closed throughout this work.

## Canonical reading order
1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
5. `docs/operations/RELEASE_460_SECURE_OAUTH_LIFECYCLE_AUTHORITY.md`

Older Markdown is historical/supporting material, not current release authority.
