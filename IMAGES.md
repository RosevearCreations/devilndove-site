# Build 185 visual/professional polish note

Build 185 adds maker-gallery value rows and performance budget rows so new visual effects/images stay professional without making pages slow. Before/after and process gallery ideas must still use approved public-use media, clear alt text, reduced-motion-safe behaviour, and low-bandwidth fallbacks.

# Build 184 visual value note

Build 184 separates visual enrichment ideas from approved image placement. Future visual effects should remain reduced-motion safe, low-bandwidth aware, and locked against H1 changes.

# Build 183 image and visual-enrichment notes

Use `/admin/visual-enrichment-studio/` to review media picker rows, image-slot assignments, screenshot pairs, visual diffs, compression budgets, alt-text suggestions, gallery hero rotation, and low-bandwidth mode. Public images should stay lazy-loaded, under the image budget where possible, and reviewed for alt text before promotion.

# Build 182 image and visual enrichment notes

- New `visual_enrichment_candidates` rows track page, placement, asset hint, alt text hint, local phrase, and motion-safety.
- New visual asset budgets limit image additions and require lazy loading for future public media.
- Future image promotions should use existing approved R2/product media when possible and avoid raw private object paths.

# Build 181 Evidence and Image Addendum

- Private evidence downloads now have a signed route for R2 object keys when the proper bucket and signing secret are configured.
- Recall evidence upload request rows now store target R2 prefixes before the drag-and-drop UI is connected.
- Do not expose raw private R2 object URLs on public/admin pages when signed evidence links can be created.

# Build 180 image and evidence notes

Build 180 adds recall evidence upload placeholders, signed-download route test rows, and stronger marketplace CSV gate enforcement for public-ready images.

# Build 179 image/evidence note

Promotion Control adds recall signature evidence upload records with direct R2 upload support when a private evidence bucket is bound. Keep evidence uploads small, named clearly by batch, and review dark-theme screenshot evidence before promotion.

# Build 177 image/QA update

- Product QA bulk fixes now require an approval record before any apply action.
- The only automatic apply action added in Build 177 is missing image alt text, and it logs an apply event.
- All other Product QA blockers remain manual/editor-focused until safer field-specific workflows are added.

Build 176 image/release note: Safe Deploy ZIPs can package release evidence files, dark-theme screenshot jobs remain queueable from Release Control, and Product QA preview cards now keep exact image/editor fix links for blockers such as missing image alt text.


## Build 175 screenshot evidence addition

Dark-theme screenshot evidence can now be queued as `deployment_screenshot_jobs` from Release Control. True automated capture still needs a browser/headless runner; the current build stores page, viewport, theme, evidence URL, and R2 object key for review.

# Build 174 image and screenshot checklist additions

Deployment Preflight now reports image-alt coverage for the core public/local landing pages and keeps the dark-theme evidence workflow connected to the public-page review list. Continue using dark-theme evidence uploads for home, shop, gallery, product detail, and every local landing page. Future work should add automatic live screenshot capture.

# Build 171 Image and Dark-Theme Checklist Additions

Dark-theme public-page evidence checklist examples now include:

- `/` — hero, navigation, featured cards, forms, proof blocks, and footer.
- `/shop/` — product cards, filters, price text, CTA buttons, and empty states.
- `/creations/` — creation cards, captions, image contrast, and hover/focus states.
- `/gallery/` — gallery grid, proof images, captions, and modal/large-image treatment.
- `/gift-cards/` — amount cards, purchase form, validation text, and email delivery copy.
- `/custom-request/` — intake form, upload guidance, consent wording, and error states.
- Local SEO landing pages — headings, town/service wording, proof cards, CTA blocks, and trust sections.

New admin route: `/admin/dark-theme-evidence/` for upload, review status, contrast status, and R2 evidence storage.

Product image derivative note:

- The existing product-image derivative strip includes a “Use this derivative as featured image” button.
- New route health testing is available in Catalog Media through the R2 Derivative Worker Route panel.

# Build 159 image workflow note

## Catalog Product Editor visual image cards

Location: `/admin/catalog/` → Product Editor → Product pictures.

Build 159 changes this area so existing saved image URLs render as thumbnail cards above the file chooser. We can now:

- click a thumbnail or **Edit URL** to jump to the matching URL field;
- drag cards to reorder images;
- use **Make first** to set a gallery image as the featured image;
- use **Remove** to clear that URL slot from the draft;
- keep using the deeper Product Media Workflow for role metadata, public-use status, crop notes, merchandising score, and permanent row-save/delete behavior.

The first card maps to `products.featured_image_url`. The remaining cards map to `image_url_1` through `image_url_6` for the product update payload. Existing product loads now remove the featured image from gallery URL slots so the same image is not shown twice by default.

Recommended Product Editor image sizes remain:

- featured/first image: 1200 × 1200 px minimum, square or landscape;
- gallery detail images: 1000–1600 px wide preferred;
- process/story images: 1200 px wide preferred;
- Open Graph/social preview: 1200 × 630 px when a separate social image is used.

Videos are still better handled as separate product story/social assets rather than the Product Editor URL slots. Product image slots should remain still image URLs unless a future video-specific field is added.

