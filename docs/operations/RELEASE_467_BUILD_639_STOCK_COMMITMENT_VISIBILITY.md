# Devil n Dove 639 — Product Stock & Order Commitment Visibility

## Operator steps

1. **Admin → Products:** find one physical, tracked Product; click **Availability**. Alternatively, open that saved Product in **Product Editor → Price and stock → Review saved stock & order commitments**. New/unsaved Products cannot be looked up.
2. Read the three separate numbers: saved Product on-hand, **qualifying** committed orders and remaining after those orders. A zero in the order view is not proof of zero offsite/legacy holds. An overcommitted or invalid count is clearly flagged.
3. Review optional serialized-piece restrictions and latest finished-lot source records. Neither original lot creation totals nor registered serials can be added to Product stock. These views can overlap canonical order commitments.
4. For missing or invalid canonical order commitment authority, the review is **HOLD**; it does not show guessed remaining stock. Missing optional serial/lot authorities are explicitly marked unavailable.
5. For a physical correction, go to **Count / History** or **Restock**, physically verify the units, and follow those separate confirmation flows. The Build 639 screen itself never saves anything.

## Exact source boundaries

- Canonical `products.inventory_quantity` is saved on-hand stock, not a new count.
- `product_inventory_active_commitments` includes **post-cutover** order lines in `pending`, `paid`, `fulfilled`, `refunded`; cancelled orders are excluded. Refunded does **not** prove returned physical inventory. Pre-cutover orders and external reservations are outside this view.
- Remaining after recorded orders is `max(0, saved on-hand - qualifying commitments)` only for tracked physical Products with valid saved quantity. It is an **upper bound**, not a guarantee that any item can be sold or published. When commitments exceed on-hand, show a warning and do not pretend the deficit vanished.
- `maker_finished_piece_sellability` (if deployed) reports registered, unavailable (reserved/sold/QA restricted) and source-view available serialized pieces. These may overlap orders and cannot be safely added/subtracted from canonical stock a second time.
- Up to six latest `product_finished_inventory_lots` show source lot names/status and **original** creation quantities, not current lot remaining or saleable inventory. Additional lots are explicitly flagged.

## Safety and performance

- Only a verified administrator may explicitly request `GET /api/admin/product-stock-visibility?product_id=...`. It fetches one Product, one qualifying commitment, one optional serialized summary and at most seven optional source lot records; zero reads on page load, no polling or automatic retries, `Cache-Control: no-store`.
- `POST` returns 405. No schema changes, stock/order/lot writes, Etsy/Meta actions, checkout or release changes.
- Current Product Editor input can be unsaved: when entered inventory differs from saved stock, the review points this out without modifying the form.

## Verification

Run `node --test scripts/release467_build639_stock_commitments.test.mjs`. Eleven regression cases cover bounded access, permission checks, missing/invalid commitment proofs, overcommitment, untracked/digital Products, optional source failures, no writes, explicit UI action and no polling. The existing application quality and migration/performance gates remain required. Production GREEN requires GitHub development and production checks including live Cloudflare Pages and resource proof.
