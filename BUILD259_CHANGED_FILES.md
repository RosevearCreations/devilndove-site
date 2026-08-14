# Build 259 Changed Files

## Media & Content Studio core

- `admin/media-content-studio/index.html` — rebuilt as website map + direct slot editor; scan/register workflow removed.
- `public/js/admin-media-content-studio.js` — page/slot map, direct image picker, upload-and-use, default restore, text draft/publish, media details.
- `public/js/media-content-runtime.js` — explicit selector overrides plus admin-only deep edit links; no scanner.
- `functions/api/admin/media-content-studio.js` — stronger product/catalog/inventory/supply/tool media exclusion.
- `public/data/media-content-slot-catalog.json` — new canonical 29-page/454-slot owner-facing slot catalog.
- `css/styles.css` — Build 259 Studio layout, responsive slot cards, public placeholders and admin edit overlays.

## Public static page instrumentation

Known public/static pages in the slot catalog now contain stable `data-media-slot`, `data-media-background-slot` and `data-content-slot` attributes. Existing authored imagery is preserved as the default. Relevant pages also include intentional SVG visual placeholders.

Core areas include Home, About, Gallery/Art, Creations, Workshop Journal, Collections, Contact, Gift Cards, Events and Social Hub. Local/landing pages, selected workshop guides and public policy pages are also instrumented.

## Specialist-route isolation

Media Studio runtime references were removed from Shop/Product, Tools/Toolshed, Supplies, Member/Account, Checkout, Search, Login/Register, Bootstrap Admin and other excluded specialist/transaction routes.

## New visual placeholders

- `assets/placeholders/media-content/*.svg` — branded per-slot placeholders plus generic image/background fallbacks.

## Database

- `database_build259_media_static_slot_catalog.sql` — seeds canonical static slots and deactivates older scan-derived slots for those page paths.
- `database_upgrade_current_pass.sql` — identical Build 259 current migration.
- `database_full_schema.sql` — fresh-install authority includes Build 259.
- `BUILD259_D1_VERIFICATION.sql` — read-only production checks.

## Documentation and tests

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `BUILD259_VALIDATION.md`
- `BUILD259_CHANGED_FILES.md`
- `scripts/build259_media_static_slot_regression.py`
- `data/site/build241-public-page-audit.json`
- `data/site/build241-asset-reference-audit.json`
