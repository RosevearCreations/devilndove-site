# Build 246 product image-role note

Product Editor image roles remain separate: supporting gallery, featured image and SEO/social image. Build 246 visibly marks the SEO/social image and preserves `product_seo.og_image_url` when an edit/reload temporarily omits that field; supporting gallery recovery from Build 245 remains non-destructive.


Product Editor now resolves up to seven unique supporting images from four D1 evidence layers in priority order: `product_images`, non-deleted linked `media_assets`, non-removed `product_media_role_assignments`, then `product_image_annotations`. Build 245 migration can restore missing `product_images` references non-destructively from those links/history. An existing selected featured image is preserved; a blank featured image may be filled from the first recovered gallery image. SEO/OG media is not a substitute for the supporting product gallery. Use `BUILD246_D1_VERIFICATION.sql` (which retains the media-integrity checks) and the migration snapshot table to find products that still need media review.

# Build 230 current media authority note

Creative Automation references existing media/evidence and never copies, moves, deletes or elevates its public rights. Its process-map SVG is admin-only. Real public product/story media still requires owned/consented source, accurate role/alt text, reliable URL and specialist approval. Detailed capture/replacement work lives in `IMAGES_REQUIRED.md`, which is now the required manifest for the distinct Critical `missing_launch_images` Startup gate.

---

# Build 206 media resolution note

For Product Editor display, a featured image is resolved from the product record, ordered gallery, then a linked non-deleted media-library asset. The visual source label prevents operators from mistaking a valid media asset for a missing product image. The admin placeholder is never a public/catalog image and must not be placed into product schema or public Open Graph fields.

---

# Retired reference — Build 200

This file is preserved as historical implementation evidence only. It does not define current work or release order. Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`; use `MARKDOWN_INDEX.md` to decide whether this historical note is relevant.

## Images and Media Notes — Build 199

Public visual placeholders remain placeholders until replaced by approved real media with accurate alt text, consent where applicable, compression, and desktop/mobile review.

Build 199 Content Automation Studio rules:

- The content archive is a source-reference index; it does not move, delete, overwrite, or automatically promote original R2/product photos or videos.
- A Content Studio **Lead source** is separate from a product’s Featured Image URL.
- Existing public-use/consent metadata is imported as review context. It does not replace the underlying consent record or make unknown media public automatically.
- Any final public page, gallery, blog, social post, or Google Business Profile photo needs a real approved asset, accurate descriptive alt/caption text where relevant, and a stable accessible URL.

> Build 207 note: public product-card and featured-product image selection now excludes explicitly blocked or consent-needed reviewed images; linked consent must permit public use.
