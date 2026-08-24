# Build 295 Validation

## Purpose

Build 294 Development validation proved the retired server GET/POST semantics, but normal Packaging page startup still produced an authenticated `GET /api/admin/packaging-studio` -> HTTP 410 before the modular runtime had finished arming its read/write bridges.

Build 295 adds a browser startup transport gate. It does not replace the mature editor or any Packaging read/write authority. It delays the editor's legacy-shaped compatibility trigger until the existing Build 290 runtime is active, then replays that request through the already-proven Build 288/286/289 transport stack.

## Local regression

Run from Development `dev` after pulling the final Build 295 commit:

```bash
python scripts/build295_packaging_startup_transport_gate_test.py
```

Expected final line:

```text
BUILD 295 PACKAGING STARTUP TRANSPORT GATE: PASS
```

The regression proves:

- Build 295 JavaScript syntax is valid.
- the startup gate recognizes only legacy-shaped Packaging GET/POST traffic;
- non-Packaging requests pass through unchanged;
- the gate waits for `dd:packaging-runtime-active` and requires both the Build 288 GET guard and Build 289 write bridge to be armed;
- a runtime that does not become ready returns a local synthetic 503 and does not contact the retired server route;
- the gate loads before the mature Packaging editor;
- `public/js/admin-packaging-studio.js` remains unchanged;
- Build 290 runtime, Build 293 read authority, Build 291/292 write authority, and Build 294 server tombstone remain unchanged;
- Build 294 historical regression is pinned;
- the Build 295 changed-file boundary is exact;
- there is no SQL/schema, Cloudflare binding/config, R2, or Production change.

## Development deployment

Deploy/allow automatic deployment to `devilndove-site-dev` only.

Production must not be contacted.

## Normal Packaging startup proof

1. Log in as an administrator on Development.
2. Open browser DevTools -> Network.
3. Clear the Network list and disable Preserve Log for this check.
4. Hard-refresh `/admin/packaging-studio/`.
5. Wait for the Studio to finish loading.

Expected network behavior:

```text
GET /api/admin/packaging-bootstrap -> 200
```

Owner contract reads may also appear as normal.

The normal page load must **not** produce a physical network request to:

```text
/api/admin/packaging-studio
```

The editor may still emit that path internally as a compatibility trigger, but Build 295 must hold it until the modular bridge is active and the Build 286 bridge must convert it to the native Packaging bootstrap before network transport.

## Startup gate status

In the Packaging page console run:

```javascript
console.table(window.DDPackagingStartupGate?.getStatus?.());
```

Expected:

```text
build                              295
runtimeReady                       true
blockedLegacyRequests              0
legacyServerRouteContactedByGate   false
```

`delayedLegacyRequests` and `replayedLegacyRequests` may be `0` or greater depending on timing, but if `delayedLegacyRequests` is greater than zero, `replayedLegacyRequests` should match the requests successfully released through the modular transport.

## Modular runtime status

Run:

```javascript
const s = window.DDPackagingContracts?.getStatus?.();
console.table({
  runtime_build: s?.build,
  base_build: s?.baseBuild,
  legacy_get_guard_armed: s?.legacyGetGuardArmed,
  write_bridge_armed: s?.writeResponseBridgeArmed,
  blocked_legacy_get_count: s?.blockedLegacyGetCount,
  intercepted_write_count: s?.interceptedWriteCount
});
```

Expected before a save:

```text
runtime_build               290
base_build                  286
legacy_get_guard_armed      true
write_bridge_armed          true
blocked_legacy_get_count    0
```

## Active read provenance

Run:

```javascript
fetch('/api/admin/packaging-bootstrap', { credentials: 'include' })
  .then((r) => r.json())
  .then((x) => console.table({
    build: x.build,
    read_service_build: x.read_service_build,
    read_implementation_build: x.read_implementation_build,
    read_authority: x.read_authority,
    shared_read_service: x.shared_read_service,
    bulk_catalog_rows: x.module_boundary?.bulk_catalog_rows,
    bulk_inventory_rows: x.module_boundary?.bulk_inventory_rows
  }));
```

Expected:

```text
build                       286
read_service_build          293
read_implementation_build   286
read_authority              packaging-read-service
shared_read_service         true
bulk_catalog_rows           0
bulk_inventory_rows         0
```

## Normal save proof

Use a harmless Development Packaging project change and click the normal **Save** control.

Expected physical network write:

```text
POST /api/admin/packaging-write -> 200
```

There must be no physical normal-runtime POST to `/api/admin/packaging-studio`.

The successful write payload must retain the Build 292/291 boundary:

```text
write_boundary.gateway_build: 292
write_boundary.gateway_path: /api/admin/packaging-write
write_boundary.write_service_build: 291
write_boundary.write_authority: packaging-domain-service
write_boundary.shared_write_service: true
write_boundary.legacy_post_route_retired: true
```

After the save, the modular status should show `intercepted_write_count` increased by at least one and `last_write_boundary` populated.

## Retained direct retirement semantics

Build 295 does not remove the Build 294 server tombstone. Direct authenticated compatibility checks remain:

```text
GET /api/admin/packaging-studio  -> 410 packaging_legacy_get_retired (build 294)
POST /api/admin/packaging-studio -> 410 packaging_legacy_post_retired (build 292)
```

Unauthenticated direct requests remain HTTP 401.

## Completion gate

Build 295 is complete only when:

- local regression passes;
- normal Development Packaging startup produces no physical legacy GET;
- active read provenance remains 293 -> 286;
- normal Development save reaches only `/api/admin/packaging-write` and preserves 292 -> 291 write provenance;
- direct legacy GET/POST retirement semantics remain intact;
- Production is not contacted.

After Build 295 is proven, the next architectural step is to remove the mature editor's need to emit the legacy compatibility path at all by giving it a native client transport/facade. Physical deletion of the Build 294 tombstone should wait until that native client cutover is independently proven.