# IMAGES.md — Devil n Dove image and video placement map

_Last updated: Build 158 catalog/media repair pass._

This file is the working checklist for every place the application needs images, what size we should make them, whether a video can be used instead, where the file/data should live, and how to connect it to the correct page or admin workflow.

## Current image rules used by the app

| Area | Required size | Preferred shape | Can it be video? | Where it is managed |
|---|---:|---|---|---|
| Product featured image | 1200 × 1200 minimum | Square first choice, landscape acceptable | No, use an image thumbnail; video can be a supporting story asset | Admin > Catalog > Product Media Workflow or product editor `featured_image_url` |
| Product gallery images | 800 × 800 minimum, 1200+ preferred | Square, landscape, or portrait depending on role | No for the gallery row itself; process video can be linked in story/social content | Admin > Catalog > Product Media Workflow |
| Social/OG image | 1200 × 630 recommended | Landscape | No for OG image; social post can later attach video manually | Product editor `og_image_url` or generated from featured image |
| Process/story proof | 800 × 800 minimum | Any clear orientation | Yes, video is useful here | Product Story Notes, Social Posting Queue, or future media asset story slot |
| Hero/landing page image | 1600 × 900 minimum | Landscape | Yes, but keep image fallback | Static `/assets/` file or page HTML |
| Admin/tool/supply item images | 800 × 800 preferred | Square/landscape | Usually no | JSON/DB inventory record `image_url` |
| Marketplace exports | 1200 × 1200 preferred | Square | Channel dependent; CSV export should use image URL only | Marketplace export records/copy cards |

## Missing or incomplete image areas

| Priority | Location in application | What is missing | Needed image/video | Exact target path or data field | How to put it in the correct place |
|---:|---|---|---|---|---|
| 1 | Product listings and product detail pages | Many products do not yet have a complete 3–7 image set with assigned image roles. | 1 hero/front, 1 detail/texture, 1 scale/context, 1 back/side, optional process, packaging, material/tool proof. | D1 `product_images.image_url`; metadata in `product_image_annotations`. | Go to `/admin/catalog/`, click **Edit**, then use **Product Media Workflow**. Enter product ID or let Edit auto-load it, add/upload rows, set roles, then **Save Images**. |
| 2 | Product publish readiness | Missing image-role records block approval/publish or make the reason unclear. | At least one `hero_front`; all public images need an image role and public-use status. | D1 `product_image_annotations.image_role` and `public_use_status`. | In **Product Media Workflow**, click **Apply recommended roles**, adjust public-use status, then **Save Images**. |
| 3 | Product editor social share | Some products have no Open Graph image. | 1200 × 630 social image, or reuse the hero image if it crops well. | Product editor field `og_image_url`; D1 `product_seo.og_image_url`. | In `/admin/catalog/`, click **Edit**, paste an OG image URL, then save the product. |
| 4 | Shop/product cards | Product cards fall back weakly if `featured_image_url` is empty. | Product hero/front image, 1200 × 1200 preferred. | D1 `products.featured_image_url`; first `product_images` row also sets this. | Add a first image in **Product Media Workflow** and save. If all images are deleted, the product becomes image-incomplete again. |
| 5 | Custom candle making page | Needs real candle examples instead of relying only on text. | Finished candle image, scent/material close-up, pouring/process image. | Recommended static files: `/assets/custom-candle-hero.webp`, `/assets/custom-candle-process.webp`, `/assets/custom-candle-finished.webp`. | Add files to `/assets/`, then update `/custom-candle-making-ontario/index.html` image sections or create a future JSON-driven block. Video can be used as an embedded process/story section with image fallback. |
| 6 | Custom soap making page | Needs real soap examples and ingredient/process proof. | Finished soap bars, ingredient/base image, curing/process image. | Recommended static files: `/assets/custom-soap-hero.webp`, `/assets/custom-soap-process.webp`, `/assets/custom-soap-finished.webp`. | Add files to `/assets/`, then update `/custom-soap-making-ontario/index.html`. Video can be used for process, but keep a static image fallback. |
| 7 | Custom request page | Reference upload exists, but the page could use visual examples of request types. | Small cards for jewelry, laser engraving, candle, soap, memorial/personalized item. | Recommended static files under `/assets/custom-request/`. | Add the images and update `/custom-request/index.html` card sections. Reference images from customers stay private and should not be reused publicly without consent. |
| 8 | Gallery page | Gallery filters work, but public proof quality depends on enough product images and proof tags. | Real workshop/product images tagged by material, process, locality, and product type. | D1 product/image fields plus proof metadata. | Add product media, assign image roles, set material/process/locality fields, and approve public-use status. |
| 9 | About / maker story | The brand story benefits from more workshop/team/process photos. | Workshop bench, tools, safe process shots, packaging, making therapy/process images. | Recommended static files in `/assets/about/`. | Add files and update `/about/index.html` or a future story JSON file. Video is excellent here if embedded with a poster image. |
| 10 | Home page featured areas | Current assets exist, but seasonal/featured handmade work should rotate. | 3–6 current product/lifestyle images, 1200+ wide. | `data/site/featured-items.json` or static `/assets/` paths. | Update `data/site/featured-items.json` for reusable blocks; keep file names simple and descriptive. |
| 11 | Marketplace listings | Marketplace CSV/copy cards need stable image URLs. | First 1–10 product images, square preferred. | Product `featured_image_url` and `product_images.image_url`. | Before exporting marketplace CSV, open product media and confirm first image + gallery rows are public-ready. |
| 12 | Tool and supply inventory | Some tool/supply records may have missing or weak item images. | Clear inventory photo or Amazon/manual source image. | D1 inventory image field or JSON source `image_url`. | Prefer moving recurring inventory image data into D1 so it can be corrected once and reused everywhere. |
| 13 | Movie cover collection | Movie covers are data-driven and may need missing-cover fallback checks. | Cover JPG/WebP; poster aspect. | R2 `/movies/...` and movie catalog JSON mapping. | Keep movie covers in R2 and verify JSON points to the public asset URL. Video is not appropriate here. |
| 14 | Local trust/testimonial blocks | Approved testimonials can use customer/project proof images only with consent. | Customer-approved finished photo, review screenshot, or product proof. | `trust_block_items` and consent/proof candidate records. | Use consent-response workflow first, then approve into trust blocks. Do not reuse private reference uploads publicly. |

