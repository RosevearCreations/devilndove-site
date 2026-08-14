# Build 261 Validation — Packaging inventory authority, Claims library, and soap-label layout

## Production issues addressed

Build 261 corrects the Packaging Studio areas reported after Build 260:

- **Components & Cost** no longer depends on a wide table whose headings and input controls overlap.
- The **Inventory item** lookup is now the first control for each component and is a type-to-search datalist.
- Packaging Studio reuses inventory/source information already stored in Devil n Dove before offering another Amazon lookup.
- The **Claims** tab now surfaces the reusable database-backed claims library with icons and direct **Add to this label** actions.
- Custom reusable claims can be created from the Claims tab.
- Soap-label ingredient columns, front product title, claims block, and net-quantity line use tighter bounded SVG geometry so text remains inside the printable/decorative boundaries.
- New Inventory Amazon/source-material captures preserve their packaging source draft so ingredient/allergen/benefit evidence is not discarded before Packaging Studio can reuse it.

## Inventory-first Packaging Studio behavior

The normal workflow is now:

1. Start in Devil n Dove Inventory.
2. Type/select the actual inventory item in **Components & Cost** or **Material Library**.
3. Reuse saved name, supplier, SKU, unit/cost information, source/Amazon URL, source image, and any captured source-material details.
4. If the inventory item is already linked to a Packaging Source Material template, Packaging Studio opens that existing template.
5. Use Amazon only as a fallback when the legacy/current inventory record does not contain the needed source information.

### Why some older items may still need one source-evidence pass

Older Amazon Inventory imports generally retained the basic inventory/catalog facts, but the packaging-specific preview payload containing ingredient/allergen/benefit/claim evidence was not guaranteed to be persisted by the Inventory UI. Therefore Build 261 can reuse the basic facts for those legacy items immediately, but detailed supplier composition may still need to be added from the manufacturer/supplier documentation or, where useful, imported once from the source/Amazon page.

Build 261 changes this going forward: source-material-recommended inventory saves can preserve the captured packaging source draft into the existing Packaging Material Library tables and link the resulting template to the inventory item. Existing owner/supplier-reviewed source templates are never silently overwritten by a later Amazon capture.

## Components & Cost UI

Each component is now a responsive card rather than a 12-column table. The first field is the searchable Inventory control, followed by stock/status and then the component-specific fields. Cards collapse from a multi-column desktop layout to two columns and then one column on narrow screens, so headings and entry controls do not overlap.

Selecting an inventory item can populate/retain:

- authoritative inventory ID;
- display/item name;
- supplier/SKU reference;
- unit cost;
- supplier;
- inventory/stock context;
- quantity used per finished unit;
- waste allowance;
- lot-tracking choice;
- component notes.

## Claims library

The Claims tab now exposes reusable claims directly. Claims include:

- English label;
- French label;
- icon (`leaf`, `hands`, `recycle`, `heart`, or `none`);
- approval/review state;
- review notes.

The existing Packaging Content Library remains the data authority. Build 261 changes discoverability and editing, not the underlying claims concept.

## Soap ribbon / print geometry

The soap renderer now uses `soap_reference_v3` with tighter fixed zones:

- English ingredient column clipped to its safe panel;
- front title/family wraps to a maximum of two bounded lines;
- French ingredient column clipped to its safe panel;
- standard claims limited to four concise rows in the ribbon layout;
- claims typography is compressed/adaptive;
- claims separator and net quantity are separated vertically;
- ingredient and claim clips stop above the decorative bottom rule.

A local stress render was exercised with a long Oatmeal/Goat Milk title, twelve ingredient entries, and four bilingual claims. The layout remained bounded in the intended zones. A physical **Actual Size / 100%** print remains the final authority for production readability.

## Database / migration status

**Build 261 is code-only. There is no new D1 migration.**

Current migration remains Build 259:

- `database_build259_media_static_slot_catalog.sql`
- `database_upgrade_current_pass.sql`

Both currently have SHA-256:

`07f8ee8b5688e06f8c51f7a120bd33be63770b6f8ea0fb4f1d9164be558daa36`

The Build 261 source-draft preservation uses Packaging Material Library/source-link tables that already exist from earlier migrations.

## Validation results

Final compatibility pass:

- Build 261 Packaging/Inventory/Claims/Layout regression: **46/46 PASS**.
- Build 247 Packaging Studio regression: **43/43 PASS**.
- Build 248 Packaging/source-material regression: **85/85 PASS**.
- Build 249 kit/component inventory regression: **25/25 PASS**.
- Build 250 product media/use-batch regression: **14/14 PASS**.
- Build 251 Product Editor image runtime: **9/9 PASS**.
- Build 252 inventory unit-preset runtime: **10/10 PASS**.
- Build 253 linked-item/reset regression: **18/18 PASS**.
- Build 254 Startup/Smoke runtime: **16/16 PASS**.
- Build 255 Packaging Material Library: **38/38 PASS**.
- Build 259 explicit Media Studio: **98/98 PASS**.
- Build 260 Media Studio bootstrap/runtime: **21/21 PASS**.
- Build 244 fractional inventory authority: **PASS**.
- Build 246 product/project/production/packaging lifecycle: **PASS**.
- Public-page audit: **36/36 PASS**, 0 warnings, 0 failures.
- Asset-reference audit: **149 references, 0 missing**.
- Fresh aggregate schema/foreign-key checks in the Build 261 regression: **PASS**.
- Changed Packaging/Inventory JavaScript syntax and CSS structural checks: **PASS**.

Build 256–258 Media Studio scanner regressions are intentionally not current compatibility gates because Build 259 deliberately replaced the scanner/iframe workflow with explicit static slots. Build 259 and Build 260 are the active Media Studio architecture and both pass.

## Deployment / production checks

1. Do **not** apply another D1 migration if Build 259 is already installed.
2. Deploy the complete Build 261 package.
3. Hard-refresh `/admin/packaging-studio/` and confirm `admin-packaging-studio.js?v=261` is loaded.
4. Hard-refresh Inventory Operations and confirm `admin-site-item-inventory.js?v=261` is loaded.
5. In **Components & Cost**, type an existing inventory item and confirm its name/supplier/cost data fills without another Amazon import.
6. In **Material Library**, choose an inventory item that is already linked to a source template and confirm the existing template opens.
7. Test a legacy item that has only basic Amazon/catalog facts; add/verify missing supplier composition once if needed.
8. Open **Claims**, add a saved bilingual/icon claim to a soap label, and confirm the icon and text appear.
9. Print one long-ingredient soap ribbon at **Actual Size / 100%** to validate the physical label against the printer/material stock.
