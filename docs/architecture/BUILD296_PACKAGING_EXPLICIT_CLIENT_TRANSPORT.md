# Build 296 — Packaging Explicit Client Transport

## Why Build 296 exists

Build 295 proved an important safety property: the retired `/api/admin/packaging-studio` route could be prevented from receiving normal startup traffic. Live Development testing also exposed a deeper design flaw: the Build 295 gate tried to discover the active modular transport by inspecting the mutable `DDAuth.apiFetch` property. The Build 286/288/289 bridge objects could correctly report themselves armed while another wrapper still occupied that public property. Status and callable transport could therefore diverge.

Build 296 removes that inference.

## Architecture

Build 296 keeps all proven server and domain authorities intact and adds explicit callable client transport handles:

- Build 286 `index.mjs` exposes `transportBootstrapRequest(input, init)`, which invokes the already-created Build 286 bootstrap bridge directly.
- Build 289 `write-response.mjs` exposes `transport(input, init)`, which invokes the already-created Build 289 write bridge directly.
- Build 290 `runtime.mjs` exposes `transportLegacyRequest(input, init)` on `window.DDPackagingContracts` and routes:
  - compatibility GET -> Build 286 bootstrap bridge;
  - compatibility POST -> Build 289 write bridge.
- Build 296 browser adapter waits for the runtime to report `clientTransportReady: true`, then calls `DDPackagingContracts.transportLegacyRequest()` directly.

The adapter no longer tries to determine which function currently owns `DDAuth.apiFetch`.

## Authority boundaries preserved

Build 296 does not move data/domain authority:

- native read entry: `/api/admin/packaging-bootstrap`;
- server read service provenance: Build 293;
- proven read implementation: Build 286;
- owner Catalog/Inventory/Content contracts remain outside Packaging bulk server reads;
- browser write bridge remains Build 289;
- native write gateway remains Build 292;
- domain write service remains Build 291;
- authenticated retired legacy GET remains Build 294 HTTP 410;
- authenticated retired legacy POST remains Build 292 HTTP 410.

## Runtime behavior

Normal mature-editor compatibility traffic is now:

```text
mature editor compatibility GET
  -> Build 296 browser adapter
  -> DDPackagingContracts.transportLegacyRequest()
  -> Build 286 bootstrap bridge
  -> /api/admin/packaging-bootstrap
  -> owner read contracts

mature editor compatibility POST
  -> Build 296 browser adapter
  -> DDPackagingContracts.transportLegacyRequest()
  -> Build 289 write bridge
  -> /api/admin/packaging-write
  -> Build 291 domain write service
```

The retired `/api/admin/packaging-studio` path remains an internal compatibility identifier only. No normal physical network GET or POST should reach it.

## Failure behavior

If the modular client transport does not become ready, Build 296 returns a local synthetic HTTP 503 with `packaging_client_transport_not_ready`. It does not contact the retired server route.

Temporary degraded authentication does not terminate the wait. Explicit auth rejection does.

## Scope exclusions

Build 296 does not change:

- D1 schema or migrations;
- Cloudflare bindings/configuration;
- R2 behavior;
- mature Packaging editor source;
- Packaging server read/write endpoint source;
- Packaging domain read/write services;
- Production.

## Next architectural step

After Development proves Build 296 startup and normal save behavior, replace the mature editor's internal compatibility-path naming with a native client API so the browser no longer needs the retired path even as an internal identifier. Only after that cutover is independently proven should physical deletion of the Build 294 tombstone be considered.
