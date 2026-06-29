# Devil n Dove Project Status and Roadmap — Build 198

This is the primary business/release-readiness source. Read `AI_HANDOFF.md` for deployment order and `MARKDOWN_INDEX.md` for retained specialist documentation.

## Executive sanity check

Build 198 addresses the two remaining daily catalog blockers reported after Build 197: inventory records could be loaded but then saved as new records, and retained product media could leave a blank Featured Image URL after approval or partial editing. The source package is deployment-ready, but the live result is not proven until the D1 migration, Pages deployment, and smoke tests are complete.

## Build 198 completed

1. Added a real edit state to Tools & Supplies Inventory Operations, with PATCH for updates and POST only for new records.
2. Added an always-reachable **Edit full record** button in the first table cell and responsive CSS that keeps full editing available on mobile.
3. Kept a newly created inventory record open for immediate full editing; added item description to the form.
4. Preserved source identity after creation while allowing full editing of operational stock, cost, supplier, and reorder information.
5. Made the first retained product image the default featured image in create/update flows.
6. Preserved all omitted media during normal saves and normalized image sort order so an explicit featured image becomes the first gallery image.
7. Added review-time and migration-time recovery for blank featured fields using retained first image data; no image/video records or R2 source objects are deleted.
8. Retained Build 197 shop-card, mobile-nav, category, 503 resilience, conflict handling, and non-destructive media safeguards.
9. Kept `AI_HANDOFF.md` and this file as the canonical two-file project direction; all specialist Markdown remains retained for future chats.

## Immediate live verification priorities

1. Deploy Build 198 after the Build 198 migration.
2. In Tools & Supplies Inventory Operations, edit an existing tool/supply, change several fields including quantity and cost, save, reload, and confirm the same ID changed with no duplicate row.
3. Add a fresh inventory item, save once, then change supplier/cost/quantity in the still-open form and save again; confirm it stays one record.
4. Use an existing product with three images: blank the feature field only, save, reload, and confirm the first retained image fills it. Then approve the product and verify all media remains.
5. Verify a product with a deliberately selected first image retains that selection after Update Product and after approval.
6. Recheck Shop at phone, tablet, and desktop widths; image-first cards and compact phone navigation remain intact.


---

## Build 197 retained context
## Executive sanity check

Devil n Dove has the core shape of a credible small creative-business platform: a storefront, product and inventory tools, handmade/vintage presentation, custom-request and community foundations, media/consent workflows, local SEO guardrails, and mobile administration.

Build 197 resolves the most immediate daily-use blockers reported in the live admin: repeated 503 dashboard failures, product-detail schema sensitivity, a retry loop after ordinary 409 conflicts, product correction that worked only once, destructive image saves, missing category management, weak card layout, and an overlong phone navigation list.

The release is **deployment-ready**, not yet proven live. D1 migration and Pages deployment must happen before the hosted site can be called fixed.

## Build 197 completed

1. Made key admin helper reads resilient and removed unnecessary schema/seed work from frequent dashboard reads.
2. Added stable degraded dashboard payloads for optional Community, Custom Request, Social Queue, and Readiness data when a non-critical table is not yet available.
3. Rebuilt product-detail reads to tolerate schema drift and return usable JSON errors rather than opaque function failures.
4. Stopped 409 duplicate conflicts from being queued and replayed like network outages.
5. Scoped unused-product correction state to the currently selected product so the delete/review action can be used again after loading another product.
6. Preserved existing product images on normal product edits, including featured/SEO image changes and short media lists.
7. Made the dedicated image editor explicit-delete only; removing a visible image row is held until Save Images and never bulk-erases unrelated media.
8. Added a product-media change audit migration and runtime audit writes when the table is present.
9. Accepted the Additional Colours editor field and normalized colour values for safe persistence.
10. Added Soap and Candles to reusable category defaults.
11. Added a visible category manager in Admin Catalog so owners can add future types without code edits.
12. Converted shop cards to image-first cards with product details below the picture.
13. Added a labelled, accessible product-photo placeholder for missing product imagery.
14. Converted phone navigation to a compact popup with accordion groups.
15. Added responsive CSS protections for the new cards, placeholder, category manager, and nav behaviour.
16. Consolidated current documentation direction into the two canonical files while retaining specialist/historical files for future AI handoff.
17. Added Build 197 migration and updated the fresh full-schema file.
18. Retained the prior one-H1, structured product fact, alt-text, consent, and local-claim safeguards.

