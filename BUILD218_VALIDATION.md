# Build 218 Validation — Amazon Link Inventory Draft

## Delivered
- Added `/api/admin/amazon-link-preview` as an authenticated, review-first metadata preview endpoint.
- Added an Amazon URL panel to `/admin/inventory-operations/` for tools and consumables.
- Available title, description, image, ASIN/SKU, supplier, canonical URL and suggested category are copied into the existing inventory editor.
- No inventory row, stock movement, cost record or reorder action is created by previewing a link.
- The administrator must review the draft, enter the actual purchase cost and quantity, and deliberately save it.
- Added mobile layout rules and visible fallback messaging when Amazon blocks or omits metadata.

## Deployment checks
1. Sign in as an administrator and open `/admin/inventory-operations/`.
2. Paste a normal `amazon.ca/dp/...` product URL and choose Tool or Consumable.
3. Select **Build Review Draft**.
4. Confirm the editor receives the Amazon URL, ASIN-based external key, available title, image and description.
5. Correct any missing or inaccurate field and enter the real purchase price.
6. Save once and confirm one inventory record and one create movement appear.
7. Repeat on a narrow mobile viewport and confirm the link, type and button stack without overlap.
8. Test an invalid non-Amazon URL and confirm it is rejected without changing the form.
9. Test an Amazon page that blocks metadata and confirm manual entry remains available.

## Safety boundaries
- Amazon metadata is third-party source material and is never treated as verified purchasing evidence.
- Price is intentionally not trusted or auto-populated; use the invoice/order record or Amazon CSV review workflow.
- Images remain remote URLs and may later need licensed/local asset handling.
- The endpoint does not expose Amazon order history and requires an authenticated admin session.
