# Release 467 Build 647 — Workshop Follow-Up Status & Owner Reopen Guidance

## Owner workflow

1. Open **Admin → Products → Saved Owner Restock Plans & Follow-Ups**. Choose **Load my saved plans**. Build 647 makes **no background request** and shows no owner plan details before that verified read.
2. Under **Workshop Follow-Up Status & Reopen Guidance**, choose **Open follow-ups**, **Due or overdue**, **Blocked**, **Reviewed complete** or **All plans**. Counts come only from the currently loaded, owner-scoped plan snapshot; a completed-review label does not mean stock or supplier work is complete.
3. Choose **Review guidance** beside a saved plan. The status, due date and next-step suggestion are tied to the verified owner version. Private plan notes and review-note bodies are not displayed in the summary.
4. Optionally choose **Inspect local acknowledgement**. This reads the Build 646 acknowledgement already prepared in the current browser session, if it belongs to the same owner, plan and version. The next action and target date are displayed, but the receipt remains unsigned and is **not** persisted to the database.
5. Choose **Reopen owner plan to review**. This invokes only the existing Build 641 owner-editor navigation. To change status, due date or notes, the owner must deliberately review the source and choose the editor's **Save owner plan** action. Reopen itself never writes.

## Source and permission boundaries

- Invalid, unverified, cross-owner, duplicate, wrong-status or malformed snapshots fail closed. There is no guessed status, automatic GET, polling or retry.
- A new owner/version/list snapshot clears selected guidance and the inspected local receipt. A changed or cleared Build 646 acknowledgement also clears its locally displayed next action; every reopen action verifies the latest Build 641 snapshot again.
- Priority labels use the owner's local calendar day and the verified saved follow-up date. An overdue or blocked label is planning context only, not a supplier escalation or purchasing instruction.
- Actions never call the API directly, alter inventory, count Products, place orders, commit payments, publish listings, or create an external signed receipt.

## Runtime budget and archived code

The historical `public/js/admin-brand-content.js` standalone Admin catalog helper had **no active runtime script/import reference** when audited. Its unused mount in the catalog page remains for possible future development, and its exact source (apart from an explanatory archival header) is preserved at `docs/archive/RETIRED_UNREFERENCED_ADMIN_BRAND_CONTENT.js.txt`. No production route referenced the previous helper before archiving. It can be consciously reviewed and reactivated later; no functional replacement or external action is claimed.

Build 647's standalone owner follow-up client was mechanically minified. No release performance limit, required security check, D1 migration or provider authority was changed.

## Verification

```sh
node --test scripts/release467_build647_workshop_followup_guidance.test.mjs
node --test scripts/release467_build641_owner_restock_plans.test.mjs scripts/release467_build642_restock_priority_board.test.mjs scripts/release467_build643_owner_restock_review_timeline.test.mjs scripts/release467_build644_restock_review_search.test.mjs scripts/release467_build645_restock_handoff_digest.test.mjs scripts/release467_build646_workshop_handoff_acknowledgement.test.mjs
node scripts/release467_build556_admin_interface_inventory.mjs --check
python scripts/migration_policy_gate.py
python scripts/release465_performance_budget_gate.py
python scripts/current_application_quality_gate.py
```
