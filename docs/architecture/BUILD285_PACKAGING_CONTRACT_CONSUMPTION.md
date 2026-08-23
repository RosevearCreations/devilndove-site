# Build 285 — Packaging Contract Consumption

## Purpose

Build 284 proved that Packaging can call owner-side `catalog-read`, `inventory-read`, and `content-media` services. Build 285 makes those services part of the real Packaging Studio UI data path while preserving current behavior and a reversible fallback.

## Transition pattern

The existing Packaging UI remains in `public/js/admin-packaging-studio.js`. Build 285 does not refactor that large file yet. Instead, after verified Packaging activation, the Packaging module wraps `DDAuth.apiFetch` only for **GET** requests to `/api/admin/packaging-studio`.

The flow becomes:

```text
Legacy Packaging UI
        |
        | GET /api/admin/packaging-studio
        v
Packaging active-module bridge
        |
        +--> original Packaging bootstrap (Packaging authority + fallback arrays)
        +--> catalog-read      -> Catalog authority
        +--> inventory-read    -> Inventory authority
        +--> content-media     -> Content authority
        |
        v
Compatibility-shaped response
  products      = Catalog contract rows
  inventory     = Inventory contract rows
  content_media = Content contract rows
  module_contracts = source/fallback diagnostics
        |
        v
Existing Packaging UI
```

## Why the compatibility bridge

A direct rewrite of `admin-packaging-studio.js` would mix architecture migration with a large functional refactor. The bridge changes authority while preserving the UI's proven response shape. This isolates risk and provides a clean rollback: remove the module bridge and the unchanged legacy response works as before.

## Fallback rule

Each owner read is independent. If a contract succeeds, its rows replace the legacy array. If it fails, only that domain falls back to the legacy array and the failure is reported in `module_contracts` and the visible Modular data status panel.

Fallback is temporary compatibility, not the target architecture. Build 286 removes duplicated server-side Catalog/Inventory bootstrap reads after Development parity is proven.

## Write safety

Only GET `/api/admin/packaging-studio` is intercepted. POST Packaging actions—including project/template/formula/source-material/component/version/export/print-test changes—pass directly to the existing Packaging API. Inventory quantities are not changed by these read contracts.

## Activation timing

The legacy page may begin loading before verified module activation. Build 285 handles this without polling:

1. install the bridge only after verified Packaging activation;
2. if the initial response was already contractized, do nothing more;
3. otherwise observe the existing Packaging load-status message;
4. when the one legacy load finishes, trigger exactly one normal Refresh button click through the installed bridge;
5. disconnect the observer.

There is no `setInterval`, recurring timeout or background polling.

## Content media seam

Content media rows are attached to the compatibility response and retained by the Packaging module. `window.DDPackagingContracts.getAvailableContentMedia()` exposes them for the future embedded artwork picker without making Build 285 redesign that UI.

## Deactivation

On Packaging deactivation, the original `DDAuth.apiFetch` function is restored and the one-shot observer is disconnected. Contract methods continue to reject reads while Packaging is inactive.
