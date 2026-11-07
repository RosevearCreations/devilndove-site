# Devil n Dove Build 618 — original issuer attestation, witnessed backup and first real Etsy TEST

## Precise release boundary

The Build 618 source deploys a genuine **conditional, one-use, read-only Etsy OAuth identity challenge**. It does not imply the original issuer, witness, owner, provider or production D1 has already approved/participated. Software `main` GREEN and original provider TEST ACCEPTED are **separate states**. Both owner signatures and original custody must be real; no demo/fixture can satisfy a production gate.

- `migrations/proposed/0052` through `0056` are **PROPOSED ONLY**. They are **not** automatically applied to development or production D1. A code-only deployment preserves zero unauthorized D1 schema changes and production business records.
- Section 39 is under Admin → Channel Trials. Every POST requires authenticated Admin, same-origin bounded JSON and password step-up; raw OAuth secrets, API keys and private Ed25519 keys must never be pasted in a form or emitted in response JSON.
- The authority enrollment, original source registration, custodian approval, separately witnessed backup restore and original owner TEST grant have **no normal admin API path to self-approve**. A genuine independent operator must conduct custody checks through approved channels and record immutable externally authorized decisions after an explicit witnessed backup.

## How a genuine TEST can be completed

1. **Original official source (external)**: obtain the original Etsy issuer/source receipt, public signing key fingerprint, approved source origin and original independent witness record through trusted official contact. Confirm the document's SHA-256 independently. The existing Build 617 external readback must actually retrieve the exact anchored bytes and match independent signer signatures.
2. **Ree / original owner and independent witness**: sign the exact Build 618 issuer challenge. It binds the provider `ETSY`, pending original issuer ID, custody receipt ID, external checkpoint digest, original source digest, receipt digest, unique nonce and expiry. An original issuer candidate signs it too. The app verifies all three Ed25519 signatures but leaves issuer key activation on HOLD.
3. **Admin Section 39 — original issuer**: stage this exact signed attestation. The proposed `dd618_original_source_registrations` table must first have been independently approved by the original issuer's separate operator. A typed source URL or locally invented key cannot satisfy this requirement.
4. **Backup and migration authority**: capture the actual D1 backup with an independently verified digest and restore test; hash the exact reviewed proposed-migration manifest. The independent witness and owner sign a backup packet with `AUTHORIZE_INDEPENDENT_REVIEW_ONLY`. This stage never applies SQL. Separately authorized operators must record independent original custody decision and `INDEPENDENTLY_RESTORED_AND_WITNESSED` backup verification in protected database tables. Without both, the provider TEST remains blocked.
5. **TEST-only grant**: a separate original operator and owner independently approve one exact pending Build 617 `TEST_CONNECTION_READBACK` preflight (Etsy shop, source digest, issuer and nonce), custody attestation digest, verified backup digest and current external checkpoint. They create **one** immutable `dd618_original_test_grants` row with status `INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET`. The application cannot create a grant. The original issuer's public key must be independently pinned and not quarantined.
6. **First genuine Etsy GET**: in Section 39, enter the approved `grant_id` and confirm the admin password. The server rechecks the exact preflight, current ledger head, separately approved original custody/backup restore, verified matching Etsy shop and unexpired existing OAuth `shops_r` token. It atomically reserves the challenge nonce in `dd618_provider_test_attempts` **before** any remote request, preventing an app retry or concurrent second GET.
7. The only allowed provider request is HTTPS `GET https://api.etsy.com/v3/application/users/me` with existing decrypted server-side Etsy credentials, a 10-second timeout, manual redirect rejection, bounded JSON and user ID equality against the connected shop owner. No listing/product/messaging creation or update occurs. The response SHA-256 and exact user ID are recorded; no PII payload or token is stored. Failure spends the nonce; a new separately approved grant is required for another attempt.
8. **Independent acceptance**: after a real verified GET response, original owner and witness separately sign the exact receipt hash, one-use grant ID, preflight, checkpoint, user ID, challenge nonce and decision `ACCEPT_EXACT_ETSY_READ_ONLY_TEST_RECEIPT`. Section 39 verifies and records this acceptance **without** granting publishing or future provider actions. Etsy publishing remains separately governed and held.

### If the Admin page says HOLD or 503

This is expected if the proposed D1 trust schema is not separately approved/installed, original issuer source is not independently registered, backups have not been physically restored/verified, or no genuine TEST grant exists. Repeating the software build does **not** create the missing external authority. Do not synthesize proof objects, auto-authorize migrations, bypass the original owner, or paste OAuth tokens into the UI. Meta/Facebook/Instagram TEST remains outside this single-Etsy-GET build.

## Tests and evidence

`node --test scripts/release467_build613_trust_workbench.test.mjs scripts/release467_build614_trust_authority.test.mjs scripts/release467_build615_custody_ceremony_audit.test.mjs scripts/release467_build616_checkpoint_revocation_recovery.test.mjs scripts/release467_build617_external_readback_recovery_test.test.mjs scripts/release467_build618_original_issuer_backup_etsy_test.test.mjs`

Tests generate independent short-lived Ed25519 fixtures and use **mock transport only** for the Etsy GET. They prove exactly one hardcoded GET endpoint with OAuth headers, identity validation, bounded response handling, bad signature/source rejection, expiry, quarantine and missing witness/owner/backup denial. This is **not evidence of a real Etsy TEST having occurred**. Proposed SQL 0052–0056 is executed for syntax only inside temporary in-memory SQLite, never connected to Cloudflare D1.

## Explicit performance budget review

Build 617 source runtime measured 18,087,475 bytes / 1,812 files with approved caps 18,100,000 / 1,812. Build 618 measures approximately **18,122,289 bytes / 1,814 files**. The narrow reviewed runtime-source thresholds become **18,140,000 bytes** and **1,814 files** to include the two guarded Worker modules and the Section 39 UI. Per-file JS, CSS, HTML, media, CI, D1, security and production integrity controls are unchanged and fail-closed.

## Next proposed Build 619

**Actual Etsy TEST Receipt Reconciliation, Single-Use Failure Custody & Meta Read-Only Capability Preflight** — reconcile separately witnessed real GET outcomes, provide owner-supervised failure recovery without replaying a spent grant, and begin protected Meta TEST readiness without opening publication.
