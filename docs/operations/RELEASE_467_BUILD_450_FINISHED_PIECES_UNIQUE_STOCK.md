# Release 467 — Build 450: Finished Pieces, Variants & Unique Inventory

## Scope and working boundaries

Build 450 links the **actual, human-approved Build 447 quality output** to existing Products and canonical physical inventory. In [Admin → Finished Pieces](/admin/finished-pieces/) owners can:

1. Select an actual Quality-linked physical Product with existing stock; register each accepted **individual serial/identifier** with optional edition, variant label and existing finished lot provenance.
2. Reserve a unique piece for Storefront, Etsy (manual), local or another channel, and release an unused hold with a new immutable receipt. Database transitions reject double reservation and overcommitment. The public catalogue, detail API, preflight checkout and checkout D1 triggers respect registered pieces and offsite holds.
3. Match a physical serial to a **real, matching, paid or fulfilled** local order item. This is evidence, not a payment or provider claim. A sold serial is not automatically restocked by a refund.
4. Reference **actual canonical order component lines** for existing Product bundles. The kit proof verifies same order, configured component identity and quantities; it cannot invent component consumption or post a second debit. If an order has no actual component lines, leave its kit reconciliation **HOLD** until corrected in the authoritative order flow.

The earlier Build 440 `product_inventory_active_commitments` remains the authority for downstream Product/order commitments; `products.inventory_quantity` is the physical stock quantity. Build 450 has **no new stock movement ledger**, no Product quantity writes and no Etsy/Meta shipping, payment, publication or external-sale writes. The existing Product bundle settings and component reservation flow remain authoritative. U.S. sales/shipping suspension stays in effect.

## Database safety

Canonical migration `0046_release467_finished_pieces_unique_allocation.sql` adds append-only `maker_finished_pieces`, `maker_finished_piece_claims`, `maker_finished_kit_component_links` plus `maker_finished_piece_sellability` view and checkout/stock guards. D1 checks:

- QA link, newest human approval, real safe first/second quality outcome and actual physical tracked stock are mandatory. Serial count cannot exceed attempt accepted quantity or Product inventory. A rejected/scrapped/learning-only piece cannot be registered.
- Serial and request keys are unique, source lot must match and be available, and prior data cannot be overwritten or deleted.
- New reservation must have remaining uncommitted Product capacity; a reserved or sold serial cannot be reserved again. Released events must follow a hold from the same channel. A sale must reference a genuine paid/fulfilled one-unit order line for that Product.
- Storefront checkout conflicts cancel the incomplete parent order and reject the conflicting line; checkout preflight returns a customer-facing `409`.
- Kit proof never alters stock and only accepts existing component lines of the same order that match the configured kit recipe. Component order line IDs cannot be reused across kits.

These operations add D1 metadata and immutable trace evidence only. Owners must perform real restocks and external channel deactivations in the existing stock/provider workspaces; a release receipt does **not** notify Etsy.

## Verification and acceptance

Run locally and in `Current Application Quality Proof`:

```sh
python scripts/release467_build450_finished_pieces_sql_regression.py
node --check functions/api/admin/finished-pieces.js
node --check public/js/admin-finished-pieces.js
node --check functions/api/checkout-create-order.js
node --check functions/api/products.js
node --check functions/api/product-detail.js
```

Independent SQL fixture tests include safe unique one-off vs unsafe reject, actual accepted quantity, lot mismatch, serial uniqueness, double cross-channel hold, checkout race with safe cancellation, release/retry, genuine paid sale once, duplicate paid-sale rejection, exact multi-component kit links and no Product stock quantity mutation. The release is not GREEN until Dev and Main mandatory checks, migration 0046 and exact-tree Cloudflare Production smoke finish. Provider-authorized Etsy stock synchronisation and physical inventory reconciliation remain separate **OWNER ACCEPTANCE** tasks.

## Forward handoff

**Next: Build 451 — Maker Photography, Videos & Product Stories.** Reuse Build 450 serial IDs, Build 447 QA, and Build 444 canonical media roles; never turn a private project or rejected attempt into public content.
