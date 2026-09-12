# Release 467 Build 123 — Admin Home Dashboard Refresh

## Goal

Turn `/admin/` into a concise operator landing page without creating another business-data, navigation, task-action, or preference authority.

## Read authorities

Build 123 reads only the existing `data/admin-navigation-modules.json`, `/api/admin/contracts/operations-today-tasks-read`, and `/api/admin/it-operations-control-tower` authorities. Reads are executed independently with `Promise.allSettled`, so one unavailable source does not blank the rest of the dashboard.

## Operator experience

- At-a-glance actionable item and I.T. health metrics.
- Up to five current Today Tasks groups with links to their owning workspaces.
- Storefront, Creator, Finance and I.T. cards derived from the navigation manifest, including current tool counts and a few manifest-backed shortcuts.
- Manifest-backed quick destinations for common operational screens.
- Current verified Development and Production health summary from the I.T. control tower.
- Manual Refresh; no polling.
- The full Today Tasks workspace remains the only home for Done, Ignore and Snooze actions.

## Safety boundary

No POST/write request, local/session storage, recent-history persistence, preference persistence, server persistence, schema change, D1/R2/binding mutation, Accounting posting, period close, Inventory/Creative/price mutation, provider execution/publication or Production business-data overwrite is introduced. Canonical D1 migrations remain exactly `0001`–`0004`.

## Closure protocol

Build 123 starts from externally proven Build 122: SHA `8ff2df0616a4a9f23c4e1a92bcf5e501a306e0da`, tree `e87670bb397cee58ed839813ea33851d799b5823`, Development proofs System `34710867035`, Quality `34710867094`, I.T. `34710867066`, Hygiene `34710867072`, Production Pages `34710956842`, Live Resources `34710999276`. Build 123 may not self-record its own later proof; Build 124 must ingest it.
