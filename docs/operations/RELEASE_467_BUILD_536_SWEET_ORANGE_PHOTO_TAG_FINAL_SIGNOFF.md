# Devil n Dove — Build 536: real Sweet Orange receipts and final owner sign-off

## Owner screenshot received October 30, 2026

On the Product Editor's **Verify saved Etsy drafts, photos and tags** panel, Product **#54 Bar Soap Sweet Orange**, SKU **DND-01131**, returned **0/1 verified**, **Etsy draft not linked**, and the separate Marketplace trial remained unaccepted. The owner also supplied an actual Etsy screenshot showing an unpublished **Bar Soap Sweet Orange** draft and an **empty Photo & video area**. The earlier reported Etsy ID is **4601705477**, but neither a screenshot nor text in the UI is a current database and Etsy API receipt.

## Diagnosis and repair

The Build 535 **One Product → Etsy draft / Marketplace** controller already passed candidate ID `4601705477` to the authenticated first-primary `/api/admin/product-etsy-existing-draft` receipt endpoint. However, the **separate three-soap owner closure panel** continued calling the Product-only lookup **without** the candidate, leading to the contradictory “Etsy draft not linked” readback. Build 536 uses the same candidate **only as a lookup hint**, never as authorization: the primary D1 receipt must uniquely bind that actual Etsy listing to Product #54. Another Product's ID, a duplicate claim, or an unclaimed listing stays unverified. An owner can use the preexisting **Verify listing ownership, state & Canadian shipping** and **Link this verified existing draft** actions, with separate explicit consent, to link this *same* Etsy listing. No new Etsy draft is created in the owner readback.

Build 536's four distinct read-only stages now show:

1. **Saved Etsy ID** — exact D1 primary Product→listing receipt, with verified ID, not merely an owner-reported number.
2. **Photo transfer receipts** — fresh Etsy photo inventory, exact approved original↔Etsy image IDs, remote and expected counts, untracked photos and unresolved upload claims. `0 / 3` cannot pass. An earlier uncertain upload must be reconciled; it must not be resent blindly.
3. **Native tags** — fresh authenticated Etsy provider listing and tag readback matched against the **saved** Product SEO tags, with a failed or uncertain prior tag PATCH called out.
4. **Final content & owner receipt** — same unpublished Canada-only Etsy listing, Product, photos, native tags and fingerprint. Owner consent is enabled only after every stage passes. The sign-off API independently checks the fresh fingerprint before writing one **local** audit receipt.

The native-tags and final-signoff readers use the same first-primary D1 source as the listing ID and photo endpoints, avoiding false mismatches caused only by replica lag. The review does **GET only**. No blind image resend, unattended tags PATCH, Facebook POST, Etsy publication, automatic retries or simulated success is introduced.

## Simple owner walkthrough — one existing item

1. Open `https://devilndove.com/admin/product-editor/?product_id=54` and confirm Product #54, SKU DND-01131, and Saved ✓.
2. Open **Verify saved Etsy drafts, photos and tags**. Enter `54`, then click **Check exact Etsy ID, live photos, tags and owner receipt**.
3. If Stage 1 is not verified, use **Verify & link existing Etsy draft**: select **Bar Soap Sweet Orange** in Etsy Drafts, confirm its exact listing ID `4601705477` and shop ownership, unpublished status and Canada-only shipping, and explicitly link the existing listing (never create a second).
4. Run the read-only check again. If Stage 2 shows 0 of 3 Etsy photos, follow **Review photo transfer receipts**. In the **same Product Editor**, approve each original in the gallery, review the existing transfer claim audit, and use the existing explicit **Sync missing original photos to Etsy** controls one at a time. Re-run GET after each confirmed response. If Etsy already shows photos but local matching receipts are missing, **compare/reconcile** those images first: do not duplicate.
5. If Stage 3 says tags differ, use **Review native Etsy tags**. Save correct Product search tags, read live Etsy tags, expressly authorize a replacement once if needed, and then repeat the independent readback. A previous uncertain tag update requires reconciliation before a new PATCH.
6. Once all four stages are marked **Verified**, visually inspect the actual Etsy photos, category **Bar Soaps**, CAD price, available quantity, Canada-only shipping and wording. Tick the final acceptance checkbox and click **Record owner acceptance (local only)**. The server rechecks the same evidence fingerprint; only an exact match records the local receipt. **Nothing is published** by Build 536.
7. Facebook Marketplace remains an explicitly prepared **manual** listing. Its readiness is a separate decision and not proof that Etsy is finished.

## What Production GREEN means

The workflow job and live `release-version.json` at an immutable `main` commit prove **website code deployed**. They cannot prove the owner's real Etsy listing photos were uploaded or accepted. The screenshot still requires genuine authenticated Etsy work and final owner choice. Report that outcome exactly, without implying that code promotion cleared provider data.

## Next planned

**Build 537 — Etsy Existing-Draft Link Recovery, Exact Original Photo Pair Reconciliation & Owner Publishing-Readiness Simplification.**
