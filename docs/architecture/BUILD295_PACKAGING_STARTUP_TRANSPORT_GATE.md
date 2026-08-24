# Build 295 — Packaging Startup Transport Gate

## Status

Development-only modular continuation after the Build 280 Production freeze.

Build 295 exists because Build 294 live Development validation exposed a browser startup race that local regression could not reproduce.

## Build 294 finding

Build 294 correctly retired server-side GET authority at `/api/admin/packaging-studio`:

- unauthenticated direct GET -> 401;
- authenticated direct GET -> 410 `packaging_legacy_get_retired`;
- active Packaging read authority remains `/api/admin/packaging-bootstrap` through Build 293 over the proven Build 286 implementation;
- Build 292 direct POST retirement remains intact;
- active Packaging writes remain `/api/admin/packaging-write` through Build 292 over the Build 291 domain service.

During normal Packaging page startup, however, the mature Build 277 editor can execute its `DOMContentLoaded` load before the dynamically imported Build 290 module runtime has finished verified-admin activation. The editor still uses `/api/admin/packaging-studio` as an internal compatibility trigger. If that trigger runs before the Build 288/286 read bridge is armed, the request physically reaches the retired Build 294 server route and correctly receives HTTP 410.

This is not a server-retirement defect. It is a client startup-order defect.

## Build 295 decision

Do not reopen the retired server route.

Do not edit or duplicate the mature 1,300-line Packaging editor merely to solve startup ordering.

Do not bypass owner read contracts by pointing the mature editor directly at `/api/admin/packaging-bootstrap`, because the Build 286 bridge still owns contractization of Catalog, Inventory and Content media into the response shape expected by the mature editor.

Instead, Build 295 introduces a very small startup transport gate loaded immediately before the mature editor.

## Startup gate behavior

`public/js/admin-packaging-startup-gate.js` wraps the current `DDAuth.apiFetch` before the Packaging editor is allowed to register its normal startup work.

For non-Packaging traffic it is transparent and calls the original authenticated transport unchanged.

For legacy-shaped Packaging GET/POST requests it:

1. holds the request locally;
2. waits for `dd:packaging-runtime-active`;
3. verifies the Packaging module reports both:
   - `legacyGetGuardArmed: true`;
   - `writeResponseBridgeArmed: true`;
4. replays the held request through the **current** `DDAuth.apiFetch`, which by then is the Build 289/286/288 modular wrapper stack;
5. therefore allows the existing bridges to translate the internal compatibility trigger to the native read/write server endpoints before any network request occurs.

If verified modular activation does not occur, the gate returns a synthetic local HTTP 503-style `Response` with `error_code: packaging_runtime_not_ready`. It does not fall through to the retired server route.

## Why replay through the current transport matters

The gate captures the pre-runtime authenticated transport only for unrelated requests and as the eventual innermost transport used by the modular wrappers.

It must not replay a held Packaging request through that captured pre-runtime transport, because doing so would recreate the Build 294 race and physically contact `/api/admin/packaging-studio`.

After activation, the gate resolves `auth.apiFetch` again and calls that current function. The expected wrapper order remains the proven Build 290 order:

```text
Build 289 write-response bridge
  -> Build 286 bootstrap bridge
    -> Build 288 legacy GET retirement guard
      -> Build 295 startup gate (non-legacy native request now passes through)
        -> original authenticated transport
```

For a normal GET compatibility trigger, Build 286 converts it to `/api/admin/packaging-bootstrap` and contractizes Catalog, Inventory and Content media through owner contracts.

For a normal POST compatibility trigger, Build 289 converts it to `/api/admin/packaging-write` and retains the Build 292 gateway / Build 291 service response boundary.

## Preserved authority

Build 295 does not change:

- the mature Packaging editor implementation;
- Build 290 runtime composition;
- Build 288 GET retirement guard;
- Build 286 owner-contract read composition;
- Build 289 write-response bridge;
- Build 293 read service/bootstrap;
- Build 291 domain write service;
- Build 292 native write gateway;
- Build 294 server GET tombstone or Build 292 POST tombstone.

The new gate is ordering protection only. It owns no Packaging business logic and no persisted data.

## Observability

The browser exposes:

```javascript
window.DDPackagingStartupGate.getStatus()
```

with:

- `build`;
- `runtimeReady`;
- `delayedLegacyRequests`;
- `replayedLegacyRequests`;
- `blockedLegacyRequests`;
- `legacyServerRouteContactedByGate`.

The final field is hard-coded false because the gate never intentionally forwards a legacy Packaging request through its captured pre-runtime transport.

## Development proof required

A hard refresh of `/admin/packaging-studio/` on Development must show:

- active native bootstrap traffic;
- no physical `/api/admin/packaging-studio` network request during normal startup;
- active 293 -> 286 read provenance;
- a normal save physically reaching `/api/admin/packaging-write` only;
- retained 292 -> 291 write provenance;
- direct authenticated legacy GET/POST checks still returning their explicit 410 tombstones.

Production remains frozen at Build 280.

## Next architecture step

Build 295 deliberately preserves the mature editor's internal compatibility trigger. That is now safe from the startup race, but it is still transitional architecture.

The next step should be a native Packaging client transport/facade that lets the mature editor request read and write operations without naming `/api/admin/packaging-studio` at all while preserving owner-contract composition and the current response shape.

Only after that native-client cutover is proven should the project evaluate physical deletion of `functions/api/admin/packaging-studio.js`.
