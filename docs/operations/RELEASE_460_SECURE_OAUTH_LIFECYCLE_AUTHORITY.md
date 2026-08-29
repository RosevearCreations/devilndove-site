# Release 460 — Secure OAuth Lifecycle & Encrypted Token Authority

## Boundary
Release 460 is Development-only on `dev` / `devilndove-site-dev`. The separate live Production application `main` / `devilndove-site` is closed. Provider publication and provider execution are closed. Live OAuth authorization is also closed because `OAUTH_PROVIDER_AUTHORIZATION_MODE` must remain unset until a deliberate Development acceptance step.

Release 460 D1 is already applied and proven. A new chat, workstation, source hardening pass, or authority-document edit is not a migration event. Do not reapply `migrations/dev/20260829_release460_secure_oauth_lifecycle.sql` unless read-only verification proves actual drift.

## Security authority
- `OAUTH_TOKEN_ENCRYPTION_KEY_V1` is the only Release 460 token-encryption secret reference. It must be a 32-byte base64url secret in Cloudflare; its value never belongs in source, D1, Markdown, logs, diagnostics, or browser output.
- OAuth state is random and persisted only as a SHA-256 hash.
- Authorization transactions expire after 10 minutes and are consumed atomically once. Replayed, consumed, expired, unknown, and cross-provider state is rejected before exchange.
- PKCE uses S256 for providers whose Release 460 contract requires/supports it. The verifier is encrypted at rest and cleared after completion/failure.
- Access, refresh, and ID tokens use versioned AES-GCM envelopes with purpose/provider AAD. Plaintext token columns are forbidden by migration proof.
- Diagnostics expose configuration/readiness booleans, safe lifecycle metadata, safe operator-configured labels, and safe diagnostic codes only.
- Provider subject/account identifiers are never emitted by routine diagnostics.
- A provider subject being present is not sufficient: the stored subject must correspond to the explicitly configured intended account before a connection is considered verified.

## Provider contracts and intended-account references
Release 460 defines server-side contracts for Etsy, Pinterest, Meta, X, TikTok, and YouTube/Google. Contracts contain provider endpoints, reference names, scope defaults, PKCE posture, exchange mechanics, refresh mechanics, identity-verification mechanics, and revocation capability. They never contain credential or expected-account values.

Before future live authorization, configure the appropriate Development values through Cloudflare secrets/variables; never write them into source or Markdown:

- Etsy: `ETSY_EXPECTED_USER_ID`; safe label `ETSY_EXPECTED_ACCOUNT_LABEL`.
- Pinterest: `PINTEREST_EXPECTED_USERNAME`; safe label `PINTEREST_EXPECTED_ACCOUNT_LABEL`.
- Meta: `META_EXPECTED_PAGE_ID`; optional linked Instagram proof `META_EXPECTED_INSTAGRAM_BUSINESS_ID`; safe label `META_EXPECTED_ACCOUNT_LABEL`.
- X: `X_EXPECTED_USER_ID`; safe label `X_EXPECTED_ACCOUNT_LABEL`.
- TikTok: `TIKTOK_EXPECTED_OPEN_ID`; safe label `TIKTOK_EXPECTED_ACCOUNT_LABEL`.
- YouTube: `YOUTUBE_EXPECTED_CHANNEL_ID`; safe label `YOUTUBE_EXPECTED_ACCOUNT_LABEL`.

Meta intentionally verifies the managed Facebook Page rather than merely the Facebook login user. When `META_EXPECTED_INSTAGRAM_BUSINESS_ID` is configured, the matched Page must also expose that linked Instagram business account.

Pinterest requests `user_accounts:read` for `GET /v5/user_account`. YouTube requests `youtube.readonly` in addition to upload scope so `channels?mine=true` can prove the authenticated channel. Etsy identity lookup uses both the OAuth Bearer token and the required `x-api-key` request header.

Remote revocation is used only where the provider contract has a generic token-revoke endpoint. X, TikTok and YouTube generic revoke contracts are mock-proven. Etsy, Pinterest and Meta currently have no generic revoke endpoint represented by the Release 460 contract; disconnect still destroys local encrypted token material and the unsupported mock path proves that no provider network request occurs.

