# Devil n Dove Build 617 — external original readback, quarantine recovery packet and witnessed TEST preflight

## Release boundary

Build 617 is **code-only** and fail-closed. Production `main` GREEN means the reviewed application code passed release protections. It does **not** mean official Etsy/Meta issuer custody, witness enrollment, original owner consent, signed original source, a real provider TEST call or a publishing approval has been completed. The last owner-trusted key/custody decisions remain `HOLD`.

The new proposed `migrations/proposed/0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql` is **NOT APPLIED** to development or production D1. Proposed 0052–0055 require an approved backup, independent custodian review, operator permission and explicit owner sign-off. None are installed or applied by a code promotion. Existing D1/production data are preserved.

## What Section 38 actually does

1. **Original external anchor readback:** accepts the SHA-256 of an immutable signed Build 616 checkpoint. The checkpoint already commits to exact external JSON bytes, URL, ledger head, sequence and nonce. Section 38 fetches its original bytes **server-side** over HTTPS from a separately approved original custodian origin. No user-supplied arbitrary URL is fetched. External origin approval is read from an immutable database table that this application cannot populate.
2. The HTTPS call has a five-second timeout, bounded 16KiB JSON, exact status `200`, no credentials, no redirects, no query strings and strict public-host constraints. A changed receipt, redirect, stale/invalid signatures, unpinned signer, quarantined key or ledger divergence fails closed. The external receipt is signed by two distinct independently enrolled Ed25519 **WITNESS** and **OWNER** roles. The hash precommitment uses a shared checkpoint **nonce**, avoiding an impossible circular self-hash.
3. The immutable external readback receipt is labelled `EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING`. It does **not** authenticate the original provider issuer; independent original issuer attestation remains separate.
4. **Quarantine recovery approval packet:** a genuine two-signer scope must bind the existing immutable quarantine, replacement candidate, exact externally read back ledger checkpoint and issuer source digest. The replacement stays pending; no quarantine deletion or key activation is allowed.
5. **Witnessed provider TEST preflight:** permits only `TEST_CONNECTION_READBACK` with an exact signed channel, account, item, source digest, issuer and checkpoint. Requires a currently matching readback, active pinned and unquarantined original issuer, and **externally authenticated original custody** from the earlier ceremony. A valid signed packet can at most stage a **pending final TEST approval**. No GET/POST is made to an Etsy/Meta provider by the application.

## Owner field procedure (not completed automatically)

1. **Ree and Jack:** independently identify the original issuer/custodian through official provider channels. Collect official external source and signed evidence; compare public-key fingerprints outside the application. Never paste private keys, API tokens or passwords into evidence JSON.
2. **Independent custodian/operator:** review proposed 0052–0055, D1 backup/recovery plan and separate owner decisions. If explicitly approved, register the exact external `https://` origin, custodian ID and approval digest through a witnessed privileged database change. The Admin UI cannot self-approve a custodian or apply migrations.
3. **Original external host:** publish the exact signed JSON receipt against the checkpoint's precommitted digest, with two independent witness/owner Ed25519 signatures, a fresh challenge and explicit expiry. The external receipt binds the ledger head, sequence and checkpoint nonce.
4. **Admin → Channel Trials → Section 38:** use the refresh button to see real status. Only after authorized schema installation, supply the immutable checkpoint hash and confirm admin password. The server itself fetches external content; inspect returned receipt digest, signer IDs and `ORIGINAL_ISSUER_PENDING` status. A `503` means the authorized schema and custodian have not been provisioned, not that the system is connected.
5. **Quarantined key:** submit two independent signatures for a scoped recovery packet. Keep the old key blocked and replacement pending until a separate original-issuer and owner decision, witnessed backup, and independent security review.
6. **Provider TEST:** obtain authenticated original issuer custody, verify the current checkpoint, and request the two independently signed exact `TEST_CONNECTION_READBACK` proofs. Section 38 can stage a TEST preflight but **does not run a provider TEST**. A future explicitly approved operator must carry out the first genuine provider challenge and verify an actual signed receipt.

## Verification and runtime budget

`node --test scripts/release467_build613_trust_workbench.test.mjs scripts/release467_build614_trust_authority.test.mjs scripts/release467_build615_custody_ceremony_audit.test.mjs scripts/release467_build616_checkpoint_revocation_recovery.test.mjs scripts/release467_build617_external_readback_recovery_test.test.mjs`

The test suite uses ephemeral Ed25519 keys and mocked external transport; it never claims to have contacted an actual original issuer. It rejects wrong source bytes, redirection, unsafe URLs, mismatched ledger/nonce, stale or invalid scope, quarantined signer and missing custody. Proposed SQL 0052–0055 is parsed/executed **only in temporary in-memory SQLite**, not D1.

Build 616 measured 18,060,054 runtime bytes / 1,810 files with reviewed caps 18,080,000 / 1,810. The Build 617 candidate measured **18,087,473 bytes / 1,812 files** (the two new guarded Worker modules plus a UI section). The narrowly reviewed ceiling becomes **18,100,000 bytes / 1,812 files**. All per-file JS/CSS/HTML, inline media, D1 and required CI gates remain unchanged and fail-closed.

## Next proposed Build 618

**Original Issuer Custody Attestation, Witnessed Backup/Migration Authorization & First Genuine Provider TEST Challenge Acceptance.** This should focus on genuine, independently gathered external evidence and an explicitly authorized first TEST connection; no claim of successful activation until verified from the real original source.
