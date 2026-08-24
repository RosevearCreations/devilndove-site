# Build 298 Validation

## Purpose

Build 298 cuts the mature Packaging editor over to a native browser client facade. After cutover, normal editor load, Refresh and Save no longer emit the retired Packaging Studio compatibility path internally.

## Apply the two-file activation cutover

From local `dev` after pulling the current staged Build 298 support commits:

```bash
python scripts/apply_build298_packaging_native_client_cutover.py
```

Expected:

```text
PASS: mature Packaging editor now uses DDPackagingClient without naming the retired route
PASS: Packaging page now loads Build 298 native client before the mature editor
No server, schema, binding, R2, or Production resource was contacted.
```

Inspect the surgical diff:

```bash
git diff -- public/js/admin-packaging-studio.js admin/packaging-studio/index.html
```

The editor diff must be limited to the Build 298 header plus the `api()` helper. The page diff must only add the Build 298 native client script and bump the editor cache key to `v=298`.

## Local regression

```bash
python scripts/build298_packaging_native_client_cutover_test.py
```

Expected final lines:

```text
BUILD 298 PACKAGING NATIVE CLIENT CUTOVER: PASS
No Cloudflare resource was contacted.
```

The regression proves:

- Build 298 JavaScript syntax;
- native client only names `/api/admin/packaging-bootstrap` and `/api/admin/packaging-write`;
- mature editor contains no `/api/admin/packaging-studio` literal;
- mature editor delegates Packaging requests to `DDPackagingClient.request()`;
- page order is Build 297 defense -> Build 298 native client -> mature editor;
- Build 297 completed parity is pinned historically;
- Build 297 runtime and server read/write authorities are unchanged;
- exact Build 298 changed-file boundary;
- no SQL/schema, Cloudflare binding/config, R2, or Production change.

## Commit and deploy to Development

After the regression passes:

```bash
git add \
  public/js/admin-packaging-studio.js \
  admin/packaging-studio/index.html

git commit -m "Build 298 activate native Packaging client cutover"
git push origin dev
```

Then verify only the Development Pages project:

```bash
npx --yes wrangler@latest pages deployment list \
  --project-name devilndove-site-dev | head -n 20
```

The newest source should be the activation commit you just pushed.

## Live initial-load proof

1. Open Development `/admin/packaging-studio/` as administrator.
2. DevTools -> Network.
3. Clear Network and disable Preserve Log.
4. Hard refresh.

Expected physical Packaging request:

```text
GET /api/admin/packaging-bootstrap -> 200
```

There must be no normal-runtime request to `/api/admin/packaging-studio`.

Run:

```javascript
(() => {
  const client = window.DDPackagingClient?.getStatus?.();
  const defense = window.DDPackagingStartupGate?.getStatus?.();
  const runtime = window.DDPackagingContracts?.getStatus?.();
  console.table({
    client_build: client?.build,
    client_state: client?.state,
    native_client: client?.nativeClient,
    owner_contracts_ready: client?.ownerContractsReady,
    native_bootstrap_path: client?.nativeBootstrapPath,
    native_write_path: client?.nativeWritePath,
    legacy_route_named_by_client: client?.legacyRouteNamedByClient,
    native_read_count: client?.readCount,
    native_read_status: client?.lastReadStatus,
    native_read_error: client?.lastReadError,
    build297_gate_replays: defense?.replayedLegacyRequests,
    build297_gate_blocks: defense?.blockedLegacyRequests,
    build297_client_transport_ready: runtime?.clientTransportReady
  });
})();
```

Expected important values:

```text
client_build                     298
client_state                     ready
native_client                    true
owner_contracts_ready            true
native_bootstrap_path            /api/admin/packaging-bootstrap
native_write_path                /api/admin/packaging-write
legacy_route_named_by_client     false
native_read_count                >= 1
native_read_status               200
native_read_error                ""
build297_gate_replays            0
build297_gate_blocks             0
build297_client_transport_ready  true
```

## Refresh proof

Clear Network and click **Refresh**.

Expected:

```text
GET /api/admin/packaging-bootstrap -> 200
```

Projects must reload and there must be zero `/api/admin/packaging-studio` network requests.

`DDPackagingClient.getStatus().readCount` must increase by one and `lastReadStatus` remain `200`.

## Native Save proof

Clear Network, make one harmless Development Packaging change, and click **Save project**.

Expected physical write:

```text
POST /api/admin/packaging-write -> 200
```

There must be zero normal-runtime POST requests to `/api/admin/packaging-studio`.

Run:

```javascript
(() => {
  const client = window.DDPackagingClient?.getStatus?.();
  const compatibilityWrite = window.DDPackagingContracts?.getWriteResponseStatus?.();
  const boundary = client?.lastWriteBoundary || {};
  console.table({
    client_build: client?.build,
    native_write_count: client?.writeCount,
    native_write_status: client?.lastWriteStatus,
    native_write_error: client?.lastWriteError,
    gateway_build: boundary?.gateway_build,
    gateway_path: boundary?.gateway_path,
    write_service_build: boundary?.write_service_build,
    write_authority: boundary?.write_authority,
    shared_write_service: boundary?.shared_write_service,
    legacy_post_route_retired: boundary?.legacy_post_route_retired,
    packaging_owned_response: boundary?.packaging_owned_response,
    compatibility_bridge_intercepts: compatibilityWrite?.interceptedWriteCount
  });
})();
```

Expected:

```text
client_build                    298
native_write_count              >= 1
native_write_status             200
native_write_error              ""
gateway_build                   292
gateway_path                    /api/admin/packaging-write
write_service_build             291
write_authority                 packaging-domain-service
shared_write_service            true
legacy_post_route_retired       true
packaging_owned_response        true
compatibility_bridge_intercepts 0
```

The final `0` is intentional in Build 298: the mature editor now calls the native write endpoint directly, so the Build 289 compatibility bridge remains armed as defense-in-depth but is idle for normal Build 298 saves.

## Direct retirement probes

Explicit authenticated probes remain tombstone tests only:

```text
GET /api/admin/packaging-studio  -> 410 packaging_legacy_get_retired
POST /api/admin/packaging-studio -> 410 packaging_legacy_post_retired
```

## Completion gate

Build 298 is complete only when local regression passes, Development deploys the activation commit, normal load/Refresh/Save use only native endpoints, native read composition remains healthy, native write provenance remains `292 -> 291`, Build 297 compatibility counters stay idle for normal editor traffic, direct tombstones remain 410, and Production is not contacted.
