# Devil n Dove Media & Content Management Studio

**Project:** Devil n Dove  
**Purpose:** Application-wide editable media, gallery, artwork, and content-block management  
**Scope:** Devil n Dove only  
**Platform direction:** Cloudflare Pages / Functions, existing Devil n Dove database architecture, Cloudflare R2 for public media, existing private creative/project media boundaries  
**Important constraint:** Devil n Dove does **not** use Supabase. Do not import Rosie Dazzlers database assumptions into this design.

---

## 1. Objective

Create a single **Media & Content Management Studio** for Devil n Dove that allows an authorized administrator to manage virtually every public image and editable text area in the application without changing source code.

The studio should make it possible to:

- click an existing image and edit its metadata;
- upload a replacement without changing the public placement;
- choose another image from the media library and explicitly assign it to a page/card/slot;
- see exactly where each image is currently used;
- add, edit, reorder, archive, or safely delete gallery images;
- create multi-image collections for products, process stories, collections, galleries, tutorials, packaging, labels, blog posts, landing pages, and creative projects;
- manage backgrounds, banners, hero images, review/proof images, artwork, icons, decorative images, product photos, packaging assets, process photos, before/after comparisons, instructional images, and other visual presentation assets;
- edit the public-facing text blocks connected with those images;
- preserve existing correct images until an administrator deliberately changes them;
- maintain SEO, accessibility, consent, copyright, and performance metadata beside the media itself;
- support future Creative Automation Studio and CAIP workflows without exposing private/unreviewed media publicly.

The long-term result should be that Devil n Dove can regularly refresh its visual presentation and page copy from the admin interface instead of requiring a code deployment for routine content changes.

---

# 2. Core Safety Principle

## Existing public media must be protected

The system must **never automatically replace an image that is already correctly configured** merely because another R2 object has a similar filename.

Use the following precedence:

1. **Explicit administrator assignment** from Media & Content Studio.
2. Existing authored/catalog/configured image already attached to that product/page/card.
3. Approved automatic fallback/matching only when the authored slot is empty or broken.
4. Generic intentional placeholder as the final fallback.

Simply performing an R2 sync, changing alt text, editing a caption, or uploading another descriptively named image must **not** reassign existing public images.

---

# 3. Recommended Admin Interface

Create a protected admin area such as:

`/admin/media-content-studio/`

The interface should preserve a straightforward visual workflow.

## Desktop layout

### Left column — Media Library

- Search
- Folder filter
- Media type filter
- Assignment-status filter
- Missing-alt-text filter
- Missing-metadata filter
- Archived filter
- Recently uploaded
- Recently changed
- Duplicate/near-duplicate filter when available
- Thumbnail grid

Each thumbnail should show:

- preview;
- display name;
- filename;
- folder/location;
- media type;
- dimensions/aspect ratio when known;
- file size;
- status;
- assignment summary;
- **Edit / Assign** action.

Example status:

> Assigned to: Product 145 — Gallery 1  
> Assigned to: About page — Maker Story  
> +2 more

## Right column — Selected Media Editor

Clicking a thumbnail must immediately open the editor. The user should never need to scroll below hundreds of thumbnails to find the edit controls.

The editor should include:

### Preview

- current image;
- public URL;
- R2 key;
- width × height;
- aspect ratio;
- size;
- current focal point/crop preview.

### Basic metadata

- Display name
- Filename
- R2 folder
- Alt text
- Image title
- Caption
- Description
- Tags
- Search keywords for internal admin use
- Decorative image toggle
- Attribution / photographer / creator
- Copyright/license notes
- Consent/release notes
- Date created/captured when known
- Source: uploaded / generated / project / product / packaging / CAIP derivative

### Placement

First-class control:

> **Where should this image be used?**

Use a grouped dropdown or searchable target selector.

Assigned destinations should visibly show status:

- `✓ Product — Rose Soap — Gallery 1 — assigned`
- `✓ About — Hero — this photo`
- `Packaging — Soap Label Reference — available`

A slot occupied by another image can still be selected, but the system must warn that the existing assignment will be replaced before saving.

### Existing uses

Show all live uses of the selected image:

- page;
- card/section;
- product;
- gallery position;
- project;
- packaging template;
- blog/article;
- social/creative derivative reference if applicable.

