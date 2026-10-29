# Devil n Dove Build 521 — owner image witness, uncertain Product Save, QL-255

**Application:** `RosevearCreations/devilndove-site`
**Separation:** a GREEN software deployment is not a completed Etsy owner trial or an approved six-app integration connection.

## Product #48: Teal Jasmine Rounds

The owner supplied a screenshot of Product #48 (`DND-01067`, `teal-jasmine-rounds-1067`): the saved Etsy draft ID is **not linked**, and its Product Save returned a Cloudflare 503. The browser draft may have been written, so a repeat Save could overwrite newer fields; this is a **Product server** ambiguity, not evidence of missing Etsy photos.

- `Review saved server copy (GET only)` fetches the authoritative Product detail **once on explicit request**. The Build 521 comparator checks all submitted Product fields. Exact matches mean the original write completed and **no repeat is needed**.
- If any saved field differs, or authority is incomplete, Save remains blocked. The page lists the fields and asks the owner to **Keep current saved server version** or **Restore browser edits for review**. Restoration is local to the form; another POST is **never automatic**.
- Etsy and Facebook destination choices are local preferences only. After a confirmed Product Save, Etsy Create/Update is a **separate manual action in the Etsy tab**. Product #48 must not inherit Product #53's Etsy ID.

## Product #53: existing unpublished Etsy draft

The known owner trial is specifically Product **#53**, Etsy draft **#4603838854**, original photo receipts **#344, #345, #346**. Build 521 reads original gallery and live Etsy photograph receipts and shows the **three exact mapped pairs**, each with two separate previews. It requires all six previews to load. It never decides two photos are identical based on filenames or IDs; an owner must visually inspect each pair and tick a separate session-only visual-witness box before the final owner approval control is enabled.

The final live draft check still reads three independent Etsy/local sources. A previously approved receipt is displayed as accepted only after the **primary D1 owner audit and current Etsy fingerprint** have been read and matched. A 503, missing receipt, mismatched pair, or image load error remains **HOLD**; a read does not upload, publish, or repeat an uncertain approval. No owner acceptance is claimed by this code release.

## QL-255: original source proof and private custodian escalation

The QL-254 Comms Hub snapshot at **2026-10-29T03:42:01Z** found the required public `docs/integration/ql246-source-proof.json` absent (`HTTP 404`) at immutable `main` **`ae145e67d526119a90612e8e4151dc84416d1446`**. The previously tested source A is `340d6da39abed229094527dfc91a7fd423fabd02`, with [exact A CI run](https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120). This does **not** supply a signed proof B.

Run `node scripts/ql255_authentic_proof_custodian_521.mjs --public-get <current-main-full-sha> [real-proof-B-full-sha]` to inspect **public GitHub only** and return actual 404 or verifiable public metadata. `HELD` exit code 2 is intentional. Do not publish a fabricated Ed25519 signature or claim a witnessed pin/custodian, owner approval, gateway GET, private 24/7 relay, or original seven negative-test receipts. Public proof B requires a real signer with securely held nonproduction key, a distinct verified witness, source A exact CI, ancestry and byte digest. A separate authenticated owner TEST-only decision must scope a nonproduction tenant, two health/capabilities GET paths and a bounded UTC window **before** any real gateway request.

**As of this build design:** `proof_commit_sha_B=NOT_AVAILABLE`, `public_spki_sha256=NOT_AVAILABLE`, `out_of_band_custody_receipt_id=NOT_AVAILABLE`, `distinct_witness_receipt_id=NOT_AVAILABLE`, `owner_test_decision=NOT_GIVEN`, `actual_gateway_test=NOT_RUN`, `connection_state=DISCONNECTED`, `exception_state=HELD`.

## Verification and next build

- `node scripts/release467_build521_etsy_identity_save_ql255.test.mjs` — synthetic unit/UI boundary tests, not a live Etsy owner trial.
- `.github/workflows/current-application-quality.yml` — retains earlier release gates and adds the Build 521 test.
- After separate `dev` and `main` GitHub checks and production deployment prove GREEN, verify actual immutable public proof HTTP status again. Report software deployment and integration HOLD **separately**.
- **Next proposed Build 522:** Etsy Product #48 Saved-Server Difference Resolution & Product #53 Live Pair Witness Readback, plus QL-256 Original Source Signer Custody Verification Readiness (HELD).
