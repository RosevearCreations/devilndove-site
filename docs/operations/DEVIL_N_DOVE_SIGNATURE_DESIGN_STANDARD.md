# Devil n Dove — Approved Signature Website Design Standard (2026-10-19)

The owner's October 19 approved visual mockups are the preferred **look and feel for all future Devil n Dove website and Admin development**.

## Fixed visual vocabulary
- Deep midnight navy/charcoal backgrounds, clear white headings, muted slate body text, rich violet/purple active states, subtle copper/gold *only where meaningful*.
- Reuse the original Devil n Dove logo, cinematic workshop/laser/engraved materials photographs, image-led browsing cards, rounded thin-bordered dark panels, consistent button heights and quiet hover highlights.
- Do not revert to old pale/pink cards, overcrowded or concatenated navigation, huge 1-column desktop inventory rows, stark placeholder banners or bright white-on-white controls.
- Standard desktop product/listing cards: **three columns** in full-width catalog areas; smaller screens progressively use two then one column. Consistent 4:3 photo region, trimmed but accessible names and short facts, price only if a **real sale listing**, CTA correct for the underlying destination, and readable focus outlines.
- Navigation must remain compact and accessible; public: Home, Shop, Custom Work, Tools, Supplies, Watch us try, About, Cart (where relevant). Admin: two-row or grouped wrap-safe module navigation with visible logout and current page indication.
- Responsive, touch-friendly and keyboard/screen-reader friendly. No menu overlap, blank placeholder panels or text overflow.

## Artwork and product truth
The visual mockups contained **illustrative example products and composite art**. They are not a new inventory source, proof of item availability or source of product pricing. Current release uses actual tracked visual files in `assets/images/site` as category/hero artwork, and the live product's existing approved media, name, price, stock and availability for real commerce cards. Never substitute imaginary watch/keychain/wooden-board listings or mockup values as purchasable offers.

Preferred tracked examples:
- Category/intent: `devil-n-dove-gift-card.webp`, `handmade-jewelry-macro-detail.webp`, `pickup-ready-order.webp`, `custom-gift-process-before-after.webp`, `vintage-collection-preview.webp`, `laser-engraving-finished-example.webp`, `workshop-creative-paths.webp`
- Custom work: `laser-engraver-material-test.webp` plus public gallery photos with appropriate consent
- Tools & supplies: current public R2 item imagery; do not expose wholesale purchase notes, order references, private quantities or internal costs.

For an **exact image-for-image reproduction of a concept mockup**, first export/crop and individually review suitable original artworks, obtain publishing approval, commit optimized web image assets, and replace the tracked placeholders without corrupting live product images.

## Safe rollout and page audit
Shared CSS from `css/styles.css` is inherited by a large legacy HTML portfolio (204 HTML files at the start of this visual release). Structural tests scan all page sources and verify critical UI hooks, actual image asset paths and privacy-safe links. This is **not equivalent to a manual screenshot comparison of all pages**.

Before claiming a page is fully visually accepted, compare desktop (1600px), tablet (900px), mobile (390px), light/dark accessibility constraints, keyboard, navigation, API errors, real image and purchase paths. Never bypass the Design-System CSS specificity budget or the exact-sha development/production deployment gates.

Future work should extend this signature standard, not invent unrelated colour/spacing systems.
