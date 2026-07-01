# Post-Deploy Smoke Test — Build 199


**Automatic trigger paths:** dedicated review approval, direct product creation with Approved/Published status, and an editor save that changes a product from an unapproved review status to Approved/Published.

**Source gate:** only a product with review status **approved** or **published** can create or refresh a Content Automation Studio package.
Run after the Build 199 D1 migration and Pages deployment. Test on the deployed domain while signed in as an administrator. Record date, user, browser/device width, product/inventory test IDs, and any Cloudflare request/error IDs.

## 1. Migration and safe start

1. Confirm `schema_migration_ledger` contains `build_199_content_automation_studio`.
2. Confirm `/admin/content-studio/` loads as an authenticated admin and `/api/admin/content-studio` returns JSON rather than a Pages 503.
3. Confirm the page is noindex and ordinary public pages retain their one-H1 checks.

## 2. Automatic product-to-content package

1. Choose a disposable product with at least three retained images; add a known test video/link when available.
2. Approve the product through the existing product-review action.
3. Confirm the response says a content package was prepared, then open `/admin/content-studio/`.
4. Confirm one package appears for that product with exactly: 1 YouTube item, 3 Facebook items, 5 Instagram items, 5 TikTok items, gallery, GBP photo, SEO, blog, thumbnail, and caption deliverables.
5. Re-approve or refresh the same product. Confirm it updates the same package rather than creating a second package.

## 3. Media integrity and review gate

1. Compare the product’s original `product_images` and/or `media_assets` URLs before and after creating/refeshing the package. No source URL, image row, R2 object, product featured image, or video link may disappear.
2. In Content Studio, unselect one source media item, choose one lead source, and mark one item **Internal only**. Save each choice and reload.
3. Confirm the original product gallery order and Featured Image URL did not change.
4. Confirm the project manifest contains only source references/archive paths and no destructive-media instruction.
5. Confirm content/media with unknown or needs-review status is not considered automatically published.

## 4. Deliverables and Social Queue handoff

1. Edit one caption and one blog or SEO item, save, then use **Refresh only unlocked factual copy**. The edited deliverable must remain unchanged.
2. For one social deliverable, set **Approved** but leave Output URL blank. **Send approved file to social queue** must be blocked.
3. Add a disposable real finished test-media URL, keep approval at Approved, then send it to the Social Post Queue.
4. Confirm one matching review-queue row appears, still as draft/review-first—not automatically posted.
5. Test Content Studio at approximately 360 px, 768 px, 1024 px, and desktop width. Archive cards, source controls, project controls, and deliverable fields must remain reachable.

## 5. Existing Build 197/198 protections

1. Edit an existing inventory item and confirm the original inventory ID updates instead of a duplicate record.
2. Confirm a blank product Featured Image URL repairs from the first retained image without removing photos/videos.
3. Confirm Shop cards remain image-first and the mobile menu opens compactly rather than displaying a long static list.

A locally successful package does not prove Cloudflare bindings, D1 data, R2 access, actual media rendering, OAuth/API publishing, Stripe, email, Search Console, Google Business Profile, or cross-device performance. Those need live evidence.
