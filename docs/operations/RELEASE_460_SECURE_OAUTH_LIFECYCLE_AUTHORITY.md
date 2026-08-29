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
- Diagnostics expose configuration/readiness booleans, safe lifecycle metadata and safe diagnostic codes only.
- Provider subject/account identifiers are not emitted by routine diagnostics. Diagnostics report only whether a provider subject is present and explicitly keep intended-account verification open until controlled provider acceptance.

## Provider contracts
Release 460 defines server-side contracts for Etsy, Pinterest, Meta, X, TikTok, and YouTube/Google. Contracts contain provider endpoints, reference names, scope defaults, PKCE posture, exchange mechanics, refresh mechanics, and revocation capability. They never contain credential values.

Remote revocation is used only where the provider contract has a generic token-revoke endpoint. X, TikTok and YouTube generic revoke contracts are mock-proven. Etsy, Pinterest and Meta currently have no generic revoke endpoint represented by the Release 460 contract; disconnect still destroys local encrypted token material and the unsupported mock path proves that no provider network request occurs.

## Runtime lifecycle
- `GET /api/admin/oauth-start?provider=...` requires an authenticated administrator and is fail-closed with `423 oauth_live_authorization_closed` unless both the exact Development host and the explicit operator switch agree.
- Provider callbacks remain safe readiness pages when browsed normally. A real code/state/error response is rejected while authorization is closed.
- Once deliberately opened later in Development, a callback hashes and atomically consumes state before any provider exchange, exchanges server-side, encrypts returned token material, and persists safe metadata only.
- `GET /api/admin/oauth-connections` is redacted diagnostics. It never emits provider subject IDs or token material.
- Connection diagnostics calculate local-only access/refresh health from stored expiry metadata. This does not contact a provider and does not open the remote execution boundary.
- Intended-account verification remains `required_before_live_provider_acceptance`; subject presence is not treated as proof that the intended business account was connected.
- `POST /api/admin/oauth-connections` supports guarded refresh and idempotent disconnect. Refresh cannot contact providers while the Release 460 remote gate is closed. Disconnect destroys local token ciphertext even while remote revocation is closed.

## D1 migration
`migrations/dev/20260829_release460_secure_oauth_lifecycle.sql` adds only:
1. `oauth_authorization_transactions`
2. `oauth_provider_connections`
3. `oauth_security_events`

Initial guarded Development D1 run `33273087894` applied and verified it. Later convergence run `33273639602` verified the exact Development database, detected Release 460 already converged, **skipped the migration apply step**, and passed read-only post-write proof. Release 459 convergence run `33273639605` likewise skipped its historical migration.

`.github/workflows/development-d1-release459.yml` and `.github/workflows/development-d1-release460.yml` are now manual-dispatch-only recovery workflows. Ordinary source or authority-document pushes no longer launch either D1 migration path. Manual dispatch is reserved for a future case where read-only verification proves actual drift.

## Automated proof
- `scripts/release460_secure_oauth_gate.py` executes the actual migration against a Release 459-compatible local authority and proves state-hash uniqueness/replay constraints plus plaintext-column prohibition.
- `scripts/release460_oauth_crypto_proof.mjs` executes the actual cryptographic helper and proves S256, AES-GCM round-trip, AAD authentication failure, diagnostics redaction, Development-host gating, Production-host refusal, and closed-switch refusal.
- `scripts/release460_provider_contract_mock_proof.mjs` uses only mock credentials and mock fetch responses. It exercises all six provider authorization/exchange/refresh contracts, safe token-exchange failures, supported revoke contracts for X/TikTok/YouTube, and no-network unsupported revoke behavior for Etsy/Pinterest/Meta.
- `.github/workflows/release460-source-gate.yml` runs all Release 460 proofs plus the carried Release 459 gate and closed Production/provider boundary proof.

Exact source checkpoint before final authority synchronization:
- SHA `03a243176469c42a39bbd99221f7638945975d2a`
- Release 460 Source Gate `33273733112`: GREEN
- System Gate `33273733111`: GREEN
- Cloudflare Pages check `99156783003`: GREEN
- Development preview `https://95a45cc7.devilndove-site-dev.pages.dev`

The System Gate also proves the restored carried Release 448 Supply Sourcing and Calibration workstream authority. Historical regression coverage was repaired rather than weakened.

## Remaining automated work before live provider authorization
- Implement provider-specific intended-account identity retrieval/verification contracts using mocks first, then controlled Development acceptance later.
- Add non-executing provider publish-payload validation and idempotency authority as a separate layer; connection setup must never imply publication permission.
- Continue Stripe/PayPal automated contract, replay, webhook/reconciliation preparation.
- Continue Development-to-Production parity, transition and rollback tooling.

## Manual boundary
Do not authorize Etsy/Pinterest/Meta/X/TikTok/YouTube yet. Do not set `OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit` yet. Real provider authorization remains a separate deliberate acceptance activity after automated preparation is exhausted.

Live provider authorization, provider execution/publication, and separate live Production remain closed throughout Release 460 source hardening.
