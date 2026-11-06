# Devil n Dove — Build 615: Independent Authority Activation Ceremony, Original Custody Readback & Decision-Ledger Tamper Audit

## Truth boundary

Build 615 adds **Channel Trials section 36**, an authenticated `/api/admin/trust-ceremony-615` API and tested server-side ceremony/ledger-verification functions. It builds upon Build 614's Ed25519 original issuer/witness/owner verification and proposed, *not yet applied*, D1 trust registry.

**Production deployment can be GREEN while external enrollment remains HOLD.** No actual independent original-provider custody proof, approved public root pins, real signer activation, authenticated owner operation consent, live Etsy/Meta readback or Production D1 schema migration was supplied for this build. None is fabricated. No endpoint activates an authority, authorizes a provider write or contacts an external provider.

## Activation ceremony: exact technical controls

1. An authenticated admin with password step-up may submit an **unverified original custody candidate**: unique receipt ID, existing pending authority, official HTTPS source locator without credentials/URL query, original source SHA-256, original receipt SHA-256, separate witness and owner IDs, and observed timestamp. The server records `PENDING_EXTERNAL_AUTHENTICATION`; typed notes and hashes do **not** authenticate the provider.
2. Before any cryptographic ceremony can succeed, the original custody receipt must be externally authenticated and independently approved in a controlled record; the candidate's raw Ed25519 public-key fingerprint must exactly match a separately provisioned server-side pin. Both witness and owner must be **different, already active externally authenticated signers** with distinct pinned keys. No API promotes pending custody, provisions pins or bootstraps a root from an arbitrary uploaded key.
3. The candidate proves key possession and the independent witness and owner separately sign the same canonical exact ceremony challenge: candidate ID, pinned fingerprint, original custody ID, **original source and original receipt SHA-256 digests**, unique nonce, and bounded issue/expiry times. All three actual Ed25519 signatures are verified server-side; recycled signers, shared keys, substituted scope, stale challenges and forged signatures fail.
4. A successful check records a tamper-resistant *readiness receipt* with the original proof bundle and `READY_FOR_SEPARATE_CONTROLLED_APPROVAL`. It **does not** perform a database `ACTIVE` update or authorize any Etsy/Meta action. Any actual change to the trusted authority register remains a separate independently witnessed security decision.
5. Existing owner ledger events are reconstructed in sequence. The audit verifies the SHA-256 predecessor/hash chain and each stored signed-event summary against the exact account/SKU/action/digest/owner decision columns, detecting changed events, broken predecessors and non-monotonic sequence numbers. It scans at most **500** rows: more than 500 returns an incomplete-audit HOLD, never an assumed pass. A configured external checkpoint hash may be compared, but without verified independent custody the audit correctly reports `independently_anchored:false`. A consistent local chain is not proof against an attacker rewriting the whole chain.

## Controlled migration and evidence work still required

- The append-only custody and ceremony schema is located in `migrations/proposed/0053_devilndove_build615_custody_ceremony_hold.sql`, depending on the prior **also-unapplied** 0052. Neither file is added to the canonical production migration chain; no Development/Production D1 mutation is authorized by this software-release request. Rehearse separately in an isolated test database, examine backups and complete independent review before any real schema change.
- Confirm issuer source and document hashes **through the provider's authenticated original channel**, independently authenticate the witness and actual owner, and provision externally verified public fingerprints through the approved server procedure. Avoid private keys, bearer tokens, passwords, customer information and unpublished provider content in admin notes or source control.
- Have the independent authority reviewer record an authenticated custody disposition and a separate original owner activation decision; all ceremony signals are non-authorizing until those genuine prerequisites exist.
- Capture a signed or separately witnessed external checkpoint for the ledger if higher assurance is needed. Hash consistency alone is not immutable proof of original custody.

## Owner walkthrough

Open [Admin → Channel Trials](https://devilndove.com/admin/channel-trials/) and locate **section 36**:

1. Click **Audit complete decision chain and original custody status**. With the proposed D1 migrations unapplied, the server should return a 503 / external HOLD, not a fabricated successful audit.
2. Once separately approved and installed, submit **only** a documentary original custody candidate. Its response must remain `PENDING_EXTERNAL_AUTHENTICATION` until independent source verification.
3. Prepare a three-party signed challenge outside the browser using properly custodied **private** signing keys (never upload the keys). Enter only the challenge JSON and signatures for verification. A valid ceremony yields a receipt for separate approval, not activation.
4. Re-run the audit after any independently approved ledger or custody work. Stop if there is a hash mismatch, missing independent source anchor, untrusted key, expired signature, duplicate signer or schema drift.

## Regression and release controls

- Build 615 tests exercise real ephemeral-key Ed25519 signatures, witness/owner independence, pin substitution, expired challenge, wrong original digest, pending custody HOLD, 500-row audit limit, changed ledger content, predecessor conflicts, CSRF/session/step-up source assertions and zero-provider-operation boundaries.
- The protected Quality gate still runs Builds 613–614. System Gate, I.T. Admin Runtime, Repository Hygiene, Cloudflare preview, exact Production deployment and independent live resource integrity remain mandatory.
- **Explicit runtime budget review:** two new isolated server modules raise Release 465's source-file ceiling from 1,806 to **1,808**. The total source measures **18,036,711 bytes**, still inside the existing **18,040,000-byte** ceiling; per-file, inline-data, and fail-closed gates are unchanged. Distinct modules keep cryptographic custody logic isolated from existing provider execution. This is a narrow, reviewed file-count adjustment, not a waiver.

### Next proposed Build 616

**Independent External Checkpoint Anchoring, Key Revocation/Rotation Evidence & Controlled Activation Recovery Drill** — independently verified original anchors and revocation handling, with dry-run recovery and no automatic provider authorization.
