# Devil n Dove Build 728 — Private Evidence Vault, Key Rotation, Verified Withdrawal Delivery and Supervised Retention

## Baseline, scope and real-world claims
Build 727 `main=9db435450045f2be8959aefc73bc23797536ec86`, with independently successful Production Pages Deploy #43891326694 and Production Live Resource Integrity Proof #43891584300. Development was a clean fast-forward to that Production source before Build 728. This is **Devil n Dove only**: other six apps and Vercel targets are not deployed or modified. Protocol 1.1 is additive, preserving legacy 1.0 health/capabilities; no seven-app lockstep.

This release introduces operational functionality, **not** an assertion that every historical customer/payment/media row has been encrypted, every Cloudflare secret has been installed, a cross-app receiver has been enrolled, already published media has been recalled, or data in backups and other applications has been deleted.

## Canonical forward-only D1 migration 0052
`migrations/canonical/0052_release467_private_evidence_vault_withdrawal_retention.sql` and manifest v52 add:
- Immutable `dnd_evidence_vault_728` metadata only (64-char tenant-scope hash, allowed purpose, bounded retention, legal-hold bit and original Admin ID; no plaintext or encryption key).
- Append-only `dnd_evidence_versions_728` AES-256-GCM ciphertext with 96-bit random IV, key ID, version, SHA-256 digest and prior-version link. AAD cryptographically binds original evidence ID, tenant hash, purpose, version and key ID. Concurrency-safe version INSERT and exact readback. Older ciphertext remains until independently approved retention; don't remove old keys before all rotations and ciphertext retention complete.
- `dnd_withdrawal_outbox_728` a locally held source-only immutable three-Master queue containing HMAC-SHA256 scope, random nonce, internal consent record FK, target and original Admin ID; no customer name, address, payment token, media URL or raw consent key. D1 unique `(consent_record_id,target_app)` ensures replay/duplicate resistance.
- `dnd_withdrawal_acks_728` immutable one-ACK-per-event evidence, written only after an actual live configured HTTPS response and pinned independently enrolled Ed25519 public-key verification. An ACK proves receipt of that **one** event, not remote erasure, provider takedown or all apps CONNECTED.
- `dnd_evidence_retention_reviews_728` and `dnd_evidence_purge_receipts_728`: independent requester and approver and *third* distinct executor; no legal hold, current version exact digest, age/retention review and transactional D1 ciphertext deletion with immutable proof. Deletes **only Build 728 vault ciphertext versions**, never original historical customer/payment/media D1 rows, audit evidence, externally published media, R2 objects or backups.

Development-first migration apply/proof, then snapshot-backed guarded Production D1 apply/proof **must** succeed before dependent Production code. All D1 checks are real, not simulated.

## Original active Admin API
Protected `GET /api/admin/production-variable-audit-406?review=728` returns sanitized key presence and count/status, no plaintext, no secrets and no raw customers. Original same-origin authenticated Administrator `POST /api/admin/production-variable-audit-406` actions require `owner_review_confirmed:true` and support:
- `vault_store_728`: `tenant_scope_sha256` (64 lowercase hexadecimal), `purpose` (one of `security_evidence`, `consent_withdrawal`, `retention_review`), `retention_days` (1–3650), unique `request_key` (16–80 chars), `evidence_payload` (object up to 4096 JSON chars), optional `legal_hold`. Real D1 atomic metadata plus encrypted version insert and SHA readback. No plaintext response.
- `vault_rotate_728`: `evidence_id`. Decrypt previous key-bound ciphertext *server-side only* and append new encrypted version under current active key. No automatic key removal and no client plaintext.
- `retention_prepare_728`: `evidence_id`; expired original record and exact latest digest required. Writes pending review, does not delete.
- `retention_approve_728`: `review_id`; requires a different active Administrator than requester, no deletion.
- `retention_execute_728`: `review_id`; requires a third different active Administrator. Batch creates immutable purge receipt and deletes only vault ciphertext versions; post-write readback required. No customer record or R2 deletion.
- `dispatch_withdrawal_728`: `event_id`; only for revoked/blocked original consent; requires receiver's original enrolment marker, HTTPS public endpoint, per-peer outgoing HMAC secret and pinned Ed25519 public key. Real live 200 JSON + matched scope, nonce, event, target, fresh timestamp and Ed25519 signature + D1 readback; otherwise HOLD.

