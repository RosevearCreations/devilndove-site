# Post-Deploy Smoke Test — Build 200

Run after `database_build200_content_publication_release_board.sql` and the complete Pages deployment. Test on the deployed domain while signed in as an administrator. Record the date, user, browser/device width, test product/content-project/publication IDs, and Cloudflare request/error IDs.

## 1. Migration and safe start

1. Confirm `schema_migration_ledger` contains `build_200_content_publication_release_board`.
2. Confirm `/admin/content-studio/` and `/admin/content-publications/` load as authenticated admin pages and their APIs return JSON rather than 503.
3. Confirm `/api/workshop-journal` returns `{ ok: true }` with an empty list before any published release rather than an error.
4. Confirm public pages retain one visible H1 each and new admin pages are `noindex,nofollow`.

## 2. Content package and source-media integrity

1. Use a disposable approved product with at least three retained images. Record product-image/media URLs and the product Featured Image URL first.
2. Confirm the product has one Content Studio package and correct 1/3/5/5 deliverable plan.
3. In Content Studio, set at least two real test image references to selected + `Public allowed`; choose one lead source. Approve the Blog Article and Website Gallery deliverables.
4. Refresh the content package. Confirm original `product_images`, `media_assets`, R2 objects, feature URL, gallery order, and video URLs remain unchanged.

## 3. Public drafting and release gate

1. Open `/admin/content-publications/`, select the content project, and select **Prepare / refresh website drafts**.
2. Confirm exactly two release drafts appear: one Workshop Journal article and one website-gallery feature.
3. Confirm the release checklist shows source approval, visible copy, public-cleared media, lead image/alt text, slug, and meta fields.
4. Edit the Journal title/summary/body, enable **Keep this edited public copy**, then prepare/refresh again. Confirm edited copy remains intact.
5. Try **Approve public copy** with a missing required item. Confirm it is blocked with an actionable error.
6. Restore all required fields, approve each public draft, and confirm it is still not publicly returned by `/api/workshop-journal`.
7. Select **Publish after approval**. Confirm the Journal record appears in `/api/workshop-journal?destination=workshop_journal` and the gallery record appears from `destination=website_gallery`.
8. Visit `/workshop-journal/`, `/gallery/`, and `/workshop-journal/story/?story=<published-slug>` at about 360 px, 768 px, 1024 px, and desktop. Ensure cards, buttons, details/accordions, source links, and text stay readable and reachable.
9. Select **Unpublish now** for one record. Confirm it disappears from the public API/UI and the source product/media still remain intact.

## 4. Existing Build 197–199 protections

1. Edit an existing inventory item and confirm the original inventory ID updates instead of a duplicate record.
2. Confirm a blank product Featured Image URL repairs from the first retained image without removing photos/videos.
3. Confirm Shop cards remain image-first and the mobile menu is a compact accordion/popup—not a long visible page list.
4. Approve a product, then refresh Content Studio. Confirm only one content project exists and source files are reference-only.
5. A social deliverable cannot enter the Social Queue until it is Approved and contains a real finished output URL.

## 5. Live-only evidence still required

Local tests cannot prove Cloudflare D1/R2 bindings, remote public media resolution, real renderer behavior, OAuth publishing, Google Business Profile acceptance, Search Console indexing, Merchant Center eligibility, Stripe/email/webhook flows, assistive technology, or device performance. Keep all of those as separate live evidence tasks.
