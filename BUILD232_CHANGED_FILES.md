# Devil n Dove Build 232 Changed Files

## Archived-product correction and removal

- `functions/api/admin/delete-product.js` — bounded protected-history preflight, archived-item audit reclassification, schema-compatible material/image reads, one cleanup schema profile and one atomic D1 removal batch.
- `public/js/auth.js` — structured error payload retained while preserving the shared Cloudflare/non-JSON response guard.
- `public/js/admin-product-correction.js` — safe correction preflight/delete parsing instead of direct JSON parsing.
- `public/js/admin-delete-product.js` — safe table-row removal preflight/delete parsing.
- `public/js/admin-product-cleanup.js` — safe cleanup-centre parsing and clearer bounded-cleanup explanation.
- `css/styles.css` — contained correction cards, responsive two-to-one-column inventory review and full-width phone actions.
- `sw.js` — browser shell refresh to v13.

## Validation and operating guidance

- `scripts/build232_product_removal_test.mjs` — aggregate-schema product-reference registry coverage, bounded query budget, archived-product GET, reviewed POST, atomic inventory/cleanup/detachment checks, safe parser and code-only schema proof.
- `functions/api/admin/startup-readiness.js`, `STARTUP_GO_LIVE_GUIDE.md` — retained 43 gates and expanded destructive-action gate with twelve exact removal/protected-history steps.
- `BUILD232_VALIDATION.md` — local and production verification procedure.
- Current canonical, schema, Cloudflare, release, Startup and pointer Markdown now identify Build 232. Build 231 and earlier files remain historical evidence.

## Database boundary

Build 232 adds no D1 table or migration. `database_upgrade_current_pass.sql` remains byte-identical to `database_build230_visual_image_manifest.sql`. Apply that Build 230 migration only when it is not already recorded; never reapply it merely because the application build number is 232.
