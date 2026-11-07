# Build 628 — Original Meta signed decision custody and owner-controlled go-live review

Build 628 adds **Admin section 49**. It verifies the *original* three-party signed Build 627 decision against a **currently valid, genuinely witnessed historical Meta Page-ID GET**, checks a second fresh three-party signed custody attestation, and can store both signed packets in an immutable original-source D1 table. It also prepares a separately reviewed, **read-only owner handoff candidate**.

**GREEN production deployment does not mean Meta is operationally connected.** Neither a signed archive URL nor a stored custody packet proves an independent HTTPS archive readback. The Build 628 verifier therefore always reports `archive_contents_independently_read_back: false`, `go_live_eligible: false`, `connected: false` and `publishing_enabled: false`. No provider request, OAuth credential renewal or Meta posting is performed.

## Original owner steps

1. Sign in to the Devil n Dove **Admin → section 49** and choose **Refresh original signed custody and eligibility**. The GET is authenticated and no-store; it shows whether the original 627 live-source proof remains current, whether the proposed custody table is present, and the most recent original custody digest. It never sends a Meta GET or fetches archive URLs.
2. If any original proof is HOLD, return to **sections 44–48**. Complete original issuer, independent witness and owner verification, current public-key pins, external archive continuity and actual original Meta receipt verification. The signed Build 627 `payload` plus three `signatures` must refer to that exact one witnessed GET and be **within its own expiry**. Expired approval is not automatically renewed.
3. When `owner_custody_schema_present: false`, an authorized original-source database operator must independently approve the proposed [migration 0063](../../migrations/proposed/0063_devilndove_build628_original_meta_decision_custody_hold.sql), confirm backup/restore, and verify that the prior proposed **0052–0062** migrations are genuinely present. Apply in the approved Development→Production sequence and read back the exact original tables. **A GitHub deployment does not apply proposed SQL.** No database migration, credential enrollment or independent authority registration is performed by section 49.
4. In section 49, enter the *public* signed Build 627 decision bundle from section 48 (no private keys or Meta tokens). Enter admin step-up password and click **Prepare exact UNSIGNED original custody template**. This checks the original signatures and receipt again and constructs the exact packet digest. An unsigned template is not a trusted decision.
5. Original owners separately archive the **unaltered exact signed 627 JSON packet**, using **two independently controlled HTTPS archives**. The template requires two different HTTPS hostnames and the same SHA-256 of the exact serialized packet. That equality is a signed *claim* that must later be tested against actual independently fetched bytes; it does **not** establish remote readback automatically. Never put account credentials, query tokens or keys in archive URLs.
6. Complete the unsigned custody template with two genuine, credential-free archive locations, a fresh nonce, current UTC `issued_at` and `expires_at` at most ten minutes later **and before the underlying 627 decision expires**. The original `ISSUER`, independently authenticated `WITNESS`, and `OWNER` each sign the **same canonical Build 628 payload** with their original separately held Ed25519 keys. Do not have the application mint another person's signature or paste private keys into the page/chat/GitHub.
7. Paste the three-party public signed custody JSON (`payload` + `signatures`), enter admin step-up password and click **Archive three-party SIGNED original decision custody (APPEND ONLY)**. The server rechecks the actual source GET, original signer identities/pins/quarantine, all exact hashes, two different HTTPS archive hostnames, the original window and expiry. If approved, the 0063 table stores the immutable original signed decision and custody packet. There are no UPDATE/DELETE routes or database triggers permitting edits. Retain the original packet independently; the D1 row is an additional custody record.
8. Use the returned `custody_sha256` in **Prepare independently checked OWNER REVIEW handoff**. The server re-reads the immutable signed packets, recomputes both decision and custody hashes, revalidates current original external authority and exact saved provider GET receipt, and checks that database fields have not changed. It returns a review packet for human inspection and controlled export. When the original approval expires, prepare a completely **new** authorized decision; an old custody record remains historical evidence, not a standing approval.
9. The original external custodians and witness must independently fetch/read back the actual archived bytes and provide separately authenticated evidence of that readback. **Build 628 does not do that remote fetch and will not claim it has occurred.** Only an additional separately signed and governed operational go-live authorization may advance the connection to a future authorized implementation. Do not publish, change Meta OAuth scopes or mark the channel connected on the basis of this owner review candidate.

## Verifiable states

| Result | Interpretation |
|---|---|
| `signed_original_single_get_current` | The original 626/627 current source witness can be re-read. False means HOLD. |
| `owner_custody_schema_present` | Table `dd628_original_meta_signed_decision_custody` exists on the queried D1 database; presence alone is not proof of approval. |
| `verified_original_custody_signatures` | Fresh original issuer, separate witness and owner signed the exact custody packet, with original identity/key pins intact. |
| `original_owner_signed_custody_recorded` | Owner-supervised immutable D1 insert succeeded. Does not activate Meta or confirm remote bytes. |
| `immutable_original_custody_readback_verified` | Previously saved signed packet, current source GET and stored hashes match exactly at review time. |
| `archive_contents_independently_read_back: false` | **Actual independent external archive retrieval is still outstanding.** Two URLs and signed hashes alone are insufficient. |
| `owner_handoff_review_candidate_only`, `go_live_eligible: false` | The verified packet is a controlled human review handoff, **not** operational approval. |

### Release and security boundaries

- Authenticated GET: `/api/admin/trust-custody-handoff-628`. Same-origin JSON POST uses **admin step-up** for all three exact actions: `prepare_custody_template` (no write), `archive_signed_original_custody` (one immutable signed record), and `prepare_owner_review_handoff` (no write).
- The ONLY new database mutation is the explicit original-owner-approved signed custody INSERT, after separate signatures and actual source readback. The source migration file is **proposed** and not included in the canonical automatic migration stream. There are no Meta provider calls, automatic token refreshes, credentials in responses or post/publish actions.
- Runtime measurements increase from 1,832 files / 18,337,104 bytes to **1,834 files / 18,357,421 bytes**. The narrowly reviewed limit becomes **1,834 files / 18,361,000 bytes**. All other file-size, inline-data, migration and protected release checks are unchanged.

```sh
node --test scripts/release467_build628_meta_custody_handoff.test.mjs
node scripts/release467_build609_ci_bundle.mjs
python3 scripts/migration_policy_gate.py
python3 scripts/release465_performance_budget_gate.py
python3 scripts/current_application_quality_gate.py
```

External references: [Meta Graph API overview](https://developers.facebook.com/docs/graph-api/overview/), [Cloudflare D1 migrations and approvals](https://developers.cloudflare.com/d1/reference/migrations/). Original source verifiers: `functions/api/_lib/trustChannelDecision627.js`, `trustCustodyHandoff628.js`, and the signed source readback in `functions/api/admin/trust-channel-decision-627.js`.
