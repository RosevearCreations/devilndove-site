# Release 467 Build 646 — Workshop Handoff Checklist & Owner Acknowledgement

## Private owner workflow

1. In **Admin → Products**, load saved owner plans, select a plan and explicitly search the dated owner review notes (Build 644).
2. Select the reviews to include, then **Prepare selected digest** (Build 645). Read it before sharing it. Full private review notes remain excluded unless separately opted in for the original digest.
3. In **Workshop Handoff Checklist & Owner Acknowledgement**, deliberately click **Review prepared digest**. This only works for a currently prepared digest belonging to the active plan and the current loaded owner plan version.
4. Confirm each of four separate statements: dated source reviewed; real stock counts still need independent verification; suppliers/orders/payment are separate decisions; no stock/manufacturing/publication authority is created.
5. Record a specific next action (8–180 characters) and a valid future date; check the explicit owner acknowledgement. Choose **Prepare local acknowledgement** and inspect the read-only preview.
6. Optionally choose **Copy acknowledgement** or **Download private .txt**. No automatic handoff, server record, signature, stock movement or provider communication occurs.

## Truth and invalidation

- A local acknowledgement is **unsigned, unsaved and not an independent audit record**. It is a private worksheet receipt for owner follow-up, not proof of completed counting, purchasing or production.
- The receipt contains a timestamp, current owner-session user ID, plan ID, source plan and timeline versions, number of selected reviews, the four acknowledged boundaries, next action and due date. Full private note bodies from the source digest are not copied.
- Changing the plan, owner session, source plan version or the prepared digest invalidates the previous checklist and receipt. Changes to checklist, action or date clear a prepared receipt; explicit preparation is required again.
- A mutation observer watches the Build 645 status for asynchronous source invalidation. Every copy/download operation also rechecks the owner, selected plan, source version and the **exact prepared digest text**. A source replaced after an owner change is blocked until a fresh digest is prepared.
- No API fetch, browser storage, background timer, purchase, stock change, server acknowledgement endpoint, external messages, or listing publication path is introduced.

## Retired runtime and budget control

`public/js/admin-packaging-startup-gate.js` was the legacy Build **296** compatibility transport adapter. It had **no active script or import reference** in runtime Admin/storefront sources or the CI verifiers. The packaging page instead loads `admin-packaging-startup-gate-v297.js`, with current Build 297 contract checks preserved. The superseded 296 file was deleted after read-only reference checks, and the still-live Build 297 file was mechanically minified with the same target to save runtime source bytes. The new Build 646 client was likewise minified. The unmodified Release 465 runtime byte and file caps remain enforced.

## Verification

Run:

```sh
node --test scripts/release467_build646_workshop_handoff_acknowledgement.test.mjs
node --test scripts/release467_build641_owner_restock_plans.test.mjs scripts/release467_build642_restock_priority_board.test.mjs scripts/release467_build643_owner_restock_review_timeline.test.mjs scripts/release467_build644_restock_review_search.test.mjs scripts/release467_build645_restock_handoff_digest.test.mjs
node scripts/release467_build556_admin_interface_inventory.mjs --check
python scripts/migration_policy_gate.py
python scripts/release465_performance_budget_gate.py
python scripts/current_application_quality_gate.py
```

The comprehensive Admin source/quality, security and protected production workflows remain required; no production truth or external authority is inferred from a local acknowledgement.
