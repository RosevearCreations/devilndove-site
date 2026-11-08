# Devil n Dove Release 467 — Build 637: Inventory Low-Stock Review & Restock Shortcuts

## Owner steps

1. Open **Admin → Products**. Use the new **Finished stock** filter to show **Needs attention (0–2)**, **Low (1–2)**, **Out of stock (0)**, **Tracked**, or **Not tracked**. These are server filters across all matching Products, not just the visible page. Search/category/photo filters and stable sort still work together.
2. Inspect the visible stock badge. For a tracked physical draft/active Product, press **Restock**. Products with tracking disabled, archived Products and digital Products are not eligible for this shortcut. For supply material/lots, use the separate Inventory Operations workflows.
3. Count the actual **finished** units, enter **1–1000 whole units received**, and record a factual receipt or physical count note of 8–240 characters. This does not submit a supplier order or receive raw materials.
4. Press **Preview fresh stock**. This reads the exact saved Product and displays the before count, proposed addition and resulting total, plus a warning when the Product is active. Nothing has been written.
5. Only after checking the Product and actual stock, tick the owner acknowledgement and press **Confirm and add reviewed units**. An active Product may show higher availability in our own storefront immediately. No Etsy, Meta or external provider synchronization is triggered.
6. Following confirmed Save, press **Refresh** for a fresh Product list. On a stale, rejected, expired or uncertain result, stop; Refresh and check the original stock before starting a new Preview. **Never press the same Save again automatically**.

## Technical contract and restrictions

- `GET /api/admin/product-browser?stock=attention|low|out|tracked|untracked|all`: admin-only, one bounded Products-table SELECT. No joins, extra media/lot reads, background timers or retries. Low threshold remains consistent with Product `low_stock_flag` (`<=2`). Untracked and disabled Products are never silently treated as stock-ready.
- `POST /api/admin/product-restock-review` requires established admin module access. Only `action=preview` and `action=apply`; exactly one positive Product ID, 1–1000 whole units, and a factual note. Unknown request fields, incorrect types and unauthorized calls fail closed.
- Only `inventory_tracking=1`, `product_type=physical`, `status=draft|active`, whole nonnegative current stock and a maximum total of 1,000,000 are eligible.
- Preview is read-only. Apply requires a current five-minute snapshot, exact original identity/status/tracking/quantity/updated timestamp, the explicit `I VERIFIED PHYSICAL STOCK` acknowledgement and a single conditional SQLite UPDATE plus readback. A repeated or stale request cannot reapply the same increment. A blocked/uncertain write needs manual verification before retry.
- Successful Apply schedules the existing `admin_action_audit` event with before, increment, after and factual note. It is not a supplier-receiving or independently signed receipt and should not be represented as one.
- No migration, Product data rewrite at deployment, inventory supply lot adjustment, automatic marketplace publication or device/customer communication. This build does not alter external channel quantities.
- The performance limit is explicitly reviewed: observed runtime 18,480,812 bytes / 1,841 files, with only the new guarded endpoint increasing file count by one. The source-byte cap rises from 18,462,000 to 18,487,000 (+25,000), leaving 6,188 bytes of headroom; all other limits remain unchanged.

## Release verification

```text
node --test scripts/release467_build635_product_catalog_filters.test.mjs scripts/release467_build636_bulk_draft_review.test.mjs scripts/release467_build637_low_stock_restock.test.mjs
node --check public/js/admin-products-browser-v162.js
node --check functions/api/admin/product-restock-review.js
python3 scripts/current_application_quality_gate.py
python3 scripts/migration_policy_gate.py
python3 scripts/release465_performance_budget_gate.py
node scripts/release467_build556_admin_interface_inventory.mjs --check
```

Production GREEN requires the protected `dev` tests and deployment, then a separate protected `main` merge, Cloudflare Pages deployment and live-resource proof. It verifies deployment, not an actual owner count or a test stock write to production.

**Next proposed Build 638:** Product Inventory Adjustment History & Count Reconciliation.