The existing original Admin `POST /api/admin/media-consent-records` supports `action:'enqueue_withdrawal_728'` with `consent_record_id` and `owner_review_confirmed:true`. Build 727 withdrawals still immediately block local posting; if the Build 728 source HMAC secret or migration is unavailable, the application honestly returns `HOLD_WITHDRAWAL_HMAC_SECRET_MISSING` or `HOLD_D1_SCHEMA_OR_OUTBOX_WRITE`, with the local revocation preserved. Enqueue can be retried after configuration.

## Cloudflare configuration — keys must be secret bindings, never GitHub files
Create these in Cloudflare Workers/Pages deployment secrets for **the relevant environment**; choose unique values for Development and Production:
- `DND728_ACTIVE_KEY_ID`: e.g. `dnd728keyv1` (nonsecret identifier). `DND728_ACTIVE_KEY_B64URL`: generated 32 random bytes encoded as unpadded base64url. Do not reuse `SESSION_SECRET`.
- `DND728_PREVIOUS_KEY_ID` and `DND728_PREVIOUS_KEY_B64URL`: optional until rotating; must be the prior **same 32-byte key** and distinct key ID.
- `DND728_WITHDRAWAL_HMAC_KEY_B64URL`: another separate random 32-byte base64url secret for local scope hashing.
- For each independently enrolled peer, set `DND728_PEER_AI_DATA_PLATFORM_URL`, `DND728_PEER_AI_DATA_PLATFORM_HMAC_KEY_B64URL`, `DND728_PEER_AI_DATA_PLATFORM_PUBLIC_KEY_B64URL`, `DND728_PEER_AI_DATA_PLATFORM_ENROLLMENT_RECEIPT`. Replace prefix for `ROSEVEAR_AI_HUB` or `ROSEVEAR_COMMS_HUB` independently. HMAC is a *different per-peer secret*. Receiver must implement the matching `rosevear.dnd.consent.withdrawal.v1` original listener and return `rosevear.dnd.consent.withdrawal.ack.v1` Ed25519 signed ACK (fixed field order specified in source). A merely configured URL is not proof the receiver exists or is healthy.
- Generate independent random 32-byte values using a local cryptographic generator, for example in PowerShell: `$bytes = [byte[]]::new(32); [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes); [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')`. Generate a **new value for each** secret. Never paste values into support tickets, source, CI logs, this document or screenshots.

**Do not configure a fake endpoint, use a test key in Production, or enable a live receiver on a claim of source compatibility alone.** Do not use an application secret in a deployed client bundle.

## Evidence and limits
- Tests: `scripts/build728_vault_sqlite_gate.py` tests actual SQLite constraints (not D1/Cloudflare live acceptance); `scripts/build728_evidence_vault_delivery_retention_contract.mjs` tests AES-GCM, keyring, tenant AAD, Ed25519 ACK replay/expiry/forgery denial, retention holds and unauthenticated admin; both required under Current Application Quality Proof.
- This is a narrowly scoped encrypted evidence store for newly submitted records. Existing Stripe/PayPal tokenization/provider and historical media storage remain on their original owners. The app does not decrypt or copy source payment data automatically.
- No background sender, nightly deletion cron, R2 object purge, external provider recall or all-seven-app receiver activation. Operator-driven requests require authentic original Admin and explicit proof; missing dependencies HOLD instead of silently marking completed.
- Production GREEN means the code, migrations, Cloudflare deployment and independent live resource checks succeeded on the **same exact main SHA**; it does not assert peer receipt while peer enrolment is absent.
