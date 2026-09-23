# Release 467 Build 240 — API Read Budget, Cache & Batch Streamlining

Build 240 starts from exact Build 239 Development head `f3594106fd74956e0aae524df7f75e53c84b9916` and promoted Production main `ca2f822ac5811f55abb8385d7e548b61097f24e8`.

## Owner-reported production regression

The Admin home at `/admin/` could take several minutes to partially render while Firefox reported that the page was slowing down the browser. The failure mode was traced to the retained Build 236 Save Confidence document observer: every child-list mutation triggered a full form scan and `render()`, while `render()` rewrote the observer's own panel. That feedback path could keep the browser main thread busy indefinitely.

## Build 240 changes

- Save Confidence now observes only newly-added nodes, registers only newly-discovered forms, and renders only when a new form is actually added.
- Its own `#ddSaveConfidenceV236` UI is excluded from observer work.
- Build 239 duplicate-link cleanup is idempotent and its dynamic-ready hook is one-shot.
- Admin home adds a targeted read-budget transport for the two existing read-only startup endpoints:
  - `/api/admin/contracts/operations-today-tasks-read?min_count=1`
  - `/api/admin/dashboard-summary?view=seller_daily`
- Identical in-flight reads are coalesced.
- Successful snapshots are reused for 60 seconds in-memory.
- Live startup waits are bounded to 8 seconds.
- Existing Seller Daily caching remains authoritative for longer browser continuity.
- No new API authority, schema, D1/R2 business-data mutation, provider execution, Product publication, Inventory movement or Finance posting is introduced.

## Acceptance

Build 240 is not accepted unless:
1. the Save Confidence observer cannot call a whole-document `scan(); render();` loop from its MutationObserver callback;
2. Admin home loads the Build 240 read-budget client before the dashboard/Seller clients;
3. targeted startup GETs remain read-only and bounded;
4. retained Build 239 navigation compatibility remains intact;
5. all current System, Application Quality, I.T. runtime, branch-hygiene and Build 240 dedicated gates are GREEN on the exact Development head before promotion.

The next authorized release is **Build 241 — Cross-Authority Handoff Simplification**.
