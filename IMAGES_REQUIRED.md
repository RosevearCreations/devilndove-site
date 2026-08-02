# Devil n Dove — Images Required

**Audited build:** Build 229 — Packaging reference authority and explicit missing-image launch gate  
**Purpose:** Replace public-facing placeholder graphics with truthful, approved Devil n Dove photography while keeping internal workflow diagrams where they are useful.  
**Priority rule:** Replace public storefront/service placeholders first. Admin-only diagrams are not missing product photography and do not need replacement unless we want a different branded illustration.

**Build 229 Startup authority:** `missing_launch_images` is a separate **Critical** gate in `/admin/startup-readiness/`. This file is its required manifest. The gate remains Failed or Blocked until every launch-route/product requirement below has an approved final URL, rights record and phone/desktop proof. Missing, broken, generic fallback, planning-placeholder and duplicated-as-substitute images all count as unresolved.

**Internal placeholders:** `assets/creative-automation-master-process.svg` and `assets/prelaunch-operations-map.svg` are descriptive admin-only planning graphics. Keep them out of Product/Offer structured data, Open Graph images and launch-product galleries. Replace public launch placeholders only with owned/approved representative photography.

## Startup evidence fields

For every required public image, record: route or product ID; image role; current missing/placeholder/broken status; owner; rights/consent state; source/original; final public URL; descriptive alt text; phone result; desktop result; reviewer; review date. Do not mark the Critical gate Complete from a total count or folder upload alone.

---

## 1. Image preparation standard

Before uploading any replacement image:

1. Use an image we own or have documented permission to publish.
2. Remove customer names, addresses, receipts, licence plates, computer screens, paperwork, and unrelated faces.
3. Keep colours realistic. Do not use a “before/after” image that exaggerates the result.
4. Crop a master copy before compression.
5. Export **WebP** for the website. Keep the original photograph separately.
6. Use **sRGB** colour.
7. Aim for:
   - Public hero or wide image: **under 250 KB** where practical.
   - Standard content image: **under 180 KB**.
   - Product thumbnail: **under 120 KB**.
8. Do not enlarge a small photograph to meet the target size. Retake it instead.
9. Use descriptive alt text that explains what is actually visible. Do not stuff location or product keywords.
10. Check each replacement at approximately **360 px, 430 px, 768 px, 1024 px, and desktop width**.

### Recommended filename format

```text
subject-view-or-purpose-YYYYMM.webp
```

Examples:

```text
devil-n-dove-workshop-jewelry-process-202607.webp
coin-ring-close-up-hammered-edge-202607.webp
vintage-tool-condition-rust-and-handle-202607.webp
```

### Recommended storage folder

Place new static public images in:

```text
/assets/images/site/
```

Product-specific images should continue through the Catalog Media workflow rather than being manually hard-coded into HTML.

---

# 2. Highest-priority public images

These are the placeholders visitors can currently see and should be replaced first.

## A. Workshop process photograph

**Current placeholder**

```text
/assets/visual-placeholders/workshop-process.svg
```

**Used on**

```text
/index.html
/about/index.html
/socials/index.html
```

**Photograph needed**  
A truthful wide workshop scene showing one of us actively making, engraving, carving, sanding, polishing, assembling, or documenting a piece. The image should show the real Devil n Dove workspace without exposing private paperwork or unsafe clutter.

**Recommended master size**

```text
1800 × 1200 px — 3:2 landscape
```

**Website delivery size**

```text
1200 × 800 px WebP
```

**Suggested filename**

```text
/assets/images/site/devil-n-dove-workshop-process.webp
```

**Suggested alt text examples**

```text
Devil n Dove workshop table during a handmade jewelry project
```

or, when more specific:

```text
Polishing a handmade metal ring at the Devil n Dove workshop bench
```

**How to update**

Search these files for:

```html
/assets/visual-placeholders/workshop-process.svg
```

Replace the `src` with:

```html
/assets/images/site/devil-n-dove-workshop-process.webp
```

Update each `alt` attribute to match what is visible on that page. The homepage, About page, and Socials page can use different photographs when available; one shared image is acceptable temporarily.

