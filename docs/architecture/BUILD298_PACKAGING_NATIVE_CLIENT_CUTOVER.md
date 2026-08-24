# Build 298 — Packaging Native Client Cutover

## Decision

Build 298 removes the retired Packaging Studio route name from the mature editor. The editor no longer constructs a compatibility URL or calls `DDAuth.apiFetch()` for Packaging reads/writes. It calls `DDPackagingClient.request(body, projectId)` instead.

## Native client

`public/js/admin-packaging-native-client-v298.js` exposes the synchronous browser facade immediately and lazy-loads `public/js/modules/packaging/native-client-v298.mjs`.

The native client waits for the proven Build 297 Packaging owner-contract runtime before issuing requests.

### Read

Physical read:

`GET /api/admin/packaging-bootstrap[?packaging_project_id=…]`

The client composes the server bootstrap with the existing owner contracts:

- `catalog-read`
- `inventory-read`
- `content-media`

Contract failures never call a retired endpoint. They use session cache where available or an empty owner collection with an explicit fallback reason.

### Write

Physical write:

`POST /api/admin/packaging-write[?packaging_project_id=…]`

The Build 292 gateway continues to delegate to the Build 291 Packaging domain service and returns the existing `write_boundary` provenance.

## Relationship to Build 297

Build 297 remains loaded and active as defense-in-depth during Build 298. Its startup gate and compatibility transport protect any older caller that still emits the retired route. The mature editor should no longer use that path, so a fresh Build 298 session should show zero compatibility replays for normal editor load/Refresh/Save.

The Build 289 compatibility write bridge also remains armed, but a normal Build 298 save should bypass it because the native client calls `/api/admin/packaging-write` directly. Build 298 records its own `writeCount`, `lastWriteStatus`, and `lastWriteBoundary`.

## Preserved authorities

Build 298 does not modify:

- Build 293 Packaging read service over the proven Build 286 read implementation;
- Build 292 native write gateway over Build 291 Packaging domain service;
- Build 294 authenticated legacy GET tombstone;
- Build 292 authenticated legacy POST tombstone;
- Build 297 runtime/compatibility defense stack;
- D1 schema or migrations;
- Cloudflare bindings/configuration;
- R2 resources;
- Production.

## Activation safety

The large mature editor is changed only by `scripts/apply_build298_packaging_native_client_cutover.py`. The helper asserts the exact Build 277 API block and exact Build 297 page script block before writing anything. If either source has drifted, it aborts instead of making a broad rewrite.

Only after that helper runs should the Build 298 regression pass and the resulting two-file activation commit be pushed to `dev`.

## Exit criteria

Build 298 is complete only when:

1. the regression proves the mature editor contains no `/api/admin/packaging-studio` literal;
2. initial load and Refresh physically use `/api/admin/packaging-bootstrap` and projects render;
3. normal Save physically uses `/api/admin/packaging-write` and returns HTTP 200;
4. the Build 298 client reports the `292 -> 291` write boundary;
5. the Build 297 gate/compatibility counters stay idle for normal editor traffic;
6. explicit direct legacy GET/POST probes remain 410 tombstones;
7. Production remains untouched.