## Product image role checklist

For every product we want to approve or publish, aim for this image order:

1. **Hero/front** — 1200 × 1200 or larger, square or landscape, clean background.
2. **Detail/texture** — close-up of engraving, clay texture, metal finish, resin detail, candle surface, soap texture, etc.
3. **Scale/context** — hand, ruler, display card, packaging, or table context.
4. **Back/side/underside** — clasp, back, edge, underside, condition details.
5. **Process/story** — workshop making shot; video is acceptable as an extra story asset, not as the main gallery image.
6. **Packaging/pickup** — gift/pickup/shipping presentation.
7. **Material/tool proof** — material, tool, batch, source, or authenticity proof.

## How to edit or delete individual product images

1. Open `/admin/catalog/`.
2. Click **Edit** beside the product.
3. The Product Media Workflow should auto-load the same product ID.
4. Edit the row fields directly: URL, alt text, title, caption, role, public-use status, crop notes, dimensions, score notes.
5. To delete one image, click **Delete image row** on that row.
6. Click **Save Images**. The save replaces the stored gallery with the rows that remain.
7. If all rows are removed and saved, the product keeps no gallery images and `featured_image_url` is cleared. The product will need new images before approval/publish.

## File naming rules

Use simple lowercase names:

```text
/assets/products/product-name-hero.webp
/assets/products/product-name-detail.webp
/assets/custom-request/custom-candle-example.webp
/assets/custom-request/custom-soap-example.webp
/assets/about/workshop-bench-process.webp
```

Avoid spaces and camera default names like `IMG_1234.jpg` for public files. Public names should describe what shoppers see.

## Video rules

Video can help the brand story, process pages, social posts, and custom candle/soap pages. Video should **not** replace the first product image. Every video should have a static poster image so the page still looks right if video fails or loads slowly.

Recommended video use:

- About/workshop story: yes.
- Process/story proof: yes.
- Custom candle/soap pages: yes, with poster fallback.
- Product first image: no.
- Product gallery row: image only for now.
- Marketplace CSV: image URLs only.

## Best next image work

1. Fill missing product hero images first.
2. Add roles/public-use status to existing product images.
3. Add candle and soap example images.
4. Add custom request example cards.
5. Add workshop/about process photos or short videos with poster images.
6. Add admin dashboard counts for products missing hero, role, alt, public-use, and OG images.

## Build 160 — Catalog editor URL validation and publish image sync repair

- Fixed the Product Editor canonical URL field so relative site paths such as `/shop/product/?slug=desert-succulents-100` are accepted. The input is now text with helper guidance instead of browser `type=url` validation.
- Clarified External Listing URL: leave it blank for normal Devil n Dove shop products; only add a full `https://` Etsy/Facebook/marketplace URL when Sale Channel is Hybrid or External-only.
- Hardened update/create product image syncing so the featured image is also stored in `product_images` at sort order 0, gallery rows follow after it, duplicates are removed, and existing image rows/annotations are preserved when the URL already exists.
- Fixed Clear editor so the visual image cards and Product Media Workflow panel clear along with the form fields.
- Improved publish/approve readiness consistency by making the editor’s image fields and backend `product_images` rows agree before review actions run.
- No new D1 table is required in this pass; this is a code/data-sync behavior repair against the existing products, product_images, product_seo, and product_image_annotations tables.

Next recommended checks:
1. Edit a product with a relative canonical path and click Update Product.
2. Confirm External Listing URL is blank for normal onsite listings.
3. Save, reload, and confirm the first visual image is the featured image and appears in Product Media Workflow.
4. Run Approve/Publish; any blocker should now be a real readiness issue such as missing image role, missing SEO, missing price, or blocked public-use status.

## Build 161 — shop image/gallery, product detail JSON fallback, and catalog workspace split