---

## B. Homepage workshop/category discovery image

**Current placeholder**

```text
/assets/visual-placeholders/workshop-discovery.svg
```

**Used on**

```text
/index.html
/workshop-journal/index.html
```

**Photograph needed**  
A wide, tidy arrangement showing several real creative paths—such as jewelry, engraving, resin/clay work, a vintage find, a tool, and a sketch or project notebook. It should feel like a genuine “choose what to explore” image, not a stock photograph.

**Recommended master size**

```text
1800 × 1080 px — 5:3 landscape
```

**Website delivery size**

```text
1200 × 720 px WebP
```

**Suggested filename**

```text
/assets/images/site/workshop-creative-paths.webp
```

**How to update**

Search for:

```html
/assets/visual-placeholders/workshop-discovery.svg
```

Replace the `src` or CSS image URL with the new WebP. Keep the homepage version decorative with `alt=""` when nearby text already explains the categories. On the Workshop Journal page, use descriptive alt text only when the image contributes information.

---

## C. Representative product collection photograph

**Current placeholder**

```text
/assets/visual-placeholders/product-detail.svg
```

**Used directly or as a fallback on**

```text
/collections/index.html
/shop/index.html
/public/js/home-featured-products.js
```

It is also referenced by internal replacement-planning tools.

**Photograph needed**  
A clean group image of several actual available or representative Devil n Dove items. Do not mix handmade and vintage items in a way that makes their origin unclear.

**Recommended master size**

```text
1800 × 1200 px — 3:2 landscape
```

**Website delivery size**

```text
1200 × 800 px WebP
```

**Suggested filenames**

```text
/assets/images/site/handmade-product-collection.webp
/assets/images/site/vintage-collection-preview.webp
```

**How to update static page sections**

Replace direct references to:

```html
/assets/visual-placeholders/product-detail.svg
```

with the appropriate real collection image.

**How to remove dynamic product fallbacks**

Do not merely replace the fallback graphic globally. For each featured or shop product:

1. Open `/admin/catalog/`.
2. Load the product.
3. Open its Catalog Media workspace.
4. Upload/select a real product image.
5. Assign the **primary/featured** role.
6. Add accurate alt text.
7. Confirm public-use/consent status.
8. Use **Sync resolved featured image** when the product has approved media but the Featured Image URL is blank.

The fallback may remain in code for genuinely incomplete drafts, but published products should never depend on it.

---

## D. Before-and-after or process proof

**Current placeholder**

```text
/assets/visual-placeholders/before-after.svg
```

**Used on**

```text
/gallery/index.html
/custom-gifts-southern-ontario/index.html
/events/index.html
```

**Photographs needed**

Use separate, truthful images for each page:

1. **Gallery:** a genuine before-and-after pair from one project.
2. **Custom gifts:** concept/material or unfinished piece beside the completed custom piece.
3. **Events:** table setup before an event beside the completed display, or an event display progression—not an unrelated product transformation.

**Recommended master size**

```text
1800 × 1200 px — 3:2 landscape
```

**Website delivery size**

```text
1200 × 800 px WebP
```

A side-by-side composite is acceptable when both images are owned by us and clearly labelled.

**Suggested filenames**

```text
/assets/images/site/project-before-after.webp
/assets/images/site/custom-gift-process-before-after.webp
/assets/images/site/event-display-before-after.webp
```

**How to update**

Replace each page’s reference separately rather than replacing the shared SVG with one generic image. Update the section heading and paragraph so they no longer say “placeholder.”

For the Gallery page, the preferred long-term solution is to approve a Before/After record in the existing Gallery/Media workflow so the dynamic approved-proof section appears. Once that works, remove or hide the static placeholder section.

---

## E. Handmade jewelry macro photograph

**Current placeholder**

```text
/assets/visual-placeholders/jewelry-macro.svg
```

**Used on**

```text
/handmade-jewelry-ontario/index.html
/polymer-clay-earrings-ontario/index.html
```

**Photographs needed**

