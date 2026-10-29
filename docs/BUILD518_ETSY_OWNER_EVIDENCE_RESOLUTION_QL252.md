# Build 518 — Etsy owner evidence resolution and QL-252 truthful source handoff

## Owner view: Product #53, existing unpublished Etsy draft #4603838854

- The Build 517 screenshot reported **HTTP 503, Cloudflare reference a51e3ce8fad9ab76-YYZ** during an owner-initiated read. A failed GET does **not** establish that original photos #344, #345 and #346 are missing or that Etsy accepted them.
- **Verify / retry live draft & all 3 photos (read only)** makes three separate independent GET reads. Build 518 shows which one failed without discarding the other two read outcomes. It does not automatically retry, upload an image, update metadata, create a draft or publish anything.
- The photo inventory endpoint returns a bounded diagnostic phase (`primary_product_gallery`, `primary_listing_receipt`, `etsy_credentials_read`, or `etsy_live_draft_and_photo_read`) if its own read fails, without disclosing tokens, IPs or provider response bodies.
- If all three GETs succeed, the existing Build 517 fail-closed assessor still requires the exact Product #53 / Etsy draft #4603838854, unique original/Etsy receipt pairs, freshness, exact live inventory, local saved ID, verified item description/tags, CAD/Canada-only unpublished shipping and a separate real owner decision. Any missing observation remains **HOLD**.
- If Etsy photographs are already present but not locally mapped, use the **Photos are already on Etsy?** comparison to record an independently confirmed match. Do not run the upload control until the read-only checks prove an original is actually missing and that no uncertain earlier upload exists.
- Only after all independent checks are green and we personally inspect the real Etsy draft may **Record owner approval (never publish)** save a local signoff. Software CI is not owner acceptance.

## QL-252 publication blocker: genuine signed proof only

Comms Hub reports that the exact public immutable path `docs/integration/ql246-source-proof.json` returned **404** for Devil n Dove at Build 517 `main` `340d6da39abed229094527dfc91a7fd423fabd02`. We have **not** manufactured a replacement JSON: no independent secure signer, externally supplied current challenge, verified SPKI custody/witness, authenticated owner TEST-only decision, original external gateway GET/denial receipts or durable audit evidence has been supplied to this build.

The existing source contract `functions/api/_lib/ql246Proof513.mjs` expressly rejects a JSON claiming seven actual independently observed denials if those are only synthetic test fixtures. Build 518 adds `scripts/ql252_source_proof_preflight_518.mjs`, an offline *read-only validator* for a real, externally assembled proof. It verifies the strict 24-field source contract, an actual detached Ed25519 signature, full source SHA A matching exact CI head, distinct proof SHA B and independently attested ancestry, plus separately authenticated public key custody and original seven-denial witness requirements. Missing evidence **fails**, not silently defaults to a pass. No private keys or synthetic proof are checked into Git.

### What a separately authenticated operator must supply before a genuine proof is published

1. **Source candidate A is independently retrievable:** Build 517 `main` `340d6da39abed229094527dfc91a7fd423fabd02`, with successful [Production Live Resource Integrity Proof run 40794862120](https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120). GitHub's run metadata states exactly `head_sha=340d6da39abed229094527dfc91a7fd423fabd02`. Separately accept this as source A, or select a newer fully green A after Build 518. Supply an independently generated nonproduction challenge with less than 1-hour validity and actual witness metadata.
2. Use the authorized protected signer in a private environment to sign the exact QL-248/QL-246 canonical `rosevear.integration.v1` 24-field payload referring to A. **Never** claim original GETs or all seven witnessed negative denials were performed if they were not. Transfer only the final publicly safe record; keep private key and out-of-band identity evidence outside GitHub.
3. Independently authenticate the signer/custodian, a different reviewer and their distinct out-of-band public SPKI fingerprints. Obtain a separate owner TEST-only decision; at present **NOT_GIVEN**. No nonproduction gateway requests may be scheduled/executed yet.
4. Once evidence is genuine and current, create later proof commit **B**, descendant of A, containing only that accepted signed JSON at `docs/integration/ql246-source-proof.json`. Source field stays **A**, not B. Promote B through dev/main and verify immutable GitHub raw HTTP 200, exact raw SHA-256, A ancestor of B and the CI URL of A. Return public IDs only.
5. Independently repeat QL-253 checks. The mere existence of this file or its self-verifying signature **never** changes `connection_state: DISCONNECTED` or authorizes a pilot. Production site GREEN is not connected integration GREEN.

### Current public QL-252 return

```yaml
application_name: Devil n Dove
repository: RosevearCreations/devilndove-site
source_sha_A: 340d6da39abed229094527dfc91a7fd423fabd02 (GREEN candidate; not signed)
source_ci_run_url: https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120
proof_commit_sha_B: NOT_AVAILABLE
immutable_public_proof_url: NOT_AVAILABLE (observed HTTP 404 at Build 517 main)
exact_proof_bytes_sha256: NOT_AVAILABLE
public_spki_sha256: NOT_AVAILABLE (UNTRUSTED until out-of-band verified)
out_of_band_custody_receipt_id: NOT_AVAILABLE
distinct_witness_receipt_id: NOT_AVAILABLE
owner_test_decision: NOT_GIVEN
owner_test_receipt_id: NOT_AVAILABLE
actual_gateway_test: NOT_RUN
connection_state: DISCONNECTED
```

The source SHA and CI URL above form a **real exact-head GREEN source candidate**, but they are deliberately **not claimed as a QL-252 signed-source pair**. Signing requires separately authenticated operator evidence. Build 518's actual GitHub `main` SHA/CI and Cloudflare result are recorded separately at promotion time.

## Checks

`node scripts/release467_build518_etsy_readback_ql252.test.mjs` proves partial HTTP 503 stays HOLD, all three GETs are assessed separately, and even cryptographically valid synthetic QL-246 fixtures never satisfy independent custody or witnessed-denial requirements. Historical Builds 515–517 safety tests remain in the current quality gate.

**Next proposed Build 519:** Etsy three-photo matching/readback owner trial completion with clear 503/recovery history, plus QL-253 independently authenticated source-proof and owner TEST-only decision recheck. Only genuine evidence may close either HOLD.
