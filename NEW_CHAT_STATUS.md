# NEW CHAT STATUS

## Current pass status
- Latest pass focused on mobile/admin CSS fit, centralized creations/gallery authority, and docs/schema refresh.
- No new D1 table was introduced in this pass.
- Public creations/gallery pages now lean on `/api/creations` as the single page-facing source, while the API itself still keeps the controlled D1-first + migration-fallback behavior.
- Mobile shell spacing, bottom dock behavior, and sticky action treatment were tightened again for phone-first admin use.

## Best next development lane
1. Finish the remaining mixed JSON/D1 read-path cleanup.
2. Continue payment/accounting convergence and webhook hardening.
3. Continue media lifecycle completion, especially real variant generation.
4. Keep the movie editor and movie overlay path stable without forcing full D1 authority too early.

# New Chat Status

## Current handoff summary

This handoff is updated for the latest repo pass. The build focus remained movie stability, mobile product capture, schema/doc sync, and reducing duplicate truth risks where the repo could safely move forward in one pass.

## Most important current truths
- `data/movies/movie_catalog_enriched.v2.json` remains the active movie base truth.
- `functions/api/admin/catalog-sync.js` now points movie sync work at the v2 JSON source instead of the older enriched file.
- `movie_catalog` in D1 is still a manual/admin overlay layer, not the primary movie truth.
- The public movie tab and admin movie list/editor must continue to load from the JSON-first movie source, then merge any D1 overlay rows on top.
- The admin movie editor must continue to show fuller JSON-backed details, not just image and UPC.
- `database_schema.sql`, `database_store_schema.sql`, and `database_upgrade_current_pass.sql` were brought forward so the schema references better match the current code paths.
- Public exposed pages were checked again and still keep the one-H1-per-page rule intact.

## What just happened
- Earlier movie admin saves could fail on older databases with: `D1_ERROR: table movie_catalog has no column named imdb_id`.
- This pass reduced that drift by aligning the repo schema references and upgrade SQL with the richer movie fields the admin editor expects.
- Catalog-sync movie imports were moved to the same v2 JSON source already preferred by the public/admin movie flows.
- The movies page received another small SEO wording pass around DVD/Blu-ray collection terms.

## Current requested direction
1. Keep movies JSON-first using `movie_catalog_enriched.v2.json`.
2. Keep admin movie editing stable and visually complete.
3. Keep D1 movie writes backward-compatible with older table shapes.
4. Continue moving Known Gaps forward only where it is honest and safe to do so.
5. Keep all Markdown and schema-reference files in sync each pass.

## Movie fields the user expects to see/edit
At minimum, the admin movie workflow should expose and allow edits for:
- UPC
- title
- original title
- summary
- release year
- media format
- genre
- director names
- actor names
- studio name
- runtime minutes
- trailer URL
- front image URL
- back image URL
- status
- featured rank
- IMDb id
- alternate identifier
- metadata source
- metadata status
- estimated value low/high cents
- estimated value currency
- rarity notes
- collection notes
- value search URL

## Product intake expectations
- Mobile product entry must support partial drafts before later mandatory fields are enforced.
- The repo should include and maintain a detailed finished-products CSV import template for bulk additions.

## Known honest remaining gaps
- Trusted movie enrichment still depends on the external/local enrichment pipeline and cannot be truthfully marked fully complete inside the site repo alone.
- Broader permission granularity and deeper security segmentation remain future security-pass work, not something already solved.
- Some legacy admin/read paths may still need more API-first authority cleanup.

## Recommended next actions in a new chat
- Verify `functions/api/admin/movies.js` in a live environment against an older D1 database and confirm the auto-add column path covers every missing movie field.
- Continue the Known Gaps list from the remaining repo-safe items.
- Keep docs aligned with the JSON-first movie truth and overlay-only D1 strategy.
- Continue reducing duplicate truth paths between JSON, D1, and admin screens where the repo can do so honestly.

