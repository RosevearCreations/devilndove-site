# Devil n Dove — Brand V3 Full Customer-Site Audit, 2026-10-19

## Scope and evidence
- Inspected all **70** non-Admin public HTML routes in the repository by running `scripts/brand_v3_frontsite_audit.mjs` in GitHub Actions.
- Base stylesheet now present in **70/70** HTML files. The one original exception, `toolshed/duplicates/index.html`, was corrected.
- Cloudflare middleware injects shared Brand V3 CSS into normal public responses and separately into the faster Shop/Collections response path.
- **29** default Media Studio placeholder slots appeared across **22** public routes. Their **exact slot IDs** and real asset file existence are now checked by `scripts/brand_v3_frontsite_recovery.test.mjs`.
- Verified **0** missing static image references and **0** `<img>` tags lacking `alt` in the static public HTML.
- **14** core public routes already have explicit static `brand-v3-auto.js` image mapping tags. The remaining pages receive the shared theme and safe placeholder recovery through middleware, rather than incorrectly claiming that every page has its own bespoke artwork.

## Frontsite improvements on dev
- `public/js/brand-v3-frontsite-recovery.js` maps default placeholders to approved `assets/images/brand-v3/` imagery.
- **Owner-selected Media Studio images win**: replacement occurs only when the image still has `data-media-placeholder="1"` and the original source is a default `/assets/placeholders/` asset at the moment the branded WebP loads.
- `css/brand-v3-frontsite-recovery.css` standardizes purple/navy/gold card borders, responsive grids, uncropped artist panels and product/tool/supply card framing without rewriting inventory or product images.
- Existing hero background images are preserved; the global public styling supplies background colour rather than replacing their background imagery.
- The audited pages include Home, Shop, Collections, Cart, Checkout, Services/Capabilities, Custom Request, Events, Gift Cards, Member, Account, Stories and legal/help pages.

## Remaining limitations
- The audit is **source-code and automated workflow verification**, not a screenshot comparison across desktop and mobile browsers.
- Default placeholder markup remains in static HTML as a Media Studio edit hook. Approved illustrative art is loaded at runtime where an owner-chosen image has not already been published; this distinction is intentional.
- Actual image loads, layout in the running browser, login-protected workflows, and all routes under real production Cloudflare must be visually checked before accepting a complete visual redesign.
- **Brand V3 artwork 181–190** is packaged as ten individual WebPs in `devilndove-set-19-artwork-181-190.zip`. The files are mapped in code on `dev`; upload the ten WebPs to `assets/images/brand-v3/` before banners become visible.
- **Production is not synchronized.** GitHub compare `main...dev` showed *diverged*: `dev` 2,642 commits ahead, `main` 244 commits ahead, as checked during this audit. Neither hard-resetting `main` to `dev` nor a blind direct merge is safe. A controlled reconciliation and Cloudflare deployment verification are required.

## Required production release sequence
1. Confirm all ten new image files exist under `assets/images/brand-v3/`.
2. Keep the Brand V3 image-mapping and whole-frontsite audit checks green.
3. Reconcile `main`'s independent commits and the `dev` changes through a reviewed PR or equivalent safe release plan, not a forced branch move.
4. Deploy the accepted source to Cloudflare Production and verify the actual commit/hash.
5. Run a browser-based visual acceptance checklist: Home, Shop, cards, media slots, Search, Journal, About, Contact, Collections, product detail and Admin dashboard at desktop/mobile sizes; validate real product photos, prices and controls remain intact.