Each use should have:

- Open page
- Open related record
- Remove assignment
- Replace only this placement

### Actions

- Save metadata
- Replace file, keep same placement
- Assign to selected destination
- Move/rename in R2
- Archive
- Delete if safe
- Download original if permitted by project policy
- Open usage report

---

# 4. Image Replacement Workflows

## 4.1 Refresh an existing image without changing placement

This should be the fastest routine workflow.

Example:

1. Select existing product photo.
2. Click **Replace image file**.
3. Upload the new image.
4. Keep the same R2 key unless the user explicitly chooses otherwise.
5. Refresh ETag/content hash/size/dimensions.
6. Keep all assignments, alt text, caption, tags, and related references unless the administrator changes them.
7. Publish a versioned/cache-busted public URL so the new file appears immediately.

This is ideal for seasonal product refreshes and improved photography.

## 4.2 Assign a different existing library image

1. Click the new image.
2. Choose **Where should this image be used?**
3. Select the exact product/page/card/gallery slot.
4. Show whether that slot is empty or occupied.
5. Preview the current image versus proposed replacement.
6. Explicitly confirm.
7. Save only that assignment.

No other placement should change.

---

# 5. Media Types to Manage

The system should not be limited to ordinary product photographs.

## 5.1 Product media

For every Devil n Dove sellable product:

- Featured image
- Gallery 1–12+
- Detail/macro image
- Scale/reference image
- Packaging image
- Lifestyle image
- Process/making image
- Material/source image
- Finished-product image
- Back/side/underside image when useful
- Care/use image
- Size/dimensions image
- Personalization/example image
- Variant image
- One-of-a-kind evidence image
- Certificate/provenance image when applicable

Applies to product families such as:

- Polymer clay
- Resin
- Candles
- Soap
- Coin rings
- Spoon rings
- Wire wrapping
- Lapidary/stone work
- Laser engraving
- CNC work
- 3D printed products
- Seasonal products
- Gift products
- Custom commissions

## 5.2 Category and collection imagery

Editable slots for:

- category hero;
- category card;
- featured collection image;
- seasonal collection banner;
- sale/promotional collection image;
- gift-guide image;
- featured-maker/process image.

## 5.3 Homepage

Every major visual should be targetable:

- main hero/banner;
- hero background;
- mobile hero variant;
- featured product cards;
- featured collection cards;
- maker-story image;
- mission/Devil-and-Dove story image;
- process image;
- trust/proof image;
- testimonial/review image;
- workshop/studio image;
- CTA background;
- footer promotional graphic.

## 5.4 General page backgrounds

Support:

- site-wide default background;
- header background;
- footer background;
- page-specific background;
- section background;
- decorative texture;
- light/dark/mobile variants where necessary.

Background images must be treated as editable presentation assets with their own focal point, overlay, opacity, contrast, and accessibility controls.

## 5.5 Banners and promotional graphics

Editable placements for:

- site-wide announcement banner;
- seasonal promotion banner;
- collection launch banner;
- shipping/pickup notice graphics;
- sale banner;
- gift certificate/gift card banner;
- market/event banner;
- holiday banner;
- social campaign/site campaign banner.

## 5.6 Review/testimonial/proof media

Allow editable:

- customer review image;
- product-in-use image;
- market booth proof image;
- packaging proof;
- social proof screenshot only where appropriate and legally usable;
- customer-submitted image with explicit consent;
- creator/workshop evidence.

## 5.7 About / Story / Mission pages

Editable imagery for:

- founder/maker story;
- workshop;
- tools;
- process;
- Devil n Dove mission;
- barriers-and-hope story;
- handmade process;
- Canadian-made proof;
- behind-the-scenes images;
- timeline/history images.

## 5.8 Blog/article media

Each article should support:

- featured image;
- hero image;
- inline image slots;
- gallery blocks;
- process step images;
- captions;
- comparison sets;
- related-product images;
- Pinterest/social derivative selection.

## 5.9 FAQ/support/how-to pages

Support editable media for:

- care guide images;
- candle safety illustrations;
- ring sizing guide;
- product material examples;
- packaging/shipping guide;
- custom-order explanation;
- process illustrations;
- “where to find this feature” screenshots;
- instructional diagrams.

---

# 6. Galleries

