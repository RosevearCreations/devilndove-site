# Sanity Health Check — Build 196

## Practical result

- Incorrect unused product: load it into the editor, open **Correct / return raw inventory**, review linked materials, choose factual reservation release and/or raw supply return quantities, then confirm deletion.
- Ordered/referenced product: archive, never permanently delete.
- Reservation release: decreases reserved stock only.
- Physical raw-supply return: increases on-hand stock only after explicit review.
- Inventory cards: item name appears below image; the old description block is not rendered.

## Owner testing

Follow `BUILD196_PRODUCT_CORRECTION_MATERIAL_RETURN_GUIDE.md` after applying Build 196 migration and redeploying.

## Still live-only

- Verify real raw stock counts before any physical return.
- Verify R2/media, Stripe, email, Search Console, GBP, and real-device evidence in the deployed site.
