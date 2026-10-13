# Build 387 — Write Confirmation Coverage Audit & Guided Recovery
Production promotion requires exact-head checks, canonical Development-first D1 0038, identical tree on main, Production D1 preservation, Pages and live resource verification.

## Requested workflow
In Inventory Operations > Product Tools & Supplies Used choose a Product and linked Tool or Supply and select **Quick edit Inventory, units & HST**. Edit the real counted stock, stock/usage units, conversion ratio and CAD purchase cost. Set HST rate (Ontario 13% default, editable or zero), and select tax-included when appropriate. Confirm the correction. New receipt links the Inventory row, existing movement ledger, base balance and operator identity. After Save the product production preview is invalidated: independently review fresh deductions and explicitly Post production. The quick edit never deducts stock or publishes the product automatically.

The full Inventory form also displays a tax calculator; it does not yet persist that estimate, while Quick Edit does. Tax is an operator estimate, not a source invoice, accountant-posted expense or automatic GST/HST input tax credit.

Build 385/386 existing receipt scopes remain. Other Product update/link writes and calendar cancellation are not falsely claimed exactly-once; uncertain results must be checked against the original source. No automatic retry or payment/provider publication.

**Next queued: Build 388 — Inventory Reconciliation Workspace & Purchase-Tax Evidence Review.**
