# Devil n Dove Build 658 — Real Tool/Supply Counts, Lot Custody & Private Independent Review

**Scope:** Active original `site_item_inventory` **Tool/Supply** records, existing `site_inventory_base_balances`, and source purchase lots. This build supplements the existing Build 440 Inventory Integrity and Release 461 base-unit stock lifecycle; it does **not** replace their quantity authorities.

## How to use the new desk

1. As an active Storefront Admin, visit **Admin → Inventory Operations → Physical count & independent review**, or `/admin/physical-stock/`. Choose a Tool/Supply search and click **Load up to 80 original items**. Select a real item and deliberately click **Inspect**.
2. Check the original usable/base-unit quantity, purchase-unit conversion, reservations and incoming stock. Read the latest 25 original lot records, their storage locations and expiry/status. The response also checks the count and total purchase-lot quantity. Source records remain authoritative; older uninspected lot records hold approval.
3. Physically count stock in the **displayed base unit** (for example, grams of usable wax, not bags). Record the actual observation time (within seven days), observed workshop location, an optional inspected source lot ID and a detailed factual note. Confirm personal observation; click **Save one physical count**. This produces an authenticated owner-attested private receipt—not a stock correction.
4. Sign in using a **different real active Storefront Admin account**. Reinspect the same item and source facts. Choose **HOLD**, **Recount required** or **Approve count evidence**, record what was independently checked and save one separate review receipt. The original counter's account is rejected from approving their own count.
5. If approved, the desk displays a `DD-B658:<count_receipt_id>` cross-reference. A discrepancy remains **APPROVED_CORRECTION_PENDING_CANONICAL_POST**. An authorized operator must separately use the original Inventory Operations posting/correction workflow, cite the source receipt, verify original movement and unit conversion and independently check the updated balance and lots. **The Build 658 desk does not do any posting or assert that an external correction happened.**
6. If a submission times out, use **Check original uncertain receipt** for its original request key before deciding whether further manual action is necessary. The client never auto-retries or auto-loads sensitive stock on page opening.

## What is protected

| Condition | Response |
| --- | --- |
| Missing original source, inactive or Product-owned item | No private count or automatic conversion to Product stock |
| Missing Release 461 base-unit balance | HOLD: no invented current quantity or runtime database repair |
| Source, base balance or lot facts change between inspection and Save | Source-revision 409: reload and recount or re-evaluate |
| Base-unit and purchase-unit quantities disagree | HOLD, reconcile original Inventory authority first |
| More than 25 lots; incomplete custody inspection | Approval rejected; HOLD allowed |
| Remaining quantity in a quarantined, consumed, returned or expired lot | Approval rejected; original lot custody investigation needed |
| Source purchase-lot totals do not match base on-hand | Approval rejected; investigate original lots |
| Count below original reserved base stock | Approval rejected; investigate prior commitments |
| Review attempted by same counter account | Access denied; second *distinct active Admin account* required |
| Second review already recorded for the current count | Cannot overwrite decision; any new count requires a new observation and receipt |
| Concurrent journal update or duplicate request | Compare-and-swap conflict or original-key idempotent receipt; never overwrite or auto-retry |

The private per-item journal uses `app_settings` key `site.admin.physical_stock.v658.<site_item_inventory_id>` with `is_public=0`. Receipts contain original source revision, base quantity, variance, source lot scope, actor identity, observation time, notes, independent review decision and original-key recovery. Each item retains up to 70 receipts and rejects an invalid/public journal. A successful private receipt is read back before the API reports success. Audit failure is explicitly disclosed without duplicating a saved record.

**Critical limitations:** The two Admin accounts are ordinary role-verified account attestations, **not independently witnessed owner signatures**. Purchase-lot consistency is a separate custody check and cannot prove each older lot was physically inspected. Approval does not change the canonical `last_counted_at` or `on_hand_quantity`, and a later actual stock movement requires its own source evidence, accounting review where applicable and base-unit consistency. Existing historical Build 440 physical count actions remain separately available; this desk does not claim to prohibit or retrospectively certify all older corrections. No public Product, sale, tax, supplier, posting, Comms, AI Data Platform or Master Shell completion percentage is produced here. Independent readiness remains **HOLD / UNKNOWN**.

## Runtime budget archival verification

Four historical standalone clients were statically checked against all `admin`, `public`, `functions`, `js`, `css`, `scripts` and `.github` application/workflow sources. No current active runtime reference or quality gate reference was found. Source files were moved byte-for-byte into operations history for recovery; no active page imagery, product source or installed provider code was changed.

| Recoverable source archive | SHA-256 before/after archival |
| --- | --- |
| `historical/RETIRED_UNREFERENCED_EVENTS_PAGE.js.txt` | `2a50378160108f18a86ac0961bebb900f149baee4e4266abd79ecf68d881ecf8` |
| `historical/RETIRED_UNREFERENCED_MEMBER_REVIEWS.js.txt` | `c3a0168224e6d1cea6f8d5e136a1929902ff4ecd8c322fbc39cc751c1b9096c4` |
| `historical/RETIRED_UNREFERENCED_PICKUP_PAGE.js.txt` | `a4b93b22f675e8c0d4d7f3c6ee96344e9489e1f4efd9d1f8b50388b78b123d1e` |
| `historical/RETIRED_UNREFERENCED_BRAND_FLOW_BANNERS_256_265.js.txt` | `5c4adc3e592f5cdb56f8e7eb34939b98498cf736570ab6cd471e38402dc96712` |

## Verification

- `node --test scripts/release467_build658_physical_stock_reconciliation.test.mjs` — 16 tests for source facts, bad counts, authorization, second reviewer, lot/reservation HOLD, source drift, protected journal, no inventory writes, uncertain receipt and UI.
- `node scripts/release467_build556_admin_interface_inventory.mjs --check` — deterministic Admin route inventory.
- `python scripts/current_application_quality_gate.py` — existing current application quality.
- `python scripts/release465_performance_budget_gate.py` — unchanged active-runtime byte/file ceiling.

**Next proposed Build 659:** Product Catalogue, Media, End Products & Dovlin Production Readiness. Actual sample approval, image rights, brand-faithful Dovlin design and customer-safe product release evidence remain separate.