The gallery system should support more than one gallery type.

## 6.1 General gallery

A reusable gallery can contain:

- finished products;
- workshop photos;
- one-of-a-kind work;
- customer-approved images;
- seasonal work;
- technique demonstrations;
- materials;
- process steps;
- event/market images.

Admin controls:

- Add image
- Remove image
- Drag/reorder
- Caption
- Alt text
- Category
- Tags
- Featured toggle
- Publish/unpublish
- Link to product/project/article

## 6.2 Product galleries

Each product should support explicit ordered slots:

- Featured
- Gallery 1
- Gallery 2
- Gallery 3
- etc.

The media should be reorderable without renaming R2 files.

## 6.3 Before/After pairs

Useful for:

- restoration;
- refinishing;
- lapidary transformation;
- raw stone → finished stone;
- coin → ring;
- spoon → ring;
- clay/resin stages;
- raw material → final product;
- packaging redesigns.

Model as paired slots:

- Set 1 — Before
- Set 1 — After
- Set 2 — Before
- Set 2 — After

Do not publish a comparison until both halves are assigned.

## 6.4 Process / Technique / Evidence / Efficiency

Do not force every multi-image set into Before/After.

Support gallery categories such as:

- **Process** — step-by-step making sequence
- **Technique** — shows a method/tool/application
- **Evidence** — proves handmade work/material/use/result
- **Efficiency** — demonstrates workflow/tooling improvement where relevant
- **Materials** — source materials/components
- **Detail** — macro/close-up craftsmanship
- **Packaging** — finished packaging/label examples
- **Lifestyle** — product in context
- **Workshop** — behind-the-scenes
- **Event/Market** — booth/table/display

---

# 7. Artwork Management

Devil n Dove has a stronger artwork requirement than a typical ecommerce site because artwork is used in labels, packaging, laser work, engraving, social content, and product design.

Create a dedicated **Artwork** media type in the same studio.

## 7.1 Artwork categories

- Logos
- Rose artwork
- Botanical artwork
- Soap artwork
- Candle-top artwork
- Label backgrounds
- Label borders
- Icons
- Claims icons
- Recycling icons
- Hands/handmade icons
- Leaf/natural icons
- Laser engraving designs
- CNC designs/previews
- Product silhouette artwork
- Packaging templates
- Decorative textures
- Watermarks
- Social overlays
- Thumbnail graphics
- Printable inserts
- Care-card artwork
- Certificate artwork

## 7.2 Rose/color variants

Support the known rose colors as metadata/variants rather than scattered unrelated files:

- Red
- Pink
- White
- Off-white
- Yellow
- Coral
- Orange
- Peach
- Green
- Blue
- Brown
- Black
- Grey
- Silver
- Gold
- Copper
- Bronze

Artwork should be searchable by:

- subject;
- color;
- collection;
- product compatibility;
- packaging template compatibility;
- engraving suitability.

## 7.3 Packaging/label artwork linkage

Packaging Studio should choose artwork from the managed artwork library instead of relying on manually typed asset paths wherever possible.

Example:

> Soap → Oatmeal & Goat Milk → Rose color: Cream → Artwork: Oatmeal Botanical Rose

Changing the product/soap type should update the artwork selection/preview when the template rules indicate that it should.

---

# 8. Packaging Studio Integration

The Media & Content Management Studio should integrate with the unified Packaging/Label Studio.

Editable/manageable assets should include:

- soap label artwork;
- candle label artwork;
- candle-top engraving artwork;
- jar/container art;
- box/package art;
- product photography used in packaging previews;
- icons/claims;
- borders;
- textures;
- logos;
- template thumbnails;
- print/export examples.

Every packaging template should be able to declare:

- allowed artwork slots;
- static artwork;
- editable artwork;
- recommended dimensions;
- print-safe dimensions;
- transparent-background requirement;
- monochrome/engraving requirement;
- color restrictions;
- linked product type;
- linked ingredient/claims library.

Do not treat packaging artwork and website product photography as the same usage class even when they share one physical source image.

---

# 9. Creative Automation Studio / CAIP Integration

The public Media Studio must work **with**, not bypass, Devil n Dove's Creative Automation Studio and CAIP direction.

## 9.1 Private project media remains private

Raw Creative Project media should remain private until reviewed/approved for public use.