- One very close, sharply focused jewelry detail showing finish, texture, connection points, edges, or stone/material detail.
- A separate polymer-clay earring close-up is preferred for the earring page.

**Recommended master size**

```text
1600 × 1200 px — 4:3 landscape
```

or

```text
1600 × 2000 px — 4:5 portrait
```

**Website delivery size**

```text
1200 × 900 px or 1200 × 1500 px WebP
```

**Suggested filenames**

```text
/assets/images/site/handmade-jewelry-macro-detail.webp
/assets/images/site/polymer-clay-earring-macro.webp
```

**How to update**

Replace the placeholder reference separately on both pages and change the placeholder heading/copy to a real descriptive heading such as “Close-up details” or “Colour and finish up close.”

---

## F. Laser engraving proof photograph

**Current placeholder**

```text
/assets/visual-placeholders/engraving-proof.svg
```

**Used on**

```text
/laser-engraving-ontario/index.html
/tools/index.html
```

**Photographs needed**

1. **Service page:** a finished engraving with a clear, readable result and enough surrounding material to show what was engraved.
2. **Tools page:** the engraver in use, a material test grid, or an engraving test piece beside the machine.

Do not show copyrighted logos or customer personal information without permission.

**Recommended master size**

```text
1800 × 1200 px — 3:2 landscape
```

**Website delivery size**

```text
1200 × 800 px WebP
```

**Suggested filenames**

```text
/assets/images/site/laser-engraving-finished-example.webp
/assets/images/site/laser-engraver-material-test.webp
```

**How to update**

Replace the shared placeholder separately on both pages. Remove text that calls it a placeholder and describe the real material and result.

---

## G. Candle colour/process photograph

**Current placeholder**

```text
/assets/visual-placeholders/candle-colour.svg
```

**Used on**

```text
/custom-candle-making-ontario/index.html
```

**Photograph needed**  
A real candle colour, mould, raised-flower detail, wax-pouring step, or finished candle grouping. Avoid flame imagery unless the candle is being used safely and supervised.

**Recommended master size**

```text
1800 × 1200 px — 3:2 landscape
```

**Website delivery size**

```text
1200 × 800 px WebP
```

**Suggested filename**

```text
/assets/images/site/custom-candle-colour-and-detail.webp
```

**How to update**

Replace the `src` in `/custom-candle-making-ontario/index.html`, update the alt text, and remove the placeholder explanation. Do not add therapeutic, medical, or aromatherapy claims that are not substantiated.

---

## H. Soap texture/process photograph

**Current placeholder**

```text
/assets/visual-placeholders/soap-texture.svg
```

**Used on**

```text
/custom-soap-making-ontario/index.html
```

**Photograph needed**  
A close-up of an actual soap bar, texture, cut surface, moulding step, colour swirl, or clearly identified ingredient arrangement.

**Recommended master size**

```text
1800 × 1200 px — 3:2 landscape
```

**Website delivery size**

```text
1200 × 800 px WebP
```

**Suggested filename**

```text
/assets/images/site/custom-soap-texture-and-process.webp
```

**How to update**

Replace the `src` in `/custom-soap-making-ontario/index.html`, update the heading/copy, and use factual ingredient/allergen wording. Do not imply that soap treats medical conditions.

---

## I. Vintage condition photograph

**Current placeholder**

```text
/assets/visual-placeholders/vintage-condition.svg
```

**Used on**

```text
/vintage-finds-ontario/index.html
/toolshed/index.html
```

**Photographs needed**

1. **Vintage page:** an honest close-up showing real age, wear, finish, markings, chips, scratches, patina, maker mark, or construction detail.
2. **Toolshed:** a real old tool showing handle, metal condition, identifying mark, or restoration state.

**Recommended master size**

```text
1800 × 1200 px — 3:2 landscape
```

**Website delivery size**

```text
1200 × 800 px WebP
```

**Suggested filenames**

```text
/assets/images/site/vintage-item-condition-detail.webp
/assets/images/site/vintage-tool-condition-detail.webp
```

**How to update**

Replace separately on each page. The alt text should identify visible condition rather than claim an unverified date, maker, or rarity.

---

## J. Workshop-made gift process photograph