- Repaired the public product detail page so an HTML fallback response from `/api/product-detail` no longer throws a raw `Unexpected token '<'` JSON error in the browser. The page now reads the response as text, detects HTML, and falls back to `/api/products` by slug when possible.
- Hardened `functions/api/product-detail.js` with a final JSON error wrapper so late D1/query failures return JSON instead of a static HTML error page.
- Extended `/api/products` to attach product image arrays from `product_images`, allowing shop cards to show a main image plus selectable thumbnail images.
- Updated the Shop product card UI so cards are more compact, show richer product details, and allow thumbnail clicks to change the main product image.
- CSS-polished the Shop “Browse by collection direction” area and the `/creations/` collection/trust grid so the layouts are less cramped and more mobile-safe.
- Split the oversized `/admin/catalog/` workflow into focused workspaces: Products & Publishing, Media & Product Images, and Tools & Supplies Inventory Operations.
- Added `/admin/catalog-media/` for media, image roles, image annotations, SEO, and product story work.
- Added `/admin/inventory-operations/` for tools, supplies, stock, product resource reservations, catalog sync, option sets, notifications, and app settings.
- Capped the Product Editor file picker to six selected uploads at a time while preserving existing product-image slots.
- Made the Product Media Workflow more compact by moving advanced crop/quality/scoring fields into a collapsible advanced section.

Next recommended steps: add a dedicated readiness-preview endpoint for product publishing blockers, add image health counters to the admin dashboard, and add live test notes after deploying Build 161.

## Build 162 — Shop/Creations CSS, Gift Page, and Inventory Image References

- Added `/gift-cards/` as a dedicated public gift-card page so the main shop no longer has the full gift-card form awkwardly placed between filters and products.
- Changed `/shop/` to show a compact gift-card callout that links to `/gift-cards/`.
- Repaired the contrast for the `/shop/` Browse by collection direction panel and the `/creations/` browse/filter/cards areas so light panels use dark readable text.
- Updated Tools & Supplies Inventory Operations to show a live visual image preview beside the Image URL field while keeping the URL editable.
- Updated the inventory list rows to show a larger thumbnail, the image URL link, and the source/Amazon URL link for easier visual reference.
- Added `/gift-cards/` to the sitemap. No D1 schema migration is required for this pass.


## Build 163 — 20-step roadmap/gaps pass: readiness, image health, gifts, and admin clarity

Completed in this pass:

1. Added `/admin/readiness/` as a focused Product Readiness workspace.
2. Added `/api/admin/product-readiness` so Approve/Publish blockers can be previewed before clicking action buttons.
3. Added readiness summary counters for total, ready, blocked, missing featured image, missing image roles, missing alt text, blocked public-use images, missing SEO, missing price, and products needing 3 images.
4. Added per-product blocker cards with direct links back to the product editor and media workspace.
5. Added dashboard counters for product image/SEO readiness gaps.
6. Added a Product Readiness department card to the Admin Dashboard.
7. Added Readiness Preview links to Catalog, Catalog Media, and Inventory Operations workspace navigation.
8. Added a static gift-card artwork placeholder at `/assets/gift-card-placeholder.svg`.
9. Added gift-card artwork guidance directly to the `/gift-cards/` hero.
10. Added Gift Cards to the home navigation so the new gift page is easier to find.
11. Hardened predeploy sanity checks so the new readiness page, endpoint, dashboard counters, gift artwork, and CSS assets are checked every pass.
12. Added CSS for readiness cards, readiness score badges, blocker rows, and the split gift-card hero.
13. Kept the one-H1 rule intact across all scanned exposed pages.
14. Kept private/admin pages as `noindex,nofollow` where appropriate.
15. Continued the local SEO habit of clear titles, readable headings, and visible local/product wording.
16. Kept the new readiness endpoint D1-backed without adding a required migration.
17. Preserved the split admin structure from the previous pass: Products, Media, Inventory Operations, and now Readiness.
18. Improved operator visibility before publishing by making missing image roles, missing hero/detail/scale roles, public-use blockers, SEO gaps, and price gaps visible from one place.
19. Updated active Markdown handoff docs with Build 163 notes.
20. Updated schema/reference SQL notes with Build 163 status and no-migration guidance.

Next 20 recommended steps:

1. Add inline readiness badges beside each row in the `/admin/catalog/` product table.
2. Add a one-click “Open first blocker” shortcut from each readiness card.
3. Add image-role quick-fix buttons from the readiness page.
4. Add automatic “apply recommended roles” preview before saving image rows.
5. Add true crop/focal-point visual editing directly on thumbnail cards.
6. Add visible “image order saved” confirmation that shows featured/gallery order after save.
7. Add dashboard drilldown links from each image/SEO counter.
8. Add gift-card admin settings for default amounts, expiry wording, and active/inactive status.
9. Add a real gift-card image upload field and replace the placeholder artwork.
10. Add gift-card checkout order-line creation instead of only local draft storage.
11. Add marketplace image validation before CSV export.
12. Add channel-specific marketplace CSV presets editing in admin.
13. Add shop/product API filters for “missing proof image” and “ready for social.”
14. Add post-publish QA for product detail JSON, image gallery, cart button, and SEO preview.
15. Add public product page mini-gallery thumbnails below the main image if any product detail page still only shows one image.
16. Add public proof/trust moderation filters before new trust blocks appear customer-facing.
17. Add order-stage photo uploads for custom work: planning, making, curing/finishing, ready, pickup/shipping.
18. Add candle/soap spec editing after product creation: scent, wax/base, colour, ingredients, allergens, and batch number.
19. Add accountant export checks for missing evidence URLs and missing close notes.
20. Add a mobile admin landing page that links to phone capture, inventory intake, readiness blockers, and today’s admin actions.


