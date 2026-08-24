# Build 297 — Packaging Legacy GET Fallback Removal

## Problem

Build 296 proved the initial Packaging Studio compatibility GET could be routed through an explicit client facade to `/api/admin/packaging-bootstrap`. Live Development testing then exposed a second path: after the Build 296 runtime became active, the older Build 286 compatibility bridge again occupied the active `DDAuth.apiFetch` chain. Clicking **Refresh** could therefore enter Build 286's rollback behavior and physically request the retired `/api/admin/packaging-studio` GET. The server correctly returned HTTP 410, but the mature editor then failed to reload Packaging projects.

## Build 297 boundary

Build 297 does not rewrite the mature editor, Build 296 runtime, Build 286 bridge, Build 293 read service, Build 292 write gateway, Build 291 write service, or Build 294 tombstone route.

Instead it layers a post-activation client transport over the proven Build 296 runtime:

1. Build 296 activates normally.
2. `client-transport-v297.mjs` captures the proven Build 296 facade and active authenticated transport.
3. Build 297 installs one outer compatibility transport.
4. Compatibility GET requests are handled by `native-read-transport.mjs`:
   - physical request: `/api/admin/packaging-bootstrap` only;
   - Catalog rows: `catalog-read` owner contract;
   - Inventory rows: `inventory-read` owner contract;
   - artwork rows: `content-media` owner contract;
   - unavailable owner contracts use session cache where available, otherwise an empty collection plus a fallback reason;
   - there is no physical legacy GET fallback.
5. Compatibility POST requests continue through the retained Build 296 facade and Build 289 write bridge to `/api/admin/packaging-write`.
6. Build 297 remains outermost after activation so later **Refresh** and **Save** actions use the same explicit transport as initial load.

## Failure semantics

If the native Packaging bootstrap itself fails, Build 297 returns the native failure (or a local 503 for a transport exception). It never attempts `/api/admin/packaging-studio` as rollback.

If an owner-side Catalog, Inventory, or Content contract fails, Build 297 uses:

- the current session cache when one exists; otherwise
- an empty owner collection with a recorded fallback reason.

Packaging-owned projects/templates/detail data continue to come from the native Packaging bootstrap.

## Preserved provenance

Server read authority remains:

- `/api/admin/packaging-bootstrap`
- read service Build 293
- proven read implementation Build 286

Server write authority remains:

- `/api/admin/packaging-write`
- gateway Build 292
- shared Packaging domain write service Build 291

The retired server route remains present only for explicit retirement probes:

- authenticated legacy GET -> 410 `packaging_legacy_get_retired`
- authenticated legacy POST -> 410 `packaging_legacy_post_retired`

Normal application runtime must no longer contact either legacy method.

## Development-only safety

Build 297 introduces no SQL/schema change, Cloudflare binding/config change, R2 change, or Production change. Production remains frozen at Build 280 unless deliberately promoted through the separate Production workflow.
