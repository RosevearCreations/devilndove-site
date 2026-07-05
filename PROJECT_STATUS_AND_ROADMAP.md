# Devil n Dove Project Status and Roadmap — Build 208

## Purpose

This is the business and release-readiness source for the Devil n Dove storefront/workshop application. `AI_HANDOFF.md` is the technical companion. Specialist Markdown is reference material unless `MARKDOWN_INDEX.md` says otherwise.

## What Build 208 completes

### One practical product release decision

The operating flow now has a product-level decision point between Content Studio/CAIP work and a public Release Board action:

```text
Make/source item
→ truthful catalog facts, tax, price, stock and SEO
→ approved real media with roles and actual public-use status
→ Catalog approval
→ Content Studio package
→ CAIP evidence/governance review
→ Product Release Preflight
→ explicit Release Board approval
→ explicit publication / marketplace action
```

`/admin/release-preflight/` lets an operator search by Product ID, product number, name, SKU, or slug. It separates two questions that must not be blended:

- **Can this package move to the Release Board?**
- **Is the selected public destination actually ready to publish?**

The first question can pass while the second remains blocked because no Workshop Journal/Gallery public draft exists yet. This prevents the system from claiming a product is public just because upstream catalog or CAIP work is finished.

### Product-media resilience

The original three-layer featured-image resolver remains:

1. `products.featured_image_url`.
2. Ordered `product_images`.
3. Non-deleted linked `media_assets`.

Build 208 adds an optional, administrator-confirmed sync when a real existing source resolves but the stored product field is empty. This reduces repeated blank-editor confusion without making a background job silently choose or overwrite media.

### CAIP progression

CAIP remains reference-only and human-reviewed. Build 208 reads its governance status, source-rights signals, evidence rows, and story approval signals in the release preflight. It does not activate a renderer, AI vision model, social connection, marketplace publisher, or paid provider.

### Current competitive/SEO direction

The application is built around the signals that matter for handmade and one-of-a-kind commerce: truthful listing facts, a clear primary image, useful contextual alternative text, strong evidence behind public copy, category specificity, and a human decision before release. Google requires structured data to describe the visible page content, while Shopify and Etsy documentation emphasize product media, descriptive alt text, useful primary images, and listing quality. These principles are now represented as review checks rather than decorative or automated claims.

## Search and public content rules

- One visible H1 per public page.
- Titles, headings, descriptions, canonical URLs, schema, price, stock, and media must describe the actual listing.
- Placeholders are admin-only until a real approved asset is available.
- Do not use an unverified CAIP inference as public factual copy.
- Do not treat a draft, render plan, rights review, or internal approval as a published social/video/image output.
- Keep marketplace, Search Console, Google Business Profile, and storefront observations separate from assumptions.

## Highest-value next work

1. **Login evidence and repair:** obtain the safe `POST /api/auth/login` response/log code and change only that verified failure path.
2. **Build 208 production proof:** test the new preflight with representative real records and confirm it never writes on load.
3. **Public-media proof:** test approved, blocked, consent-needed, legacy-unannotated, and explicitly public-permitted media through the public catalog/featured-product endpoints.
4. **Featured-media proof:** verify products with only `media_assets`, only `product_images`, both, and neither. Confirm the explicit sync changes only `products.featured_image_url`.
5. **Real-device proof:** test Product Editor, Catalog Media, Release Preflight, Content Studio, CAIP, and Release Board on phone/tablet/desktop and a slow network.
6. **Release evidence:** use actual published results and performance observations to improve visible copy, internal links, and product structured data.
7. **Future CAIP operations:** only after policy approval, add checksums, controlled technical extraction, derivative output namespace, cost budgets, preview/review, output verification, retry, and rollback.

## Deliberately not represented as complete

- The login 500 is not claimed fixed.
- Build 208 does not create an output file, thumbnail, MP4, social post, marketplace listing, or provider call.
- CAIP does not grant rights, create consent, or make source media public.
- Stripe/email/webhooks, public SEO effects, R2/D1 live behavior, marketplace sync, and mobile reliability still need deployed proof.