## Build 164 — Roadmap/Gaps Pass Completed

Completed from the requested next-20 pass:

1. Added inline readiness badges beside each product row in `/admin/catalog/`.
2. Added one-click **Open blocker** shortcuts from product rows and readiness cards.
3. Added image-role quick-fix buttons from `/admin/readiness/` that apply recommended image roles through the Product Media Workflow endpoint.
4. Added recommended image-role preview before saving image rows.
5. Added click-to-set focal point editing directly on Product Media Workflow thumbnail cards.
6. Added visible “Product images and image order saved” confirmation after saving image rows.
7. Added Admin Dashboard drilldown links from readiness counters into `/admin/readiness/?filter=...`.
8. Added gift-card admin quick settings through Operations > Saved App Settings.
9. Replaced the placeholder gift-card artwork with `/assets/gift-card-art.svg`.
10. Verified gift-card checkout order-line creation is already supported by `checkout-create-order.js` through `gift_card_purchase` payloads.
11. Added marketplace image-readiness validation notes/fields before CSV export packs.
12. Added editable marketplace CSV presets for Etsy, Facebook Marketplace, Pinterest, and manual listings.
13. Added shop filters for “Ready for social” and “Missing proof image”.
14. Added `/api/admin/product-publish-qa` for post-publish QA checks covering product detail JSON, gallery, cart basics, and SEO.
15. Extended product/shop proof signals so product cards and filters can detect proof-image and social-readiness gaps.
16. Added public trust-block moderation filters by context, item kind, locality, and related product slug.
17. Added `custom_order_stage_photos` API/table for order-stage photo tracking.
18. Added candle/soap spec editing after product creation through `/api/admin/candle-soap-specs` and the Catalog Media workspace.
19. Added accountant export/evidence visibility notes for missing HST/GST evidence URLs.
20. Improved `/admin/mobile/` as a better mobile admin landing page by adding readiness, inventory operations, and missing accounting-state mount support.

### Build 164 schema/data notes

New tables or schema references added:

- `custom_order_stage_photos`
- `custom_candle_soap_product_specs`
- unique index `idx_custom_candle_soap_product_specs_product`
- marketplace export pack fields for image validation status/notes

No public page should have more than one H1; the sanity pass must keep checking this every build.


## Build 164 Image Workflow Notes

- Product lead image: 1200×1200 square preferred, 1600×1200 landscape accepted, JPG/WebP recommended. Goes in `product_images.sort_order=0` and `products.featured_image_url`.
- Product proof/detail images: at least two additional images, 1200 px on the shortest useful side preferred. Roles should be `detail_texture`, `scale_context`, `process_story`, `packaging_pickup`, or `material_tool_proof` depending on purpose.
- Gift-card artwork: `/assets/gift-card-art.svg` is now the default page artwork. Replace with an R2 or static image at 1200×675 if we create a real branded gift-card mockup.
- Marketplace exports: do not use images marked `consent_needed` or `blocked`; select product-page-safe images first, then social-safe images for Pinterest/Facebook exports.
- Order-stage photos: store work-in-progress images through `custom_order_stage_photos`; default status is `internal_review` until approved for public use.

## Build 165 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Restored `functions/api/admin/custom-requests.js` to the full admin custom-request workflow file and repaired the broken marketplace preset tag-splitting regex that blocked Cloudflare Pages Functions deployment.
2. Repaired dark-theme consistency for the previously light `/shop/` browse-by-collection panels, `/creations/` creation-browse panels, gift-card cards, and inventory image cards.
3. Added inline post-publish QA buttons and QA badges inside `/admin/catalog/` product rows.
4. Added `Run QA` action wiring to call `/api/admin/product-publish-qa` directly from product rows.
5. Added `Fix now` links beside each readiness blocker on `/admin/readiness/`.
6. Added visible crop rectangle guidance on product image thumbnails.
7. Added square crop/focal quick controls in Product Media Workflow.
8. Added bulk recommended image-role assignment controls in Product Media Workflow.
9. Confirmed the upload workflow keeps client-side resize/compression controls visible before upload.
10. Added admin gift-card balance lookup endpoint and UI support through the customer engagement workflow.
11. Added a direct Trust Block Moderation workspace at `/admin/trust-blocks/`.
12. Added public proof/trust-block placement guidance by page/context.
13. Added marketplace export preview workspace at `/admin/marketplace-exports/`.
14. Added `/api/admin/marketplace-export-preview` with image-readiness summaries before CSV export work.
15. Added customer-facing private order-stage photo gallery support on custom order status links.
16. Added admin prompt workflow for adding custom order-stage photo URLs.
17. Added candle/soap spec display support on public product detail pages.
18. Added safety/allergen note display for candle/soap products.
19. Added accountant evidence URL checker endpoint and Accounting page UI mount.
20. Added a compact mobile-admin “Today’s admin tasks” queue linking readiness, failed APIs, inventory, and accounting evidence work.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 sanity remains covered by the predeploy pass.
- SEO bake script: PASS, 0 pages changed because no override rows are populated.

