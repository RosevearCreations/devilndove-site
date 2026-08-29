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
9. Even after that switch is deliberately opened later, OAuth start refuses to redirect unless the provider-specific intended account reference is configured.
10. Real callback responses are rejected with no exchange while the gate is closed. Normal callback browsing remains a safe readiness page.
11. Once deliberately opened later, a callback exchanges server-side and retrieves/verifies provider identity **before any newly returned token is encrypted or persisted**. A mismatch fails closed and consumes the one-time transaction.
12. Refresh repeats intended-account identity verification before refreshed token material can replace an existing connection.
13. `/api/admin/oauth-connections` exposes redacted diagnostics and guarded refresh/disconnect. Raw provider subject/account IDs and token material are never emitted.
14. Connection diagnostics use safe account labels and local expiry metadata only; this does not contact providers.
15. Disconnect destroys local encrypted token material even if remote revocation cannot/should not execute.
16. Provider publication is never granted by connection setup and remains closed.

## Intended-account authority
Before future live authorization, configure the correct Development secret/variable references. Values never belong in source or Markdown.

- Etsy: `ETSY_EXPECTED_USER_ID`; safe label `ETSY_EXPECTED_ACCOUNT_LABEL`
- Pinterest: `PINTEREST_EXPECTED_USERNAME`; safe label `PINTEREST_EXPECTED_ACCOUNT_LABEL`
- Meta: `META_EXPECTED_PAGE_ID`; optional `META_EXPECTED_INSTAGRAM_BUSINESS_ID`; safe label `META_EXPECTED_ACCOUNT_LABEL`
- X: `X_EXPECTED_USER_ID`; safe label `X_EXPECTED_ACCOUNT_LABEL`
- TikTok: `TIKTOK_EXPECTED_OPEN_ID`; safe label `TIKTOK_EXPECTED_ACCOUNT_LABEL`
- YouTube: `YOUTUBE_EXPECTED_CHANNEL_ID`; safe label `YOUTUBE_EXPECTED_ACCOUNT_LABEL`

Meta verifies the intended managed Facebook Page and optionally its linked Instagram business account. Pinterest includes `user_accounts:read`; YouTube includes `youtube.readonly` so account/channel identity can be proven before publication is considered.

## Non-executing publication planning
Release 460 now has a separate six-provider local validation/idempotency layer.

- `functions/api/_lib/socialPublishContracts.js` owns local publication validation for Etsy, Pinterest, Meta, X, TikTok and YouTube.
- `/api/admin/provider-publication-plan` is admin-only and Development-host-only.
- It validates/normalizes a publication intent and creates a deterministic SHA-256 idempotency key from provider + local source key/version + canonical normalized payload.
- Identical normalized intents yield the same key and can be duplicate-blocked; revisions yield a new key.
- It never reads/decrypts OAuth token material and never calls a provider.
- The executable proof monkeypatches `fetch` and requires exactly zero network calls.
- Instagram planning is deliberately marked permission-contract-not-ready rather than claiming current Meta OAuth setup grants Instagram publication.
- Planner output is validation-only; it does not claim a provider will accept the payload.

## Legacy provider execution closure
The Release 460 HTTP authority now hard-closes the retained Build-era provider routes:

- `POST /api/admin/social-post-queue` action `publish_platforms` is intercepted in admin middleware and returns `provider_execution_closed` before the retained owner handler runs.
- `POST /api/admin/social-product-automation` action `test_meta_connections` is also intercepted before owner execution.
- `social-product-automation.js` is additionally owner-hard-closed: the old Meta Graph client and `fetch()` path were removed; direct invocation returns `provider_execution_closed` with `provider_contacted:false`.
- Legacy social GET diagnostics are currentized so old credential presence cannot appear as `api_ready`; exposed readiness is `provider_execution_closed`.
- `social-post-queue.js` still contains historical provider emitter functions behind the mandatory middleware guard. They are **not** an authorized Release 460 execution path; later physical removal is technical-debt cleanup.
- Meta data-deletion readiness remains local/fail-closed and makes no provider request.

## Release 460 D1 checkpoint
Current migration:
`migrations/dev/20260829_release460_secure_oauth_lifecycle.sql`

It adds only:
- `oauth_authorization_transactions`
- `oauth_provider_connections`
- `oauth_security_events`

Guarded Development D1 run `33273087894` applied and proved Release 460. Later convergence run `33273639602` verified the exact Development database, found the OAuth authorities already present, **skipped migration apply**, and passed read-only plaintext/FK proof.

The intended-account and publication-planning layers required **no new migration**.

Both `.github/workflows/development-d1-release459.yml` and `.github/workflows/development-d1-release460.yml` are **manual-dispatch only**. Ordinary source/authority edits do not wake them.

## Latest implementation checkpoint
Exact Development source checkpoint before this authority synchronization:
- SHA `9eb50239efca5f1c5c34dcd504d49fde718f3033`
- Release 460 Source Gate `33279263075`: GREEN
- System Gate `33279263080`: GREEN
- Cloudflare Pages check `99171549842`: GREEN
- Development preview: `https://95326a5a.devilndove-site-dev.pages.dev`

The focused proof now covers:
- actual Release 460 source/schema invariants;
- executable Web Crypto AES-GCM/PKCE behavior;
- six-provider OAuth exchange/refresh/identity contracts with mocks;
- intended-account configuration and mismatch failure;
- refresh identity re-verification before token replacement;
- local six-provider publication validation and deterministic idempotency;
- sensitive publication-input rejection;
- zero-network publication mock proof;
- Development-only publication-plan endpoint;
- middleware closure of retained publish/probe HTTP actions;
- removal of the legacy Meta probe client from its owner module;
- currentized legacy readiness so credentials cannot imply execution readiness;
- carried Release 459 authority, JavaScript syntax, and explicit closed Production/provider boundaries.

No real provider authorization, identity, token, probe, or publication endpoint was contacted by these proofs. No Release 459/460 D1 migration workflow launched from the source-only checkpoint.

Key authorities:
- `functions/api/_lib/oauthSecurity.js`
- `functions/api/_lib/oauthProviders.js`
- `functions/api/_lib/socialPublishContracts.js`
- `functions/api/admin/oauth-start.js`
- `functions/api/admin/oauth-connections.js`
- `functions/api/admin/provider-publication-plan.js`
- `functions/api/admin/_middleware.js`
- `functions/api/social/oauth/_callback.js`
- `scripts/release460_secure_oauth_gate.py`
- `scripts/release460_oauth_crypto_proof.mjs`
- `scripts/release460_provider_contract_mock_proof.mjs`
- `scripts/release460_publish_contract_mock_proof.mjs`
- `.github/workflows/release460-source-gate.yml`
- `.github/workflows/development-d1-release459.yml`
- `.github/workflows/development-d1-release460.yml`
- `docs/operations/RELEASE_460_SECURE_OAUTH_LIFECYCLE_AUTHORITY.md`

## What remains before live provider authorization
Continue automated work first:
- Stripe/PayPal automated contract/replay/webhook/reconciliation preparation;
- Development-to-Production parity, transition and rollback tooling;
- remove retained unreachable legacy social provider emitters as cleanup without opening provider execution.

Do not request provider authorization merely because Release 460 source/D1/mock proof is green.

## Manual boundary later
Only after automated preparation is exhausted:
- authenticated Development runtime evidence;
- CAIP private-media browser proof;
- Stripe test transaction/webhook/reconciliation;
- PayPal sandbox transaction/webhook/reconciliation;
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
