# Build 221 Validation — Packaging Studio, Cleanup and Lot Reconciliation

## Deployment order
1. Back up production D1 and retain the backup identifier.
2. Apply `database_build221_packaging_studio_cleanup_lot_controls.sql` to staging.
3. Verify the six Build 221 tables and both packaging-template seed rows.
4. Deploy the complete Build 221 package to staging.
5. Complete every destructive and print test below with disposable records.
6. Apply the migration and deploy to production only after staging passes.

## Static validation completed before packaging
- 492 JavaScript files passed `node --check` before the final documentation/package pass; rerun after deployment source reconciliation.
- 102 HTML pages contained exactly one H1.
- All 991 local HTML script, stylesheet and image references resolved.
- CSS opening and closing braces balanced.
- The three Build 221 SVG assets parsed as XML.
- The supplied-ribbon reference SVG rendered through Inkscape to a 1600 × 291 PNG without an SVG parse/export error.
- The Build 221 migration applied twice to an in-memory SQLite database.
- The aggregate full schema created the Build 213–215 Creative Process parent tables required by later foreign keys.
- Packaging project, version and export-history SQL was exercised in SQLite.
- Lot reconciliation SQL was exercised against the current movement-type constraint using `adjustment`.
- Duplicate-draft cleanup was simulated with product-owned recipe/SEO rows and a detachable upload row.
- Order and Packaging Studio references were verified as permanent-deletion blockers.

## 1. Draft and archive cleanup
Use disposable products first.

### Unused draft with no linked rows
1. Create a draft product.
2. Open `/admin/products/` and locate **Draft & Archive Cleanup**.
3. Select Drafts and search by name, SKU, product number or row ID.
4. Choose **Check removal**.
5. Confirm **Permanent remove** becomes enabled.
6. Complete typed `DELETE PRODUCT` and administrator-password step-up.
7. Confirm the row disappears and its product number is not reused.

### Unused draft with recipe/material links but no reserved stock
1. Create a disposable draft and link one or more material recipe rows.
2. Do not reserve or consume raw inventory.
3. Run **Check removal**.
4. Confirm removal remains available and the preflight explains that recipe rows will be discarded without changing main inventory.
5. Delete and verify the product and product-owned rows are gone while main on-hand and reserved quantities remain unchanged.

### Draft with possible reserved material
1. Create a disposable draft linked to an item with a relevant reserved quantity.
2. Run **Check removal**.
3. Confirm direct permanent removal is disabled and **Review linked materials & remove** appears.
4. Open the full correction panel, review release/return values, and delete only after confirming the material review.
5. Verify every inventory change has an audit/movement record.

### Archived disposable duplicate
1. Archive a disposable draft.
2. Select Archived in the Cleanup Centre.
3. Confirm the archived status itself does not block preflight.
4. Permanently remove it only when no protected history exists.

### Protected-history controls
Create or use staging fixtures and verify deletion is blocked for:
- an order item;
- accounting or project-cost allocation;
- linked Creative/Content project;
- Packaging Studio project;
- a component used by a set;
- customer story, recall, public-proof or trust-block history.

Archive must continue to work through either `DB` or `DD_DB`, produce an admin audit event, and return JSON rather than an HTML error page.

## 2. Packaging Studio
1. Open `/admin/packaging-studio/` and confirm it is admin-only and `noindex,nofollow`.
2. Create a project using **Soap ribbon — scalloped medallion reference**.
3. Apply the reference example and verify:
   - Coconut milk on the upper curve;
   - Luxury Soap / Savon de luxe in the centre;
   - Sweet Vanilla on the lower curve;
   - scalloped badge extends above and below the 19 mm band;
   - side ornaments and rear medallion remain within the 279.4 × 50 mm canvas.
4. Change all editable fields and confirm the live SVG updates.
5. Reload before saving and verify the browser-local fallback restores the draft.
6. Save the project to D1, create a review version, reload, and verify the version is retained.
7. Prepare SVG, PNG, JPG and browser Print/Save PDF exports and verify export-history rows.
8. Confirm approval is blocked when required bilingual identity, INCI, metric quantity, dealer address or contact fields are missing.
9. Print at 100% scale, physically measure the wrap, badge and text, and record the result in print notes.

Browser Print/Save PDF is not a CMYK prepress claim. Bleed, crop marks, safe areas, font embedding/outlining and true print-PDF generation remain future work.

## 3. Purchase lots and reconciliation
1. Open Tools & Supplies and choose **Lots** for a test item.
2. Add at least two purchases with different purchase dates, order numbers, lot codes and costs.
3. Confirm lot total, main on-hand and discrepancy are displayed.
4. Save Manual, FIFO and FEFO policies and confirm they remain preferences only.
5. Use **Record review only** and verify main inventory does not change.
6. Use **Apply lot total to main on-hand**, enter a note of at least eight characters and type `APPLY LOT TOTAL`.
7. Confirm main on-hand changes once, the movement type is accepted by the current schema, and reconciliation/audit history records the before/after values.
8. Add, edit or delete a lot and confirm reconciliation returns to `needs_review`.

## 4. SEO, layout and fallback
- Confirm every deployed HTML page retains one H1.
- Verify `/custom-request/` emits its canonical and Open Graph metadata.
- Confirm admin Packaging Studio and Cleanup pages do not become public index targets.
- Test cleanup, Packaging Studio and lot controls at approximately 360 px, 768 px and desktop widths.
- Verify no horizontal overflow, clipped controls, unreadable status pills or overlapping fixed elements.
- Temporarily block the Packaging Studio API and confirm the local draft remains available.
- Temporarily trigger API failures and verify JSON error messages and runtime incidents rather than false success.

## Launch boundary
Build 221 does not remove the existing launch gates for payment/webhook idempotency, paid-order inventory settlement, set-component settlement, refund/cancellation restoration, concurrent final-unit protection, transactional email proof, tax/shipping validation, backup restore rehearsal or provider-approved social OAuth.
