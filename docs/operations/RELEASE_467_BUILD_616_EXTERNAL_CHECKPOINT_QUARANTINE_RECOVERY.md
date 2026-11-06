# Devil n Dove — Build 616: independent checkpoints, key quarantine and recovery drill

## Deployment boundary

Build 616 deploys a **fail-closed admin-facing software capability**, not a completed external signer enrollment or live provider approval. `main` GREEN means protected source deployment succeeded. It does **not** mean original custody, ledger publication, signed owner consent, live Etsy/Meta provider operations or activation have been independently proven.

- `migrations/proposed/0052`, `0053` and **`0054` are NOT authorized for production or development application**. The protected deployment continues to classify canonical D1 migration inputs separately, with a code-only promotion and zero unauthorized D1 changes.
- All server APIs require an authenticated admin; all mutations and simulated drills additionally require same-origin JSON, CSRF boundary and password step-up. Existing 614/615 APIs now require the proposed quarantine table as well and deny trust if it is absent. The proposed D1 deny-list uses immutable triggers, checks signer ID and **public-key fingerprint**, and is checked by every 614/615/616 proof lookup.
- A key may only be **protectively quarantined**, never activated/unquarantined by app code. A rotation remains `PENDING_INDEPENDENT_ROTATION_APPROVAL` even after four genuine signatures (old issuer, new pending issuer, independent witness and owner). No API changes authority root status or external pin settings.
- The checkpoint verifies a complete bounded 614 ledger up to its signed head and real Ed25519 signatures of an **independently enrolled witness and owner**, retaining the checkpoint's claimed external custody URL/digest. A URL/digest or matching signature alone does **not** prove independent publication or readback. The receipt remains `SIGNED_PENDING_EXTERNAL_READBACK`.
- The recovery button is an **offline, read-only expected-denial simulation**, not a live operational recovery or actual credential failover. It reports observed ledger/quarantine facts and explicitly labels expected negative scenarios as *not executed live*.

## Owner-supervised activation sequence — separate authorization required

1. Have the original issuer independently confirm official custody through the official provider or original signing channel; record evidence reference, timestamp and SHA-256. Never send private keys, passwords or bearer tokens into the UI.
2. Have a separate independent witness and the original owner independently approve their Ed25519 public-key fingerprints and exact authority roles. Record independent signed receipts outside this application. Candidate enrollment alone cannot approve a signer.
3. Review a verified D1 backup and the proposed migration scripts 0052–0054. An independent authorized operator must explicitly approve application; production deployment does not auto-apply them.
4. Once separately authorized, open Admin → Channel Trials → Sections **35–37**. Use server readback to confirm current status; only then accept genuine exact-scope signed checkpoint, controlled quarantine or **pending-only** rotation evidence. A valid signed checkpoint must be independently retrieved from its actual external custody system by someone other than the issuer; the new application cannot claim this check.
5. Review rollback and recovery plans in an owner-supervised maintenance window before any future real activation. External original provider verification, backup key custody, live outage test, explicit owner authorizations and separate gate review remain outstanding.

## Recovery and negative-case checks

`node --test scripts/release467_build613_trust_workbench.test.mjs scripts/release467_build614_trust_authority.test.mjs scripts/release467_build615_custody_ceremony_audit.test.mjs scripts/release467_build616_checkpoint_revocation_recovery.test.mjs`

Build 616 verifies live **cryptographic signatures using generated test keys**, then rejects a mismatched ledger head, changed signed digest, tampered decision, wrong pin, quarantined signing status, signer reuse, expired timestamp and unsanctioned rotation. This is a test fixture, **not** an externally trusted issuer/witness or live activation drill. The proposed SQL is parsed and executed only in ephemeral SQLite memory during tests, never on D1.

## Narrow performance budget review

Before Build 616 runtime was 18,036,711 bytes / 1,808 files (18,040,000/1,808 caps). A measured Build 616 candidate was 18,059,631 bytes / 1,810 files, adding two focused runtime modules for signed checkpoint proof and the guarded server endpoint. Explicit, limited review raises only `max_runtime_source_bytes` to **18,080,000** (+40,000) and `max_runtime_source_files` to **1,810** (+2). All JS/CSS/HTML single-file, inline-data, D1 and CI security thresholds stay unchanged. The runtime source gate remains fail-closed.

## Next proposed Build 617

**Original External Anchor Readback, Quarantine Recovery Approval Packet & Witnessed Provider TEST Preflight** — accept independently retrieved custody receipts and explicit separate authorizations without changing release authority or opening live provider operations until all original signer and owner proof exists.
