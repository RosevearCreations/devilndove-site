# Devil n Dove Build 640 — Stock Exception Inbox & Restock Planning

## How we use it

1. Open **Admin → Products → Stock Exception Inbox & Restock Planning**. This is an explicit operator review; the inbox performs **no extra database scan on page load**.
2. Click **Start fresh exception scan (20 Products)**. Each request reads at most 20 tracked physical active/draft Products plus one lookahead Product for pagination, against the canonical qualifying-order commitment view. The list ranks exceptions **within scanned Products only**, never claims global completeness or priority.
3. Review these evidence-based exception types:
   - **Source HOLD:** missing, negative or otherwise invalid Product on-hand number; no replenishment quantity is proposed.
   - **Overcommitted:** qualifying order commitments exceed saved Product stock.
   - **Unavailable:** zero units remain after qualifying commitments.
   - **Low:** 1–2 units remain after commitments.
4. Click **Scan next 20** to review more Products. Pages are requested one at a time with descending Product ID cursor; no background or automatic all-catalog reads. If a scan or view fails, the inbox and draft are cleared to HOLD instead of silently guessing.
5. Click **Add to draft** on a verified exception. Enter a proposed whole-unit quantity (1–100,000), a possible workshop/supplier/investigation source, and a factual 8–240-character note. Click **Prepare review text**, verify it, then **Copy reviewed text** or manually copy the text if clipboard permission is unavailable.
6. This draft exists **only in the current browser memory**. It is not an approved purchase order, production traveler, inventory transaction or durable task. Before changing stock, inspect actual stock, order commitments and material sources again; use the separate owner-reviewed **Restock** or **Count / History** workflow.

## Source and safety contract

- `GET /api/admin/product-stock-exceptions` requires a verified active administrator. An optional server-issued `cursor` advances pages. `POST` is denied with HTTP 405.
- One bounded SQL CTE cohort joins the existing `product_inventory_active_commitments` view. That view counts **qualifying post-cutover** pending, paid, fulfilled and refunded order lines; it excludes cancelled orders, pre-cutover orders and offsite/channel holds. Refunded orders remain committed until independent return/restock proof. There is no statement that all reservations are counted.
- Review target is **3 units remaining after those recorded order commitments**. Prompted additional units = max(0, 3 + qualifying committed − saved Product on-hand). This is arithmetic guidance, **not an auto-purchase or guaranteed sellable stock**.
- Archived/untracked/digital Products and any additional serial/lot restriction evidence are outside the scan. The separate Build 639 **Availability** review shows serial and lot source details for one Product, and can reveal additional restrictions.
- Results are not persisted or sent to suppliers. No migrations, stock/order/lot/financial/provider writes, automatic retries, timers, R2 listings or Etsy/Meta calls.

## Acceptance and verification

`node --test scripts/release467_build640_stock_exception_inbox.test.mjs` covers nine cases: classification, arithmetic, source HOLD, bounded pagination, admin access, read-only endpoint, explicit-click UI, failure reset and valid local plan/copy lifecycle. CI keeps all existing Product regression tests, full current application quality, route inventory, performance and migration/security checks.

Development and production are GREEN only after their separate GitHub checks/deployments finish, including live Cloudflare Pages and resource integrity.
