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
Release 459 remains the provider setup/authenticated-runtime preparation authority beneath Release 460. Its migration `migrations/dev/20260829_release459_it_provider_setup_authority.sql` is historical and must not be replayed unless read-only verification proves actual drift.

Release 459 D1 convergence was re-probed during Release 460 run `33273639605`; the migration apply step was **skipped** because the authority was already converged.

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
10. `/api/admin/oauth-connections` exposes redacted diagnostics and guarded refresh/disconnect. Raw provider subject/account IDs and token material are not emitted by routine diagnostics.
11. Connection diagnostics calculate local access/refresh health from stored expiry metadata only; this does not contact providers.
12. Provider-subject presence is not intended-account proof. Intended-account verification remains required before any live provider can be accepted.
13. Disconnect destroys local encrypted token material even if remote revocation cannot/should not execute. Generic revoke contracts are mock-proven for X, TikTok and YouTube; unsupported generic revoke paths for Etsy, Pinterest and Meta make no network call.
14. Provider publication is never granted by connection setup and remains closed.

## Release 460 D1 checkpoint
Current migration:
`migrations/dev/20260829_release460_secure_oauth_lifecycle.sql`

It adds only:
- `oauth_authorization_transactions`
- `oauth_provider_connections`
- `oauth_security_events`

Guarded Development D1 run `33273087894` applied and proved Release 460. Later convergence run `33273639602` verified the exact Development database, detected all three OAuth authorities already present, **skipped the migration apply step**, and passed read-only plaintext/FK proof.

Both `.github/workflows/development-d1-release459.yml` and `.github/workflows/development-d1-release460.yml` are now **manual-dispatch only**. Authority/source edits no longer wake historical or converged D1 migration workflows. Manual dispatch is reserved for a future case where read-only verification proves actual drift.

## Release 460 automated proof checkpoint
Exact Development source checkpoint before this documentation sync:
- SHA `03a243176469c42a39bbd99221f7638945975d2a`
- Release 460 Source Gate `33273733112`: GREEN
- System Gate `33273733111`: GREEN
- Cloudflare Pages check `99156783003`: GREEN
- Development preview: `https://95a45cc7.devilndove-site-dev.pages.dev`

The Release 460 Source Gate proves:
- actual Release 460 source/schema invariants;
- executable Web Crypto AES-GCM/PKCE behavior;
- six-provider mock authorization/exchange/refresh contracts;
- safe provider error behavior;
- supported revoke contracts for X/TikTok/YouTube;
- no-network unsupported generic revoke behavior for Etsy/Pinterest/Meta;
- carried Release 459 provider/runtime authority;
- JavaScript syntax;
- explicit Production/provider closed-boundary assertions.

The System Gate also restored/proved the carried Release 448 Supply Sourcing and Calibration workstream authority instead of weakening historical regression coverage.

Key authorities:
- `functions/api/_lib/oauthSecurity.js`
- `functions/api/_lib/oauthProviders.js`
- `functions/api/admin/oauth-start.js`
- `functions/api/admin/oauth-connections.js`
- `functions/api/social/oauth/_callback.js`
- `scripts/release460_secure_oauth_gate.py`
- `scripts/release460_oauth_crypto_proof.mjs`
- `scripts/release460_provider_contract_mock_proof.mjs`
- `.github/workflows/release460-source-gate.yml`
- `.github/workflows/development-d1-release459.yml`
- `.github/workflows/development-d1-release460.yml`
- `docs/operations/RELEASE_460_SECURE_OAUTH_LIFECYCLE_AUTHORITY.md`

## What remains before live provider authorization
Continue automated work first:
- provider-specific intended-account identity retrieval/verification and safe connection labeling using mocks first;
- provider publish-payload validation and idempotency as a separate non-executing layer;
- Stripe/PayPal automated contract/replay/reconciliation preparation;
- Development-to-Production parity, transition and rollback tooling.

Do not request provider authorization merely because Release 460 source/D1/mock proof is green.

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
