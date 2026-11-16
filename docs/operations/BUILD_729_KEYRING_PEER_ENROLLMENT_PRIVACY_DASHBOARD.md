# Devil n Dove Build 729 — Keyring Activation, Independent Peer Enrollment and Privacy Operations

## Source baseline and scope
Follows verified Build 728 Production main `57ef37bda6114ad2345b39e9fda11b20a1485a8f`. Devil n Dove source and Cloudflare only; no changes to AI Data Platform, Rosevear AI Hub, Rosevear Comms Hub, Yard Workers, iCamp or Rosie Dazzlers. Additive cross-app protocol 1.1 preserves 1.0 health and independent releases.

**Important distinction:** Production GREEN means this release's source, canonical migration, Cloudflare deployment and independent live resource integrity passed at one exact main SHA. It does **not** mean Cloudflare secrets are created, historical customer/payment/media data reencrypted, original Masters are running the new receiver, external media is recalled, or any live signed withdrawal has been received.

## Original Admin dashboard — manual, no poll
At `/admin/it-integrations/#privacyOperations729`, authenticated verified Administrators can select:
1. **Read current status**: read-only bounded current D1 vault state, active key ID (not its secret), current encrypted versions needing rotation, per-Master held consent withdrawals, real signed delivery ACK count, aged >24h and >7d, retention pending/approved reviews and legal holds, immutable vault purge receipts.
2. **Verify active key in memory**: requires Cloudflare `DND728_ACTIVE_KEY_ID` and `DND728_ACTIVE_KEY_B64URL`, validates a fresh AES-256-GCM encryption/decryption canary. No plaintext or key readback, D1 write, automated historic rotation or Cloudflare secret creation. The pass is only for that manual live response; GET does not persist/claim a pass.
3. **Request live signed enrollment proof**: select one original Master, confirm, then make a real HMAC-authenticated HTTPS request. Only original Ed25519 signed ACK with exact nonce, digest, peer, outcome and fresh times plus a real immutable D1 readback establishes a current proof. No secrets or customer records in that challenge.
4. **Supervised action**: exact original UUID, human confirmed, reuses Build 728 `retention_prepare_728`, `retention_approve_728`, `retention_execute_728` or `dispatch_withdrawal_728`. Three different original Administrator identities and D1 legal-hold/age/latest-ciphertext checks are mandatory for deletion. Only Build 728 vault ciphertext is eligible, never original customer/media/payment data, R2 or backups.

The protected APIs are:
- GET `/api/admin/production-variable-audit-406?review=729` — names, state and bounded anonymous source IDs only; `Cache-Control: no-store`.
- POST same API with `{ "action": "verify_keyring_729", "owner_review_confirmed": true }`.
- POST same API with `{ "action": "probe_peer_729", "target_app": "ai-data-platform", "owner_review_confirmed": true }` (target also accepts `rosevear-ai-hub` or `rosevear-comms-hub`).

## Cloudflare secrets — owners must configure separately
Follow the earlier [Build 728 Cloudflare configuration guide](BUILD_728_ENCRYPTED_VAULT_DELIVERY_RETENTION.md) first. Set distinct random active key ID/32-byte base64url value, optional retained previous key, and the source withdrawal HMAC key in the correct Cloudflare **Development and Production** environment (different values for different environments). Do not paste secrets into GitHub, logs, screenshots or chat. Keep old key until every version needing it is properly rotated and retention approved. A runtime source release cannot install or reveal Production Cloudflare secrets.

For each Master `AI_DATA_PLATFORM`, `ROSEVEAR_AI_HUB`, `ROSEVEAR_COMMS_HUB`, set `DND728_PEER_<MASTER>_URL`, `_HMAC_KEY_B64URL`, `_PUBLIC_KEY_B64URL`, and `_ENROLLMENT_RECEIPT`. The receiver must be a genuine **original independently enrolled HTTPS service**; operator must verify its public key out-of-band. Configuring a URL/receipt is not independent validation; signed live proof of private-key possession is separate. Do not use fake receivers or test secrets in Production.

## New live peer challenge contract
One additive request sent with no user data:
- POST HTTPS URL, content type JSON, `X-DND-HMAC-SHA256` = lower-case hex HMAC-SHA256 of the original canonical string `JSON.stringify(challenge)`, authenticated with the peer-specific configured 32-byte HMAC key.
- The challenge JSON fields in order: `schema_id:rosevear.dnd.peer.enrollment.challenge.v1`, `from_app:devilndove`, `to_app:<peer>`, `nonce:<16 random bytes as hex>`, `issued_at`, `expires_at` (120 seconds).
- Original receiver must verify HMAC, target identity, timestamp, nonce/replay, and enrollment with its own authority, then return HTTP 200 JSON containing `{ack,signature}`. The exact canonical ACK fields in order: `schema_id:rosevear.dnd.peer.enrollment.ack.v1`, `peer_app`, `challenge_nonce`, `challenge_sha256` (SHA-256 hex of the original JSON challenge), `outcome:ENROLLED`, `issued_at`, `expires_at`. Ed25519 sign UTF-8 of JSON serializing those fields in **that order**. `signature` is unpadded base64url; public key is the independently pinned 32-byte raw Ed25519 key. Expiry, fresh issue time and exact scope are required.
- **There is no claim that these receiver endpoints are built in other repositories yet.** Absent/malformed/unsigned response is HOLD, not a successful enrollment. Keyring canary and peer challenge never call the original withdrawal event `dispatch_withdrawal_728` action.

## Canonical D1 0053
`0053_release467_peer_enrollment_live_proof.sql` adds `dnd_peer_enrollment_proofs_729` with one immutable witnessed row per verified real live challenge, recording peer identifier, nonce, pinned-key and original receipt SHA-256 fingerprints, signed ACK SHA-256 and original Admin identity. No bearer secrets or customer payloads. Source is verified in readback. The dashboard displays current proof only if the original configured pin/receipt still match and the genuine proof is at most seven days old. Configuration or old proof alone remains HOLD.

Production D1 migration 0053 is applied by the existing ordered Development-first / snapshot-backed Production gate **before deploying dependent code**. Run no request-time DDL. On error or schema absence, features HOLD and original Build 728 withdrawal/retention safeguards remain.

## Quality and operational limitations
Required quality scripts are `scripts/build729_live_peer_sqlite_gate.py` (actual SQLite triggers, uniqueness and foreign keys) and `scripts/build729_live_peer_keyring_retention_contract.mjs` (AES canary, private-host rejection, Ed25519 signature replay/expiry/forgery/identity negatives and protected API/UI). No test uses a fake peer to claim Production enrollment.

No background delivery scheduler, key rotation sweep, automatic retention purge, peer out-of-band signer authority, or remote deletion verification is implemented in Build 729. Each requires a separately designed and approved operational capability. Original proof is **possession of the configured Ed25519 signing key after authenticated live request**, not independent confirmation of receiver owner's identity or physical host activation.
