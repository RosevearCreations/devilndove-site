# Devil n Dove Build 517 — Etsy Live Owner Receipt Verification & Draft Update Retest

## Owner workflow

1. Open saved Product **#53** (Adventurine Argon, SKU `DND-01130`, slug `adventurine-argon`) and its **Etsy** tab. Keep the *existing* unpublished Etsy draft **#4603838854**. Do not create a duplicate.
2. If original photos **#344–346** are not yet independently confirmed, use **Sync missing original photos to Etsy** only after verifying the same linked draft, all gallery permissions, original R2 bytes and the existing Etsy photo inventory. If Etsy already has those photos, use the exact-photo matching review, never a blind re-upload.
3. Enter accurate Product materials, size, condition and making details in **Description**. Review the saved native Etsy tags and category: the historical “Soap bars” category/tag is not proof that it fits this item. Save Product before selecting **Update Etsy draft**; the existing update path remains an explicit, owner-authorized action.
4. Select **Verify live Etsy draft & all 3 photos**. This makes three independent GET-only reads: current remote photo inventory (D1 first-primary link and live Etsy draft), original-photo owner readback and Product-description/tag owner trial. The single result separates photo readiness from content readiness. Three gallery thumbnails or old receipts alone cannot pass.
5. Only after the readback is completely ready, personally inspect the *actual* Etsy draft, tick the owner confirmation and choose **Record owner approval (never publish)**. The server independently rechecks source, provider content and all photos and appends an existing Build 504 local owner receipt. No new table, second order/listing ledger or automatic provider write.

## Safety boundaries

- Technical CI passing **does not mean** the owner ran the real Etsy transfer, saw the live photos or approved the content. Until steps 2–5 are actually completed on the authenticated live draft, owner acceptance is **HOLD**.
- A failed, timed-out or uncertain provider write remains HOLD; inspect the real draft and audit claim. Do not automatically retry or create another draft.
- The read-only check never creates/updates a listing, uploads images, changes shipping, posts to Marketplace or publishes. Owner approval is a deliberate local audit receipt only. Canada-only shipping remains enforced by existing provider verification.
- QL-248/QL-249 cross-app gateway remains **HELD/DISCONNECTED**. No Etsy/Marketplace writes through that integration; no keys, gateway activation, customer data, cross-app dispatch or live authenticated integration test.

## Release test and next build

`node --test scripts/release467_build517_etsy_owner_verification.test.mjs` covers exact Product/draft identity, distinct three-photo receipt and live inventory parity, independent freshness, incomplete photo attempts, metadata/shipping HOLDs, clear UI gates and GET-only readback.

The historical Build 500–516 tests, complete current application quality, protected `dev` and `main` checks, Cloudflare Production Pages deployment and exact-main live-resource integrity must pass before the *software* is declared Production GREEN. Real owner Etsy acceptance is a separate outcome.

**Next proposed Build 518 — Etsy Owner Evidence Resolution & Simple Draft Acceptance Closure.** If the real owner reports 3/3 accepted, close out exact metadata/photos against fresh readback; otherwise address the documented HOLD without deleting a draft or inventing a receipt.