## Current strengths

- Clear product lifecycle: permanent System #, SKU uniqueness, archive-versus-delete protections, and reviewed inventory return workflow.
- A safer product media workflow: updates are additive/preserving; removal is deliberate and audit-capable.
- Stronger everyday product browsing: visual product card first, facts below, easy category filters, and manageable phone navigation.
- SEO foundation: one-H1 guardrail, title/meta/canonical controls, product facts, image-alt workflow, local landing pages, and structured-data groundwork.
- Owner-controllable category choices without having to edit source code.
- Mobile and desktop administration, with careful fallback when optional operational reporting is unavailable.

## Remaining business-critical work

1. Deploy Build 197 and run the full live smoke test. This is the first priority.
2. Enter real costs, labour, packaging, waste, payment fees, and marketplace fees with effective dates before trusting margins.
3. Add truthful product listing facts—materials, dimensions, care, processing/pickup/shipping—and approved images for the most important products.
4. Generate and verify actual R2 WebP/AVIF derivatives and `srcset`; UI readiness does not create image files by itself.
5. Test Stripe webhooks, transactional email, R2 signed access, and storage cleanup with live credentials/evidence.
6. Import real Search Console/Google Business Profile evidence and make only evidence-based SEO changes.
7. Capture narrow-phone, tablet, laptop, and larger desktop screenshots for Shop, Catalog, product edit, product correction, and media edit flows.
8. Record administrator training: categories, ordinary product saves, explicit image removal, archive vs delete, and 409 duplicate resolution.

## SEO and competitive direction

Keep the storefront factual, easy to scan, and mobile-equivalent:

- Use one clear H1, meaningful page title, helpful meta description, and a canonical URL for every exposed route.
- Ensure structured product data matches what visitors can see: product name, price, availability, and images.
- Use concise product cards that keep image, product name, price, category, and call-to-action together.
- Offer familiar handmade-shop groupings such as jewelry, bath/body, candles, gifts, and workshop-made goods where they match actual inventory.
- Use strong, descriptive product image alt text. Decorative placeholder graphics should remain non-descriptive.
- Do not make ranking, local-pack, or product-performance promises. Local visibility still depends on evidence, relevance, distance, prominence, real reviews, and current business information.

## Owner testing sequence after deployment

1. Run the Build 197 migration after confirming Build 196 is recorded.
2. Sign in as an admin and open `/admin/operations/`; verify the page is usable and its helper calls return JSON instead of 503.
3. Load two different unused test products one after the other and use the correction/preview path for each. Confirm the second one works.
4. Edit a product with at least three images and a video/link. Change only the featured/SEO image and Additional Colours, save, reload, and verify every original media item remains.
5. In the dedicated media editor, remove one test image row, save, reload, and verify only that image row is gone. Then confirm no R2 source was auto-deleted.
6. Intentionally use a duplicate SKU or slug and confirm the editor shows a resolution message rather than repeatedly retrying.
7. Add a category through **Manage product categories**, then confirm it appears in the product editor.
8. Check Shop at roughly 360 px, 768 px, 1024 px, and desktop width. Product information belongs below images; the phone menu stays compact until opened.
9. Verify a public page’s title, one H1, canonical, product price, availability, primary image alt text, and structured-data facts match visibly rendered content.

## Release readiness opinion

The source package is ready to deploy with its Build 197 D1 migration. The live environment should be called ready only after the smoke tests pass, no unresolved 503 occurs, and the first real products/costs/media have been reviewed. Provider-dependent and real-world data tasks remain intentionally open until evidence exists.
