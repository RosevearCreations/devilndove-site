# Devil n Dove Release 467 — Build 447: Finished Quality, Failures, Rework & Salvage

## Operator outcome

The [Finished Quality workspace](/admin/finished-quality/) records **each actual making attempt** as a durable, private Creative Project fact. A successful ring, an unusable casting and a later repaired ring remain three distinct, source-linked records. A therapeutic practice piece is equally valid without a Product, customer, price or sale.

### Step-by-step: one good piece, one failed casting, one repaired piece

1. Open Admin → **Finished Quality, Rework & Salvage**; choose the existing Creative Project. If useful, finish the real step in **Guided Manufacturing** and add a dated photo through **Creative Process** first.
2. **Good piece:** Record a new attempt key (`RING-01`), choose **First quality**, mark **Safe** only after human inspection, optionally link the actual reviewed traveler or historical Build 220 run, and choose its real photo event. Record quantities and lessons. Saving an attempt **does not** approve a sale.
3. **Failed casting or 3D print:** Save a second key (`RING-02`), outcome **Reject** or **Scrap**, safety **Unsafe** or **Unreviewed**, plus the actual failure cause, a private photo and lessons. It stays in the Maker project even if there is no product and no income. It can never receive an approved-for-sale decision.
4. **Repaired piece:** Save a third key (`RING-03`), outcome **Second quality** (or First quality if the finished rework genuinely meets that grade), point **Parent attempt** to `RING-02`, and document the actual repair and photo. The failed source attempt remains immutable.
5. In **Human release review**, choose `RING-01` or `RING-03`. Use **Approved for sale** only after confirming safe status and real active photographic evidence. A linked historical Build 220 run must also have positive accepted quantity, a passing QA check and zero failed/rework QA checks. Any unsafe or unapproved piece remains **HOLD** or **Internal only**.
6. To associate an eligible piece with an already-created Product, use **Existing Product handoff** and enter its actual Product ID. This **only links evidence**; it never creates a Product, increases inventory, publishes a page or submits an Etsy/Facebook listing. Rejected/unsafe/unapproved pieces cannot be linked through this path.
7. For genuinely recovered material, first record the actual **Creative Process Inventory reversal** in its existing authority. Return to **Actual material recovery / returns** and link that exact posted receipt once. The linked recovery does not increase inventory again. Scrap in Build 445 remains a classification of previously posted material consumption, not a second deduction.
8. If an already-linked Product must be put on HOLD, **unpublish/deactivate it in the Product Editor and return it to draft/review first**. The database refuses a HOLD while the Product is active or approved, preventing a silent unsafe public state. It then refuses reactivation or an Etsy one-shot draft claim until the exact linked attempt receives a new independent sale approval.

## Canonical forward-only D1 migration

`migrations/canonical/0043_release467_finished_quality_rework_salvage.sql` adds:

| Table | Source-owned authority retained | Purpose |
| --- | --- | --- |
| `maker_quality_attempts` | `creative_work_projects`, optionally Build 446 traveler / Build 220 QA / active Creative Process photo | Immutable first/second quality, reject, scrap, salvage, abandoned, learning-only and parent rework lineage |
| `maker_quality_release_reviews` | independent human reviewer | Append-only HOLD / internal-only / approved-for-sale history; approval requires safe first/second quality, active photo and valid linked historical QA |
| `maker_quality_product_links` | existing `products` and catalog/approval authorities | One exact eligible attempt per Product, no Product mutation; later hold blocks activation |
| `maker_quality_recovery_links` | `creative_project_inventory_reversals` and posted Creative Inventory | One unique existing authorized material recovery receipt, never a new stock operation |

Migration-owned triggers refuse cross-project traveler, historical QA, parent repair, photo and recovery links; missing/voided photo on sale review; unsafe outcomes marketed as sale-ready; reused Inventory returns; overwrites or deletion of immutable attempts/reviews/links; Product activation while its linked quality is held; or the audited existing Etsy Product Editor draft claim while its linked quality is held.

**Important bound:** The guards are authoritative for Products **explicitly linked** through Build 447. An unrelated Product cannot be reliably inferred as the physical output of a maker project; operator matching must occur before claiming Build 447 finished-quality protection. Provider publication, storefront search, unlinked historic Products and any existing Etsy drafts remain subject to their own independent rules. Build 447 never posts to Etsy or Facebook, turns US shipping on, changes Product quantities or silently retires already-public listings.

## Regression and production acceptance

- `python scripts/release467_build447_quality_sql_regression.py`: good casting; rejected/unsafe casting; second-quality repaired child; learning-only and salvage with no sale; cross-project restrictions; reviewed Build 220 pass/fail; active Product HOLD and reactivation guard; Etsy draft claim fence; real unique authorized recovered stock receipt; attempt immutability; unchanged physical Inventory snapshot.
- `node --check functions/api/admin/finished-quality.js`
- `node --check public/js/admin-finished-quality.js`
- `node --test scripts/test_product_etsy_draft_438.mjs scripts/test_product_etsy_endpoint_438.mjs scripts/test_product_etsy_recovery_442.mjs`
- `python scripts/migration_policy_gate.py`; `python scripts/current_deployment_preflight_truth_gate.py`; `python scripts/repository_forward_sanity.py`.
- Development D1 must apply and verify migration 0043 before dependent code. Production D1 must likewise apply it before Pages publication. Verify final exact `main` tree, migration ledger and healthy custom-domain admin UI; anonymous quality API must deny access (`401`).

## Safe recovery

Never delete or rewrite a failed attempt or source recovery receipt. Append a new reviewed attempt and/or release review to correct a decision. Record genuine stock recovery only through the Inventory authority. If a public Product needs a quality hold, unpublish it first, then append HOLD. If migration or schema fails, preserve the existing tables and use a future canonical forward-only repair migration; do not edit applied 0043 or replay past migrations.
