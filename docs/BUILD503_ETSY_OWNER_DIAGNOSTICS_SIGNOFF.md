# Build 503 — Product #53 Etsy draft recovery, explicit errors and acceptance

## The owner screenshots show three DIFFERENT conditions

1. **Local Product Save** returned HTTP 503 (Cloudflare reference `512d6501824ab39-YYZ`), meaning the write outcome is **unknown**, not that an Etsy field is missing. The Product Editor retains its browser copy. `Review server copy first` reads Product #53 and names any differences in its core saved fields, without repeating the Product POST.
2. **Etsy draft ID is not locally linked**, although the owner has shown real Etsy draft **#4603838854**. Never delete this Etsy draft, make another one or infer that an unlinked ID means there is no remote listing. The primary Etsy action is **Step 1: Verify and link existing draft**. This compares authorized owner, actual shop, unpublished listing, exact ID, and Canada-only shipping. It stores only a local receipt after successful verification.
3. **Gallery, native tags or contents may need review**, but HTTP 503 on a read-only check does not prove any of those fields are bad. Build 503 keeps the failed read separate from actual per-photo, search-tag or description blockers; the first content issue has a direct jump to Media, Storefront / SEO or Description.

## Product #53 content and publication hold

Owner screenshots of the Etsy editor showed: **Bar Soaps** category, title and description **Adventurine Argon**, CA$10, quantity 10, zero photos and no Etsy search tags. The saved Etsy override was **Soap bars**. Build 503 never treats that evidence as the correct category or product description. If the Product still contains a soap-bars tag override or only a title in Description, the full sync lists the exact issue and stops, without guessing product identity. Review the actual physical item and correct the local Product description/tags and Etsy taxonomy before publication. Etsy remains **unpublished**.

## Safe owner acceptance

1. Reload Product #53 and compare the server copy after an uncertain Save. An HTTP 503 may persist if a Cloudflare/D1 quota, binding, or runtime incident continues; the code cannot prove that underlying condition has cleared without account-side runtime evidence.
2. In the Etsy tab, retain the pre-filled ID **4603838854**, confirm it is our actual original draft, and select the **Step 1** link action. If the provider is unavailable, the exact failed check and safe next step are shown; do not press Create.
3. Correct any named saved Product fields, shared/override search tags and three original photos **#344–346**. Only owner-approved original photos may be transferred. If their upload outcome is uncertain, perform an Etsy readback and reconciliation before any retry.
4. Select **Step 2: Update Etsy draft #4603838854 + all approved photos** after the package passes local preflight and owner consent. Verify Etsy ID, all three original photographs, and native tags by provider readback. Do not click Etsy Publish until the owner approves the final category, price, quantity, shipping and description.

Production GREEN only proves the application deployment and CI; live Etsy sign-off requires the owner's authenticated connection, explicit decisions and real provider receipts. This Build does not delete/create/publish Etsy content or claim a successful Product #53 upload.

## Tests

`node --test scripts/release467_build503_etsy_owner_diagnostics.test.mjs scripts/release467_build502_etsy_existing_link_media_owner.test.mjs scripts/release467_build501_etsy_save_sync_mobile.test.mjs scripts/release467_build500_etsy_complete_package.test.mjs`
