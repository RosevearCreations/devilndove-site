# Build 194 Owner Testing Guide — Storefront Discovery, Product Facts & Media Roles

**Purpose:** Verify the Build 194 storefront improvements after the D1 migration and Pages deployment.

## Before starting

1. Deploy the Build 194 branch/zip to Cloudflare Pages.
2. Run this D1 migration after Build 193:

```text
database_build194_storefront_discovery_product_facts_media_roles.sql
```

3. Confirm the live site is loading the new build by opening the homepage in a private/incognito window.
4. Do not enter customer names, payment details, or private order photos during this test.

---

## Test 1 — Homepage clarity on phone and desktop

**Open:** `/`

1. Open the homepage on a phone and a desktop/laptop.
2. Without scrolling, check whether the hero explains that Devil n Dove offers handmade mixed-media creations, gifts, and vintage finds.
3. Check the four primary choices:
   - Shop available creations
   - Read workshop notes
   - Browse vintage & finds
   - Request a custom piece
4. Scroll to **What we make, find, and experiment with**.
5. Open two category links and confirm each reaches a useful shop or collection result.
6. Scroll to **Made in our workshop, one step at a time** and confirm no content overlaps at narrow widths.
7. Confirm the workshop discovery visual is decorative only and does not need a spoken alt description.

**Pass:** Clear first impression, working links, no clipped cards, and exactly one page H1.

---

## Test 2 — Featured creations fallback

**Open:** `/`

1. Find the Featured creations area below the workshop process strip.
2. Confirm approved active products load as cards if products exist.
3. Click one card and confirm it opens the expected product detail page.
4. Temporarily test with no approved active products only if safe in a test environment.
5. Confirm the empty state is helpful and points to `/shop/` instead of showing an error.

**Pass:** The homepage remains useful whether featured products exist or not.

---

## Test 3 — Shop quick filters and recently viewed items

**Open:** `/shop/`

1. Click **Handmade**. Confirm the shop filter changes to handmade products.
2. Click **Vintage & finds**. Confirm the filter changes to vintage products.
3. Click **Under $25**. Confirm the maximum price field becomes `2500` cents and results stay at or below CAD $25.00.
4. Click **Gift ideas**. Confirm the shop searches for gift-related listings.
5. Open one product detail page, then return to `/shop/`.
6. Confirm the recently viewed card appears only on this browser/device.
7. Open another browser or private window and confirm recently viewed items do not follow you there.

**Pass:** Filters remain understandable, normal filters stay available, and recently viewed uses local browser storage only.

---

## Test 4 — Product quick facts and video safety

**Open:** `/admin/catalog-media/`

1. Select a safe test product.
2. Open **Listing facts for buyer questions**.
3. Enter truthful values for one product, such as:
   - Best for
   - Materials
   - Finish
   - Dimensions
   - Care summary
   - Handmade variation note
   - Availability note
   - Shipping/pickup note
4. Leave the status as draft and save.
5. Open the product page. Confirm the draft facts are **not** public.
6. Change the profile status to `approved` or `published`, save, and refresh the product page.
7. Confirm the facts card appears and uses the exact saved text.
8. Add a safe HTTPS video URL only if we own or control the video and it is suitable for public display.
9. Confirm a non-HTTPS URL is rejected or hidden.

**Pass:** Only approved listing facts show publicly; draft/internal notes do not leak to shoppers.

---

## Test 5 — Product media role score

**Open:** `/admin/catalog-media/`

1. Select the same test product.
2. Open **Buyer-question media role coverage**.
3. Assign available photos to appropriate roles:
   - Main product photo
   - Close-up/detail
   - Scale reference
   - Back/side
   - Process
   - Packaging
   - Social/share
4. Save the assignments.
5. Confirm the score increases only for assigned roles.
6. Refresh the product page.
7. Confirm scale/process/care proof modules use assigned real images when available; otherwise the professional placeholders remain.
8. Do not assign a customer photo unless the public-use permission is approved.

**Pass:** The score reflects actual photo coverage, and unapproved/absent photos do not appear publicly.

---

## Test 6 — Workshop journal pages

Open these pages:

```text
/workshop-journal/
/workshop-journal/polymer-clay-earring-care/
/workshop-journal/coin-and-spoon-ring-care/
/workshop-journal/handmade-vintage-sourced-guide/
```

1. Confirm every page has one clear H1.
2. Confirm links work between pages and back to the shop.
3. Read the text and remove or revise any care guidance that does not fit your real products.
4. Confirm the journal placeholder visuals are decorative and do not crowd the reading text on a phone.
5. Replace a placeholder only after you have an approved real workshop or product image plus final alt text.

**Pass:** Journal pages are helpful, accurate, readable, and do not make unsupported product claims.

---

## Test 7 — SEO checks after publishing

1. Open page source for the homepage, shop, one product page, and one workshop journal page.
2. Confirm each has:
   - one `<h1>`
   - a descriptive `<title>`
   - a meta description
   - a canonical URL
3. Confirm meaningful product images have descriptive alt text.
4. Confirm decorative placeholder visuals have empty `alt=""` and/or `aria-hidden="true"`.
5. In `/admin/deployment-preflight/`, save a fresh run and attach any necessary notes.

**Pass:** No multiple-H1 issue, no missing titles/meta on the pages checked, and image descriptions match what customers can see.

---

## If a test fails

1. Take a screenshot showing the issue.
2. Record the exact page URL, phone/desktop type, browser, and what you expected.
3. Add it to `/admin/deployment-preflight/` or the relevant Command Center evidence row.
4. Do not publish a product with inaccurate dimensions, material claims, care instructions, or unapproved customer photos.