A private project asset can be promoted into the public media library only after:

- review;
- consent/privacy validation where required;
- selected evidence approval;
- derivative creation if needed;
- public title/alt/caption metadata preparation.

## 9.2 Promote approved project evidence

From a Creative Project, allow:

> **Add approved image to public Media Studio**

The resulting record should retain provenance:

- source creative project;
- source project event/timeline item;
- original capture date;
- selected derivative;
- review status;
- public use notes.

## 9.3 Content package creation

Media Studio should feed reviewed assets into:

- blog packages;
- YouTube thumbnails;
- Shorts/Reels/TikTok packages;
- Facebook posts;
- Pinterest pins;
- product pages;
- process articles;
- tutorials;
- email content where applicable.

The public media record should be reusable across these outputs without duplicating the raw file unnecessarily.

---

# 10. Editable Text Blocks

Image editability should be paired with **content-block editability** so pages do not remain partly hard-coded.

Create or extend a managed content-block system that supports:

- heading;
- subheading;
- paragraph;
- rich text;
- bullet list;
- callout;
- warning;
- process steps;
- FAQ;
- quote/testimonial;
- CTA;
- image + text block;
- multi-column feature block;
- specification table;
- care instructions;
- materials/ingredients block;
- shipping/pickup block;
- pricing note;
- custom-order note;
- SEO title/meta description where appropriate.

## Every important public page should be owner-editable

Priority areas:

- Home
- About / Story
- Products
- Product detail
- Category/collection pages
- Custom orders
- Packaging/label information
- Candle information
- Soap information
- Ring information
- Resin/polymer/lapidary pages
- Gift pages
- FAQ
- Contact
- Shipping/pickup
- Care instructions
- Blog/articles
- Creative process pages
- Market/event pages
- Landing pages
- Promotion pages

The admin interface should clearly distinguish:

- content currently published;
- draft edits;
- optional blocks;
- hidden blocks;
- required/static/legal text that cannot be accidentally removed.

---

# 11. Landing Page Editor

Every public landing page should have a complete editor rather than only title/hero fields.

Suggested editable structure:

## SEO

- Browser/page title
- Meta description
- Canonical slug where allowed
- Index/no-index controls for authorized admins only
- Social share title
- Social share description
- Social share image

## Hero

- Eyebrow text
- H1
- Hero paragraph
- Primary CTA
- Secondary CTA
- Hero image
- Hero background
- Mobile hero

## Main content

- Intro
- Why choose this product/service/process
- Materials
- Process steps
- Features
- Benefits
- Limitations/important notes
- Care instructions
- FAQs
- Related products
- Related articles
- Gallery
- Before/After
- Process/Technique/Evidence images
- Reviews/proof
- Final CTA

The page builder should preserve the one-H1 rule and other existing SEO guardrails.

---

# 12. Product Page Editor

Every Devil n Dove product should have a unified public-content editor.

Fields should include:

- Product name
- SEO title
- Slug
- Short description
- Full description
- Story/inspiration
- Materials
- Dimensions
- Weight
- Color
- Variant information
- Care instructions
- Safety information
- Personalization options
- One-of-a-kind status
- Quantity/availability wording
- Price
- Compare-at/promotional price if supported
- Featured image
- Product gallery
- Process gallery
- Packaging image
- Related Creative Project
- Related content/article
- Related products
- Tags/categories
- Shipping/pickup notes
- Custom-order CTA

Product image replacement must not affect inventory history, accounting, project costing, or material usage.

---

# 13. Soap / Candle / Specialized Product Content

## Soap

Support editable:

- soap-base/type;
- scent/variant;
- ingredients;
- claims;
- allergens/warnings;
- rose/botanical artwork;
- label image;
- product hero;
- gallery;
- ingredient/process imagery;
- packaging example.

## Candles

Support editable:

- vessel/container;
- scent;
- wax;
- wick;
- burn/care guidance;
- candle-top artwork;
- label;
- product hero;
- gallery;
- special event/anniversary personalization examples.

## Rings / metalwork

Support editable:

- source material;
- size;
- finish;
- process;
- before/raw material image;
- forming image;
- finished ring;
- care instructions;
- customization notes.

---

# 14. Media Folder Strategy

