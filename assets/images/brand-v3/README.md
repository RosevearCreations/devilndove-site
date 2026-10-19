# Devil n Dove — brand-v3 drop-in artwork folder

This folder is **intentionally empty except for this README** until the owner uploads the 50 actual WebP files. The website's safe image loader is `/public/js/brand-v3-auto.js`, deployed with the 14 customer pages that use the images.

## Installation (GitHub, not a local desktop directory)
1. Download the **complete 1–50 brand kit** from the ChatGPT conversation. Open the ZIP and extract its `assets/images/brand-v3/` folder.
2. Upload all .webp files **inside this exact repository folder**, retaining names exactly; do **not** add an extra nested `assets/images/brand-v3/assets/images/brand-v3/` directory.
3. Commit images on `dev`; verify the CI checks, then selectively promote **all WebP assets** to `main` and verify Cloudflare Production deploy & live resource integrity. Adding local Windows files without a GitHub commit does not update the site.
4. Refresh the page. Each image's URL is `https://devilndove.com/assets/images/brand-v3/<filename>`; when a mapped image loads, it appears on the matching route. Unavailable files leave the existing photos unchanged.

**Critical naming exception:** numbers 21–30 use the unnumbered legacy Set 3 filenames exactly as shipped in the ZIP: `brand-feature-promo.webp`, `jewellery-collection-promo.webp`, `custom-work-promo.webp`, `workshop-tools-promo.webp`, `materials-supplies-promo.webp`, `brand-story-promo.webp`, `contact-help-promo.webp`, `one-of-kind-promo.webp`, `vintage-finds-promo.webp`, `laser-engraved-promo.webp`. All other files use their numbered filenames.

The page map installs the approved hero/banner illustrations in Home (01), Shop (02), Custom Request (03), Tools (04), Supplies (05), About (06), Contact (07), Collections (31), Pickup (13), Gift Cards (19), Saved (17), Cart (18), Workshop Journal (16) and Gallery (41). Shop-by-intent cards 1–7 use images 12, 08, 13, 14, 09, 10 and 15. The remaining image IDs activate as supplementary promotional card illustrations on the matching pages only when available.

**Artwork is illustrative.** It must not replace actual Product photographs or imply the illustrated objects are sold, custom work has already been accepted, gift cards are enabled, orders have shipped, or a "best seller" ranking is established. Existing product data, stock, prices, payment state, authorizations and U.S. shipping suspension remain authoritative. The small card assets (especially Sets 3–5) should not be enlarged into full-width high-resolution backgrounds.
