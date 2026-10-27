# Build 505 — Local Etsy Claim Conflict Owner Resolution, Original Gallery Remediation & Sign-Off Retest

## Problem / authority

The owner has **Devil n Dove Product #53** (`Adventurine Argon`, SKU `DND-01130`) and Etsy **unpublished draft #4603838854**. The draft was observed in Etsy, but a local claim blocked linking and the local transfer receipts did not yet establish all three approved Product photos (#344, #345, #346). The saved search override `Soap bars`, title-only description, and apparent Etsy category `Bar Soaps` still need actual owner review. The existing Etsy listing must not be deleted, duplicated, published or replaced automatically.

## Shipped

1. **Step 1: compare both records.** A verified administrator can perform a live, read-only Etsy ownership, draft state and Canada-only shipping verification while inspecting which other local Product claims the exact Etsy ID. The UI identifies that Product and supplies a link to its editor.
2. **Only with two explicit owner checks**, and only when the Etsy title matches the desired Product, the other Product title does *not* match, no prior provider writes/photos were attempted from that claimant and no second local receipt claims the ID, the owner may move the *single existing* `marketplace_syndication_drafts` record to the correct Product. The move is one guarded conditional D1 update; its payload preserves old Product ID, new Product ID, unique request key and listing ID. The separate audit records who approved it. No Etsy request except safe live GETs, no deletion, no duplicate record or publication. An ambiguous claim remains HOLD for independent review.
3. **Step 2: compare existing photos.** A read-only gallery shows eligible originals alongside the exact live Etsy listing's photos, revealing pre-existing mappings. The owner selects one unmatched Product original and one unmatched Etsy image, looks at both, and checks that they depict the **same exact photo**. The server re-verifies the same unpublished Canada-only draft, approved gallery, live photo ID, current match uniqueness and absence of unresolved uploads before inserting a local `etsy_505_owner_existing_image_matched` audit receipt. Nothing is uploaded. Photos that cannot be matched remain HOLD, or may follow the existing separate at-most-once upload once the remote inventory has been reconciled.
4. Existing photo inventory and final sign-off read both provider-confirmed upload receipts and owner-witnessed matching receipts; live Etsy photo IDs are rechecked before approval. Product title, substantive description, CAD price, quantity, category, Canada-only shipping and native tags still must be correct. The owner must expressly approve them; no automatic bypass or silent change.
5. Keeps the existing metadata/tag/advanced workflows and responsive storefront cards. Uses existing D1 tables, no new database or migration.

## Owner instructions

1. Open [Devil n Dove Product #53](https://devilndove.com/admin/product-editor/?product_id=53) → **Etsy**. Retain existing Etsy draft **#4603838854**. Do not select Create another.
2. If an **other local Product** appears, open and compare it. Use **Compare both Product records and Etsy**. If the screen says correction is available and we independently agree, check both consent boxes and **Move the local Etsy ID**. If the two names match or prior activity exists, stop: leave the claim unchanged for manual reconciliation.
3. Once linked, use **Compare existing Etsy photos**. For each original image #344, #345, #346 already present on the draft, select the exact corresponding Etsy image, inspect both, check the owner photo confirmation, and record the matching receipt once. Do **not** assign a mismatched Etsy image or re-upload a previously attempted photo.
4. Correct the Product description and tags in their own tabs, review the actual Etsy category and Canada-only shipping, then use **Read Etsy's three-photo receipts** and the existing final owner approval. A passing local build does not substitute for a witnessed Etsy acceptance.

## Verification / limits

- `node --test scripts/release467_build505_etsy_owner_reconciliation.test.mjs scripts/release467_build504_etsy_link_photo_signoff_cards.test.mjs scripts/release467_build503_etsy_owner_diagnostics.test.mjs scripts/release467_build502_etsy_existing_link_media_owner.test.mjs`
- `python scripts/current_application_quality_gate.py`
- CI / Pages deploy / live proof must succeed on `main` before claiming **Production GREEN**.
- **No live owner credential, Etsy draft mutation or three-photo acceptance was exercised by automated tests.** Real Product #53 owner acceptance remains **HOLD** until we run the explicit checks in the signed-in site.

**Next expected Build 506 — Etsy Owner Trial Receipt Review, Product #53 Metadata Correction Closure & Channel Integration Contract v1 Readiness.**
