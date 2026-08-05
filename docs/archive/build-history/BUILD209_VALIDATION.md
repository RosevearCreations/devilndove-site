# Build 209 Validation Guide — Inventory Operations and Preflight Context

## Purpose

Build 209 repairs the internal `/admin/inventory-operations/` workspace where cards, tables, action columns, and message colors could become hard to read or extend beyond the page. It also adds a read-only, non-blocking inventory/maker-input context stage to Product Release Preflight.

No database migration is required.

## Test before and after sign-in

1. Open `/admin/inventory-operations/` while signed out.
   - The page must remain noindex and display the normal access guidance.
   - No console syntax error should appear.
2. Sign in as an administrator.
   - Inventory controls load.
   - Outer cards, nested cards, input fields, table headers, and action areas use dark readable backgrounds.
   - There must be no white cards with pale writing.

## Desktop/tablet inventory tests

1. Use a record with a very long item name, long supplier URL, and several actions.
2. Confirm:
   - the page itself does not horizontally overflow;
   - the desktop inventory table can scroll inside its own bordered area when required;
   - action buttons sit in a clearly shaded Action area;
   - Delete is visibly distinct but not visually merged with the other actions;
   - input focus has a visible outline;
   - success/error messages are readable.
3. Use Refresh, Sync tools, Sync supplies, and Sync all only against safe/test data.
4. Load a record with **Edit full record**, alter nothing, and use Reset Form.
5. Run one safe Reserve, Release, Receive, and Consume action. Verify a movement appears in Recent Inventory Movements.

## Mobile tests

At 680px and below, and on a real phone:

1. Inventory rows change into labelled blocks: Item, Stock, Rules, Supplier, Linked products, Cost, Actions.
2. Movement rows change into labelled blocks.
3. Product Stock & Build Readiness rows change into labelled blocks.
4. All action buttons remain fully visible and tappable. No button may be hidden outside the viewport.
5. Tables should not force the document body to scroll sideways.
6. Narrow 430px layout remains readable with action buttons stacked.

## Product context handoff

1. Open `/admin/inventory-operations/?product_id=<known-product-id>`.
2. Confirm **Product Tools & Supplies Used** selects the same product.
3. Add/remove nothing during this test unless using a safe test record.
4. Switch product in the selector. Confirm the URL updates to that product ID.

## Release Preflight context test

1. Open `/admin/release-preflight/?product_id=<known-product-id>`.
2. Confirm **Inventory & maker-input context** appears as a Context/Context notes stage.
3. Compare the existing handoff and publish scores before and after reviewing this stage.
4. Confirm inventory information does not change either score and creates no write.
5. Try examples with:
   - finished-product tracking off;
   - tracked product with zero stock;
   - no product-resource links;
   - linked resource without inventory record;
   - linked item at reorder level;
   - linked item marked do not reuse.
6. Verify every note routes only to Inventory Operations or Product Editor as appropriate.

## Regression checks

- Product Release Preflight remains read-only.
- Inventory context must not create stock movements, reservations, costs, resource links, CAIP evidence, consent, rights, Content Studio packages, or Release Board drafts.
- Run `POST_DEPLOY_SMOKE_TEST.md`.
- Re-run Build 206/207 media-consent checks and Build 208 destination-aware preflight checks.
- Capture the safe response or matching log for the separate login `500`; do not change D1 schema from the generic browser error.
