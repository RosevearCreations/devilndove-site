# Release 467 Build 470 — Tools, Consumables, Workstations & Usage Unit Consistency

Build 470 makes inventory unit editing and human review safer without replacing the existing Inventory and Tool sources of truth. The original Inventory movement, base balances, Kit, Tool lifecycle and Production Calendar remain authoritative.

## Operator workflow

1. Open [Inventory Operations](/admin/inventory-operations/) as an authorized Admin. On the visible 40-item page, use **Review saved items on this page**. This reads **only the already rendered saved item records**; it does not fetch historical movements, scan additional pages or write D1. Repeat manually after navigating to another page.
2. For each row, compare **stock unit** (purchase/package units) with **usage unit** (consumption units). For example, 1 kilogram of wax = 1000 grams. A mismatch against a standard physical unit conversion is a **REVIEW**, never an automatic correction: source packaging may differ. Custom pack counts (e.g., 12 pieces per pack) must be verified from an actual package.
3. Review **on-hand** minus **reserved** package stock. Reserved stock is not available for a new job. A recorded cost per stock unit can show a **provisional** unit cost; a supplier URL or Amazon listing is not proof of a historical purchase price. Confirm the **original invoice/receipt, date, CAD cost, package size and shipping/tax treatment** before accepting job costing.
4. Check the many-to-many **Specific station tools** checklist. Unchecking all stations now correctly records an **empty association** instead of silently restoring the old single-station link. The **Current Location** dropdown is independent of workstation memberships; it must describe where the item physically is, not which workstation may use it.
5. **Record use** only when real work has occurred. The existing canonical `inventoryUnitConversion.js` converts exact or estimated usage into stock depletion, respects reservations/minimum increments, and keeps reusable Tools nondepleting. The Build 470 visible-page review does not load use history: open the original Movement/Lot/Job Traveler evidence when an actual-use receipt is required.
6. Use **Download local HOLD review** as a provisional operator worksheet. It contains current-page item IDs, normalized source observations and findings, not original receipts. No user/customer record, D1 table, supplier price, source document, remote service or object is automatically modified.

## Targeted repairs and source safety

- Clearing the workstation checkboxes is an intentional empty list in both table and full-form editors. Review before pressing Save. The existing canonical membership validation still forbids self-assignment, non-Tool stations or cross-category station links.
- The Inventory form and table now refuse empty/invalid conversion numbers, on-hand quantities and costs instead of silently clamping them into fabricated defaults. The authenticated API also rejects malformed incoming conversion factors, min increments, package quantities, cent amounts and duplicate workstation identifiers **before** calling legacy write handlers.
- Original unit/cost metadata is never silently adjusted by the audit. The current inventory endpoint remains the sole authority for writes; the canonical Build 70 conversion engine remains the sole arithmetic owner of actual consumption.
- A source-linked inspection of a saved item **does not** independently verify a physical location, supplier invoice, use receipt, service safety check or accounting posting. Retain HOLD for each absent piece of evidence. Do not manufacture receipts merely to close a task.
- This build requires **no migration** and introduces no D1, R2, Cloudflare, payment, Etsy, Marketplace, US shipping or paid-quota changes.

## Acceptance

`node --test scripts/release467_build470_inventory_consistency.test.mjs scripts/release467_build70_inventory_unit_runtime_test.mjs` tests a 1 kg → 1000 g package, partial use and reservation math, a reusable Tool assigned to two workstations, explicit empty memberships, current-location self-reference, original cost/source HOLD and malformed API mutations. Existing Inventory and Build 448 safety tests remain authoritative.

Production release GREEN requires exact tested `dev/main` source trees, full protected PR/postmerge checks, Cloudflare Pages exact-main deployment and independent zero-D1 control-plane proof. Physical inventory/receipt acceptance remains HOLD until actual owner evidence is reviewed.
