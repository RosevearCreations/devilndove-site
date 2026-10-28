# Devil n Dove Build 511 — owner witness follow-up, photo evidence renewal and source/gateway receipts

## Owner screenshot / concrete regression

The October 28 owner screenshot of Product #53 (SKU `DND-01130`, slug `adventurine-argon`) shows the actual existing Etsy draft **#4603838854**, but the button incorrectly displays **“Open Etsy draft #true”** and a read-only saved photo check says the Etsy ID and media receipt disagree. This screenshot does **not** prove that the product and media evidence actually match. Do not create a new draft or blindly attempt a second transfer.

`public/js/admin-product-etsy-package-v500.mjs` now accepts **only a real 1–15 digit safe-integer listing number** as its linked Etsy ID. A `linked:true` Boolean or other nonnumeric API field cannot become `#true` or an update target. Failed partial reads preserve only a **validated numeric ID** from the authoritative Product response. If the saved photo receipt's listing number differs, the UI retains the valid existing draft link for manual review while **blocking all Etsy provider updates** until the discrepancy is resolved. The raw photo receipt is not overwritten.

## Etsy Product #53 review

- New authenticated Admin `GET /api/admin/product-etsy-evidence-renewal-511?product_id=53` independently reads the **exact saved D1 primary claim**, last local Build 510 owner observation, previous visual retest and current source/Etsy photos when the unique saved link is confirmed.
- `POST` with `action=record_claim_witness_followup` may append one **local factual next-review action** only after a Build 510 owner observation. It requires the exact current primary claim state, same-origin verified Admin and one unique request key. A follow-up never asserts that an unlinked/foreign Etsy draft has been repaired or that a Product was linked.
- `POST` with `action=record_three_photo_renewal` can append a **separate Admin's** local verification of originals **#344–346**, their current URLs, unique accepted Etsy photo receipts, matching **unchanged** prior Build 510 fingerprint and the exact saved listing ID. It requires real Canada-only unpublished Etsy readback and explicit visual comparison of all three images. Changed photos, missing receipts, changed listing claim or the same reviewer force **HOLD** and a new source-level owner retest.
- Final Etsy metadata/category/tag/content approval stays separate; neither route creates, updates, uploads, publishes, retries or reassigns a listing.

## QL-243 nonproduction gateway receipt provenance

New verified Admin read-only `GET /api/admin/integration-gateway-receipt-verification-511` compares **actual D1 server-side source nonce receipts** against the current `ROSEVEAR_QL243_NONPROD_KEY_ID` and deployment class. Require both exact health/capabilities GET paths with `source=ai-data-platform`, `destination=devilndove`, `business=devilndove`, null tenant, current key ID, nonproduction scope, proper decision and publication/provider false. The two source receipts must have been recorded within the previous **24 hours**, and any claimed local owner security handoff and independent Build 510 separation review must match the exact receipt IDs, key ID and distinct Admin actors. Denied request counts are only a bounded local diagnostic sample, never independent proof.

**This is source-side provenance verification, not gateway Ed25519 signature verification.** The signed gateway receipts, three independently vetted public SPKI pins, owner identity witness, gateway audit persisted after restart and separately authorized read-only pilot are **not present or verified in Devil n Dove**. The AI Data Platform + Comms Hub QL-243 four-signed-GET external verifier must independently provide that real proof before a subsequent owner decision. The endpoint cannot accept a forged packet or turn on product references, events, commands, communications or data sharing. All states remain `HOLD` and no credentials are embedded in the repo.

## Scope and rollout

- Changes are source/app UI and existing D1 `admin_action_audit` records only. **No schema migration, new D1 database or extra provider write.**
- QL-243 authenticated nonproduction-only GET handshake contract introduced in Build 510 remains unchanged and separately isolated from Production. Deploying this source to Production **does not configure nonproduction credentials or perform a real integration test**.
- Actual Product #53 metadata and media acceptance remains **unverified** until the real owner inspects the existing Etsy draft.
- User's image/photo ownership and final publication approval are not inferred from test fixtures or a green deployment.

## Verification

```sh
node --test scripts/release467_build50*.test.mjs scripts/release467_build510_etsy_witness_ql243_gateway.test.mjs scripts/release467_build511_etsy_evidence_gateway_receipts.test.mjs
python scripts/current_application_quality_gate.py
```

Check the protected `dev` and `main` workflows, Cloudflare Pages deployment and live Product Editor `?v=511` asset after release. The owner can then open [Product #53](https://devilndove.com/admin/product-editor/?product_id=53) while signed in and review the existing draft and photo receipts without allowing automatic Etsy changes.

**Next expected: Build 512 — Etsy Listing-ID/Photo Receipt Conflict Resolution Witness, Independent Photo Renewal Recheck & Gateway External Signature Proof Intake.**