**Current placeholder**

```text
/assets/visual-placeholders/product-process.svg
```

**Used on**

```text
/workshop-made-gifts-ontario/index.html
/creations/index.html
```

It is also used as a product-specific proof fallback on `/shop/product/`.

**Photographs needed**

- For the workshop-gifts page: a real gift during assembly, engraving, finishing, packaging, or personalization.
- For Creations: a broad process photo that fits the displayed creation category.

**Recommended master size**

```text
1600 × 1050 px — approximately 32:21
```

**Website delivery size**

```text
1280 × 840 px WebP
```

**Suggested filenames**

```text
/assets/images/site/workshop-gift-making-process.webp
/assets/images/site/creation-in-progress.webp
```

**How to update static pages**

Replace references separately and remove placeholder wording.

**How to update product-specific Process images**

See Section 3. Do not use one generic process image for every product.

---

## K. Product material detail photograph

**Current placeholder**

```text
/assets/visual-placeholders/product-material.svg
```

**Used on**

```text
/supplies/index.html
/shop/product/index.html
```

**Photographs needed**

- Supplies page: an organized, real collection of frequently used materials or one clearly labelled material close-up.
- Product page: a product-specific close-up of the actual material, texture, finish, hallmark, grain, colour mix, or construction.

**Recommended master size**

```text
1600 × 1050 px
```

**Website delivery size**

```text
1280 × 840 px WebP
```

**How to update**

Use a static image for `/supplies/`. Product-page material images should eventually come from assigned Catalog Media roles rather than a single hard-coded file.

---

## L. Product scale photograph

**Current placeholder**

```text
/assets/visual-placeholders/product-scale.svg
```

**Used on**

```text
/pickup/index.html
/shop/product/index.html
```

**Photographs needed**

- Product-specific item beside a ruler, coin, hand, display stand, or other familiar reference.
- Pickup page may use a packaged item beside a hand or a safe handoff/pickup box to communicate scale and collection readiness.

**Recommended master size**

```text
1600 × 1050 px
```

**Website delivery size**

```text
1280 × 840 px WebP
```

**How to update**

Replace the Pickup page static image directly. Product scale images should be assigned per product through Catalog Media.

---

## M. Product care/packaging photograph

**Current placeholder**

```text
/assets/visual-placeholders/product-care.svg
```

**Used on**

```text
/gift-cards/index.html
/shop/product/index.html
```

**Photographs needed**

- Gift cards: real printed/digital gift-card presentation, envelope, branded insert, or gift wrapping.
- Product page: product-specific storage, cleaning, packaging, handling, or care setup.

**Recommended master size**

```text
1600 × 1050 px
```

**Website delivery size**

```text
1280 × 840 px WebP
```

**How to update**

Replace the gift-card packaging section directly. Product care images should eventually be assigned by media role per product.

---

## N. Main gift-card artwork

**Current placeholder**

```text
/assets/gift-card-placeholder.svg
```

**Used on**

```text
/gift-cards/index.html
```

**Image needed**  
A branded Devil n Dove gift-card presentation. This may be a photograph of a printed card and envelope or a polished graphic mock-up using our own logo and branding. Clearly indicate whether the card is digital, printed, or both.

**Required size already stated by the page**

```text
1600 × 1000 px
```

**Website delivery format**

```text
WebP, ideally under 220 KB
```

**Suggested filename**

```text
/assets/images/site/devil-n-dove-gift-card.webp
```

**How to update**

In `/gift-cards/index.html`, replace:

```html
/assets/gift-card-placeholder.svg
```

with the real WebP and remove the sentence that says it is a placeholder.

---

## O. Workshop Journal hero and story image

**Current placeholder**

```text
/assets/visual-placeholders/workshop-journal.svg
```

**Used on**

```text
/workshop-journal/index.html
/workshop-journal/story/index.html
```

**Photographs needed**

- Journal landing page: a wide real workshop storytelling image—camera, project notebook, workbench, tools, and current project.
- Story page fallback: ideally use the story’s own approved lead image. Keep the shared fallback only when a story has no media yet.

