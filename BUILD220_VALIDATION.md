# Build 220 Validation

## Deploy first
1. Back up the production D1 database.
2. Apply `database_build220_quantity_sets_lots_content_only.sql`.
3. Deploy the full Build 220 Pages/Functions package.
4. Sign in as an administrator and confirm no secrets appear in browser or Function logs.

## 1. Duplicate draft cleanup
1. Create three harmless test drafts with nearly identical names.
2. Filter Products to `Drafts`.
3. Keep one draft and select **Remove duplicate draft** on a second.
4. Confirm the preflight runs, type `DELETE PRODUCT`, and enter the current admin password.
5. Confirm only that unused draft disappears.
6. Link the third draft to a resource or another retained record and repeat.
7. Expected: permanent deletion is refused and Archive/Correction guidance is shown.
8. Confirm the surviving product number and other products are unchanged.

## 2. Quantity specials
1. Load an active test soap product with a regular price.
2. Add price breaks for minimum 3 and minimum 6.
3. Confirm each higher quantity has the same or lower unit price.
4. Open the public product page and change quantity between 1, 3 and 6.
5. Confirm visible per-item pricing and offer text change correctly.
6. Add each quantity to the cart and confirm line/subtotal amounts.
7. Create a test order and inspect `order_items.unit_price_cents`.
8. Expected: the server-selected price matches the D1 tier, not a changed browser value.
9. Try to submit a higher tier with a higher unit price.
10. Expected: save is refused.

## 3. Limited product set
1. Create two active finished-product components with inventory tracking enabled.
2. Give component A quantity 5 and component B quantity 3.
3. Create a set requiring 1 A and 1 B and request 4 sets.
4. Expected: only 3 complete sets are reserved.
5. Open A and B publicly.
6. Expected: component availability is reduced by the set reservation.
7. Open the set publicly.
8. Expected: set availability is 3.
9. Increase one component requirement to 2 per set and save again.
10. Expected: complete-set availability recalculates to the lowest supported count.
11. Release reservations.
12. Expected: set availability becomes zero and component availability returns.

### Launch warning for sets
Do not sell scarce sets publicly until paid-order consumption, abandoned/cancelled-order release, refund restoration and duplicate-webhook tests are complete. Build 220 validates and protects reservation availability, but production payment settlement remains a launch gate.

## 4. Purchase lots
1. In Tools & Supplies Inventory Operations, open **Lots** for goat milk soap base.
2. Add separate rows for at least two real purchase occasions.
3. Record date, supplier order, SKU/ASIN, source URL, quantity, cost, shipping/tax, expiry and location.
4. Edit one row and confirm only that lot changes.
5. Delete a disposable test lot and confirm the main on-hand quantity does not silently change.
6. Confirm the lot summary totals remaining lot quantity and purchase value.
7. Test on a narrow mobile viewport and verify the form stacks and the table scrolls horizontally without leaving the page.

## 5. Content-only Creative Project
1. Open `/admin/creative-process/`.
2. Create `Laurie hair-colouring video` with type `Content-only project / no store item`.
3. Leave Product ID blank.
4. Add timeline entries and at least one media reference.
5. Select reviewed evidence.
6. Select **Create reviewed package**.
7. Open Content Studio.
8. Expected: a `creative_project` source package exists with no product ID and includes long-form, Facebook, Instagram, TikTok and supporting content plans.
9. Confirm all media remains `needs_review`/private until explicitly reviewed.
10. Confirm no catalog product was created.

## 6. Product Release Preflight
1. Run preflight on a product with quantity specials.
2. Confirm the Quantity specials & limited sets stage appears.
3. Run on a set with a shortage.
4. Confirm zero complete availability is shown as a warning rather than silently hidden.
5. Confirm no preflight action changes price, stock, rights or publication state.

## 7. Responsive and accessibility checks
- Desktop: 1440×900 and 1920×1080.
- Tablet: 768×1024.
- Mobile: 390×844 and 360×800.
- Confirm offer rows and component rows stack cleanly.
- Confirm all controls are reachable by keyboard and have visible focus.
- Confirm no text overlaps, no controls extend beyond the viewport, and tables use intentional horizontal scrolling.
- Confirm each affected admin page has one H1.

## 8. Regression checks
- Create/edit/archive an ordinary product with no specials or set.
- Add/remove cart quantities for an ordinary product.
- Create a regular product-backed Content Studio package.
- Edit a Tools & Supplies row and confirm audit/movement history remains.
- Upload and reorder product media.
- Run existing login, checkout, payment and release smoke tests.

## Expected result
Build 220 is acceptable for staging when all sections above pass. Limited public selling still requires the payment/inventory settlement launch gates listed in `PROJECT_STATUS_AND_ROADMAP.md`.