Use clearly approved public R2 prefixes. Exact folder names should follow the existing Devil n Dove R2 organization when implemented, but recommended logical groups are:

```text
public/
  brand/
  backgrounds/
  banners/
  products/
  categories/
  collections/
  galleries/
  process/
  techniques/
  evidence/
  reviews/
  blog/
  landing_pages/
  packaging/
  artwork/
  labels/
  engraving/
  care_guides/
  events/
  promotions/
```

Private/raw Creative Project/CAIP media must remain structurally separate and must **not** be exposed by the public manifest.

---

# 15. Database Direction

Use the existing Devil n Dove database architecture, not Supabase.

Conceptually, the media system needs:

## Managed media table

Suggested fields:

```text
id
storage_provider
bucket_binding
r2_key
public_url
filename
folder
mime_type
media_type
width
height
file_size
etag_or_content_hash
captured_at
uploaded_at
updated_at
display_name
alt_text
title
caption
description
tags_json
usage_contexts_json
focal_x
focal_y
decorative
attribution
license_notes
consent_notes
source_type
source_project_id
source_product_id
active
archived_at
created_by
updated_by
```

## Media assignment table

```text
id
media_id
target_key
target_type
target_record_id
slot_key
slot_order
active
created_at
updated_at
created_by
updated_by
```

A unique active assignment should generally exist for a single-exclusive target/slot.

## Content blocks table

Conceptual fields:

```text
id
page_key
record_type
record_id
block_key
block_type
heading
body
content_json
sort_order
active
published
created_at
updated_at
```

Use migrations appropriate to the existing Devil n Dove D1/SQLite environment and follow existing schema conventions.

---

# 16. Public Media Manifest

Provide a lightweight public API for only the media needed by the website.

Example:

`/api/public_media_manifest`

Important resource rule:

**Normal public page requests must not enumerate the R2 bucket.**

The public manifest should read bounded managed-media/assignment records from the database.

R2 enumeration should happen only during an explicit admin **Sync R2 media** operation.

This protects Devil n Dove from the same class of Worker CPU/memory problems that can arise when a growing bucket is scanned on each page request.

The public response should be compact and must not duplicate the full asset list under multiple keys.

---

# 17. R2 Sync

Admin action:

> **Sync approved R2 media**

The sync should:

- scan only approved public prefixes;
- use bounded pagination/cursors;
- not retrieve object bodies;
- avoid unnecessary custom metadata unless needed;
- update ETag/hash, file size, timestamp, and identity fields;
- preserve administrator-authored alt text, caption, tags, assignments, consent and provenance;
- insert newly discovered media;
- report missing R2 objects;
- never automatically assign newly discovered images to existing public slots.

Suggested result:

```text
Scanned: 328
New media: 12
Refreshed/replaced: 7
Missing from R2: 2
Warnings: 0
```

Do not echo the full R2 inventory back in the sync response.

---

# 18. Cache-Busting for Replaced Files

Replacing an image under the same filename should reliably refresh the website.

On sync or direct replacement:

1. update ETag/content hash;
2. update file size/timestamp;
3. generate public URL version parameter, for example:

```text
/assets.example.com/products/item.png?v=<etag-or-version>
```

This should force stale browser/CDN copies to refresh without requiring the administrator to rename every image.

---

# 19. Delete / Archive Rules

## Archive

Archive should be the default low-risk removal action.

Archived media:

- remains in R2;
- remains available for historical records;
- stops being used for automatic public selection;
- retains assignment history.

## Permanent delete

Allow permanent delete only if the image is **not actively assigned**.

Before deletion, perform a server-side usage check at the moment the delete is requested.

If active uses exist:

> Cannot delete this image. It is currently used in 3 locations.

List the locations and provide links to remove/replace those assignments.

If no active assignment remains:

- delete the public R2 object;
- remove/retire the managed media record according to project audit requirements;
- clean inactive assignment records if project policy allows;
- preserve an audit entry indicating who deleted it and when.

Never delete private CAIP/project masters through the public Media Studio.

---

# 20. Version History and Rollback

Add a later-phase version system so seasonal refreshes are reversible.

For each replacement, retain:

- previous R2 key/version or archival copy;
- previous ETag/hash;
- change date;
- changed by;
- reason;
- previous metadata snapshot where needed.

