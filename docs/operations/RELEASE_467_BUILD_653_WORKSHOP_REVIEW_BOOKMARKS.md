# Devil n Dove — Build 653: Workshop Review Bookmarks, Filter Recovery & Decision Traceability

## Owner workflow

1. Sign into **Admin → Products**, load our saved private owner restock plans, and deliberately scan in **Build 651** (up to five plans per click). The queue does not read private note history on mount.
2. Select an explicitly verified checked plan in Build 651; in **Build 653**, click **Bookmark selected checked plan**. Keep up to five bookmarks in the current page's memory; remove or clear them explicitly.
3. Choose a bookmark to view the checked saved-plan version, dated decision timeline version, latest outcome, timestamp, and last manual check. This is an **unsigned source pointer**, not proof of physical work or a permanent audit record.
4. Click **Continue verified review** to select the same checked plan in Build 651. **Open original decision history** only passes the selected verified plan into Build 649's existing history UI; click **Load saved decision history** there for its separate authenticated GET. Neither button issues a hidden history request or saves a note.
5. When we select a Build 651 queue filter, the app remembers only its **allowed filter value** per owner in the current browser tab's `sessionStorage`. If the owner source is verified on a later page load, click **Recover previous filter** to apply it. The filter never auto-applies and never performs a scan. **Forget filter preference** erases it.

## Privacy, accuracy and source boundaries

- Bookmark identity, title, status and versions are **never persisted** to browser storage. Bookmarks are volatile page memory and are discarded when the owner changes, the owner source becomes unavailable, or its saved plan version changes.
- A bookmark may be opened only if the checked owner/plan, saved version, timeline version, review count, last outcome, status and due date still match the Build 651 verified queue. A manual clear or unscanned plan displays HOLD and requires a new explicit scan; any changed timeline requires a new explicit bookmark.
- Filter recovery stores precisely `{version:1,filter:<approved filter>}` in `sessionStorage` under the owner-specific key. It stores no plan ID, title, private note, supplier, payment, inventory or stock fields. Malformed or unknown values fail closed.
- Source trace is **dated planning evidence**, not an independent original signature, a server custody record, a verified physical count, a supplier confirmation, completed workshop work, a purchase approval or authorization to publish. Original owner edit and authenticated dated-review save are separate deliberate workflows.
- There are no new API routes, provider calls, inventory updates, database writes, background timers, automatic network reads, or migration changes in Build 653.

## Verification and budget custody

- `scripts/release467_build653_workshop_bookmarks.test.mjs` exercises bookmark limits, version/timeline drift, owner changes, private-data isolation, explicit history handoff, filter-only recovery, malformed saved preferences and production wiring.
- The unchanged **18,610,000-byte / 1,854-runtime-file** performance ceiling remains enforced by `scripts/release465_performance_budget_gate.py`.
- To accommodate the Build 653 client without increasing that ceiling, the globally unreferenced historical Build 197 `public/js/admin-catalog-options.js` was moved byte-for-byte to `docs/operations/historical/RETIRED_UNREFERENCED_ADMIN_CATALOG_OPTIONS.js.txt` for provenance. A repository-wide search including hidden workflows and tests found no reference to its original filename; no active page or current gate depended on it. Original API/business logic remains untouched.

## Relationship to module completion

The [Build 652 module-readiness baseline](RELEASE_467_BUILD_652_MODULE_READINESS_BASELINE.md) remains **provisional**. Build 653's verified code and production checks do not themselves certify real operator acceptance or raise any business-module completion percentage.
