# Build 296 Validation

## Purpose

Build 296 replaces Build 295's indirect `DDAuth.apiFetch` wrapper-ownership inference with an explicit Packaging client transport facade. It preserves the mature editor, native server endpoints, read/write services, and retirement tombstones.

## Local regression

Run from Development `dev`:

```bash
python scripts/build296_packaging_explicit_client_transport_test.py
```

Expected final lines:

```text
BUILD 296 PACKAGING EXPLICIT CLIENT TRANSPORT: PASS
No Cloudflare resource was contacted.
```

The regression proves:

- current JavaScript syntax is valid;
- Build 286 exposes an explicit bootstrap transport handle without changing its build/read authority;
- Build 289 exposes an explicit write transport handle without changing its gateway;
- Build 290 exposes `transportLegacyRequest()` and reports Build 296 client transport readiness;
- compatibility GET routes explicitly to Build 286;
- compatibility POST routes explicitly to Build 289;
- the Build 296 browser adapter calls the explicit facade and does not inspect current `DDAuth.apiFetch` wrapper ownership;
- gate -> admin runtime -> mature editor ordering and cache-busting are correct;
- Build 295 historical regression is pinned;
- the mature editor and server read/write authorities are unchanged;
- no SQL/schema, Cloudflare binding/config, R2, or Production change occurred.

## Development deployment

Use only the `devilndove-site-dev` Pages project. Production must not be contacted.

## Live startup proof

1. Open `/admin/packaging-studio/` on Development as an administrator.
2. Open DevTools -> Network.
3. Clear the Network list and disable Preserve Log.
4. Hard-refresh the page.
5. Wait for the Packaging Studio to load.

Expected physical network read:

```text
GET /api/admin/packaging-bootstrap -> 200
```

Normal startup must not issue a physical request to:

```text
/api/admin/packaging-studio
```

Run:

```javascript
const g = window.DDPackagingStartupGate?.getStatus?.();
const s = window.DDPackagingContracts?.getStatus?.();
const b = window.DDPackagingContracts?.getBootstrapStatus?.();

console.table({
  adapter_build: g?.build,
  runtime_ready: g?.runtimeReady,
  transport_facade_available: g?.transportFacadeAvailable,
  delayed_legacy_requests: g?.delayedLegacyRequests,
  replayed_legacy_requests: g?.replayedLegacyRequests,
  blocked_legacy_requests: g?.blockedLegacyRequests,
  last_wait_exit_reason: g?.lastWaitExitReason,
  last_replay_transport: g?.lastReplayTransport,
  adapter_contacted_legacy_server: g?.legacyServerRouteContactedByGate,
  runtime_build: s?.build,
  client_transport_build: s?.clientTransportBuild,
  client_transport_ready: s?.clientTransportReady,
  legacy_get_guard_armed: s?.legacyGetGuardArmed,
  write_bridge_armed: s?.writeResponseBridgeArmed,
  retirement_guard_blocks: s?.blockedLegacyGetCount,
  bootstrap_contractized: b?.contractized,
  bootstrap_source: b?.serverBootstrapSource,
  legacy_endpoint_bypassed: b?.legacyEndpointBypassed
});
```

Expected:

```text
adapter_build                    296
runtime_ready                    true
transport_facade_available       true
delayed_legacy_requests          1
replayed_legacy_requests         1
blocked_legacy_requests          0
last_replay_transport            packaging-client-transport-facade
adapter_contacted_legacy_server  false
runtime_build                    290
client_transport_build           296
client_transport_ready           true
legacy_get_guard_armed           true
write_bridge_armed               true
retirement_guard_blocks          0
bootstrap_contractized           true
bootstrap_source                 packaging-bootstrap
legacy_endpoint_bypassed         true
```

`last_wait_exit_reason` may be `runtime-active`, `microtask-runtime-ready`, `already-ready`, or `runtime-ready-after-degraded-auth`.

## Active read provenance

Direct authenticated GET `/api/admin/packaging-bootstrap` must still report:

```text
build: 286
read_service_build: 293
read_implementation_build: 286
read_authority: packaging-read-service
shared_read_service: true
module_boundary.bulk_catalog_rows: 0
module_boundary.bulk_inventory_rows: 0
```

## Normal save proof

Use one harmless Development Packaging project change and click the normal Save control.

Expected physical network write:

```text
POST /api/admin/packaging-write -> 200
```

No physical normal-runtime POST may reach `/api/admin/packaging-studio`.

Expected response boundary:

```text
write_boundary.gateway_build: 292
write_boundary.gateway_path: /api/admin/packaging-write
write_boundary.write_service_build: 291
write_boundary.write_authority: packaging-domain-service
write_boundary.shared_write_service: true
write_boundary.legacy_post_route_retired: true
```

After save, `DDPackagingContracts.getStatus()` must show `interceptedWriteCount >= 1` and `lastWriteBoundary` populated.

## Retained direct retirement checks

Authenticated direct compatibility probes remain:

```text
GET /api/admin/packaging-studio  -> 410 packaging_legacy_get_retired (Build 294)
POST /api/admin/packaging-studio -> 410 packaging_legacy_post_retired (Build 292)
```

Unauthenticated direct probes remain HTTP 401.

## Completion gate

Build 296 is complete only when local regression passes, Development startup uses the explicit client transport with no physical legacy request, active read provenance remains 293 -> 286, normal save preserves 292 -> 291 write provenance, direct retirement semantics remain intact, and Production is not contacted.
