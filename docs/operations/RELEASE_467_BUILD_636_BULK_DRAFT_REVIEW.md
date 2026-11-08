# Devil n Dove Release 467 — Build 636: Product Bulk Edit Review & Safe Draft Workflow

## Owner workflow

1. Open **Admin → Products**. Search/filter Products as usual, and use each row's **Select draft for bulk review** checkbox. Selection can span pages but is limited to eight drafts per batch. Non-draft Products cannot be selected.
2. In **Bulk draft changes — review first**, choose a new category and/or draft review state. Available review states are **Pending review** and **Needs changes**, never Approved or Published.
3. Press **Preview selected drafts**. The server reads only those selected Product records and returns the actual saved **Before** and proposed **After** values. This makes no writes.
4. Verify every line and check the owner acknowledgement. Only then can **Confirm and save reviewed draft changes** send one deliberately confirmed Apply request. The server requires the unmodified recent preview and checks every original value before it can update any row. A category change always forces Needs changes.
5. A fully confirmed write reports the number of saved drafts. Press **Refresh** to verify live Product rows. A stale, rejected or uncertain outcome places the flow on HOLD; Refresh and repeat original selection/Preview instead of sending the previous write again.

## Contract and security

- API: `POST /api/admin/product-bulk-draft` under the existing route guard; role must be admin. Actions `preview` (read-only) and `apply` (explicit write) only.
- 1–8 unique positive Product IDs; one bounded Products-table SELECT per action. No catalog scan, joins, new migrations, media, R2 or external provider requests.
- Allowed changes: `product_category` in Jewelry, Earrings, Rings, Necklaces, Other; `review_status` in pending_review/needs_changes. Unknown fields and status advancement are rejected. No Products in a non-draft status can participate.
- A recent five-minute preview, exact original name/status/category/review/timestamp, explicit checkbox acknowledgement, and one all-or-none conditional SQLite UPDATE are required. The whole batch remains unchanged if any snapshot no longer matches at write time. Unexpected write/readback results require fresh read and manual review, with no automatic retry.
- `updated_at` timestamps and saved original values provide optimistic concurrency on the allowed draft fields; no claim of independent signed owner consent. An audit event is scheduled for a confirmed update through the existing admin audit service.
- No actual Product records are altered during code deployment or synthetic tests. Production GREEN certifies software deployment, not a real owner bulk-update acceptance or marketplace publication.

## Tests and release requirements

```text
node --test scripts/release467_build636_bulk_draft_review.test.mjs
node --test scripts/release467_build635_product_catalog_filters.test.mjs
python3 scripts/current_application_quality_gate.py
python3 scripts/migration_policy_gate.py
python3 scripts/release465_performance_budget_gate.py
node scripts/release467_build556_admin_interface_inventory.mjs --check
node --check public/js/admin-products-browser-v162.js
node --check functions/api/admin/product-bulk-draft.js
```

Review the one extra runtime file and source budget increase (+22,000 bytes, from 18,440,000 to 18,462,000). The runtime file cap rises only from 1,839 to 1,840, with other guardrails unchanged. Protected `dev`, production `main`, Cloudflare Pages and live-resource checks must all be GREEN.

**Next proposed Build 637:** Inventory Low-Stock Review & Restock Shortcuts.