Next 20 recommended steps:

1. Add true visual drag handles for crop rectangles, not just focal-click crop guidance.
2. Add actual browser-side image compression size reporting before upload.
3. Add R2 direct upload for order-stage photos instead of URL-only entry.
4. Add moderation approvals before order-stage photos can become public proof.
5. Add gift-card activation after confirmed paid order status.
6. Add gift-card refund/void/reissue controls.
7. Add gift-card public balance lookup with email/code verification.
8. Add marketplace CSV download from the new preview screen.
9. Add channel-specific marketplace validation rules for Etsy/Facebook/Pinterest.
10. Add trust-block placement toggles per page instead of manual context typing.
11. Add public page modules that can request trust blocks by page/context.
12. Add product-card trust/proof badges based on approved trust blocks.
13. Add customer-facing candle/soap safety accordion on product pages.
14. Add admin candle/soap batch search and batch recall notes.
15. Add accountant evidence attachment upload, not only URL checks.
16. Add failed API cards to the mobile admin queue using runtime incident data.
17. Add a Today task API that merges orders, inventory, products, requests, and accounting work.
18. Add product publish QA results persistence so badges survive reloads.
19. Add one-click “fix first image” guided workflow from the QA/readiness cards.
20. Add local SEO landing-page review queue for each major product/service category.
## Build 166 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Added visual drag handles on product image crop rectangles in Product Media Workflow.
2. Added browser-side upload size reporting so image edit preview shows original size, estimated output size, and savings.
3. Added R2 direct upload support for custom order-stage photos, with URL-entry fallback preserved.
4. Added moderation fields for order-stage photos before they can become public proof.
5. Added gift-card activation handling when a connected order is confirmed paid.
6. Added admin gift-card lifecycle actions: activate paid, void, refund/reduce balance, and reissue.
7. Added public gift-card balance lookup with gift-card code plus email verification.
8. Added marketplace CSV download from the preview endpoint.
9. Added channel-specific marketplace validation rules for Etsy, Facebook Marketplace, Pinterest, and manual listings.
10. Added trust-block placement toggle storage by page/context.
11. Added public trust-block context loader module for shop, creations, gift cards, product, gallery, and about pages.
12. Added shop product-card trust/proof badges when approved trust blocks or social-ready proof signals exist.
13. Added customer-facing candle/soap safety accordion on product detail pages.
14. Added candle/soap batch/safety fields to the public detail renderer.
15. Added accounting evidence attachment upload from the evidence checker workflow.
16. Added failed API/runtime incident task cards into the mobile admin queue through the new Today Tasks API.
17. Added `/api/admin/today-tasks` to merge orders, inventory, products, custom requests, accounting, and failed API work.
18. Added persisted product publish QA results in `product_publish_qa_results` so QA badges can survive reloads.
19. Added groundwork for a one-click first-image fix workflow through crop handles, role tools, and existing readiness links.
20. Added `/admin/local-seo-review/` and `/api/admin/local-seo-review` for major category/service landing-page review.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 check: PASS
- SEO bake script: PASS, 0 pages changed because no override rows are populated.
- ZIP integrity: PASS

Schema/data notes:

- New tables: `product_publish_qa_results`, `gift_card_admin_events`, `trust_block_placements`, `local_seo_landing_page_reviews`.
- Expanded table: `custom_order_stage_photos` now supports R2 object metadata, moderation status, proof candidate status, and approval fields.
- Gift cards continue to use `gift_cards` and `gift_card_redemptions`; admin lifecycle events now write to `gift_card_admin_events`.
- Public token/private pages remain `noindex,nofollow` where applicable.

Next 20 recommended steps:

1. Add draggable crop-box preview persistence to generated R2 derivative images.
2. Add automatic image compression before upload instead of preview-only reporting.
3. Add customer-facing proof-photo consent prompts tied to uploaded order-stage photos.
4. Add admin moderation queue dedicated only to stage photos and proof candidates.
5. Add automated gift-card email delivery after paid-order activation.
6. Add gift-card redemption entry in admin checkout/order screens.
7. Add public gift-card balance lookup rate limiting and abuse logging.
8. Add marketplace CSV mapping editor for channel-specific field names.
9. Add marketplace CSV image selector so only approved image roles export.
10. Add trust-block placement UI with max item counts and filters visible on each toggle.
11. Add public trust-block sections to remaining local landing pages.
12. Add category-specific proof requirements for jewelry, candles, soap, vintage, and custom work.
13. Add candle/soap label export fields for weight, ingredients, allergens, and batch.
14. Add candle/soap batch recall workflow and customer notification queue.
15. Add accountant evidence ZIP inclusion for uploaded accounting attachments.
16. Add failed-API drilldown cards directly on the mobile dashboard.
17. Add Today task completion/ignore controls so the queue can be cleared.
18. Add product QA history panel beside Catalog product rows.
19. Add guided “fix first image” wizard that opens image role, crop, and public-use fields in order.
20. Add local SEO review scoring for title, meta, H1, internal links, and local proof wording.