## Runtime lifecycle
- `GET /api/admin/oauth-start?provider=...` requires an authenticated administrator and is fail-closed with `423 oauth_live_authorization_closed` unless both the exact Development host and the explicit operator switch agree.
- While the remote gate is closed, OAuth start returns only safe readiness booleans such as provider configuration, encryption authority, intended-account configuration, identity-lookup readiness, and label presence.
- If the remote gate is deliberately opened later, OAuth start still refuses to redirect unless the intended account is configured. Missing intended-account authority fails with `oauth_intended_account_not_configured` before a transaction/state is created.
- Provider callbacks remain safe readiness pages when browsed normally. A real code/state/error response is rejected while authorization is closed.
- Once deliberately opened later in Development, a callback hashes and atomically consumes state before exchange, exchanges server-side, retrieves the provider identity, and compares it with the configured intended account **before token encryption/persistence**.
- Wrong-account authorization fails closed with `oauth_intended_account_mismatch`; provider subject values are not included in the diagnostic.
- A provider identity lookup failure reduces to a local safe diagnostic instead of relaying provider response details.
- `GET /api/admin/oauth-connections` is redacted diagnostics. It never emits provider subject IDs or token material. It reports `verified`, `mismatch`, `unconfigured`, `not_verified`, or `not_connected`, the optional safe account label, and readiness booleans.
- Connection diagnostics calculate local-only access/refresh health from stored expiry metadata. This does not contact a provider and does not open the remote execution boundary.
- `POST /api/admin/oauth-connections` supports guarded refresh and idempotent disconnect. A refresh first obtains the provider token, then re-verifies intended-account identity before encrypting/replacing token material. A failed or mismatched refresh cannot overwrite the previous encrypted connection.
- Disconnect destroys local token ciphertext even while remote revocation is closed.

## D1 migration
`migrations/dev/20260829_release460_secure_oauth_lifecycle.sql` adds only:
1. `oauth_authorization_transactions`
2. `oauth_provider_connections`
3. `oauth_security_events`

Initial guarded Development D1 run `33273087894` applied and verified it. Later convergence run `33273639602` verified the exact Development database, detected Release 460 already converged, **skipped the migration apply step**, and passed read-only post-write proof. Release 459 convergence run `33273639605` likewise skipped its historical migration.

The intended-account layer is source/contract-only and uses the existing internal `remote_subject_id` column. **No new D1 migration is required.**

`.github/workflows/development-d1-release459.yml` and `.github/workflows/development-d1-release460.yml` are manual-dispatch-only recovery workflows. Ordinary source or authority-document pushes do not launch either D1 migration path. Manual dispatch is reserved for a future case where read-only verification proves actual drift.

## Automated proof
- `scripts/release460_secure_oauth_gate.py` executes the actual migration against a Release 459-compatible local authority and proves state-hash uniqueness/replay constraints plus plaintext-column prohibition. It also asserts that callback and refresh identity verification precede any access-token encryption/persistence.
- `scripts/release460_oauth_crypto_proof.mjs` executes the actual cryptographic helper and proves S256, AES-GCM round-trip, AAD authentication failure, diagnostics redaction, Development-host gating, Production-host refusal, and closed-switch refusal.
- `scripts/release460_provider_contract_mock_proof.mjs` uses only mock credentials and mock fetch responses. It exercises all six provider authorization/exchange/refresh and intended-account identity contracts; missing intended-account configuration; wrong-account failure; Meta Page/Instagram mismatch; safe provider identity failure; supported revoke contracts for X/TikTok/YouTube; and no-network unsupported revoke behavior for Etsy/Pinterest/Meta.
- `.github/workflows/release460-source-gate.yml` runs all Release 460 proofs plus the carried Release 459 gate and closed Production/provider boundary proof.

Intended-account implementation checkpoint before this authority synchronization:
- SHA `0a224a8313bda8fc36002149a000742f45c41a41`
- Release 460 Source Gate `33277302902`: GREEN
- System Gate `33277302903`: GREEN
- Cloudflare Pages check `99166205949`: GREEN
- Development preview `https://ac063323.devilndove-site-dev.pages.dev`

Only Release 460 Source Gate and System Gate launched for the source-only implementation checkpoint. No Release 459/460 D1 migration workflow was launched. The System Gate also continues to prove the restored carried Release 448 Supply Sourcing and Calibration workstream authority.

No real provider identity endpoint, authorization endpoint, token endpoint, or publication endpoint was contacted by the intended-account mock proof.

## Remaining automated work before live provider authorization
- Add non-executing provider publish-payload validation and idempotency authority as a separate layer; connection setup must never imply publication permission.
- Continue Stripe/PayPal automated contract, replay, webhook/reconciliation preparation.
- Continue Development-to-Production parity, transition and rollback tooling.

## Manual boundary
Do not authorize Etsy/Pinterest/Meta/X/TikTok/YouTube yet. Do not set `OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit` yet. Real provider authorization remains a separate deliberate acceptance activity after automated preparation is exhausted.

Live provider authorization, provider execution/publication, and separate live Production remain closed throughout Release 460 source hardening.
