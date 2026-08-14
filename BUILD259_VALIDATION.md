# Build 259 Validation — Explicit Media & Content Site Slots

## Release goal

Replace the Build 256–258 scan/register Media Studio workflow with a direct owner-facing website map and explicit deployment-seeded image/background/text slots. Product, finished-product media, inventory, supplies and tools remain in their specialist editors.

## Build 259 scope

- 29 curated public/static website areas.
- 454 canonical active slots after migration:
  - 67 image slots
  - 64 background slots
  - 323 text slots
- 4 shared site slots: logo, navigation/header background, page background and footer background.
- 27 intentional SVG placeholder slots for sections without a suitable existing visual.
- Collections, Creations and Art/Gallery keep their existing site images as their managed defaults.
- Existing authored images/text remain the fallback when no Media Studio override exists.
- Public admin edit links deep-link to the exact slot; visitors do not see these controls.
- Shop/product, inventory, supplies, tools, account, checkout and admin routes do not load the Media Studio public runtime.

## Validation results

- Build 259 focused static-slot regression: **98/98 PASS**.
- Build 249 kit/component inventory regression: **25/25 PASS**.
- Build 250 product media/use-batch regression: **14/14 PASS**.
- Build 251 Product Editor image runtime regression: **9/9 PASS**.
- Build 252 inventory unit-preset runtime regression: **10/10 PASS**.
- Build 253 linked-item/reset regression: **18/18 PASS**.
- Build 254 Startup/Smoke runtime regression: **16/16 PASS**.
- Build 255 Packaging Material Library regression: **38/38 PASS**.
- Public-page audit: **36/36 PASS**, 0 warnings, 0 failures.
- Asset-reference audit: **149 references, 0 missing**.
- `database_full_schema.sql` executes successfully.
- Build 259 migration can be applied again after the aggregate schema without failure.
- Active D1 slot count matches the catalog: **454**.
- Blocked product/tool/supply/admin active slot count: **0**.
- SQLite foreign-key check: **0 violations**.
- `database_upgrade_current_pass.sql` is byte-identical to `database_build259_media_static_slot_catalog.sql`.
- JavaScript syntax passes for the admin Studio, public runtime, admin Media Studio API and public manifest API.

## Deployment order

1. Back up production D1.
2. Confirm the Build 256 Media Studio base migration exists. Builds 257 and 258 were code-only.
3. Apply **one** of:
   - `database_build259_media_static_slot_catalog.sql`
   - `database_upgrade_current_pass.sql`
4. Run `BUILD259_D1_VERIFICATION.sql`.
5. Deploy the complete Build 259 site package.
6. Hard-refresh `/admin/media-content-studio/` and confirm `admin-media-content-studio.js?v=259` is loaded.
7. Test one reversible slot on Home, About, Collections, Creations and Art/Gallery: assign an image, verify it publicly, then use **Use original/default**.

## Important migration behavior

Build 259 does not delete older scan-derived slot history. For the canonical static page paths it marks old slots inactive, then upserts the explicit Build 259 slots. Old assignment/audit history therefore remains available while the public manifest and new Studio use only canonical active slots.

## Remaining Media Studio roadmap

The attached Media & Content Management Studio specification remains the specialist implementation/acceptance authority. Next phases include reusable managed galleries (general, Process, Technique, Evidence, Materials, Packaging, Workshop/Event), media version history/rollback, stronger media-health scoring, and deeper approved CAIP/project-media promotion.
