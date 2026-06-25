# Build 196 — Product Correction, Raw Material Return, and Inventory Display Guide

Use this guide when a finished product was created by mistake, is unfinished, or needs to be removed before it has any customer/order history.

## Before using deletion

Only use **Delete unused product and apply reviewed inventory actions** when all of this is true:

1. The product was entered incorrectly, is a duplicate, or was abandoned before sale.
2. It has not been ordered, paid for, recalled, or used in customer/business history.
3. We have checked the linked raw materials.
4. We know whether each raw item was only reserved or was physically removed from stock.

If the product was sold, paid, shipped, quoted, reviewed, recalled, or otherwise referenced, use **Archive** instead. Archive removes it from active storefront use while preserving history.

## Exact steps — delete an incorrect unused product and return raw materials

1. Sign in as an admin.
2. Open:

   ```text
   /admin/products/
   ```

3. In **Product editor**, use **Load existing product** and choose the incorrect product.
4. Select **Load product into editor**.
5. Beside the **Update Product** button, choose:

   ```text
   Correct / return raw inventory
   ```

6. Review each linked raw-inventory line.

### What the two inventory choices mean

| Choice | Use it when | What changes |
|---|---|---|
| **Release reservation** | The raw item was reserved for this product but was not physically consumed | Reduces `Reserved`; does not alter `On hand`. The material becomes available again. |
| **Return unused physical stock** | Raw supplies were physically removed from on-hand inventory but are now unused and have been put back | Adds whole stock units back to `On hand`. |
| Leave both as `0` | The item was never reserved/consumed here, is a tool, or needs a manual stock review | No stock change is made. |

7. Enter only factual quantities. The app does **not** guess whether material was used.
8. Enter a reason, such as:

   ```text
   Duplicate product entry; clay and findings were returned unused.
   ```

9. Choose **Delete unused product and apply reviewed inventory actions**.
10. Confirm the summary.
11. Type exactly:

   ```text
   DELETE PRODUCT
   ```

12. Enter the current admin password.
13. Confirm the success message.
14. Open:

   ```text
   /admin/site-item-inventory/
   ```

15. Search the affected raw items. Confirm the expected `On hand` and `Reserved` values.
16. Review **Recent Inventory Movements**. The movement note should identify the product correction/delete.

## Important safety notes

- Releasing a reservation and returning physical stock are different actions.
- The app can safely release only the quantity currently reserved.
- The app only allows physical stock return through this panel for linked **supplies**. Tools normally should not be consumed; release a reservation only if one exists.
- For materials tracked as partial usage units, end-of-lot, or story-only links, check the actual stock count manually before making any adjustment.
- Product images are not automatically deleted from R2 because the same file might be used elsewhere.
- A deleted product creates both a `product_deletion_audit` record and `product_material_return_audit` records when inventory changes were chosen.

## If the correction panel says deletion is unavailable

That means the product has retained business/history references. Use **Archive** instead:

1. Leave raw-material quantities unchanged unless you can confirm a specific reservation or unused physical return.
2. Change the product status to `Archived` in the editor.
3. Choose **Update Product**.
4. Keep the record so orders, accounting, and customer history remain correct.

## Inventory display change

In **Tools & Supplies Inventory Operations**, the layout now shows:

```text
picture
item name directly below picture
```

The extra short-description text is no longer rendered below the picture. Existing legacy description data remains preserved but is not shown or overwritten during ordinary item edits.

## Test checklist

1. Create a test draft product.
2. Link one supply.
3. Reserve one unit through the existing resource action.
4. Load the product, open the correction panel, and confirm the suggested release is no more than the reserved quantity.
5. Delete the product with a reservation release only.
6. Confirm `Reserved` decreases and `On hand` does not change.
7. Create a second test draft product linked to a supply.
8. Use a small factual test quantity in **Return unused physical stock**.
9. Delete and confirm `On hand` increases by that amount.
10. Confirm the product’s System # is not reused by the next test product.
11. Open raw inventory on desktop and phone. Confirm the item name appears beneath the image without a description block.
