# Build 195 Product Lifecycle, System Number, SKU, and Inventory Description Testing Guide

Use this after deploying Build 195 and running `database_build195_product_lifecycle_sku_inventory_cards.sql`.

This guide tests only non-sensitive data. Use a clearly named draft such as `ZZ TEST — DELETE ME — Build 195` and do not attach a real customer order, payment, shipping record, or public photo.

## Before starting

1. Deploy Build 195 to Cloudflare Pages.
2. Open Cloudflare Pages deployment details and confirm the current production deployment completed successfully.
3. In D1, run the Build 195 migration once:

   ```text
   database_build195_product_lifecycle_sku_inventory_cards.sql
   ```

4. In a private/incognito browser window, open:

   ```text
   /api/auth/login
   ```

5. Expected result: JSON, not a homepage and not a 405 response.
6. Sign in as an administrator.

## Test A — Create a product with automatic System # and SKU

1. Go to `/admin/products/` on desktop.
2. Choose **Create product**.
3. Enter a clearly temporary name:

   ```text
   ZZ TEST — DELETE ME — Build 195
   ```

4. Enter a small test price, such as CAD $1.00.
5. Leave the SKU field blank.
6. Save as a draft. Do not make it public or add it to an order.
7. Expected result:
   - The success message shows a System # in the form `DD1000` or higher.
   - The saved product has an SKU in the form `DND-01000` or higher.
   - The System # and SKU appear only once in product lists.
8. Write down the System # and SKU in a private note.

### Pass condition

The product receives a unique System # and an automatic `DND-xxxxx` SKU without typing an SKU manually.

## Test B — Delete an unused incorrectly entered product

1. Stay on the product list or reopen the temporary test product.
2. Choose **Delete unused**.
3. Read the warning. Only continue if this is the temporary test product and it has no customer/order history.
4. Enter a short factual reason, such as:

   ```text
   Test product entered to verify Build 195 deletion flow.
   ```

5. Type the confirmation phrase exactly:

   ```text
   DELETE PRODUCT
   ```

6. Enter the current administrator password when prompted.
7. Confirm deletion.
8. Expected result:
   - The product disappears from the active/draft product list.
   - A success message confirms deletion.
   - There is no raw database error.
   - A future support/admin audit can see that a product was deleted and why.

### If deletion is blocked

That is expected if the product has any order/history/reference record. Do not try to work around the block.

1. Go back to the product editor.
2. Change product status to **Archived**.
3. Save.
4. Keep the product out of storefront listings while preserving its business history.

### Pass condition

An unused test product deletes only after password, reason, and exact phrase. A referenced product is blocked and the UI tells us to archive it.

## Test C — Confirm product numbers are not reused

1. Create another temporary draft called:

   ```text
   ZZ TEST — NUMBER CHECK — Build 195
   ```

2. Leave SKU blank again.
3. Save.
4. Compare its System # with the System # recorded in Test A.
5. Expected result:
   - The new System # is greater than the deleted product’s System #.
   - The old System # was not reused.
   - The automatic SKU uses the new larger number.
6. Delete this second temporary draft using Test B, or archive it if it gained any references.

### Pass condition

System numbers keep moving forward even when the highest prior unused product was deleted.

## Test D — Confirm a custom SKU must be unique

1. Create a temporary draft with a custom SKU such as:

   ```text
   ZZ-B195-UNIQUE-01
   ```

2. Save it.
3. Attempt to create another temporary draft using the exact same custom SKU.
4. Expected result:
   - The second save is rejected with a clear unique-SKU message.
   - The first product remains unchanged.
5. Delete or archive both temporary records using the same safe rules.

### Pass condition

Custom SKUs are allowed but cannot be duplicated.

## Test E — Add a tool/consumable description below the picture

1. Go to `/admin/site-item-inventory/`.
2. Select one non-sensitive test item, preferably one with a long name and a photo.
3. Open its edit form.
4. Find **Item description shown below picture**.
5. Enter a short useful description, for example:

   ```text
   Hand cleaner used at the resin and clay bench. Citrus scent; store closed between uses.
   ```

6. Save.
7. Return to the inventory table/list.
8. Expected result on desktop:
   - The photo stays at the left of the item card/cell.
   - The new description appears directly below the photo.
   - The item name remains a readable title rather than breaking one word per row.
   - The table may scroll horizontally on smaller desktop widths rather than crushing the title.
9. Expected result on phone:
   - The item card remains readable without overlapping the image or buttons.
   - The description remains below the picture.
   - The page can scroll horizontally only inside the inventory table area when necessary.

### Pass condition

Long inventory names read as normal phrases and the separate description appears underneath the image.

## Test F — Final deployment checks

1. Open `/admin/deployment-preflight/`.
2. Run the current preflight refresh.
3. Confirm Build 195 shows no required-file/schema blocker.
4. Open `/admin/command-center/` and make sure core cards still load.
5. Open `/admin/mobile-product/` on a phone and confirm no new horizontal overlap.
6. Clear or archive all test records created during this guide.

## What to report back

For any failed step, send:

1. The page URL/path.
2. The exact error message.
3. A screenshot with passwords, order numbers, customer emails, and API keys covered/removed.
4. Whether it was desktop or phone.
5. Browser name and approximate screen size.

Do not share your administrator password, Stripe keys, Cloudflare secrets, customer data, or private media links.
