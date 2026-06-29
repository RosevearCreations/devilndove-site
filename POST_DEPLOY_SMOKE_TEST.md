# Post-Deploy Smoke Test — Build 198

Run after the Build 198 D1 migration and Pages deployment. Test on the deployed domain while signed in as an administrator. Record date, user, browser/device width, product/inventory test IDs, and any Cloudflare request/error IDs.

## 1. Migration and admin resilience

1. Confirm `schema_migration_ledger` contains `build_198_inventory_editor_featured_media_integrity`.
2. Open `/admin/operations/`. The earlier helper calls (`community-content`, `live-readiness-playbook`, `custom-requests`, and `social-post-queue`) must return JSON, not Cloudflare 503. A signed-out 401 is normal; a `degraded: true` response means investigate optional data/schema rather than treating the screen as broken.

## 2. Full inventory editing — desktop and phone

1. Open `/admin/inventory-operations/` and select a disposable existing item.
2. Use **Edit full record** in the first item column. At phone width, this button must remain available even though the far-right action column is hidden.
3. Change item description, on-hand quantity, unit cost, supplier, reorder rules, and image URL. Press **Save Changes to This Item**.
4. Reload/search the list and confirm the same `site_item_inventory_id` changed. There must be no duplicate inventory row.
5. Add one disposable item. After the first save, confirm it remains in full edit mode. Change quantity/cost and save again; confirm it remains one record.
6. Confirm source type and external key are stable for an existing record, protecting linked finished-product resource history.

## 3. Featured image and preserved media

1. Pick a product with at least three retained image rows. Note its current image URLs and order.
2. In Catalog, leave the Featured Image URL blank and save without deleting media. Reload the product: the first retained image must now populate Featured Image URL.
3. Explicitly set a different existing gallery image as featured, save, and reload. It must be first in the returned gallery order and match `products.featured_image_url`.
4. Approve the product. Reload it and verify the featured field is still present and every photo/video/link remains.
5. Use the dedicated media editor to remove exactly one disposable image row and save. Reload and confirm only that selected row disappeared. Confirm no R2 source object was automatically deleted.

## 4. Existing Build 197 protections

1. Change Additional Colours to `Blue, Green`, save, and reload.
2. Try a duplicate SKU/slug on a disposable draft; the editor should show a resolvable conflict without continuously retrying.
3. Check Shop at approximately 360 px, 768 px, 1024 px, and desktop width. Product facts remain below the image and phone navigation opens as a compact accordion/popup.
4. For one public product, confirm one visible H1, truthful visible price/availability, canonical URL, useful title/meta description, and meaningful lead-image alt text.

A locally successful package is not proof of Cloudflare bindings, D1 data, R2 access, Stripe, email, Search Console, or Google Business Profile behaviour. Those need live evidence.
