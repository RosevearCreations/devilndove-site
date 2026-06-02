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
