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
