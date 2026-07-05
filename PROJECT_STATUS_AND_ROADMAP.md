# Devil n Dove Project Status and Roadmap — Build 207

## Purpose

This is the business and release-readiness source for the Devil n Dove storefront/workshop system. `AI_HANDOFF.md` is the technical and operational companion. Specialist documents remain reference material unless `MARKDOWN_INDEX.md` lists them as active.

## What Build 207 completes

### Catalog accuracy and operator speed

- Existing products can be found by Product ID, product number, name, SKU, or slug.
- Picker filters now surface Draft, Active, Archived, Pending review, Revision/needs changes, Approved, and Published work without forcing a table reload.
- Picker sorting supports recent updates, newest records, alphabetical name, newest Product ID, and media-attention order.
- Product ID is searchable in both the product editor and media workspace.
- The catalog product table displays tax class plus a normalized display rate, avoiding the historic `0.13%`/`1300%` confusion.

### Featured media integrity

A featured field no longer looks empty merely because the valid image lives in a different catalog media layer. The resolution order is intentionally explicit:

1. Product record `featured_image_url`.
2. Ordered `product_images` gallery.
3. Non-deleted `media_assets` record linked to the product.

The Product Editor shows the source and a preview. A normal product save can persist the resolved URL to the product record. This reduces accidental blank listing cards while retaining the original media rows.

### Focused product-media workspace

`/admin/catalog-media/?product_id=<id>#product-media-workflow` now has a working-product reference at the top. It acts as the single context selector for images, annotations, media roles, buyer-facing facts, story notes, and SEO. The workspace is responsive; controls collapse to one column on narrow screens instead of overflowing.

### CAIP progression

CAIP remains review-first and source-safe. Builds 206–207 add useful handoffs rather than a risky automation: media workspace links can open CAIP for the same product, and CAIP will select that product’s existing project when found. No source media is copied, rendered, altered, publicly released, or rights-elevated by this bridge.

### Product media → Content Studio → CAIP visibility

Build 207 closes the operator visibility gap between the selected product and its downstream review records. The catalog-media workspace now reports whether the product has no package, a Content Studio package, or a linked CAIP project. It shows source-media counts, approved/public-cleared review counts, deliverable counts, governance status, and direct workspace links.

Operators choose the action deliberately:

- **Create content package + CAIP** only for an Approved/Published finished product.
- **Refresh CAIP only** only after a Content Studio package exists.

Both actions are logged. Neither is a publication, image transformation, rights grant, or source-media change.

### Public media safety and storefront consistency

Public product-list and featured-product responses now reject product images that were explicitly marked `blocked` or `consent_needed`. Where a media consent record is attached, the record must permit public use before the image is included. Existing unannotated first-party product images remain compatible until real operator review data says otherwise.

## Search and competitive direction

Devil n Dove’s defensible lane is not generic high-volume content. It is accurate Southern Ontario maker commerce: clear product facts, honest handmade/one-of-a-kind notes, strong real photos, local pickup/shipping clarity, safe custom requests, and source-backed workshop stories.

Current public-page requirements:

- One H1 per page.
- Product title and main heading should describe the actual piece in language a buyer would use.
- Product schema, visible price/availability, title/meta, image URLs, and alt text must agree.
- Use real, approved images with useful contextual alt text; placeholders remain admin-only until valid media is assigned.
- Never imply that a future CAIP plan, derivative, social draft, or AI review is a published image/video or verified claim.

## Active business workflow

```text
Make / source item
→ capture product and resources
→ add approved real media and factual descriptions
→ price/tax/stock/SEO review
→ catalog approval
→ Content Studio / CAIP review package
→ explicit public release or marketplace/social approval
→ sale / fulfillment / customer consent / repeat relationship
```

## Highest-value next work

1. **Login evidence and repair:** capture the safe response from the current `POST /api/auth/login` 500 before changing any D1 schema.
2. **Build 207 public-media proof:** run real data through approved, blocked, consent-needed, no-annotation, and clearly permitted image cases.
3. **Featured-media live proof:** test products that have only `media_assets`, only `product_images`, both, and neither; confirm correct save/reopen behavior.
4. **Release-preflight workflow:** build a concise operator checklist from catalog facts, image roles, consent, Content Studio deliverables, CAIP evidence, and Release Board approval conditions.
5. **Real device tests:** test Product Editor, Catalog Media, Content Studio, and CAIP on a phone, tablet, and desktop browser with slow network conditions.
6. **Release evidence:** keep Search Console/GBP/marketplace performance observations separate from assumptions; change public SEO only after reviewed evidence.
7. **CAIP operations:** only later add checksum, controlled technical extraction, derivative output namespace, human review, cost limits, and verified renderer/publishing adapters.

## Deliberately not represented as complete

- The current login 500 is not claimed fixed without the returned error code/log.
- No external AI vision, video render, thumbnail provider, OAuth social publisher, or paid provider is active through CAIP.
- No real product-media derivative is created by a CAIP plan.
- Stripe/email/webhook, public SEO, live marketplace, R2, D1, and mobile tests still need deployment evidence.
