# Post-Deploy Smoke Test — Build 201

Run after `database_build201_creative_asset_intelligence_platform.sql` and the complete Pages deployment. Test on the deployed domain while signed in as an administrator. Record date, user, browser/device width, product/content-project/creative-project IDs, public URLs, and Cloudflare request/error IDs.

## 1. Migration and safe start

1. Confirm `schema_migration_ledger` contains `build_199_content_automation_studio`, `build_200_content_publication_release_board`, and `build_201_creative_asset_intelligence_platform`.
2. Confirm `/admin/content-studio/`, `/admin/creative-assets/`, and `/admin/content-publications/` load as authenticated admin pages and their APIs return JSON rather than 503.
3. Confirm admin pages are `noindex,nofollow`, public pages retain one visible H1, and Service Worker version is refreshed after deploying.
4. Confirm the CAIP list loads safely with no projects; it should show an empty state, not a hard failure.

## 2. Source-media integrity and automatic handoff

1. Use a disposable approved product with at least three images and, when available, one video. Record all `product_images`, `media_assets`, URLs, sort order, and Featured Image URL before testing.
2. Approve the product through one of the supported paths: review screen, create already approved, or editor status transition.
3. Confirm one Content Studio package exists and one CAIP creative project appears for it. Confirm repeating the approval/refresh does not create a second CAIP project.
4. In Content Studio, mark a safe test item selected and `Public allowed`; change lead selection, then save/refresh. Confirm CAIP reflects the source state and original product/media rows remain unchanged.
5. In CAIP, perform **Sync / refresh CAIP**. Confirm source URL, source ID, sort/role, and original image/video count remain intact.
6. Check Cloudflare logs. A deliberate CAIP sync failure must record a warning but must not roll back product approval or remove the already-created Content Studio package.

## 3. CAIP rights, evidence, story, and manifest

1. Load the CAIP project at `/admin/creative-assets/`.
2. Confirm every asset card identifies source/reference state and does not show a file-delete/move/replace action.
3. On an upstream non-public or needs-review source, try setting CAIP rights to public. Confirm it is rejected or reduced to a non-public review state. Confirm a blocked source remains blocked.
4. Review score rationale: confirm it is labelled as metadata/deterministic/review aid and not as an AI or legal/quality guarantee.
5. Add internal tags/note and set a restrictive status on one disposable asset. Save and reload; confirm the product image/video source still remains unchanged.
6. Edit one evidence record and one story segment. Lock the story text, sync CAIP again, and confirm locked wording remains intact.
7. Confirm recommendation candidates have a destination and intended role, but do not appear publicly or automatically enter a queue.
8. Download the CAIP manifest. Confirm it contains references and governance/evidence data only; it must not claim a finished render, published URL, automatic consent, or copied source object.
9. Use **Approve internal CAIP** only after review. Confirm this does not publish a Product, Workshop Journal story, Gallery item, social post, or platform upload.

## 4. Existing Build 197–200 protections

1. Edit an existing inventory item and confirm the original inventory ID updates instead of a duplicate record.
2. Confirm a blank product Featured Image URL repairs from the first retained image without removing photos/videos.
3. Confirm Shop cards remain image-first and the mobile menu is a compact accordion/popup—not a long visible page list.
4. Confirm a Content Studio social deliverable cannot enter the Social Queue until it is Approved and contains a real finished output URL.
5. Prepare/publish/unpublish a disposable Content Release Board record. Confirm product/source media remain unchanged.

## 5. Mobile and SEO checks

At about 360 px, 768 px, 1024 px, and desktop, test `/admin/creative-assets/`, Content Studio, Content Release Board, Shop, Gallery, and Workshop Journal. Verify actions remain visible/reachable, no horizontal trap/overlap appears, form labels remain associated, status signals remain readable, and visual placeholders stay neutral.

## 6. Live-only evidence still required

Local tests cannot prove Cloudflare D1/R2 bindings, remote public media resolution, signed R2 access, object retention, actual rendering, OAuth publishing, Google Business Profile acceptance, Search Console indexing, Merchant Center eligibility, Stripe/email/webhook flows, assistive technology, or device performance. Keep these as separate live evidence tasks.
