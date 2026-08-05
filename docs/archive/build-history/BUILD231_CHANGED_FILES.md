# Devil n Dove Build 231 Changed Files

## Product draft reliability

- `public/js/auth.js` — shared JSON/HTML response guard; Cloudflare 1102 pages become a short retryable message and never leak raw HTML/CSS.
- `public/js/admin-create-product.js` — 2.2-second debounce, explicit autosave intent, one in-flight save with a queued-newer-change pass, browser recovery copy and visible recovery action.
- `public/js/admin-edit-product.js` — safe product-detail/update parsing and autosave pause while a stored product is programmatically loaded.
- `functions/api/admin/product-detail.js` — compact Free-plan route with no repeated `sqlite_master`/`PRAGMA` discovery, independent optional reads, no-store response and at most seven editor images.
- `public/js/admin-product-media-context.js`, `public/js/admin-product-price-suggestions.js` — all remaining Product Detail consumers use the shared safe parser.
- `functions/api/admin/create-product.js`, `functions/api/admin/update-product.js` — 96 KiB request guard and autosave intent handling.
- `functions/api/admin/update-product.js` — autosave skips approval/social/media-audit/admin-audit side work and avoids unchanged image writes; deliberate Save/Update behaviour retains its audits and automation.
- `functions/api/_lib/productSocialAutomation.js` — an unapproved product exits before any social settings/schema inspection.
- `css/styles.css`, `sw.js` — contained long errors, phone-width recovery controls and refreshed browser cache.

## Validation and current guidance

- `scripts/build231_product_autosave_test.mjs` — regression coverage for Cloudflare HTML, valid JSON, product 45's compact five-call response, autosave intent/recovery/queuing, hot-path skips, unchanged schema and one-H1 editor pages.
- `BUILD231_VALIDATION.md` — local and production verification procedure.
- Current canonical, schema, Cloudflare, release, Startup and pointer Markdown now identify Build 231 as a code-only hotfix. Historical Build files remain unchanged evidence.

## Database boundary

Build 231 adds no D1 table or migration. `database_upgrade_current_pass.sql` remains byte-identical to `database_build230_visual_image_manifest.sql`. Apply that Build 230 migration only when it is not already recorded; never reapply it merely because the application build number is 231.
