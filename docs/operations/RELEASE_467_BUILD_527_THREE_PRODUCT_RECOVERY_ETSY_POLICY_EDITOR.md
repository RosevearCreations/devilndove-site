# Devil n Dove — Release 467 Build 527

## Owner-facing change

- The default Product Editor has five sections: Basics, Pricing & Stock,
  Description, Media, Tags & SEO. Buyer Readiness, QA, technical Etsy/Meta and
  advanced fields are behind a clearly labelled optional disclosure. The saved
  Product ID, name, SKU, slug and Etsy Listing ID remain on the front screen.
- Save Product first verifies local D1. If Etsy is checked and the local save
  plus destination preference succeed, the same screen begins its live
  read-only draft/gallery checks and asks the owner before a single unpublished
  Etsy create/update. The exact saved primary Etsy claim decides whether to
  create or update. A failed/mismatched read blocks the provider POST; no
  automatic retry. A newly created Product redirects to its saved editor with
  a one-time review prompt; because gallery photos are linked to a saved
  Product, incomplete photos block the Etsy action until completed.
- Marketplace checked after a verified local save prepares a manual handoff.
  No Marketplace API POST is claimed or performed. All Product gallery photos
  are reused, subject to their original approval.
- The ordinary Create/Update panel hides unused destination controls and
  collapses advanced readbacks. The old recovery tools remain reachable.
- Stylesheets load in the document head to reduce flash-of-unstyled layout.

## Current Etsy policy

- Etsy Help lists up to **20 photos** per listing. All image package/readback
  gates now allow 20 complete originals, with no silent truncation to ten.
- Etsy Help allows **13 tags**, **20 characters per tag**, with letters,
  numbers, spaces, apostrophes or hyphens; tags cannot start with an apostrophe
  or hyphen. Client preview and server prepare checks agree. This does not
  invent a native Marketplace tag API.
- Sources verified 29 October 2026: [Etsy listing creation](https://help.etsy.com/hc/en-us/articles/115015628707-How-to-Create-a-Listing),
  [Etsy tags](https://help.etsy.com/hc/en-us/articles/360000336307-How-to-Use-Tags-to-Get-Found-in-Search),
  [Etsy Open API v3](https://developers.etsy.com/documentation/reference).

## Three-product recovery boundary

The owner has reported three unsuccessful soap Product saves but no verified
Product IDs, request receipts or authenticated D1 results were available to this
source change. Build 527 adds a three-record read-only outcome test fixture and
retains the live `Review saved server copy (GET only)` flow on each Product.
No real product record, stock value, Etsy draft, image or ID was modified by
release deployment. A completed Product save or image transfer must never be
claimed based on simulated fixtures. The actual three records remain pending
authenticated owner readback. An uncertain 5xx needs comparison before another
POST; an Etsy image exception remains HOLD unless exact live and local media
receipts reconcile.

## Integration boundary

QL-261 Comms Hub source integration remains DISCONNECTED / HOLD. The signer,
independent custodian, witness, public SPKI pin and original proof B have not
been authenticated. No integration gateway has Etsy/Marketplace write access.

## Verification

Run `node --test scripts/release467_build52{3,4,5,6,7}*.test.mjs` (or explicit
file names), `node --check` for modified JS, and source CI before promotion.
Production GREEN requires exact `main` SHA, Cloudflare Pages success, live
version marker and resource-integrity pass. Do not treat a passing deployment
as verification of the owner's three live products.

**Next Build 528:** Authenticated Three-Product Owner Readback, Genuine Etsy
Image/Tag Exception Closure & Single-Screen Acceptance Polish.
