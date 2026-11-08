# Devil n Dove — Build 638: Product Inventory Adjustment History & Count Reconciliation

## Owner process

1. Open **Admin → Products**. For a tracked, physical Product with Draft or Active status, choose **Count / History**. This deliberately reads that Product's current saved stock and a bounded view of selected existing Admin audit records.
2. Review the displayed events, dates, source notes and known quantity changes. **History is incomplete**: old manual Product Editor writes may not record before/after quantities, some stock actions may have no audit event, and this is not an independently complete inventory ledger. No events found is not proof of no prior changes.
3. Physically count finished units (whole units from 0 to 1,000,000) and write a factual note explaining the count or discrepancy. Do not use this tool to receive supply lots, reverse production, or change orders.
4. Press **Preview saved vs counted**. The server reads the current Product again and returns the saved count, the physical count, and the difference. An equal count creates no correction. Reductions must verify existing active order commitments from the Build 440 view; unavailable proof or a count below committed units blocks the correction.
5. Review the preview, especially the Active storefront-availability warning. Tick the owner acknowledgement and press **Confirm reviewed stock correction** exactly once. The server requires an unchanged five-minute Product snapshot and performs one conditional stock UPDATE; it rechecks commitments in SQL on decreases, and verifies the saved count before reporting success.
6. A successful correction records a synchronous existing `admin_action_audit` event. If its audit insert fails after stock was saved, the response explicitly reports **stock saved / audit unconfirmed**—never repeat the same Save. Refresh the actual stock and history, and refresh the Product Browser before a new adjustment.

## Security and source-of-truth boundary

- API: `GET|POST /api/admin/product-inventory-reconciliation`, using the established verified module-admin session with active user ID. A cross-origin POST is rejected. GET accepts one positive Product ID; no automatic history read on page load.
- GET reads one Product record and at most 40 relevant `admin_action_audit` entries, returning at most 20 filtered stock-related entries. The read is not a complete stock ledger; Product Editor events without explicit stock change are excluded. No request-time table creation, migration or media/provider action.
- POST accepts only `preview` or `apply`, a Product ID, integer physical count 0–1,000,000, and a factual count note of 8–240 characters. Unknown fields and unauthorized requests are rejected. Apply additionally requires the exact owner acknowledgement and recent original snapshot.
- Eligible Products are tracked physical draft/active records with valid saved integer stock. Decreases require available `product_inventory_active_commitments` proof and an atomic conditional constraint not to reduce below committed units. Existing Build 440 triggers remain intact; race/trigger failures block the update.
- No Product publication, checkout, customer contact, supplier purchasing, R2/asset access, inventory lot creation, finished-lot provenance mutation, or Etsy/Meta synchronization. The Product quantity itself may affect our own storefront availability after explicit owner Save.
- Historical completeness is explicitly unknown, and no prior stock records are backfilled or invented. This build reuses the deployed audit table, avoiding a speculative production schema migration.
- The performance budget is reviewed for exactly two new runtime files (the guarded endpoint and on-demand client): measured 18,508,918 bytes / 1,843 files; source cap from 18,487,000 to 18,517,000 (+30,000 bytes), with 8,082 bytes headroom. All other limits remain unchanged.

## Verification

```text
node --test scripts/release467_build638_inventory_count_history.test.mjs
node --test scripts/release467_build637_low_stock_restock.test.mjs
python3 scripts/current_application_quality_gate.py
python3 scripts/migration_policy_gate.py
python3 scripts/release465_performance_budget_gate.py
node scripts/release467_build556_admin_interface_inventory.mjs --check
node --check functions/api/admin/product-inventory-reconciliation.js
node --check public/js/admin-product-count-history-638.js
```

Required protected PR, `dev` development deployment, production `main`, Cloudflare Pages and independent live-resource proof must be GREEN before closure. Synthetic tests do not modify owner inventory. Production GREEN proves code deployment, not a physical count independently performed by Ree or Jack.

**Next proposed Build 639:** Product Stock & Order Commitment Visibility.
