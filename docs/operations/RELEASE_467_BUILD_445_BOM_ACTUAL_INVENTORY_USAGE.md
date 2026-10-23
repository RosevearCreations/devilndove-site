# Devil n Dove — Release 467, Build 445

**Bill of Materials & Actual Inventory Usage**

## Source authorities and scope

Build 445 introduces `/admin/project-bom/` and `/api/admin/project-bom` for a readable project BOM, one source-linked planned line per explicit operator action, and classification of **already-posted** Creative Process Inventory movements. It does not introduce a parallel inventory ledger or double-post stock.

| Concern | Authoritative source |
| --- | --- |
| Inventory identity, on-hand, available and unit conversion | `site_item_inventory` and `site_inventory_usage_profiles` |
| Supplier purchase lot, quantity remaining, expiry, supplier | `inventory_purchase_lots` (BOM lot selection is provenance only) |
| Process and workstation | `creative_project_operations`, `inventory_processes`, `inventory_workstation_memberships` |
| Reserved vs. released stock | `creative_project_material_reservations` (Build 380, canonical triggers) |
| Real used usable units and deducted stock units | `creative_project_inventory_posts`, `creative_project_inventory_usage_details`, `site_inventory_movements` (Creative Process) |
| Actual returned stock | `creative_project_inventory_reversals` and existing Inventory reversal movements |
| New project BOM plan | `maker_project_bom_lines` |
| Immutable classifications of canonical actual postings | `maker_project_bom_actual_links` (unique per canonical post) |

Forward-only migration: `migrations/canonical/0041_release467_project_bom_actual_usage.sql`. No historical stock, reservation, lot, product, financial, Etsy or publishing records are modified by this migration.

## Operator workflow (all writes intentional)

1. Open Admin → **Project BOM & Actual Usage**. Choose an existing, non-archived Creative Project.
2. Search canonical Supply Inventory, choose an item, optionally bind it to a real project operation and an existing purchase lot, and enter the **planned quantity in usable units** (e.g. grams; not whole resin bottles). Save a reason. This creates a plan only.
3. Check live availability, reserve required stock in **Materials & Costing** if needed, and release just the reserved portion before recording its actual consumption. Reservation retains a separate Inventory movement receipt.
4. In **Creative Process**, log actual partial material use. Its existing approved Inventory workflow performs the one and only on-hand deduction and records immutable usable-unit and stock-unit movement evidence. Never enter imaginary test consumption on Production.
5. Return to BOM → **Actual receipt reconciliation**. Choose the matching BOM line and the existing unlinked posted receipt, add any amount of scrap **within** already consumed usable units, and confirm. Exactly one BOM line can classify each real posting. The BOM records **no further inventory movement**.
6. Return actual used stock through the established **Creative Process reversal** flow. A source reversal is displayed as *returned*; the original post and BOM classification remain visible for traceability. Release unused project holds through Materials & Costing, not through the BOM.
7. Retire an obsolete BOM plan instead of deleting its history. The operator must provide a reason and existing movement links are preserved.

### Calculations

`planned stock units = planned usable units ÷ canonical usage units per stock unit (snapshot)`.

`usable actual = posted usable units − classified scrap usable units`.

`returned actual` comes **only** from linked real Creative Process reversal receipts; returned posts are excluded from current posted and scrap totals. Plans are not evidence that materials were actually consumed. Current price estimates are nullable: unknown cost is not $0. Supplier lot selection does not imply that the lot was depleted, since Inventory lot reconciliation remains authoritative.

### Safety and idempotency

- Same-origin authenticated Admin writes only; receipt action requires an operator reason and unique key.
- Forward migration and DB triggers reject cross-project operations, unrelated supplier lots, non-Supply items, invalid or reversed actual postings, scrap above genuine used quantity, and duplicate canonical post classification.
- Existing Inventory usage increments are checked before saving a planned quantity; source Inventory has final authority when real usage is posted.
- Actual link and plan keys are unique; matching retries are read as existing evidence and changed replay payloads are rejected.
- Classified receipt updates/deletes are blocked; retirement is the only allowable BOM line update.
- **No automatic inventory consumption, reservation, supplier purchase, accounting entry, external publication, or Etsy listing change.**

## Testable acceptance

Automated local SQLite and JS tests (no live stock manipulation):

```text
python scripts/release467_build445_bom_sql_regression.py
node --test scripts/release467_build445_bom_math.test.mjs
node --check functions/api/admin/project-bom.js
node --check public/js/admin-project-bom.js
```

Fixtures: resin project 200 g planned, 125 g actually recorded (0.125 bottle at 1000 g/bottle), including 25 g scrapped; jewellery project 5 g silver planned, 2.5 g actually recorded (0.05 coil at 50 g/coil), including 0.5 g scrap. Both retain exact canonical movement identities and verify **no BOM stock balance change**. Reversed resin usage is excluded from active consumption and classified as returned. Invalid lot/process cross-links, scrap overuse, cross-project reuse, duplicate posting link, deletion and modification all reject.

Manual authenticated acceptance (real operator, no synthetic stock):

- [ ] Project selection, supply search, operation, lot and conversion labels display correctly in Production.
- [ ] Existing real resin project can add a BOM plan and show a valid authentic Creative Process partial usage receipt.
- [ ] Existing real jewellery project can similarly classify a true posted movement without a second stock deduction.
- [ ] A real authorized reversal (if performed) is displayed as returned without erasing earlier receipts.
- [ ] Authenticated Admin can use the workflow; unauthenticated `/api/admin/project-bom` remains HTTP 401.
- [ ] Canada-only Etsy shipping and existing draft approval gates remain unchanged.

Release gate: both `dev` and `main` tests green, Development migration 0041 applied before Production migration 0041, Pages deploy successful, Cloudflare custom-domain exact-version smoke and deployment receipt present. These must be independently observed before reporting Production GREEN.