Admin should eventually support:

> **Restore previous image version**

without recreating page assignments.

---

# 21. Image Health

The Studio should eventually score and flag media quality.

Checks:

- dimensions;
- aspect ratio;
- file size;
- format;
- missing alt text;
- weak/generic alt text;
- missing title/caption where appropriate;
- oversized source image;
- poor thumbnail suitability;
- transparent-background requirement for artwork;
- monochrome requirement for engraving;
- duplicate/near duplicate;
- broken R2 object;
- unused image;
- stale image;
- missing consent/provenance where required.

Do not block harmless decorative assets merely for lacking descriptive alt text; decorative items should use the appropriate accessibility behavior.

---

# 22. SEO & Accessibility

For public non-decorative images, manage:

- contextual alt text;
- image title if useful;
- caption where useful;
- page relationship;
- width/height where known to reduce layout shift;
- lazy loading where appropriate;
- eager/high-priority loading only for critical hero/LCP images;
- descriptive filenames when practical;
- image sitemap/structured-data eligibility where appropriate.

Avoid keyword stuffing in alt text.

The system should help the administrator describe **what is visibly shown and why it matters in the page context**.

---

# 23. Image Crop / Focal Point

Never require destructive cropping of the source master for routine card placement.

Store focal point as metadata:

```text
focal_x = 0.52
focal_y = 0.34
```

Placements can use different presentation presets:

- hero wide;
- square card;
- portrait product;
- gallery landscape;
- mobile hero;
- social preview;
- packaging thumbnail.

Future enhancement: per-placement crop overrides while preserving the original media file.

---

# 24. Text + Image Composite Blocks

Support reusable components such as:

## Story block

- image;
- heading;
- body;
- CTA;
- image position left/right.

## Process step

- step number;
- image;
- title;
- explanation;
- optional duration/material/tool.

## Feature card

- icon/image;
- title;
- body;
- optional link.

## Testimonial card

- review text;
- reviewer display name;
- optional approved image;
- source/platform;
- date.

## Gallery intro

- heading;
- body;
- gallery selection;
- category filters.

---

# 25. Permissions

At minimum:

## Admin

- full media editing;
- assignment;
- upload;
- replace;
- rename/move;
- archive;
- safe delete;
- content publishing.

## Staff/editor role if Devil n Dove uses one

Potentially allow:

- metadata edits;
- gallery management;
- drafts;
- upload;

but restrict:

- permanent delete;
- R2 move/rename;
- legal/consent override;
- site-wide background/logo changes;
- publication of private project-derived assets.

Use the existing Devil n Dove auth/role model rather than creating a separate authorization system.

---

# 26. Audit Trail

Record meaningful media operations:

- upload;
- replace;
- metadata change;
- assignment;
- assignment removal;
- R2 move;
- R2 rename;
- archive;
- delete;
- restore;
- promote from Creative Project;
- consent/provenance change;
- publication state change.

Include:

- actor;
- timestamp;
- old value;
- new value;
- target/page/product;
- reason when destructive or sensitive.

---

# 27. Suggested Assignment Target Naming

Use readable labels in the UI but stable keys internally.

Examples:

```text
home.hero.desktop
home.hero.mobile
home.background
home.maker_story
home.review_proof.1

about.hero
about.workshop
about.mission

product.145.featured
product.145.gallery.1
product.145.gallery.2
product.145.process.1

collection.candles.hero
collection.soap.hero

landing.soap-oatmeal.hero
landing.soap-oatmeal.gallery.1
landing.soap-oatmeal.process.1

blog.88.featured
blog.88.inline.1

packaging.soap.artwork
packaging.soap.template_thumbnail

page.contact.background
page.faq.hero

before_after.coin_ring.1.before
before_after.coin_ring.1.after
```

The user should see friendly descriptions, not these raw keys.

---

# 28. Suggested Initial Admin Sections

Inside `/admin/media-content-studio/`:

1. **Media Library**
2. **Page Images**
3. **Products**
4. **Galleries**
5. **Artwork**
6. **Packaging / Labels**
7. **Landing Pages**
8. **Blog / Articles**
9. **Backgrounds & Banners**
10. **Reviews / Proof**
11. **Process / Technique / Evidence**
12. **Creative Project Approved Media**
13. **Content Blocks**
14. **Unused / Duplicate Media**
15. **Media Health**
16. **Audit / History**