**Recommended master size**

```text
1800 × 1080 px — 5:3 landscape
```

**Website delivery size**

```text
1200 × 720 px WebP
```

**Suggested filename**

```text
/assets/images/site/workshop-journal-storytelling.webp
```

**How to update**

Replace the landing-page static reference. For individual journal stories, assign a real approved lead image through the story/content workflow rather than hard-coding one global photo.

---

# 3. Product-specific images that must be added through Catalog Media

The following should **not** be solved by replacing one shared placeholder file. Every active product needs its own real imagery.

## Product primary photograph

**Current fallbacks**

```text
/assets/visual-placeholders/product-photo-coming-soon.svg
/assets/visual-placeholders/product-detail.svg
/assets/product-media-placeholder.svg
/assets/release-preflight-placeholder.svg
```

**Seen through**

```text
/shop.js
/public/js/home-featured-products.js
/admin/catalog/
/admin/catalog-media/
/admin/release-preflight/
```

**Required per active product**

```text
Primary/front view: 1600 × 1600 px square
```

For tall products, also capture:

```text
4:5 portrait: 1600 × 2000 px
```

**Minimum recommended set per handmade product**

1. Primary/front view — `1600 × 1600`
2. Alternate angle — `1600 × 1600`
3. Close detail — `1600 × 1600`
4. Scale/reference — `1600 × 1600` or `1600 × 2000`
5. Process image — `1600 × 1200`
6. Materials/texture — `1600 × 1200`
7. Back/underside/closure — `1600 × 1600`
8. Packaging/care — `1600 × 1200`

**Minimum recommended set per vintage/collectible product**

1. Full front view
2. Full back view
3. Side/profile
4. Maker mark/signature/label
5. Condition flaw close-up
6. Construction/material detail
7. Scale image
8. Any included parts/accessories

**How to update each product**

1. Open `/admin/catalog/`.
2. Search by Product ID, SKU, name, slug, or status.
3. Load the product.
4. Open `/admin/catalog-media/?product_id=PRODUCT_ID#product-media-workflow`.
5. Upload or link the real media.
6. Set image roles: primary, alternate, detail, scale, process, materials, care, condition, or packaging as applicable.
7. Add descriptive alt text.
8. Confirm source rights and public-use consent.
9. Approve the media.
10. Return to Catalog and use **Sync resolved featured image** if the Featured Image URL remains blank.
11. Open `/admin/release-preflight/?product_id=PRODUCT_ID` and verify the real image is being used.

**Important**  
Draft or archived products may retain a neutral fallback. Active, approved, and published products should not.

---

# 4. Other public placeholders and special cases

## Events page image

The Events page currently uses the generic Before/After placeholder. Replace it with a real event-table, market display, setup, packaging, signage, or booth image rather than a product transformation image.

Recommended:

```text
1600 × 1067 px master
1200 × 800 px WebP
```

## Pickup page image

The Pickup page currently uses the Product Scale placeholder. Replace it with a real, privacy-safe image of a packaged order, pickup container, or handoff-ready item. Do not show a home address, vehicle plate, customer, or identifying house details.

Recommended:

```text
1600 × 1050 px master
1280 × 840 px WebP
```

## Tools and Toolshed images

The Tools page currently reuses the engraving placeholder, while Toolshed reuses the vintage-condition placeholder. Prefer real photographs of the actual equipment and old tools.

Recommended per tool:

```text
Primary: 1600 × 1200 px
Identification/detail: 1600 × 1200 px
Condition/safety: 1600 × 1200 px
```

Use the existing Tools/Inventory interfaces for item-specific photographs where supported. Replace static page placeholders with representative workshop photos.

## Supplies page image

Replace the generic material placeholder with actual commonly used supplies arranged safely and clearly. Keep chemical labels readable only when appropriate, and do not show unsafe storage as recommended practice.

Recommended:

```text
1600 × 1050 px master
1280 × 840 px WebP
```

---

# 5. Admin-only illustrations — replacement is optional

These files are workflow diagrams or neutral fallbacks inside protected admin pages. They are **not missing public product photographs** and can remain in place:

