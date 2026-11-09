# Devil n Dove Build 654 — Workshop Decision Trace Comparison and Accessible Handoff

## Owner workflow

1. In **Admin → Products**, load saved owner plans and deliberately scan the Build 651 queue. Choose a checked plan and create a Build 653 page-only bookmark. Nothing is read or bookmarked automatically.
2. Open **Workshop Decision Trace Comparison & Accessible Handoff**. The panel compares the bookmarked snapshot with the latest manually checked queue facts: saved plan version, dated-review timeline version, review count, latest recommendation, status and follow-up date.
3. Read the **MATCH** or **HOLD** explanation. HOLD identifies missing current scan, plan-version change, decision timeline change, review-count change, latest outcome change, status/date drift, active scan, a future timestamp or evidence older than seven days. A mismatch disables all handoff actions; rescan and, if appropriate, deliberately bookmark the new evidence.
4. For a current MATCH, click **Review original decision history**. This selects the verified plan in the existing Build 649 history UI; it never starts a GET. Choose **Load saved decision history** separately for a new authenticated source read.
5. Alternatively, click **Prepare unsigned handoff**, inspect the preview and click **Copy reviewed handoff** if needed. The clipboard transfer is a separate owner action. The unsent text contains only source-linked planning identifiers and summary versions, not note bodies or private credentials.

## Trust and privacy boundaries

- Comparison reads the already verified Build 651 browser snapshot only. It cannot certify an actual physical count, supplier commitment, inventory mutation, paid order, completed workshop job, signed auditor decision or live Master Shell integration.
- Owner/source changes erase volatile bookmarks. Each render clears prepared handoff text when checked source changes. Missing, drifted or aged evidence fails closed; no automatic retries.
- There is no new API endpoint, provider operation, migration, network request, database mutation, history GET or external communication in Build 654. The original owner editor retains the separately deliberate Save.
- The existing source-owned QL-364 health handler and QL-365D authorization HOLD remain unchanged. The accompanying [Master Shell assessment](RELEASE_467_BUILD_654_MASTER_SHELL_ASSESSMENT.md) distinguishes code presence from operational connection and proposes staged integration work, subject to AI Data Platform/Comms contract approval.

## Regression and source budget

- `scripts/release467_build654_workshop_trace_comparison.test.mjs` checks matching/drifted facts, freshness, owner isolation, explicit history selection, unsigned handoff and absence of hidden APIs or writes.
- `scripts/release465_performance_budget_gate.py` keeps the existing **18,610,000-byte** ceiling unchanged. An unused historical Release 466 Build 4 `public/js/admin-it-platform.js` has been preserved byte-for-byte in `docs/operations/historical/RETIRED_UNREFERENCED_ADMIN_IT_PLATFORM.js.txt` (the `/admin/it-platform/` compatibility page uses the current I.T. route). The historical system-gate syntax check now covers the **active** `public/js/admin-it-control-tower.js` client instead.