The underlying media library should remain one system; these are filtered/admin views, not separate databases.

---

# 29. Rollout Plan

## Phase 1 — Inventory and protection

- Inventory current public image references.
- Register existing public images in managed media without changing their locations.
- Create assignment table.
- Preserve all currently correct image URLs.
- Add Media Studio browser/editor.
- Add R2 sync that does not auto-assign.

## Phase 2 — Core page targeting

Wire explicit targets for:

- Home
- About
- Product featured/gallery
- Category/collection pages
- major landing pages
- FAQ/support pages
- banners/backgrounds
- reviews/proof

## Phase 3 — Artwork & packaging

- Artwork library
- Rose/color variants
- Label/Packaging Studio picker
- Candle-top artwork
- engraving/CNC artwork
- template thumbnails

## Phase 4 — Galleries and stories

- General galleries
- Before/After
- Process
- Technique
- Evidence
- Materials
- Workshop
- Events

## Phase 5 — Complete text editability

- Extend content-block editor to every major public page.
- Make structured process/FAQ/reasons/care blocks editable.
- Preserve legal/static protected content separately.

## Phase 6 — CAIP / Creative Automation integration

- Promote reviewed derivatives to public library.
- Track provenance.
- Reuse approved media in content packages.

## Phase 7 — Media operations maturity

- dependency report;
- safe delete;
- version history;
- rollback;
- duplicate detection;
- dimension/health scoring;
- per-placement crop presets.

---

# 30. Acceptance Criteria

The feature is not complete until the following are true.

## Existing-media safety

- Syncing R2 does not alter current public image assignments.
- Editing alt text does not change placement.
- Uploading a similar filename does not replace an authored image.

## Editor usability

- Clicking a thumbnail always opens the editor immediately.
- The user can see where the selected image is used.
- Occupied destinations are visibly marked.
- The user can replace one specific placement without changing other uses.

## Galleries

- Galleries can add/remove/reorder images.
- Product galleries support multiple images.
- General gallery categories include more than Before/After.
- Before/After pairs publish only when complete.

## Artwork

- Packaging/label artwork can be selected from the managed library.
- Artwork variants are searchable and reusable.
- Website imagery and production/engraving artwork remain distinguishable by usage type.

## Text editability

- Major public pages can be revised without editing HTML source.
- Process, FAQ, reasons, warnings, care, and feature blocks are structured and editable.
- One-H1 and SEO constraints remain enforced.

## Safe deletion

- Assigned images cannot be deleted.
- Unassigned images can be removed through a server-side recheck.
- Deletion creates an audit record.

## Resource safety

- Public page views do not enumerate R2.
- Opening Media Studio does not enumerate R2.
- Only explicit Sync performs bounded R2 listing.
- Public manifests are bounded and compact.

## Privacy

- Private CAIP/Creative Project masters are never exposed by the public media API.
- Only reviewed/approved derivatives can be promoted into the public library.

---

# 31. Documentation Integration

This Markdown is an **implementation specification**, not a competing project roadmap.

When implementation begins:

- summarize current implementation state into Devil n Dove's primary AI/project handoff document;
- add remaining work to the primary roadmap / known-gaps authority;
- update schema/database documentation with every migration;
- update deployment/binding documentation for any R2 binding changes;
- keep historical implementation notes for audit, but avoid creating many overlapping “current” roadmap files.

The Media & Content Management Studio should become a permanent Devil n Dove capability and should be documented as part of the normal application architecture, not as an isolated experimental subsystem.

---

# 32. Final Product Direction

The end state should be simple for an owner:

> **I see an image on Devil n Dove. I can find it in Media Studio, click it, see where it is used, change its metadata, replace it, or choose another approved image for that exact spot.**

And for content:

> **I see a public text section. I can open the corresponding content editor, change its heading/body/process/FAQ/gallery, preview it, and publish it without touching source code.**

This should apply consistently across the Devil n Dove storefront, product/catalog system, galleries, landing pages, blog/content system, Packaging Studio, artwork library, Creative Automation Studio, and approved CAIP-derived public media—while preserving current correct content, auditability, privacy, SEO, accessibility, and Cloudflare resource limits.
