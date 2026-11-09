# Devil n Dove Build 660 — Customer Storefront, Checkout, Canada Shipping & Returns Acceptance

Build 660's [Storefront Acceptance Desk](/admin/storefront-acceptance/) is a **verified Storefront Admin-only, on-demand read-only** workspace. It reuses the actual existing Storefront, Cart, Checkout, Terms, Order/Care screens, and the Build 656 owner evidence journal. It does not create fake purchases, contact providers, adjust prices, post refunds, submit a shipment, collect new PII, send Comms messages or publish completion scores to AI Data Platform.

## Real owner acceptance walkthrough

1. Open **Admin → Storefront → Customer Storefront, Checkout, Canada Shipping & Returns Evidence Desk**.
2. Use real desktop/tablet/mobile devices and the original links to review a real Product, images, price, quantity, cart controls and accessibility. For Checkout, inspect address instructions, local pickup/digital delivery options, Canadian billing/shipping fields, server-authoritative CAD calculations, provider choice and recovery path. **Do not submit an unauthorized checkout or payment.**
3. Review actual [Terms](/terms/) and the existing [Order Fulfillment & Customer Care](/admin/order-fulfillment-care/) owner workspace; observe any genuine return/refund support case through its original authority. Build 660 makes no independent claim about a general return-request intake system or carrier delivery.
4. Click **Load my current owner checkpoints**. This reads only the signed-in Admin's existing Build 656 original receipts. All eight relevant source-owned requirement IDs are shown:

   - `customer.desktop.browse`, `customer.tablet.browse`, `customer.mobile.browse`
   - `customer.desktop.checkout`, `customer.tablet.checkout`, `customer.mobile.checkout`
   - `storefront.purchase`, `shipping.fulfillment`

5. To add factual field acceptance, use the existing [protected Owner Device Evidence form](/admin/module-acceptance/). Select the exact stable requirement, device/browser, genuine observation date and exact permissible evidence reference. Its local owner acceptance is **not independent payment, customer, carrier or Master Shell certification**. If the evidence isn't real or complete, record HOLD.
6. If there is a genuine existing Order ID, enter it and click **Inspect original saved order**. The desk reads the original `orders` row and at most 20 `order_items`, 20 `payments` and 20 `payment_refunds`, with independent total counts. It displays source statuses, CAD amounts, Canadian country rules, a SHA-256 source revision and fail-closed HOLD reasons. It deliberately excludes customer names, emails, delivery addresses, provider transaction IDs and original notes. If the source is unavailable or rows exceed the bounds, acceptance remains HOLD.
7. Verify any actual provider settlement/capture/refusal against the authorized original payment provider; verify rates/service/hand-off through the real carrier and refunds through the existing order/provider authority. A local `paid`, `succeeded`, `fulfilled` or `accepted` string is never external proof. No account-specific live provider testing is silently performed.

## Status interpretation

| Axis | What Build 660 can establish | What remains HOLD |
| --- | --- | --- |
| Customer role × desktop/tablet/mobile | Exact existing Build 656 signed-in owner review receipts, shown with device, date and evidence reference | Actual independent customer-device verification and accessibility acceptance |
| Storefront & checkout | Original product/cart/checkout routes and one actual order's saved status/totals | Genuine authorized end-to-end transaction and external capture/settlement |
| Canada shipping | Stored original order country/currency and Checkout's separate CA/CAD policy | Carrier rate, actual shipping label, service and delivery receipt |
| Returns | Bounded original refund/status rows and owner care links | Customer return request, consent, provider refund completion and final customer closure |
| Master Shell | Stable requirement IDs and source-owned status/receipt projection | Approved denominator, source signature, independent witness, trust, integration event and certified completion percentage |

Missing/stale source facts and external evidence must never be replaced by demo data. `main` Production GREEN means the software was deployed and its protected checks passed; it does not mean all real owner/customer/provider/carrier field acceptance is complete.

## Technical source and security boundaries

- Endpoint: `GET /api/admin/storefront-acceptance-660` (no Order read until `order_id` is supplied); **no POST endpoint**. Active Storefront Admin module grant required, no-store response.
- Database: `app_settings` Build 656 private owner ledger; `orders`, `order_items`, `payments`, `payment_refunds`; source-query column allowlists and response projection prevent customer/contact/provider-ID export even if an upstream record contains extra fields. No DDL or canonical DML.
- Returns: the presence/absence of a `payment_refunds` row is **not** a substitute for a general customer return-request system. Refund/provider response and shipping service are separate original authorities.
- Source SHA-256 includes the inspected bounded original order/payment/refund facts; there is no automatic refresh, retry or background query. The source may change after the read; re-inspect before any owner acceptance.
- Tests: `node --test scripts/release467_build660_customer_checkout_shipping_returns.test.mjs` covers Storefront role/route mapping, redaction, private owner device checkpoints, source changes, Canada/CAD and payment/refund HOLDs, truncation, negative access and zero canonical writes.
- Protected runtime budget: prior unreferenced Amazon purchase review/import clients and one unreferenced payment-options client were moved byte-identically to `docs/operations/historical/`; the original source-owned API/business workflows remain intact.
