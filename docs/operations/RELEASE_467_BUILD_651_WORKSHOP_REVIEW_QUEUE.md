# Release 467 Build 651 — Workshop Follow-Up Review Queue, Decision Aging Filters & Owner Action Handoff

## How we use it

1. Go to **Admin → Products**, load private owner plans, then expand **Workshop Follow-Up Review Queue & Owner Action Handoff**.
2. Click **Review next five saved plans**. A deliberate batch makes up to five sequential, authenticated `GET /api/admin/owner-restock-review-notes` requests. It never automatically pages or reads in the background. Click again to check the next five, up to the 20 saved plans returned by the private owner snapshot.
3. Use **Show checked plans** to filter the evidence *we have actually loaded*: owner attention, due/overdue, most recent saved decision older than seven days, no recorded decisions, recent decisions, or all checked. The coverage label explicitly distinguishes scanned from unscanned plans. No global queue or exact live inventory claim is made for unscanned plans.
4. Choose **Review** on a checked row. The details show the saved owner plan version, private timeline version, last recorded recommendation category, saved decision count and source-check time. They are **dated owner planning records**, not proof of completed workshop jobs or accurate stock counts.
5. **Open in private dated-review history** selects the same plan in Build 649 without automatically loading or exposing private notes. Click that panel's Load button separately to see the underlying factual history.
6. **Reopen original owner plan** returns to the existing editor. Any status or follow-up-date update needs the original authenticated, deliberate **Save**; no automatically completed plan is inferred.
7. **Prepare unsigned owner handoff** creates session-local text containing only the selected plan identity, source versions, checked time, saved date/status, outcome category and suggested manual check. It excludes private note bodies. Read it and explicitly **Copy handoff manually** if needed. Nothing is transmitted, persisted, published or approved on its own.
8. **Refresh queue from first plan** discards previously checked results and handoff drafts before reading again. An owner/source/version change or any invalid private response clears the whole queue with **HOLD** and no automatic retry.

## Security, resource and release boundaries

- Build 651 reuses the proven Build 641 owner-plan snapshot and Build 643 GET-only private review endpoint; no new D1 migration, role, provider, background job or write endpoint.
- Each response must match the verified owner ID, plan ID/version/status/date, private/read-only flags, 0–50 full review totals, six consistent outcome counts, ordered newest 10 events, timeline/cursor, and current owner snapshot. Invalid or concurrent owner/source changes fail closed.
- All request batches are deliberate and sequential (up to five per click) to avoid D1 fan-out. An incomplete batch is discarded rather than displayed as partial verified fact. Browser memory is the only queue/handoff storage, with no `localStorage`, auto-refresh or automatic message/copy.
- Actual stock counts, order commitments, supplier decisions, purchasing approvals, plan-status edits, payments and marketplace publication retain their separate authority. This queue performs **no writes** and does not invent physical completion.
- The historical, no-longer-loaded `public/js/admin-product-story-notes.js` and `public/js/admin-product-bulk-tools.js` were confirmed unreferenced by active HTML and runtime imports. Their original source is preserved in `docs/operations/historical/RETIRED_UNREFERENCED_PRODUCT_STORY_NOTES.js.txt` and `RETIRED_UNREFERENCED_PRODUCT_BULK_TOOLS.js.txt`, keeping the unchanged Release 465 runtime source budget. The current Product editor workspaces and server-side reviewed Product operations are unaffected.
- New Build 651 tests cover explicit bounded sequential reads, partial-coverage honesty, filter behavior, source isolation, stale/failure HOLD, safe history selection, manual editor reopen/copy, and protected CI wiring. Prior Builds 640–650 tests, canonical D1 migration checks, current application quality, security/source and deployment gates remain mandatory.