## Build 167 update - dark theme, media derivatives, proof moderation, gift cards, marketplace mapping, and SEO scoring

- Repaired the `/creations/` browse panels and main-page Local maker trust block so they stay consistent with the dark Devil n Dove theme instead of using white cards with black text.
- Added product image derivative/crop preview records so focal/crop work can be queued toward real R2 derivative images.
- Added stage-photo proof moderation queue before custom order photos can become public proof.
- Added gift-card redemption endpoint for admin checkout/order workflows, plus public balance lookup attempt logging and rate limiting.
- Added marketplace CSV mapping editor and endpoint for Etsy, Facebook Marketplace, Pinterest, and manual exports.
- Added accountant evidence attachment upload/list endpoint for future accountant ZIP packaging.
- Added Today task complete/ignore persistence and mobile dashboard controls.
- Added local SEO scoring endpoint for landing-page review rows.
- Added product QA history endpoint for future catalog-side QA panels.

### Next direction
Keep moving repeated image proof, marketplace mapping, gift card, evidence, and local SEO review data into D1-backed review queues with safe JSON fallbacks, and keep public pages on one clear H1 with local wording in titles/headings.

## Build 168 — Roadmap/Gaps Pass Completed

Build 168 continues the Devil n Dove roadmap/gaps pass with real R2-backed derivative image records, marketplace image selection persistence, consent-aware stage-photo proof moderation, gift-card delivery/redemption/abuse tooling, accountant evidence attachment packaging, local SEO scoring/quick actions, catalog QA history, candle/soap labels and recall review, trust-placement counts/previews, Today task snoozing, failed API drilldowns, stronger dark-theme regression checks, and a post-deploy smoke-test checklist.

Completed Build 168 items:

1. Product image derivative records can now create an R2 derivative object/key when an R2 bucket is available; otherwise they fall back to safe query-string previews.
2. Marketplace export image selections now persist per product/channel before CSV export.
3. Stage-photo public proof approval now checks for matching public-use media consent.
4. Approved public-use stage photos now generate public-proof candidates for admin review.
5. Order admin screens now include a gift-card redemption panel for order-linked redemptions.
6. Gift-card activation/reissue actions queue email delivery records in the notification outbox.
7. Gift-card lookup abuse dashboard endpoint added for repeated failed public lookups.
8. Accountant export ZIP now includes evidence attachment URL files and attachment rows in the evidence index.
9. Local SEO review rows now show score badges.
10. Local SEO review has quick actions for title/meta review and completion.
11. Product QA history panel was added to catalog product rows.
12. Product Media Workflow now shows image derivative history beside media rows.
13. Candle/soap label CSV export endpoint and admin download action were added.
14. Candle/soap batch recall/watch dashboard endpoint and admin panel were added.
15. Trust-block placement counts were added to placement data.
16. Trust-block preview by page context was added.
17. Today tasks now support snooze, in addition to done/ignore.
18. Mobile admin Today tasks now show failed API/runtime incident drilldown details.
19. Stronger dark-theme regression checks were added for public sections.
20. `POST_DEPLOY_SMOKE_TEST.md` was added for live URL checks after deployment.

Apply `database_upgrade_current_pass.sql` after deployment so the Build 168 D1 tables/columns are available.

Next 20 recommended steps:

1. Add true pixel crop/resizing worker output for derivative images instead of metadata copy fallbacks.
2. Add visual derivative comparison before/after panels.
3. Add direct marketplace export history per channel.
4. Add marketplace image-selection bulk apply from product role order.
5. Add a dedicated public-proof candidate moderation page.
6. Add customer-visible proof consent status inside private order links.
7. Add gift-card delivery template editor.
8. Add gift-card resend delivery action.
9. Add gift-card fraud/abuse severity scoring.
10. Add binary R2 evidence file bundling when Cloudflare zip generation supports it safely.
11. Add local SEO deploy/bake actions for approved title/meta changes.
12. Add local SEO competitor phrase checklist per landing page.
13. Persist product QA panel expanded/collapsed state.
14. Add product QA issue-specific Fix buttons.
15. Add candle/soap label print layout preview.
16. Add candle/soap recall customer notification queue.
17. Add trust-block A/B placement notes and performance tracking.
18. Add Today task snooze duration selector.
19. Add live post-deploy smoke-test result storage in D1.
20. Add public-page dark-theme screenshot review checklist to `IMAGES.md`.


## Build 169 public-page dark-theme screenshot review checklist

Use this checklist after each deploy or major CSS pass. Capture desktop and mobile screenshots before considering the pass complete.

