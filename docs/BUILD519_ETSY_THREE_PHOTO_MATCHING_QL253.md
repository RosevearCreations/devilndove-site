# Build 519 — visible three-photo matching, owner trial and QL-253 public-origin recheck

## Etsy owner workflow — Product #53, existing draft #4603838854

The Etsy page now shows **Match the 3 photos already on Etsy** directly above the final check. It reuses the existing server-side GET and exact-match receipt endpoint; we do **not** create another draft, send a photo or change/publish the Etsy listing during the comparison.

1. Save Product #53, confirm its saved Etsy listing ID is `4603838854` and press **Compare existing Etsy photographs (read only)**.
2. Inspect Product original #344, #345, #346 against the **actual** remote Etsy photographs displayed side-by-side. The screen shows each local mapping separately (`local match recorded` or `needs visual match`). A receipt must refer to the exact current unpublished draft, three distinct original IDs and three distinct remote photo IDs.
3. For an exact visual match only, select that Product image and its identical Etsy photo, check the explicit confirmation and press **Record this existing photo match (no Etsy upload)**. This records one local receipt with a fresh one-time key. An uncertain POST result stays HOLD until re-read; never blindly repeat it.
4. When all three local mappings are present, press **Verify / retry live draft & all 3 photos (read only)** separately. That three-GET verification still checks the current live Etsy inventory, accepted source/image freshness and saved metadata. A 503 is a failed read, **not** evidence of missing photos.
5. We may only record our **local approval of this unpublished draft** after a complete independent verdict and personally viewing the actual item, CAD price, description, category, Canada-only shipping, tags and photographs. A successful code build cannot complete the human owner trial.

The original hidden technical controls remain available for history, but the matching action itself is visible in the normal Etsy process. No automatic upload, Etsy publication, hidden duplicate draft or inferred owner approval is added.

## QL-253 independent public source / proof retry

GitHub's real QL-252 source candidate **A** is Build 517 production commit `340d6da39abed229094527dfc91a7fd423fabd02`. The independently fetched [CI run 40794862120](https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120) reports `head_sha=A`, status completed and conclusion success. At the Build 519 source baseline (Build 518 `main` `26433e69e5bb9b89987950c24ea9896e99610714`), the required `docs/integration/ql246-source-proof.json` still returned **HTTP 404**. No separate signed proof commit **B** or independent custody/witness receipts exists in the available evidence.

`scripts/ql253_public_origin_probe_519.mjs` now supports optional explicitly triggered **public GitHub GETs only**: exact run head/conclusion, immutable raw proof URL at B if supplied (or current main for 404 detection), exact raw SHA-256, signed payload's source A match, and A-to-B compare ancestry. Even proof HTTP 200 would **not** attest signer custody, original negative tests, owner identity or authorization. This probe does **not** invoke `/api/integration/v1/health`, `/api/integration/v1/capabilities`, private gateways, provider POST, or any D1/product write.

Read-only example after independently confirming future SHAs:

```sh
node scripts/ql253_public_origin_probe_519.mjs --public-get <source-sha-A> <current-main-sha> <source-CI-run-id> [proof-sha-B]
```

**Independent evidence still required:** genuine signed QL-246 source proof at immutable B, separate independently authenticated custodian/reviewer and SPKI pins, fresh five-minute nonce/witness, original seven denial observations, actual gateway audit/revocation/restart evidence, and a **separate authenticated owner TEST-only approval** naming a nonproduction tenant, maximum 30-minute future UTC window and only the two GET paths. At this release: owner test decision **NOT_GIVEN**, actual gateway test **NOT_RUN**, connection **DISCONNECTED**.

## Verified checks

- Build 519 pure three-photo assessor tests: identity, duplicates, uncertain claims, visible UI and no provider publication.
- QL-253 public probe synthetic/offline tests: exact source CI plus proof HTTP 404, and A/B ancestry that still cannot authorize connection.
- Historical Builds 515–518 checks remain in the current application quality gate.

**Next proposed Build 520:** Product #53 three-photo readback diagnostic closure and owner-confirmed unpublished Etsy draft acceptance, plus QL-254 verified-proof publication exception aging / scoped owner TEST-only decision continuity (HELD unless genuine evidence arrives).
