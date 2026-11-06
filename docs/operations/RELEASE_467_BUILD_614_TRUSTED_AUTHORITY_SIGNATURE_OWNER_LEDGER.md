# Devil n Dove — Build 614: Trusted Authority Enrollment, Server-Side Signature Proof & Exact Owner Decision Ledger

## Result and limits

Build 614 adds **Channel Trials section 35** (loaded from the existing section 34 module) and an authenticated, same-origin server API at `/api/admin/trust-authority-614`. The server validates real Ed25519 signatures using Web Crypto for **three separately enrolled identities**: original issuer, independent witness and exact-scope owner. The API is server-side; unlike Build 613's unsigned local worksheet, a typed name or screenshot cannot cause a verified result.

**Production starts and remains HOLD.** The new verification API reports no provider authorization even after correctly verified signatures. No Etsy/Meta read, draft, image, publish, trial, provider write, database schema mutation or external enrollment takes place from this build. Existing documentary Build 613 claims remain untrusted. D1's schema-safe firewall remains in force.

## Trust model

1. An existing authenticated admin, after password step-up, can propose a **public Ed25519 key** with a real official source locator and a distinct independent review reference. It is recorded only as `PENDING_EXTERNAL_VERIFICATION`. Never paste private keys, access tokens, customer details or signatures from a secret source.
2. There is **no public or admin API to activate pending keys**. Activation requires separate approval, direct confirmation of original issuer provenance and independent witness/owner identity, and a controlled database migration/change. The exact SHA-256 fingerprint of each public key must **also** match an independently provisioned server pin `DND_614_VERIFIED_PUBLIC_KEY_PINS` (JSON map of authority IDs to lowercase fingerprints). No pins are generated, assumed or checked into the repository.
3. The signed payload uses a fixed canonical UTF-8 JSON field order and explicitly binds role, original case pin, channel, shop/account, SKU, exact action, original source SHA-256, per-signer nonce, signing time, expiry and decision. The independent witness additionally signs the SHA-256 of the **exact owner's canonical signed decision and signature**, so an unrelated owner signature cannot be substituted. No extra, missing, expired, future or cross-scope claim is accepted. Public Ed25519 raw keys are 32 bytes and signatures 64 bytes. Three distinct authority IDs, public keys and nonces are required. The verifier refuses `PENDING` or `REVOKED` roots, missing pins, changed keys, self-witness, bad signatures and scope substitution.
4. For a successful three-signature proof, the server records only a signed **owner decision** (`APPROVE`, `DECLINE` or `REVOKE`) against the exact case/channel/shop/SKU/action and source digest. The proposed D1 ledger has unique owner nonce, predecessor/event hashes and triggers preventing UPDATE/DELETE. A concurrent head conflict returns 409 for manual independent review; no silent retry or overwriting.
5. A cryptographically valid receipt proves only that the separately pinned keys signed those exact bytes. It does **not** independently establish original provider custody/readback, legal signing capacity, actual owner approval of provider execution, or authority to publish. A separate original-source verification and explicit scoped owner provider trial approval are still required. All API outputs contain `provider_action_authorized:false`.

## Required separate operator/owner work

- Review and separately authorize the proposed SQL `migrations/proposed/0052_devilndove_build614_external_authority_hold.sql` before any Development or Production D1 change. The deployment workflow must **not** apply proposed migrations; only the existing canonical migration process may modify production schema. Do not copy this SQL into canonical migrations without independent approval and backup/readback checks.
- Confirm the actual original issuer through an official account/provider channel; authenticate the independent witness and actual owner independently; record custody and revocation controls. Provision and audit verified fingerprints server-side through the separately authorized hosting secret/configuration process. A signed reviewer statement cannot replace these steps.
- Upon owner authorization, apply the independently reviewed migration to an isolated test database first, verify no business data changes and that UPDATE/DELETE/duplicate events fail, then separately approve production schema operations.
- Record issuer, witness and owner signatures for the exact case and receive a verified receipt. Separately authorize any provider operation with its own live provider account readback and explicit scope; no Build 614 API has such an action.

## HTTP contract (authenticated admin only)

- `GET /api/admin/trust-authority-614`: registry/ledger status (no private keys or secrets); 401 without admin session; 503 when proposed tables not yet authorized/applied.
- `POST` with same-origin `Content-Type: application/json`, current admin session and password step-up, `action: "enroll_pending"`, `candidate: {authority_id,role,public_key,original_source_ref,independent_review_ref}`: pending public-key intake only, no trust.
- `POST` with `action: "verify_and_record"` and `proofs: [{authority_id,payload,signature}, ...]` for issuer, witness and owner: crypto verification + append-only owner decision receipt; 409 on duplicate/reused nonce or concurrent ledger head; 422 for invalid/missing trust. `confirm_password` is transient, never stored.
- All reads and writes are protected with no-store responses. This endpoint never calls providers or returns a provider execution token.

## Verification and production acceptance

`node --test scripts/release467_build613_trust_workbench.test.mjs scripts/release467_build614_trust_authority.test.mjs` includes positive cryptographic proof with ephemeral test-only keys, tamper, scope, invalid root, expired signature, replay, auth, migration-hold and UI regression. The existing quality, preview, I.T. runtime, branch hygiene, production deploy, independent resource integrity, runtime budget and exact-source comparisons remain mandatory.

**Explicit runtime budget review:** Release 465's 18,000,000-byte/1,803-file limit is adjusted narrowly to 18,040,000 bytes and 1,806 files because this security boundary requires a distinct server library, authenticated API and isolated browser UI. The measured post-change source is 18,017,341 bytes (about 0.10% beyond the prior byte ceiling); each separate file is tested. The per-file JS/CSS/HTML limits, inline data-URI limit and fail-closed quality gate are unchanged. The three modules are deliberately not combined into existing administrative/provider logic because doing so would obscure the trust boundary and increase regression risk. This is a reviewed budget adjustment, **not** a waiver.

Next proposed Build 615: **Independent Authority Activation Ceremony, Original Custody Readback & Decision-Ledger Tamper Audit**. This is a proposal, not automatic authorization to apply a migration or activate a provider trial.
