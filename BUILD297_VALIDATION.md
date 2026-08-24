# Build 297 Validation

## Purpose

Build 297 removes the remaining client-side physical fallback to the retired Packaging Studio GET endpoint. The critical live proof is that **initial load and later Refresh** both use `/api/admin/packaging-bootstrap` and never contact `/api/admin/packaging-studio`.

## Local regression

Run:

```bash
python scripts/build297_packaging_legacy_get_fallback_removal_test.py
```

Expected final lines:

```text
BUILD 297 PACKAGING LEGACY GET FALLBACK REMOVAL: PASS
No Cloudflare resource was contacted.
```

## Development deployment

Use only the `devilndove-site-dev` Pages project. Production must not be contacted.

## Live initial-load proof

1. Open Development Packaging Studio as an administrator.
2. DevTools -> Network.
3. Clear Network and disable Preserve Log.
4. Hard refresh.

Expected physical Packaging read:

```text
GET /api/admin/packaging-bootstrap -> 200
```

There must be no normal-runtime physical request to:

```text
/api/admin/packaging-studio
```

Run:

```javascript
const g = window.DDPackagingStartupGate?.getStatus?.();
const s = window.DDPackagingContracts?.getStatus?.();
const b = window.DDPackagingContracts?.getBootstrapStatus?.();
const n = window.DDPackagingContracts?.getNativeReadStatus?.();

console.table({
  gate_build: g?.build,
  runtime_ready: g?.runtimeReady,
  transport_facade_available: g?.transportFacadeAvailable,
  delayed_legacy_requests: g?.delayedLegacyRequests,
  replayed_legacy_requests: g?.replayedLegacyRequests,
  blocked_legacy_requests: g?.blockedLegacyRequests,
  last_wait_exit_reason: g?.lastWaitExitReason,
  last_replay_transport: g?.lastReplayTransport,
  gate_contacted_legacy_server: g?.legacyServerRouteContactedByGate,
  runtime_build: s?.build,
  client_transport_build: s?.clientTransportBuild,
  native_read_transport_build: s?.nativeReadTransportBuild,
  fallback_removal_build: s?.legacyGetFallbackRemovalBuild,
  client_transport_ready: s?.clientTransportReady,
  post_activation_transport_armed: s?.postActivationTransportArmed,
  legacy_get_fallback_removed: s?.legacyGetFallbackRemoved,
  legacy_server_get_reachable: s?.legacyServerGetReachable,
  write_bridge_armed: s?.writeResponseBridgeArmed,
  bootstrap_contractized: b?.contractized,
  bootstrap_source: b?.serverBootstrapSource,
  legacy_endpoint_bypassed: b?.legacyEndpointBypassed,
  native_read_request_count: n?.requestCount,
  native_read_last_status: n?.lastStatus
});
```

Expected important values:

```text
gate_build                       297
runtime_ready                    true
transport_facade_available       true
replayed_legacy_requests         1
blocked_legacy_requests          0
last_replay_transport            packaging-client-transport-v297
gate_contacted_legacy_server     false
client_transport_build           297
native_read_transport_build      297
fallback_removal_build           297
client_transport_ready           true
post_activation_transport_armed  true
legacy_get_fallback_removed      true
legacy_server_get_reachable      false
write_bridge_armed               true
bootstrap_contractized           true
bootstrap_source                 packaging-bootstrap
legacy_endpoint_bypassed         true
native_read_request_count        >= 1
native_read_last_status          200
```

## Refresh proof — blocking Build 297 gate

This is the regression that exposed the Build 296 defect.

1. Clear Network again after the initial load is complete.
2. Click the normal **Refresh** button in Packaging Studio.
3. Confirm Packaging projects reload.

Expected physical Packaging read:

```text
GET /api/admin/packaging-bootstrap -> 200
```

There must be **zero** physical GET requests to:

```text
/api/admin/packaging-studio
```

Then run:

```javascript
const s = window.DDPackagingContracts?.getStatus?.();
const b = window.DDPackagingContracts?.getBootstrapStatus?.();
const n = window.DDPackagingContracts?.getNativeReadStatus?.();
console.table({
  client_transport_build: s?.clientTransportBuild,
  post_activation_transport_armed: s?.postActivationTransportArmed,
  legacy_get_fallback_removed: s?.legacyGetFallbackRemoved,
  legacy_server_get_reachable: s?.legacyServerGetReachable,
  bootstrap_contractized: b?.contractized,
  bootstrap_source: b?.serverBootstrapSource,
  native_read_request_count: n?.requestCount,
  native_read_last_status: n?.lastStatus,
  native_read_last_error: n?.lastError
});
```

After Refresh, `native_read_request_count` should increase and `native_read_last_status` should remain 200.

## Write proof

Only after the Refresh proof passes, make one harmless Development change and click Save.

Expected physical write:

```text
POST /api/admin/packaging-write -> 200
```

No physical normal-runtime POST may reach `/api/admin/packaging-studio`.

Write provenance remains:

```text
gateway_build: 292
gateway_path: /api/admin/packaging-write
write_service_build: 291
write_authority: packaging-domain-service
shared_write_service: true
legacy_post_route_retired: true
```

## Direct retirement probes

Explicit authenticated probes remain valid tombstone tests only:

```text
GET /api/admin/packaging-studio  -> 410 packaging_legacy_get_retired
POST /api/admin/packaging-studio -> 410 packaging_legacy_post_retired
```

Those explicit probes must not be confused with normal runtime traffic.

## Completion gate

Build 297 is complete only when:

- local regression passes;
- Development deploys the final Build 297 head;
- initial load has no physical legacy GET;
- **Refresh reloads Packaging projects with no physical legacy GET**;
- native bootstrap remains contractized;
- normal Save uses `/api/admin/packaging-write` and preserves 292 -> 291 write provenance;
- Production remains untouched.