- New finished-product numbering now starts at DD1000 for newly created products. Internally the database still stores the numeric portion as `1000`, `1001`, and so on, while the UI can present the public/admin-friendly `DD1000` style code.
- Added a first-pass installable phone experience with `manifest.webmanifest`, `sw.js`, and generated app icons so visitors can save Devil n Dove to a home screen more cleanly than a plain browser shortcut.
- Added a new `/socials/` page backed by `/data/site/social-feed.json` and seeded it with your current profile links plus a first saved list of five public YouTube videos.
- The admin tools-and-supplies inventory editor now includes a barcode-photo helper that can fill the external key from a phone photo when the browser supports `BarcodeDetector`. It prepares an Amazon search link, but full product-detail import from Amazon is still blocked until Amazon Product Advertising API credentials or another approved catalog source is added.

## Fresh-chat handoff update
- The repo now includes a first-pass PWA shell (`manifest.webmanifest`, `sw.js`, generated icons) so Devil n Dove can be saved to a phone home screen more like an app.
- New finished products are now intended to start from code DD1000 upward, while the underlying DB still stores the numeric part.
- A new `/socials/` page exists and is seeded from `/data/site/social-feed.json`. It currently has profile links and five YouTube videos.
- Admin tools/supplies intake already existed in `siteInventoryAdminMount`; it now also has a barcode-photo helper. It can detect a barcode and prepare an Amazon search URL, but it does not yet pull structured Amazon details automatically.

## Current pass addendum
- Normalized public route links away from explicit `/index.html` navigation and added a `_redirects` file so direct `.../index.html` requests resolve more cleanly alongside directory routes.
- Expanded the installable phone shell with a stronger manifest, install prompt handling, Apple home-screen metadata, and an offline fallback page.
- Added another CSS hardening pass for mobile/admin layout overflow and dark-mode calendar/date picker visibility.
- This pass did not require a new D1 schema table change; schema reference files were refreshed to reflect that the changes were routing/PWA/CSS/app-shell focused rather than DB-structure focused.


## New current state from this pass
- Public/mobile shell is more installable and more app-like. The site now has a stronger manifest, a tighter service-worker cache policy, and a new mobile inventory intake route at `/admin/mobile-inventory/`.
- Browser security hardening moved forward with a new `_headers` file that adds no-store rules for sensitive areas and baseline CSP/frame/referrer protections.
- Another CSS hardening pass reduced mobile/admin overlap issues and improved dark-mode calendar/date control visibility.
- A repo cleanup pass renamed clearly unlinked duplicate/legacy files with an `RM_` prefix instead of deleting them.

## Best next steps after this pass
1. Test the install flow on Android and iPhone home-screen entry.
2. Test `/admin/mobile-product/` and `/admin/mobile-inventory/` on a real phone.
3. Review the `RM_` files and remove them only after one more visual/file-level check.
4. Continue the JSON-to-D1 authority reduction in the remaining mixed areas, especially movies and any leftover legacy admin reads.
5. Resume social ingestion and Amazon lookup only when approved provider access is available.


## Latest pass handoff
- Basic accounting shadow records were added for new orders.
- Admin accounting summary UI now exists in the orders area.
- Admin password reset now supports any account, including admin-to-admin resets, with stronger confirmation and audit coverage.
- Schema references and upgrade SQL now include `accounting_order_records`.


## Current pass handoff note
- Accounting shadow rows are no longer order-create only; they now resync on Stripe return, Stripe webhook reconciliation, PayPal return, PayPal webhook reconciliation, and admin refund actions.
- Mobile artist-side admin pages now behave more like an installed app with safer sticky actions and a bottom shortcut dock.
- The remaining work is now more about deeper backend completion than basic mobile shell or summary-record groundwork.


## Current pass addendum
- Fixed the Admin → Members preview/logout issue by stopping generic member-page 401s from clearing the whole site session automatically; auth is now cleared only on session-check/auth endpoints.
- Admin can now open the Members area in preview mode to review layout and account tools without being forced into a member-only logout loop.
- The Admin dashboard is moving toward a more manageable shell by turning the long major sections into collapsible panels while keeping direct anchor links working.
- Continued mobile-app/store polish by keeping phone-first admin pages linked to Store and Artist surfaces for quicker installed-app movement.