1. `/` — verify the hero, Local maker trust, gift-card callout, and trust/proof blocks use dark cards with readable light text.
2. `/shop/` — verify Browse by collection direction, filters, product cards, mini galleries, price/status text, and empty states stay dark-theme consistent.
3. `/creations/` — verify Browse Devil n Dove creations uses dark panel contrast, not white cards with pale text.
4. `/gift-cards/` — verify artwork, form panels, balance lookup, and helper text match the main site theme.
5. `/custom-request/` — verify custom request cards, candle/soap options, uploads, and warning/error states are readable.
6. `/shop/product/?slug=example` — verify image gallery, trust badges, candle/soap safety accordions, and related proof panels remain dark-theme readable.
7. `/custom-candle-making-ontario/` and `/custom-soap-making-ontario/` — verify one H1, readable intro panels, and local Southern Ontario wording.

A CSS pass is not complete if any public section falls back to a plain white card unless it is intentionally styled as a printable preview.

## Build 170 — deployment blocker hardening, image derivatives, marketplace replay, proof promotion, gift-card lockouts, SEO bake scoring, recall matching, smoke tests

### Completed in this pass
- Added `/api/image-derivative` worker route for derivative image serving when Cloudflare Image Resizing is available, with safe original-image fallback.
- Added “Use this derivative as featured image” support to `product-image-derivatives` and Product Media Workflow derivative cards.
- Added marketplace export history snapshot storage plus replay and rollback actions.
- Added marketplace CSV field preview per channel/product row in the export preview UI.
- Connected approved public-proof candidates into `trust_block_items` through a Promote to trust block action.
- Added source filters for public-proof candidates by status, source kind, consent status, product, and custom request.
- Added gift-card delivery sender bridge into `notification_outbox` plus sent/failed status controls.
- Added gift-card delivery history endpoint for order/customer admin views.
- Added gift-card abuse lockout controls and public lookup lockout enforcement.
- Extended the static SEO bake script to consume `data/site/local-seo-bake-actions.json` as deploy-bake input.
- Added competitor/local phrase scoring against live page copy from the local SEO phrase endpoint.
- Persisted product QA blocker events and blocker-resolution history.
- Kept Product QA fix targeting tied to exact admin editor destinations and blocker history records.
- Added candle/soap recall customer matching from orders/order items.
- Added candle/soap recall send-review and notification-draft queue steps before customer notification.
- Prepared accountant export evidence attachment bundling notes and kept safe URL/object-key evidence manifests in ZIP output.
- Added `/admin/post-deploy-smoke-tests/` page with storage for live URL smoke-test results.
- Added dark-theme screenshot/evidence rows via `/api/admin/dark-theme-evidence`.
- Added mobile Today task filters for urgent/product/accounting/request work queues.
- Added `scripts/final_deployment_blocker_check.py` and ran it before packaging.

### Next 20 recommended steps
1. Add real binary-safe accountant evidence bundling for small PDF/image receipts when R2 fetch is explicitly enabled.
2. Add an admin page for dark-theme screenshot evidence review and status changes.
3. Add direct product QA fix buttons that auto-open the exact editor section and focus the target field.
4. Add one-click promotion from public-proof trust block into selected public page placements.
5. Add gift-card delivery provider adapters for the chosen email service.
6. Add gift-card lockout release controls into the visible Gift Card Admin page.
7. Add marketplace export diff view between current selections and replayed history.
8. Add marketplace rollback per whole channel export, not only per product selection.
9. Add public proof candidate customer-consent source linking in the moderation card.
10. Add R2 derivative worker route settings panel with enabled/disabled health checks.
11. Add direct derivative-to-featured buttons inside the product editor image strip, not only the Product Media Workflow.
12. Add recall customer-match preview grouped by product/batch/order before queueing notifications.
13. Add recall “send approval required” gate before notification drafts can leave draft state.
14. Add local SEO bake-action export from D1 to `data/site/local-seo-bake-actions.json`.
15. Add competitor phrase status badges directly on each local SEO landing-page row.
16. Add today-task filters to the desktop admin dashboard too.
17. Add post-deploy smoke-test quick-run buttons for core live URLs.
18. Add deployment-blocker checklist output into `SANITY_HEALTH_CHECK.md` automatically.
19. Add stronger public-page dark-theme screenshot checklist examples into `IMAGES.md` as real sample rows.
20. Add a release notes generator so each zip includes exact changed-file and D1 migration summaries.

## Build 178 image and evidence notes

- Deploy Readiness can track recall signature evidence placeholders and R2 signed URL verification results.
- Dark-theme/admin evidence remains reviewed through existing evidence pages; Build 178 focuses on final readiness visibility.

# Build 186 consolidation note

Build 186 adds `PROJECT_STATUS_AND_ROADMAP.md` and `AI_HANDOFF.md` as the two primary starting files for future work. This file remains as a supporting reference for detailed history, implementation notes, or specialized context. Build 186 also adds `/admin/markdown-sanity/`, visual graphic placeholders across key public pages, desktop/mobile sanity rows, CSS drift/overlap rows, and a new migration: `database_build186_markdown_consolidation_visual_placeholders.sql`.

## Build 186 visual placeholder rule

Public placeholders live under `/assets/visual-placeholders/` and are injected only as temporary, lightweight SVG image slots. Replace them only after public-use/consent approval, alt text, compression, mobile review, and performance budget checks.