```text
/assets/caip-package-placeholder.svg
/assets/caip-planning-placeholder.svg
/assets/creative-intelligence-integration-placeholder.svg
/assets/creative-process-engine-placeholder.svg
/assets/creator-flexible-entry-paths-placeholder.svg
/assets/inventory-operations-placeholder.svg
/assets/release-preflight-placeholder.svg
/assets/social-platform-preflight-placeholder.svg
/assets/social-publishing-placeholder.svg
/assets/visual-placeholders/creative-asset-intelligence.svg
/assets/visual-placeholders/mobile-upload-safety.svg
/assets/visual-placeholders/product-media-roles.svg
```

### Where they appear

```text
/admin/creative-process/
/admin/inventory-operations/
/admin/social-publishing/
/admin/creative-assets/
/admin/catalog-media/
/admin/release-preflight/
```

### Recommendation

Keep them until we have a reason to replace them with custom branded diagrams. Do not replace them with random workshop photography; the diagrams explain workflows and are intentionally hidden from public product/SEO use.

---

# 6. Suggested photography sessions

We can complete most of this list in a small number of organized sessions.

## Session 1 — Workshop and brand

Capture:

- Wide workshop process
- Workshop category/discovery flat lay
- Workshop Journal scene
- Social/workshop proof image
- Tools in use
- Supplies/material arrangement

## Session 2 — Jewelry and small products

Capture:

- Jewelry macro
- Polymer-clay close-up
- Product primary views
- Scale views
- Materials/details
- Closures/backs
- Packaging/care

## Session 3 — Engraving, candle, and soap

Capture:

- Engraving machine/process
- Finished engraving proof
- Candle colour/process
- Candle detail
- Soap texture/process
- Finished soap detail

## Session 4 — Vintage and tools

Capture:

- Vintage overview
- Maker marks
- Flaws and wear
- Old-tool condition
- Scale and construction details

## Session 5 — Process proof and gifting

Capture:

- Before/after project
- Custom gift stages
- Gift-card artwork/presentation
- Gift wrapping/packaging
- Event or market setup
- Pickup-ready package

---

# 7. Replacement checklist by file

Use this as the working completion list.

## Public static replacements

- [ ] `/index.html` — workshop discovery image
- [ ] `/index.html` — workshop process image
- [ ] `/about/index.html` — real workshop/honesty image
- [ ] `/socials/index.html` — real social/workshop proof image
- [ ] `/collections/index.html` — real collection image
- [ ] `/shop/index.html` — real shop collection image
- [ ] `/gallery/index.html` — approved before/after proof
- [ ] `/custom-gifts-southern-ontario/index.html` — custom-gift process image
- [ ] `/events/index.html` — real event/setup image
- [ ] `/handmade-jewelry-ontario/index.html` — jewelry macro
- [ ] `/polymer-clay-earrings-ontario/index.html` — earring macro
- [ ] `/laser-engraving-ontario/index.html` — engraving proof
- [ ] `/tools/index.html` — real tool/engraver image
- [ ] `/custom-candle-making-ontario/index.html` — candle image
- [ ] `/custom-soap-making-ontario/index.html` — soap image
- [ ] `/vintage-finds-ontario/index.html` — vintage-condition image
- [ ] `/toolshed/index.html` — old-tool condition image
- [ ] `/workshop-made-gifts-ontario/index.html` — gift-making process
- [ ] `/creations/index.html` — creation process image
- [ ] `/supplies/index.html` — materials/supplies image
- [ ] `/pickup/index.html` — pickup-ready/scale image
- [ ] `/gift-cards/index.html` — main gift-card artwork
- [ ] `/gift-cards/index.html` — gift-card packaging image
- [ ] `/workshop-journal/index.html` — journal hero image
- [ ] `/workshop-journal/story/index.html` — story-specific lead image fallback strategy

## Dynamic catalog work

