# Release 467 Build 128 — Admin Navigation Help & Keyboard Shortcut Reference

## Purpose

Build 128 makes the existing Admin navigation system easier to discover without creating another navigation authority or saved-state system.

## Proven starting point

Build 127 is the exact last fully verified Development and Production checkpoint:

- SHA `dead9393e6d8db5fbcbe776c3885da80cbe42163`
- tree `efff42114b680218c756031fb2f92bc12e541b1c`
- System Gate `34725275176`
- Current Application Quality `34725275139`
- I.T. Admin Runtime `34725275114`
- Repository Branch Hygiene `34725275193`
- Production Pages Deploy `34725363163`
- Production Live Resource Integrity `34725405258`

Build 128 ingests this closure. Build 127 did not self-record it.

## Runtime contract

The Build 128 module provides a visible **Navigation help** button in the shared Admin workspace navigation and an `Alt+Shift+H` shortcut. The dialog explains the already-existing navigation layers:

- `Ctrl/Cmd+K` — open the Build 122 Admin command palette.
- `Alt+Shift+F` — toggle the current Admin tool as a Build 126 favorite.
- Workspace memory — Build 125 browser convenience state can resume the last Admin workspace when enabled.
- Favorites — Build 126 provides quick-launch links scoped to the signed-in Admin/browser.
- Breadcrumbs / workspace return — Build 127 provides current Admin/workspace/section/tool context and a direct return to the workspace hub.

The dialog uses accessible dialog semantics, closes with Escape, and restores focus to the element that opened it.

## Safety boundary

Build 128 is Admin-only and client-only. It stores no state, creates no server preference authority, performs no network write and does not replace `data/admin-navigation-modules.json`.

It introduces no schema change, request-time schema mutation, D1 business-data mutation, R2 mutation, binding mutation, Accounting posting, period close, Inventory/Creative/Product/price mutation, provider execution/publication, restore action or Production business-data overwrite.

Canonical D1 migrations remain exactly `0001`–`0004`.

## Closure rule

Build 128 remains a Development closure candidate until the exact `dev` head receives the four required Development proofs plus exact Preview/D1/bindings/smoke evidence. Only then may the identical SHA/tree be non-force promoted to `main`; Production Pages Deploy and Production Live Resource Integrity must both be GREEN. Build 129 will ingest those later proof IDs.
