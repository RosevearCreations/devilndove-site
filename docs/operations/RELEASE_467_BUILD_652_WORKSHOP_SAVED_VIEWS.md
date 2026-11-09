# Release 467 Build 652 — Workshop Saved Views, Action Priority Explanations & Review Continuity

## Owner operation

1. In **Admin → Products**, load private owner plans and deliberately scan saved plans through Build 651. The existing rule remains: at most five sequential GETs per click, no automatic next-page or background refresh.
2. Set a Build 651 filter, enter a 2–30-character name and select **Save current Build 651 filter**. Up to five filter-name/predicate pairs may be kept for the current browser-tab session. They are scoped to the verified owner ID, and no plan IDs, note bodies, saved statuses or scan results are stored.
3. Choose a saved filter and deliberately **Apply saved filter**. This changes only the visible Build 651 filter; it never issues network requests or classifies unscanned plans. Delete a filter with its separate explicit action.
4. Read **Explainable priorities within checked plans**. The list labels only verified checked rows and gives factual reasons drawn from the current saved-plan status and date, latest recorded recommendation, or age of that recorded recommendation. It never states that a physical count, workbench job, supplier order or inventory correction has been completed.
5. Click **Continue** on a checked priority row or **Return to selected owner follow-up** to bring the same verified selection into Build 651. The original owner editor, Build 649 private dated history and unsigned handoff still require their respective explicit buttons, and the original editor still requires a separate Save.
6. A refresh requires deliberately reloading owner plans and rescanning records. Filter preferences may return within this tab, but private queue data is never cached for an automatic rehydration or shared between owners.

## Evidence and security boundaries

- Build 651 exposes a narrow read-only checked-queue snapshot: current owner, saved plan version, bounded verified row IDs, titles, plan status/due date, latest category/time, timeline/version, count, source-check time, selected plan and scan state. Private note bodies and arbitrary hidden data are excluded.
- Build 652 consumes that snapshot only. It has **no `fetch`, `apiFetch`, `POST`, new API route, schema migration, provider credential, payment, stock, supplier or planning-status write**.
- Session storage contains only `{version:1,views:[{name,filter}]}` under an owner-scoped key. Invalid schemas, duplicate names or unsupported filters are discarded. If browser storage is unavailable, filters remain in page memory with a clear message.
- Priority reasons are descriptive, not rank guarantees over unscanned plans. Due and blocked evidence is a review prompt, not proof of material, labour, accounting, supplier or manufacturing activity.
- Source change resets the Build 651 checked queue, and Build 652 also clears the prior owner's selected filter state. Explicit continue actions must call Build 651's verified selection method.
- Build 652 regression tests validate session-saved preferences, no private record persistence, owner isolation, priority explanations, partial coverage truth, explicit continue and protected CI wiring. Prior Build 640–651 regressions, runtime source budget, canonical migrations, current quality and protected Production deploy/live integrity gates remain unchanged.