- [ ] Every Active product has a real primary image
- [ ] Every Approved product has a real primary image
- [ ] Every Published product has a real primary image
- [ ] Featured-image URL is synced for products that already have approved media
- [ ] Product alt text describes the visible image
- [ ] Product media roles are assigned
- [ ] Public consent/rights status is confirmed
- [ ] Vintage listings include condition and maker-mark photos
- [ ] Handmade listings include detail and scale photos
- [ ] Product process/material/care slots use product-specific images where available

---

# 8. How to verify that no public placeholder remains

After replacing images, search the project for:

```text
/assets/visual-placeholders/
/assets/gift-card-placeholder.svg
/assets/product-media-placeholder.svg
```

Public HTML and public-facing JavaScript should contain only intentional fallbacks. Admin pages may still reference workflow illustrations.

Then test:

1. Homepage
2. Shop
3. Collections
4. Gallery
5. Each Ontario service/landing page
6. Gift Cards
7. Workshop Journal
8. A handmade product page
9. A vintage product page
10. A product with no image, to confirm the fallback remains neutral and does not look like a real product

Use browser developer tools to confirm:

- image requests return HTTP 200;
- no mixed-content HTTP URLs are used;
- displayed dimensions do not cause layout shift;
- images are not stretched;
- mobile pages do not overflow;
- alt text is accurate;
- no placeholder is used in Open Graph or product structured data.

---

# 9. Recommended order of completion

1. Active/published product primary images
2. Homepage workshop and discovery images
3. Shop and Collections images
4. Main service pages: jewelry, engraving, candle, soap, vintage
5. Gift-card artwork and packaging
6. Gallery and custom-gift before/after proof
7. Workshop Journal imagery
8. Tools, Supplies, Pickup, Events, and supporting pages
9. Product process/material/scale/care role images
10. Optional replacement or redesign of admin-only diagrams


## Build 221 Packaging Studio visuals
- `assets/packaging-studio-placeholder.svg` — admin hero explanation; implemented as a safe vector placeholder.
- `assets/soap-ribbon-scalloped-reference.svg` — editable-layout reference derived from the supplied soap ribbon; implemented as SVG, not a photograph.
- Future approved photo: a straight, well-lit scan or overhead photograph of the printed ribbon beside a ruler. Recommended capture at 300 ppi or higher with the full cut edge visible. Keep it internal until packaging text, formula, rights and regulatory review are complete.

## Build 222 — Soap Label Studio visual evidence

### Included reusable assets
- `assets/packaging/soap/reference/glacial-purple-aloe-soap-approved-reference.png` — approved structure/reference only; never use it as the final product-specific legal label.
- `assets/packaging/soap/roses/purple-rose.svg`
- `assets/packaging/soap/roses/green-rose.svg`
- `assets/packaging/soap/roses/oatmeal-rose.svg`

### Still required for each launch soap
1. **Physical print-proof photograph** — full ribbon printed at 100% beside a ruler; clear enough to confirm total width, band height and front oval.
2. **Wrapped front photograph** — label fitted to the actual soap with the front oval centred.
3. **Wrapped back photograph** — rear seal, ingredients/claims and overlap visible.
4. **Ingredient close-up** — legibility proof at normal viewing distance.
5. **Final product gallery** — featured image plus supporting views; packaging proof does not replace public product photography.

Recommended proof image: at least 1600 px on the long edge, sRGB JPG/WebP for review, with the original retained. Add the proof URL to the Soap Label Studio Print Test tab. Do not publish proof images automatically.

## Build 227 — unified packaging and client-document planning assets

The following new SVGs are admin-only planning placeholders with descriptive alternative text. They are not real products and must not be used in public product galleries, Open Graph images, merchant structured data, social posts, or packaging approval evidence:

- `assets/packaging/placeholders/candle-label-package.svg`
- `assets/packaging/placeholders/jewelry-card-package.svg`
- `assets/packaging/placeholders/package-insert-system.svg`
- `assets/client-document-workflow-placeholder.svg`

Replace each packaging placeholder with a privacy-safe photo only after the actual container/card/insert is physically produced and approved. Capture straight-on front, back/required information, scale/dimensions, closure/finish, barcode/QR destination and the complete packed-product context. Keep a neutral placeholder when no real item exists; do not imply that a concept is inventory.
